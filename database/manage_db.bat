@echo off
title TruthShield Database Manager
color 0B
echo ======================================================================
echo          TruthShield Database Layer Management Utility
echo    Layer Lead: Soni (Roll No: 2501320140140) - GNIOT / AKTU
echo ======================================================================
echo.
echo Choose an option:
echo  [1] Initialize and Seed Local SQLite Database
echo  [2] Initialize and Seed PostgreSQL Database (via Docker / Remote)
echo  [3] Setup ChromaDB Vector Store & Ingest Claims
echo  [4] View Schema Tables & Row Counts
echo  [5] Exit
echo.
set /p choice=Enter selection [1-5]: 

if "%choice%"=="1" goto opt1
if "%choice%"=="2" goto opt2
if "%choice%"=="3" goto opt3
if "%choice%"=="4" goto opt4
if "%choice%"=="5" goto end

:opt1
echo Initializing Local SQLite...
..\backend\venv\Scripts\python.exe init_db.py sqlite:///../misinfo_app.db
pause
goto end

:opt2
echo Initializing PostgreSQL Database...
set /p pg_url=Enter PostgreSQL URL (default: postgresql://postgres:postgres@localhost:5432/misinfo_db): 
if "%pg_url%"=="" set pg_url=postgresql://postgres:postgres@localhost:5432/misinfo_db
..\backend\venv\Scripts\python.exe init_db.py %pg_url%
pause
goto end

:opt3
echo Initializing ChromaDB Vector Store...
..\backend\venv\Scripts\python.exe chroma_setup.py
pause
goto end

:opt4
echo Inspecting Database Schema...
..\backend\venv\Scripts\python.exe init_db.py
pause
goto end

:end
exit /b
