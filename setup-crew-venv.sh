#!/bin/bash
# Setup script for CrewAI virtual environment
# Run this once: bash setup-crew-venv.sh

set -e

echo "🔧 Setting up CrewAI environment..."

# Check Python 3.13 exists
if ! command -v python3.13 &> /dev/null; then
    echo "❌ Python 3.13 not found. Install with: brew install python@3.13"
    exit 1
fi

PYTHON_VERSION=$(python3.13 --version | awk '{print $2}')
echo "✓ Found Python $PYTHON_VERSION"

# Remove old venv if it exists
if [ -d "crew_venv" ]; then
    echo "🗑️  Removing old crew_venv..."
    rm -rf crew_venv
fi

# Create venv with Python 3.13
echo "📦 Creating crew_venv with Python 3.13..."
python3.13 -m venv crew_venv

# Activate and upgrade pip
echo "📦 Installing dependencies..."
source crew_venv/bin/activate
pip install --upgrade pip -q
pip install -r crew/requirements.txt -q

# Verify installation
python -c "import crewai; print('✅ crewai installed successfully')" 2>/dev/null || {
    echo "❌ Failed to import crewai"
    exit 1
}

echo ""
echo "✅ CrewAI environment ready!"
echo ""
echo "To start the CrewAI server, run:"
echo "  source crew_venv/bin/activate"
echo "  ANTHROPIC_API_KEY='your-key' python -m uvicorn crew.main:app --host 0.0.0.0 --port 8000"
