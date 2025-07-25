import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

interface DeploymentData {
  project: string;
  environment: string;
  organization: string;
  host: string;
}

interface LogEntry {
  type: 'info' | 'error' | 'warning';
  message: string;
  timestamp: Date;
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

io.on('connection', (socket) => {
  console.log('📱 Client connected:', socket.id);
  
  // Send current deployments status
  socket.emit('deployments:status', Array.from(activeDeployments.values()));

  socket.on('deploy:start', (data: DeploymentData) => {
    const { project, environment, organization, host } = data;
    const deploymentId = `${project}-${environment}-${Date.now()}`;
    
    // Store deployment info
    const deployment: ActiveDeployment = {
      id: deploymentId,
      project,
      environment,
      organization,
      host,
      status: 'running',
      startTime: new Date(),
      logs: []
    };
    
    activeDeployments.set(deploymentId, deployment);

    // Broadcast deployment started
    io.emit('deployment:started', {
      id: deploymentId,
      project,
      environment,
      organization
    });

    // Execute deployment script
    executeDeployment(deploymentId, data, socket);
  });

  socket.on('deployment:stop', (deploymentId: string) => {
    const deployment = activeDeployments.get(deploymentId);
    if (deployment && deployment.process) {
      deployment.process.kill('SIGTERM');
      deployment.status = 'stopped';
      io.emit('deployment:stopped', { id: deploymentId });
    }
  });

  socket.on('disconnect', () => {
    console.log('📱 Client disconnected:', socket.id);
  });
});

function executeDeployment(deploymentId: string, data: DeploymentData, socket: any): void {
  const { project, environment, organization, host } = data;
  const deployment = activeDeployments.get(deploymentId);
  
  if (!deployment) return;
  
  // Build script path based on project
  const scriptPath = `./scripts/${project}/deploy.sh`;
  
  const args = [
    `--env=${environment}`,
    `--app_name=g-agency`,
    `--repo_name=${project}`,
    `--org=${organization}`,
    `--host=${host}`
  ];

  // Spawn deployment process
  const process = spawn('bash', [scriptPath, ...args], {
    cwd: path.join(__dirname, '..'),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  deployment.process = process;

  // Handle stdout
  process.stdout?.on('data', (data: Buffer) => {
    const log = data.toString();
    const logEntry: LogEntry = {
      type: 'info',
      message: log,
      timestamp: new Date()
    };
    
    deployment.logs.push(logEntry);
    
    // Emit to all clients
    io.emit('deployment:log', {
      id: deploymentId,
      ...logEntry
    });
  });

  // Handle stderr
  process.stderr?.on('data', (data: Buffer) => {
    const log = data.toString();
    const logEntry: LogEntry = {
      type: 'error',
      message: log,
      timestamp: new Date()
    };
    
    deployment.logs.push(logEntry);
    
    io.emit('deployment:log', {
      id: deploymentId,
      ...logEntry
    });
  });

  // Handle process completion
  process.on('close', (code: number | null) => {
    deployment.status = code === 0 ? 'success' : 'failed';
    deployment.endTime = new Date();
    deployment.process = undefined;
    
    io.emit('deployment:completed', {
      id: deploymentId,
      status: deployment.status,
      duration: deployment.endTime.getTime() - deployment.startTime.getTime()
    });

    // Clean up old deployments after 1 hour
    setTimeout(() => {
      activeDeployments.delete(deploymentId);
    }, 3600000);
  });

  process.on('error', (error: Error) => {
    console.error('Deployment process error:', error);
    deployment.status = 'failed';
    deployment.endTime = new Date();
    
    const logEntry: LogEntry = {
      type: 'error',
      message: `Process error: ${error.message}`,
      timestamp: new Date()
    };
    
    deployment.logs.push(logEntry);
    
    io.emit('deployment:log', {
      id: deploymentId,
      ...logEntry
    });
    
    io.emit('deployment:completed', {
      id: deploymentId,
      status: 'failed',
      duration: deployment.endTime.getTime() - deployment.startTime.getTime()
    });
  });
}

const PORT = process.env.WEBSOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
});