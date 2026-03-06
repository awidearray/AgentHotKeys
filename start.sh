#!/bin/bash

# Railway deployment start script
echo "🚀 Starting Hotkeys AI on Railway..."

# Set production environment
export NODE_ENV=production

# Log environment info
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Environment: $NODE_ENV"

# Start the application
npm start