import { spawn, ChildProcess } from 'child_process';
import { LogEntry } from '../types';
import { LogParsingService } from './LogParsingService';

export interface ProcessOptions {
  scriptPath: string;
  args: string[];
  workingDirectory: string;
  useCommandString?: boolean;
  onLog: (log: LogEntry) => void;
  onComplete: (success: boolean, code: number | null) => void;
  onError: (error: Error) => void;
}

// NEW: Generic command interface
export interface CommandProcessOptions {
  command: string;
  workingDirectory: string;
  timeout?: number; // Optional timeout in milliseconds
  onLog: (log: LogEntry) => void;
  onComplete: (success: boolean, code: number | null) => void;
  onError: (error: Error) => void;
}

export class ProcessService {
  // Keep backward compatibility for existing deployments
  static spawnDeploymentProcess(options: ProcessOptions): ChildProcess {
    const { scriptPath, args, workingDirectory, useCommandString = false, onLog, onComplete, onError } = options;
    
    let deployProcess: ChildProcess;
    
    if (useCommandString) {
      deployProcess = spawn('bash', ['-c', scriptPath], {
        cwd: workingDirectory,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });
    } else {
      deployProcess = spawn('bash', [scriptPath, ...args], {
        cwd: workingDirectory,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });
    }

    return this.setupProcessHandlers(deployProcess, onLog, onComplete, onError);
  }

  // NEW: Generic command processor - this is the future!
  static spawnCommandProcess(options: CommandProcessOptions): ChildProcess {
    const { command, workingDirectory, timeout, onLog, onComplete, onError } = options;
    
    // Parse command - handle both simple commands and complex ones
    const commandProcess = spawn('bash', ['-c', command], {
      cwd: workingDirectory,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
      // Set timeout if provided
      timeout: timeout || 0 // 0 = no timeout
    });

    // Handle timeout if specified
    let timeoutHandle: NodeJS.Timeout | null = null;
    if (timeout && timeout > 0) {
      timeoutHandle = setTimeout(() => {
        onLog(LogParsingService.createLogEntry('warning', `⏰ Command timeout after ${timeout}ms`, 'Timeout'));
        commandProcess.kill('SIGKILL');
        onError(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);
    }

    // Setup handlers and clear timeout on completion
    return this.setupProcessHandlers(
      commandProcess, 
      onLog, 
      (success, code) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        onComplete(success, code);
      }, 
      (error) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        onError(error);
      }
    );
  }

  // Shared handler setup for both deployment and generic commands
  private static setupProcessHandlers(
    process: ChildProcess,
    onLog: (log: LogEntry) => void,
    onComplete: (success: boolean, code: number | null) => void,
    onError: (error: Error) => void
  ): ChildProcess {
    let currentStep: string | undefined = 'Initializing';

    // Handle stdout (main output)
    process.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      const lines = output.split('\n').filter(line => line.trim());

      lines.forEach(line => {
        if (line.trim()) {
          const logType = LogParsingService.parseLogType(line);
          const step = LogParsingService.detectDeploymentStep(line) || currentStep;
          
          if (step && step !== currentStep) {
            currentStep = step;
            onLog(LogParsingService.createLogEntry('info', `📋 ${step}...`, step));
          }

          onLog(LogParsingService.createLogEntry(logType, line, currentStep));
        }
      });
    });

    // Handle stderr (errors and warnings)
    process.stderr?.on('data', (data: Buffer) => {
      const output = data.toString();
      const lines = output.split('\n').filter(line => line.trim());

      lines.forEach(line => {
        if (line.trim()) {
          onLog(LogParsingService.createLogEntry('error', line, currentStep || 'Error'));
        }
      });
    });

    // Handle process completion
    process.on('close', (code: number | null) => {
      const success = code === 0;
      onComplete(success, code);
    });

    // Handle process errors
    process.on('error', (error: Error) => {
      onError(error);
    });

    return process;
  }

  // Utility method to validate commands (security check)
  static isCommandSafe(command: string): { safe: boolean; reason?: string } {
    // Basic security checks - you can expand this
    const dangerousPatterns = [
      /rm\s+-rf\s+\//, // rm -rf /
      />\s*\/dev\/sda/, // writing to disk
      /mkfs/, // format filesystem
      /fdisk/, // disk partitioning
      /dd\s+if=.*of=\/dev/, // disk imaging to device
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        return { 
          safe: false, 
          reason: `Command contains potentially dangerous pattern: ${pattern.source}` 
        };
      }
    }

    return { safe: true };
  }

  // Utility to parse complex commands
  static parseCommand(command: string): {
    baseCommand: string;
    args: string[];
    hasChaining: boolean;
    hasPipes: boolean;
  } {
    return {
      baseCommand: command.split(/[\s;&|]+/)[0],
      args: command.split(/\s+/).slice(1),
      hasChaining: /[;&]/.test(command),
      hasPipes: /\|/.test(command)
    };
  }
}