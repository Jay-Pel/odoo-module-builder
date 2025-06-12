#!/bin/bash

# Odoo Module Builder v3 - Improved Setup Script
# This script sets up the development environment with all architectural improvements

set -e  # Exit on any error

echo "🚀 Setting up Odoo Module Builder v3 with architectural improvements..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python 3.11+ is available
print_status "Checking Python version..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    print_success "Python $PYTHON_VERSION found"
else
    print_error "Python 3 not found. Please install Python 3.11+ first."
    exit 1
fi

# Check if Node.js is available
print_status "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION found"
else
    print_error "Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

# Generate environment files from centralized configuration
print_status "Generating environment files from centralized configuration..."
if [ -f "config.yml" ]; then
    python3 scripts/generate_env.py --env development
    print_success "Environment files generated successfully"
else
    print_error "config.yml not found. Please ensure you're in the project root directory."
    exit 1
fi

# Backend setup
print_status "Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
else
    print_status "Virtual environment already exists"
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
print_success "Python dependencies installed"

# Initialize database if it doesn't exist
if [ ! -f "local_dev.db" ]; then
    print_status "Initializing database..."
    # The database will be created automatically when the app starts
    print_success "Database will be initialized on first run"
fi

cd ..

# Frontend setup
print_status "Setting up frontend..."
cd frontend

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install
print_success "Node.js dependencies installed"

cd ..

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Make scripts executable
chmod +x scripts/generate_env.py

# Prompt user for API keys
print_warning "Setup complete! Please configure your API keys in the environment files:"
echo ""
echo "Backend (.env file location: backend/.env):"
echo "  - JWT_SECRET_KEY (already generated)"
echo "  - GEMINI_API_KEY (required for specification generation)"
echo "  - ANTHROPIC_API_KEY (required for code generation)"
echo "  - STRIPE_SECRET_KEY (required for payments)"
echo "  - STRIPE_WEBHOOK_SECRET (required for payment webhooks)"
echo ""
echo "Frontend (.env file location: frontend/.env):"
echo "  - VITE_STRIPE_PUBLISHABLE_KEY (required for payment forms)"
echo ""

print_success "Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure your API keys in the .env files"
echo "2. Start the backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "3. Start the frontend: cd frontend && npm run dev"
echo "4. Visit http://localhost:5173 to use the application"
echo "5. Check the health endpoint: http://localhost:8000/health"
echo ""
echo "New features enabled:"
echo "✅ Enhanced health checks with service status"
echo "✅ Structured logging with rich output"
echo "✅ Real-time WebSocket updates for code generation"
echo "✅ Centralized configuration management"
echo "✅ Type-safe API client generation (run: npm run generate-api)"
echo ""
print_warning "Remember to check the health endpoint to ensure all services are properly configured!" 