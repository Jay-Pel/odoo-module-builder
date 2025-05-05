#!/bin/bash
# n8n Local Setup Script for Odoo Module Builder
# This script installs and configures n8n locally on your machine

set -e

echo "==============================================" 
echo "  Setting up n8n locally for Odoo Module Builder"
echo "=============================================="

# Create directory for n8n data
mkdir -p ~/.n8n
mkdir -p ~/.n8n/workflows

# Create local n8n environment file
cat > ~/.n8n/.env << EOF
# Node settings
NODE_ENV=development
WEBHOOK_URL=http://localhost:3001/
PORT=3001

# Execution settings
EXECUTIONS_TIMEOUT=3600
EXECUTIONS_TIMEOUT_MAX=7200
EXECUTIONS_DATA_SAVE_ON_ERROR=all
EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
EXECUTIONS_DATA_SAVE_ON_PROGRESS=true

# Uncomment if you want to use queue mode with Redis
# EXECUTIONS_MODE=queue
# QUEUE_BULL_REDIS_HOST=localhost
# QUEUE_BULL_REDIS_PORT=6379
# QUEUE_BULL_REDIS_DB=0

# If using OpenAI API key
# OPENAI_API_KEY=your-openai-api-key
EOF

# Secure the .env file
chmod 600 ~/.n8n/.env

# Install n8n using npm
echo "Installing n8n..."
npm install -g n8n

# Copy workflows to n8n directory
echo "Copying workflows..."
cp -r ./workflows/* ~/.n8n/workflows/

echo "==============================================" 
echo "  n8n local setup completed!"
echo "  To start n8n, run: n8n start"
echo "  Access n8n at: http://localhost:3001"
echo "=============================================="
