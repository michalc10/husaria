$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $repoRoot "back-end"
$packageRoot = Join-Path $repoRoot "dist\backend-node-package"
$zipPath = Join-Path $repoRoot "dist\backend-node-package.zip"

Push-Location $backendRoot
try {
  npm.cmd run build
} finally {
  Pop-Location
}

if (Test-Path $packageRoot) {
  Remove-Item -LiteralPath $packageRoot -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $packageRoot | Out-Null
Copy-Item -Path (Join-Path $backendRoot "dist") -Destination (Join-Path $packageRoot "dist") -Recurse
Copy-Item -Path (Join-Path $backendRoot "prisma") -Destination (Join-Path $packageRoot "prisma") -Recurse
Copy-Item -Path (Join-Path $backendRoot "package.json") -Destination $packageRoot
Copy-Item -Path (Join-Path $backendRoot "package-lock.json") -Destination $packageRoot
Copy-Item -Path (Join-Path $backendRoot ".env.example") -Destination $packageRoot

@"
Backend Node.js package.

This package does not contain secrets and will not run on plain FTP.
Required on the server:
- Node.js 24+
- npm ci --omit=dev
- environment variables: POSTGRES_URL, AUTH_SESSION_SECRET, JUDGE_TOKEN_SECRET,
  PUBLIC_FRONTEND_URL, SERVER_CORS_ORIGIN, SOCKET_CORS_ORIGIN, AUTH_COOKIE_SECURE=true
- npx prisma migrate deploy
- npm run start
"@ | Set-Content -Path (Join-Path $packageRoot "README-BACKEND.txt") -Encoding UTF8

if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -Path (Join-Path $packageRoot "*") -DestinationPath $zipPath -Force

Write-Host "Backend package ready: $zipPath"
