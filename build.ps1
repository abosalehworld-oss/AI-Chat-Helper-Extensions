$src = $PSScriptRoot
$outDir = Join-Path $src "dist"
$zip = Join-Path $outDir "ai-chat-helper-v1.0.0.zip"
$tmp = Join-Path $env:TEMP "ach_build_$(Get-Random)"

# Create dist dir
if (!(Test-Path $outDir)) { New-Item -ItemType Directory $outDir | Out-Null }
if (Test-Path $zip) { Remove-Item $zip -Force }
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
New-Item -ItemType Directory $tmp | Out-Null

# Copy required files only (no .bat, .ps1, .md dev files)
Copy-Item (Join-Path $src "manifest.json")        $tmp
Copy-Item (Join-Path $src "privacy-policy.html")  $tmp

foreach ($d in @("background","popup","content","summarizer","icons","_locales")) {
    $dst = Join-Path $tmp $d
    New-Item -ItemType Directory $dst | Out-Null
    Copy-Item (Join-Path $src $d) $dst -Recurse -Force
}

# Compress
Compress-Archive -Path (Join-Path $tmp "*") -DestinationPath $zip -Force
Remove-Item $tmp -Recurse -Force

$size = [math]::Round((Get-Item $zip).Length / 1KB, 1)
Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "  File: dist\ai-chat-helper-v1.0.0.zip" -ForegroundColor White
Write-Host "  Size: $size KB" -ForegroundColor White
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Open dist folder
Start-Process explorer.exe $outDir
