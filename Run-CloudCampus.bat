@echo off
setlocal
set "BACKEND_DIR=%~dp0backend"
if not exist "%BACKEND_DIR%\package.json" (
  echo CloudCampus backend was not found.
  echo Expected folder: "%BACKEND_DIR%"
  pause
  exit /b 1
)
cd /d "%BACKEND_DIR%"
echo Starting CloudCampus...
echo When the API reports that it is listening on port 5000, open http://localhost:5000
 echo Leave this window open while you use CloudCampus.
echo.
call npm start
echo.
echo CloudCampus has stopped.
pause