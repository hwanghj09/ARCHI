$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class FloorKitPixels {
    public static Rectangle Bounds(Bitmap bitmap) {
        int left = bitmap.Width, top = bitmap.Height, right = -1, bottom = -1;
        var data = bitmap.LockBits(new Rectangle(0, 0, bitmap.Width, bitmap.Height),
            ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        try {
            var row = new byte[bitmap.Width * 4];
            for (int y = 0; y < bitmap.Height; y++) {
                Marshal.Copy(IntPtr.Add(data.Scan0, y * data.Stride), row, 0, row.Length);
                for (int x = 0; x < bitmap.Width; x++) {
                    if (row[x * 4 + 3] <= 8) continue;
                    left = Math.Min(left, x); top = Math.Min(top, y);
                    right = Math.Max(right, x); bottom = Math.Max(bottom, y);
                }
            }
        } finally { bitmap.UnlockBits(data); }
        if (right < left) throw new InvalidOperationException("Empty sprite");
        return Rectangle.FromLTRB(left, top, right + 1, bottom + 1);
    }
}
'@
$assetRoot = Join-Path (Split-Path $PSScriptRoot -Parent) 'assets/objects/floor-kit'
$manifest = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $assetRoot 'manifest.json') | ConvertFrom-Json
foreach ($asset in $manifest.assets) {
    $source = [System.Drawing.Bitmap]::new((Join-Path $assetRoot "source/$($asset.file)"))
    $sprite = [System.Drawing.Bitmap]::new($asset.width, $asset.height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($sprite)
    try {
        $bounds = [FloorKitPixels]::Bounds($source)
        $factor = [math]::Min(($asset.width - 16) / $bounds.Width, ($asset.height - 16) / $bounds.Height)
        $width = [int][math]::Floor($bounds.Width * $factor)
        $height = [int][math]::Floor($bounds.Height * $factor)
        $left = [int][math]::Floor(($asset.width - $width) / 2)
        $top = $asset.height - 8 - $height
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.DrawImage($source, [System.Drawing.Rectangle]::new($left, $top, $width, $height),
            $bounds.X, $bounds.Y, $bounds.Width, $bounds.Height, [System.Drawing.GraphicsUnit]::Pixel)
        $sprite.Save((Join-Path $assetRoot $asset.file), [System.Drawing.Imaging.ImageFormat]::Png)
        $actual = [FloorKitPixels]::Bounds($sprite)
        if ($sprite.Width % 256 -or $sprite.Height % 256 -or $actual.Left -lt 8 -or $actual.Top -lt 8 -or
            $actual.Right -gt $sprite.Width - 8 -or [math]::Abs($actual.Bottom - ($sprite.Height - 8)) -gt 1 -or
            $sprite.GetPixel(0, 0).A -ne 0) { throw "Invalid size, padding, alpha or baseline: $($asset.file)" }
        Write-Output ("PASS {0}: {1}x{2}, anchor=({3},{4})" -f $asset.file, $sprite.Width, $sprite.Height, $asset.anchor[0], $asset.anchor[1])
    } finally {
        $graphics.Dispose()
        $sprite.Dispose()
        $source.Dispose()
    }
}
