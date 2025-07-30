'use client';
import React, { useEffect, useRef, useState, JSX } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Terminal, Search, Filter, Play, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Deployment, LogEntry } from '@/lib/types';

interface LogViewerProps {
  deployment: Deployment;
  onClose: () => void;
}

type LogFilter = 'all' | 'info' | 'error' | 'warning' | 'success' | 'progress';

export function LogViewer({ deployment, onClose }: LogViewerProps): JSX.Element {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [logFilter, setLogFilter] = useState<LogFilter>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

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

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [deployment.logs, autoScroll]);

  const downloadLogs = (): void => {
    const logsText = deployment.logs
      .map(log => `[${new Date(log.timestamp).toLocaleString()}] ${log.type.toUpperCase()}: ${log.message}`)
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
        return <div className="w-3 h-3 bg-slate-400 rounded-full flex-shrink-0" />;
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
    // Add some basic formatting for common patterns
    return message
      .replace(/✓/g, '✅')
      .replace(/×/g, '❌')
      .replace(/→/g, '➜')
      .replace(/\[(\d+%)\]/g, '🔄 $1');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-6xl h-4/5 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-ossix-50 to-blue-50 dark:from-slate-800 dark:to-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-ossix-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {deployment.project} → {deployment.environment}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Live deployment logs • {filteredLogs.length} of {deployment.logs.length} entries
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${deployment.status === 'running' ? 'bg-orange-100 text-orange-700' :
                deployment.status === 'success' ? 'bg-green-100 text-green-700' :
                  deployment.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
              }`}>
              {deployment.status.toUpperCase()}
            </div>
            <button
              onClick={downloadLogs}
              className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Download logs"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Logs Content */}
        <div className="flex-1 overflow-hidden">
          <div
            ref={logContainerRef}
            className="h-full overflow-y-auto bg-slate-900 text-slate-100 p-4 font-mono text-sm"
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
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={`${new Date(log.timestamp).getTime()}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start space-x-3 hover:bg-slate-800 px-2 py-1 rounded group"
                  >
                    <span className="text-slate-500 text-xs mt-0.5 w-20 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>

                    {getLogIcon(log.type)}

                    <span className={`text-xs uppercase font-semibold w-16 flex-shrink-0 ${getLogTypeColor(log.type)}`}>
                      {log.type}
                    </span>

                    {log.step && (
                      <span className="text-xs text-ossix-400 bg-ossix-900/20 px-2 py-0.5 rounded">
                        {log.step}
                      </span>
                    )}

                    <span className="flex-1 whitespace-pre-wrap break-words">
                      {formatMessage(log.message.trim())}
                    </span>
                  </motion.div>
                ))}

                {/* Auto-scroll indicator */}
                {deployment.status === 'running' && (
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

        {/* Footer with auto-scroll toggle */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
              <span>Started: {deployment.startTime.toLocaleString()}</span>
              {deployment.endTime && (
                <span>Duration: {Math.round((new Date(deployment.endTime || Date.now()).getTime() - new Date(deployment.startTime).getTime()) / 1000)}s</span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto-scroll"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-slate-300 text-ossix-600 focus:ring-ossix-500"
              />
              <label htmlFor="auto-scroll" className="text-sm text-slate-600 dark:text-slate-400">
                Auto-scroll
              </label>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}