@echo off
cd /d "%~dp0"
"%~dp0runtime\node.exe" "%~dp0packaging\launch.js" stop
if errorlevel 1 pause
