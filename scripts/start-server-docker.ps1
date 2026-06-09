param(
  [string]$EnvFile = ".env.server",
  [switch]$Build
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot $EnvFile

if (!(Test-Path -LiteralPath $envPath)) {
  $examplePath = Join-Path $repoRoot ".env.server.example"

  if (Test-Path -LiteralPath $examplePath) {
    Copy-Item -LiteralPath $examplePath -Destination $envPath
  }

  throw "Uzupełnij sekrety w $envPath i uruchom skrypt ponownie."
}

$dockerVersion = docker version --format "{{.Server.Version}}" 2>$null
if (!$dockerVersion) {
  throw "Docker nie działa albo nie jest zainstalowany."
}

$composeArgs = @("compose", "--env-file", $envPath, "up", "-d")

if ($Build) {
  $composeArgs += "--build"
}

Push-Location $repoRoot
try {
  docker @composeArgs
  docker compose --env-file $envPath ps
}
finally {
  Pop-Location
}
