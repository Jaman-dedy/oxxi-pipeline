// server/services/CommandRecoveryService.ts
import fs from 'fs';
import path from 'path';
import { ActiveCommand } from '../types';
import { LogFileService } from './LogFileService';

export class CommandRecoveryService {
  private static logsDir = path.join(process.cwd(), 'logs');

  /**
   * Scan recent log folders and restore commands that were interrupted
   */
  static async restoreIncompleteCommands(): Promise<ActiveCommand[]> {
    
    try {
      const recentDates = LogFileService.getRecentDates(3); // Last 3 days
      const incompleteCommands: ActiveCommand[] = [];
      
      for (const date of recentDates) {
        const dateCommands = await this.scanDateForIncompleteCommands(date);
        incompleteCommands.push(...dateCommands);
      }
      
      return incompleteCommands;
      
    } catch (error) {
      console.error('❌ Error restoring incomplete commands:', error);
      return [];
    }
  }

  /**
   * Scan a specific date folder for incomplete commands
   */
  private static async scanDateForIncompleteCommands(date: string): Promise<ActiveCommand[]> {
    const dateDir = path.join(this.logsDir, date);
    
    if (!fs.existsSync(dateDir)) {
      return [];
    }

    const incompleteCommands: ActiveCommand[] = [];
    
    try {
      const files = fs.readdirSync(dateDir);
      const metadataFiles = files.filter(file => file.endsWith('-metadata.json'));
      
      for (const metadataFile of metadataFiles) {
        const metadataPath = path.join(dateDir, metadataFile);
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        
        // Check if command was incomplete (no endTime or status still 'running')
        const isIncomplete = !metadata.endTime || metadata.status === 'running';
        
        if (isIncomplete) {
          
          // Load the command logs from the log file
          const logs = await this.loadCommandLogs(metadata, dateDir);
          
          // Reconstruct the ActiveCommand
          const command: ActiveCommand = {
            id: metadata.id,
            name: metadata.name,
            command: metadata.command,
            workingDirectory: metadata.workingDirectory,
            project: metadata.project || 'global',
            environment: metadata.environment || 'command',
            status: 'interrupted',
            startTime: new Date(metadata.startTime),
            endTime: new Date(), // Set current time as recovery time
            logs: logs,
            currentStep: 'Recovered'
          };
          
          // Update the metadata file to mark as recovered
          await this.markCommandAsRecovered(metadataPath, metadata);
          
          incompleteCommands.push(command);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error scanning date ${date}:`, error);
    }
    
    return incompleteCommands;
  }

  /**
   * Load command logs from the log file
   */
  private static async loadCommandLogs(metadata: any, dateDir: string): Promise<any[]> {
    try {
      const logFilePath = path.join(dateDir, metadata.logFile);
      
      if (!fs.existsSync(logFilePath)) {
        console.warn(`⚠️ Log file not found: ${logFilePath}`);
        return [];
      }
      
      const logs = await LogFileService.readLogFile(logFilePath);
      
      // Add recovery log entry
      logs.push({
        type: 'warning',
        level: 'warning',
        message: '🔄 Command recovered from logs after server restart',
        timestamp: new Date(),
        step: 'Recovered'
      });
      
      return logs;
      
    } catch (error) {
      console.error('❌ Error loading command logs:', error);
      return [];
    }
  }

  /**
   * Update metadata file to mark command as recovered
   */
  private static async markCommandAsRecovered(metadataPath: string, metadata: any): Promise<void> {
    try {
      const updatedMetadata = {
        ...metadata,
        status: 'interrupted',
        endTime: new Date().toISOString(),
        recovered: true,
        recoveredAt: new Date().toISOString(),
        originalStatus: metadata.status
      };
      
      fs.writeFileSync(metadataPath, JSON.stringify(updatedMetadata, null, 2));
      
    } catch (error) {
      console.error('❌ Error updating metadata:', error);
    }
  }

  /**
   * Get summary of recovery statistics
   */
  static async getRecoveryStats(): Promise<{
    totalScanned: number;
    incompleteFound: number;
    datesScanned: string[];
    lastScanTime: Date;
  }> {
    const recentDates = LogFileService.getRecentDates(7);
    let totalScanned = 0;
    let incompleteFound = 0;
    
    for (const date of recentDates) {
      const logs = await LogFileService.getLogsForDate(date);
      totalScanned += logs.length;
      
      for (const metadata of logs) {
        if (!metadata.endTime || metadata.status === 'running') {
          incompleteFound++;
        }
      }
    }
    
    return {
      totalScanned,
      incompleteFound,
      datesScanned: recentDates,
      lastScanTime: new Date()
    };
  }
}