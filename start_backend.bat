@echo off
title TruthShield Backend Server (FastAPI)
echo ===================================================
echo Starting TruthShield FastAPI Backend Server...
echo Host: http://127.0.0.1:8000
echo Docs: http://127.0.0.1:8000/docs
echo ===================================================
cd /d "%~dp0backend"
if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
) else (
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
)
pause
