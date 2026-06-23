@echo off
TITLE HRIS NEXUS HR - Server Launcher
COLOR 0B

echo ====================================================
echo    HBM CORP - HRIS SYSTEM EXECUTOR (NEXUS HR)
echo ====================================================
echo.
echo Menjalankan PowerShell Script...

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-hris-servers.ps1"

pause
