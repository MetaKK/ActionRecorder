#!/bin/bash

# ============================================
# Life Recorder Backend - Setup Script
# ============================================

set -e

echo "🚀 Setting up Life Recorder Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy .env.example to .env if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from env.example..."
    cp env.example .env
    echo "⚠️  Please edit .env and fill in your configuration!"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

# Ask if user wants to run migrations
read -p "Do you want to run database migrations now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️  Running database migrations..."
    npm run prisma:migrate
    echo "✅ Migrations completed"
else
    echo "⏭️  Skipping migrations. Run 'npm run prisma:migrate' manually later."
fi

echo ""
echo "✅ Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env and configure your environment variables"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:4000/health to verify"
echo ""

