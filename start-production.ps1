# Start Production Server
# Uruchamia serwer w trybie production

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🚀 Uruchamianie serwera PRODUCTION   " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Ustaw zmienną środowiskową
$env:NODE_ENV = "production"

Write-Host "✅ NODE_ENV = production" -ForegroundColor Green
Write-Host "✅ PWA włączone" -ForegroundColor Green
Write-Host "✅ Service Worker aktywny`n" -ForegroundColor Green

Write-Host "Serwer uruchomi się na:" -ForegroundColor Yellow
Write-Host "  • http://localhost:3000" -ForegroundColor White
Write-Host "  • http://192.168.0.2:3000`n" -ForegroundColor White

Write-Host "Aby zatrzymać serwer, naciśnij Ctrl+C`n" -ForegroundColor Gray

# Uruchom serwer
node server.js
