@echo off
chcp 65001 >nul 2>&1
setlocal

echo.
echo  ====================================
echo    AI Chat Helper - Building ZIP...
echo  ====================================
echo.

set "ICONS_DIR=%~dp0icons"
set "TMP_ICONS=%TEMP%\ach_icons"
set "TMP_SRC=%TEMP%\ai_chat_helper_build"
set "ZIP_OUT=%TEMP%\ai-chat-helper-v1.0.0.zip"
set "DIST_DIR=%~dp0dist"

:: ── Step 1: Generate Icons ──────────────────────────────
echo  [1/4] Generating icons...

if not exist "%ICONS_DIR%" mkdir "%ICONS_DIR%"

:: Write icon generation script to temp
set "ICON_PS=%TEMP%\ach_make_icons.ps1"
(
echo Add-Type -AssemblyName System.Drawing
echo $tmp = '%TMP_ICONS%'
echo New-Item -ItemType Directory -Force $tmp ^| Out-Null
echo $sizes = @(16, 48, 128^)
echo foreach ($s in $sizes^) {
echo   $bmp = New-Object System.Drawing.Bitmap($s, $s^)
echo   $g = [System.Drawing.Graphics]::FromImage($bmp^)
echo   $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
echo   $p1 = [System.Drawing.Point]::new(0,0^)
echo   $p2 = [System.Drawing.Point]::new($s,$s^)
echo   $c1 = [System.Drawing.Color]::FromArgb(124,58,237^)
echo   $c2 = [System.Drawing.Color]::FromArgb(59,130,246^)
echo   $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush($p1,$p2,$c1,$c2^)
echo   $g.FillRectangle($grad,0,0,$s,$s^)
echo   $grad.Dispose(^)
echo   if ($s -ge 48^) {
echo     $font = New-Object System.Drawing.Font('Arial',[int]($s*0.38^),[System.Drawing.FontStyle]::Bold^)
echo     $sf = New-Object System.Drawing.StringFormat
echo     $sf.Alignment = [System.Drawing.StringAlignment]::Center
echo     $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
echo     $rect = [System.Drawing.RectangleF]::new(0,0,$s,$s^)
echo     $g.DrawString('AI',$font,[System.Drawing.Brushes]::White,$rect,$sf^)
echo     $font.Dispose(^)
echo   }
echo   if ($s -eq 16^) { $g.FillEllipse([System.Drawing.Brushes]::White,4,4,8,8^) }
echo   $g.Dispose(^)
echo   $bmp.Save((Join-Path $tmp "icon$s.png"^),[System.Drawing.Imaging.ImageFormat]::Png^)
echo   $bmp.Dispose(^)
echo }
echo Write-Host 'Icons OK'
) > "%ICON_PS%"

powershell -ExecutionPolicy Bypass -File "%ICON_PS%"
del /f /q "%ICON_PS%"

:: Copy icons to project icons folder
robocopy "%TMP_ICONS%" "%ICONS_DIR%" *.png /NFL /NDL /NJH /NJS >nul

:: ── Step 2: Copy project files to temp ─────────────────
echo  [2/4] Copying project files...

if exist "%TMP_SRC%" rmdir /s /q "%TMP_SRC%"
mkdir "%TMP_SRC%"
if not exist "%DIST_DIR%" mkdir "%DIST_DIR%"

robocopy "%~dp0background"  "%TMP_SRC%\background"  /E /NFL /NDL /NJH /NJS >nul
robocopy "%~dp0popup"       "%TMP_SRC%\popup"       /E /NFL /NDL /NJH /NJS >nul
robocopy "%~dp0content"     "%TMP_SRC%\content"     /E /NFL /NDL /NJH /NJS >nul
robocopy "%~dp0summarizer"  "%TMP_SRC%\summarizer"  /E /NFL /NDL /NJH /NJS >nul
robocopy "%TMP_ICONS%"      "%TMP_SRC%\icons"       /E /NFL /NDL /NJH /NJS >nul
robocopy "%~dp0_locales"    "%TMP_SRC%\_locales"    /E /NFL /NDL /NJH /NJS >nul
copy /Y "%~dp0manifest.json"       "%TMP_SRC%\manifest.json"       >nul
copy /Y "%~dp0privacy-policy.html" "%TMP_SRC%\privacy-policy.html" >nul

:: ── Step 3: Create ZIP ─────────────────────────────────
echo  [3/4] Creating ZIP...

if exist "%ZIP_OUT%" del /f /q "%ZIP_OUT%"

powershell -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%TMP_SRC%\*' -DestinationPath '%ZIP_OUT%' -Force; Write-Host 'ZIP_OK'"

if not exist "%ZIP_OUT%" (
    echo  [ERROR] ZIP creation failed!
    pause
    exit /b 1
)

:: ── Step 4: Move to dist ───────────────────────────────
echo  [4/4] Saving to dist folder...

copy /Y "%ZIP_OUT%" "%DIST_DIR%\ai-chat-helper-v1.0.0.zip" >nul

for %%A in ("%DIST_DIR%\ai-chat-helper-v1.0.0.zip") do set "SIZE=%%~zA"
set /a SIZE_KB=%SIZE% / 1024

:: Cleanup
rmdir /s /q "%TMP_SRC%"
rmdir /s /q "%TMP_ICONS%"
del  /f /q  "%ZIP_OUT%"

echo.
echo  ====================================
echo   SUCCESS!
echo   Icons: created automatically
echo   File:  dist\ai-chat-helper-v1.0.0.zip
echo   Size:  %SIZE_KB% KB
echo  ====================================
echo.
echo  The ZIP is ready to:
echo    1. Share with clients (unzip + Load unpacked)
echo    2. Upload to Chrome Web Store
echo.

start "" "%DIST_DIR%"
pause
