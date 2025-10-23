#!/bin/bash

# ============================================
# Life Recorder Backend - Deployment Script
# ============================================

set -e

echo "🚀 Deploying Life Recorder Backend..."

# Parse arguments
PLATFORM=${1:-"railway"}

case $PLATFORM in
  railway)
    echo "📦 Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        echo "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    echo "🚂 Starting Railway deployment..."
    railway up
    
    echo "✅ Deployed to Railway successfully!"
    ;;
    
  render)
    echo "📦 Deploying to Render..."
    echo "Please push to your Git repository. Render will auto-deploy."
    echo "Or use Render Blueprint: render.yaml"
    ;;
    
  vercel)
    echo "📦 Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    echo "▲ Starting Vercel deployment..."
    vercel --prod
    
    echo "✅ Deployed to Vercel successfully!"
    ;;
    
  docker)
    echo "🐳 Building Docker image..."
    
    # Build image
    docker build -t life-recorder-api:latest .
    
    echo "✅ Docker image built successfully!"
    echo "Run: docker-compose up -d"
    ;;
    
  *)
    echo "❌ Unknown platform: $PLATFORM"
    echo "Usage: ./deploy.sh [railway|render|vercel|docker]"
    exit 1
    ;;
esac

echo ""
echo "🎉 Deployment process completed!"
echo ""

