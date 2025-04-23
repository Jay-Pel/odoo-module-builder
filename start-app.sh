#!/bin/bash

# Make the script executable with: chmod +x start-app.sh

echo "Starting Odoo Module Builder Application..."

# Check if concurrently is installed
if ! command -v concurrently &> /dev/null
then
    echo "Installing concurrently..."
    npm install
fi

# Start both frontend and backend servers
echo "Starting frontend and backend servers..."
npm start