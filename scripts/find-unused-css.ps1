Param(
  [string]$SrcPath = 'src',
  [string]$OutDir = 'scripts'
)

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$definedCss = @()
Get-ChildItem -Path $SrcPath -Filter *.css -Recurse |
  ForEach-Object {
    Select-String -Path $_.FullName -Pattern '^\s*\.[a-zA-Z0-9_-]+' -AllMatches
  } |
  ForEach-Object {
    foreach ($m in $_.Matches) {
      $name = ($m.Value.Trim() -replace '^\.', '')
      if (![string]::IsNullOrWhiteSpace($name)) { $definedCss += $name }
    }
  }
$definedCss = $definedCss | Sort-Object -Unique
$definedCss | Set-Content (Join-Path $OutDir 'defined-css.txt')

$usedCss = @()
Get-ChildItem -Path $SrcPath -Include *.html -Recurse |
  ForEach-Object {
    Select-String -Path $_.FullName -Pattern 'class="[^"]+"' -AllMatches
  } |
  ForEach-Object {
    foreach ($m in $_.Matches) {
      $classesString = ($m.Value -replace '^class="','' -replace '"$','')
      $classes = $classesString -split '[\s,]+' | Where-Object { $_ -ne '' }
      foreach ($c in $classes) {
        $clean = $c.Trim()
        if (![string]::IsNullOrWhiteSpace($clean)) { $usedCss += $clean }
      }
    }
  }
$usedCss = $usedCss | Sort-Object -Unique
$usedCss | Set-Content (Join-Path $OutDir 'used-css.txt')

$definedList = if (Test-Path (Join-Path $OutDir 'defined-css.txt')) { Get-Content (Join-Path $OutDir 'defined-css.txt') } else { @() }
$usedList    = if (Test-Path (Join-Path $OutDir 'used-css.txt'))    { Get-Content (Join-Path $OutDir 'used-css.txt') }    else { @() }

if ($definedList.Count -eq 0 -and $usedList.Count -eq 0) {
  Write-Host 'No CSS selectors or class usages found. Check paths/patterns.'
  exit 0
}

$unused = Compare-Object -ReferenceObject $definedList -DifferenceObject $usedList -PassThru |
          Where-Object { $_ -notin $usedList }

$unused | Set-Content (Join-Path $OutDir 'unused-css.txt')
Write-Host "Wrote $(($unused | Measure-Object).Count) potentially unused selectors to $OutDir\unused-css.txt"
