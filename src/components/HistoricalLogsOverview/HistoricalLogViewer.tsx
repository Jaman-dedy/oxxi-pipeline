// components/HistoricalLogViewer.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Terminal, 
  Search, 
  Filter,
  Copy,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useHistoricalLogs } from '@/hooks/useHistoricalLogs';

interface HistoricalLogViewerProps {
  deploymentId: string;
  onClose: () => void;
}

type LogFilter = 'all' | 'info' | 'error' | 'warning' | 'success' | 'progress';

export function HistoricalLogViewer({ deploymentId, onClose }: HistoricalLogViewerProps) {
  const { getDeploymentLogs } = useHistoricalLogs();
  const [deployment, setDeployment] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [logFilter, setLogFilter] = useState<LogFilter>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedLogIndex, setSelectedLogIndex] = useState<number | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDeploymentData();
  }, [deploymentId]);

  const loadDeploymentData = async () => {
    try {
      setLoading(true);
      const data = await getDeploymentLogs(deploymentId);
      setDeployment(data?.metadata);
      setLogs(data?.logs || []);
    } catch (error) {
      console.error('Error loading deployment logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = React.useMemo(() => {
    let filteredList = logs;

    if (logFilter !== 'all') {
      filteredList = filteredList.filter(log => log.type === logFilter);
    }

    if (searchTerm) {
      filteredList = filteredList.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.step?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredList;
  }, [logs, logFilter, searchTerm]);

  const downloadLogs = () => {
    const logsText = logs
      .map(log => `[${new Date(log.timestamp).toLocaleString()}] ${log.type.toUpperCase()}: ${log.message}`)
      .join('\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-${deploymentId}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    const text = filteredLogs
      .map(log => `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.type.toUpperCase()}: ${log.message}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy logs:', err);
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-yellow-400 flex-shrink-0" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />;
      case 'progress':
        return <Clock className="h-3 w-3 text-blue-400 flex-shrink-0" />;
      case 'info':
      default:
        return <div className="w-3 h-3 bg-slate-400 rounded-full flex-shrink-0" />;
    }
  };

  const getLogTypeColor = (type: string): string => {
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ossix-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading deployment logs...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-7xl h-5/6 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-ossix-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Terminal className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {deployment?.project} → {deployment?.environment}
              </h2>
              <p className="text-sm text-slate-400">
                {deployment?.name} • {filteredLogs.length} of {logs.length} entries
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
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
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs... (use / to focus)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ossix-500"
              />
            </div>

            <div className="flex space-x-2">
              {['all', 'info', 'success', 'warning', 'error', 'progress'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLogFilter(filter as LogFilter)}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    logFilter === filter
                      ? 'bg-ossix-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter === 'all' ? ` (${logs.length})` : ` (${logs.filter(l => l.type === filter).length})`}
                </button>
              ))}
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
                <div className="text-center">
                  <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No logs match your search criteria</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex items-start space-x-3 px-3 py-2 rounded hover:bg-slate-800/50 cursor-pointer transition-colors ${
                      selectedLogIndex === index ? 'bg-slate-800 ring-2 ring-ossix-500/30' : ''
                    }`}
                    onClick={() => setSelectedLogIndex(selectedLogIndex === index ? null : index)}
                  >
                    <span className="text-slate-500 text-xs mt-0.5 w-20 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
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

                    <span className="flex-1 whitespace-pre-wrap break-words text-slate-200">
                      {log.message.trim()}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            {deployment && (
              <>
                Started: {new Date(deployment.startTime).toLocaleString()}
                {deployment.endTime && (
                  <> • Duration: {Math.round((new Date(deployment.endTime).getTime() - new Date(deployment.startTime).getTime()) / 1000)}s</>
                )}
              </>
            )}
            </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-slate-600 bg-slate-700 text-ossix-600 focus:ring-ossix-500"
              />
              <span>Auto-scroll</span>
            </label>
            
            <div className="text-sm text-slate-400">
              {filteredLogs.length} / {logs.length} entries
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}