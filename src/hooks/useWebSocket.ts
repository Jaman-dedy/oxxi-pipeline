'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Deployment, DeploymentParams, CommandData, ProjectConfig } from '@/lib/types';

interface UseWebSocketReturn {
  connected: boolean;
  deployments: Deployment[];
  projects: ProjectConfig[];
  loadingProjects: boolean;
  startDeployment: (params: DeploymentParams) => void;
  startCommand: (command: CommandData) => void;
  stopDeployment: (deploymentId: string) => void;
  resumeDeployment: (deploymentId: string) => void;
  clearDeployments: () => void;
  executeProjectAction: (projectName: string, action: 'deploy' | 'restart' | 'stop', environment: 'staging' | 'production') => Promise<string>;
  executeCustomCommand: (projectName: string, commandKey: string, variables?: Record<string, string>) => Promise<string>;
  refreshProjects: () => Promise<void>;
  getActiveOperations: (projectName: string, environment: string) => Deployment[];
}

export function useWebSocket(): UseWebSocketReturn {
  const [connected, setConnected] = useState<boolean>(false);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const socketRef = useRef<Socket | null>(null);
  const hasLoadedRef = useRef<boolean>(false);

  // Load projects from API
  const loadProjects = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && hasLoadedRef.current && projects.length > 0) {
      return;
    }

    try {
      setLoadingProjects(true);
      
      const response = await fetch('/api/projects', {
        cache: forceRefresh ? 'no-cache' : 'default'
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
        hasLoadedRef.current = true;

      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [projects.length]);

  // Initialize projects on mount
  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadProjects(false);
    }
  }, [loadProjects]);

  // WebSocket setup
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    const socket: Socket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setConnected(false);
    });

    // Legacy deployment events
    socket.on('deployments:status', (data: Deployment[]) => {
      setDeployments(data);
    });

    socket.on('deployment:started', (data: any) => {
      const newDeployment: Deployment = {
        id: data.id,
        project: data.project,
        environment: data.environment,
        organization: data.organization,
        host: data.host || '',
        status: 'running',
        startTime: new Date(data.startTime || new Date()),
        logs: data.logs || [],
        name: data.name || 'Deployment'
      };
      
      setDeployments(prev => {
        const existingIndex = prev.findIndex(d => d.id === data.id);
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            status: 'running',
            logs: data.logs || updated[existingIndex].logs
          };
          return updated;
        } else {
          return [...prev, newDeployment];
        }
      });
    });

    socket.on('deployment:log', (data: any) => {
      setDeployments(prev => {
        return prev.map(dep => 
          dep.id === data.id 
            ? { 
                ...dep, 
                logs: [...dep.logs, {
                  type: data.type,
                  message: data.message,
                  timestamp: new Date(data.timestamp),
                  step: data.step
                }] 
              }
            : dep
        );
      });
    });

    socket.on('deployment:completed', (data: any) => {
      setDeployments(prev => prev.map(dep => 
        dep.id === data.id 
          ? { 
              ...dep, 
              status: data.status, 
              endTime: new Date(),
              duration: data.duration
            }
          : dep
      ));
    });

    socket.on('deployment:stopped', (data: any) => {
      setDeployments(prev => prev.map(dep => 
        dep.id === data.id 
          ? { ...dep, status: 'stopped' as const, endTime: new Date() }
          : dep
      ));
    });

    // Enhanced command events for project actions
    socket.on('command:started', (data: any) => {
      const newDeployment: Deployment = {
        id: data.id,
        project: data.project || 'unknown',
        environment: data.environment || 'unknown',
        organization: data.organization || 'manual',
        host: data.host || 'localhost',
        status: 'running',
        startTime: new Date(data.startTime || new Date()),
        logs: data.logs || [],
        name: data.name || data.command || 'Command'
      };
      
      setDeployments(prev => {
        // Remove any existing operation for same project/environment/action
        const filtered = prev.filter(d => 
          !(d.project === newDeployment.project && 
            d.environment === newDeployment.environment && 
            d.name === newDeployment.name &&
            d.status === 'running')
        );
        return [...filtered, newDeployment];
      });
    });

    socket.on('command:log', (data: any) => {
      setDeployments(prev => {
        return prev.map(dep => 
          dep.id === data.id 
            ? { 
                ...dep, 
                logs: [...dep.logs, {
                  type: data.type,
                  message: data.message,
                  timestamp: new Date(data.timestamp),
                  step: data.step
                }],
                currentStep: data.step || dep.currentStep
              }
            : dep
        );
      });
    });

    socket.on('command:completed', (data: any) => {
      setDeployments(prev => prev.map(dep => 
        dep.id === data.id 
          ? { 
              ...dep, 
              status: data.status === 'success' ? 'success' : 'failed', 
              endTime: new Date(),
              duration: data.duration
            }
          : dep
      ));
    });

    socket.on('command:stopped', (data: any) => {
      setDeployments(prev => prev.map(dep => 
        dep.id === data.id 
          ? { 
              ...dep, 
              status: 'stopped' as const, 
              endTime: new Date() 
            }
          : dep
      ));
    });

    // Enhanced error handling
    socket.on('deployment:error', (data: any) => {
      console.error('Deployment error:', data);
      setDeployments(prev => prev.map(dep => 
        dep.id === data.id 
          ? { 
              ...dep, 
              status: 'failed', 
              endTime: new Date() 
            }
          : dep
      ));
    });

    socket.on('command:error', (data: any) => {
      console.error('Command error:', data);
      // Handle command-specific errors if needed
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const startDeployment = useCallback((params: DeploymentParams): void => {
    if (socketRef.current) {
      socketRef.current.emit('deploy:start', params);
    }
  }, []);

  const stopDeployment = useCallback((deploymentId: string): void => {
    if (socketRef.current) {
      socketRef.current.emit('deployment:stop', deploymentId);
    }
  }, []);

  const resumeDeployment = useCallback((deploymentId: string): void => {
    if (socketRef.current) {
      socketRef.current.emit('deployment:resume', deploymentId);
    }
  }, []);

  const clearDeployments = useCallback((): void => {
    setDeployments([]);
  }, []);

  const startCommand = useCallback((command: CommandData): void => {
    if (socketRef.current) {
      socketRef.current.emit('command:start', command);
    }
  }, []);

  // Enhanced project action execution with better error handling
  const executeProjectAction = useCallback(async (
    projectName: string, 
    action: 'deploy' | 'restart' | 'stop', 
    environment: 'staging' | 'production'
  ): Promise<string> => {
    try {
      const response = await fetch(`/api/projects/${projectName}/actions/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ environment })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} ${projectName}`);
      }

      const result = await response.json();
      
      console.log(`✅ ${action} ${projectName} ${environment} initiated:`, result.commandId);
      
      // Return the command ID for tracking
      return result.commandId || result.id || `${projectName}-${action}-${Date.now()}`;
    } catch (error) {
      console.error(`Failed to ${action} ${projectName}:`, error);
      throw error;
    }
  }, []);

  // NEW: Execute custom project commands
  const executeCustomCommand = useCallback(async (
    projectName: string, 
    commandKey: string, 
    variables?: Record<string, string>
  ): Promise<string> => {
    try {
      const response = await fetch(`/api/projects/${projectName}/commands/${commandKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variables })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to execute ${commandKey} for ${projectName}`);
      }

      const result = await response.json();
      
      console.log(`✅ ${commandKey} for ${projectName} initiated:`, result.commandId);
      
      return result.commandId || `${projectName}-${commandKey}-${Date.now()}`;
    } catch (error) {
      console.error(`Failed to execute ${commandKey} for ${projectName}:`, error);
      throw error;
    }
  }, []);

  // Force refresh projects from API
  const refreshProjects = useCallback(async (): Promise<void> => {
    hasLoadedRef.current = false;
    await loadProjects(true);
  }, [loadProjects]);

  // Get active operations for a specific project and environment
  const getActiveOperations = useCallback((projectName: string, environment: string): Deployment[] => {
    return deployments.filter(d => 
      d.project === projectName && 
      d.environment === environment && 
      d.status === 'running'
    );
  }, [deployments]);

  return {
    connected,
    deployments,
    projects,
    loadingProjects,
    startDeployment,
    stopDeployment,
    resumeDeployment,
    clearDeployments,
    startCommand,
    executeProjectAction,
    executeCustomCommand, // NEW: Support for custom commands
    refreshProjects,
    getActiveOperations
  };
}