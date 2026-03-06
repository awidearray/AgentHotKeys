#!/bin/bash

# Backup Script for Production Deployment
# Usage: ./backup.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/var/backups/hotkeys-ai"
DEPLOYMENT_DIR="/var/www/hotkeys-ai"
DB_NAME="${DB_NAME:-hotkeys_ai}"
MAX_BACKUPS=10

echo -e "${YELLOW}Starting backup process...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup-$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Create backup directory
mkdir -p "$BACKUP_PATH"

# Backup application files
echo "Backing up application files..."
cp -r "$DEPLOYMENT_DIR" "$BACKUP_PATH/app"

# Backup environment variables
if [ -f "$DEPLOYMENT_DIR/.env.local" ]; then
    echo "Backing up environment variables..."
    cp "$DEPLOYMENT_DIR/.env.local" "$BACKUP_PATH/.env.backup"
fi

# Backup database
if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ]; then
    echo "Backing up database..."
    pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_PATH/database.sql"
fi

# Create manifest
echo "Creating backup manifest..."
cat > "$BACKUP_PATH/manifest.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date)",
  "app_version": "$(cd $DEPLOYMENT_DIR && git describe --tags --always 2>/dev/null || echo 'unknown')",
  "node_version": "$(node --version)",
  "backup_size": "$(du -sh $BACKUP_PATH | cut -f1)"
}
EOF

# Compress backup
echo "Compressing backup..."
tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_PATH"

# Clean old backups
echo "Cleaning old backups..."
ls -t "$BACKUP_DIR"/backup-*.tar.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm

echo -e "${GREEN}Backup completed: $BACKUP_NAME.tar.gz${NC}"
echo "Location: $BACKUP_DIR/$BACKUP_NAME.tar.gz"

# Log backup
echo "$(date): Created backup $BACKUP_NAME" >> "$BACKUP_DIR/backup.log"