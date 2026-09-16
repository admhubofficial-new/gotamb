$ErrorActionPreference = 'Stop'

Write-Host '== goTamb local sync ==' -ForegroundColor Cyan

git checkout main
git pull --ff-only origin main

if (-not (Test-Path '.env') -and (Test-Path '.env.example')) {
  Copy-Item '.env.example' '.env'
  Write-Host 'Created .env from .env.example'
}

npm ci
npx tsc --noEmit
npx expo export --platform android --clear

Write-Host ''
Write-Host 'Local goTamb is synchronized with GitHub main and validated against the current app code.' -ForegroundColor Green
Write-Host ('Commit: ' + (git rev-parse HEAD))
Write-Host 'Supabase project: zgxhgjtzzqzpycrrdptm'
