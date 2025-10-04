# INSTRUKCJA: Uruchom ten skrypt jako ADMINISTRATOR
# Kliknij prawym przyciskiem -> "Uruchom jako administrator"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KONFIGURACJA FIREWALL DLA NODE.JS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Sprawdź czy uruchomiono jako admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ BŁĄD: Musisz uruchomić ten skrypt jako ADMINISTRATOR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Kliknij prawym przyciskiem na ten plik i wybierz:" -ForegroundColor Yellow
    Write-Host "'Uruchom jako administrator'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ Uruchomiono jako administrator" -ForegroundColor Green
Write-Host ""

# Znajdź ścieżkę do node.exe
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source

if (-not $nodePath) {
    Write-Host "❌ Nie znaleziono node.exe!" -ForegroundColor Red
    Write-Host "Instalacja Node.js nie została wykryta." -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "📦 Znaleziono Node.js: $nodePath" -ForegroundColor Cyan
Write-Host ""

# Usuń starą regułę jeśli istnieje
Write-Host "🗑️  Usuwam starą regułę (jeśli istnieje)..." -ForegroundColor Yellow
netsh advfirewall firewall delete rule name="Node.js Server" | Out-Null
netsh advfirewall firewall delete rule name="Node.js Development Server" | Out-Null
Write-Host ""

# Dodaj nową regułę (incoming)
Write-Host "➕ Dodaję regułę firewall (INCOMING)..." -ForegroundColor Yellow
$result1 = netsh advfirewall firewall add rule `
    name="Node.js Development Server" `
    dir=in `
    action=allow `
    program="$nodePath" `
    enable=yes `
    profile=private,public `
    description="Zezwala na połączenia przychodzące do serwera Node.js (port 3000)"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Reguła INCOMING dodana pomyślnie!" -ForegroundColor Green
} else {
    Write-Host "❌ Błąd dodawania reguły INCOMING" -ForegroundColor Red
}
Write-Host ""

# Dodaj regułę dla portu 3000 (dodatkowa)
Write-Host "➕ Dodaję regułę dla portu 3000..." -ForegroundColor Yellow
$result2 = netsh advfirewall firewall add rule `
    name="Next.js Dev Server (Port 3000)" `
    dir=in `
    action=allow `
    protocol=TCP `
    localport=3000 `
    enable=yes `
    profile=private,public `
    description="Zezwala na połączenia TCP na port 3000 (Next.js)"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Reguła dla portu 3000 dodana pomyślnie!" -ForegroundColor Green
} else {
    Write-Host "❌ Błąd dodawania reguły dla portu 3000" -ForegroundColor Red
}
Write-Host ""

# Pokaż dodane reguły
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DODANE REGUŁY FIREWALL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Node.js Development Server:" -ForegroundColor Yellow
netsh advfirewall firewall show rule name="Node.js Development Server" | Select-String -Pattern "Rule Name|Enabled|Direction|Program"
Write-Host ""

Write-Host "📋 Next.js Dev Server (Port 3000):" -ForegroundColor Yellow
netsh advfirewall firewall show rule name="Next.js Dev Server (Port 3000)" | Select-String -Pattern "Rule Name|Enabled|Direction|LocalPort"
Write-Host ""

# Pokaż adres IP
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INFORMACJE SIECIOWE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*"} | Select-Object -First 1).IPAddress

Write-Host "🌐 Twój adres IP: $ipAddress" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Na telefonie otwórz:" -ForegroundColor Cyan
Write-Host "   http://$ipAddress:3000" -ForegroundColor Yellow
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  KONFIGURACJA ZAKOŃCZONA!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Teraz uruchom serwer: npm run dev" -ForegroundColor Yellow
Write-Host ""

pause
