// types/index.ts - Complete backend types

// ===== CORE COMMAND TYPES =====

export interface CommandData {
  name: string;              // Display name: "Deploy Cashpoint Staging"
  command: string;           // Actual command: "bash deploy.sh --env=staging"
  workingDirectory: string;  // Where to run: "/path/to/scripts"
  environment?: string;      // Optional: "staging", "production", etc.
  project?: string;          // Optional: "cashpoint-v2"
  timeout?: number;          // Optional: max execution time in ms
}

// Keep backward compatibility
export interface DeploymentData extends CommandData {
  organization: string;
  host: string;
}

export interface ActiveCommand {
  id: string;
  name?: string;
  command?: string;
  workingDirectory?: string;
  environment?: string;
  project?: string;
  status: 'running' | 'success' | 'failed' | 'stopped' | 'interrupted';
  startTime: Date;
  endTime?: Date;
  logs: LogEntry[];
  process?: any;
  currentStep?: string;
  organization?: string;
  host?: string;
}

// ===== PROJECT CONFIGURATION TYPES =====

export interface ProjectConfig {
  name: string;
  displayName: string;
  description: string;
  
  // Environment URLs for preview
  production_url?: string;
  staging_url?: string;
  
  // Commands for each environment
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

// ===== FRONTEND COMPATIBILITY TYPES =====

export interface Project {
  name: string;
  displayName: string;
  environments: Environment[];
  description?: string;
  icon?: string;
}

export interface Environment {
  name: string;
  host: string;
  organization: string;
  color: 'orange' | 'green' | 'blue' | 'purple' | 'red';
  port?: number;
  // NEW: Add URL for preview links
  url?: string;
  // NEW: Add action commands
  deployCommand?: string;
  restartCommand?: string;
  stopCommand?: string;
}

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
}

// ===== ACTION AND STATUS TYPES =====

export type ProjectAction = 'deploy' | 'restart' | 'stop';
export type EnvironmentName = 'staging' | 'production';
export type DeploymentStatus = 'running' | 'success' | 'failed' | 'stopped' | 'interrupted';

// ===== EVENT HANDLING TYPES =====

export interface CommandEvents {
  onLog: (commandId: string, log: LogEntry) => void;
  onStarted: (command: ActiveCommand) => void;
  onCompleted: (commandId: string, status: 'success' | 'failed', duration: number) => void;
  onStopped: (commandId: string) => void;
}

export interface LogEntry {
  type: 'info' | 'error' | 'warning' | 'success' | 'progress' | 'level';
  message: string;
  timestamp: Date;
  step?: string;
  level?: string;
}

// ===== BACKWARD COMPATIBILITY ALIASES =====

// Rename for clarity but keep backward compatibility
export type ActiveDeployment = ActiveCommand;
export type DeploymentEvents = CommandEvents;

// ===== WEBSOCKET TYPES =====

export interface DeploymentParams {
  project: string;
  environment: string;
  organization: string;
  host: string;
}

export interface SocketEvents {
  // Client to Server
  'deploy:start': (params: DeploymentParams) => void;
  'command:start': (command: CommandData) => void;
  'deployment:stop': (deploymentId: string) => void;
  'command:stop': (commandId: string) => void;
  'command:resume': (commandId: string) => void;
  'deployment:resume': (deploymentId: string) => void;
  
  // Server to Client
  'deployments:status': (deployments: Deployment[]) => void;
  'commands:status': (commands: Deployment[]) => void;
  'deployment:started': (data: { id: string; project: string; environment: string; organization: string }) => void;
  'command:started': (data: { id: string; name: string; command: string; workingDirectory: string }) => void;
  'deployment:log': (data: { id: string; type: LogEntry['type']; message: string; timestamp: Date; step?: string }) => void;
  'command:log': (data: { id: string; type: LogEntry['type']; message: string; timestamp: Date; step?: string }) => void;
  'deployment:completed': (data: { id: string; status: DeploymentStatus; duration: number }) => void;
  'command:completed': (data: { id: string; status: DeploymentStatus; duration: number }) => void;
  'deployment:stopped': (data: { id: string }) => void;
  'command:stopped': (data: { id: string }) => void;
  'command:error': (data: { message: string; command: string }) => void;
  'deployment:error': (data: { message: string; deploymentId: string }) => void;
}

// ===== API REQUEST/RESPONSE TYPES =====

export interface ProjectActionRequest {
  environment: EnvironmentName;
}

export interface ProjectActionResponse {
  message: string;
  commandId: string;
  action: ProjectAction;
  environment: EnvironmentName;
  project: string;
  command: string;
}

export interface ProjectListResponse {
  projects: ProjectConfig[];
  totalProjects: number;
}

export interface CommandValidationRequest {
  command: string;
}

export interface CommandValidationResponse {
  command: string;
  safe: boolean;
  reason?: string;
  analysis: {
    baseCommand: string;
    hasChaining: boolean;
    hasPipes: boolean;
    complexity: 'simple' | 'complex';
  };
}

// ===== SEARCH AND FILTERING TYPES =====

export interface LogSearchFilters {
  query?: string;
  startDate?: string;
  endDate?: string;
  project?: string;
  environment?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface LogSearchResponse {
  results: any[];
  totalCount: number;
  hasMore: boolean;
  filters: LogSearchFilters;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface DeploymentStats {
  totalDeployments: number;
  successRate: number;
  failureRate: number;
  avgDuration: number;
  projectStats: Record<string, {
    total: number;
    successful: number;
    failed: number;
    stopped: number;
    interrupted: number;
  }>;
  environmentStats: Record<string, {
    total: number;
    successful: number;
    failed: number;
    stopped: number;
    interrupted: number;
  }>;
  dailyStats: Record<string, {
    total: number;
    successful: number;
    failed: number;
    stopped: number;
  }>;
}

// ===== TEMPLATE AND QUICK COMMAND TYPES =====

export interface QuickCommand {
  name: string;
  command: string;
  workingDirectory: string;
  category?: 'system' | 'git' | 'project' | 'development';
}

export interface CommandTemplate {
  name: string;
  command: string;
  description: string;
  category: string;
  workingDirectory: string;
}

// ===== FILE SYSTEM TYPES =====

export interface CommandMetadata {
  id: string;
  name: string;
  command: string;
  workingDirectory: string;
  project?: string;
  environment?: string;
  status: DeploymentStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  currentStep?: string;
}

export interface HistoricalCommandData {
  logs: LogEntry[];
  metadata: CommandMetadata;
}

// ===== HEALTH CHECK TYPES =====

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  activeCommands: number;
  uptime: number;
  timestamp: string;
  version: string;
}

// ===== ERROR TYPES =====

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
  timestamp?: string;
}

export interface ValidationError extends ApiError {
  field?: string;
  value?: any;
}