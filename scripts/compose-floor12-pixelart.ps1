$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Join-Path (Split-Path $PSScriptRoot -Parent) 'assets/background/floor12'

function Resize-Stretch($srcPath, $w, $h) {
    $src = [System.Drawing.Bitmap]::new($srcPath)
    $dst = [System.Drawing.Bitmap]::new($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($dst)
    try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($src, [System.Drawing.Rectangle]::new(0, 0, $w, $h),
            [System.Drawing.Rectangle]::new(0, 0, $src.Width, $src.Height), [System.Drawing.GraphicsUnit]::Pixel)
    } finally { $graphics.Dispose(); $src.Dispose() }
    return $dst
}

# Interior rooms: each generated cell IS the whole room front (non-uniform stretch to the room's own width x 720).
$interiors = @(
    @{ src = 'art-interior-dev.png'; out = 'dev.png'; w = 3600 },
    @{ src = 'art-interior-lab.png'; out = 'lab.png'; w = 1808 },
    @{ src = 'art-interior-lounge.png'; out = 'lounge.png'; w = 2560 }
)
foreach ($room in $interiors) {
    $bmp = Resize-Stretch (Join-Path $root $room.src) $room.w 720
    $bmp.Save((Join-Path $root $room.out), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "wrote $($room.out) ($($room.w)x720)"
}

# Corridor: NO LONGER handled by this script (2026-09-25). corridor.png was replaced by a
# single-image warp; see scripts/compose-floor12-corridor.ps1 and GENERATED.md's "복도 재작성"
# section. This script used to also composite art-corridor-*.png onto corridor.png here, but that
# block was removed because re-running it would silently stamp the old per-room door art back over
# the new corridor.png at the same room-front x ranges. The old 4-piece method is documented in
# PROMPT.md's "1~4. 복도 ..." sections (marked deprecated) and GENERATED.md, for reference only.
