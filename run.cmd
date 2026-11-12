@echo off
rem Starts GymApp locally: http://localhost:5173 (Ctrl+C to stop).
rem Works from any folder, or by double-clicking this file.
rem The port is fixed on purpose: the browser keeps the app's data per address,
rem so a different port would open an empty app. If 5173 is busy, this stops
rem with an error instead of quietly moving to another port.
cd /d "%~dp0frontend" || exit /b 1
if not exist node_modules (
  echo Installing packages the first time...
  call npm install || exit /b 1
)
call npm run dev -- --port 5173 --strictPort
