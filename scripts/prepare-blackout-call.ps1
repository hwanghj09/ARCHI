$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
# Mechanical cropping/scaling of image_gen artwork; shared hip x=128 and soles y=237.
$source = [Drawing.Bitmap]::new("$root/assets/player/jeong-suho-blackout-call-source.png")
$sheet = [Drawing.Bitmap]::new(512, 256)
$graphics = [Drawing.Graphics]::FromImage($sheet)
try {
    $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::Half
    for ($i = 0; $i -lt 2; $i++) {
        $feet = 0
        for ($y = 0; $y -lt 887; $y++) {
            for ($x = 0; $x -lt 887; $x++) {
                if ($source.GetPixel($i * 887 + $x, $y).A -gt 32) { $feet = $y }
            }
        }
        $anchor = @(510, 383)[$i]
        $graphics.SetClip([Drawing.Rectangle]::new($i * 256, 0, 256, 256))
        $graphics.DrawImage($source, [Drawing.RectangleF]::new($i * 256 + 128 - $anchor * .28, 237 - $feet * .28, 887 * .28, 887 * .28),
            [Drawing.RectangleF]::new($i * 887, 0, 887, 887), [Drawing.GraphicsUnit]::Pixel)
    }
    $sheet.Save("$root/assets/player/jeong-suho-blackout-call.png", [Drawing.Imaging.ImageFormat]::Png)
} finally { $graphics.Dispose(); $sheet.Dispose(); $source.Dispose() }
