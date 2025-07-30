'use client';
import React, { useState, useEffect, useRef, JSX } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft,
  Square,
  Download,
  Maximize2,
  Minimize2,
  Terminal,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Search,
  Filter,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { PROJECTS, LogEntry } from '@/lib/types';

interface LiveDeploymentViewerProps {
  projectSlug: string;
  deploymentId: string;
}

export function LiveDeploymentViewer({ projectSlug, deploymentId }: LiveDeploymentViewerProps): JSX.Element {
  const { deployments, stopDeployment } = useWebSocket();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'error' | 'warning' | 'success' | 'progress'>('all');
  const [isPaused, setIsPaused] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const deployment = deployments.find(d => d.id === deploymentId);
  const project = PROJECTS.find(p => p.name === projectSlug);

  useEffect(() => {
    if (autoScroll && !isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [deployment?.logs, autoScroll, isPaused]);

  if (!deployment || !project) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Terminal className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Deployment Not Found</h1>
          <p className="text-slate-400 mb-6">The deployment you're looking for doesn't exist or has been removed.</p>
          <Link 
            href={`/projects/${projectSlug}`}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-ossix-600 text-white hover:bg-ossix-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {project?.displayName || 'Project'}
          </Link>
        </div>
      </div>
    );
  }

  const filteredLogs = React.useMemo(() => {
    let logs = deployment.logs;
    
    if (logFilter !== 'all') {
      logs = logs.filter(log => log.type === logFilter);
    }

    if (searchTerm) {
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return logs;
  }, [deployment.logs, logFilter, searchTerm]);

  const getLogIcon = (type: LogEntry['type']): JSX.Element => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-yellow-400 flex-shrink-0" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />;
      case 'progress':
        return <Clock className="h-3 w-3 text-blue-400 flex-shrink-0 animate-spin" />;
      case 'info':
      default:
        return <div className="w-3 h-3 bg-slate-500 rounded-full flex-shrink-0" />;
    }
  };

  const getLogTypeColor = (type: LogEntry['type']): string => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'success':
        return 'text-green-400';
      case 'progress':
        return 'text-blue-400';
      case 'info':
      default:
        return 'text-slate-300';
    }
  };

  const formatMessage = (message: string): string => {
    return message
      .replace(/✓/g, '✅')
      .replace(/×/g, '❌')
      .replace(/→/g, '➜')
      .replace(/\[(\d+%)\]/g, '🔄 $1');
  };

  const downloadLogs = (): void => {
    const logsText = deployment.logs
      .map(log => `[${log.timestamp.toLocaleString()}] ${log.type.toUpperCase()}: ${log.message}`)
      .join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ossix-pipeline-${deployment.project}-${deployment.environment}-${deployment.id}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyLogsToClipboard = async (): Promise<void> => {
    const logsText = filteredLogs
      .map(log => `[${log.timestamp.toLocaleTimeString()}] ${log.type.toUpperCase()}: ${log.message.trim()}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(logsText);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy logs:', err);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getFilterButtonClass = (filterType: typeof logFilter): string => {
    const baseClass = "px-3 py-1 rounded-md text-xs font-medium transition-colors";
    const isActive = logFilter === filterType;
    
    if (isActive) {
      switch (filterType) {
        case 'error':
          return `${baseClass} bg-red-900/50 text-red-300 border border-red-700`;
        case 'warning':
          return `${baseClass} bg-yellow-900/50 text-yellow-300 border border-yellow-700`;
        case 'success':
          return `${baseClass} bg-green-900/50 text-green-300 border border-green-700`;
        case 'progress':
          return `${baseClass} bg-blue-900/50 text-blue-300 border border-blue-700`;
        case 'info':
          return `${baseClass} bg-slate-700 text-slate-300 border border-slate-600`;
        default:
          return `${baseClass} bg-ossix-900/50 text-ossix-300 border border-ossix-700`;
      }
    }
    
    return `${baseClass} bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700`;
  };

  const formatDuration = (): string => {
    const start = new Date(deployment.startTime);
    const end = deployment.endTime ? new Date(deployment.endTime) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href={`/projects/${projectSlug}`}
              className="p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ossix-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Terminal className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {deployment.project} → {deployment.environment}
                </h1>
                <div className="flex items-center space-x-3 text-sm text-slate-400">
                  <span>Started {new Date(deployment.startTime).toLocaleString()}</span>
                  <span>•</span>
                  <span>Duration: {formatDuration()}</span>
                  <span>•</span>
                  <span className={`font-medium ${
                    deployment.status === 'running' ? 'text-orange-400' :
                    deployment.status === 'success' ? 'text-green-400' :
                    deployment.status === 'failed' ? 'text-red-400' :
                    'text-slate-400'
                  }`}>
                    {deployment.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {deployment.status === 'running' && (
              <button
                onClick={() => stopDeployment(deployment.id)}
                className="p-2 rounded-md bg-red-900/50 text-red-300 hover:bg-red-900/70 border border-red-700 transition-colors"
                title="Stop deployment"
              >
                <Square className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={copyLogsToClipboard}
              className="p-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              title="Copy logs"
            >
              <Copy className="h-4 w-4" />
            </button>
            
            <button
              onClick={downloadLogs}
              className="p-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              title="Download logs"
            >
              <Download className="h-4 w-4" />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ossix-500 focus:border-transparent w-64"
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <div className="flex space-x-1">
                <button
                  onClick={() => setLogFilter('all')}
                  className={getFilterButtonClass('all')}
                >
                  All ({deployment.logs.length})
                </button>
                <button
                  onClick={() => setLogFilter('info')}
                  className={getFilterButtonClass('info')}
                >
                  Info ({deployment.logs.filter(l => l.type === 'info').length})
                </button>
                <button
                  onClick={() => setLogFilter('success')}
                  className={getFilterButtonClass('success')}
                >
                  Success ({deployment.logs.filter(l => l.type === 'success').length})
                </button>
                <button
                  onClick={() => setLogFilter('warning')}
                  className={getFilterButtonClass('warning')}
                >
                  Warning ({deployment.logs.filter(l => l.type === 'warning').length})
                </button>
                <button
                  onClick={() => setLogFilter('error')}
                  className={getFilterButtonClass('error')}
                >
                  Error ({deployment.logs.filter(l => l.type === 'error').length})
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Pause/Play */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center space-x-2 px-3 py-1 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              <span className="text-xs">{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            
            {/* Auto-scroll */}
            <label className="flex items-center space-x-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-slate-600 bg-slate-700 text-ossix-600 focus:ring-ossix-500"
              />
              <span>Auto-scroll</span>
            </label>
            
            {/* Stats */}
            <div className="text-sm text-slate-400">
              {filteredLogs.length} of {deployment.logs.length} entries
            </div>
          </div>
        </div>
      </div>

      {/* Logs Content */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={logContainerRef}
          className="h-full overflow-y-auto bg-slate-900 p-4 font-mono text-sm"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              {deployment.status === 'running' ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ossix-400 mx-auto mb-4"></div>
                  <p>Waiting for deployment logs...</p>
                </div>
              ) : (
                'No logs match your filters'
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence>
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={`${log.timestamp.getTime()}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start space-x-3 hover:bg-slate-800/50 px-3 py-1 rounded group"
                  >
                    <span className="text-slate-500 text-xs mt-0.5 w-20 flex-shrink-0 font-normal">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    
                    {getLogIcon(log.type)}
                    
                    <span className={`text-xs uppercase font-semibold w-16 flex-shrink-0 ${getLogTypeColor(log.type)}`}>
                      {log.type}
                    </span>
                    
                    {log.step && (
                      <span className="text-xs text-ossix-400 bg-ossix-900/20 px-2 py-0.5 rounded border border-ossix-800">
                        {log.step}
                      </span>
                    )}
                    
                    <span className="flex-1 whitespace-pre-wrap break-words text-slate-200 leading-relaxed">
                      {formatMessage(log.message.trim())}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Live indicator */}
              {deployment.status === 'running' && !isPaused && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center justify-center py-4 text-ossix-400"
                >
                  <Play className="h-4 w-4 mr-2" />
                  <span className="text-sm">Live deployment in progress...</span>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}