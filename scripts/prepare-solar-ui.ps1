$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$source = [Drawing.Bitmap]::new("$root/assets/ui/power/panel-source.png")
$sheet = [Drawing.Bitmap]::new(768, 512)
$graphics = [Drawing.Graphics]::FromImage($sheet)
try {
    if ($source.Width -ne 1536 -or $source.Height -ne 1024) { throw 'Expected two 768x1024 cells.' }
    $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::Half
    $graphics.DrawImage($source, [Drawing.Rectangle]::new(0, 0, 768, 512), 0, 0, 1536, 1024, [Drawing.GraphicsUnit]::Pixel)
    $sheet.Save("$root/assets/ui/power/panel-off-on.png", [Drawing.Imaging.ImageFormat]::Png)
} finally { $graphics.Dispose(); $sheet.Dispose(); $source.Dispose() }
