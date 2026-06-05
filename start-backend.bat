@echo off
title CDM Backend Server
echo ============================================
echo   CDM Cash Management System - Backend
echo   Starting on http://localhost:8080
echo ============================================
echo.

:: Fix for Java 25 on Windows with username containing spaces
:: (AF_UNIX sockets fail when TMP/TEMP path has spaces or short-form names)
set TMP=C:\CDMTemp
set TEMP=C:\CDMTemp
if not exist "C:\CDMTemp" mkdir "C:\CDMTemp"

set JAVA_HOME=C:\Users\Hare Krishna\AppData\Local\Programs\Eclipse Adoptium\jdk-25.0.3.9-hotspot
set JAR=cdm-backend\target\cdm-backend-1.0.0.jar

echo Starting server...
"%JAVA_HOME%\bin\java.exe" -jar "%~dp0%JAR%"

echo.
echo Server stopped. Press any key to exit.
pause
