#!/bin/bash

# Stack Status Checker for Forma PT Analysis App
echo "🔍 Checking Forma PT Analysis App Stack Status"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check service
check_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $name... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ Running${NC}"
        return 0
    else
        echo -e "${RED}❌ Not responding${NC}"
        return 1
    fi
}

# Function to check port
check_port() {
    local port=$1
    local service=$2
    
    echo -n "Checking $service on port $port... "
    
    if lsof -i :$port >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Port in use${NC}"
        return 0
    else
        echo -e "${RED}❌ Port free${NC}"
        return 1
    fi
}

echo ""
echo "📊 Service Status:"
echo "------------------"

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
fi

# Check Redis
echo -n "Checking Redis... "
if redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
fi

echo ""
echo "🌐 Web Services:"
echo "----------------"

# Check ports
check_port 3000 "Frontend (Next.js)"
check_port 3001 "Backend (Express.js)"
check_port 3002 "Frontend Alt"

echo ""
echo "🔗 HTTP Endpoints:"
echo "------------------"

# Check endpoints
check_service "Frontend" "http://localhost:3000" "200"
check_service "Backend Health" "http://localhost:3001/health" "200"
check_service "Backend API" "http://localhost:3001/api/health" "200"

echo ""
echo "📋 Process Information:"
echo "----------------------"

# Show running processes
echo "Node.js processes:"
ps aux | grep -E "(node|pnpm)" | grep -v grep | grep -E "(3000|3001|3002|backend|frontend)" | head -5

echo ""
echo "🔧 Quick Commands:"
echo "------------------"
echo "Start PostgreSQL: brew services start postgresql@14"
echo "Start Redis: brew services start redis"
echo "Start Backend: cd backend && pnpm dev"
echo "Start Frontend: cd frontend && pnpm dev"
echo ""
echo "🌐 Access URLs:"
echo "---------------"
echo "Frontend: http://localhost:3000 (or 3001, 3002)"
echo "Backend API: http://localhost:3001/api"
echo "Backend Health: http://localhost:3001/health"
echo ""
echo "📝 Next Steps:"
echo "--------------"
echo "1. If services are not running, start them with the commands above"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Test the signup flow: Sign up → Start session → Analyze pose → View analytics"
echo "4. Check logs if needed: tail -f backend/logs/app.log"
