import sys
from pathlib import Path

# Ensure backend directory is in python path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# If uvicorn is not in current environment, auto-switch to venv Python
VENV_PYTHON = BASE_DIR / "venv" / "Scripts" / "python.exe"
if VENV_PYTHON.exists() and sys.executable.lower() != str(VENV_PYTHON).lower():
    try:
        import uvicorn
    except ImportError:
        import subprocess
        sys.exit(subprocess.call([str(VENV_PYTHON)] + sys.argv))

import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print(">> Starting TruthShield FastAPI Backend Server")
    print("   API URL: http://127.0.0.1:8000")
    print("   Swagger Docs: http://127.0.0.1:8000/docs")
    print("=" * 60)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
