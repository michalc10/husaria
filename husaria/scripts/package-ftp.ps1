param(
  [string]$ApiBaseUrl = "http://localhost:3000",
  [string]$OutputZip = "dist/husaria-ftp.zip"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$distRoot = Join-Path $projectRoot "dist\husaria"
$configPath = Join-Path $distRoot "assets\config\app-config.js"
$zipPath = Join-Path $projectRoot $OutputZip

Push-Location $projectRoot
try {
  npm.cmd run build

  if (!(Test-Path $configPath)) {
    throw "Nie znaleziono pliku runtime config: $configPath"
  }

  $escapedApiBaseUrl = $ApiBaseUrl.Replace("\", "\\").Replace('"', '\"')
  $runtimeConfig = @"
window.__HUSARIA_CONFIG__ = {
  apiBaseUrl: "$escapedApiBaseUrl"
};
"@

  Set-Content -Path $configPath -Value $runtimeConfig -Encoding UTF8

  if (Test-Path $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }

  Compress-Archive -Path (Join-Path $distRoot "*") -DestinationPath $zipPath -Force

  Write-Host "Gotowa paczka FTP: $zipPath"
  Write-Host "Na FTP wrzuc zawartosc katalogu: $distRoot"
}
finally {
  Pop-Location
}
