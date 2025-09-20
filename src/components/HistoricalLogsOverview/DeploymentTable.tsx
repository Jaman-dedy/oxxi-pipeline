// components/DeploymentTable.tsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Play,
  Eye,
  ChevronUp,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

interface Deployment {
  id: string;
  name: string;
  project: string;
  environment: string;
  status: 'success' | 'failed' | 'running' | 'interrupted' | 'stopped';
  startTime: string;
  endTime?: string;
  duration?: number;
  totalLogs: number;
}

interface DeploymentTableProps {
  deployments: Deployment[];
  loading: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  onViewLogs: (deploymentId: string) => void;
}

export function DeploymentTable({ 
  deployments, 
  loading, 
  sortBy, 
  sortOrder, 
  onSort, 
  onViewLogs 
}: DeploymentTableProps) {
  const getStatusIcon = (status: string) => {
    const iconClass = "h-4 w-4";
    switch (status) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'failed':
        return <XCircle className={`${iconClass} text-red-500`} />;
      case 'stopped':
        return <AlertCircle className={`${iconClass} text-gray-500`} />;
      case 'interrupted':
        return <Clock className={`${iconClass} text-yellow-500`} />;
      case 'running':
        return <Play className={`${iconClass} text-orange-500 animate-pulse`} />;
      default:
        return <div className={`${iconClass} bg-slate-400 rounded-full`} />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'stopped':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      case 'interrupted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'running':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const formatDuration = (duration?: number): string => {
    if (!duration) return 'N/A';
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center space-x-1 hover:text-slate-900 dark:hover:text-white transition-colors"
    >
      <span>{children}</span>
      {sortBy === field && (
        sortOrder === 'asc' ? 
          <ChevronUp className="h-4 w-4" /> : 
          <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Deployment History</h2>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ossix-500 mx-auto"></div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Loading deployments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Deployment History</h2>
      </div>

      {deployments.length === 0 ? (
        <div className="p-8 text-center text-slate-600 dark:text-slate-400">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No deployments found
          </h3>
          <p>Try adjusting your filters or date range</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700 dark:bg-slate-750">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-50 dark:text-slate-50 uppercase tracking-wider">
                  <SortButton field="status">Status</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-50 dark:text-slate-50 uppercase tracking-wider">
                  Deployment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-50 dark:text-slate-50 uppercase tracking-wider">
                  Project / Environment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-50 dark:text-slate-50 uppercase tracking-wider">
                  <SortButton field="startTime">Started</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-50 dark:text-slate-50 uppercase tracking-wider">
                  <SortButton field="duration">Duration</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-50 dark:text-slate-50 uppercase tracking-wider">
                  Logs
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-50 dark:text-slate-50 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {deployments.map((deployment, index) => (
                <motion.tr
                  key={deployment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-slate-700 dark:hover:bg-slate-750 group cursor-pointer"
                  onClick={() => onViewLogs(deployment.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(deployment.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deployment.status)}`}>
                        {deployment.status.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {deployment.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          ID: {deployment.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {deployment.project}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 capitalize">
                        {deployment.environment}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-slate-900 dark:text-white">
                        {new Date(deployment.startTime).toLocaleDateString()}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {new Date(deployment.startTime).toLocaleTimeString()} 
                        <span className="ml-2 text-xs">
                          ({formatTimeAgo(deployment.startTime)})
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-slate-900 dark:text-white">
                      {formatDuration(deployment.duration)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-900 dark:text-white font-medium">
                        {deployment.totalLogs.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">entries</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewLogs(deployment.id);
                      }}
                      className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Logs
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}