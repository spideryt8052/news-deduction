import os
import sys
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
VENV_PYTHON = BACKEND_DIR / "venv" / "Scripts" / "python.exe"

if __name__ == "__main__":
    py_executable = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable
    target_script = str(BACKEND_DIR / "run.py")

    print("=" * 60)
    print(">> Starting TruthShield Backend (FastAPI)...")
    print(f"   Python: {py_executable}")
    print("   API: http://127.0.0.1:8000")
    print("   Docs: http://127.0.0.1:8000/docs")
    print("=" * 60)

    try:
        subprocess.run([py_executable, target_script], cwd=str(BACKEND_DIR))
    except KeyboardInterrupt:
        print("\nTruthShield Backend stopped.")
