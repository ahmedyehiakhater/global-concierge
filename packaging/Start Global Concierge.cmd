@echo off
cd /d "%~dp0"
if not exist "runtime\node.exe" (
  echo Extract the entire ZIP first. The bundled runtime is missing.
  pause
  exit /b 1
)
"%~dp0runtime\node.exe" "%~dp0packaging\launch.js" start
if errorlevel 1 (
  echo If your work PC blocked the runtime, contact your IT team. Do not disable security controls.
  pause
  exit /b 1
)
timeout /t 3 >nul
