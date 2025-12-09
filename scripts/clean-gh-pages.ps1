Param(
  [string]$BranchRoot = "."
)

$ErrorActionPreference = "Stop"

Write-Host "Cleaning gh-pages branch root: $BranchRoot" -ForegroundColor Cyan

# Remove common build artifacts from previous deploys (keep .git)
$pathsToRemove = @(
  "browser",
  "assets",
  "favicon.ico",
  "index.html",
  "404.html",
  "main-*.js",
  "polyfills-*.js",
  "chunk-*.js",
  "styles-*.css",
  "manifest.webmanifest"
)

foreach ($p in $pathsToRemove) {
  $full = Join-Path $BranchRoot $p
  Write-Host ("- Removing {0}" -f $p)
  try {
    # If exact path exists, remove it (file or directory)
    if (Test-Path $full) {
      Remove-Item -Recurse -Force $full
      continue
    }
    # Handle wildcard patterns (match files and directories)
    Get-ChildItem -Path $BranchRoot -Filter $p -Force -ErrorAction SilentlyContinue |
      ForEach-Object {
        Remove-Item -Recurse -Force $_.FullName
      }
  } catch {
    Write-Warning ("Failed to remove {0}: {1}" -f $p, $_.Exception.Message)
  }
}

Write-Host "gh-pages cleanup complete." -ForegroundColor Green
