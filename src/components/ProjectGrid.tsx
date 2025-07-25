'use client';
import React, {JSX} from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Activity, 
  RefreshCw,
  Zap
} from 'lucide-react';
import { Project, Environment } from '@/lib/types';

interface ProjectGridProps {
  projects: Project[];
  deployingItems: Set<string>;
  connected: boolean;
  onDeploy: (project: string, environment: string, organization: string, host: string) => void;
  onDeployAll: (project: string) => void;
}

export function ProjectGrid({ 
  projects, 
  deployingItems, 
  connected, 
  onDeploy, 
  onDeployAll 
}: ProjectGridProps): JSX.Element {
  const getEnvironmentButtonVariant = (env: Environment): string => {
    const baseClasses = "inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105";
    
    switch (env.color) {
      case 'orange':
        return `${baseClasses} bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200 hover:border-orange-300`;
      case 'green':
        return `${baseClasses} bg-green-100 hover:bg-green-200 text-green-700 border border-green-200 hover:border-green-300`;
      case 'blue':
        return `${baseClasses} bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200 hover:border-blue-300`;
      case 'purple':
        return `${baseClasses} bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200 hover:border-purple-300`;
      case 'red':
        return `${baseClasses} bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 hover:border-red-300`;
      default:
        return `${baseClasses} bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 hover:border-gray-300`;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {projects.map((project, index) => (
        <motion.div
          key={project.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-ossix-200 dark:hover:border-ossix-800 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-ossix-600 dark:group-hover:text-ossix-400 transition-colors">
                  {project.displayName}
                </h3>
                <Activity className="h-4 w-4 text-slate-400 group-hover:text-ossix-500 transition-colors" />
              </div>
              {project.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            {project.environments.map((env) => {
              const deployKey = `${project.name}-${env.name}`;
              const isDeploying = deployingItems.has(deployKey);
              
              return (
                <div key={deployKey} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2.5 h-2.5 rounded-full bg-${env.color}-500 ring-2 ring-${env.color}-100`} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {env.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {env.organization}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => onDeploy(project.name, env.name, env.organization, env.host)}
                    disabled={!connected || isDeploying}
                    className={getEnvironmentButtonVariant(env) + ((!connected || isDeploying) ? ' opacity-50 cursor-not-allowed' : '')}
                  >
                    {isDeploying ? (
                      <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3 mr-1.5" />
                    )}
                    {isDeploying ? 'Deploying...' : 'Deploy'}
                  </button>
                </div>
              );
            })}
            
            {/* Deploy All Button */}
            <div className="pt-3 mt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => onDeployAll(project.name)}
                disabled={!connected}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-ossix-500 to-ossix-600 hover:from-ossix-600 hover:to-ossix-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                Deploy All Environments
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}