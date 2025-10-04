@echo off
REM ========================================
REM  KONFIGURACJA FIREWALL DLA NODE.JS
REM ========================================

echo.
echo ========================================
echo   KONFIGURACJA FIREWALL DLA NODE.JS
echo ========================================
echo.

REM Sprawdz czy uruchomiono jako admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [BLAD] Musisz uruchomić ten plik jako ADMINISTRATOR!
    echo.
    echo Kliknij prawym przyciskiem myszy na ten plik i wybierz:
    echo "Uruchom jako administrator"
    echo.
    pause
    exit /b 1
)

echo [OK] Uruchomiono jako administrator
echo.

REM Znajdz node.exe
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [BLAD] Nie znaleziono node.exe!
    echo Instalacja Node.js nie zostala wykryta.
    echo.
    pause
    exit /b 1
)

for /f "delims=" %%i in ('where node') do set NODE_PATH=%%i
echo [INFO] Znaleziono Node.js: %NODE_PATH%
echo.

REM Usun stare reguly
echo [INFO] Usuwam stare reguly (jesli istnieja)...
netsh advfirewall firewall delete rule name="Node.js Server" >nul 2>&1
netsh advfirewall firewall delete rule name="Node.js Development Server" >nul 2>&1
netsh advfirewall firewall delete rule name="Next.js Dev Server (Port 3000)" >nul 2>&1
echo.

REM Dodaj regule dla Node.js (incoming)
echo [INFO] Dodaje regule firewall dla Node.js (INCOMING)...
netsh advfirewall firewall add rule name="Node.js Development Server" dir=in action=allow program="%NODE_PATH%" enable=yes profile=private,public description="Zezwala na polaczenia przychodzace do serwera Node.js (port 3000)"

if %errorLevel% equ 0 (
    echo [OK] Regula INCOMING dodana pomyslnie!
) else (
    echo [BLAD] Blad dodawania reguly INCOMING
)
echo.

REM Dodaj regule dla portu 3000
echo [INFO] Dodaje regule dla portu 3000...
netsh advfirewall firewall add rule name="Next.js Dev Server (Port 3000)" dir=in action=allow protocol=TCP localport=3000 enable=yes profile=private,public description="Zezwala na polaczenia TCP na port 3000 (Next.js)"

if %errorLevel% equ 0 (
    echo [OK] Regula dla portu 3000 dodana pomyslnie!
) else (
    echo [BLAD] Blad dodawania reguly dla portu 3000
)
echo.

REM Pokaz dodane reguly
echo ========================================
echo   DODANE REGULY FIREWALL
echo ========================================
echo.
netsh advfirewall firewall show rule name="Node.js Development Server" | findstr /C:"Rule Name" /C:"Enabled" /C:"Direction" /C:"Program"
echo.
netsh advfirewall firewall show rule name="Next.js Dev Server (Port 3000)" | findstr /C:"Rule Name" /C:"Enabled" /C:"Direction" /C:"LocalPort"
echo.

REM Pokaz adres IP
echo ========================================
echo   INFORMACJE SIECIOWE
echo ========================================
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /V "127.0.0.1"') do (
    set IP=%%a
    goto :found_ip
)
:found_ip
echo [INFO] Twoj adres IP:%IP%
echo.
echo Na telefonie otworz:
echo    http://%IP::=%:3000
echo.

echo ========================================
echo   KONFIGURACJA ZAKONCZONA!
echo ========================================
echo.
echo Teraz uruchom serwer: npm run dev
echo.
pause
