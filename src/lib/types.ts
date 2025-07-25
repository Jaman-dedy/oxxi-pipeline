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
  }
  
  export type DeploymentStatus = 'running' | 'success' | 'failed' | 'stopped';
  
  export interface LogEntry {
    type: 'info' | 'error' | 'warning';
    message: string;
    timestamp: Date;
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
    'deployment:stop': (deploymentId: string) => void;
    
    // Server to Client
    'deployments:status': (deployments: Deployment[]) => void;
    'deployment:started': (data: { id: string; project: string; environment: string; organization: string }) => void;
    'deployment:log': (data: { id: string; type: 'info' | 'error' | 'warning'; message: string; timestamp: Date }) => void;
    'deployment:completed': (data: { id: string; status: DeploymentStatus; duration: number }) => void;
    'deployment:stopped': (data: { id: string }) => void;
  }
  
  export const PROJECTS: Project[] = [
    {
      name: 'back-office',
      displayName: 'Back Office',
      description: 'Administrative dashboard and management tools',
      environments: [
        { name: 'staging', host: '4.180.244.99', organization: 'agb', color: 'orange' },
        { name: 'production', host: '4.180.244.99', organization: 'agb', color: 'green' }
      ]
    },
    {
      name: 'cashpoint',
      displayName: 'Cashpoint',
      description: 'Point of sale and transaction processing',
      environments: [
        { name: 'staging', host: '4.180.244.99', organization: 'agb', color: 'orange' },
        { name: 'production', host: '4.180.244.99', organization: 'agb', color: 'green' }
      ]
    },
    {
      name: 'cashpoint-v2',
      displayName: 'Cashpoint V2',
      description: 'Next generation cashpoint system',
      environments: [
        { name: 'staging', host: '4.180.244.99', organization: 'agb', color: 'orange' },
        { name: 'production', host: '4.180.244.99', organization: 'agb', color: 'green' }
      ]
    },
    {
      name: 'file-services',
      displayName: 'File Services',
      description: 'Document and file management system',
      environments: [
        { name: 'staging', host: '4.180.244.99', organization: 'agb', color: 'orange' },
        { name: 'production', host: '4.180.244.99', organization: 'agb', color: 'green' }
      ]
    },
    {
      name: 'gateways-v1',
      displayName: 'Gateways V1',
      description: 'API gateway and routing services',
      environments: [
        { name: 'staging', host: '4.180.244.99', organization: 'agb', color: 'orange' },
        { name: 'production', host: '4.180.244.99', organization: 'agb', color: 'green' }
      ]
    },
    {
      name: 'gateways-v2',
      displayName: 'Gateways V2',
      description: 'Enhanced API gateway with advanced features',
      environments: [
        { name: 'staging', host: '4.180.244.99', organization: 'agb', color: 'orange' },
        { name: 'production', host: '4.180.244.99', organization: 'agb', color: 'green' }
      ]
    },
    {
      name: 'ossix-website',
      displayName: 'Ossix Website',
      description: 'Corporate website and marketing pages',
      environments: [
        { name: 'staging', host: '4.180.244.99', organization: 'agb', color: 'orange' },
        { name: 'production', host: '4.180.244.99', organization: 'agb', color: 'green' }
      ]
    },
    {
      name: 'real-time-services',
      displayName: 'Real-time Services',
      description: 'WebSocket and real-time communication services',
      environments: [
        { name: 'staging', host: '4.180.244.99', organization: 'agb', color: 'orange' },
        { name: 'production', host: '4.180.244.99', organization: 'agb', color: 'green' }
      ]
    },
    {
      name: 'web-app',
      displayName: 'Web App',
      description: 'Main web application interface',
      environments: [
        { name: 'staging', host: '4.180.244.99', organization: 'agb', color: 'orange' },
        { name: 'production', host: '4.180.244.99', organization: 'agb', color: 'green' }
      ]
    },
    {
      name: 'yes-website',
      displayName: 'YES Website',
      description: 'YES brand website and customer portal',
      environments: [
        { name: 'staging', host: '4.180.244.99', organization: 'agb', color: 'orange' },
        { name: 'production', host: '4.180.244.99', organization: 'agb', color: 'green' }
      ]
    }
  ];