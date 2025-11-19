$bad = Select-String -Path "src/app/**/*.html" -Pattern "\*ngIf|\*ngFor"
if ($bad) {
  Write-Host "Legacy structural directives found:" -ForegroundColor Red
  $bad | ForEach-Object { Write-Host $_.Path ":" $_.LineNumber ":" $_.Line }
  exit 1
}
Write-Host "Template syntax OK"
