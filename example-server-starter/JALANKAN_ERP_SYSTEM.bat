@echo off
TITLE ERP INTERNAL HBM - Server Launcher
COLOR 0B

echo ====================================================
echo    HBM CORP - ERP INTERNAL SYSTEM EXECUTOR
echo ====================================================
echo.
echo Menjalankan PowerShell Script...

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-erp-servers.ps1"

pause
