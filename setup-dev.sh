#!/bin/bash

# Development Environment Setup Script
# This script helps you set up your .env file safely

echo "🚀 Setting up Odoo Module Builder development environment..."

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo "📋 Creating .env file from template..."
    cp backend/env.example backend/.env
    echo "✅ Created backend/.env from template"
else
    echo "✅ backend/.env already exists"
fi

# Check if API keys are set
echo "🔍 Checking API key configuration..."

if grep -q "your_gemini_api_key_here" backend/.env; then
    echo "⚠️  GEMINI_API_KEY not configured"
    echo "   Please edit backend/.env and add your Gemini API key"
fi

if grep -q "your_anthropic_api_key_here" backend/.env; then
    echo "⚠️  ANTHROPIC_API_KEY not configured"
    echo "   Please edit backend/.env and add your Anthropic API key"
fi

# Check if JWT secret is set
if grep -q "your-super-secret-jwt-key-change-this-in-production" backend/.env; then
    echo "⚠️  JWT_SECRET_KEY is using default value"
    echo "   Consider generating a new secret for security"
fi

echo ""
echo "📝 To configure your API keys:"
echo "   1. Get Gemini API key from: https://makersuite.google.com/app/apikey"
echo "   2. Get Anthropic API key from: https://console.anthropic.com/"
echo "   3. Edit backend/.env and replace the placeholder values"
echo ""
echo "🔧 Then start the servers:"
echo "   Backend:  cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "   Frontend: cd frontend && npm run dev"
echo ""
echo "✅ Setup complete!" 