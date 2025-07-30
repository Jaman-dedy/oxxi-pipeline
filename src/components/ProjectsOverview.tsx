'use client';
import React, { useState, useMemo, JSX } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Play,
    Eye,
    Settings,
    Search,
    Activity,
    CheckCircle,
    Clock,
    XCircle,
    Zap,
    ChevronRight,
    GitBranch
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { PROJECTS } from '@/lib/types';
import { Logo } from './ui/Logo';

export function ProjectsOverview(): JSX.Element {
    const { connected, deployments } = useWebSocket();
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Get deployment status for each project
    const getProjectStatus = (projectName: string) => {
        const projectDeployments = deployments.filter(d => d.project === projectName);
        const runningDeployments = projectDeployments.filter(d => d.status === 'running');
        const recentDeployment = projectDeployments
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

        return {
            isDeploying: runningDeployments.length > 0,
            runningCount: runningDeployments.length,
            lastDeployment: recentDeployment,
            allDeployments: projectDeployments
        };
    };

    const filteredProjects = useMemo(() => {
        if (!searchTerm) return PROJECTS;
        return PROJECTS.filter(project =>
            project.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

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

    const getStatusBadge = (projectName: string) => {
        const status = getProjectStatus(projectName);

        if (status.isDeploying) {
            return (
                <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-sm font-medium">
                    <Clock className="h-3 w-3 animate-pulse" />
                    <span>Deploying ({status.runningCount})</span>
                </div>
            );
        }

        if (status.lastDeployment) {
            const isSuccess = status.lastDeployment.status === 'success';
            return (
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${isSuccess
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}>
                    {isSuccess ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    <span>{isSuccess ? 'Deployed' : 'Failed'}</span>
                    <span className="text-xs opacity-75">
                        {formatTimeAgo(new Date(status.lastDeployment.startTime))}
                    </span>
                </div>
            );
        }

        return (
            <div className="flex items-center space-x-2 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full text-sm font-medium">
                <div className="h-3 w-3 bg-slate-400 rounded-full" />
                <span>Ready</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                {filteredProjects.length} projects
                            </div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                {connected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Top Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                Projects
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                                Manage and deploy your applications
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ossix-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Projects Grid */}
                <div className="grid gap-6">
                    {filteredProjects.map((project, index) => {
                        const status = getProjectStatus(project.name);

                        return (
                            <motion.div
                                key={project.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-ossix-200 dark:hover:border-ossix-800 transition-all duration-200 overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-ossix-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                <Activity className="h-6 w-6 text-white" />
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                                                    {project.displayName}
                                                </h3>
                                                <p className="text-slate-600 dark:text-slate-400 text-sm">
                                                    {project.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            {getStatusBadge(project.name)}
                                            <ChevronRight className="h-5 w-5 text-slate-400" />
                                        </div>
                                    </div>

                                    {/* Environment Status */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        {project.environments.map((env) => {
                                            const envDeployments = status.allDeployments.filter(d => d.environment === env.name);
                                            const isEnvDeploying = envDeployments.some(d => d.status === 'running');
                                            const lastEnvDeployment = envDeployments[0];

                                            return (
                                                <div key={env.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-750 rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`w-3 h-3 rounded-full ${isEnvDeploying ? 'bg-orange-500 animate-pulse' :
                                                                lastEnvDeployment?.status === 'success' ? 'bg-green-500' :
                                                                    lastEnvDeployment?.status === 'failed' ? 'bg-red-500' :
                                                                        'bg-slate-400'
                                                            }`} />
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                                                            {env.name}
                                                        </span>
                                                    </div>

                                                    {lastEnvDeployment && (
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            {formatTimeAgo(new Date(lastEnvDeployment.startTime))}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                                            <GitBranch className="h-4 w-4" />
                                            <span>{status.allDeployments.length} deployments</span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {/* Quick Deploy Button */}
                                            {/* <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    // Quick deploy to staging
                                                    const stagingEnv = project.environments.find(env => env.name === 'staging');
                                                    if (stagingEnv) {
                                                        // You can implement this later or connect to your existing deploy function
                                                        console.log('Quick deploy to staging for', project.name);
                                                    }
                                                }}
                                                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 transition-colors"
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                Quick Deploy
                                            </motion.button> */}

                                            {/* Manage Button - More Visible */}
                                            <Link href={`/projects/${project.name}`}>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-ossix-600 text-white hover:bg-ossix-700 border-2 border-ossix-500 hover:border-ossix-600 shadow-lg hover:shadow-xl transition-all"
                                                >
                                                    <Zap className="h-4 w-4 mr-2" />
                                                    Manage
                                                </motion.button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {filteredProjects.length === 0 && (
                    <div className="text-center py-12">
                        <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                            No projects found
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Try adjusting your search terms
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}