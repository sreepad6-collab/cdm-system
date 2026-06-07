@echo off
title CDM Cash Management System - Launcher
color 0A
echo.
echo  =====================================================
echo   CDM Cash Management System - Starting...
echo  =====================================================
echo.

:: Step 1: Create temp dir for Java fix
if not exist "C:\CDMTemp" mkdir "C:\CDMTemp"
set TMP=C:\CDMTemp
set TEMP=C:\CDMTemp

:: Step 2: Check if backend JAR exists
if not exist "%~dp0cdm-backend\target\cdm-backend-1.0.0.jar" (
  echo [ERROR] Backend JAR not found. Build the project first.
  pause
  exit /b 1
)

:: Step 3: Start Backend in its own window
echo [1/3] Starting Backend (Spring Boot)...
start "CDM Backend - Port 8080" cmd /k "set TMP=C:\CDMTemp && set TEMP=C:\CDMTemp && set JAVA_HOME=C:\Users\Hare Krishna\AppData\Local\Programs\Eclipse Adoptium\jdk-25.0.3.9-hotspot && echo Backend starting on http://localhost:8080 && C:\Users\Hare Krishna\AppData\Local\Programs\Eclipse Adoptium\jdk-25.0.3.9-hotspot\bin\java.exe -jar %~dp0cdm-backend\target\cdm-backend-1.0.0.jar"

:: Step 4: Wait for backend to start
echo [2/3] Waiting 15 seconds for backend to start...
timeout /t 15 /nobreak > nul

:: Step 5: Start Vite Web App in its own window
echo [3/3] Starting Web App (React Vite)...
start "CDM Web App - Port 5173" cmd /k "cd /d %~dp0cdm-web && echo Web app starting on http://localhost:5173 && npm run dev"

:: Step 6: Wait for Vite to start
echo Waiting 8 seconds for web app to start...
timeout /t 8 /nobreak > nul

:: Step 7: Open Chrome
echo Opening Chrome at http://localhost:5173 ...
start "" "http://localhost:5173"

echo.
echo  =====================================================
echo   DONE! Two windows opened:
echo   - CDM Backend  : http://localhost:8080
echo   - CDM Web App  : http://localhost:5173
echo  =====================================================
echo.
echo  Chrome opened at http://localhost:5173
echo  Keep both windows open while using the system.
echo.
pause
