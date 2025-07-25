'use client';
import React, {JSX} from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  BarChart3, 
  Settings, 
  Users, 
  ChevronLeft,
  ChevronRight,
  Zap,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';
import { Logo } from './ui/Logo';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  currentView: string;
  onViewChange: (view: 'deployments' | 'analytics' | 'settings' | 'team') => void;
  stats: {
    running: number;
    successful: number;
    failed: number;
    total: number;
  };
}

export function Sidebar({ collapsed, onToggle, currentView, onViewChange, stats }: SidebarProps): JSX.Element {
  const menuItems = [
    {
      id: 'deployments',
      label: 'Deployments',
      icon: Activity,
      badge: stats.running > 0 ? stats.running : undefined,
      badgeColor: 'bg-orange-500'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      badge: undefined
    },
    {
      id: 'team',
      label: 'Team',
      icon: Users,
      badge: undefined
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: undefined
    }
  ];

  return (
    <motion.div
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <Logo size="md" showText={!collapsed} />
          <button
            onClick={onToggle}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Enhanced Stats Overview */}
      {!collapsed && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pipeline Status</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Live</span>
              </div>
            </div>
            
            {/* Main Stats Grid */}
            <div className="space-y-3">
              {/* Running Deployments */}
              <motion.div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-3 text-white shadow-lg"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Running</span>
                  </div>
                  {stats.running > 0 && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className="text-2xl font-bold mt-1">
                  {stats.running}
                </div>
                <div className="text-xs opacity-90">
                  Active deployments
                </div>
              </motion.div>

              {/* Success/Failed Grid */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div 
                  className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 text-white shadow-md"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className="h-3 w-3" />
                    <span className="text-xs font-medium">Success</span>
                  </div>
                  <div className="text-lg font-bold">
                    {stats.successful}
                  </div>
                </motion.div>
                
                <motion.div 
                  className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3 text-white shadow-md"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <XCircle className="h-3 w-3" />
                    <span className="text-xs font-medium">Failed</span>
                  </div>
                  <div className="text-lg font-bold">
                    {stats.failed}
                  </div>
                </motion.div>
              </div>
              
              {/* Total Summary */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 rounded-lg p-3 text-white shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">Total Deployments</span>
                  </div>
                  <GitBranch className="h-4 w-4 opacity-70" />
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-bold">
                    {stats.total}
                  </span>
                  <span className="text-xs opacity-80">
                    All time
                  </span>
                </div>
              </div>
            </div>

            {/* Success Rate */}
            {stats.total > 0 && (
              <div className="bg-slate-50 dark:bg-slate-750 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Success Rate</span>
                  <span className="text-xs font-bold text-green-600 dark:text-green-400">
                    {Math.round((stats.successful / stats.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.successful / stats.total) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onViewChange(item.id as any)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-ossix-100 to-ossix-50 text-ossix-700 dark:from-ossix-900/30 dark:to-ossix-800/20 dark:text-ossix-400 shadow-sm border border-ossix-200 dark:border-ossix-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && (
                  <>
                    <span className="ml-3 flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <motion.span 
                        className={`ml-2 px-2 py-0.5 text-xs font-medium text-white rounded-full ${item.badgeColor}`}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </>
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Enhanced User Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <motion.div 
          className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-750 dark:to-slate-700 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-ossix-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-bold">JD</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                John Doe
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                DevOps Engineer
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}