'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Activity,
  Archive,
  Eye,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { useHistoricalLogs } from '@/hooks/useHistoricalLogs';
import { StatsGrid } from './stats/StatsGrid';
import { AdvancedFilters } from './AdvancedFilters';
import { DeploymentTable } from './DeploymentTable';
import { HistoricalLogViewer } from './HistoricalLogViewer';

export function HistoricalLogsOverview() {
  const {
    deployments,
    stats,
    loading,
    statsLoading,
    error,
    searchDeployments,
    getStats,
    clearError
  } = useHistoricalLogs();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'startTime' | 'duration' | 'status'>('startTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Load data on mount and when filters change
  useEffect(() => {
    loadData();
  }, [dateRange, selectedProject, selectedEnvironment, selectedStatus, searchTerm, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      // Load deployments
      await searchDeployments({
        query: searchTerm || undefined,
        startDate: dateRange.start,
        endDate: dateRange.end,
        project: selectedProject !== 'all' ? selectedProject : undefined,
        environment: selectedEnvironment !== 'all' ? selectedEnvironment : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        limit: pageSize * 5, // Load more for better sorting
        offset: 0,
        sortBy,
        sortOrder,
      });

      // Load stats
      await getStats({
        startDate: dateRange.start,
        endDate: dateRange.end
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Project', 'Environment', 'Status', 'Start Time', 'Duration (s)', 'Total Logs'],
      ...deployments.map(d => [
        d.project,
        d.environment,
        d.status,
        new Date(d.startTime).toISOString(),
        d.duration ? Math.round(d.duration / 1000) : 'N/A',
        d.totalLogs
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get unique values for filters
  const projects = [...new Set(deployments.map(d => d.project))];
  const environments = [...new Set(deployments.map(d => d.environment))];

  // Pagination
  const totalPages = Math.ceil(deployments.length / pageSize);
  const paginatedDeployments = deployments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-ossix-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Archive className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Deployment History
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Advanced analytics and deployment logs
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>

              <Link
                href="/projects"
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Back to Projects
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="text-red-800 dark:text-red-400">{error}</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <StatsGrid stats={stats} statsLoading={statsLoading} />

        {/* Advanced Filters */}
        <AdvancedFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          selectedEnvironment={selectedEnvironment}
          setSelectedEnvironment={setSelectedEnvironment}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          dateRange={dateRange}
          setDateRange={setDateRange}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          projects={projects}
          environments={environments}
        />

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing {paginatedDeployments.length} of {deployments.length} deployments
            {searchTerm && (
              <span className="ml-2 px-2 py-1 bg-ossix-100 dark:bg-ossix-900/20 text-ossix-700 dark:text-ossix-400 rounded-md">
                "{searchTerm}"
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-ossix-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Deployments Table */}
        <DeploymentTable
          deployments={paginatedDeployments}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(field) => {
            if (sortBy === field) {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy(field as any);
              setSortOrder('desc');
            }
          }}
          onViewLogs={(deploymentId) => setSelectedDeployment(deploymentId)}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                      currentPage === page
                        ? 'bg-ossix-600 border-ossix-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Historical Log Viewer Modal */}
      {selectedDeployment && (
        <HistoricalLogViewer
          deploymentId={selectedDeployment}
          onClose={() => setSelectedDeployment(null)}
        />
      )}
    </div>
  );
}