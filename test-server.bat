@echo off
echo 🧪 Test czy serwer jest uruchomiony
echo =================================

echo 📡 Sprawdzanie czy serwer odpowiada na http://localhost:3000...

curl -s -o nul -w "%%{http_code}" http://localhost:3000 > temp_status.txt
set /p status=<temp_status.txt
del temp_status.txt

if "%status%"=="200" (
    echo ✅ Serwer działa poprawnie! (Status: %status%)
    echo.
    echo 🌐 Dostępne adresy:
    echo   - Strona główna: http://localhost:3000
    echo   - Formularz: http://localhost:3000/rezerwacja
    echo   - Mapa: http://localhost:3000/mapa
    echo   - API: http://localhost:3000/api/rezerwacje
    echo.
    echo 🧪 Testowanie API...
    curl -s http://localhost:3000/api/rezerwacje
    echo.
    echo.
    echo ✅ Test zakończony pomyślnie!
) else (
    echo ❌ Serwer nie odpowiada (Status: %status%)
    echo.
    echo 💡 Możliwe przyczyny:
    echo   - Serwer nie jest uruchomiony
    echo   - Serwer startuje na innym porcie
    echo   - Problem z konfiguracją
    echo.
    echo 🔧 Aby uruchomić serwer, użyj: start-server.bat
)

echo.
pause
