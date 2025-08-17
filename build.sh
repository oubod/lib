#!/bin/bash

# Netlify build script for Biblio Médicale IA
set -e

echo "🚀 Starting build process..."

# Check Node.js version
echo "📋 Node.js version: $(node --version)"
echo "📋 npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Type check
echo "🔍 Running TypeScript type check..."
npx tsc --noEmit || {
    echo "⚠️ TypeScript type check failed, but continuing with build..."
}

# Build the application
echo "🏗️ Building application..."
npm run build:vite

# Verify build output
echo "✅ Verifying build output..."
if [ -d "dist" ]; then
    echo "📁 dist/ directory created successfully"
    echo "📄 Contents of dist/:"
    ls -la dist/
    echo "📄 Contents of dist/assets/:"
    ls -la dist/assets/
else
    echo "❌ dist/ directory not found!"
    exit 1
fi

echo "🎉 Build completed successfully!"
