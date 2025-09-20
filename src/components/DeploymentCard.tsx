'use client';
import React, { JSX } from 'react';
import { motion } from 'framer-motion';
import { 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Timer,
  AlertCircle,
  Activity
} from 'lucide-react';
import { Deployment } from '@/lib/types';

interface DeploymentCardProps {
  deployment: Deployment;
  onStop: () => void;
  onViewLogs: () => void;
}

export function DeploymentCard({ deployment, onStop, onViewLogs }: DeploymentCardProps): JSX.Element {
  

  const getStatusIcon = (): JSX.Element => {
    switch (deployment.status) {
      case 'running':
        return <Clock className="h-4 w-4 text-orange-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'interrupted':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'stopped':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (): string => {
    switch (deployment.status) {
      case 'running':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20';
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'interrupted':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'failed':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'stopped':
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
    }
  };

  const getProgressColor = (): string => {
    switch (deployment.status) {
      case 'running':
        return 'bg-orange-500';
      case 'success':
        return 'bg-green-500';
      case 'interrupted':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      case 'stopped':
        return 'bg-gray-500';
    }
  };

  const formatDuration = (): string => {
    const start = new Date(deployment.startTime);
    const end = deployment.endTime ? new Date(deployment.endTime) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getLastLogPreview = (): string => {
    if (deployment.logs.length === 0) return 'No logs yet...';
    const lastLog = deployment.logs[deployment.logs.length - 1];
    return lastLog.message.trim().substring(0, 100) + (lastLog.message.length > 100 ? '...' : '');
  };

  const getLogCounts = () => {
    return {
      total: deployment.logs.length,
      errors: deployment.logs.filter(log => log.type === 'error').length,
      warnings: deployment.logs.filter(log => log.type === 'warning').length
    };
  };

  const logCounts = getLogCounts();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-lg border-2 p-4 transition-all hover:shadow-md ${getStatusColor()}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {deployment.project}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {deployment.environment} • {deployment.organization} • {deployment.host}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="flex items-center space-x-1 text-sm text-slate-600 dark:text-slate-400">
              <Timer className="h-3 w-3" />
              <span>{formatDuration()}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              {new Date(deployment.startTime).toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onViewLogs}
              className="p-2 rounded-md bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 transition-colors"
              title="View logs"
            >
              <Eye className="h-4 w-4" />
            </button>
            
            {deployment.status === 'running' && (
              <button
                onClick={onStop}
                className="p-2 rounded-md bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-600 dark:text-red-400 transition-colors"
                title="Stop deployment"
              >
                <Square className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {deployment.status === 'running' && (
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <motion.div
              className={`h-1.5 rounded-full ${getProgressColor()}`}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      )}

      {/* Log Stats */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center space-x-4">
          <span className="text-slate-600 dark:text-slate-400">
            {logCounts.total} logs
          </span>
          {logCounts.errors > 0 && (
            <span className="text-red-600 font-medium">
              {logCounts.errors} errors
            </span>
          )}
          {logCounts.warnings > 0 && (
            <span className="text-yellow-600 font-medium">
              {logCounts.warnings} warnings
            </span>
          )}
        </div>
        {deployment.status === 'running' && (
          <div className="flex items-center space-x-1 text-slate-500">
            <Activity className="h-3 w-3 animate-pulse" />
            <span>Live</span>
          </div>
        )}
      </div>
      
      {/* Log Preview */}
      {deployment.logs.length > 0 && (
        <div className="p-3 bg-slate-900 rounded-md">
          <div className="text-xs font-mono text-green-400">
            <div className="opacity-75 mb-1">Latest:</div>
            <div className="truncate">
              {getLastLogPreview()}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}