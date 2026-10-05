$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
# Mechanical atlas slicing only; art and ON/OFF variants come from image_gen.
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
public static class PhoneAtlas {
    public static void Build(string source, string output, int columns, float scale, int[] hips, string corrected = null) {
        using (var input = new Bitmap(source))
        using (var correction = corrected == null ? null : new Bitmap(corrected))
        using (var sheet = new Bitmap(hips.Length * 256, 256))
        using (var g = Graphics.FromImage(sheet)) {
            g.InterpolationMode = InterpolationMode.NearestNeighbor;
            g.PixelOffsetMode = PixelOffsetMode.Half;
            for (int i = 0; i < hips.Length; i++) {
                int x = (int)((i % columns) * input.Width / (double)columns);
                // The generated run sheet's first row extends below its nominal half.
                int split = columns == 4 ? 460 : input.Height / 2;
                int y = (i / columns) * split;
                int w = (int)(((i % columns) + 1) * input.Width / (double)columns) - x;
                int h = i < columns ? split : input.Height - split;
                var atlas = correction != null && (i == 0 || i == 1 || i == 3) ? correction : input;
                using (var cell = atlas.Clone(new Rectangle(x, y, w, h), PixelFormat.Format32bppArgb)) {
                    int bottom = 0;
                    for (int cy = 0; cy < h; cy++)
                        for (int cx = 0; cx < w; cx++)
                            if (cell.GetPixel(cx, cy).A > 32) bottom = Math.Max(bottom, cy);
                    g.SetClip(new Rectangle(i * 256, 0, 256, 256));
                    int sole = columns == 4 && i % 4 == 3 ? 219 : columns == 4 && i % 4 == 2 ? 230 : 237;
                    g.DrawImage(cell, new RectangleF(i * 256 + 128 - hips[i] * scale,
                        sole - bottom * scale, w * scale, h * scale),
                        new RectangleF(0, 0, w, h), GraphicsUnit.Pixel);
                }
            }
            sheet.Save(output, ImageFormat.Png);
        }
    }
}
'@
foreach ($light in @('off', 'on')) {
    [PhoneAtlas]::Build("$root/assets/player/phone-movement-source/walk-$light.png",
        "$root/assets/player/jeong-suho-phone-walk-$light.png", 3, 0.48, @(272,246,265,279,260,261),
        "$root/assets/player/phone-movement-source/walk-$light-hands.png")
    [PhoneAtlas]::Build("$root/assets/player/phone-movement-source/run-$light.png",
        "$root/assets/player/jeong-suho-phone-run-$light.png", 4, 0.56, @(230,202,196,202,224,212,200,219))
}
