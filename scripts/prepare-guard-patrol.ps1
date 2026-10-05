$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$source = [Drawing.Bitmap]::new("$root/assets/objects/guard-robot/patrol-source.png")
$sheet = [Drawing.Bitmap]::new(2048, 256)
$graphics = [Drawing.Graphics]::FromImage($sheet)
try {
    $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::Half
    for ($i = 0; $i -lt 8; $i++) {
        $left = [int][Math]::Round(($i % 4) * $source.Width / 4)
        $right = [int][Math]::Round((($i % 4) + 1) * $source.Width / 4)
        $top = [int][Math]::Round([Math]::Floor($i / 4) * $source.Height / 2)
        $bottom = [int][Math]::Round(([Math]::Floor($i / 4) + 1) * $source.Height / 2)
        $cell = $source.Clone([Drawing.Rectangle]::new($left, $top, $right - $left, $bottom - $top), $source.PixelFormat)
        try {
            $feet = 0
            for ($y = 0; $y -lt $cell.Height; $y++) {
                for ($x = 0; $x -lt $cell.Width; $x++) {
                    if ($cell.GetPixel($x, $y).A -gt 32) { $feet = $y }
                }
            }
            # Fixed chassis center and scale; only align the wheel contact baseline.
            $ratio = 192 / ($source.Height * .415)
            $graphics.SetClip([Drawing.Rectangle]::new($i * 256, 0, 256, 256))
            $graphics.DrawImage($cell, [Drawing.RectangleF]::new($i * 256 + 128 - $cell.Width * .525 * $ratio,
                237 - $feet * $ratio, $cell.Width * $ratio, $cell.Height * $ratio),
                [Drawing.RectangleF]::new(0, 0, $cell.Width, $cell.Height), [Drawing.GraphicsUnit]::Pixel)
        } finally { $cell.Dispose() }
    }
    $sheet.Save("$root/assets/objects/guard-robot/guard-patrol.png", [Drawing.Imaging.ImageFormat]::Png)
} finally { $graphics.Dispose(); $sheet.Dispose(); $source.Dispose() }
