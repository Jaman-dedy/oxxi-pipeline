'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Terminal, Search, Filter } from 'lucide-react';
import { Deployment, LogEntry } from '@/lib/types';

interface LogViewerProps {
  deployment: Deployment;
  onClose: () => void;
}

type LogFilter = 'all' | 'info' | 'error' | 'warning';

export function LogViewer({ deployment, onClose }: LogViewerProps): React.JSX.Element {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [logFilter, setLogFilter] = useState<LogFilter>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const filteredLogs = React.useMemo(() => {
    let logs = deployment.logs;
    
    // Apply type filter
    if (logFilter !== 'all') {
      logs = logs.filter(log => log.type === logFilter);
    }
    // Apply search filter
   if (searchTerm) {
    logs = logs.filter(log => 
      log.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  return logs;
}, [deployment.logs, logFilter, searchTerm]);

useEffect(() => {
  // Auto-scroll to bottom when new logs arrive (only if auto-scroll is enabled)
  if (autoScroll && logContainerRef.current) {
    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  }
}, [deployment.logs, autoScroll]);

const downloadLogs = (): void => {
  const logsText = deployment.logs
    .map(log => `[${log.timestamp.toLocaleString()}] ${log.type.toUpperCase()}: ${log.message}`)
    .join('\n');
  
  const blob = new Blob([logsText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${deployment.project}-${deployment.environment}-${deployment.id}.log`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const getLogTypeColor = (type: LogEntry['type']): string => {
  switch (type) {
    case 'error':
      return 'text-red-400';
    case 'warning':
      return 'text-yellow-400';
    case 'info':
    default:
      return 'text-green-400';
  }
};

const getFilterButtonClass = (filterType: LogFilter): string => {
  const baseClass = "px-3 py-1 rounded-md text-xs font-medium transition-colors";
  const isActive = logFilter === filterType;
  
  if (isActive) {
    switch (filterType) {
      case 'error':
        return `${baseClass} bg-red-100 text-red-700 border border-red-200`;
      case 'warning':
        return `${baseClass} bg-yellow-100 text-yellow-700 border border-yellow-200`;
      case 'info':
        return `${baseClass} bg-green-100 text-green-700 border border-green-200`;
      default:
        return `${baseClass} bg-blue-100 text-blue-700 border border-blue-200`;
    }
  }
  
  return `${baseClass} bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200`;
};

const handleScroll = (): void => {
  if (logContainerRef.current) {
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setAutoScroll(isAtBottom);
  }
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
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <Terminal className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {deployment.project} - {deployment.environment}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Deployment logs • {filteredLogs.length} of {deployment.logs.length} entries
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
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

      {/* Filters and Search */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Log Type Filters */}
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
        
        {/* Auto-scroll toggle */}
        <div className="mt-3 flex items-center space-x-2">
          <input
            type="checkbox"
            id="auto-scroll"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="auto-scroll" className="text-sm text-slate-600 dark:text-slate-400">
            Auto-scroll to bottom
          </label>
        </div>
      </div>

      {/* Logs Content */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={logContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto bg-slate-900 text-slate-100 p-4 font-mono text-sm"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              {searchTerm || logFilter !== 'all' ? 'No logs match your filters' : 'No logs available'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log, index) => (
                <motion.div
                  key={`${log.timestamp.getTime()}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start space-x-3 hover:bg-slate-800 px-2 py-1 rounded"
                >
                  <span className="text-slate-500 text-xs mt-0.5 w-20 flex-shrink-0">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span className={`text-xs uppercase font-semibold w-12 flex-shrink-0 ${getLogTypeColor(log.type)}`}>
                    {log.type}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-words">
                    {log.message.trim()}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center space-x-4">
            <span>Status: <span className="font-medium capitalize">{deployment.status}</span></span>
            <span>Started: {deployment.startTime.toLocaleString()}</span>
            {deployment.endTime && (
              <span>Ended: {deployment.endTime.toLocaleString()}</span>
            )}
          </div>
          {deployment.duration && (
            <span>Duration: {Math.round(deployment.duration / 1000)}s</span>
          )}
        </div>
      </div>
    </motion.div>
  </motion.div>
);
}