@echo off
echo 🚀 Starting Technik Service Management System...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo ✅ Node.js is installed
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed
echo.
echo 🔧 Starting development server on http://localhost:3000
echo.
echo Available pages:
echo   🏠 Main page: http://localhost:3000
echo   📝 Order form: http://localhost:3000/rezerwacja
echo   🗺️ Map: http://localhost:3000/mapa
echo   ⚙️ Admin: http://localhost:3000/admin
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
