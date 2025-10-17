# 🚀 Szybkie dodanie zmiennych do Vercel - WERSJA UPROSZCZONA
# Użycie: .\add-env-quick.ps1

Write-Host "`n=== 🔐 DODAWANIE ENV VARS DO VERCEL ===" -ForegroundColor Cyan

# Sprawdź czy Vercel CLI jest zainstalowane
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI zainstalowane" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI nie znalezione. Instaluję..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host "`n📋 Będę dodawać następujące zmienne:" -ForegroundColor Yellow
Write-Host "   1. JWT_SECRET" -ForegroundColor White
Write-Host "   2. NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor White
Write-Host "   3. NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor White
Write-Host "   4. SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White

Write-Host "`n⚠️  WAŻNE: Zaraz otworzę Supabase Dashboard" -ForegroundColor Red
Write-Host "   Skopiuj 'service_role' key (Settings → API)`n" -ForegroundColor Red

Read-Host "Naciśnij Enter aby otworzyć Supabase Dashboard"

# Otwórz Supabase Dashboard
Start-Process "https://supabase.com/dashboard/project/ibwllqynynxcflpqlaeh/settings/api"

Write-Host "`n📋 Skopiuj 'service_role' key z Supabase" -ForegroundColor Cyan
$serviceRoleKey = Read-Host "Wklej SUPABASE_SERVICE_ROLE_KEY tutaj"

if ([string]::IsNullOrWhiteSpace($serviceRoleKey)) {
    Write-Host "`n❌ Nie podałeś klucza! Skrypt przerwany." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Klucz otrzymany (długość: $($serviceRoleKey.Length) znaków)" -ForegroundColor Green

# Definicje zmiennych
$jwtSecret = "super-secret-jwt-key-change-in-production-2024-technik-app"
$supabaseUrl = "https://ibwllqynynxcflpqlaeh.supabase.co"
$supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2xscXlueW54Y2ZscHFsYWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjY4OTIsImV4cCI6MjA2MjkwMjg5Mn0.wPbvRr7rWMJM7p8n7sRUqk7k0o6qMUVNNm2Zg6z5k1I"

Write-Host "`n🔐 Loguję do Vercel..." -ForegroundColor Cyan
vercel link --yes

Write-Host "`n📤 Dodawanie zmiennych...`n" -ForegroundColor Cyan

# Funkcja do dodania zmiennej
function Add-VercelEnv {
    param($name, $value)
    Write-Host "  → $name" -ForegroundColor Yellow
    Write-Output $value | vercel env add $name production --force
}

# Dodaj zmienne
Add-VercelEnv "JWT_SECRET" $jwtSecret
Add-VercelEnv "NEXT_PUBLIC_SUPABASE_URL" $supabaseUrl
Add-VercelEnv "NEXT_PUBLIC_SUPABASE_ANON_KEY" $supabaseAnonKey
Add-VercelEnv "SUPABASE_SERVICE_ROLE_KEY" $serviceRoleKey

Write-Host "`n✅ WSZYSTKIE ZMIENNE DODANE!" -ForegroundColor Green

Write-Host "`n📋 Teraz zrób REDEPLOY:" -ForegroundColor Cyan
Write-Host "   Option 1: vercel --prod" -ForegroundColor White
Write-Host "   Option 2: https://vercel.com/dashboard → Deployments → Redeploy`n" -ForegroundColor White

$redeploy = Read-Host "Czy chcesz zrobić redeploy teraz? (t/n)"

if ($redeploy -eq "t") {
    Write-Host "`n🚀 Deploying do production...`n" -ForegroundColor Cyan
    vercel --prod
    Write-Host "`n✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "`n🔗 Sprawdź: https://n-8zvy6pwvo-mariuszs-projects-34d64520.vercel.app/api/test-env" -ForegroundColor Cyan
    Write-Host "🔗 Login: https://n-8zvy6pwvo-mariuszs-projects-34d64520.vercel.app/admin/login`n" -ForegroundColor Cyan
}
