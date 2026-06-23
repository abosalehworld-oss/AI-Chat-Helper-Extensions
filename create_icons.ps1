Add-Type -AssemblyName System.Drawing

# Source icon: place a master PNG named "icon_source.png" in the project root
$srcPath = Join-Path $PSScriptRoot "icon_source.png"
$destDir = Join-Path $PSScriptRoot "icons"

if (-not (Test-Path $srcPath)) {
    Write-Host "ERROR: icon_source.png not found in project root." -ForegroundColor Red
    Write-Host "Place a high-resolution PNG (>=128x128) named icon_source.png next to this script." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force
}

$src = [System.Drawing.Image]::FromFile($srcPath)

foreach ($size in @(128, 48, 16)) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($src, 0, 0, $size, $size)
    $g.Dispose()
    $outPath = Join-Path $destDir ("icon" + $size + ".png")
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created icon${size}.png"
}

$src.Dispose()
Write-Host "All icons created successfully!"
