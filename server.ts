import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

interface DeploymentData {
  project: string;
  environment: string;
  organization: string;
  host: string;
}

interface LogEntry {
  type: 'info' | 'error' | 'warning' | 'success' | 'progress';
  message: string;
  timestamp: Date;
  step?: string;
}

interface ActiveDeployment {
  id: string;
  project: string;
  environment: string;
  organization: string;
  host: string;
  status: 'running' | 'success' | 'failed' | 'stopped';
  startTime: Date;
  endTime?: Date;
  logs: LogEntry[];
  process?: ChildProcess;
  currentStep?: string;
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "*",
    credentials: true
  }
});

app.use(express.json());

// Store active deployments
const activeDeployments = new Map<string, ActiveDeployment>();

// Log parsing helpers
function parseLogType(message: string): 'info' | 'error' | 'warning' | 'success' | 'progress' {
  const msg = message.toLowerCase();
  
  if (msg.includes('error') || msg.includes('failed') || msg.includes('fatal')) {
    return 'error';
  }
  if (msg.includes('warning') || msg.includes('warn') || msg.includes('vulnerabilities')) {
    return 'warning';
  }
  if (msg.includes('✓') || msg.includes('completed successfully') || msg.includes('done deploying')) {
    return 'success';
  }
  if (msg.includes('%') || msg.includes('progress') || msg.includes('installing') || msg.includes('building')) {
    return 'progress';
  }
  
  return 'info';
}

function detectDeploymentStep(message: string): string | undefined {
  const msg = message.toLowerCase();
  
  if (msg.includes('git') && (msg.includes('clone') || msg.includes('pull'))) {
    return 'Git Operations';
  }
  if (msg.includes('npm i') || msg.includes('installing')) {
    return 'Installing Dependencies';
  }
  if (msg.includes('build') || msg.includes('building')) {
    return 'Building Application';
  }
  if (msg.includes('pm2') || msg.includes('starting')) {
    return 'Starting Services';
  }
  if (msg.includes('ssh') || msg.includes('connecting')) {
    return 'Server Connection';
  }
  if (msg.includes('env') && msg.includes('variables')) {
    return 'Environment Setup';
  }
  
  return undefined;
}

io.on('connection', (socket) => {
  console.log('🎯 Client connected:', socket.id);
  
  // Send current deployments status
  socket.emit('deployments:status', Array.from(activeDeployments.values()));

  socket.on('deploy:start', (data: DeploymentData) => {
    console.log('🚀 Starting deployment:', data);
    
    const { project, environment, organization, host } = data;
    const deploymentId = `${project}-${environment}-${Date.now()}`;
    
    // Create deployment record
    const deployment: ActiveDeployment = {
      id: deploymentId,
      project,
      environment,
      organization,
      host,
      status: 'running',
      startTime: new Date(),
      logs: [],
      currentStep: 'Initializing'
    };
    
    activeDeployments.set(deploymentId, deployment);

    // Emit deployment started
    io.emit('deployment:started', {
      id: deploymentId,
      project,
      environment,
      organization,
      host,
      status: 'running',
      startTime: deployment.startTime,
      logs: []
    });

    // Execute the actual deployment
    executeRealDeployment(deploymentId, data);
  });

  socket.on('deployment:stop', (deploymentId: string) => {
    console.log('🛑 Stopping deployment:', deploymentId);
    const deployment = activeDeployments.get(deploymentId);
    if (deployment && deployment.process) {
      deployment.process.kill('SIGTERM');
      deployment.status = 'stopped';
      deployment.endTime = new Date();
      
      const logEntry: LogEntry = {
        type: 'warning',
        message: '🛑 Deployment stopped by user',
        timestamp: new Date(),
        step: 'Stopped'
      };
      
      deployment.logs.push(logEntry);
      io.emit('deployment:log', { id: deploymentId, ...logEntry });
      io.emit('deployment:stopped', { id: deploymentId });
    }
  });

  socket.on('disconnect', () => {
    console.log('📱 Client disconnected:', socket.id);
  });
});

function executeRealDeployment(deploymentId: string, data: DeploymentData): void {
  const { project, environment, organization, host } = data;
  const deployment = activeDeployments.get(deploymentId);
  
  if (!deployment) return;

  // For now, let's focus on individual environment deployment
  // We can use the deploy.sh script instead of deploy-all.sh for more control
  const SCRIPTS_BASE = process.env.SCRIPTS_PATH || '../ossix-devops/scripts';
  const scriptPath = `${SCRIPTS_BASE}/${project}/deploy.sh`;
  
  // Check if script exists
  if (!fs.existsSync(scriptPath)) {
    const errorLog: LogEntry = {
      type: 'error',
      message: `❌ Deployment script not found: ${scriptPath}`,
      timestamp: new Date(),
      step: 'Error'
    };
    
    deployment.logs.push(errorLog);
    deployment.status = 'failed';
    deployment.endTime = new Date();
    
    io.emit('deployment:log', { id: deploymentId, ...errorLog });
    io.emit('deployment:completed', {
      id: deploymentId,
      status: 'failed',
      duration: deployment.endTime.getTime() - deployment.startTime.getTime()
    });
    return;
  }

  // Build deployment arguments
  const args = [
    `--env=${environment}`,
    `--app_name=g-agency`,
    `--repo_name=${project}`,
    `--org=${organization}`,
    `--host=${host}`
  ];

  console.log(`🔥 Executing: bash ${scriptPath} ${args.join(' ')}`);

  // Add initial log
  const startLog: LogEntry = {
    type: 'info',
    message: `🚀 Starting deployment of ${project} to ${environment} environment`,
    timestamp: new Date(),
    step: 'Starting'
  };
  
  deployment.logs.push(startLog);
  io.emit('deployment:log', { id: deploymentId, ...startLog });

  // Spawn the deployment process
  const deployProcess = spawn('bash', [scriptPath, ...args], {
    cwd: path.resolve('.'),
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env }
  });

  deployment.process = deployProcess;

  // Handle stdout (main output)
  deployProcess.stdout?.on('data', (data: Buffer) => {
    const output = data.toString();
    const lines = output.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      if (line.trim()) {
        const logType = parseLogType(line);
        const step = detectDeploymentStep(line) || deployment.currentStep;
        
        if (step && step !== deployment.currentStep) {
          deployment.currentStep = step;
          
          // Emit step change
          const stepLog: LogEntry = {
            type: 'info',
            message: `📋 ${step}...`,
            timestamp: new Date(),
            step
          };
          
          deployment.logs.push(stepLog);
          io.emit('deployment:log', { id: deploymentId, ...stepLog });
        }

        const logEntry: LogEntry = {
          type: logType,
          message: line,
          timestamp: new Date(),
          step: deployment.currentStep
        };

        deployment.logs.push(logEntry);
        io.emit('deployment:log', { id: deploymentId, ...logEntry });
      }
    });
  });

  // Handle stderr (errors and warnings)
  deployProcess.stderr?.on('data', (data: Buffer) => {
    const output = data.toString();
    const lines = output.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      if (line.trim()) {
        const logEntry: LogEntry = {
          type: 'error',
          message: line,
          timestamp: new Date(),
          step: deployment.currentStep || 'Error'
        };

        deployment.logs.push(logEntry);
        io.emit('deployment:log', { id: deploymentId, ...logEntry });
      }
    });
  });

  // Handle process completion
  deployProcess.on('close', (code: number | null) => {
    const success = code === 0;
    deployment.status = success ? 'success' : 'failed';
    deployment.endTime = new Date();
    deployment.process = undefined;

    const completionLog: LogEntry = {
      type: success ? 'success' : 'error',
      message: success 
        ? `✅ Deployment completed successfully! (exit code: ${code})` 
        : `❌ Deployment failed with exit code: ${code}`,
      timestamp: new Date(),
      step: success ? 'Completed' : 'Failed'
    };

    deployment.logs.push(completionLog);
    io.emit('deployment:log', { id: deploymentId, ...completionLog });
    
    io.emit('deployment:completed', {
      id: deploymentId,
      status: deployment.status,
      duration: deployment.endTime.getTime() - deployment.startTime.getTime()
    });

    console.log(`🏁 Deployment ${deploymentId} ${success ? 'completed' : 'failed'}`);

    // Clean up after 1 hour
    setTimeout(() => {
      activeDeployments.delete(deploymentId);
      console.log(`🧹 Cleaned up deployment ${deploymentId}`);
    }, 3600000);
  });

  // Handle process errors
  deployProcess.on('error', (error: Error) => {
    console.error('💥 Process error:', error);
    
    deployment.status = 'failed';
    deployment.endTime = new Date();
    
    const errorLog: LogEntry = {
      type: 'error',
      message: `💥 Process error: ${error.message}`,
      timestamp: new Date(),
      step: 'Error'
    };
    
    deployment.logs.push(errorLog);
    io.emit('deployment:log', { id: deploymentId, ...errorLog });
    
    io.emit('deployment:completed', {
      id: deploymentId,
      status: 'failed',
      duration: deployment.endTime.getTime() - deployment.startTime.getTime()
    });
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeDeployments: activeDeployments.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Get deployment history
app.get('/api/deployments', (req, res) => {
  res.json(Array.from(activeDeployments.values()));
});

const PORT = process.env.WEBSOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Ossix Pipeline Server running on port ${PORT}`);
  console.log(`📡 Ready to deploy your projects!`);
});