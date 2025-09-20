// server/services/CommandService.ts
import fs from 'fs';
import { CommandData, ActiveCommand, LogEntry, CommandEvents } from '../types';
import { ProcessService } from './ProcessService';
import { LogParsingService } from './LogParsingService';
import { LogFileService } from './LogFileService';
import { SERVER_CONFIG } from '../../lib/config';

export class CommandService {
  private activeCommands = new Map<string, ActiveCommand>();
  private historicalCommands: ActiveCommand[] = [];
  private events: CommandEvents;

  constructor(events: CommandEvents) {
    this.events = events;
  }

  addHistoricalCommand(command: ActiveCommand): void {
    this.historicalCommands.unshift(command);

    if (this.historicalCommands.length > 100) {
      this.historicalCommands = this.historicalCommands.slice(0, 100);
    }
  }

  getHistoricalCommands(limit: number = 50): ActiveCommand[] {
    return this.historicalCommands.slice(0, limit);
  }

  getAllCommands(): ActiveCommand[] {
    return [...Array.from(this.activeCommands.values()), ...this.historicalCommands];
  }

  generateCommandId(name: string): string {
    const timestamp = Date.now();
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${sanitized}-${timestamp}`;
  }

  getActiveCommands(): ActiveCommand[] {
    return Array.from(this.activeCommands.values());
  }

  getCommand(commandId: string): ActiveCommand | undefined {
    return this.activeCommands.get(commandId) || 
           this.historicalCommands.find(cmd => cmd.id === commandId);
  }

  async getHistoricalLogs(commandId: string, date?: string): Promise<{ logs: LogEntry[], metadata: any } | null> {
    try {
      return await LogFileService.getCommandLogs(commandId, date);
    } catch (error) {
      console.error('❌ Error getting historical logs:', error);
      return null;
    }
  }

  async getAvailableLogDates(): Promise<string[]> {
    try {
      return await LogFileService.getAllLogDates();
    } catch (error) {
      console.error('❌ Error getting available log dates:', error);
      return [];
    }
  }

  async getLogsForDate(date: string): Promise<any[]> {
    try {
      return await LogFileService.getLogsForDate(date);
    } catch (error) {
      console.error('❌ Error getting logs for date:', error);
      return [];
    }
  }

  async searchLogs(filters: {
    query?: string;
    startDate?: string;
    endDate?: string;
    project?: string;
    environment?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    results: any[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      const { query, startDate, endDate, project, environment, status, limit = 50, offset = 0 } = filters;

      // Get date range to search
      let datesToSearch: string[] = [];

      if (startDate && endDate) {
        // Generate dates between startDate and endDate
        const start = new Date(startDate);
        const end = new Date(endDate);
        const current = new Date(start);

        while (current <= end) {
          datesToSearch.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
      } else if (startDate || endDate) {
        // Single date or recent dates
        datesToSearch = [startDate || endDate || new Date().toISOString().split('T')[0]];
      } else {
        // Default to recent dates
        datesToSearch = LogFileService.getRecentDates(7);
      }

      let allResults: any[] = [];

      // Search across all relevant dates
      for (const date of datesToSearch) {
        const dateCommands = await this.getLogsForDate(date);
        allResults = [...allResults, ...dateCommands];
      }

      // Apply filters
      let filteredResults = allResults.filter(cmd => {
        const matchesQuery = !query ||
          cmd.name.toLowerCase().includes(query.toLowerCase()) ||
          cmd.command?.toLowerCase().includes(query.toLowerCase());

        const matchesProject = !project || cmd.project === project;
        const matchesEnv = !environment || cmd.environment === environment;
        const matchesStatus = !status || cmd.status === status;

        return matchesQuery && matchesProject && matchesEnv && matchesStatus;
      });

      // Sort by most recent first
      filteredResults.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      const totalCount = filteredResults.length;
      const paginatedResults = filteredResults.slice(offset, offset + limit);

      return {
        results: paginatedResults,
        totalCount,
        hasMore: (offset + limit) < totalCount
      };
    } catch (error) {
      console.error('❌ Error searching logs:', error);
      return { results: [], totalCount: 0, hasMore: false };
    }
  }

  async getDeploymentStats(dateRange?: { startDate: string; endDate: string }): Promise<{
    totalDeployments: number;
    successRate: number;
    failureRate: number;
    avgDuration: number;
    projectStats: Record<string, any>;
    environmentStats: Record<string, any>;
    dailyStats: Record<string, any>;
  }> {
    try {
      let datesToAnalyze: string[] = [];

      if (dateRange) {
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        const current = new Date(start);

        while (current <= end) {
          datesToAnalyze.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
      } else {
        // Default to last 30 days
        datesToAnalyze = LogFileService.getRecentDates(30);
      }

      let allDeployments: any[] = [];
      const dailyStats: Record<string, any> = {};

      for (const date of datesToAnalyze) {
        const dateDeployments = await this.getLogsForDate(date);
        allDeployments = [...allDeployments, ...dateDeployments];

        dailyStats[date] = {
          total: dateDeployments.length,
          successful: dateDeployments.filter(d => d.status === 'success').length,
          failed: dateDeployments.filter(d => d.status === 'failed').length,
          stopped: dateDeployments.filter(d => d.status === 'stopped').length
        };
      }

      const totalDeployments = allDeployments.length;
      const successful = allDeployments.filter(d => d.status === 'success').length;
      const failed = allDeployments.filter(d => d.status === 'failed').length;

      // Calculate average duration (only for completed deployments)
      const completedDeployments = allDeployments.filter(d => d.duration);
      const avgDuration = completedDeployments.length > 0
        ? completedDeployments.reduce((sum, d) => sum + d.duration, 0) / completedDeployments.length
        : 0;

      // Project statistics
      const projectStats: Record<string, any> = {};
      const environmentStats: Record<string, any> = {};

      allDeployments.forEach(deployment => {
        // Project stats
        if (!projectStats[deployment.project]) {
          projectStats[deployment.project] = { total: 0, successful: 0, failed: 0, stopped: 0, interrupted: 0 };
        }
        projectStats[deployment.project].total++;

        if (deployment.status === 'success') {
          projectStats[deployment.project].successful++;
        } else if (deployment.status === 'failed') {
          projectStats[deployment.project].failed++;
        } else if (deployment.status === 'stopped') {
          projectStats[deployment.project].stopped++;
        } else if (deployment.status === 'interrupted') {
          projectStats[deployment.project].interrupted++;
        }

        // Environment stats
        if (!environmentStats[deployment.environment]) {
          environmentStats[deployment.environment] = { total: 0, successful: 0, failed: 0, stopped: 0, interrupted: 0 };
        }
        environmentStats[deployment.environment].total++;
       
        if (deployment.status === 'success') {
          environmentStats[deployment.environment].successful++;
        } else if (deployment.status === 'failed') {
          environmentStats[deployment.environment].failed++;
        } else if (deployment.status === 'stopped') {
          environmentStats[deployment.environment].stopped++;
        } else if (deployment.status === 'interrupted') {
          environmentStats[deployment.environment].interrupted++;
        }
      });

      return {
        totalDeployments,
        successRate: totalDeployments > 0 ? (successful / totalDeployments) * 100 : 0,
        failureRate: totalDeployments > 0 ? (failed / totalDeployments) * 100 : 0,
        avgDuration: Math.round(avgDuration / 1000), // Convert to seconds
        projectStats,
        environmentStats,
        dailyStats
      };
    } catch (error) {
      console.error('❌ Error getting deployment stats:', error);
      return {
        totalDeployments: 0,
        successRate: 0,
        failureRate: 0,
        avgDuration: 0,
        projectStats: {},
        environmentStats: {},
        dailyStats: {}
      };
    }
  }

  async startCommand(data: CommandData): Promise<string> {
    const commandId = this.generateCommandId(data.name);

    try {
      // Enhanced working directory validation and resolution
      const resolvedWorkingDir = this.resolveWorkingDirectory(data.workingDirectory);
      if (!fs.existsSync(resolvedWorkingDir)) {
        console.error('❌ Working directory not found:', resolvedWorkingDir);
        throw new Error(`Working directory not found: ${resolvedWorkingDir}`);
      }

      const command: ActiveCommand = {
        id: commandId,
        name: data.name,
        command: data.command, // Store exact command as provided
        workingDirectory: resolvedWorkingDir,
        environment: data.environment || 'command',
        project: data.project || 'global',
        status: 'running',
        startTime: new Date(),
        logs: [],
        currentStep: 'Initializing'
      };

      this.activeCommands.set(commandId, command);
      this.events.onStarted(command); 

      this.executeCommand(commandId, {
        ...data,
        workingDirectory: resolvedWorkingDir
      });

      return commandId;
    } catch (error) {
      console.error('💥 Error in startCommand:', error);
      throw error;
    }
  }

  async resumeCommand(commandId: string): Promise<boolean> {
    // Check if command exists in historical commands
    const historicalCommand = this.historicalCommands.find(cmd => cmd.id === commandId);

    if (!historicalCommand || historicalCommand.status !== 'interrupted') {
      throw new Error('Command not found or not in interrupted state');
    }

    // Move back to active commands with same ID
    const resumedCommand: ActiveCommand = {
      ...historicalCommand,
      status: 'running',
      currentStep: 'Resuming...',
      // Keep the same ID, startTime, and existing logs
      logs: [
        ...historicalCommand.logs,
        LogParsingService.createLogEntry(
          'info',
          '🔄 Resuming interrupted command...',
          'Resuming'
        )
      ]
    };

    // Remove from historical and add back to active
    this.historicalCommands = this.historicalCommands.filter(cmd => cmd.id !== commandId);
    this.activeCommands.set(commandId, resumedCommand);

    // Emit resume event
    this.events.onStarted(resumedCommand);

    // Continue execution from where it left off
    this.executeCommand(commandId, {
      name: resumedCommand.name || '',
      command: resumedCommand.command || '',
      workingDirectory: resumedCommand.workingDirectory || '',
      project: resumedCommand.project || '',
      environment: resumedCommand.environment || ''
    });

    return true;
  }

  stopCommand(commandId: string): boolean {
    const command = this.activeCommands.get(commandId);

    if (command && command.process) {
      command.process.kill('SIGTERM');
      command.status = 'stopped';
      command.endTime = new Date();

      const logEntry = LogParsingService.createLogEntry(
        'warning',
        '🛑 Command stopped by user',
        'Stopped'
      );

      command.logs.push(logEntry);
      this.events.onLog(commandId, logEntry);
      this.events.onStopped(commandId);

      // Write final metadata to file
      LogFileService.writeCommandMetadata(command);

      // Move to historical storage immediately
      this.historicalCommands.unshift({ ...command });
      this.activeCommands.delete(commandId);

      return true;
    }

    return false;
  }

  // Enhanced working directory resolution
  private resolveWorkingDirectory(workingDir?: string): string {
    if (!workingDir) return process.cwd();
    
    // If absolute path, use as-is
    if (require('path').isAbsolute(workingDir)) {
      return workingDir;
    }
    
    // If relative path, resolve from current working directory
    return require('path').resolve(process.cwd(), workingDir);
  }

  private executeCommand(commandId: string, data: CommandData): void {

    const command = this.activeCommands.get(commandId);
    if (!command) {
      console.error('❌ Command not found in activeCommands:', commandId);
      return;
    }

    // Add initial log
    const startLog = LogParsingService.createLogEntry(
      'info',
      `🚀 Starting: ${data.name}`,
      'Starting'
    );

    command.logs.push(startLog);
    this.events.onLog(commandId, startLog);

    // Add command details log
    const commandLog = LogParsingService.createLogEntry(
      'info',
      `💻 Command: ${data.command}`,
      'Command Details'
    );

    command.logs.push(commandLog);
    this.events.onLog(commandId, commandLog);

    // Write initial metadata to file
    LogFileService.writeCommandMetadata(command);

    // Spawn the command process - completely agnostic execution
    try {
      const process = ProcessService.spawnCommandProcess({
        command: data.command, // Execute EXACTLY what was passed in
        workingDirectory: data.workingDirectory,
        timeout: data.timeout || SERVER_CONFIG.maxCommandTimeout,
        onLog: (log: LogEntry) => {
          command.logs.push(log);
          command.currentStep = log.step || command.currentStep;
          this.events.onLog(commandId, log);
        },
        onComplete: (success: boolean, code: number | null) => {
          this.handleCommandComplete(commandId, success, code);
        },
        onError: (error: Error) => {
          console.error('💥 Process error:', error);
          this.handleCommandError(commandId, error);
        }
      });

      command.process = process;
    } catch (error) {
      console.error('❌ Failed to spawn process:', error);
      this.handleCommandError(commandId, error as Error);
    }
  }

  private handleCommandComplete(commandId: string, success: boolean, code: number | null): void {
    const command = this.activeCommands.get(commandId);
    if (!command) return;

    command.status = success ? 'success' : 'failed';
    command.endTime = new Date();
    command.process = undefined;

    // Write final metadata to file for recovery
    LogFileService.writeCommandMetadata(command);

    const completionLog = LogParsingService.createLogEntry(
      success ? 'success' : 'error',
      success
        ? `✅ Command completed successfully! (exit code: ${code})`
        : `❌ Command failed with exit code: ${code}`,
      success ? 'Completed' : 'Failed'
    );

    command.logs.push(completionLog);
    this.events.onLog(commandId, completionLog);

    const duration = command.endTime.getTime() - command.startTime.getTime();
    this.events.onCompleted(commandId, command.status, duration);

    // Move to historical storage
    this.historicalCommands.unshift({ ...command });

    // Clean up active commands after configured time
    setTimeout(() => {
      this.activeCommands.delete(commandId);
    }, 3600000); // 1 hour cleanup
  }

  private handleCommandError(commandId: string, error: Error): void {
    const command = this.activeCommands.get(commandId);
    if (!command) return;

    console.error('💥 Command error:', error);

    command.status = 'failed';
    command.endTime = new Date();

    const errorLog = LogParsingService.createLogEntry(
      'error',
      `💥 Command error: ${error.message}`,
      'Error'
    );

    command.logs.push(errorLog);
    this.events.onLog(commandId, errorLog);

    // Write error metadata to file
    LogFileService.writeCommandMetadata(command);

    const duration = command.endTime.getTime() - command.startTime.getTime();
    this.events.onCompleted(commandId, 'failed', duration);

    // Move to historical storage
    this.historicalCommands.unshift({ ...command });
    this.activeCommands.delete(commandId);
  }
}