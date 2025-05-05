#!/bin/bash
# Dependencies Installation Script for n8n on AWS Lightsail
# For Odoo Module Builder Project

set -e

echo "==============================================" 
echo "  Installing dependencies for n8n"
echo "=============================================="

# Update system
yum update -y
yum install -y git curl wget

# Install Node.js using NVM
echo "Installing Node.js..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm install 16 # n8n recommends Node.js 16 LTS
nvm use 16
nvm alias default 16

# Install global npm packages for all users
echo "Installing global npm packages..."
npm install -g n8n pm2

# Install and configure PostgreSQL
echo "Installing PostgreSQL..."
amazon-linux-extras install postgresql13 -y
yum install -y postgresql postgresql-server
postgresql-setup --initdb --unit postgresql
systemctl enable postgresql
systemctl start postgresql

# Create n8n database and user
echo "Configuring PostgreSQL for n8n..."
sudo -u postgres psql -c "CREATE USER n8n_user WITH PASSWORD 'change-me-in-production';"
sudo -u postgres psql -c "CREATE DATABASE n8n;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE n8n TO n8n_user;"

# Install and configure Redis for queue mode
echo "Installing Redis for queue mode..."
amazon-linux-extras install redis6 -y
systemctl enable redis
systemctl start redis

# Install Docker (for running Odoo test containers)
echo "Installing Docker..."
amazon-linux-extras install docker -y
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# Install Docker Compose
echo "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Nginx for reverse proxy
echo "Installing Nginx..."
amazon-linux-extras install nginx1 -y
systemctl enable nginx
systemctl start nginx

# Install Certbot for SSL
echo "Installing Certbot for SSL..."
yum install -y certbot python3-certbot-nginx

echo "==============================================" 
echo "  Dependencies installation completed"
echo "=============================================="
