// server/index.ts - Updated for new config system
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import swaggerUi from 'swagger-ui-express';
import { specs } from '../../docs/swagger';
import { WebSocketService } from './services/WebSocketService';
import { createApiRoutes } from './routes/api';
import { ProjectConfigService } from './services/ProjectConfigService';
import { SERVER_CONFIG } from '../lib/config'; // Updated import
import cors from 'cors';

const app = express();
const dev = process.env.NODE_ENV !== 'production';
const PORT = Number(process.env.PORT || SERVER_CONFIG.websocketPort);
const nextApp = next({
  dev,
  hostname: '0.0.0.0',
  port: PORT
});
const handle = nextApp.getRequestHandler();
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_WS_URL?.replace('wss://', 'https://'),
  'https://oxxi-pipeline-production.up.railway.app'
].filter(Boolean) as string[];

const corsOrigin = dev ? '*' : (allowedOrigins.length > 0 ? allowedOrigins : '*');

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: corsOrigin,
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

// Next.js request handler (registered after Next prepares)
const attachNextHandler = () => {
  app.get('*', (req, res) => handle(req, res));
};

// Initialize server with project loading
const initializeServer = async () => {
  try {
    await nextApp.prepare();
    attachNextHandler();
    const projects = await ProjectConfigService.loadAllProjects();
    
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`📋 ${projects.length} projects loaded from configurations`);
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`🔌 WebSocket server ready`);
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