@echo off
title CDM Mobile App
echo ============================================
echo   CDM Cash Management System - Mobile
echo   React Native / Expo
echo ============================================
echo.
echo Make sure the backend is running first!
echo Backend: http://localhost:8080
echo.
cd /d "%~dp0cdm-mobile"
npx expo start
pause
