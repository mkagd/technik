# Script to add environment variables to Vercel without newlines
# Uses direct string input to avoid PowerShell pipe issues

Write-Host "Adding ADMIN_EMAIL..." -ForegroundColor Cyan
$process = Start-Process -FilePath "npx" -ArgumentList "vercel", "env", "add", "ADMIN_EMAIL", "production" -NoNewWindow -PassThru -RedirectStandardInput "temp_stdin.txt" -Wait
"admin@technik.pl" | Out-File -FilePath "temp_stdin.txt" -Encoding ASCII -NoNewline
Start-Sleep -Seconds 1

Write-Host "Adding ADMIN_PASSWORD..." -ForegroundColor Cyan
$process2 = Start-Process -FilePath "npx" -ArgumentList "vercel", "env", "add", "ADMIN_PASSWORD", "production" -NoNewWindow -PassThru -RedirectStandardInput "temp_stdin2.txt" -Wait
"admin123" | Out-File -FilePath "temp_stdin2.txt" -Encoding ASCII -NoNewline
Start-Sleep -Seconds 1

# Cleanup
Remove-Item "temp_stdin.txt" -ErrorAction SilentlyContinue
Remove-Item "temp_stdin2.txt" -ErrorAction SilentlyContinue

Write-Host "`nDone!" -ForegroundColor Green
