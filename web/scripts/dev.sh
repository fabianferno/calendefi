#!/bin/bash

# CalendeFi Web Development Script
echo "🚀 Starting CalendeFi Web Development Server..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🌐 Starting Next.js development server on http://localhost:3000"
npm run dev
