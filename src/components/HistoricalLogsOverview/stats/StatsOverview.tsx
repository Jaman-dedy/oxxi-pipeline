// components/stats/StatsOverview.tsx
import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { StatCard } from './StatCard';
import { DeploymentStats } from '@/hooks/useHistoricalLogs';

interface StatsOverviewProps {
  stats: DeploymentStats | null;
  loading: boolean;
}

export function StatsOverview({ stats, loading }: StatsOverviewProps) {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
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

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Deployments"
        value={stats.totalDeployments}
        icon={BarChart3}
        color="blue"
        delay={0}
      />
      
      <StatCard
        title="Success Rate"
        value={`${stats.successRate.toFixed(1)}%`}
        icon={TrendingUp}
        color="green"
        delay={0.1}
      />
      
      <StatCard
        title="Failure Rate"
        value={`${stats.failureRate.toFixed(1)}%`}
        icon={TrendingDown}
        color="red"
        delay={0.2}
      />
      
      <StatCard
        title="Avg Duration"
        value={formatDuration(stats.avgDuration)}
        icon={Clock}
        color="purple"
        delay={0.3}
      />
    </div>
  );
}