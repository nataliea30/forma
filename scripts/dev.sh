#!/bin/bash

# Development startup script for Forma PT Analysis App
# This script starts both frontend and backend services

set -e

echo "🚀 Starting Forma PT Analysis App Development Environment"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check if ports are available
echo "🔍 Checking port availability..."
if ! check_port 3000; then
    echo "❌ Frontend port 3000 is already in use. Please stop the service using this port."
    exit 1
fi

if ! check_port 3001; then
    echo "❌ Backend port 3001 is already in use. Please stop the service using this port."
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
pnpm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -f "package.json" ]; then
    echo "❌ Backend package.json not found. Please ensure you're in the correct directory."
    exit 1
fi

# Install backend dependencies
if [ ! -d "node_modules" ]; then
    npm install
fi

# Go back to root
cd ..

# Create environment files if they don't exist
echo "🔧 Setting up environment files..."

# Frontend .env.local
if [ ! -f "frontend/.env.local" ]; then
    echo "Creating frontend .env.local..."
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Forma
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENABLE_AI_ANALYSIS=true
NEXT_PUBLIC_ENABLE_PROGRESS_TRACKING=true
NEXT_PUBLIC_MEDIAPIPE_MODEL_URL=https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task
EOF
fi

# Backend .env
if [ ! -f "backend/.env" ]; then
    echo "Creating backend .env..."
    cat > backend/.env << EOF
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Authentication
JWT_SECRET=dev_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# OpenAI Configuration (Add your key)
OPENAI_API_KEY=your_openai_api_key_here

# CedarOS Configuration
CEDAROS_API_URL=http://localhost:8080
CEDAROS_API_KEY=dev_cedaros_key

# Mastra Configuration
MASTRA_API_URL=http://localhost:8081
MASTRA_API_KEY=dev_mastra_key

# Database (SQLite for development)
DATABASE_URL=file:./dev.db

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
EOF
fi

# Create logs directory
mkdir -p backend/logs

echo "✅ Environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add your OpenAI API key to backend/.env"
echo "2. Start the backend service: cd backend && npm run dev"
echo "3. Start the frontend service: pnpm dev"
echo ""
echo "🌐 Services will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Health:   http://localhost:3001/api/health"
echo ""
echo "🔧 To start both services automatically, run:"
echo "   ./scripts/start-dev.sh"
echo ""
echo "📁 New project structure:"
echo "   frontend/     - V0 React UI (Next.js)"
echo "   backend/      - Standalone backend service"
echo "   ├── src/"
echo "   │   ├── routes/   - CedarOS, Mastra, GPT-5, auth"
echo "   │   ├── models/   - DB schemas"
echo "   │   ├── services/ - Wrappers for CedarOS, Mastra, GPT"
echo "   │   └── app.js    - Express entrypoint"
echo ""
echo "📚 For more information, see BACKEND_SEPARATION_GUIDE.md"
