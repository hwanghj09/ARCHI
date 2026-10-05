# Normalize image_gen lighting edits to the existing background canvases without changing originals.
Add-Type -AssemblyName System.Drawing
$repo = Split-Path $PSScriptRoot -Parent
$manifest = Get-Content -LiteralPath (Join-Path $repo 'assets/background/power-off-manifest.json') -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($asset in $manifest.assets) {
    $original = [System.Drawing.Image]::FromFile((Join-Path $repo $asset.original))
    $generated = [System.Drawing.Image]::FromFile($asset.generated)
    $output = New-Object System.Drawing.Bitmap $original.Width, $original.Height
    $graphics = [System.Drawing.Graphics]::FromImage($output)
    try {
        $ratio = $original.Width / $original.Height
        $cropWidth = [Math]::Min($generated.Width, $generated.Height * $ratio)
        $cropHeight = $cropWidth / $ratio
        $source = New-Object System.Drawing.RectangleF (($generated.Width - $cropWidth) / 2), (($generated.Height - $cropHeight) / 2), $cropWidth, $cropHeight
        $target = New-Object System.Drawing.RectangleF 0, 0, $original.Width, $original.Height
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $graphics.DrawImage($generated, $target, $source, [System.Drawing.GraphicsUnit]::Pixel)
        $output.Save((Join-Path $repo $asset.output), [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Output "$($asset.output): $($original.Width)x$($original.Height)"
    } finally {
        $graphics.Dispose()
        $output.Dispose()
        $generated.Dispose()
        $original.Dispose()
    }
}
