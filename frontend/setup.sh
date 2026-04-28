#!/bin/bash

# AI SIEM System - Frontend Setup Script

echo "🛡️ AI SIEM System - Frontend Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js detected: $(node --version)"
echo "✅ npm detected: $(npm --version)"
echo ""

# Check if in frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the frontend directory."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Configuration:"
echo "   - Ensure your backend is running on http://localhost:8000"
echo "   - Create .env file if needed:"
echo "     REACT_APP_API_URL=http://localhost:8000/api"
echo ""
echo "🚀 Start development server:"
echo "   npm start"
echo ""
echo "🏗️ Build for production:"
echo "   npm run build"
echo ""
echo "✨ Happy coding!"
