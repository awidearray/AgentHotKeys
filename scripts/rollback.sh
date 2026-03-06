#!/bin/bash

# Rollback Script for Production Deployment
# Usage: ./rollback.sh [version]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/var/backups/hotkeys-ai"
DEPLOYMENT_DIR="/var/www/hotkeys-ai"
MAX_BACKUPS=5

echo -e "${YELLOW}Starting rollback process...${NC}"

# Function to list available backups
list_backups() {
    echo -e "${GREEN}Available backups:${NC}"
    ls -lt "$BACKUP_DIR" | grep "backup-" | head -$MAX_BACKUPS
}

# Function to perform rollback
rollback() {
    local backup_version=$1
    local backup_path="$BACKUP_DIR/$backup_version"
    
    if [ ! -d "$backup_path" ]; then
        echo -e "${RED}Error: Backup $backup_version not found${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Rolling back to $backup_version...${NC}"
    
    # Create current backup before rollback
    current_timestamp=$(date +%Y%m%d_%H%M%S)
    current_backup="$BACKUP_DIR/backup-rollback-$current_timestamp"
    
    echo "Creating backup of current deployment..."
    cp -r "$DEPLOYMENT_DIR" "$current_backup"
    
    # Stop the application
    echo "Stopping application..."
    systemctl stop hotkeys-ai || pm2 stop hotkeys-ai || true
    
    # Clear current deployment
    echo "Clearing current deployment..."
    rm -rf "$DEPLOYMENT_DIR"/*
    
    # Restore from backup
    echo "Restoring from backup..."
    cp -r "$backup_path"/* "$DEPLOYMENT_DIR"
    
    # Restore environment variables
    if [ -f "$backup_path/.env.backup" ]; then
        cp "$backup_path/.env.backup" "$DEPLOYMENT_DIR/.env.local"
    fi
    
    # Install dependencies
    echo "Installing dependencies..."
    cd "$DEPLOYMENT_DIR"
    npm ci --production --legacy-peer-deps
    
    # Run database migrations (rollback if available)
    if [ -f "$backup_path/rollback.sql" ]; then
        echo "Running database rollback..."
        psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$backup_path/rollback.sql"
    fi
    
    # Rebuild application
    echo "Building application..."
    npm run build
    
    # Start the application
    echo "Starting application..."
    systemctl start hotkeys-ai || pm2 start ecosystem.config.js || npm start
    
    # Verify health
    echo "Verifying health..."
    sleep 5
    health_check=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
    
    if [ "$health_check" -eq 200 ]; then
        echo -e "${GREEN}Rollback successful! Application is healthy.${NC}"
        
        # Log rollback
        echo "$(date): Rolled back to $backup_version" >> "$BACKUP_DIR/rollback.log"
    else
        echo -e "${RED}Warning: Health check failed with status $health_check${NC}"
        echo "Please check application logs for details"
    fi
}

# Main script
if [ $# -eq 0 ]; then
    list_backups
    echo ""
    echo "Usage: $0 [backup-version]"
    echo "Example: $0 backup-20240301_120000"
    exit 0
fi

# Check if running with sufficient privileges
if [ "$EUID" -ne 0 ] && [ ! -w "$DEPLOYMENT_DIR" ]; then
    echo -e "${RED}Error: This script must be run with sufficient privileges${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform rollback
rollback "$1"

echo -e "${GREEN}Rollback process completed${NC}"