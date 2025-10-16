# Vercel Environment Variables Setup Script
# Run this in PowerShell to add all env vars to Vercel

Write-Host "`n🔧 Dodaję Environment Variables do Vercel...`n" -ForegroundColor Cyan

# Production environment
$env:VERCEL_ENV = "production"

# Add all environment variables
npx vercel env add SUPABASE_URL production
npx vercel env add SUPABASE_ANON_KEY production
npx vercel env add RESEND_API_KEY production
npx vercel env add RESEND_EMAIL_FROM production
npx vercel env add RESEND_EMAIL_FROM_NAME production
npx vercel env add NEXT_PUBLIC_BASE_URL production
npx vercel env add NEXT_PUBLIC_ADMIN_PASS production
npx vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production
npx vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production
npx vercel env add OPENAI_API_KEY production
npx vercel env add GOOGLE_MAPS_API_KEY production
npx vercel env add COST_ALERT_EMAIL production

Write-Host "`n✅ Zmienne dodane! Teraz trzeba zrobić redeploy:`n" -ForegroundColor Green
Write-Host "npx vercel --prod" -ForegroundColor Cyan
