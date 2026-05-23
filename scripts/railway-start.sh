#!/bin/bash

# Railway deployment startup script
# Initializes database and starts the application

set -e  # Exit on error

echo "========== Railway Startup Script =========="

# Initialize database schema
echo "Initializing database..."
node scripts/init-db.js

if [ $? -ne 0 ]; then
  echo "✗ Database initialization failed!"
  exit 1
fi

echo "✓ Database initialized"

# Start the application
echo "Starting Next.js application..."
exec node_modules/.bin/next start
