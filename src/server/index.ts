// server.ts - Updated for new config system
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import { specs } from '../../docs/swagger';
import { WebSocketService } from './services/WebSocketService';
import { createApiRoutes } from './routes/api';
import { ProjectConfigService } from './services/ProjectConfigService';
import { SERVER_CONFIG } from '../lib/config'; // Updated import
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "*",
    credentials: true
  }
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : "*",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize WebSocket service
const webSocketService = new WebSocketService(io);

// Setup Swagger documentation BEFORE API routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Ossix Pipeline API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    tryItOutEnabled: true
  }
}));

// Setup API routes
app.use('/api', createApiRoutes(webSocketService.getCommandService()));

// Enhanced root endpoint with documentation link
app.get('/', (req, res) => {
  const projects = ProjectConfigService.getCachedProjects();
  const stats = ProjectConfigService.getLoadStats();
  
  res.json({
    name: 'Ossix Pipeline Server',
    version: '2.0.0',
    description: 'Universal DevOps Command Runner with Real-time Monitoring',
    status: 'running',
    projects: {
      total: stats.totalProjects,
      organizations: stats.organizations,
      hosts: stats.hosts,
      lastLoaded: stats.lastLoadTime
    },
    documentation: {
      swagger: `http://localhost:${PORT}/api-docs`,
      interactive: true,
      note: 'Complete API documentation with examples and testing'
    },
    features: [
      'File-based project configurations',
      'Generic command execution',
      'Real-time WebSocket logging',
      'Persistent file-based logs',
      'Project restart/stop actions',
      'Historical log access',
      'Security validation',
      'Command templates'
    ],
    endpoints: {
      // Project management endpoints
      projects: {
        list: 'GET /api/projects',
        get: 'GET /api/projects/:name',
        actions: 'POST /api/projects/:name/actions/:action',
        reload: 'POST /api/projects/reload'
      },
      // Core command endpoints
      commands: {
        list: 'GET /api/commands',
        create: 'POST /api/commands',
        get: 'GET /api/commands/:id',
        stop: 'POST /api/commands/:id/stop',
        validate: 'POST /api/commands/validate',
        templates: 'GET /api/commands/templates'
      },
      // File logging endpoints
      logs: {
        getCommandLogs: 'GET /api/commands/:id/logs',
        getLogDates: 'GET /api/logs/dates', 
        getDateLogs: 'GET /api/logs/date/:date',
        searchLogs: 'GET /api/logs/search',
        stats: 'GET /api/logs/stats'
      },
      // Legacy deployment endpoints (backward compatibility)
      deployments: {
        list: 'GET /api/deployments',
        get: 'GET /api/deployments/:id',
        stop: 'POST /api/deployments/:id/stop'
      },
      system: {
        health: 'GET /api/health'
      }
    },
    websocket: {
      url: `ws://localhost:${PORT}`,
      events: {
        client_to_server: [
          'command:start',
          'command:stop',
          'command:resume',
          'deploy:start (legacy)',
          'deployment:stop (legacy)'
        ],
        server_to_client: [
          'command:started',
          'command:log',
          'command:completed',
          'command:stopped',
          'command:error',
          'commands:status'
        ]
      }
    },
    quickStart: {
      documentation: `Visit http://localhost:${PORT}/api-docs for interactive API docs`,
      projectsList: `GET /api/projects to see all available projects`,
      testCommand: {
        method: 'POST',
        url: '/api/commands',
        body: {
          name: 'List Files',
          command: 'ls -la',
          workingDirectory: process.cwd()
        }
      },
      projectAction: {
        method: 'POST',
        url: '/api/projects/cashpoint-agb/actions/deploy',
        body: { environment: 'staging' }
      }
    }
  });
});

const PORT = SERVER_CONFIG.websocketPort;

// Initialize server with project loading
const initializeServer = async () => {
  try {
    const projects = await ProjectConfigService.loadAllProjects();
    
    httpServer.listen(PORT, () => {
      console.log(`📋 ${projects.length} projects loaded from configurations`);
    });
  } catch (error) {
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('💤 Server closed');
    process.exit(0);
  });
});

// Start the server
initializeServer().catch(console.error);