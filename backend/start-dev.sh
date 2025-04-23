#!/bin/bash

# Make the script executable with: chmod +x start-dev.sh

echo "Starting Odoo Module Builder Backend..."
echo "Installing dependencies..."
pip install -r requirements.txt

echo "Starting Flask server..."
python main.py