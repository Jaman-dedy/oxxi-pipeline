# 🚀 Ossix Pipeline

A modern, real-time deployment dashboard for managing and monitoring your application deployments across multiple environments with dynamic project configuration.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotjs&logoColor=white)

## ✨ Features

- 🎯 **Dynamic Project Management** - Load projects from JSON configuration files
- ⚡ **Real-Time Deployment** - Live log streaming with WebSocket integration
- 🌍 **Multi-Environment Support** - Staging, Production, and custom environments
- 📱 **Mobile Responsive** - Deploy from anywhere, any device
- 🎨 **Beautiful UI** - Modern dark theme with smooth animations
- 🔄 **Auto-Refresh** - Real-time status updates and deployment progress
- 📊 **Deployment Analytics** - Success rates, duration tracking, and history
- 🛡️ **Process Management** - Start, stop, and monitor deployments
- 📁 **Config-Driven** - JSON-based project configuration system
- 🔧 **Command Flexibility** - Execute any command defined in project configs

## 🏗️ Architecture

```
ossix-pipeline/
├── src/
│   ├── app/                     # Next.js 14+ App Router
│   │   ├── projects/            # Project management pages
│   │   ├── commands/            # Command execution interface
│   │   └── historical-logs/     # Log history and analytics
│   ├── components/              # React components
│   │   ├── ServiceDetail.tsx    # Project management interface
│   │   ├── CommandInterface.tsx # Command execution panel
│   │   └── LiveDeploymentViewer.tsx # Real-time log viewer
│   ├── hooks/                   # Custom React hooks
│   │   ├── useWebSocket.ts      # WebSocket integration
│   │   └── useHistoricalLogs.ts # Log history management
│   ├── lib/                     # Configuration & types
│   └── server/                  # Backend server
│       ├── index.ts             # Main server entry point
│       ├── services/            # Business logic services
│       │   ├── ProjectConfigService.ts # Dynamic config loading
│       │   ├── WebSocketService.ts     # Real-time communication
│       │   └── CommandService.ts       # Command execution
│       ├── types/               # TypeScript interfaces
│       └── utils/               # Helper utilities
├── configs/                     # Project configuration files
│   ├── agb-web.json            # Example project config
│   ├── cashpoint-v2.json       # Another project config
│   └── ...                     # Additional project configs
└── 📁 Dependencies on ../ossix-devops/scripts/
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **TypeScript** knowledge helpful
- **ossix-devops** repository (sibling directory with deployment scripts)

### Project Structure Expected

```
📁 your-workspace/
├── ossix-pipeline/              # ← This project
│   ├── src/
│   │   ├── app/                 # Next.js app
│   │   ├── components/          # React components
│   │   ├── server/              # Backend server
│   │   └── lib/                 # Configuration
│   ├── configs/                 # Project configuration files
│   │   ├── project1.json
│   │   ├── project2.json
│   │   └── ...
│   └── package.json
└── ossix-devops/                # ← Required sibling project
    └── scripts/
        ├── web-app/
        │   └── deploy.sh
        ├── cashpoint-v2/
        │   └── deploy.sh
        └── ... (other projects)
```

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd ossix-pipeline
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install development tools globally (recommended):**
   ```bash
   npm install -g tsx  # For running TypeScript directly
   ```

### Configuration

The system uses JSON configuration files instead of hardcoded project settings:

1. **Create project configuration files in `configs/` directory:**
   ```json
   // configs/your-project.json
   {
     "name": "your-project",
     "displayName": "Your Project Name",
     "description": "Description of your project",
     "organization": "your-org",
     "host": "your-server-ip",
     "app_name": "your-app",
     "repo_name": "your-repo",
     "ssh": false,
     "production_url": "https://your-production-url.com",
     "staging_url": "https://your-staging-url.com",
     "workingDirectory": "../ossix-devops",
     "deploy_production": "./scripts/your-project/deploy.sh --env=production",
     "deploy_staging": "./scripts/your-project/deploy.sh --env=staging",
     "restart_production": "ssh user@host \"pm2 restart your-app-production\"",
     "restart_staging": "ssh user@host \"pm2 restart your-app-staging\"",
     "stop_production": "ssh user@host \"pm2 stop your-app-production\"",
     "stop_staging": "ssh user@host \"pm2 stop your-app-staging\"",
     "repository": "https://github.com/your-org/your-repo"
   }
   ```

2. **Create environment file (optional):**
   ```bash
   # .env.local
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_WS_URL=ws://localhost:3001
   WEBSOCKET_PORT=3001
   ```

## 🎮 Running the Application

### Development Mode

1. **Start the backend server:**
   ```bash
   # Using tsx (recommended for development)
   tsx src/server/index.ts
   
   # Or using npm script
   npm run server
   ```

2. **Start the frontend (in a new terminal):**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - 🌐 **Frontend:** http://localhost:3000
   - 🔌 **Backend API:** http://localhost:3001
   - 📊 **Health Check:** http://localhost:3001/api/health

### Production Mode

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Start both services:**
   ```bash
   # Start backend
   tsx src/server/index.ts

   # Start frontend (in another terminal)
   npm start
   ```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/projects` | List all configured projects |
| `GET` | `/api/projects/:name` | Get specific project info |
| `GET` | `/api/deployments` | List all active deployments |
| `POST` | `/api/deployments/start` | Start a new deployment |
| `POST` | `/api/deployments/:id/stop` | Stop a running deployment |
| `GET` | `/api/commands/:id/logs` | Get command logs |
| `GET` | `/api/logs/search` | Search historical logs |
| `GET` | `/api/logs/stats` | Get deployment statistics |

## 🎯 WebSocket Events

### Client → Server
- `deploy:start` - Start a new deployment
- `command:start` - Execute a custom command
- `deployment:stop` - Stop a running deployment
- `command:stop` - Stop a running command

### Server → Client
- `deployments:status` - Current deployments status
- `commands:status` - Current commands status
- `deployment:started` - New deployment started
- `command:started` - New command started
- `deployment:log` - Real-time deployment log entry
- `command:log` - Real-time command log entry
- `deployment:completed` - Deployment finished
- `command:completed` - Command finished

## 🚀 Usage

### Deploy Environments
1. Navigate to **Projects Overview**
2. Click **"Manage"** on any project
3. Choose **Staging** or **Production**
4. Click **"Deploy"** and monitor real-time logs

### Execute Custom Commands
1. Go to **Commands** page
2. Select a project and available command
3. Execute and monitor progress
4. View detailed logs and output

### Monitor Deployment History
1. Visit **Historical Logs** page
2. Filter by project, environment, status, or date range
3. View deployment statistics and trends
4. Export data in CSV or JSON format

## 🛠️ Development

### Project Scripts

```bash
# Frontend development
npm run dev              # Start Next.js dev server
npm run build           # Build for production
npm start               # Start production server

# Backend development  
npm run server          # Start backend server
tsx src/server/index.ts # Direct server start
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript checks
```

### Adding New Projects

1. **Create a JSON configuration file:**
   ```bash
   # Create configs/new-project.json
   touch configs/new-project.json
   ```

2. **Add project configuration:**
   ```json
   {
     "name": "new-project",
     "displayName": "New Project",
     "description": "Description of the new project",
     "organization": "your-org",
     "host": "your-server-ip",
     "workingDirectory": "../ossix-devops",
     "deploy_production": "./scripts/new-project/deploy.sh --env=production",
     "deploy_staging": "./scripts/new-project/deploy.sh --env=staging"
   }
   ```

3. **Ensure deployment scripts exist:**
   ```
   ../ossix-devops/scripts/new-project/
   └── deploy.sh         # Deployment script
   ```

4. **Restart the server** - configurations are loaded automatically on startup

### Custom Commands

Add any command to your project configuration:

```json
{
  "name": "my-project",
  "build_assets": "npm run build && npm run optimize",
  "run_tests": "npm test",
  "backup_db": "./scripts/backup-database.sh",
  "custom_deploy": "docker-compose up -d --build"
}
```

These commands become available in the Commands interface automatically.

## 🐛 Troubleshooting

### Common Issues

**"Project configuration not found":**
- Verify JSON files exist in `configs/` directory
- Check JSON syntax is valid
- Restart the server to reload configurations

**"Command not found in project config":**
- Check the command exists in your project's JSON file
- Verify command name spelling
- Ensure the command value is a string

**WebSocket connection failed:**
- Check if backend is running on port 3001
- Verify no firewall blocking the connection
- Check browser console for connection errors

**Script execution failed:**
- Verify script paths in workingDirectory
- Check script permissions: `chmod +x script.sh`
- Ensure working directory exists

### Debug Mode

**Enable detailed logging:**
```bash
# Set debug environment
DEBUG=* tsx src/server/index.ts

# Or specific namespaces
DEBUG=deployment:*,command:* tsx src/server/index.ts
```

## 🔧 Configuration Reference

### Project Configuration Schema

```typescript
interface ProjectConfig {
  // Required fields
  name: string;                    // Unique project identifier
  displayName: string;             // Human-readable name
  organization: string;            // Organization name
  
  // Optional metadata
  description?: string;            // Project description
  host?: string;                   // Server host
  app_name?: string;               // Application name
  repo_name?: string;              // Repository name
  repository?: string;             // Repository URL
  production_url?: string;         // Production URL
  staging_url?: string;            // Staging URL
  workingDirectory?: string;       // Working directory for commands
  ssh?: boolean;                   // SSH configuration flag
  
  // Commands (any string key with string value)
  [commandName: string]: string | boolean | undefined;
}
```

### Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Server Configuration  
WEBSOCKET_PORT=3001
NODE_ENV=development

# File Paths (optional)
CONFIG_DIR=./configs
SCRIPTS_DIR=../ossix-devops/scripts
LOG_DIR=./logs

# Limits (optional)
MAX_COMMAND_TIMEOUT=1800000      # 30 minutes
COMMAND_HISTORY_LIMIT=100
LOG_RETENTION_DAYS=30
```

## 📚 Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express, Socket.IO, TypeScript
- **Development:** tsx, ESLint, Prettier
- **Deployment:** PM2, Bash scripts, SSH
- **Configuration:** JSON-based project configs

## 🎯 Key Features

### Dynamic Configuration System
- JSON-based project configuration
- Hot-reload of configurations
- Flexible command definitions
- No hardcoded project details

### Real-Time Monitoring
- Live log streaming
- WebSocket-based communication
- Process status tracking
- Command execution monitoring

### Historical Analytics
- Deployment success rates
- Duration tracking
- Search and filtering
- Export capabilities

### Multi-Environment Support
- Staging and production deployments
- Environment-specific configurations
- Custom environment support
- URL management per environment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is proprietary software for Ossix Technologies.

## 🎉 Acknowledgments

Built with ❤️ by the Ossix Team for streamlined deployment management.

---

**Happy Deploying! 🚀**
