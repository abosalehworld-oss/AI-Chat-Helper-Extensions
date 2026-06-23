@echo off
chcp 65001 >nul 2>&1
echo.
echo  ============================================
echo    AI Chat Helper - Building ZIP...
echo  ============================================
echo.
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "build.ps1"
echo.
pause
