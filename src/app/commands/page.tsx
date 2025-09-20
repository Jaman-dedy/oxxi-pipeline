'use client';
import React, { useState, useMemo, JSX } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Terminal,
  Play,
  Eye,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { DeploymentCard } from '@/components/DeploymentCard';
import { LogViewer } from '@/components/LogViewer';

export default function CommandsPage(): JSX.Element {
  const { connected, deployments, stopDeployment, clearDeployments } = useWebSocket();
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'success' | 'failed'>('all');

  // Filter commands (not regular deployments)
  const allCommands = useMemo(() => {
    return deployments
      .filter(d => 
        d.environment === 'command' || 
        d.environment === 'manual' || 
        d.project === 'global' ||
        d.project === 'manual-command'
      )
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [deployments]);

  // Apply filters
  const filteredCommands = useMemo(() => {
    let commands = allCommands;

    // Status filter
    if (statusFilter !== 'all') {
      commands = commands.filter(cmd => cmd.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      commands = commands.filter(cmd => 
        (cmd.project || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return commands;
  }, [allCommands, statusFilter, searchTerm]);

  const runningCommands = allCommands.filter(cmd => cmd.status === 'running');
  const todayCommands = allCommands.filter(cmd => {
    const today = new Date();
    const cmdDate = new Date(cmd.startTime);
    return cmdDate.toDateString() === today.toDateString();
  });

  const successRate = allCommands.length > 0 ? 
    Math.round((allCommands.filter(cmd => cmd.status === 'success').length / allCommands.length) * 100) : 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-orange-600 bg-orange-100';
      case 'success': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Terminal className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Global Commands
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Manage and monitor universal command executions
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {allCommands.length} total commands
              </div>
              {runningCommands.length > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-sm font-medium">
                  <Clock className="h-3 w-3 animate-pulse" />
                  <span>{runningCommands.length} running</span>
                </div>
              )}
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Commands</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{allCommands.length}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Running Now</p>
                <p className="text-2xl font-bold text-orange-600">{runningCommands.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Today</p>
                <p className="text-2xl font-bold text-blue-600">{todayCommands.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{successRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search commands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Status</option>
                  <option value="running">Running</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.location.reload()}
                className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              
              {allCommands.length > 0 && (
                <button
                  onClick={clearDeployments}
                  className="p-2 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Clear all commands"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Showing {filteredCommands.length} of {allCommands.length} commands
          </div>
        </div>

        {/* Commands List */}
        {filteredCommands.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
            <Terminal className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No commands found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {allCommands.length === 0 
                ? "No commands have been executed yet. Use the Command Runner to get started!"
                : "Try adjusting your search or filter criteria."
              }
            </p>
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              <Terminal className="h-4 w-4 mr-2" />
              Open Command Runner
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredCommands.map((command) => (
                <DeploymentCard
                  key={command.id}
                  deployment={command}
                  onStop={() => stopDeployment(command.id)}
                  onViewLogs={() => setSelectedCommand(command.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Log Viewer Modal */}
      <AnimatePresence>
        {selectedCommand && (
          <LogViewer
            deployment={deployments.find(d => d.id === selectedCommand)!}
            onClose={() => setSelectedCommand(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}