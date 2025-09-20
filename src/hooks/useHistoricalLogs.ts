// hooks/useHistoricalLogs.ts
'use client';
import { useState, useCallback, useRef, useEffect } from 'react';

export interface HistoricalDeployment {
  id: string;
  name: string;
  project: string;
  environment: string;
  status: 'success' | 'failed' | 'stopped' | 'interrupted' | 'running';
  startTime: string;
  endTime?: string;
  duration?: number;
  totalLogs: number;
  command?: string;
  workingDirectory?: string;
  userId?: string;
  branch?: string;
  commitHash?: string;
  deploymentSize?: number;
  errorMessage?: string;
}

export interface DeploymentStats {
  totalDeployments: number;
  successRate: number;
  failureRate: number;
  avgDuration: number;
  weeklyDeployments: number;
  fastestDuration: number;
  slowestDuration: number;
  weeklyFailures: number;
  reliabilityScore: number;
  projectStats: Record<string, {
    total: number;
    success: number;
    failed: number;
    avgDuration: number;
  }>;
  environmentStats: Record<string, {
    total: number;
    success: number;
    failed: number;
    avgDuration: number;
  }>;
  dailyStats: Array<{
    date: string;
    total: number;
    success: number;
    failed: number;
    avgDuration: number;
  }>;
  hourlyDistribution: Record<string, number>;
  trendData: {
    deploymentTrend: Array<{ date: string; count: number }>;
    successRateTrend: Array<{ date: string; rate: number }>;
    durationTrend: Array<{ date: string; avgDuration: number }>;
  };
}

export interface LogEntry {
  type: 'info' | 'error' | 'warning' | 'success' | 'progress' | 'debug' | 'level';
  level?: string;
  message: string;
  timestamp: Date;
  step?: string;
  metadata?: Record<string, any>;
  source?: string;
  stackTrace?: string;
}

export interface SearchFilters {
  query?: string;
  startDate?: string;
  endDate?: string;
  project?: string;
  environment?: string;
  status?: string;
  userId?: string;
  branch?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'startTime' | 'duration' | 'status' | 'project' | 'environment';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResults {
  results: HistoricalDeployment[];
  totalCount: number;
  hasMore: boolean;
  pagination: {
    limit: number;
    offset: number;
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface UseHistoricalLogsReturn {
  deployments: HistoricalDeployment[];
  stats: DeploymentStats | null;
  availableDates: string[];
  loading: boolean;
  statsLoading: boolean;
  datesLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  searchDeployments: (filters: SearchFilters) => Promise<SearchResults | null>;
  getDeploymentLogs: (id: string, date?: string) => Promise<{ logs: LogEntry[], metadata: any } | null>;
  getStats: (dateRange?: { startDate: string; endDate: string }) => Promise<DeploymentStats | null>;
  getAvailableDates: () => Promise<string[]>;
  exportDeployments: (filters: SearchFilters, format: 'csv' | 'json') => Promise<Blob | null>;
  retryRequest: () => Promise<void>;
  clearCache: () => void;
  clearError: () => void;
}

export function useHistoricalLogs(): UseHistoricalLogsReturn {
  const [deployments, setDeployments] = useState<HistoricalDeployment[]>([]);
  const [stats, setStats] = useState<DeploymentStats | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [datesLoading, setDatesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache for API responses
  const cache = useRef(new Map<string, CacheEntry<any>>());
  const abortControllers = useRef(new Map<string, AbortController>());

  // Retry state
  const [lastFailedRequest, setLastFailedRequest] = useState<() => Promise<void> | null>();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  // Helper function to check cache
  const getCachedData = useCallback(<T>(key: string): T | null => {
    const entry = cache.current.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      cache.current.delete(key);
      return null;
    }

    return entry.data as T;
  }, []);

  // Helper function to set cache
  const setCachedData = useCallback(<T>(key: string, data: T, ttl: number = CACHE_TTL) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }, [CACHE_TTL]);

  // Enhanced error handling
  const handleApiError = useCallback((error: any, context: string): string => {
    console.error(`${context} error:`, error);

    if (error.name === 'AbortError') {
      return 'Request was cancelled';
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return 'Network error - please check your connection';
    }

    if (error.message.includes('404')) {
      return 'Resource not found';
    }

    if (error.message.includes('401') || error.message.includes('403')) {
      return 'Authentication error - please refresh and try again';
    }

    if (error.message.includes('429')) {
      return 'Too many requests - please wait a moment';
    }

    if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      return 'Server error - please try again later';
    }

    return error instanceof Error ? error.message : 'An unexpected error occurred';
  }, []);

  // Enhanced search with caching and abort control
  const searchDeployments = useCallback(async (filters: SearchFilters): Promise<SearchResults | null> => {
    const requestId = 'search';

    try {
      setLoading(true);
      setError(null);

      // Cancel previous request
      if (abortControllers.current.has(requestId)) {
        abortControllers.current.get(requestId)?.abort();
      }

      // Create new abort controller
      const controller = new AbortController();
      abortControllers.current.set(requestId, controller);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      // Check cache first (for quick filters)
      const cacheKey = `search-${params.toString()}`;
      const cachedData = getCachedData<SearchResults>(cacheKey);
      if (cachedData) {
        setDeployments(cachedData.results);
        setLastUpdated(new Date());
        return cachedData;
      }

      const response = await fetch(`${API_BASE_URL}/api/logs/search?${params}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const results: SearchResults = {
        results: data.results || [],
        totalCount: data.totalCount || 0,
        hasMore: data.hasMore || false,
        pagination: {
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          totalPages: Math.ceil((data.totalCount || 0) / (filters.limit || 50)),
          currentPage: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
          hasMore: data.hasMore || false
        }
      };

      setDeployments(results.results);
      setLastUpdated(new Date());

      // Cache the results
      setCachedData(cacheKey, results);

      // Store successful request for retry
      setLastFailedRequest(() => async () => {
        await searchDeployments(filters)
      });

      return results;
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = handleApiError(err, 'Search deployments');
        setError(errorMessage);

        // Store failed request for retry
        setLastFailedRequest(() => async () => {
          await searchDeployments(filters)
        });
      }
      return null;
    } finally {
      setLoading(false);
      abortControllers.current.delete(requestId);
    }
  }, [getCachedData, setCachedData, handleApiError]);

  // Enhanced logs fetching with streaming support
  const getDeploymentLogs = useCallback(async (
    id: string,
    date?: string
  ): Promise<{ logs: LogEntry[], metadata: any } | null> => {
    const requestId = `logs-${id}`;

    try {
      setError(null);

      // Cancel previous request
      if (abortControllers.current.has(requestId)) {
        abortControllers.current.get(requestId)?.abort();
      }

      const controller = new AbortController();
      abortControllers.current.set(requestId, controller);

      const params = new URLSearchParams();
      if (date) params.append('date', date);

      // Check cache first
      const cacheKey = `logs-${id}-${date || 'latest'}`;
      const cachedData = getCachedData<{ logs: LogEntry[], metadata: any }>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await fetch(`${API_BASE_URL}/api/commands/${id}/logs?${params}`, {
        signal: controller.signal
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Deployment logs not found');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const logs = data.logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));

      const result = {
        logs,
        metadata: data.command
      };

      // Cache the logs (shorter TTL for logs as they might change)
      setCachedData(cacheKey, result, 2 * 60 * 1000); // 2 minutes

      return result;
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = handleApiError(err, 'Get deployment logs');
        setError(errorMessage);
      }
      return null;
    } finally {
      abortControllers.current.delete(requestId);
    }
  }, [API_BASE_URL, getCachedData, setCachedData, handleApiError]);

  // Enhanced stats with better caching
  const getStats = useCallback(async (
    dateRange?: { startDate: string; endDate: string }
  ): Promise<DeploymentStats | null> => {
    const requestId = 'stats';

    try {
      setStatsLoading(true);
      setError(null);

      // Cancel previous request
      if (abortControllers.current.has(requestId)) {
        abortControllers.current.get(requestId)?.abort();
      }

      const controller = new AbortController();
      abortControllers.current.set(requestId, controller);

      const params = new URLSearchParams();
      if (dateRange) {
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);
      }

      // Check cache
      const cacheKey = `stats-${params.toString()}`;
      const cachedData = getCachedData<DeploymentStats>(cacheKey);
      if (cachedData) {
        setStats(cachedData);
        return cachedData;
      }


      const response = await fetch(`${API_BASE_URL}/api/logs/stats?${params}`, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const statsData = data.stats || data;

      // Ensure all required fields exist with defaults
      const normalizedStats: DeploymentStats = {
        totalDeployments: statsData.totalDeployments || 0,
        successRate: statsData.successRate || 0,
        failureRate: statsData.failureRate || 0,
        avgDuration: statsData.avgDuration || 0,
        weeklyDeployments: statsData.weeklyDeployments || 0,
        fastestDuration: statsData.fastestDuration || 0,
        slowestDuration: statsData.slowestDuration || 0,
        weeklyFailures: statsData.weeklyFailures || 0,
        reliabilityScore: statsData.reliabilityScore || 0,
        projectStats: statsData.projectStats || {},
        environmentStats: statsData.environmentStats || {},
        dailyStats: statsData.dailyStats || [],
        hourlyDistribution: statsData.hourlyDistribution || {},
        trendData: statsData.trendData || {
          deploymentTrend: [],
          successRateTrend: [],
          durationTrend: []
        }
      };

      setStats(normalizedStats);
      setCachedData(cacheKey, normalizedStats);

      return normalizedStats;
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = handleApiError(err, 'Get stats');
        setError(errorMessage);
      }
      return null;
    } finally {
      setStatsLoading(false);
      abortControllers.current.delete(requestId);
    }
  }, [API_BASE_URL, getCachedData, setCachedData, handleApiError]);

  // Enhanced available dates with caching
  const getAvailableDates = useCallback(async (): Promise<string[]> => {
    const requestId = 'dates';

    try {
      setDatesLoading(true);
      setError(null);

      // Check cache first
      const cacheKey = 'available-dates';
      const cachedData = getCachedData<string[]>(cacheKey);
      if (cachedData) {
        setAvailableDates(cachedData);
        return cachedData;
      }

      // Cancel previous request
      if (abortControllers.current.has(requestId)) {
        abortControllers.current.get(requestId)?.abort();
      }

      const controller = new AbortController();
      abortControllers.current.set(requestId, controller);

      const response = await fetch(`${API_BASE_URL}/api/logs/dates`, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const dates = data.dates || [];

      setAvailableDates(dates);
      setCachedData(cacheKey, dates, 10 * 60 * 1000); // 10 minutes cache for dates

      return dates;
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = handleApiError(err, 'Get available dates');
        setError(errorMessage);
      }
      return [];
    } finally {
      setDatesLoading(false);
      abortControllers.current.delete(requestId);
    }
  }, [API_BASE_URL, getCachedData, setCachedData, handleApiError]);

  // New export functionality
  const exportDeployments = useCallback(async (
    filters: SearchFilters,
    format: 'csv' | 'json'
  ): Promise<Blob | null> => {
    try {
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      params.append('format', format);

      const response = await fetch(`${API_BASE_URL}/api/logs/export?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (err) {
      const errorMessage = handleApiError(err, 'Export deployments');
      setError(errorMessage);
      return null;
    }
  }, [API_BASE_URL, handleApiError]);

  // Retry functionality
  const retryRequest = useCallback(async (): Promise<void> => {
    if (lastFailedRequest) {
      await lastFailedRequest();
    }
  }, [lastFailedRequest]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel all pending requests
      abortControllers.current.forEach(controller => controller.abort());
      abortControllers.current.clear();
    };
  }, []);

  return {
    deployments,
    stats,
    availableDates,
    loading,
    statsLoading,
    datesLoading,
    error,
    lastUpdated,
    searchDeployments,
    getDeploymentLogs,
    getStats,
    getAvailableDates,
    exportDeployments,
    retryRequest,
    clearCache,
    clearError
  };
}