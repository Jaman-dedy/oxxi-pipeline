import fs from 'fs';
import { DeploymentData, ActiveDeployment, LogEntry, DeploymentEvents } from '../types';
import { PathHelpers } from '../utils/pathHelpers';
import { ProcessService } from './ProcessService';
import { LogParsingService } from './LogParsingService';

export class DeploymentService {
  private activeDeployments = new Map<string, ActiveDeployment>();
  private events: DeploymentEvents;

  constructor(events: DeploymentEvents) {
    this.events = events;
  }

  generateDeploymentId(project: string, environment: string): string {
    return `${project}-${environment}-${Date.now()}`;
  }

  getActiveDeployments(): ActiveDeployment[] {
    return Array.from(this.activeDeployments.values());
  }

  getDeployment(deploymentId: string): ActiveDeployment | undefined {
    return this.activeDeployments.get(deploymentId);
  }

  async startDeployment(data: DeploymentData): Promise<string> {
    const { project, environment, organization, host } = data;
    const deploymentId = this.generateDeploymentId(project as any, environment as any);

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
    
    this.activeDeployments.set(deploymentId, deployment);

    // Emit deployment started
    this.events.onStarted(deployment);

    // Execute the deployment
    this.executeDeployment(deploymentId, data);

    return deploymentId;
  }

  stopDeployment(deploymentId: string): boolean {
    const deployment = this.activeDeployments.get(deploymentId);
    
    if (deployment && deployment.process) {
      deployment.process.kill('SIGTERM');
      deployment.status = 'stopped';
      deployment.endTime = new Date();
      
      const logEntry = LogParsingService.createLogEntry(
        'warning',
        '🛑 Deployment stopped by user',
        'Stopped'
      );
      
      deployment.logs.push(logEntry);
      this.events.onLog(deploymentId, logEntry);
      this.events.onStopped(deploymentId);
      
      return true;
    }
    
    return false;
  }

  private executeDeployment(deploymentId: string, data: DeploymentData): void {
    const { project, environment, organization, host } = data;
    const deployment = this.activeDeployments.get(deploymentId);
    
    if (!deployment) return;

    const isDeployAll = environment === "all";
    const { scriptPath, fullScriptPath, workingDirectory } = PathHelpers.getDeploymentScriptPath(project as any, isDeployAll);
    
    let args: string[] = [];

    if (isDeployAll) {
    } else {
      args = [
        `--env=${environment}`,
        `--app_name=g-agency`,
        `--repo_name=${project}`,
        `--org=${organization}`,
        `--host=${host}`
      ];
    }
    
    // Check if script exists
    if (!fs.existsSync(fullScriptPath)) {
      this.handleDeploymentError(
        deploymentId,
        new Error(`Deployment script not found: ${fullScriptPath}`)
      );
      return;
    }

    // Add initial log
    const startLog = LogParsingService.createLogEntry(
      'info',
      isDeployAll 
        ? `🚀 Starting deployment of ${project} to ALL environments (staging + production)`
        : `🚀 Starting deployment of ${project} to ${environment} environment`,
      'Starting'
    );
    
    deployment.logs.push(startLog);
    this.events.onLog(deploymentId, startLog);

    // Spawn the deployment process
    const deployProcess = ProcessService.spawnDeploymentProcess({
      scriptPath,
      args,
      workingDirectory,
      onLog: (log: LogEntry) => {
        deployment.logs.push(log);
        deployment.currentStep = log.step || deployment.currentStep;
        this.events.onLog(deploymentId, log);
      },
      onComplete: (success: boolean, code: number | null) => {
        this.handleDeploymentComplete(deploymentId, success, code);
      },
      onError: (error: Error) => {
        this.handleDeploymentError(deploymentId, error);
      }
    });

    deployment.process = deployProcess;
  }

  private handleDeploymentComplete(deploymentId: string, success: boolean, code: number | null): void {
    const deployment = this.activeDeployments.get(deploymentId);
    if (!deployment) return;

    deployment.status = success ? 'success' : 'failed';
    deployment.endTime = new Date();
    deployment.process = undefined;

    const completionLog = LogParsingService.createLogEntry(
      success ? 'success' : 'error',
      success 
        ? `✅ Deployment completed successfully! (exit code: ${code})` 
        : `❌ Deployment failed with exit code: ${code}`,
      success ? 'Completed' : 'Failed'
    );

    deployment.logs.push(completionLog);
    this.events.onLog(deploymentId, completionLog);
    
    const duration = deployment.endTime.getTime() - deployment.startTime.getTime();
    this.events.onCompleted(deploymentId, deployment.status, duration);

    // Clean up after 1 hour
    setTimeout(() => {
      this.activeDeployments.delete(deploymentId);
    }, 3600000);
  }

  private handleDeploymentError(deploymentId: string, error: Error): void {
    const deployment = this.activeDeployments.get(deploymentId);
    if (!deployment) return;

    console.error('💥 Process error:', error);
    
    deployment.status = 'failed';
    deployment.endTime = new Date();
    
    const errorLog = LogParsingService.createLogEntry(
      'error',
      `💥 Process error: ${error.message}`,
      'Error'
    );
    
    deployment.logs.push(errorLog);
    this.events.onLog(deploymentId, errorLog);
    
    const duration = deployment.endTime.getTime() - deployment.startTime.getTime();
    this.events.onCompleted(deploymentId, 'failed', duration);
  }
}