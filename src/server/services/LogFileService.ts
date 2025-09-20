import fs from 'fs';
import path from 'path';
import { LogEntry, ActiveCommand } from '../types';

export class LogFileService {
  private static logsDir = path.join(process.cwd(), 'logs');

  static async initializeLogsDirectory(): Promise<void> {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
    } catch (error) {
      console.error('❌ Failed to create logs directory:', error);
    }
  }

  static getLogFileName(command: ActiveCommand): string {
    const date = command.startTime.toISOString().split('T')[0]; 
    const time = command.startTime.toTimeString().split(' ')[0].replace(/:/g, '-'); 
    const sanitizedName = command?.name?.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    return `command-${sanitizedName}-${command.environment}-${time}.log`;
  }

  static getLogFilePath(command: ActiveCommand): string {
    const date = command.startTime.toISOString().split('T')[0];
    const dateDir = path.join(this.logsDir, date);
    
    // Create date directory if it doesn't exist
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }
    
    const fileName = this.getLogFileName(command);
    return path.join(dateDir, fileName);
  }

  static async writeLogEntry(command: ActiveCommand, logEntry: LogEntry): Promise<void> {
    try {
      const logFilePath = this.getLogFilePath(command);
      const timestamp = new Date().toISOString();
      
      // Format log entry for file
      const logLine = JSON.stringify({
        timestamp,
        commandId: command.id,
        commandName: command.name,
        project: command.project,
        environment: command.environment,
        level: logEntry.level,
        message: logEntry.message,
        step: logEntry.step,
        timestamp_log: logEntry.timestamp
      }) + '\n';

      // Append to file (create if doesn't exist)
      fs.appendFileSync(logFilePath, logLine);
      
    } catch (error) {
      console.error('❌ Failed to write log to file:', error);
    }
  }

  static async writeCommandMetadata(command: ActiveCommand): Promise<void> {
    try {
      const logFilePath = this.getLogFilePath(command);
      const metadataDir = path.dirname(logFilePath);
      const metadataFile = path.join(metadataDir, `${command.id}-metadata.json`);
      
      const metadata = {
        id: command.id,
        name: command.name,
        command: command.command,
        workingDirectory: command.workingDirectory,
        project: command.project,
        environment: command.environment,
        status: command.status,
        startTime: command.startTime,
        endTime: command.endTime,
        duration: command.endTime ? command.endTime.getTime() - command.startTime.getTime() : null,
        logFile: path.basename(logFilePath),
        totalLogs: command.logs.length
      };

      fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('❌ Failed to write metadata:', error);
    }
  }

  static async readLogFile(filePath: string): Promise<LogEntry[]> {
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line);
      
      return lines.map(line => {
        const parsed = JSON.parse(line);
        return {
          type: parsed.type,
          level: parsed.level,
          message: parsed.message,
          timestamp: new Date(parsed.timestamp_log),
          step: parsed.step
        };
      });
    } catch (error) {
      console.error('❌ Failed to read log file:', error);
      return [];
    }
  }

  static async getCommandLogs(commandId: string, date?: string): Promise<{ logs: LogEntry[], metadata: any } | null> {
    try {
      // If no date provided, search recent dates
      const searchDates = date ? [date] : this.getRecentDates(7);
      
      for (const searchDate of searchDates) {
        const dateDir = path.join(this.logsDir, searchDate);
        if (!fs.existsSync(dateDir)) continue;
        
        const metadataFile = path.join(dateDir, `${commandId}-metadata.json`);
        if (fs.existsSync(metadataFile)) {
          const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
          const logFilePath = path.join(dateDir, metadata.logFile);
          const logs = await this.readLogFile(logFilePath);
          
          return { logs, metadata };
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get command logs:', error);
      return null;
    }
  }

  static getRecentDates(days: number): string[] {
    const dates = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  static async getAllLogDates(): Promise<string[]> {
    try {
      if (!fs.existsSync(this.logsDir)) {
        return [];
      }

      const entries = fs.readdirSync(this.logsDir);
      return entries
        .filter(entry => {
          const fullPath = path.join(this.logsDir, entry);
          return fs.statSync(fullPath).isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry);
        })
        .sort()
        .reverse(); // Most recent first
    } catch (error) {
      console.error('❌ Failed to get log dates:', error);
      return [];
    }
  }

  static async getLogsForDate(date: string): Promise<any[]> {
    try {
      const dateDir = path.join(this.logsDir, date);
      if (!fs.existsSync(dateDir)) {
        return [];
      }

      const files = fs.readdirSync(dateDir)
        .filter(file => file.endsWith('-metadata.json'))
        .map(file => {
          const content = fs.readFileSync(path.join(dateDir, file), 'utf-8');
          return JSON.parse(content);
        })
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      return files;
    } catch (error) {
      console.error('❌ Failed to get logs for date:', error);
      return [];
    }
  }
}