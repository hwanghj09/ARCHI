$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$source = [System.Drawing.Bitmap]::new((Join-Path $root 'assets/player/jeong-suho-run-six.png'))
$sheet = [System.Drawing.Bitmap]::new(1536, 256, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($sheet)
try {
    if ($source.Width -ne 1536 -or $source.Height -ne 1024) { throw 'Expected a 3x2 grid of 512px cells.' }
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    # Contact baselines for each half-cycle; airborne poses retain their foot clearance.
    $hips = @(235, 221, 202, 241, 228, 203)
    $baselines = @(496, 499, 496, 472, 472, 472)
    $scale = 0.47
    for ($i = 0; $i -lt 6; $i++) {
        $sourceRect = [System.Drawing.Rectangle]::new(($i % 3) * 512, [math]::Floor($i / 3) * 512, 512, 512)
        $cell = $source.Clone($sourceRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $graphics.SetClip([System.Drawing.Rectangle]::new($i * 256, 0, 256, 256))
            $destination = [System.Drawing.RectangleF]::new($i * 256 + 128 - $hips[$i] * $scale,
                239 - $baselines[$i] * $scale, 512 * $scale, 512 * $scale)
            $graphics.DrawImage($cell, $destination, [System.Drawing.RectangleF]::new(0, 0, 512, 512), [System.Drawing.GraphicsUnit]::Pixel)
        } finally { $cell.Dispose() }
    }
    $sheet.Save((Join-Path $root 'assets/player/jeong-suho-run.png'), [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
    $graphics.Dispose()
    $sheet.Dispose()
    $source.Dispose()
}

$original = [System.Drawing.Bitmap]::new((Join-Path $root 'assets/player/jeong-suho-run.png'))
$extra = [System.Drawing.Bitmap]::new((Join-Path $root 'assets/player/jeong-suho-run-extra.png'))
$expanded = [System.Drawing.Bitmap]::new(2048, 256, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
try {
    if ($extra.Width -ne 1774 -or $extra.Height -ne 887) { throw 'Expected two 887px extra cells.' }
    # Copy the approved six cells exactly; new landing poses occupy indices 3 and 7.
    $indices = @(0, 1, 2, 4, 5, 6)
    for ($i = 0; $i -lt 6; $i++) {
        for ($y = 0; $y -lt 256; $y++) {
            for ($x = 0; $x -lt 256; $x++) {
                $expanded.SetPixel($indices[$i] * 256 + $x, $y, $original.GetPixel($i * 256 + $x, $y))
            }
        }
    }
    $graphics = [System.Drawing.Graphics]::FromImage($expanded)
    try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $hips = @(450, 448)
        $bottoms = @(808, 806)
        for ($i = 0; $i -lt 2; $i++) {
            $index = 3 + $i * 4
            $cell = $extra.Clone([System.Drawing.Rectangle]::new($i * 887, 0, 887, 887), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            try {
                $graphics.SetClip([System.Drawing.Rectangle]::new($index * 256, 0, 256, 256))
                $destination = [System.Drawing.RectangleF]::new($index * 256 + 128 - $hips[$i] * 0.285,
                    232 - $bottoms[$i] * 0.285, 887 * 0.285, 887 * 0.285)
                $graphics.DrawImage($cell, $destination, [System.Drawing.RectangleF]::new(0, 0, 887, 887), [System.Drawing.GraphicsUnit]::Pixel)
            } finally { $cell.Dispose() }
        }
    } finally { $graphics.Dispose() }
    $expanded.Save((Join-Path $root 'assets/player/jeong-suho-run-eight.png'), [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
    $expanded.Dispose()
    $extra.Dispose()
    $original.Dispose()
}
