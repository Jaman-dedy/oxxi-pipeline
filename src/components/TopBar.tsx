'use client';
import React, {JSX} from 'react';
import { 
  Search, 
  Filter, 
  Bell,
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';

interface TopBarProps {
  connected: boolean;
  stats: {
    running: number;
    successful: number;
    failed: number;
  };
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterStatus: 'all' | 'running' | 'success' | 'failed';
  onFilterChange: (status: 'all' | 'running' | 'success' | 'failed') => void;
  onClearDeployments: () => void;
  deploymentsCount: number;
}

export function TopBar({ 
  connected, 
  stats, 
  searchTerm, 
  onSearchChange,
  filterStatus,
  onFilterChange,
  onClearDeployments,
  deploymentsCount
}: TopBarProps): JSX.Element {
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Search */}
        <div className="flex items-center space-x-4 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects and deployments..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ossix-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => onFilterChange(e.target.value as any)}
              className="appearance-none bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ossix-500"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
            <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Right Section - Stats & Actions */}
        <div className="flex items-center space-x-6">
          {/* Quick Stats */}
          <div className="hidden lg:flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-slate-600 dark:text-slate-300">
                {stats.running} Running
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-slate-600 dark:text-slate-300">
                {stats.successful} Success
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-slate-600 dark:text-slate-300">
                {stats.failed} Failed
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <StatusIndicator connected={connected} />
            
            {/* Notifications */}
            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative">
              <Bell className="h-5 w-5" />
              {stats.running > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full"></span>
              )}
            </button>
            
            {/* Clear History */}
            {deploymentsCount > 0 && (
              <button
                onClick={onClearDeployments}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Clear deployment history"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}