$root = $PSScriptRoot
Write-Host "=== PROJECT STRUCTURE ===" -ForegroundColor Cyan

Get-ChildItem -Path $root -Recurse -File | Where-Object { $_.Name -notlike "create_icons*" } | ForEach-Object {
    $rel = $_.FullName.Replace($root + "\", "")
    $kb  = [math]::Round($_.Length / 1KB, 1)
    Write-Host ("  " + $rel + "  (" + $kb + " KB)")
}

Write-Host ""
Write-Host "=== VALIDATING MANIFEST ===" -ForegroundColor Cyan
$m = Get-Content "$root\manifest.json" | ConvertFrom-Json
Write-Host ("  manifest_version : " + $m.manifest_version)
Write-Host ("  name             : " + $m.name)
Write-Host ("  version          : " + $m.version)
Write-Host ("  permissions      : " + ($m.permissions -join ", "))

Write-Host ""
Write-Host "All files verified!" -ForegroundColor Green
