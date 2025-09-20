import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ossix Pipeline API',
      version: '2.0.0',
      description: `
        Universal DevOps Command Runner with Real-time Monitoring and File Logging
        
        ## Features
        - ✅ Execute any command securely
        - ✅ Real-time WebSocket logging  
        - ✅ Persistent file-based logs
        - ✅ Historical log access
        - ✅ Command validation & templates
        - ✅ Backward compatibility with deployments
        
        ## WebSocket Events
        Connect to \`ws://localhost:3001\` for real-time updates:
        - \`command:started\` - Command execution started
        - \`command:log\` - New log entry 
        - \`command:completed\` - Command finished
        - \`command:stopped\` - Command stopped by user
        - \`command:error\` - Command error occurred
      `,
      contact: {
        name: 'Ossix Pipeline Support',
        url: 'https://github.com/your-org/ossix-pipeline'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server',
      },
      {
        url: 'https://api.ossix.dev/api',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'System',
        description: 'System health and status endpoints'
      },
      {
        name: 'Commands',
        description: 'Command execution and management'
      },
      {
        name: 'Logs',
        description: 'Log retrieval and search functionality'
      },
      {
        name: 'Templates',
        description: 'Pre-defined command templates'
      },
      {
        name: 'Legacy',
        description: 'Backward compatibility endpoints (deprecated)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for API authentication (if implemented)'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts'], // Path to the API files
 };
 
 export const specs = swaggerJsdoc(options);