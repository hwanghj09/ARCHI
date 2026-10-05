$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$source = [Drawing.Bitmap]::new("$root/assets/player/jeong-suho-opening-source.png")
$sheet = [Drawing.Bitmap]::new(1536, 256)
$graphics = [Drawing.Graphics]::FromImage($sheet)
try {
    $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::Half
    $hips = @(262,246,248,268,235,274)
    for ($i = 0; $i -lt 6; $i++) {
        # The standing head begins above y=512; split in the clear gap between rows.
        $rowY = if ($i -lt 3) { 0 } else { 490 }
        $rowHeight = if ($i -lt 3) { 490 } else { 534 }
        $cell = $source.Clone([Drawing.Rectangle]::new(($i % 3) * 512, $rowY, 512, $rowHeight), $source.PixelFormat)
        try {
            $bottom = 0
            for ($y = 0; $y -lt $rowHeight; $y++) {
                for ($x = 0; $x -lt 512; $x++) {
                    if ($cell.GetPixel($x, $y).A -gt 32) { $bottom = $y }
                }
            }
            $graphics.SetClip([Drawing.Rectangle]::new($i * 256, 0, 256, 256))
            $graphics.DrawImage($cell, [Drawing.RectangleF]::new($i * 256 + 128 - $hips[$i] * .47,
                237 - $bottom * .47, 512 * .47, $rowHeight * .47), [Drawing.RectangleF]::new(0, 0, 512, $rowHeight), [Drawing.GraphicsUnit]::Pixel)
        } finally { $cell.Dispose() }
    }
    $sheet.Save("$root/assets/player/jeong-suho-opening.png", [Drawing.Imaging.ImageFormat]::Png)
} finally { $graphics.Dispose(); $sheet.Dispose(); $source.Dispose() }
