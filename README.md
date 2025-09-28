# Forma PT Analysis App

A comprehensive physical therapy analysis application with AI-powered pose analysis, real-time coaching, and progress tracking.

## 🏗️ Project Structure

```
forma-pt-analysis-app/
├── frontend/                 # V0 React UI (Next.js)
│   ├── app/                 # Next.js app directory
│   ├── components/          # UI components
│   ├── lib/                 # Frontend utilities
│   ├── public/              # Static assets
│   ├── styles/              # CSS styles
│   ├── package.json         # Frontend dependencies
│   └── Dockerfile           # Frontend container
├── backend/                 # Standalone backend service
│   ├── src/
│   │   ├── routes/          # API endpoints (CedarOS, Mastra, GPT-5, auth)
│   │   ├── models/          # Database schemas and validation
│   │   ├── services/        # Wrappers for CedarOS, Mastra, GPT
│   │   ├── middleware/      # Authentication, error handling
│   │   ├── config/          # Environment configuration
│   │   ├── utils/           # Backend utilities
│   │   └── app.js           # Express.js entrypoint
│   ├── .env                 # Backend environment variables
│   ├── package.json         # Backend dependencies
│   └── Dockerfile           # Backend container
├── scripts/                 # Development and deployment scripts
├── docker-compose.yml       # Complete stack orchestration
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (package manager)
- Docker (optional, for containerized deployment)

### Development Setup

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd forma-pt-analysis-app
   ./scripts/dev.sh
   ```

2. **Add your API keys**:
   ```bash
   # Edit backend/.env
   OPENAI_API_KEY=your_openai_api_key_here
   CEDAROS_API_KEY=your_cedaros_api_key_here
   MASTRA_API_KEY=your_mastra_api_key_here
   ```

3. **Start services**:
   ```bash
   ./scripts/start-dev.sh
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - Health Check: http://localhost:3001/api/health

## 🏛️ Architecture

### Frontend (Next.js)
- **Pure UI/UX**: Handles only user interface and user experience
- **API Communication**: Makes HTTP requests to backend services
- **No Business Logic**: All logic delegated to backend
- **No Secrets**: No API keys or sensitive data

### Backend (Express.js)
- **Business Logic**: All application logic and processing
- **Service Integration**: CedarOS, Mastra, and OpenAI integration
- **Authentication**: JWT-based authentication system
- **Data Management**: User data, sessions, and progress tracking
- **Security**: All secrets and sensitive operations

### Services Integration
- **CedarOS**: Pose analysis and session management
- **Mastra**: AI-powered coaching and feedback
- **OpenAI**: Advanced AI analysis and recommendations

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/me` - Get current user

### Pose Analysis
- `POST /api/pose/analyze` - Analyze pose data
- `POST /api/pose/session/start` - Start analysis session
- `POST /api/pose/session/end` - End analysis session
- `GET /api/pose/session/:id/progress` - Get session progress

### CedarOS Integration
- `GET /api/cedar/status` - Check CedarOS connection
- `POST /api/cedar/sessions` - Create CedarOS session
- `POST /api/cedar/analyze` - CedarOS pose analysis

### Mastra Integration
- `GET /api/mastra/status` - Check Mastra connection
- `POST /api/mastra/analyze` - Mastra pose analysis
- `POST /api/mastra/coaching/sessions` - Create coaching session

### Health & Monitoring
- `GET /api/health` - Overall system health
- `GET /api/health/ready` - Readiness check
- `GET /api/health/live` - Liveness check

## 🐳 Docker Deployment

### Development
```bash
# Start complete stack
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Development Commands

### Root Level
```bash
npm run dev              # Setup development environment
npm run start            # Start both frontend and backend
npm run build            # Build both frontend and backend
npm run install:all      # Install all dependencies
npm run clean            # Clean build artifacts
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run lint             # Lint both frontend and backend
npm run test             # Test both frontend and backend
```

### Frontend
```bash
cd frontend
pnpm dev                 # Start development server
pnpm build               # Build for production
pnpm start               # Start production server
pnpm lint                # Lint code
pnpm test                # Run tests
```

### Backend
```bash
cd backend
npm run dev              # Start development server
npm run build            # Build TypeScript
npm start                # Start production server
npm run lint             # Lint code
npm test                 # Run tests
```

## 🔒 Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Forma
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENABLE_AI_ANALYSIS=true
NEXT_PUBLIC_ENABLE_PROGRESS_TRACKING=true
```

### Backend (.env)
```bash
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# AI Services
OPENAI_API_KEY=your_openai_api_key_here
CEDAROS_API_URL=http://localhost:8080
CEDAROS_API_KEY=your_cedaros_api_key_here
MASTRA_API_URL=http://localhost:8081
MASTRA_API_KEY=your_mastra_api_key_here

# Database
DATABASE_URL=postgresql://localhost:5432/forma_db
```

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
pnpm test                # Run all tests
pnpm test:watch          # Run tests in watch mode
pnpm test:coverage       # Run tests with coverage
```

### Backend Testing
```bash
cd backend
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
```

## 📈 Monitoring

### Health Checks
- **Overall Health**: `GET /api/health`
- **Service Status**: `GET /api/health/services`
- **Readiness**: `GET /api/health/ready`
- **Liveness**: `GET /api/health/live`

### Logging
- **Frontend**: Browser console and Vercel analytics
- **Backend**: Winston logger with file and console output
- **Docker**: `docker-compose logs -f [service-name]`

## 🚀 Deployment

### Vercel (Frontend)
```bash
cd frontend
vercel --prod
```

### Railway/Heroku (Backend)
```bash
cd backend
railway deploy
# or
git push heroku main
```

### Docker (Full Stack)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📚 Documentation

- [Backend Separation Guide](BACKEND_SEPARATION_GUIDE.md)
- [Clean Rebuild Plan](CLEAN_REBUILD_PLAN.md)
- [Option B Implementation Summary](OPTION_B_IMPLEMENTATION_SUMMARY.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@forma-app.com or join our Slack channel.

---

**Built with ❤️ for better physical therapy outcomes**