// server/services/WebSocketService.ts
import { Server, Socket } from 'socket.io';
import { CommandService } from './CommandService';
import { ProjectConfigService } from './ProjectConfigService';
import { CommandData, DeploymentData, LogEntry, ActiveCommand } from '../types';
import { ProcessService } from './ProcessService';
import { LogFileService } from './LogFileService';
import { CommandRecoveryService } from './CommandRecoveryService';

export class WebSocketService {
  private io: Server;
  private commandService: CommandService;

  constructor(io: Server) {
    this.io = io;
    
    // Initialize command service with event handlers
    this.commandService = new CommandService({
      onLog: this.handleCommandLog.bind(this),
      onStarted: this.handleCommandStarted.bind(this),
      onCompleted: this.handleCommandCompleted.bind(this),
      onStopped: this.handleCommandStopped.bind(this)
    });

    this.initializeCommandRecovery();
    this.setupSocketHandlers();
  }

  private async initializeCommandRecovery(): Promise<void> {
    try {
      
      const stats = await CommandRecoveryService.getRecoveryStats();
      
      const incompleteCommands = await CommandRecoveryService.restoreIncompleteCommands();
      
      incompleteCommands.forEach(cmd => {
        this.commandService.addHistoricalCommand(cmd);
      });
      
    } catch (error) {
      console.error('❌ Command recovery failed:', error);
    }
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      
      // Send ALL commands (active + historical) to newly connected clients
      const allCommands = this.commandService.getAllCommands();
      const deploymentsFormat = allCommands.map(cmd => ({
        id: cmd.id,
        project: cmd.project || 'global',
        environment: cmd.environment || 'command',
        organization: 'manual',
        host: 'localhost', 
        status: cmd.status,
        startTime: cmd.startTime,
        endTime: cmd.endTime,
        logs: cmd.logs,
        duration: cmd.endTime ? cmd.endTime.getTime() - cmd.startTime.getTime() : undefined,
        name: cmd.name
      }));
      
      socket.emit('deployments:status', deploymentsFormat);
      
      // Generic command handler
      socket.on('command:start', (data: CommandData) => {
        this.handleGenericCommand(data);
      });
  
      // Legacy deployment handler - now uses JSON configs
      socket.on('deploy:start', (data: DeploymentData) => {
        this.handleDeploymentCommand(data);
      });

      socket.on('command:resume', async (commandId: string) => {
        try {
          await this.commandService.resumeCommand(commandId);
        } catch (error) {
          socket.emit('command:error', {
            message: error instanceof Error ? error.message : 'Failed to resume command',
            commandId
          });
        }
      });

      socket.on('deployment:resume', async (deploymentId: string) => {
        try {
          await this.commandService.resumeCommand(deploymentId);
        } catch (error) {
          socket.emit('deployment:error', {
            message: error instanceof Error ? error.message : 'Failed to resume deployment',
            deploymentId
          });
        }
      });
  
      socket.on('command:stop', (commandId: string) => {
        this.commandService.stopCommand(commandId);
      });
  
      socket.on('deployment:stop', (deploymentId: string) => {
        this.commandService.stopCommand(deploymentId);
      });
  
      socket.on('disconnect', () => {
        console.log('📱 Client disconnected:', socket.id);
      });
    });
  }

  private async handleGenericCommand(data: CommandData): Promise<void> {
    
    try {
      // Security check
      const safety = ProcessService.isCommandSafe(data.command);
      if (!safety.safe) {
        console.error('❌ Command rejected:', safety.reason);
        this.io.emit('command:error', {
          message: `Command rejected: ${safety.reason}`,
          command: data.command
        });
        return;
      }
  
      await this.commandService.startCommand(data);
    } catch (error) {
      console.error('💥 Error in handleGenericCommand:', error);
      this.io.emit('command:error', {
        message: error instanceof Error ? error.message : 'Unknown error',
        command: data.command
      });
    }
  }

  // COMPLETELY REFACTORED - No more hardcoded paths or assumptions
  private async handleDeploymentCommand(data: DeploymentData): Promise<void> {
    const { project, environment, organization, host } = data;
    
    try {
      
      // Load latest project configurations
      await ProjectConfigService.loadAllProjects();
      
      let commandData: CommandData;

      if (environment === "all") {
        // Handle "deploy all" - check if project has this command in JSON
        const projectConfig = ProjectConfigService.getProject(project || '');
        if (!projectConfig) {
          throw new Error(`Project ${project} not found in configurations`);
        }
        
        // Try to find deploy_all command in JSON config
        if (ProjectConfigService.hasCommand(project || '', 'deploy_all')) {
          const { command, workingDirectory } = await ProjectConfigService.executeProjectCommand(
            project || '',
            'deploy_all'
          );
          
          commandData = {
            name: `Deploy ${project} - All Environments`,
            command, // Use exact command from JSON
            workingDirectory,
            project,
            environment
          };
        } else {
          // No deploy_all command configured
          throw new Error(`No 'deploy_all' command configured for project ${project}. Please add it to the JSON config.`);
        }
      } else if (environment === "test") {
        // Test command
        commandData = {
          name: `Test Command - ${project}`,
          command: 'ls -la && echo "Test deployment completed" && sleep 2',
          workingDirectory: process.cwd(),
          project,
          environment
        };
      } else {
        // Individual environment deployment - use JSON config command
        const { command, workingDirectory } = await ProjectConfigService.executeProjectAction(
          project || '',
          'deploy',
          environment as 'staging' | 'production'
        );

        commandData = {
          name: `Deploy ${project} - ${environment}`,
          command, // Execute EXACTLY what's in the JSON - could be anything
          workingDirectory,
          project,
          environment
        };
      }

      // Execute the command
      await this.handleGenericCommand(commandData);
      
    } catch (error) {
      console.error(`❌ Failed to handle deployment command:`, error);
      this.io.emit('deployment:error', {
        message: error instanceof Error ? error.message : 'Deployment failed',
        project,
        environment
      });
    }
  }

  private handleCommandLog(commandId: string, log: LogEntry): void {
    // Write to file for persistence
    const command = this.commandService.getCommand(commandId);
    if (command) {
      LogFileService.writeLogEntry(command, log);
    }
    
    // Emit to connected clients (real-time)
    this.io.emit('command:log', { id: commandId, ...log });
    // Backward compatibility
    this.io.emit('deployment:log', { id: commandId, ...log });
  }

  private handleCommandStarted(command: ActiveCommand): void {
    this.io.emit('command:started', {
      id: command.id,
      name: command.name,
      command: command.command,
      workingDirectory: command.workingDirectory,
      project: command.project,
      environment: command.environment,
      status: command.status,
      startTime: command.startTime,
      logs: command.logs
    });
    
    // Backward compatibility for frontend
    this.io.emit('deployment:started', {
      id: command.id,
      project: command.project || 'manual-command',
      environment: command.environment || 'command',
      organization: 'manual',
      host: 'localhost',
      status: command.status,
      startTime: command.startTime,
      logs: command.logs,
      name: command.name
    });
  }

  private handleCommandCompleted(commandId: string, status: 'success' | 'failed', duration: number): void {
    this.io.emit('command:completed', { id: commandId, status, duration });
    // Backward compatibility
    this.io.emit('deployment:completed', { id: commandId, status, duration });
  }

  private handleCommandStopped(commandId: string): void {
    this.io.emit('command:stopped', { id: commandId });
    // Backward compatibility
    this.io.emit('deployment:stopped', { id: commandId });
  }

  getCommandService(): CommandService {
    return this.commandService;
  }

  // Backward compatibility
  getDeploymentService(): CommandService {
    return this.commandService;
  }
}