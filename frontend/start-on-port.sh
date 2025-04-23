#!/bin/bash
# Kills any existing webpack process and starts the app on port 3457
echo "Killing any existing webpack processes..."
pkill -f webpack || true
echo "Starting frontend on port 3457..."
PORT=3457 npm start 