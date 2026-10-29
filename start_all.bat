@echo off
title TruthShield Master Launcher
echo ===================================================
echo   TruthShield: AI Credibility Platform
echo ===================================================
echo.
echo [1/2] Starting Backend Server (Port 8000)...
start "TruthShield Backend (Port 8000)" cmd /k "cd /d "%~dp0backend" && if exist "venv\Scripts\python.exe" ( venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload ) else ( python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload )"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server (Port 5173)...
start "TruthShield Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo.
echo ===================================================
echo Both servers have been launched in separate windows!
echo - Backend API:    http://127.0.0.1:8000/docs
echo - Frontend Web:   http://localhost:5173
echo - AI Chat / Q^&A:  http://localhost:5173/chat (ChatGPT / Gemini style)
echo - OmniVoice Demo: start_omnivoice_demo.bat (Port 8001)
echo.
echo ---------------------------------------------------
echo Pre-Configured Credentials:
echo - Admin Panel:    http://localhost:5173/admin
echo   Username:       admin@truthshield.com
echo   Password:       admin123
echo.
echo - User Panel:     http://localhost:5173/user/panel
echo   Username:       user@truthshield.com
echo   Password:       user123
echo ===================================================
echo.
pause
