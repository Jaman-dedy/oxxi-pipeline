'use client';
import React, { useState, useMemo, JSX } from 'react';
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
  Zap,
  Settings,
  ExternalLink
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { PROJECTS } from '@/lib/types';
import { DeploymentCard } from './DeploymentCard';
import { LogViewer } from './LogViewer';

interface ServiceDetailProps {
  projectSlug: string;
}

export function ServiceDetail({ projectSlug }: ServiceDetailProps): JSX.Element {
  const { connected, deployments, startDeployment, stopDeployment, clearDeployments } = useWebSocket();
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const [deployingItems, setDeployingItems] = useState<Set<string>>(new Set());

  // Find the project
  const project = PROJECTS.find(p => p.name === projectSlug);
  
  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Project Not Found</h1>
          <Link href="/projects" className="text-ossix-600 hover:text-ossix-700">
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  // Filter deployments for this project
  const projectDeployments = useMemo(() => {
    return deployments
      .filter(d => d.project === projectSlug)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [deployments, projectSlug]);

  const runningDeployments = projectDeployments.filter(d => d.status === 'running');
  const recentDeployments = projectDeployments.filter(d => d.status !== 'running');

  const handleDeploy = async (environment: string, organization: string, host: string): Promise<void> => {
    const deployKey = `${projectSlug}-${environment}`;
    setDeployingItems(prev => new Set(prev).add(deployKey));
    
    try {
      await startDeployment({ project: projectSlug, environment, organization, host });
    } finally {
      setTimeout(() => {
        setDeployingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(deployKey);
          return newSet;
        });
      }, 2000);
    }
  };

  const getEnvironmentStatus = (envName: string) => {
    const envDeployments = projectDeployments.filter(d => d.environment === envName);
    const running = envDeployments.find(d => d.status === 'running');
    const latest = envDeployments[0];
    
    return { running, latest, count: envDeployments.length };
  };

  const clearProjectDeployments = () => {
    // This would ideally clear only this project's deployments
    clearDeployments();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/projects"
                className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-ossix-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    {project.displayName}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {project.description}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {projectDeployments.length} deployments
              </div>
              {runningDeployments.length > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-sm font-medium">
                  <Clock className="h-3 w-3 animate-pulse" />
                  <span>{runningDeployments.length} running</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Environment Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {project.environments.map((env) => {
            const status = getEnvironmentStatus(env.name);
            const deployKey = `${projectSlug}-${env.name}`;
            const isDeploying = deployingItems.has(deployKey);
            
            return (
              <motion.div
                key={env.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      status.running ? 'bg-orange-500 animate-pulse' :
                      status.latest?.status === 'success' ? 'bg-green-500' :
                      status.latest?.status === 'failed' ? 'bg-red-500' :
                      'bg-slate-400'
                    }`} />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
                      {env.name}
                    </h3>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {env.organization} • {env.host}
                    </div>
                    {status.latest && (
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        Last deployed {new Date(status.latest.startTime).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Environment Status */}
                <div className="mb-4">
                  {status.running ? (
                    <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                      <Clock className="h-4 w-4 animate-pulse" />
                      <span className="text-sm font-medium">Deployment in progress...</span>
                    </div>
                  ) : status.latest ? (
                    <div className={`flex items-center space-x-2 ${
                      status.latest.status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {status.latest.status === 'success' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">
                        {status.latest.status === 'success' ? 'Deployed successfully' : 'Deployment failed'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                      <div className="h-4 w-4 bg-slate-400 rounded-full" />
                      <span className="text-sm">Ready to deploy</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleDeploy(env.name, env.organization, env.host)}
                    disabled={!connected || isDeploying || !!status.running}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-ossix-600 text-white hover:bg-ossix-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeploying || status.running ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Deploy
                      </>
                    )}
                  </button>
                  
                  {status.latest && (
                    <button
                      onClick={() => setSelectedDeployment(status.latest!.id)}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>{status.count} deployments</span>
                    {status.latest?.duration && (
                      <span>Last: {Math.round(status.latest.duration / 1000)}s</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Running Deployments */}
        {runningDeployments.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Active Deployments
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

        {/* Recent Deployments */}
        {recentDeployments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Recent Activity
              </h2>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {recentDeployments.length} deployments
                </div>
                {recentDeployments.length > 0 && (
                  <button
                    onClick={clearProjectDeployments}
                    className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Clear deployment history"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
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

        {projectDeployments.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl">
            <Terminal className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No deployments yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Deploy to {project.environments.map(e => e.name).join(' or ')} to get started
            </p>
            <div className="flex justify-center space-x-4">
              {project.environments.map((env) => (
                <button
                  key={env.name}
                  onClick={() => handleDeploy(env.name, env.organization, env.host)}
                  disabled={!connected}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-ossix-600 text-white hover:bg-ossix-700 disabled:opacity-50 transition-colors"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Deploy to {env.name}
                </button>
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