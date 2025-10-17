# Vercel Environment Variables Auto-Setup
# Quick script to add all required env vars

Write-Host "`n=== VERCEL ENV SETUP ===" -ForegroundColor Cyan

# Check Vercel CLI
try {
    vercel --version | Out-Null
    Write-Host "OK: Vercel CLI installed" -ForegroundColor Green
} catch {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host "`nVariables to add:" -ForegroundColor Yellow
Write-Host "  1. JWT_SECRET"
Write-Host "  2. NEXT_PUBLIC_SUPABASE_URL"
Write-Host "  3. NEXT_PUBLIC_SUPABASE_ANON_KEY"
Write-Host "  4. SUPABASE_SERVICE_ROLE_KEY"

Write-Host "`nOPENING Supabase Dashboard..." -ForegroundColor Cyan
Start-Process "https://supabase.com/dashboard/project/ibwllqynynxcflpqlaeh/settings/api"

Write-Host "`nCopy 'service_role' key from Supabase (Settings -> API)" -ForegroundColor Yellow
$serviceRoleKey = Read-Host "Paste SUPABASE_SERVICE_ROLE_KEY here"

if ([string]::IsNullOrWhiteSpace($serviceRoleKey)) {
    Write-Host "`nERROR: No key provided!" -ForegroundColor Red
    exit 1
}

Write-Host "`nKey received (length: $($serviceRoleKey.Length) chars)" -ForegroundColor Green

# Variables
$jwtSecret = "super-secret-jwt-key-change-in-production-2024-technik-app"
$supabaseUrl = "https://ibwllqynynxcflpqlaeh.supabase.co"
$supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2xscXlueW54Y2ZscHFsYWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjY4OTIsImV4cCI6MjA2MjkwMjg5Mn0.wPbvRr7rWMJM7p8n7sRUqk7k0o6qMUVNNm2Zg6z5k1I"

Write-Host "`nLinking to Vercel project..." -ForegroundColor Cyan
vercel link --yes

Write-Host "`nAdding variables...`n" -ForegroundColor Cyan

# Add JWT_SECRET
Write-Host "Adding JWT_SECRET..." -ForegroundColor Yellow
$jwtSecret | vercel env add JWT_SECRET production

# Add NEXT_PUBLIC_SUPABASE_URL  
Write-Host "Adding NEXT_PUBLIC_SUPABASE_URL..." -ForegroundColor Yellow
$supabaseUrl | vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Add NEXT_PUBLIC_SUPABASE_ANON_KEY
Write-Host "Adding NEXT_PUBLIC_SUPABASE_ANON_KEY..." -ForegroundColor Yellow
$supabaseAnonKey | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Add SUPABASE_SERVICE_ROLE_KEY
Write-Host "Adding SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Yellow
$serviceRoleKey | vercel env add SUPABASE_SERVICE_ROLE_KEY production

Write-Host "`nALL VARIABLES ADDED!" -ForegroundColor Green

Write-Host "`nNow REDEPLOY:" -ForegroundColor Cyan
Write-Host "  vercel --prod" -ForegroundColor White

$redeploy = Read-Host "`nRedeploy now? (y/n)"

if ($redeploy -eq "y") {
    Write-Host "`nDeploying to production...`n" -ForegroundColor Cyan
    vercel --prod
    Write-Host "`nDEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "`nCheck: https://n-8zvy6pwvo-mariuszs-projects-34d64520.vercel.app/api/test-env" -ForegroundColor Cyan
    Write-Host "Login: https://n-8zvy6pwvo-mariuszs-projects-34d64520.vercel.app/admin/login" -ForegroundColor Cyan
}
