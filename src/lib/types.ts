export interface Project {
  name: string;
  displayName: string;
  environments: Environment[];
  description?: string;
  icon?: string;
}

export interface CommandData {
  name: string;
  command: string;
  workingDirectory: string;
  timeout?: number;
  project?: string;
  environment?: string;
}

export interface Environment {
  name: string;
  host: string;
  organization: string;
  color: 'orange' | 'green' | 'blue' | 'purple' | 'red';
  port?: number;
  url?: string;
  deployCommand?: string;
  restartCommand?: string;
  stopCommand?: string;
}

export interface ProjectConfig {
  name: string;
  displayName: string;
  description: string;
  
  production_url?: string;
  staging_url?: string;
  
  deploy_production: string;
  deploy_staging: string;
  restart_production: string;
  restart_staging: string;
  stop_production: string;
  stop_staging: string;
  
  // Optional metadata
  repository?: string;
  organization?: string;
  host?: string;
  workingDirectory?: string;
  ssh?: boolean;
}

export type ProjectAction = 'deploy' | 'restart' | 'stop';
export type EnvironmentName = 'staging' | 'production';

export interface Deployment {
  id: string;
  project: string;
  environment: string;
  organization: string;
  host: string;
  status: DeploymentStatus;
  startTime: Date;
  endTime?: Date;
  logs: LogEntry[];
  duration?: number;
  currentStep?: string;
  name?: string;
}

export type DeploymentStatus = 'running' | 'success' | 'failed' | 'stopped' | 'interrupted';

export interface LogEntry {
  type: 'info' | 'error' | 'warning' | 'success' | 'progress' | 'level';
  message: string;
  timestamp: Date;
  step?: string;
  level?: string;
}

export interface DeploymentParams {
  project: string;
  environment: string;
  organization: string;
  host: string;
}

export interface SocketEvents {
  // Client to Server
  'deploy:start': (params: DeploymentParams) => void;
  'command:start': (command: CommandData) => void; // ← Add new command events!
  'deployment:stop': (deploymentId: string) => void;
  'command:stop': (commandId: string) => void; // ← Add command stop!
  
  // Server to Client
  'deployments:status': (deployments: Deployment[]) => void;
  'commands:status': (commands: Deployment[]) => void; // ← Add commands status!
  'deployment:started': (data: { id: string; project: string; environment: string; organization: string }) => void;
  'command:started': (data: { id: string; name: string; command: string; workingDirectory: string }) => void; // ← Add command started!
  'deployment:log': (data: { id: string; type: LogEntry['type']; message: string; timestamp: Date; step?: string }) => void;
  'command:log': (data: { id: string; type: LogEntry['type']; message: string; timestamp: Date; step?: string }) => void; // ← Add command log!
  'deployment:completed': (data: { id: string; status: DeploymentStatus; duration: number }) => void;
  'command:completed': (data: { id: string; status: DeploymentStatus; duration: number }) => void; // ← Add command completed!
  'deployment:stopped': (data: { id: string }) => void;
  'command:stopped': (data: { id: string }) => void; // ← Add command stopped!
  'command:error': (data: { message: string; command: string }) => void; // ← Add error handling!
}