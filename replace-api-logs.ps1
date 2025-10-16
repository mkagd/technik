# 🧹 Masowa zamiana console.log na logger w API

Write-Host "`n🚀 Rozpoczynam masową zamianę console.log → logger w API..." -ForegroundColor Cyan

# Funkcja do zamiany logów w pliku
function Replace-Logs {
    param($FilePath)
    
    if (!(Test-Path $FilePath)) {
        Write-Host "⚠️  Pominięto (nie istnieje): $FilePath" -ForegroundColor Yellow
        return $false
    }
    
    try {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        $originalLength = $content.Length
        
        # Dodaj import na początku (jeśli jeszcze nie ma)
        if ($content -notmatch "import.*logger") {
            $content = $content -replace "^(import.*?;)", "`$1`nimport { apiLogger, logger } from '../../utils/logger';"
        }
        
        # Zamiana różnych typów console.log
        $content = $content `
            -replace "console\.log\('📞", "apiLogger.request(req.method, req.url); logger.debug('📞" `
            -replace "console\.log\('✅", "logger.success('✅" `
            -replace "console\.log\('❌", "logger.error('❌" `
            -replace "console\.log\('⚠️", "logger.warn('⚠️" `
            -replace "console\.log\('🔍", "logger.debug('🔍" `
            -replace "console\.log\('🔄", "logger.debug('🔄" `
            -replace "console\.log\('📍", "logger.debug('📍" `
            -replace "console\.log\('🚀", "logger.debug('🚀" `
            -replace "console\.log\('💾", "logger.debug('💾" `
            -replace "console\.log\('📱", "logger.debug('📱" `
            -replace "console\.log\('🌐", "logger.debug('🌐" `
            -replace "console\.log\('🗑️", "logger.debug('🗑️" `
            -replace "console\.log\('📋", "logger.debug('📋" `
            -replace "console\.log\('📅", "logger.debug('📅" `
            -replace "console\.log\('🔧", "logger.debug('🔧" `
            -replace "console\.log\('📊", "logger.debug('📊" `
            -replace 'console\.log\("✅', 'logger.success("✅' `
            -replace 'console\.log\("❌', 'logger.error("❌' `
            -replace 'console\.log\("🔍', 'logger.debug("🔍' `
            -replace 'console\.log\(`✅', 'logger.success(`✅' `
            -replace 'console\.log\(`❌', 'logger.error(`❌' `
            -replace 'console\.log\(`🔍', 'logger.debug(`🔍' `
            -replace 'console\.log\(`📞', 'apiLogger.request(req.method, req.url); logger.debug(`📞' `
            -replace 'console\.warn\(', 'logger.warn(' `
            -replace 'console\.error\(', 'logger.error('
        
        if ($content.Length -ne $originalLength) {
            Set-Content $FilePath -Value $content -Encoding UTF8
            Write-Host "✅ $FilePath" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⏭️  Bez zmian: $FilePath" -ForegroundColor Gray
            return $false
        }
    }
    catch {
        Write-Host "❌ Błąd w: $FilePath - $_" -ForegroundColor Red
        return $false
    }
}

# Lista plików API do przetworzenia
$apiFiles = @(
    "pages\api\orders.js",
    "pages\api\part-requests\index.js",
    "pages\api\intelligent-planner\get-data.js",
    "pages\api\technician\visits.js",
    "pages\api\technician\visit-details.js",
    "pages\api\technician\complete-visit.js",
    "pages\api\technician\add-visit-to-order.js",
    "pages\api\orders\[id].js",
    "pages\api\visits\index.js"
)

$count = 0
$basePath = "D:\Projekty\Technik\Technik\"

Write-Host "`n📁 Przetwarzanie plików API..." -ForegroundColor Yellow

foreach ($file in $apiFiles) {
    $fullPath = Join-Path $basePath $file
    if (Replace-Logs $fullPath) {
        $count++
    }
}

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                        ║" -ForegroundColor Cyan
Write-Host "║  ✅  MASOWA ZAMIANA ZAKOŃCZONA!       ║" -ForegroundColor Green
Write-Host "║                                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n📊 Zmodyfikowano plików: $count" -ForegroundColor Green
Write-Host ""
