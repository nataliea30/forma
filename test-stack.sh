#!/bin/bash

# Test Script for Forma PT Analysis App Stack
echo "🧪 Testing Forma PT Analysis App Stack"
echo "======================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "%{http_code}" "$url" 2>/dev/null)
    status_code="${response: -3}"
    body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (Status: $status_code)${NC}"
        return 1
    fi
}

echo ""
echo "🔍 Basic Connectivity Tests:"
echo "----------------------------"

# Test frontend
test_endpoint "Frontend" "http://localhost:3000"

# Test backend health
test_endpoint "Backend Health" "http://localhost:3001/health"

# Test backend API health
test_endpoint "Backend API Health" "http://localhost:3001/api/health"

echo ""
echo "🔐 Authentication Tests:"
echo "------------------------"

# Test signup endpoint (should return 400 for missing data)
test_endpoint "Signup Endpoint" "http://localhost:3001/api/auth/signup" "400"

# Test signin endpoint (should return 400 for missing data)
test_endpoint "Signin Endpoint" "http://localhost:3001/api/auth/signin" "400"

# Test protected endpoint (should return 401)
test_endpoint "Protected Endpoint" "http://localhost:3001/api/auth/me" "401"

echo ""
echo "📊 API Endpoint Tests:"
echo "----------------------"

# Test pose endpoints
test_endpoint "Pose Session Start" "http://localhost:3001/api/pose/session/start" "400"

# Test metrics endpoints
test_endpoint "Metrics Analytics" "http://localhost:3001/api/metrics/analytics" "400"

echo ""
echo "🎯 Test Results Summary:"
echo "------------------------"

# Count tests
total_tests=8
passed_tests=0

# Run tests and count passes
for test in "Frontend:http://localhost:3000" "Backend Health:http://localhost:3001/health" "Backend API Health:http://localhost:3001/api/health" "Signup Endpoint:http://localhost:3001/api/auth/signup:400" "Signin Endpoint:http://localhost:3001/api/auth/signin:400" "Protected Endpoint:http://localhost:3001/api/auth/me:401" "Pose Session Start:http://localhost:3001/api/pose/session/start:400" "Metrics Analytics:http://localhost:3001/api/metrics/analytics:400"; do
    IFS=':' read -r name url expected <<< "$test"
    if test_endpoint "$name" "$url" "$expected" >/dev/null 2>&1; then
        ((passed_tests++))
    fi
done

echo ""
echo "📈 Test Results: $passed_tests/$total_tests tests passed"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}🎉 All tests passed! Your stack is working correctly.${NC}"
    echo ""
    echo "🚀 Ready to use:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:3001/api"
    echo "  Health Check: http://localhost:3001/health"
    echo ""
    echo "📋 Next Steps:"
    echo "  1. Open http://localhost:3000 in your browser"
    echo "  2. Test the signup flow: Sign up → Start session → Analyze pose → View analytics"
    echo "  3. Check the browser console for any errors"
    echo "  4. Monitor backend logs: tail -f backend/logs/app.log"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the output above for details.${NC}"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "  1. Make sure all services are running: ./check-stack.sh"
    echo "  2. Check backend logs: tail -f backend/logs/app.log"
    echo "  3. Restart services if needed"
fi
