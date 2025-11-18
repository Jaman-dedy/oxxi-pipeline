// server/index.ts - Standalone backend server
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import { specs } from '../../docs/swagger';
import { WebSocketService } from './services/WebSocketService';
import { createApiRoutes } from './routes/api';
import { ProjectConfigService } from './services/ProjectConfigService';
import { SERVER_CONFIG } from '../lib/config';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

// CORS - allow all origins for simplicity
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    credentials: true,
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: "*",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize WebSocket service
const webSocketService = new WebSocketService(io);

// Setup Swagger documentation
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

const PORT = Number(SERVER_CONFIG.websocketPort);

// Initialize server with project loading
const initializeServer = async () => {
  try {
    const projects = await ProjectConfigService.loadAllProjects();
    
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`📋 ${projects.length} projects loaded from configurations`);
      console.log(`🚀 Backend server running on http://0.0.0.0:${PORT}`);
      console.log(`🔌 WebSocket server ready on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
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