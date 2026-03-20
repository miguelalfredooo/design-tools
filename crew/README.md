# CrewAI Backend

FastAPI server for Carrier's design synthesis pipeline using CrewAI agents.

## Requirements

⚠️ **IMPORTANT:** CrewAI requires **Python ≤3.13** (NOT 3.14+)

- Python 3.13.x
- Node.js 18+ (for running Carrier frontend)
- Anthropic API key

## Setup

### 1. Install Python 3.13 (if needed)

```bash
# macOS with Homebrew
brew install python@3.13

# Verify installation
python3.13 --version  # Should be 3.13.x
```

### 2. Create Virtual Environment

**Option A: Automated Setup**
```bash
bash ../setup-crew-venv.sh
```

**Option B: Manual Setup**
```bash
python3.13 -m venv ../crew_venv
source ../crew_venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Verify Installation

```bash
source ../crew_venv/bin/activate
python -c "import crewai; print('✅ Ready to go!')"
```

## Running the Server

```bash
# From project root
source $HOME/.cargo/env
source crew_venv/bin/activate
ANTHROPIC_API_KEY="sk-ant-..." python -m uvicorn crew.main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

- `POST /design-ops/run` - Run synthesis tier with design brief
- `GET /health` - Server health check

## Troubleshooting

### ModuleNotFoundError: No module named 'crewai'

**Cause:** Wrong Python version or venv not activated

**Fix:**
```bash
# Check Python version in venv
source crew_venv/bin/activate
python --version  # Must be 3.13.x

# If wrong version, recreate venv
bash setup-crew-venv.sh
```

### "Requires-Python >=3.10,<3.14" error during pip install

**Cause:** Using Python 3.14+ with CrewAI (which doesn't support it yet)

**Fix:** Use Python 3.13
```bash
# Remove old venv
rm -rf crew_venv

# Create with Python 3.13
python3.13 -m venv crew_venv
source crew_venv/bin/activate
pip install -r requirements.txt
```

### Port 8000 already in use

```bash
# Find process on port 8000
lsof -i :8000

# Kill it
kill -9 <PID>
```

## Dependencies

See `requirements.txt` for pinned versions. Key packages:
- `crewai==1.10.1` - Agent framework
- `anthropic` - Claude API client
- `fastapi` - Web framework
- `uvicorn[standard]` - ASGI server
- `supabase` - Database client

## Notes for Future Maintainers

- **Do NOT upgrade to Python 3.14** until CrewAI supports it
- Check CrewAI release notes before updating the version
- The setup script (`../setup-crew-venv.sh`) automates the Python 3.13 venv creation
