Param()

$pattern = "\*ngIf|\*ngFor"
$files = Get-ChildItem -Path "src/app" -Recurse -Include *.html
$matches = @()

foreach ($f in $files) {
  $content = Get-Content $f.FullName
  for ($i = 0; $i -lt $content.Length; $i++) {
    if ($content[$i] -match $pattern) {
      $matches += [PSCustomObject]@{ File = $f.FullName; Line = ($i + 1); Text = $content[$i].Trim() }
    }
  }
}

if ($matches.Count -gt 0) {
  Write-Host "Legacy structural directives found:" -ForegroundColor Red
  $matches | ForEach-Object { Write-Host "$($_.File):$($_.Line): $($_.Text)" }
  exit 1
}

Write-Host "Template syntax OK"
