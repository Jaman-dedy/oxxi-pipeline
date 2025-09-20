// services/ProjectConfigService.ts
import fs from 'fs';
import path from 'path';
import { ProjectConfig } from '../types';
import { SERVER_CONFIG } from '../../lib/config';

export class ProjectConfigService {
  private static configDir = path.join(process.cwd(), SERVER_CONFIG.configDirectory);
  private static cache = new Map<string, ProjectConfig>();
  private static lastLoadTime: number = 0;

  // Load all project configs from files
  static async loadAllProjects(): Promise<ProjectConfig[]> {
    try {
      if (!fs.existsSync(this.configDir)) {
        console.warn(`Config directory not found: ${this.configDir}`);
        return [];
      }

      const configFiles = fs.readdirSync(this.configDir)
        .filter(file => file.endsWith('.json'))
        .sort();

      const projects: ProjectConfig[] = [];

      for (const file of configFiles) {
        try {
          const project = await this.loadProjectFromFile(file);
          if (project) {
            projects.push(project);
          }
        } catch (error) {
          console.error(`Failed to load project config ${file}:`, error);
        }
      }

      this.lastLoadTime = Date.now();
      return projects;
    } catch (error) {
      console.error('❌ Failed to load project configurations:', error);
      return [];
    }
  }

  // Load individual project from file
  static async loadProjectFromFile(filename: string): Promise<ProjectConfig | null> {
    try {
      const filePath = path.join(this.configDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      const config: ProjectConfig = JSON.parse(content);
      
      // Validate the configuration
      if (this.validateConfig(config)) {
        this.cache.set(config.name, config);
        return config;
      } else {
        console.error(`Invalid configuration in ${filename}`);
        return null;
      }
    } catch (error) {
      console.error(`Failed to load project config ${filename}:`, error);
      return null;
    }
  }

  // Get specific project config
  static getProject(projectName: string): ProjectConfig | null {
    return this.cache.get(projectName) || null;
  }

  // Execute ANY project action - completely command-agnostic
  static async executeProjectAction(
    projectName: string, 
    action: 'deploy' | 'restart' | 'stop', 
    environment: 'staging' | 'production'
  ): Promise<{ command: string; workingDirectory: string; commandId: string }> {
    const project = this.getProject(projectName);
    if (!project) {
      throw new Error(`Project ${projectName} not found`);
    }

    const commandKey = `${action}_${environment}`;
    const command = project[commandKey as keyof ProjectConfig] as string;
    
    if (!command || typeof command !== 'string') {
      throw new Error(`Command '${commandKey}' not found for project ${projectName}`);
    }

    return {
      command, // Execute EXACTLY what's in the JSON - no modifications
      workingDirectory: this.resolveWorkingDirectory(project.workingDirectory),
      commandId: `${projectName}-${action}-${environment}-${Date.now()}`
    };
  }

  // Execute ANY command defined in project config (for custom commands)
  static async executeProjectCommand(
    projectName: string, 
    commandKey: string,
    variables?: Record<string, string>
  ): Promise<{ command: string; workingDirectory: string; commandId: string }> {
    const project = this.getProject(projectName);
    if (!project) {
      throw new Error(`Project ${projectName} not found`);
    }

    const rawCommand = project[commandKey as keyof ProjectConfig] as string;
    
    if (!rawCommand || typeof rawCommand !== 'string') {
      throw new Error(`Command '${commandKey}' not found for project ${projectName}`);
    }

    // Optional: Variable substitution in commands
    let finalCommand = rawCommand;
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        finalCommand = finalCommand.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
        finalCommand = finalCommand.replace(new RegExp(`\\$${key}\\b`, 'g'), value);
      });
    }

    return {
      command: finalCommand,
      workingDirectory: this.resolveWorkingDirectory(project.workingDirectory),
      commandId: `${projectName}-${commandKey}-${Date.now()}`
    };
  }

  // Get all available commands for a project
  static getAvailableCommands(projectName: string): string[] {
    const project = this.getProject(projectName);
    if (!project) return [];

    const excludedKeys = [
      'name', 'displayName', 'description', 'organization', 'host', 
      'app_name', 'repo_name', 'workingDirectory', 'production_url', 
      'staging_url', 'repository', 'ssh'
    ];

    return Object.keys(project).filter(key => 
      typeof project[key as keyof ProjectConfig] === 'string' &&
      !excludedKeys.includes(key)
    );
  }

  // Check if a specific command exists for a project
  static hasCommand(projectName: string, commandKey: string): boolean {
    const project = this.getProject(projectName);
    if (!project) return false;
    
    const command = project[commandKey as keyof ProjectConfig];
    return typeof command === 'string' && command.trim().length > 0;
  }

  // Get command for specific action and environment (backward compatibility)
  static getCommand(projectName: string, action: string, environment: string): string | null {
    const project = this.getProject(projectName);
    if (!project) {
      console.warn(`Project not found: ${projectName}`);
      return null;
    }

    const commandKey = `${action}_${environment}` as keyof ProjectConfig;
    const command = project[commandKey] as string;
    
    if (!command) {
      console.warn(`Command not found: ${action}_${environment} for project ${projectName}`);
      return null;
    }

    return command;
  }

  // Get all cached projects (synchronous)
  static getCachedProjects(): ProjectConfig[] {
    return Array.from(this.cache.values());
  }

  // Reload configurations (useful for API endpoint)
  static async reloadConfigs(): Promise<ProjectConfig[]> {
    this.cache.clear();
    return await this.loadAllProjects();
  }

  // Check if project exists
  static projectExists(projectName: string): boolean {
    return this.cache.has(projectName);
  }

  // Get project URL for environment
  static getProjectUrl(projectName: string, environment: string): string | null {
    const project = this.getProject(projectName);
    if (!project) return null;

    return environment === 'production' ? project.production_url || null : project.staging_url || null;
  }

  // Resolve working directory - handle relative and absolute paths
  private static resolveWorkingDirectory(workingDir?: string): string {
    if (!workingDir) return process.cwd();
    
    // If absolute path, use as-is
    if (path.isAbsolute(workingDir)) {
      return workingDir;
    }
    
    // If relative path, resolve from current working directory
    return path.resolve(process.cwd(), workingDir);
  }

  // Validate project configuration - now more flexible
  private static validateConfig(config: any): boolean {
    // Only validate absolutely essential fields
    const requiredFields = ['name', 'displayName', 'organization'];

    for (const field of requiredFields) {
      if (!config[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Check that there's at least one command defined
    const excludedKeys = [
      'name', 'displayName', 'description', 'organization', 'host', 
      'app_name', 'repo_name', 'workingDirectory', 'production_url', 
      'staging_url', 'repository', 'ssh'
    ];

    const commands = Object.keys(config).filter(key => 
      typeof config[key] === 'string' && !excludedKeys.includes(key)
    );

    if (commands.length === 0) {
      console.error(`No commands found in project config: ${config.name}`);
      return false;
    }

    return true;
  }

  // Get stats about loaded projects
  static getLoadStats(): {
    totalProjects: number;
    lastLoadTime: Date | null;
    organizations: string[];
    hosts: string[];
    totalCommands: number;
    commandsByProject: Record<string, string[]>;
  } {
    const projects = this.getCachedProjects();
    const organizations = [...new Set(projects.map(p => p.organization))];
    const hosts = [...new Set(projects.map(p => p.host).filter(Boolean))];
    
    let totalCommands = 0;
    const commandsByProject: Record<string, string[]> = {};
    
    projects.forEach(project => {
      const commands = this.getAvailableCommands(project.name);
      commandsByProject[project.name] = commands;
      totalCommands += commands.length;
    });

    return {
      totalProjects: projects.length,
      lastLoadTime: this.lastLoadTime ? new Date(this.lastLoadTime) : null,
      organizations: organizations as string[],
      hosts: hosts as string[],
      totalCommands,
      commandsByProject
    };
  }

  // Get project info including available commands (useful for debugging)
  static getProjectInfo(projectName: string): {
    project: ProjectConfig | null;
    commands: string[];
    workingDirectory: string;
  } | null {
    const project = this.getProject(projectName);
    if (!project) return null;

    return {
      project,
      commands: this.getAvailableCommands(projectName),
      workingDirectory: this.resolveWorkingDirectory(project.workingDirectory)
    };
  }
}