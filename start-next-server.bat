@echo off
echo 🚀 Uruchamianie serwera Next.js na porcie 3000...
echo.

REM Sprawdź czy port 3000 jest zajęty
netstat -ano | findstr :3000 > nul
if %errorlevel% == 0 (
    echo ⚠️ Port 3000 jest zajęty. Próbuję zabić proces...
    taskkill /f /im node.exe > nul 2>&1
    timeout /t 2 > nul
)

echo 📦 Sprawdzanie czy node_modules istnieje...
if not exist "node_modules" (
    echo 📥 Instalowanie zależności...
    npm install
)

echo 🔧 Uruchamianie serwera deweloperskiego...
npm run dev

pause
