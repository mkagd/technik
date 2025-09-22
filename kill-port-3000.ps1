# PowerShell Script - Zarządzanie portem 3000

Write-Host "🔍 Zarządzanie portem 3000" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Sprawdź procesy na porcie 3000
Write-Host "📡 Sprawdzanie procesów na porcie 3000..." -ForegroundColor Yellow
$port3000 = netstat -ano | Select-String ":3000"

if ($port3000) {
    Write-Host "⚠️  Port 3000 jest używany przez:" -ForegroundColor Red
    $port3000 | ForEach-Object {
        $line = $_.Line
        if ($line -match '\s+(\d+)\s*$') {
            $processId = $matches[1]
            try {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "   PID: $processId - $($process.ProcessName)" -ForegroundColor Red
                }
            }
            catch {
                Write-Host "   PID: $processId - (nieznany proces)" -ForegroundColor Red
            }
        }
    }
    
    Write-Host ""
    Write-Host "🔪 Zabijanie wszystkich procesów Node.js..." -ForegroundColor Yellow
    
    # Zabij wszystkie procesy Node.js
    Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "   Zabijanie: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Red
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    
    # Sprawdź ponownie
    Start-Sleep 2
    $port3000After = netstat -ano | Select-String ":3000"
    
    if ($port3000After) {
        Write-Host "❌ Port 3000 nadal jest używany" -ForegroundColor Red
        Write-Host "💡 Spróbuj zrestartować komputer lub użyj:" -ForegroundColor Yellow
        Write-Host "   taskkill /F /IM node.exe" -ForegroundColor Gray
    }
    else {
        Write-Host "✅ Port 3000 jest teraz wolny!" -ForegroundColor Green
    }
}
else {
    Write-Host "✅ Port 3000 jest już wolny" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Status procesów Node.js:" -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "⚠️  Wykryto procesy Node.js:" -ForegroundColor Yellow
    $nodeProcesses | Format-Table Id, ProcessName, CPU, WorkingSet -AutoSize
}
else {
    Write-Host "✅ Brak procesów Node.js" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Teraz możesz uruchomić serwer używając:" -ForegroundColor Cyan
Write-Host "   ./start-server.bat" -ForegroundColor Green
Write-Host "   lub: npm run dev" -ForegroundColor Green

Write-Host ""
Write-Host "Naciśnij Enter aby zakończyć..." -ForegroundColor Gray
Read-Host
