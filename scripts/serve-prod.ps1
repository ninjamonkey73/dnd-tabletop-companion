Param(
  [int]$Port = 8080
)

# Fail on errors
$ErrorActionPreference = "Stop"

# Paths
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $projectRoot
$distBrowser = Join-Path $repoRoot "dist\dnd-tabletop-companion\browser"
$wwwRoot = Join-Path $repoRoot "local-www"
$targetSubdir = Join-Path $wwwRoot "dnd-tabletop-companion"

Write-Host "Building production bundle..." -ForegroundColor Cyan
pushd $repoRoot
npm run build:prod | Out-Host
popd

Write-Host "Preparing local server root at '$wwwRoot'..." -ForegroundColor Cyan
if (Test-Path $wwwRoot) {
  Remove-Item -Recurse -Force $wwwRoot
}
New-Item -ItemType Directory -Force -Path $targetSubdir | Out-Null

Write-Host "Copying built files into '$targetSubdir'..." -ForegroundColor Cyan
Copy-Item -Recurse -Force "$distBrowser\*" $targetSubdir

Write-Host "Starting static server on port $Port..." -ForegroundColor Cyan
npx http-server $wwwRoot -p $Port -c-1 | Out-Host

Write-Host "Open http://127.0.0.1:$Port/dnd-tabletop-companion/" -ForegroundColor Green
