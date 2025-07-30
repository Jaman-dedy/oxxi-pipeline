'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Deployment, LogEntry, DeploymentParams } from '@/lib/types';

interface UseWebSocketReturn {
  connected: boolean;
  deployments: Deployment[];
  startDeployment: (params: DeploymentParams) => void;
  stopDeployment: (deploymentId: string) => void;
  clearDeployments: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [connected, setConnected] = useState<boolean>(false);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket: Socket = io(
      process.env.NODE_ENV === 'production' 
        ? 'wss://your-domain.com' 
        : 'http://localhost:3001'
    );

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('🔌 Connected to deployment server');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('🔌 Disconnected from deployment server');
    });

    socket.on('deployments:status', (data: Deployment[]) => {
      console.log('📊 Received deployments status:', data);
      setDeployments(data);
    });

    socket.on('deployment:started', (data: any) => {
      console.log('🚀 Deployment started event:', data);
      const newDeployment: Deployment = {
        id: data.id,
        project: data.project,
        environment: data.environment,
        organization: data.organization,
        host: data.host || '',
        status: 'running',
        startTime: new Date(data.startTime || new Date()),
        logs: data.logs || []
      };
      
      setDeployments(prev => {
        console.log('📝 Adding deployment to state. Previous:', prev.length);
        const updated = [...prev, newDeployment];
        console.log('📝 New state will have:', updated.length, 'deployments');
        return updated;
      });
    });

    socket.on('deployment:log', (data: any) => {
      console.log('📝 Received log event:', data);
      
      setDeployments(prev => {
        const updated = prev.map(dep => 
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
        console.log('📝 Updated deployment logs. Deployment found:', prev.some(d => d.id === data.id));
        return updated;
      });
    });

    socket.on('deployment:completed', (data: any) => {
      console.log('✅ Deployment completed event:', data);
      
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
      console.log('🛑 Deployment stopped event:', data);
      
      setDeployments(prev => prev.map(dep => 
        dep.id === data.id 
          ? { ...dep, status: 'stopped' as const }
          : dep
      ));
    });

    // Add a catch-all event listener to see what events are being received
    socket.onAny((eventName, ...args) => {
      console.log('🎭 WebSocket event received:', eventName, args);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const startDeployment = useCallback((params: DeploymentParams): void => {
    console.log('🚀 Starting deployment via WebSocket:', params);
    if (socketRef.current) {
      socketRef.current.emit('deploy:start', params);
    }
  }, []);

  const stopDeployment = useCallback((deploymentId: string): void => {
    if (socketRef.current) {
      socketRef.current.emit('deployment:stop', deploymentId);
    }
  }, []);

  const clearDeployments = useCallback((): void => {
    setDeployments([]);
  }, []);

  return {
    connected,
    deployments,
    startDeployment,
    stopDeployment,
    clearDeployments
  };
}