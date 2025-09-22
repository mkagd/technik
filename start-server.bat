@echo off
echo 🚀 Uruchamianie serwera deweloperskiego Next.js...
echo ================================================

cd /d "c:\Users\Admin\Technik"

echo 📂 Sprawdzanie katalogu roboczego...
echo Aktualny katalog: %CD%

echo 📦 Sprawdzanie package.json...
if exist package.json (
    echo ✅ Znaleziono package.json
) else (
    echo ❌ Nie znaleziono package.json
    pause
    exit /b 1
)

echo 📋 Sprawdzanie skryptów npm...
type package.json | findstr "dev"

echo.
echo 🔧 Uruchamianie serwera...
echo Serwer będzie dostępny pod adresem: http://localhost:3000
echo.
echo 📝 Dostępne strony:
echo   - Strona główna: http://localhost:3000
echo   - Formularz zgłoszeń: http://localhost:3000/rezerwacja  
echo   - Mapa klientów: http://localhost:3000/mapa
echo.
echo ⏹️ Aby zatrzymać serwer, naciśnij Ctrl+C
echo.

npm run dev

echo.
echo 🛑 Serwer został zatrzymany
pause
