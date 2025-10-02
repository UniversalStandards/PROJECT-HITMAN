#!/bin/bash

# GOFAP Deployment Script
# Production deployment script for Government Operations and Financial Accounting Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - Fixed: Export variables to make them available
export APP_NAME="gofap"
export DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="/var/backups/gofap"
LOG_FILE="/var/log/gofap-deploy.log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

# Pre-deployment checks
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if required environment variables are set
    if [ -z "$FLASK_SECRET_KEY" ]; then
        warning "FLASK_SECRET_KEY is not set"
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        warning "DATABASE_URL is not set, will use default SQLite"
    fi
    
    log "Prerequisites check completed"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
    fi
    
    BACKUP_NAME="gofap-backup-$(date +'%Y%m%d-%H%M%S').tar.gz"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    # Backup database and config files
    tar -czf "$BACKUP_PATH" \
        --exclude='*.log' \
        --exclude='__pycache__' \
        --exclude='node_modules' \
        instance/ \
        .env 2>/dev/null || true
    
    log "Backup created: $BACKUP_PATH"
}

# Build application
build_app() {
    log "Building application..."
    
    # Pull latest changes (if in git environment)
    if [ -d ".git" ]; then
        git pull origin main || warning "Could not pull latest changes"
    fi
    
    # Build Docker image
    docker build -t "${APP_NAME}:latest" . || {
        error "Failed to build Docker image"
        exit 1
    }
    
    log "Application built successfully"
}

# Deploy with Docker Compose
deploy_with_compose() {
    log "Deploying with Docker Compose..."
    
    # Stop existing services
    docker-compose -f "$DOCKER_COMPOSE_FILE" down || warning "No existing services to stop"
    
    # Start services with the Docker Compose file
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d || {
        error "Failed to start services with Docker Compose"
        exit 1
    }
    
    log "Services started successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations inside the container
    docker exec "${APP_NAME}_web_1" flask db upgrade || {
        warning "Database migrations failed or not configured"
    }
    
    log "Database migrations completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 30
    
    # Check if application is responding
    if curl -f -s http://localhost:5000/ > /dev/null; then
        log "Application is healthy and responding"
    else
        error "Application health check failed"
        return 1
    fi
}

# Cleanup old images
cleanup() {
    log "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f || warning "Could not clean up images"
    
    # Keep only last 3 backups
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "gofap-backup-*.tar.gz" -type f | sort -r | tail -n +4 | xargs -r rm -f
    fi
    
    log "Cleanup completed"
}

# Main deployment flow
main() {
    log "Starting deployment of GOFAP..."
    
    check_prerequisites
    create_backup
    build_app
    deploy_with_compose
    run_migrations
    
    if health_check; then
        cleanup
        log "Deployment completed successfully!"
    else
        error "Deployment failed - rolling back..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "check")
        check_prerequisites
        ;;
    "backup")
        create_backup
        ;;
    "build")
        build_app
        ;;
    "deploy")
        main
        ;;
    "health")
        health_check
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {check|backup|build|deploy|health|cleanup}"
        echo ""
        echo "Commands:"
        echo "  check   - Check prerequisites"
        echo "  backup  - Create backup only"
        echo "  build   - Build application only"
        echo "  deploy  - Full deployment (default)"
        echo "  health  - Run health check"
        echo "  cleanup - Clean up old resources"
        echo ""
        echo "Environment variables:"
        echo "  FLASK_SECRET_KEY - Flask secret key (required)"
        echo "  DATABASE_URL     - Database connection string"
        echo "  STRIPE_SECRET_KEY - Stripe API secret key"
        echo "  MODERN_TREASURY_API_KEY - Modern Treasury API key"
        echo ""
        if [ "${1:-}" = "" ]; then
            main
        else
            exit 1
        fi
        ;;
esac