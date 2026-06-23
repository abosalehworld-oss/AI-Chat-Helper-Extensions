# Run this from within the project folder:
# Right-click build.ps1 -> Run with PowerShell
# OR from terminal: cd to project folder, then: powershell -File build.ps1

Set-Location $PSScriptRoot

$ver = (Get-Content ".\manifest.json" -Raw | ConvertFrom-Json).version
$out = ".\dist\ai-chat-helper-v$ver.zip"

if (!(Test-Path ".\dist")) { New-Item -ItemType Directory ".\dist" | Out-Null }
if (Test-Path $out) { Remove-Item $out -Force }

Add-Type -Assembly System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open(
  (Resolve-Path ".\dist" | Select-Object -ExpandProperty Path) + "\ai-chat-helper-v$ver.zip",
  'Create'
)

$entries = @(
  'manifest.json',
  'privacy-policy.html',
  'LICENSE',
  'background/service-worker.js',
  'content/content.css',
  'content/content.js',
  'content/prompt-engineer.js',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'popup/popup.html',
  'popup/popup.css',
  'popup/popup.js',
  'summarizer/summarizer.js',
  '_locales/en/messages.json',
  '_locales/ar/messages.json'
)

Write-Host ""
Write-Host "Building AI Chat Helper v$ver..." -ForegroundColor Cyan

foreach ($e in $entries) {
  $rel = ".\$($e.Replace('/', '\'))"
  if (Test-Path $rel) {
    $full = (Resolve-Path $rel).Path
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $full, $e) | Out-Null
    Write-Host "  + $e" -ForegroundColor Green
  } else {
    Write-Host "  ! MISSING: $e" -ForegroundColor Red
  }
}

$zip.Dispose()

$zipFinal = ".\dist\ai-chat-helper-v$ver.zip"
$kb = [math]::Round((Get-Item $zipFinal).Length / 1KB, 1)

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  DONE! v$ver - $kb KB" -ForegroundColor Green
Write-Host "  dist\ai-chat-helper-v$ver.zip" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Give this zip to anyone. They:" -ForegroundColor Yellow
Write-Host "  1. Extract the zip to a folder" -ForegroundColor White
Write-Host "  2. chrome://extensions -> Developer mode ON" -ForegroundColor White
Write-Host "  3. Load unpacked -> select extracted folder" -ForegroundColor White
Write-Host ""

Start-Process explorer.exe (Resolve-Path ".\dist").Path
