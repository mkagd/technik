# Skrypt do otwarcia portu 3000 w firewall Windows
# Uruchom jako Administrator: kliknij prawym przyciskiem > Uruchom jako administrator

Write-Host "🔥 Otwieranie portu 3000 w Windows Firewall..." -ForegroundColor Cyan
Write-Host ""

try {
    # Sprawdź czy reguła już istnieje
    $existingRule = Get-NetFirewallRule -DisplayName "Next.js Dev Server Port 3000" -ErrorAction SilentlyContinue
    
    if ($existingRule) {
        Write-Host "✓ Reguła już istnieje, aktualizuję..." -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName "Next.js Dev Server Port 3000"
    }
    
    # Dodaj regułę dla przychodzących połączeń (Inbound)
    New-NetFirewallRule -DisplayName "Next.js Dev Server Port 3000" `
                        -Direction Inbound `
                        -Protocol TCP `
                        -LocalPort 3000 `
                        -Action Allow `
                        -Profile Any `
                        -Description "Zezwala na dostęp do Next.js dev server przez sieć lokalną"
    
    Write-Host ""
    Write-Host "✅ Port 3000 został otwarty w firewall!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 Możesz teraz połączyć się z telefonu:" -ForegroundColor Cyan
    Write-Host "   http://192.168.0.2:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Sprawdź, czy serwer działa:" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "❌ Błąd: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Upewnij się, że uruchomiłeś skrypt jako Administrator!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Naciśnij dowolny klawisz aby zamknąć..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
