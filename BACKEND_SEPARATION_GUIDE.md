# Backend Separation Guide - Option B Implementation

## Overview

This guide documents the complete separation of your V0 frontend from the backend, implementing **Option B** with a dedicated Express.js backend service that hosts CedarOS and Mastra.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Services      │
│   (Next.js)     │◄──►│   (Express.js)  │◄──►│   (CedarOS +    │
│   Port: 3000    │    │   Port: 3001    │    │    Mastra)      │
│                 │    │                 │    │   Ports: 8080,  │
│ • UI/UX Only    │    │ • All Business  │    │   8081          │
│ • API Calls     │    │   Logic         │    │                 │
│ • No Secrets    │    │ • All Secrets   │    │ • Heavy ML      │
│                 │    │ • Auth & Data   │    │   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Benefits

✅ **Clean Separation**: Frontend is purely UI/UX focused  
✅ **Security**: All secrets and sensitive logic in backend  
✅ **Scalability**: Services can be scaled independently  
✅ **Development**: Teams can work on frontend/backend separately  
✅ **Deployment**: Independent deployment pipelines  

## Project Structure

```
pt-analysis-app/
├── frontend/                 # V0 React UI (Next.js)
│   ├── app/                 # Next.js app directory
│   ├── components/          # UI components only
│   ├── lib/                 # Frontend utilities
│   └── package.json         # Frontend dependencies
├── backend/                 # Dedicated backend service
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # CedarOS & Mastra integration
│   │   ├── middleware/      # Auth, error handling
│   │   └── config/          # Environment configuration
│   └── package.json         # Backend dependencies
├── services/                # External services
│   ├── cedaros/            # CedarOS service
│   └── mastra/             # Mastra service
├── docker-compose.yml       # Complete stack
└── BACKEND_SEPARATION_GUIDE.md
```

## Backend Services

### 1. CedarOS Integration (`/backend/src/services/cedaros.service.ts`)

- **Purpose**: Pose analysis and session management
- **Features**:
  - Real-time pose detection
  - Session tracking
  - Progress monitoring
  - Fallback mechanisms

### 2. Mastra Integration (`/backend/src/services/mastra.service.ts`)

- **Purpose**: AI-powered coaching and analysis
- **Features**:
  - Intelligent form analysis
  - Personalized coaching
  - Progress insights
  - Risk assessment

### 3. API Endpoints

#### Authentication (`/api/auth/`)
- `POST /signup` - User registration
- `POST /signin` - User login
- `POST /signout` - User logout
- `GET /me` - Get current user

#### Pose Analysis (`/api/pose/`)
- `POST /analyze` - Analyze pose data
- `POST /session/start` - Start analysis session
- `POST /session/end` - End analysis session
- `GET /session/:id/progress` - Get session progress

#### CedarOS (`/api/cedar/`)
- `GET /status` - Check CedarOS connection
- `POST /sessions` - Create CedarOS session
- `POST /analyze` - CedarOS pose analysis

#### Mastra (`/api/mastra/`)
- `GET /status` - Check Mastra connection
- `POST /analyze` - Mastra pose analysis
- `POST /coaching/sessions` - Create coaching session

## Environment Configuration

### Frontend Environment Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Forma
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENABLE_AI_ANALYSIS=true
NEXT_PUBLIC_ENABLE_PROGRESS_TRACKING=true
```

### Backend Environment Variables
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

## Development Setup

### 1. Start Backend Services

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Start Frontend

```bash
# Navigate to frontend directory
cd ..

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Start with Docker (Complete Stack)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## API Usage Examples

### Frontend API Client Usage

```typescript
import { apiClient } from '@/lib/api-client'

// Analyze pose
const result = await apiClient.analyzePose({
  exercise: 'squat',
  landmarks: poseData,
  formIssues: ['knee_valgus']
})

// Start session
const session = await apiClient.startSession({
  userId: 'user123',
  exerciseType: 'squat'
})
```

### Backend Service Usage

```typescript
import { cedarOSService } from '@/services/cedaros.service'
import { mastraService } from '@/services/mastra.service'

// CedarOS analysis
const analysis = await cedarOSService.analyzePose(sessionId, landmarks)

// Mastra coaching
const coaching = await mastraService.analyzePose({
  exercise: 'squat',
  landmarks,
  formIssues: ['knee_valgus']
})
```

## Deployment

### 1. Production Environment Variables

Create `.env.production` files:

**Frontend:**
```bash
NEXT_PUBLIC_API_URL=https://api.yourapp.com
NEXT_PUBLIC_APP_NAME=Forma
NODE_ENV=production
```

**Backend:**
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=your_production_jwt_secret
OPENAI_API_KEY=your_production_openai_key
DATABASE_URL=your_production_database_url
```

### 2. Docker Production Build

```bash
# Build and start production stack
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### 3. Individual Service Deployment

**Frontend (Vercel/Netlify):**
```bash
# Build frontend
npm run build

# Deploy to Vercel
vercel --prod
```

**Backend (Railway/Heroku):**
```bash
# Deploy backend
railway deploy
# or
git push heroku main
```

## Monitoring & Health Checks

### Health Check Endpoints

- `GET /api/health` - Overall system health
- `GET /api/health/ready` - Readiness check
- `GET /api/health/live` - Liveness check
- `GET /api/health/services` - Service status

### Service Status Monitoring

```bash
# Check backend health
curl http://localhost:3001/api/health

# Check CedarOS status
curl http://localhost:3001/api/cedar/status

# Check Mastra status
curl http://localhost:3001/api/mastra/status
```

## Security Considerations

### 1. API Security
- JWT token authentication
- Rate limiting
- CORS configuration
- Input validation with Zod
- Helmet security headers

### 2. Environment Security
- Secrets in backend only
- Environment variable validation
- Production vs development configs
- Secure token storage

### 3. Network Security
- Internal service communication
- Reverse proxy configuration
- SSL/TLS termination
- Firewall rules

## Troubleshooting

### Common Issues

1. **CedarOS Connection Failed**
   ```bash
   # Check CedarOS service
   curl http://localhost:8080/health
   
   # Check backend logs
   docker-compose logs backend
   ```

2. **Mastra Connection Failed**
   ```bash
   # Check Mastra service
   curl http://localhost:8081/health
   
   # Verify API keys
   echo $MASTRA_API_KEY
   ```

3. **Frontend API Errors**
   ```bash
   # Check backend status
   curl http://localhost:3001/api/health
   
   # Verify CORS settings
   curl -H "Origin: http://localhost:3000" http://localhost:3001/api/health
   ```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug

# Start services with debug
docker-compose up --build
```

## Migration from Monolithic Setup

### 1. Update Frontend Configuration

```typescript
// lib/config.ts
export const config = {
  app: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  }
}
```

### 2. Update API Client

```typescript
// lib/api-client.ts
class ApiClient {
  constructor() {
    const config = getFrontendConfig()
    this.baseUrl = config.app.apiUrl // Now points to backend
  }
}
```

### 3. Remove Backend Logic from Frontend

- Remove API routes from `/app/api/`
- Remove server-side logic from components
- Update imports to use API client

## Performance Optimization

### 1. Backend Optimizations
- Connection pooling
- Caching with Redis
- Request compression
- Response optimization

### 2. Frontend Optimizations
- API response caching
- Optimistic updates
- Error boundaries
- Loading states

### 3. Service Optimizations
- CedarOS model caching
- Mastra response caching
- Database query optimization
- Background processing

This architecture provides a clean, scalable, and maintainable separation between your V0 frontend and backend services, with CedarOS and Mastra properly integrated as dedicated backend services.
