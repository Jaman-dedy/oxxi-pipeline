import { LogEntry } from '../types';

export class LogParsingService {
  static parseLogType(message: string): 'info' | 'error' | 'warning' | 'success' | 'progress' {
    const msg = message.toLowerCase();
    
    if (msg.includes('error') || msg.includes('failed') || msg.includes('fatal')) {
      return 'error';
    }
    if (msg.includes('warning') || msg.includes('warn') || msg.includes('vulnerabilities')) {
      return 'warning';
    }
    if (msg.includes('✓') || msg.includes('completed successfully') || msg.includes('done deploying')) {
      return 'success';
    }
    if (msg.includes('%') || msg.includes('progress') || msg.includes('installing') || msg.includes('building')) {
      return 'progress';
    }
    
    return 'info';
  }

  static detectDeploymentStep(message: string): string | undefined {
    const msg = message.toLowerCase();
    
    if (msg.includes('git') && (msg.includes('clone') || msg.includes('pull'))) {
      return 'Git Operations';
    }
    if (msg.includes('npm i') || msg.includes('installing')) {
      return 'Installing Dependencies';
    }
    if (msg.includes('build') || msg.includes('building')) {
      return 'Building Application';
    }
    if (msg.includes('pm2') || msg.includes('starting')) {
      return 'Starting Services';
    }
    if (msg.includes('ssh') || msg.includes('connecting')) {
      return 'Server Connection';
    }
    if (msg.includes('env') && msg.includes('variables')) {
      return 'Environment Setup';
    }
    
    return undefined;
  }

  static createLogEntry(
    type: LogEntry['type'], 
    message: string, 
    step?: string
  ): LogEntry {
    return {
      type,
      message,
      timestamp: new Date(),
      step
    };
  }
}