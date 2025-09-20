// routes/api.ts - Fully updated for command-agnostic execution
import express from 'express';
import { CommandService } from '../services/CommandService';
import { ProjectConfigService } from '../services/ProjectConfigService';
import { CommandData, ProjectActionRequest, ProjectActionResponse } from '../types';
import { ProcessService } from '../services/ProcessService';

export function createApiRoutes(commandService: CommandService): express.Router {
  const router = express.Router();

  // ===== PROJECT MANAGEMENT ENDPOINTS =====
  
  // Get all projects
  router.get('/projects', async (req, res) => {
    try {
      const projects = await ProjectConfigService.loadAllProjects();
      const stats = ProjectConfigService.getLoadStats();
      
      res.json({
        projects,
        totalProjects: projects.length,
        totalCommands: stats.totalCommands,
        commandsByProject: stats.commandsByProject,
        organizations: stats.organizations,
        hosts: stats.hosts,
        lastLoaded: stats.lastLoadTime
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to load projects',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get specific project with available commands
  router.get('/projects/:projectName', (req, res) => {
    try {
      const projectInfo = ProjectConfigService.getProjectInfo(req.params.projectName);
      if (!projectInfo) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json({
        ...projectInfo.project,
        availableCommands: projectInfo.commands,
        workingDirectory: projectInfo.workingDirectory
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get project',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Execute standard project action (deploy, restart, stop)
  router.post('/projects/:projectName/actions/:action', async (req, res) => {
    try {
      const { projectName, action } = req.params;
      const { environment, variables }: ProjectActionRequest & { variables?: Record<string, string> } = req.body;
      
      // Validate environment
      if (!environment || !['staging', 'production'].includes(environment)) {
        return res.status(400).json({ 
          error: 'Invalid environment. Must be "staging" or "production"' 
        });
      }

      // Validate action
      if (!['deploy', 'restart', 'stop'].includes(action)) {
        return res.status(400).json({ 
          error: 'Invalid action. Must be "deploy", "restart", or "stop"' 
        });
      }

      // Use the enhanced executeProjectAction method
      const { command, workingDirectory, commandId } = await ProjectConfigService.executeProjectAction(
        projectName,
        action as 'deploy' | 'restart' | 'stop',
        environment as 'staging' | 'production'
      );

      // Get project for display name
      const project = ProjectConfigService.getProject(projectName);
      const displayName = project?.displayName || projectName;

      // Create command data
      const commandData: CommandData = {
        name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${displayName} - ${environment}`,
        command, // Execute EXACTLY what's in the JSON
        workingDirectory,
        project: projectName,
        environment
      };

      // Security check
      const safety = ProcessService.isCommandSafe(command);
      if (!safety.safe) {
        return res.status(400).json({ 
          error: 'Command rejected for security reasons', 
          reason: safety.reason,
          command: command 
        });
      }

      // Execute the command
      const executedCommandId = await commandService.startCommand(commandData);
      
      const response: ProjectActionResponse = {
        message: `${action} started successfully`,
        commandId: executedCommandId,
        action: action as any,
        environment,
        project: projectName,
        command: command // Include the actual command being executed
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({ 
        error: `Failed to execute ${req.params.action}`,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Execute ANY custom project command
  router.post('/projects/:projectName/commands/:commandKey', async (req, res) => {
    try {
      const { projectName, commandKey } = req.params;
      const { variables } = req.body;

      // Check if the command exists
      if (!ProjectConfigService.hasCommand(projectName, commandKey)) {
        return res.status(404).json({ 
          error: `Command '${commandKey}' not found for project ${projectName}`,
          availableCommands: ProjectConfigService.getAvailableCommands(projectName)
        });
      }

      // Execute the custom command
      const { command, workingDirectory, commandId } = await ProjectConfigService.executeProjectCommand(
        projectName,
        commandKey,
        variables
      );

      // Get project for display name
      const project = ProjectConfigService.getProject(projectName);
      const displayName = project?.displayName || projectName;

      // Create command data
      const commandData: CommandData = {
        name: `${commandKey} - ${displayName}`,
        command, // Execute EXACTLY what's in the JSON
        workingDirectory,
        project: projectName,
        environment: variables?.environment || 'custom'
      };

      // Security check
      const safety = ProcessService.isCommandSafe(command);
      if (!safety.safe) {
        return res.status(400).json({ 
          error: 'Command rejected for security reasons', 
          reason: safety.reason,
          command: command 
        });
      }

      // Execute the command
      const executedCommandId = await commandService.startCommand(commandData);
      
      res.json({
        message: `${commandKey} started successfully`,
        commandId: executedCommandId,
        commandKey,
        project: projectName,
        command: command
      });
    } catch (error) {
      res.status(500).json({ 
        error: `Failed to execute command ${req.params.commandKey}`,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get available commands for a project
  router.get('/projects/:projectName/commands', (req, res) => {
    try {
      const commands = ProjectConfigService.getAvailableCommands(req.params.projectName);
      const project = ProjectConfigService.getProject(req.params.projectName);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json({
        project: req.params.projectName,
        commands,
        totalCommands: commands.length,
        standardActions: commands.filter(cmd => 
          cmd.includes('deploy_') || cmd.includes('restart_') || cmd.includes('stop_')
        ),
        customCommands: commands.filter(cmd => 
          !cmd.includes('deploy_') && !cmd.includes('restart_') && !cmd.includes('stop_')
        )
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get project commands',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Reload project configurations
  router.post('/projects/reload', async (req, res) => {
    try {
      const projects = await ProjectConfigService.reloadConfigs();
      const stats = ProjectConfigService.getLoadStats();
      
      res.json({ 
        message: 'Project configurations reloaded successfully',
        totalProjects: projects.length,
        totalCommands: stats.totalCommands,
        projects: projects.map(p => ({ 
          name: p.name, 
          displayName: p.displayName,
          commands: ProjectConfigService.getAvailableCommands(p.name).length
        }))
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to reload configurations',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get project URL for preview
  router.get('/projects/:projectName/url/:environment', (req, res) => {
    try {
      const { projectName, environment } = req.params;
      
      if (!['staging', 'production'].includes(environment)) {
        return res.status(400).json({ error: 'Invalid environment' });
      }

      const url = ProjectConfigService.getProjectUrl(projectName, environment);
      if (!url) {
        return res.status(404).json({ error: 'URL not configured for this environment' });
      }

      res.json({ url, environment, project: projectName });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get project URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ===== ENHANCED SYSTEM ENDPOINTS =====

  router.get('/health', (req, res) => {
    const stats = ProjectConfigService.getLoadStats();
    res.json({
      status: 'healthy',
      activeCommands: commandService.getActiveCommands().length,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      projects: {
        total: stats.totalProjects,
        totalCommands: stats.totalCommands,
        organizations: stats.organizations,
        hosts: stats.hosts,
        lastLoaded: stats.lastLoadTime
      }
    });
  });

  // ===== COMMAND LOG ENDPOINTS (UNCHANGED BUT ENHANCED) =====

  router.get('/commands/:id/logs', async (req, res) => {
    try {
      const { id } = req.params;
      const { date } = req.query;
      
      // Try memory first (for active commands)
      const activeCommand = commandService.getCommand(id);
      if (activeCommand) {
        return res.json({
          source: 'memory',
          command: {
            id: activeCommand.id,
            name: activeCommand.name,
            status: activeCommand.status,
            startTime: activeCommand.startTime,
            endTime: activeCommand.endTime,
            project: activeCommand.project,
            environment: activeCommand.environment,
            command: activeCommand.command, // Include actual command
            workingDirectory: activeCommand.workingDirectory,
            duration: activeCommand.endTime 
              ? activeCommand.endTime.getTime() - activeCommand.startTime.getTime() 
              : null
          },
          logs: activeCommand.logs,
          totalLogs: activeCommand.logs.length
        });
      }
      
      // Try file system for historical commands
      const historicalData = await commandService.getHistoricalLogs(id, date as string);
      if (historicalData) {
        return res.json({
          source: 'file',
          command: historicalData.metadata,
          logs: historicalData.logs,
          totalLogs: historicalData.logs.length
        });
      }
      
      res.status(404).json({ 
        error: 'Command logs not found',
        commandId: id,
        searchedDate: date || 'recent'
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch command logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ===== REMAINING ENDPOINTS (UNCHANGED) =====
  
  router.get('/logs/dates', async (req, res) => {
    try {
      const dates = await commandService.getAvailableLogDates();
      res.json({ 
        dates,
        totalDates: dates.length,
        oldestDate: dates[dates.length - 1] || null,
        newestDate: dates[0] || null
      });
    } catch (error) {
      console.error('❌ Error fetching log dates:', error);
      res.status(500).json({ 
        error: 'Failed to fetch log dates',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get('/logs/date/:date', async (req, res) => {
    try {
      const { date } = req.params;
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ 
          error: 'Invalid date format. Use YYYY-MM-DD' 
        });
      }
      
      const commands = await commandService.getLogsForDate(date);
      res.json({ 
        date,
        commands,
        totalCommands: commands.length,
        summary: {
          successful: commands.filter(cmd => cmd.status === 'success').length,
          failed: commands.filter(cmd => cmd.status === 'failed').length,
          stopped: commands.filter(cmd => cmd.status === 'stopped').length
        }
      });
    } catch (error) {
      console.error('❌ Error fetching logs for date:', error);
      res.status(500).json({ 
        error: 'Failed to fetch logs for date',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get('/logs/search', async (req, res) => {
    try {
      const { 
        query, 
        startDate, 
        endDate, 
        project, 
        environment, 
        status,
        limit = '50',
        offset = '0'
      } = req.query;
      
      const filters = {
        query: query as string,
        startDate: startDate as string,
        endDate: endDate as string,
        project: project as string,
        environment: environment as string,
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };
      
      const searchResults = await commandService.searchLogs(filters);

      res.json({
        ...searchResults,
        filters,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: searchResults.hasMore
        }
      });
    } catch (error) {
      console.error('❌ Error searching logs:', error);
      res.status(500).json({ 
        error: 'Failed to search logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get('/logs/stats', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const dateRange = (startDate && endDate) ? {
        startDate: startDate as string,
        endDate: endDate as string
      } : undefined;
      
      const stats = await commandService.getDeploymentStats(dateRange);
      
      res.json({
        stats,
        dateRange,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error getting deployment stats:', error);
      res.status(500).json({ 
        error: 'Failed to get deployment statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get('/commands', (req, res) => {
    const commands = commandService.getActiveCommands();
    res.json({
      commands,
      totalActive: commands.length,
      running: commands.filter(cmd => cmd.status === 'running').length,
      timestamp: new Date().toISOString()
    });
  });

  router.post('/commands', async (req, res) => {
    try {
      const commandData: CommandData = req.body;
      
      // Validate required fields
      if (!commandData.name || !commandData.command || !commandData.workingDirectory) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, command, workingDirectory' 
        });
      }

      // Security check
      const safety = ProcessService.isCommandSafe(commandData.command);
      if (!safety.safe) {
        return res.status(400).json({ 
          error: 'Command rejected for security reasons', 
          reason: safety.reason 
        });
      }

      const commandId = await commandService.startCommand(commandData);
      res.json({ 
        message: 'Command started successfully', 
        commandId,
        command: commandData
      });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  router.get('/commands/:id', (req, res) => {
    const command = commandService.getCommand(req.params.id);
    if (!command) {
      return res.status(404).json({ error: 'Command not found' });
    }
    res.json(command);
  });

  router.post('/commands/:id/stop', (req, res) => {
    const success = commandService.stopCommand(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Command not found or already stopped' });
    }
    res.json({ message: 'Command stopped successfully' });
  });

  router.post('/commands/validate', (req, res) => {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const safety = ProcessService.isCommandSafe(command);
    const parsed = ProcessService.parseCommand(command);
    
    res.json({
      command,
      safe: safety.safe,
      reason: safety.reason,
      analysis: {
        baseCommand: parsed.baseCommand,
        hasChaining: parsed.hasChaining,
        hasPipes: parsed.hasPipes,
        complexity: parsed.hasChaining || parsed.hasPipes ? 'complex' : 'simple'
      }
    });
  });

  // ===== LEGACY ENDPOINTS (BACKWARD COMPATIBILITY) =====

  router.get('/deployments', (req, res) => {
    const deployments = commandService.getActiveCommands().filter(cmd => 
      cmd.project || cmd.environment || cmd?.name?.toLowerCase().includes('deploy')
    );
    res.json(deployments);
  });

  router.get('/deployments/:id', (req, res) => {
    const deployment = commandService.getCommand(req.params.id);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    res.json(deployment);
  });

  router.post('/deployments/:id/stop', (req, res) => {
    const success = commandService.stopCommand(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Deployment not found or already stopped' });
    }
    res.json({ message: 'Deployment stopped successfully' });
  });

  return router;
}