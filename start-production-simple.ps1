# Simple Production Start (bez custom server.js)
# Używa wbudowanego next start zamiast server.js

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🚀 Next.js PRODUCTION (wbudowany serwer)   " -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Ustaw NODE_ENV
$env:NODE_ENV = "production"
Write-Host "✅ NODE_ENV = $env:NODE_ENV" -ForegroundColor Green
Write-Host "✅ PWA włączone" -ForegroundColor Green
Write-Host "✅ Service Worker aktywny" -ForegroundColor Green
Write-Host "`nSerwer uruchomi się na:" -ForegroundColor White
Write-Host "  • http://localhost:3000`n" -ForegroundColor White

# Użyj wbudowanego next start
npx next start
