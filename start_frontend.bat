@echo off
title TruthShield Frontend Server (Vite React)
echo ===================================================
echo Starting TruthShield Frontend Dev Server...
echo URL: http://localhost:5173
echo ===================================================
cd /d "%~dp0frontend"
npm.cmd run dev
pause
