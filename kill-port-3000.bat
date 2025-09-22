@echo off
echo 🔍 Zarządzanie portem 3000
echo ==========================

echo 📡 Sprawdzanie procesów na porcie 3000...
netstat -ano | findstr :3000
if %ERRORLEVEL% == 0 (
    echo ⚠️  Port 3000 jest używany
    echo.
    echo 🔪 Zabijanie wszystkich procesów Node.js...
    taskkill /F /IM node.exe /T 2>nul
    
    echo.
    echo 🔍 Sprawdzanie czy port jest teraz wolny...
    netstat -ano | findstr :3000
    if %ERRORLEVEL% == 0 (
        echo ❌ Port 3000 nadal jest używany - może wymagać restart komputera
    ) else (
        echo ✅ Port 3000 jest teraz wolny!
    )
) else (
    echo ✅ Port 3000 jest już wolny
)

echo.
echo 📋 Status procesów Node.js:
tasklist | findstr node.exe
if %ERRORLEVEL% == 0 (
    echo ⚠️  Wykryto procesy Node.js
) else (
    echo ✅ Brak procesów Node.js
)

echo.
echo 🚀 Teraz możesz uruchomić serwer: start-server.bat
echo.
pause
