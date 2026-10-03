$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
# Mechanical atlas extraction only. All illustration pixels come from image_gen.
function Pack-Sheet($sourcePath, $outputPath, $cellWidth, $cells, $ratio) {
    $source = [Drawing.Bitmap]::new("$root/$sourcePath")
    $sheet = [Drawing.Bitmap]::new($cellWidth * $cells.Count, 256)
    $graphics = [Drawing.Graphics]::FromImage($sheet)
    try {
        $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::Half
        for ($i = 0; $i -lt $cells.Count; $i++) {
            $c = $cells[$i]
            $cell = $source.Clone([Drawing.Rectangle]::new($c[0], $c[1], $c[2], $c[3]), $source.PixelFormat)
            try {
                $feet = 0
                for ($y = 0; $y -lt $cell.Height; $y++) {
                    for ($x = 0; $x -lt $cell.Width; $x++) {
                        if ($cell.GetPixel($x, $y).A -gt 32) { $feet = $y }
                    }
                }
                $graphics.SetClip([Drawing.Rectangle]::new($i * $cellWidth, 0, $cellWidth, 256))
                $graphics.DrawImage($cell, [Drawing.RectangleF]::new($i * $cellWidth + 128 - $c[4] * $ratio,
                    237 - $feet * $ratio, $cell.Width * $ratio, $cell.Height * $ratio),
                    [Drawing.RectangleF]::new(0, 0, $cell.Width, $cell.Height), [Drawing.GraphicsUnit]::Pixel)
            } finally { $cell.Dispose() }
        }
        $sheet.Save("$root/$outputPath", [Drawing.Imaging.ImageFormat]::Png)
    } finally { $graphics.Dispose(); $sheet.Dispose(); $source.Dispose() }
}
# Reach poses extend across the nominal source grid; split in the actual transparent gaps.
$robotCells = @(@(0,0,443,443,164), @(443,0,443,443,164), @(886,0,443,443,164), @(1329,0,445,443,164),
    @(0,443,470,444,164), @(470,443,454,444,138), @(924,443,442,444,126), @(1366,443,408,444,128))
Pack-Sheet 'assets/objects/guard-robot/capture-source.png' 'assets/objects/guard-robot/guard-capture.png' 384 $robotCells .5
$playerCells = @(@(0,0,627,627,340), @(627,0,627,627,317), @(0,627,627,627,330), @(627,627,627,627,311))
Pack-Sheet 'assets/player/jeong-suho-caught-source.png' 'assets/player/jeong-suho-caught.png' 256 $playerCells .39
