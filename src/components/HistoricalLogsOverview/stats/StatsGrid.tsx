// components/StatsGrid.tsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface StatsGridProps {
  stats: any;
  statsLoading: boolean;
}

export function StatsGrid({ stats, statsLoading }: StatsGridProps) {
  if (statsLoading && !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="animate-pulse">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const formatDurationFromSeconds = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const statItems = [
    {
      icon: BarChart3,
      label: 'Total Deployments',
      value: stats.totalDeployments?.toLocaleString() || '0',
      color: 'blue',
      delay: 0
    },
    {
      icon: TrendingUp,
      label: 'Success Rate',
      value: `${stats.successRate?.toFixed(1) || '0'}%`,
      color: 'green',
      delay: 0.1
    },
    {
      icon: TrendingDown,
      label: 'Failure Rate',
      value: `${stats.failureRate?.toFixed(1) || '0'}%`,
      color: 'red',
      delay: 0.2
    },
    {
      icon: Clock,
      label: 'Avg Duration',
      value: formatDurationFromSeconds(stats.avgDuration || 0),
      color: 'purple',
      delay: 0.3
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-600 dark:text-blue-400' },
      green: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', icon: 'text-green-600 dark:text-green-400' },
      red: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', icon: 'text-red-600 dark:text-red-400' },
      purple: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', icon: 'text-purple-600 dark:text-purple-400' },
      indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', icon: 'text-indigo-600 dark:text-indigo-400' },
      yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400', icon: 'text-yellow-600 dark:text-yellow-400' },
      orange: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', icon: 'text-orange-600 dark:text-orange-400' },
      emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-600 dark:text-emerald-400' }
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => {
        const colors = getColorClasses(item.color);
        const Icon = item.icon;
        
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: item.delay }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`h-6 w-6 ${colors.icon}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}