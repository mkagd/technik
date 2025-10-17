# Add environment variables to Vercel using API
# You need VERCEL_TOKEN from https://vercel.com/account/tokens

Write-Host "`n=== VERCEL API ENV SETUP ===" -ForegroundColor Cyan

# Check if VERCEL_TOKEN exists
if (-not $env:VERCEL_TOKEN) {
    Write-Host "`nERROR: VERCEL_TOKEN not found!" -ForegroundColor Red
    Write-Host "`nGet your token from: https://vercel.com/account/tokens" -ForegroundColor Yellow
    Write-Host "Then run: `$env:VERCEL_TOKEN = 'your-token-here'`n" -ForegroundColor Yellow
    
    $token = Read-Host "Or paste your Vercel token here"
    $env:VERCEL_TOKEN = $token
}

# Project ID (from your Vercel project)
$projectId = "prj_S7gXstRTJQloOFHiWDmcE7g8RHpd"

# Variables to add
$vars = @(
    @{
        key = "JWT_SECRET"
        value = "super-secret-jwt-key-change-in-production-2024-technik-app"
        type = "encrypted"
        target = @("production", "preview", "development")
    },
    @{
        key = "NEXT_PUBLIC_SUPABASE_URL"
        value = "https://ibwllqynynxcflpqlaeh.supabase.co"
        type = "plain"
        target = @("production", "preview", "development")
    },
    @{
        key = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2xscXlueW54Y2ZscHFsYWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjY4OTIsImV4cCI6MjA2MjkwMjg5Mn0.wPbvRr7rWMJM7p8n7sRUqk7k0o6qMUVNNm2Zg6z5k1I"
        type = "plain"
        target = @("production", "preview", "development")
    },
    @{
        key = "SUPABASE_SERVICE_ROLE_KEY"
        value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2xscXlueW54Y2ZscHFsYWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTgzMjUsImV4cCI6MjA3NjEzNDMyNX0.jqcXHXry0ifO2wnE8EBSa1nzWX8F0XdK05e8XjnGqSs"
        type = "encrypted"
        target = @("production", "preview", "development")
    }
)

Write-Host "`nAdding environment variables via API...`n" -ForegroundColor Yellow

foreach ($var in $vars) {
    Write-Host "Adding $($var.key)..." -ForegroundColor Cyan
    
    $body = @{
        key = $var.key
        value = $var.value
        type = $var.type
        target = $var.target
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.vercel.com/v10/projects/$projectId/env" `
            -Method Post `
            -Headers @{
                "Authorization" = "Bearer $env:VERCEL_TOKEN"
                "Content-Type" = "application/json"
            } `
            -Body $body
        
        Write-Host "  OK: $($var.key) added!" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nALL DONE!" -ForegroundColor Green
Write-Host "`nNow redeploy: https://vercel.com/dashboard`n" -ForegroundColor Cyan
