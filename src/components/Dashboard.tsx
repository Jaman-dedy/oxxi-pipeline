'use client';
import React, { useState, useMemo, JSX } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  RefreshCw,
  Filter,
  SortDesc
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { PROJECTS, type Environment } from '@/lib/types';
import { DeploymentCard } from './DeploymentCard';
import { LogViewer } from './LogViewer';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ProjectGrid } from './ProjectGrid';

export function Dashboard(): JSX.Element {
  const { connected, deployments, startDeployment, stopDeployment, clearDeployments } = useWebSocket();
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const [deployingItems, setDeployingItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'running' | 'success' | 'failed'>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'deployments' | 'analytics' | 'settings' | 'team'>('deployments');

  const stats = useMemo(() => ({
    running: deployments.filter(d => d.status === 'running').length,
    successful: deployments.filter(d => d.status === 'success').length,
    failed: deployments.filter(d => d.status === 'failed').length,
    stopped: deployments.filter(d => d.status === 'stopped').length,
    total: deployments.length
  }), [deployments]);

  const filteredProjects = useMemo(() => {
    if (!searchTerm) return PROJECTS;
    return PROJECTS.filter(project => 
      project.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const filteredDeployments = useMemo(() => {
    let filtered = deployments;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.status === filterStatus);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.environment.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [deployments, filterStatus, searchTerm]);

  const handleDeploy = async (project: string, environment: string, organization: string, host: string): Promise<void> => {
    const deployKey = `${project}-${environment}`;
    setDeployingItems(prev => new Set(prev).add(deployKey));
    
    try {
      await startDeployment({ project, environment, organization, host });
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

  const handleDeployAll = async (project: string): Promise<void> => {
    const projectConfig = PROJECTS.find(p => p.name === project);
    if (!projectConfig) return;

    for (const env of projectConfig.environments) {
      await handleDeploy(project, env.name, env.organization, env.host);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentView={currentView}
        onViewChange={setCurrentView}
        stats={stats}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar 
          connected={connected}
          stats={stats}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          onClearDeployments={clearDeployments}
          deploymentsCount={deployments.length}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentView === 'deployments' && (
              <>
                {/* Projects Grid */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Projects
                    </h2>
                    <div className="text-sm text-slate-500">
                      {filteredProjects.length} of {PROJECTS.length} projects
                    </div>
                  </div>
                  
                  <ProjectGrid 
                    projects={filteredProjects}
                    deployingItems={deployingItems}
                    connected={connected}
                    onDeploy={handleDeploy}
                    onDeployAll={handleDeployAll}
                  />
                </div>

                {/* Active Deployments */}
                {filteredDeployments.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        Recent Deployments
                      </h2>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {filteredDeployments.length} deployment{filteredDeployments.length !== 1 ? 's' : ''}
                        </div>
                        <button className="p-1 rounded text-slate-400 hover:text-slate-600">
                          <SortDesc className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      <AnimatePresence>
                        {filteredDeployments.map((deployment) => (
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
              </>
            )}

            {currentView === 'analytics' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h2>
                {/* Analytics content will go here */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
                  <p className="text-slate-500">Analytics dashboard coming soon...</p>
                </div>
              </div>
            )}

            {currentView === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
                {/* Settings content will go here */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
                  <p className="text-slate-500">Settings panel coming soon...</p>
                </div>
              </div>
            )}

            {currentView === 'team' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Team</h2>
                {/* Team content will go here */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
                  <p className="text-slate-500">Team management coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

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