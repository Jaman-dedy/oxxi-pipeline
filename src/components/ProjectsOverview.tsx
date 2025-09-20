'use client';
import React, { useState, useMemo, JSX } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Play,
    Eye,
    Search,
    Activity,
    CheckCircle,
    Clock,
    XCircle,
    ChevronRight,
    GitBranch,
    ExternalLink,
    RotateCcw,
    Square,
    RefreshCw,
    Loader2,
    Server,
    Terminal
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ProjectConfig } from '@/lib/types';
import { LogViewer } from './LogViewer';

export function ProjectsOverview(): JSX.Element {
    const {
        connected,
        deployments,
        projects,
        loadingProjects,
        executeProjectAction,
        refreshProjects
    } = useWebSocket();

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());
    const [liveLogViewer, setLiveLogViewer] = useState<string | null>(null);

    const getProjectStatus = (projectName: string) => {
        const projectDeployments = deployments.filter(d => d.project === projectName);
        const runningDeployments = projectDeployments.filter(d => d.status === 'running');
        const recentDeployment = projectDeployments
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

        const recentStopOperation = projectDeployments.find(d =>
            d.name?.includes('stop') &&
            new Date().getTime() - new Date(d.startTime).getTime() < 300000
        );

        const recentRestartOperation = projectDeployments.find(d =>
            d.name?.includes('restart') &&
            new Date().getTime() - new Date(d.startTime).getTime() < 300000
        );

        return {
            isDeploying: runningDeployments.length > 0,
            runningCount: runningDeployments.length,
            lastDeployment: recentDeployment,
            allDeployments: projectDeployments,
            recentStop: recentStopOperation,
            recentRestart: recentRestartOperation,
            isOperational: !recentStopOperation && recentDeployment?.status === 'success'
        };
    };

    const handleProjectAction = async (
        projectName: string,
        action: 'deploy' | 'restart' | 'stop',
        environment: 'staging' | 'production'
    ) => {
        const actionKey = `${projectName}-${action}-${environment}`;
        setActionLoading(prev => new Set(prev).add(actionKey));

        try {
            const commandId = await executeProjectAction(projectName, action, environment);

            // Show live logs for all operations (not just restart/stop)
            setTimeout(() => {
                setLiveLogViewer(commandId);
            }, 100);

            // Consistent timeout handling
            setTimeout(() => {
                setActionLoading(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(actionKey);
                    return newSet;
                });
            }, 2000); // Consistent 2 second timeout for all actions

        } catch (error) {
            console.error(`Failed to ${action} ${projectName}:`, error);
            setActionLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(actionKey);
                return newSet;
            });
        }
    };

    const getStatusBadge = (project: ProjectConfig) => {
        const status = getProjectStatus(project.name);

        if (status.isDeploying) {
            return (
                <div className="flex items-center space-x-2 px-3 py-1 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 rounded-md text-sm font-medium border border-orange-200 dark:border-orange-800/50">
                    <Clock className="h-3 w-3 animate-pulse" />
                    <span>Deploying</span>
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

        if (status.lastDeployment?.status === 'failed') {
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

    const ActionButton = ({
        action,
        environment,
        project,
        size = 'sm'
    }: {
        action: 'deploy' | 'restart' | 'stop';
        environment: 'staging' | 'production';
        project: ProjectConfig;
        size?: 'sm' | 'md';
    }) => {
        const actionKey = `${project.name}-${action}-${environment}`;
        const isLoading = actionLoading.has(actionKey);

        const baseClasses = size === 'sm'
            ? "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
            : "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200";

        const actionStyles = {
            deploy: `${baseClasses} bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50`,
            restart: `${baseClasses} bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50`,
            stop: `${baseClasses} bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50`
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
                onClick={() => handleProjectAction(project.name, action, environment)}
                disabled={!connected || isLoading}
                className={actionStyles[action]}
                title={`${action} ${environment} (live logs)`}
            >
                {isLoading ? (
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                ) : (
                    <Icon className="h-3 w-3 mr-1.5" />
                )}
                <span className="capitalize">{action}</span>
                {/* Terminal icon for restart/stop to indicate live logs */}
                {!isLoading && (
                    <Terminal className="h-3 w-3 ml-1 opacity-60" />
                )}
            </motion.button>
        );
    };

    const filteredProjects = useMemo(() => {
        if (!searchTerm) return projects;
        return projects.filter(project =>
            project.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, projects]);

    const formatTimeAgo = (date: Date): string => {
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

    if (loadingProjects) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-slate-400 mx-auto mb-3" />
                    <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Loading Projects</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Fetching project configurations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900">
            {/* Header */}
            <header className="border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Ossix Pipeline
                        </h1>

                        <div className="flex items-center space-x-4">
                            <button
                                onClick={refreshProjects}
                                className="p-2 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </button>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                {filteredProjects.length} projects
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                    {connected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Top Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                Projects
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Manage and deploy your applications
                            </p>
                        </div>

                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="space-y-4">
                    {filteredProjects.map((project, index) => {
                        const status = getProjectStatus(project.name);

                        return (
                            <motion.div
                                key={project.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                            <Server className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                                                {project.displayName}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                                                {project.description}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                {project.organization} • {project.host}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        {getStatusBadge(project)}
                                    </div>
                                </div>

                                {/* Environment Cards */}
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    {['staging', 'production'].map((env) => {
                                        const envDeployments = status.allDeployments.filter(d => d.environment === env);
                                        const isEnvDeploying = envDeployments.some(d => d.status === 'running');
                                        const lastEnvDeployment = envDeployments[0];

                                        return (
                                            <div key={env} className="p-4 border border-slate-200 dark:border-slate-800 rounded-md">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`w-2 h-2 rounded-full ${isEnvDeploying ? 'bg-orange-500' :
                                                                lastEnvDeployment?.status === 'success' ? 'bg-green-500' :
                                                                    lastEnvDeployment?.status === 'failed' ? 'bg-red-500' :
                                                                        'bg-slate-400'
                                                            }`} />
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                                                            {env}
                                                        </span>
                                                        {((env === 'production' && project.production_url) ||
                                                            (env === 'staging' && project.staging_url)) && (
                                                                <a
                                                                    href={env === 'production' ? project.production_url : project.staging_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                                                >
                                                                    <ExternalLink className="h-3 w-3" />
                                                                </a>
                                                            )}
                                                    </div>

                                                    {lastEnvDeployment && (
                                                        <span className="text-xs text-slate-400">
                                                            {formatTimeAgo(new Date(lastEnvDeployment.startTime))}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex space-x-2">
                                                    <ActionButton
                                                        action="deploy"
                                                        environment={env as 'staging' | 'production'}
                                                        project={project}
                                                    />
                                                    <ActionButton
                                                        action="restart"
                                                        environment={env as 'staging' | 'production'}
                                                        project={project}
                                                    />
                                                    <ActionButton
                                                        action="stop"
                                                        environment={env as 'staging' | 'production'}
                                                        project={project}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer - Simplified, no duplicate buttons */}
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center space-x-1">
                                            <GitBranch className="h-4 w-4" />
                                            <span>{status.allDeployments.length} operations</span>
                                        </div>
                                        {status.runningCount > 0 && (
                                            <div className="flex items-center space-x-1">
                                                <Activity className="h-4 w-4" />
                                                <span>{status.runningCount} active</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        {/* View Latest Logs Button */}
                                        {status.lastDeployment && (
                                            <button
                                                onClick={() => setLiveLogViewer(status.lastDeployment!.id)}
                                                className="inline-flex items-center px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                                title="View latest logs"
                                            >
                                                <Eye className="h-3 w-3 mr-1" />
                                                View Logs
                                            </button>
                                        )}

                                        <Link href={`/projects/${project.name}`}>
                                            <motion.button
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                            >
                                                View Details
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </motion.button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {filteredProjects.length === 0 && !loadingProjects && (
                    <div className="text-center py-12">
                        <Search className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                            No projects found
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            Try adjusting your search terms or refresh to load projects
                        </p>
                    </div>
                )}
            </main>

            {/* Live Log Viewer */}
            {liveLogViewer && (
                <LogViewer
                    deployment={deployments.find(d => d.id === liveLogViewer)!}
                    onClose={() => setLiveLogViewer(null)}
                />
            )}
        </div>
    );
}