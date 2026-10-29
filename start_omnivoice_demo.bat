@echo off
title OmniVoice Demo Launcher - TruthShield
echo ========================================================
echo       OmniVoice Multilingual Zero-Shot TTS Demo
echo ========================================================
echo.
cd /d "%~dp0ai_ml\OmniVoice"

if exist ".venv\Scripts\python.exe" (
    echo [1/2] Virtual environment verified!
    echo [2/2] Launching OmniVoice Web UI on http://127.0.0.1:8001...
    echo.
    echo Press Ctrl+C in this window to stop the OmniVoice server.
    echo.
    .venv\Scripts\python.exe -m omnivoice.cli.demo --ip 127.0.0.1 --port 8001
) else (
    echo [ERROR] OmniVoice virtual environment not found in ai_ml\OmniVoice\.venv.
    echo Please make sure uv sync has completed inside ai_ml\OmniVoice.
)

pause
