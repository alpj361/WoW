#!/bin/bash

echo "🐳 Testing Docker Backend"
echo "=========================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker found${NC}"

# Build image
echo ""
echo "🔨 Building Docker image..."
docker build -t collaborative-map-backend:test . || {
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Build successful${NC}"

# Run container
echo ""
echo "🚀 Starting container..."
docker run -d \
    --name backend-test \
    -p 8765:80 \
    -e OUTSCRAPER_API_KEY="" \
    -e EXA_API_KEY="" \
    -e SUPADATA_API_KEY="" \
    collaborative-map-backend:test || {
    echo -e "${RED}❌ Container start failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Container started${NC}"

# Wait for service to be ready
echo ""
echo "⏳ Waiting for service to be ready..."
sleep 5

# Test endpoints
echo ""
echo "🧪 Testing endpoints..."
echo ""

# Health check
echo -e "${YELLOW}Testing /api/health...${NC}"
HEALTH=$(curl -s http://localhost:8765/api/health)
if echo "$HEALTH" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "$HEALTH"
fi

echo ""
echo -e "${YELLOW}Testing /api/places...${NC}"
PLACES=$(curl -s "http://localhost:8765/api/places?category=coffee&limit=2")
if echo "$PLACES" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Places API passed${NC}"
    echo "$PLACES" | python3 -m json.tool 2>/dev/null | head -30 || echo "$PLACES" | head -30
else
    echo -e "${RED}❌ Places API failed${NC}"
    echo "$PLACES"
fi

echo ""
echo -e "${YELLOW}Testing /api/events...${NC}"
EVENTS=$(curl -s "http://localhost:8765/api/events?location=Guatemala&limit=2")
if echo "$EVENTS" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Events API passed${NC}"
else
    echo -e "${RED}❌ Events API failed${NC}"
    echo "$EVENTS"
fi

# Show logs
echo ""
echo "📋 Recent logs:"
docker logs --tail 20 backend-test

# Cleanup
echo ""
read -p "🗑️  Remove test container? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker stop backend-test
    docker rm backend-test
    echo -e "${GREEN}✅ Cleaned up${NC}"
else
    echo -e "${YELLOW}Container still running on http://localhost:8765${NC}"
    echo "To stop: docker stop backend-test"
    echo "To remove: docker rm backend-test"
fi

echo ""
echo "🎉 Test complete!"
