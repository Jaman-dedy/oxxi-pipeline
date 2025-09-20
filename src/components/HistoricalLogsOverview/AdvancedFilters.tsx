// components/AdvancedFilters.tsx
'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Calendar,
  Filter,
  ChevronDown,
  X,
  RefreshCw,
  Sliders
} from 'lucide-react';

interface AdvancedFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedProject: string;
  setSelectedProject: (project: string) => void;
  selectedEnvironment: string;
  setSelectedEnvironment: (env: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string } | ((prev: { start: string; end: string }) => { start: string; end: string })) => void;
  sortBy: string;
  setSortBy: (field: 'startTime' | 'duration' | 'status') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  projects: string[];
  environments: string[];
  onRefresh?: () => void;
  loading?: boolean;
}

export function AdvancedFilters({
  searchTerm,
  setSearchTerm,
  selectedProject,
  setSelectedProject,
  selectedEnvironment,
  setSelectedEnvironment,
  selectedStatus,
  setSelectedStatus,
  dateRange,
  setDateRange,
  projects,
  environments,
  onRefresh,
  loading = false
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Statuses', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
    { value: 'success', label: 'Success', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    { value: 'running', label: 'Running', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    { value: 'interrupted', label: 'Interrupted', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { value: 'stopped', label: 'Stopped', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400' }
  ];

  const activeFiltersCount = [
    selectedProject !== 'all',
    selectedEnvironment !== 'all', 
    selectedStatus !== 'all',
    searchTerm.length > 0
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedProject('all');
    setSelectedEnvironment('all');
    setSelectedStatus('all');
    setDateRange({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
  };

  const quickDatePresets = [
    {
      label: 'Last 7 days',
      getValue: () => ({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      })
    },
    {
      label: 'Last 30 days',
      getValue: () => ({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      })
    },
    {
      label: 'This month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: start.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        };
      }
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8 overflow-visible">
      {/* Main Filter Row */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          {/* Search - Takes more space */}
          <div className="lg:col-span-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search deployments, projects, environments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-ossix-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Date Range
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-ossix-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex-1">
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-ossix-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <div className="relative ml-14 w-36">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-ossix-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white appearance-none cursor-pointer"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="lg:col-span-3 flex items-center justify-end space-x-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 text-slate-600 dark:text-slate-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Sliders className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Quick select:</span>
          {quickDatePresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setDateRange(preset.getValue())}
              className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}:
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedProject !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-ossix-100 dark:bg-ossix-900/30 text-ossix-700 dark:text-ossix-400 rounded-md text-xs font-medium">
                    Project: {selectedProject}
                    <button
                      onClick={() => setSelectedProject('all')}
                      className="ml-2 hover:text-ossix-800 dark:hover:text-ossix-300 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedEnvironment !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-xs font-medium">
                    Env: {selectedEnvironment}
                    <button
                      onClick={() => setSelectedEnvironment('all')}
                      className="ml-2 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedStatus !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-xs font-medium">
                    Status: {selectedStatus}
                    <button
                      onClick={() => setSelectedStatus('all')}
                      className="ml-2 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-md text-xs font-medium">
                    Search: "{searchTerm.length > 15 ? searchTerm.slice(0, 15) + '...' : searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-2 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-t border-slate-200 dark:border-slate-700 bg-slate-700 dark:bg-slate-750"
          >
            <div className="p-6">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                Additional Filters
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Project Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Project
                  </label>
                  <div className="relative">
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-ossix-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white appearance-none cursor-pointer"
                    >
                      <option value="all">All Projects</option>
                      {projects.map(project => (
                        <option key={project} value={project}>{project}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Environment Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Environment
                  </label>
                  <div className="relative">
                    <select
                      value={selectedEnvironment}
                      onChange={(e) => setSelectedEnvironment(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-ossix-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white appearance-none cursor-pointer"
                    >
                      <option value="all">All Environments</option>
                      {environments.map(env => (
                        <option key={env} value={env}>{env}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Status Breakdown */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Status Filters
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.slice(1).map(status => (
                      <button
                        key={status.value}
                        onClick={() => setSelectedStatus(selectedStatus === status.value ? 'all' : status.value)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                          selectedStatus === status.value 
                            ? status.color + ' ring-2 ring-offset-1 ring-current' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}