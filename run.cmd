@echo off
rem Starts GymApp locally: http://localhost:5173 (Ctrl+C to stop).
rem Works from any folder, or by double-clicking this file.
cd /d "%~dp0frontend" || exit /b 1
if not exist node_modules (
  echo Installing packages the first time...
  call npm install || exit /b 1
)
call npm run dev
