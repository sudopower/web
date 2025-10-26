#!/bin/bash

# SUDOPOWER Blog Development Script

echo "🚀 Starting SUDOPOWER Blog Development Server"
echo "=============================================="

# Check if Hugo is installed
if ! command -v hugo &> /dev/null; then
    echo "❌ Hugo is not installed. Please install Hugo first:"
    echo "   brew install hugo"
    exit 1
fi

# Check Hugo version
echo "📦 Hugo version: $(hugo version)"

# Start the development server
echo "🌐 Starting development server on http://localhost:1313"
echo "📝 Draft posts are enabled"
echo "🔄 Live reload is enabled"
echo "⚙️  Using development config (hugo.dev.toml)"
echo "🎨 CSS and assets will load correctly with local baseURL"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

hugo server --buildDrafts --bind 0.0.0.0 --port 1313 --config hugo.dev.toml --disableFastRender
