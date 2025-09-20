'use client';
import React, { useState, useMemo, useEffect, JSX } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Eye,
  Square,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  Trash2,
  GitBranch,
  Timer,
  ExternalLink,
  RotateCcw,
  RefreshCw,
  Loader2,
  Server
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ProjectConfig } from '@/lib/types';
import { DeploymentCard } from './DeploymentCard';
import { LogViewer } from './LogViewer';

interface ServiceDetailProps {
  projectSlug: string;
}

export function ServiceDetail({ projectSlug }: ServiceDetailProps): JSX.Element {
  const { 
    connected, 
    deployments, 
    projects,
    loadingProjects,
    startDeployment, 
    stopDeployment, 
    clearDeployments, 
    resumeDeployment,
    executeProjectAction,
    getActiveOperations
  } = useWebSocket();
  
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  const project = projects.find(p => p.name === projectSlug);

  const projectDeployments = useMemo(() => {
    return deployments
      .filter(d => d.project === projectSlug)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [deployments, projectSlug]);

  const runningDeployments = useMemo(() => 
    projectDeployments.filter(d => d.status === 'running'), 
    [projectDeployments]
  );
  
  const recentDeployments = useMemo(() => 
    projectDeployments.filter(d => d.status !== 'running'), 
    [projectDeployments]
  );

  const handleAction = async (
    action: 'deploy' | 'restart' | 'stop', 
    environment: 'staging' | 'production'
  ): Promise<void> => {
    const actionKey = `${projectSlug}-${action}-${environment}`;
    setActionLoading(prev => new Set(prev).add(actionKey));
  
    try {
      // Use executeProjectAction consistently for all actions
      await executeProjectAction(projectSlug, action, environment);
    } catch (error) {
      console.error(`Failed to ${action} ${projectSlug}:`, error);
    } finally {
      setTimeout(() => {
        setActionLoading(prev => {
          const newSet = new Set(prev);
          newSet.delete(actionKey);
          return newSet;
        });
      }, action === 'deploy' ? 2000 : 3000);
    }
  };

  const getEnvironmentStatus = (envName: string) => {
    const envDeployments = projectDeployments.filter(d => d.environment === envName);
    const running = envDeployments.find(d => d.status === 'running');
    const latest = envDeployments[0];

    // Check for recent stop/restart operations
    const recentStop = envDeployments.find(d => 
      d.name?.includes('stop') && 
      new Date().getTime() - new Date(d.startTime).getTime() < 300000
    );

    const recentRestart = envDeployments.find(d => 
      d.name?.includes('restart') && 
      new Date().getTime() - new Date(d.startTime).getTime() < 300000
    );

    return { 
      running, 
      latest, 
      count: envDeployments.length,
      recentStop,
      recentRestart,
      isOperational: !recentStop && latest?.status === 'success'
    };
  };

  const getEnvironmentUrl = (environment: string): string | undefined => {
    return environment === 'production' ? project?.production_url : project?.staging_url;
  };

  const ActionButton = ({ 
    action, 
    environment, 
    disabled = false,
    variant = 'primary'
  }: { 
    action: 'deploy' | 'restart' | 'stop'; 
    environment: 'staging' | 'production';
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
  }) => {
    const actionKey = `${projectSlug}-${action}-${environment}`;
    const isLoading = actionLoading.has(actionKey);
    
    const variants = {
      primary: "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100",
      secondary: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700",
      danger: "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-950/30"
    };

    const icons = {
      deploy: Play,
      restart: RotateCcw,
      stop: Square
    };

    const Icon = icons[action];

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleAction(action, environment)}
        disabled={!connected || isLoading || disabled}
        className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {action === 'deploy' ? 'Deploying...' : action === 'restart' ? 'Restarting...' : 'Stopping...'}
          </>
        ) : (
          <>
            <Icon className="h-4 w-4 mr-2" />
            <span className="capitalize">{action}</span>
          </>
        )}
      </motion.button>
    );
  };

  const getStatusBadge = (status: any) => {
    if (status.running) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 rounded-md text-sm font-medium border border-orange-200 dark:border-orange-800/50">
          <Clock className="h-3 w-3 animate-pulse" />
          <span>Running</span>
        </div>
      );
    }

    if (status.recentStop?.status === 'success') {
      return (
        <div className="flex items-center space-x-2 px-3 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-md text-sm font-medium border border-slate-200 dark:border-slate-700">
          <Square className="h-3 w-3" />
          <span>Stopped</span>
        </div>
      );
    }

    if (status.recentRestart?.status === 'success') {
      return (
        <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-md text-sm font-medium border border-blue-200 dark:border-blue-800/50">
          <RotateCcw className="h-3 w-3" />
          <span>Restarted</span>
        </div>
      );
    }

    if (status.isOperational) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-md text-sm font-medium border border-green-200 dark:border-green-800/50">
          <div className="h-2 w-2 bg-green-500 rounded-full" />
          <span>Live</span>
        </div>
      );
    }

    if (status.latest?.status === 'failed') {
      return (
        <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-md text-sm font-medium border border-red-200 dark:border-red-800/50">
          <XCircle className="h-3 w-3" />
          <span>Failed</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 rounded-md text-sm font-medium border border-slate-200 dark:border-slate-700">
        <div className="h-2 w-2 bg-slate-400 rounded-full" />
        <span>Ready</span>
      </div>
    );
  };

  if (loadingProjects) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Loading Project</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Fetching project configuration...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Project Not Found</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Project "{projectSlug}" could not be found in the configuration.
          </p>
          <Link href="/projects" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/projects"
                className="p-2 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <Server className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {project.displayName}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {project.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {projectDeployments.length} operations
              </div>
              {runningDeployments.length > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 rounded-md text-sm font-medium border border-orange-200 dark:border-orange-800/50">
                  <Clock className="h-3 w-3 animate-pulse" />
                  <span>{runningDeployments.length} active</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Environment Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {['staging', 'production'].map((env) => {
            const status = getEnvironmentStatus(env);
            const envUrl = getEnvironmentUrl(env);

            return (
              <motion.div
                key={env}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-slate-200 dark:border-slate-800 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status.running ? 'bg-orange-500 animate-pulse' :
                      status.latest?.status === 'success' ? 'bg-green-500' :
                      status.latest?.status === 'failed' ? 'bg-red-500' :
                      'bg-slate-400'
                    }`} />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white capitalize">
                      {env}
                    </h3>
                    {envUrl && (
                      <a
                        href={envUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        title={`Open ${env} environment`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  {getStatusBadge(status)}
                </div>

                {/* Status Description */}
                <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                  {status.running ? (
                    <span>Operation in progress...</span>
                  ) : status.latest ? (
                    <span>
                      Last operation: {new Date(status.latest.startTime).toLocaleString()}
                    </span>
                  ) : (
                    <span>Ready for operations</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <ActionButton 
                    action="deploy" 
                    environment={env as 'staging' | 'production'}
                    disabled={!!status.running}
                    variant="primary"
                  />
                  <ActionButton 
                    action="restart" 
                    environment={env as 'staging' | 'production'}
                    variant="secondary"
                  />
                  <ActionButton 
                    action="stop" 
                    environment={env as 'staging' | 'production'}
                    variant="danger"
                  />
                </div>

                {/* View Logs Button */}
                {status.latest && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedDeployment(status.latest!.id)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Logs
                    </button>
                    {status.latest?.status === 'interrupted' && (
                      <button
                        onClick={() => {
                          setSelectedDeployment(null);
                          resumeDeployment(status.latest!.id);
                        }}
                        className="px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>{status.count} total operations</span>
                    {status.latest?.duration && (
                      <span>Duration: {Math.round(status.latest.duration / 1000)}s</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Running Operations */}
        {runningDeployments.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-slate-900 dark:text-white">
                Active Operations
              </h2>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {runningDeployments.length} running
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {runningDeployments.map((deployment) => (
                  <DeploymentCard
                    key={deployment.id}
                    deployment={deployment}
                    onStop={() => stopDeployment(deployment.id)}
                    onViewLogs={() => setSelectedDeployment(deployment.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Recent Operations */}
        {recentDeployments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-slate-900 dark:text-white">
                Recent Activity
              </h2>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {recentDeployments.length} operations
                </div>
                <button
                  onClick={() => clearDeployments()}
                  className="p-2 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {recentDeployments.slice(0, 10).map((deployment) => (
                  <DeploymentCard
                    key={deployment.id}
                    deployment={deployment}
                    onStop={() => stopDeployment(deployment.id)}
                    onViewLogs={() => setSelectedDeployment(deployment.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty State */}
        {projectDeployments.length === 0 && (
          <div className="text-center py-12 border border-slate-200 dark:border-slate-800 rounded-lg">
            <Terminal className="h-8 w-8 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No operations yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Deploy to staging or production to get started
            </p>
            <div className="flex justify-center space-x-4">
              {['staging', 'production'].map((env) => (
                <ActionButton
                  key={env}
                  action="deploy"
                  environment={env as 'staging' | 'production'}
                  variant="primary"
                />
              ))}
            </div>
          </div>
        )}  
      </main>

      {/* Log Viewer Modal */}
      <AnimatePresence>
        {selectedDeployment && (
          <LogViewer
            deployment={deployments.find(d => d.id === selectedDeployment)!}
            onClose={() => setSelectedDeployment(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}