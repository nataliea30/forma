#!/bin/bash

# Start both frontend and backend services concurrently

set -e

echo "🚀 Starting Forma PT Analysis App Services"
echo "=========================================="

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "✅ Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if backend is ready
wait_for_backend() {
    echo "⏳ Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
            echo "✅ Backend is ready!"
            return 0
        fi
        sleep 1
    done
    echo "❌ Backend failed to start within 30 seconds"
    return 1
}

# Start backend
echo "🔧 Starting backend service..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
if ! wait_for_backend; then
    echo "❌ Failed to start backend service"
    cleanup
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend service..."
cd frontend
pnpm dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Services started successfully!"
echo "================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo "❤️  Health:   http://localhost:3001/api/health"
echo ""
echo "📊 Service Status:"
echo "   Backend PID:  $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
