@echo off
title CDM Cash Management System
color 0A
echo.
echo  =====================================================
echo   CDM Cash Management System
echo   Opening at: http://localhost:8080
echo  =====================================================
echo.

:: Fix for Java 25 on Windows
if not exist "C:\CDMTemp" mkdir "C:\CDMTemp"
set TMP=C:\CDMTemp
set TEMP=C:\CDMTemp
set JAVA_HOME=C:\Users\Hare Krishna\AppData\Local\Programs\Eclipse Adoptium\jdk-25.0.3.9-hotspot
set JAR=%~dp0cdm-backend\target\cdm-backend-1.0.0.jar

echo Starting server...
start "" "%JAVA_HOME%\bin\java.exe" -jar "%JAR%"

echo Waiting for server to start...
timeout /t 15 /nobreak > nul

echo Opening browser...
start "" "http://localhost:8080"

echo.
echo  =====================================================
echo   System is running at http://localhost:8080
echo   Close this window only when you want to stop.
echo  =====================================================
echo.
pause
