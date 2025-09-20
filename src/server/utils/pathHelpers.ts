// server/utils/pathHelpers.ts - Refactored for command-agnostic approach
import path from 'path';
import { SERVER_CONFIG } from '../../lib/config';

export class PathHelpers {
  // Get the configured scripts directory (no longer hardcoded to ossix-devops)
  static getScriptsRoot(): string {
    return path.resolve(SERVER_CONFIG.scriptsDirectory || './scripts');
  }

  // Resolve working directory - handle relative and absolute paths
  static resolveWorkingDirectory(workingDir?: string, basePath?: string): string {
    if (!workingDir) return process.cwd();
    
    // If absolute path, use as-is
    if (path.isAbsolute(workingDir)) {
      return workingDir;
    }
    
    // If relative path, resolve from basePath or current working directory
    const base = basePath || process.cwd();
    return path.resolve(base, workingDir);
  }

  // Extract directory from a command if it contains a path
  static extractDirectoryFromCommand(command: string): string | null {
    const parts = command.trim().split(/\s+/);
    const firstPart = parts[0];
    
    if (firstPart.includes('/')) {
      return path.dirname(path.resolve(firstPart));
    }
    
    return null;
  }

  // Validate that a path exists and is accessible
  static validatePath(filePath: string): { exists: boolean; isDirectory: boolean; isFile: boolean; error?: string } {
    try {
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      
      return {
        exists: true,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile()
      };
    } catch (error) {
      return {
        exists: false,
        isDirectory: false,
        isFile: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Normalize path separators for cross-platform compatibility
  static normalizePath(filePath: string): string {
    return path.normalize(filePath);
  }

  // Join paths safely
  static joinPaths(...paths: string[]): string {
    return path.join(...paths);
  }

  // Get relative path between two locations
  static getRelativePath(from: string, to: string): string {
    return path.relative(from, to);
  }

  // Parse command to extract executable and arguments
  static parseCommand(command: string): {
    executable: string;
    args: string[];
    hasPath: boolean;
    workingDir?: string;
  } {
    const trimmed = command.trim();
    const parts = trimmed.split(/\s+/);
    const executable = parts[0];
    const args = parts.slice(1);
    
    return {
      executable,
      args,
      hasPath: executable.includes('/'),
      workingDir: executable.includes('/') ? path.dirname(path.resolve(executable)) : undefined
    };
  }

  // Create directory if it doesn't exist (utility function)
  static ensureDirectory(dirPath: string): boolean {
    try {
      const fs = require('fs');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return true;
    } catch (error) {
      console.error(`Failed to create directory ${dirPath}:`, error);
      return false;
    }
  }

  // Get file extension
  static getFileExtension(filePath: string): string {
    return path.extname(filePath);
  }

  // Get filename without extension
  static getBaseName(filePath: string, includeExtension: boolean = true): string {
    return includeExtension ? path.basename(filePath) : path.basename(filePath, path.extname(filePath));
  }

  // Check if path is within allowed directory (security helper)
  static isPathWithinDirectory(targetPath: string, allowedDirectory: string): boolean {
    try {
      const resolvedTarget = path.resolve(targetPath);
      const resolvedAllowed = path.resolve(allowedDirectory);
      const relative = path.relative(resolvedAllowed, resolvedTarget);
      
      // If relative path starts with '..' or is absolute, it's outside the allowed directory
      return !relative.startsWith('..') && !path.isAbsolute(relative);
    } catch (error) {
      return false;
    }
  }

  // Legacy method for backward compatibility (deprecated)
  static getOssixDevopsRoot(): string {
    console.warn('⚠️ getOssixDevopsRoot() is deprecated. Use getScriptsRoot() instead.');
    return this.getScriptsRoot();
  }

  // Legacy method for backward compatibility (deprecated - no longer used)
  static getDeploymentScriptPath(project: string, isDeployAll: boolean): {
    scriptPath: string;
    fullScriptPath: string;
    workingDirectory: string;
  } {
    console.warn('⚠️ getDeploymentScriptPath() is deprecated. Commands should come from JSON configuration.');
    
    const scriptsRoot = this.getScriptsRoot();
    
    if (isDeployAll) {
      const scriptPath = `scripts/${project}/deploy_all.sh`;
      const fullScriptPath = path.join(scriptsRoot, 'scripts', project, 'deploy_all.sh');
      
      return {
        scriptPath,
        fullScriptPath,
        workingDirectory: scriptsRoot
      };
    } else {
      const fullScriptPath = path.join(scriptsRoot, 'scripts', project, 'deploy.sh');
      
      return {
        scriptPath: fullScriptPath,
        fullScriptPath,
        workingDirectory: process.cwd()
      };
    }
  }
}