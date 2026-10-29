@echo off
title TruthShield AI/ML Pipeline
color 0A
echo ======================================================================
echo              TruthShield AI & Machine Learning Layer
echo   Layer Lead: Aarti Vishwakarma (Roll No: 2501320140001) - GNIOT / AKTU
echo ======================================================================
echo.
echo Choose an option:
echo  [1] Train TF-IDF + Logistic Regression Classifier & Save Weights
echo  [2] Run Benchmark Evaluation & Calibration Metric Suite (ECE)
echo  [3] Test Interactive ML Inference Predictor
echo  [4] Run OmniVoice Multilingual Speech Diagnostic Test
echo  [5] Launch OmniVoice Interactive Web UI Demo (Gradio)
echo  [6] Exit
echo.
set /p choice=Enter selection [1-6]: 

if "%choice%"=="1" goto opt1
if "%choice%"=="2" goto opt2
if "%choice%"=="3" goto opt3
if "%choice%"=="4" goto opt4
if "%choice%"=="5" goto opt5
if "%choice%"=="6" goto end

:opt1
echo Training ML Classifier...
..\backend\venv\Scripts\python.exe train_classifier.py
pause
goto end

:opt2
echo Running Benchmark Evaluation Suite...
..\backend\venv\Scripts\python.exe evaluate_benchmarks.py
pause
goto end

:opt3
echo Running Predictor on Sample Statement...
..\backend\venv\Scripts\python.exe -c "import sys; from predictor import TruthShieldMLPredictor; p = TruthShieldMLPredictor(); res = p.predict('Drinking boiled garlic water cures lung virus in 2 hours! Forward immediately!'); print('Predicted:', res['category_3tier'], '| Confidence:', res['confidence'], '| Reasons:', res['reasons'])"
pause
goto end

:opt4
echo Running OmniVoice Diagnostics...
if exist "OmniVoice\.venv\Scripts\python.exe" (
    OmniVoice\.venv\Scripts\python.exe test_omnivoice.py
) else (
    ..\backend\venv\Scripts\python.exe test_omnivoice.py
)
pause
goto end

:opt5
echo Launching OmniVoice Interactive Web UI Demo...
if exist "OmniVoice\.venv\Scripts\python.exe" (
    start http://127.0.0.1:8001
    OmniVoice\.venv\Scripts\python.exe -m omnivoice.cli.demo --ip 127.0.0.1 --port 8001
) else (
    echo Error: OmniVoice .venv not found.
)
pause
goto end

:end
exit /b
