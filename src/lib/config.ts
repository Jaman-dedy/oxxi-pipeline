// lib/config.ts - Only truly global server settings
export const SERVER_CONFIG = {
  // WebSocket / HTTP server settings - always use 3001 for backend
  websocketPort: process.env.WEBSOCKET_PORT || 3001,
  websocketUrl: process.env.NODE_ENV === 'production' 
    ? 'wss://your-domain.com' 
    : `http://localhost:${process.env.PORT || process.env.WEBSOCKET_PORT || 3001}`,
  
  // File system paths
  configDirectory: process.env.CONFIG_DIR || './configs',
  scriptsDirectory: process.env.SCRIPTS_DIR || './ossix-devops/scripts',
  
  // Logging
  logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '30'),
  logDirectory: process.env.LOG_DIR || './logs',
  
  // Security
  maxCommandTimeout: parseInt(process.env.MAX_COMMAND_TIMEOUT || '1800000'), // 30 minutes
  
  // Command execution
  commandHistoryLimit: parseInt(process.env.COMMAND_HISTORY_LIMIT || '100'),
  commandCleanupTimeout: parseInt(process.env.COMMAND_CLEANUP_TIMEOUT || '3600000'), // 1 hour
};