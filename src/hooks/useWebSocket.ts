'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Deployment, LogEntry, DeploymentParams, SocketEvents } from '@/lib/types';

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
      setDeployments(data);
    });

    socket.on('deployment:started', (data: { id: string; project: string; environment: string; organization: string }) => {
      const newDeployment: Deployment = {
        ...data,
        host: '', // Will be updated with actual host
        status: 'running',
        startTime: new Date(),
        logs: []
      };
      setDeployments(prev => [...prev, newDeployment]);
    });

    socket.on('deployment:log', (data: { id: string; type: 'info' | 'error' | 'warning'; message: string; timestamp: Date }) => {
      setDeployments(prev => prev.map(dep => 
        dep.id === data.id 
          ? { 
              ...dep, 
              logs: [...dep.logs, {
                type: data.type,
                message: data.message,
                timestamp: new Date(data.timestamp)
              }] 
            }
          : dep
      ));
    });

    socket.on('deployment:completed', (data: { id: string; status: 'success' | 'failed'; duration: number }) => {
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

    socket.on('deployment:stopped', (data: { id: string }) => {
      setDeployments(prev => prev.map(dep => 
        dep.id === data.id 
          ? { ...dep, status: 'stopped' as const }
          : dep
      ));
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