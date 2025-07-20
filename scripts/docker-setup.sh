#!/bin/bash

# Docker Setup Script for Wellness Platform
# This script helps you get the application running quickly with Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏥 Wellness Platform Docker Setup${NC}"
echo "=================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p nginx
mkdir -p scripts

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}📋 Creating environment file...${NC}"
    cp .env.docker .env
    echo -e "${YELLOW}⚠️  Please edit .env file and set your MOCK_API_URL${NC}"
    echo -e "${YELLOW}   Example: MOCK_API_URL=https://your-id.mock.pstmn.io${NC}"
fi

# Function to start services
start_services() {
    echo -e "${BLUE}🚀 Starting services...${NC}"
    docker-compose up -d postgres
    
    echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
    sleep 10
    
    docker-compose up -d backend
    
    echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
    sleep 5
    
    docker-compose up -d frontend
    
    echo -e "${GREEN}✅ All services started successfully!${NC}"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔗 Backend API: http://localhost:5000/api"
    echo "🗄️  Database: localhost:5432"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
}

# Function to stop services
stop_services() {
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Function to restart services
restart_services() {
    echo -e "${YELLOW}🔄 Restarting services...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ Services restarted${NC}"
}

# Function to view logs
view_logs() {
    echo -e "${BLUE}📋 Viewing logs (Ctrl+C to exit)...${NC}"
    docker-compose logs -f
}

# Function to clean up
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up Docker resources...${NC}"
    docker-compose down -v
    docker system prune -f
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to check status
check_status() {
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker-compose ps
    echo ""
    
    # Check health endpoints
    echo -e "${BLUE}🏥 Health Checks:${NC}"
    
    if curl -s http://localhost:5000/api/health > /dev/null; then
        echo -e "${GREEN}✅ Backend: Healthy${NC}"
    else
        echo -e "${RED}❌ Backend: Unhealthy${NC}"
    fi
    
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ Frontend: Healthy${NC}"
    else
        echo -e "${RED}❌ Frontend: Unhealthy${NC}"
    fi
}

# Function to run database migrations
run_migrations() {
    echo -e "${BLUE}🗄️  Running database migrations...${NC}"
    docker-compose exec backend npm run sync
    echo -e "${GREEN}✅ Database sync completed${NC}"
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  logs      View service logs"
    echo "  status    Check service status"
    echo "  sync      Sync data from external API"
    echo "  clean     Clean up Docker resources"
    echo "  help      Show this help message"
}

# Main script logic
case "${1:-start}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        view_logs
        ;;
    status)
        check_status
        ;;
    sync)
        run_migrations
        ;;
    clean)
        cleanup
        ;;
    help)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
