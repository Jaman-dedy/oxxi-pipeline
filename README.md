# 🚀 Ossix Pipeline

A modern, real-time deployment dashboard for managing and monitoring your application deployments across multiple environments.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

## ✨ Features

- 🎯 **Multi-Project Management** - Deploy and monitor 10+ projects from one dashboard
- ⚡ **Real-Time Deployment** - Live log streaming with WebSocket integration
- 🌍 **Multi-Environment Support** - Staging, Production, and custom environments
- 📱 **Mobile Responsive** - Deploy from anywhere, any device
- 🎨 **Beautiful UI** - Modern dark theme with smooth animations
- 🔄 **Auto-Refresh** - Real-time status updates and deployment progress
- 📊 **Deployment Analytics** - Success rates, duration tracking, and history
- 🛡️ **Process Management** - Start, stop, and monitor deployments

## 🏗️ Architecture

```
ossix-pipeline/
├── 🎨 Frontend (Next.js + TypeScript)
│   ├── app/                     # Next.js 13+ App Router
│   ├── components/              # React components
│   ├── hooks/                   # Custom React hooks
│   └── lib/                     # Configuration & types
└── 🚀 Backend (Node.js + Socket.IO)
    ├── server/
    │   ├── index.ts             # Main server entry point
    │   ├── services/            # Business logic services
    │   ├── types/               # TypeScript interfaces
    │   ├── utils/               # Helper utilities
    │   └── routes/              # REST API endpoints
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
├── all-in-one-jaman/
│   └── ossix-pipeline/          # ← This project
│       ├── server/              # Backend server
│       ├── components/          # Frontend components
│       └── package.json
└── ossix-devops/                # ← Required sibling project
    └── scripts/
        ├── cashpoint-v2/
        │   ├── deploy.sh
        │   └── deploy_all.sh
        ├── web-app/
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

1. **Create environment file (optional):**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit configuration in `lib/config.ts`:**
   ```typescript
   export const DEPLOYMENT_CONFIG = {
     defaultOrganization: 'your-org',     # Change this
     defaultHost: 'your-host-ip',         # Change this
   };
   ```

## 🎮 Running the Application

### Development Mode

1. **Start the backend server:**
   ```bash
   # Option 1: Using tsx (recommended for development)
   tsx server/index.ts
   
   # Option 2: Using Node.js directly
   node --experimental-strip-types server/index.ts
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
   tsx server/index.ts

   # Start frontend (in another terminal)
   npm start
   ```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/deployments` | List all active deployments |
| `GET` | `/api/deployments/:id` | Get specific deployment |
| `POST` | `/api/deployments/:id/stop` | Stop a running deployment |

## 🎯 WebSocket Events

### Client → Server
- `deploy:start` - Start a new deployment
- `deployment:stop` - Stop a running deployment

### Server → Client
- `deployments:status` - Current deployments status
- `deployment:started` - New deployment started
- `deployment:log` - Real-time log entry
- `deployment:completed` - Deployment finished
- `deployment:stopped` - Deployment stopped

## 🚀 Usage

### Deploy All Environments
1. Navigate to the **Projects Overview**
2. Click **"Deploy All"** on any project
3. Watch real-time logs as both staging and production deploy

### Deploy Single Environment
1. Click **"Manage"** on a project
2. Choose **Staging** or **Production**
3. Click **"Deploy"** for that environment
4. Monitor progress with live log streaming

### Monitor Deployments
- View real-time deployment status in the sidebar
- Check deployment history and success rates
- Click **"View Logs"** to see detailed deployment logs
- Use the full-screen log viewer for debugging

## 🛠️ Development

### Project Scripts

```bash
# Frontend development
npm run dev              # Start Next.js dev server
npm run build           # Build for production
npm run start           # Start production server

# Backend development  
tsx server/index.ts     # Start backend with hot reload
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript checks
```

### Adding New Projects

1. **Add project to `lib/config.ts`:**
   ```typescript
   {
     name: 'new-project',
     displayName: 'New Project',
     description: 'Description of the new project',
     environments: [
       { name: 'staging', organization: 'agb', host: '4.180.244.99', color: 'orange' },
       { name: 'production', organization: 'agb', host: '4.180.244.99', color: 'green' }
     ]
   }
   ```

2. **Ensure deployment scripts exist:**
   ```
   ../ossix-devops/scripts/new-project/
   ├── deploy.sh         # Individual environment deployment
   └── deploy_all.sh     # Deploy to all environments
   ```

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module" errors:**
```bash
# Make sure you're using tsx for development
tsx server/index.ts

# Or install missing dependencies
npm install
```

**Deployment script not found:**
- Verify `../ossix-devops/scripts/project-name/` exists
- Check script permissions: `chmod +x deploy.sh deploy_all.sh`
- Ensure you're running from the correct directory

**WebSocket connection failed:**
- Check if backend is running on port 3001
- Verify no firewall blocking the connection
- Check browser console for connection errors

**Frontend not connecting to backend:**
- Ensure backend is running first
- Check `useWebSocket` hook configuration
- Verify CORS settings in server configuration

### Debug Mode

**Enable detailed logging:**
```bash
# Set debug environment
DEBUG=* tsx server/index.ts

# Or just specific namespaces
DEBUG=deployment:* tsx server/index.ts
```

## 🔧 Configuration

### Environment Variables

Create `.env.local`:
```env
# Deployment configuration
NEXT_PUBLIC_DEFAULT_ORG=your-organization
NEXT_PUBLIC_DEFAULT_HOST=your-server-ip

# Server configuration
WEBSOCKET_PORT=3001
NODE_ENV=development

# Script paths (if different from default)
SCRIPTS_PATH=../ossix-devops/scripts
```

### Customization

- **Colors & Themes:** Edit `tailwind.config.js`
- **Project Configuration:** Modify `lib/config.ts`
- **Deployment Logic:** Update services in `server/services/`

## 📚 Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express, Socket.IO, TypeScript
- **Development:** tsx, ESLint, Prettier
- **Deployment:** PM2, Bash scripts

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
