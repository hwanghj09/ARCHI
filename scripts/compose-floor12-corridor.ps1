<#
.SYNOPSIS
  Warps a single wide image_gen corridor illustration onto the fixed 5000x720
  floor12 corridor canvas so every door lands exactly on the BUILDING_CORE /
  FLOOR12_LAYOUT pixel coordinates from player.js.

.DESCRIPTION
  A single generated image never has door spacing that matches the game's
  fixed coordinates uniformly (elevators, stairs, lab/restroom/lounge doors
  each end up a different distance apart than the target layout wants). This
  script measures a list of (source x, target x) anchor points -- door edges,
  mostly -- and stretches each anchor-to-anchor slice independently so every
  anchor lands exactly on its target x, while the vertical scale stays a
  single constant across the whole image (so the floor line stays perfectly
  flat, which the collision geometry requires).

  Anchor x values are found by hand: open the source PNG, lay a grid over it
  (see the Python-free approach below, or just zoom in an image editor), and
  read off the left/right pixel edge of each door. Re-run this script after
  updating $Anchors for a new source image.

.PARAMETER SourcePath
  Path to the freshly generated wide corridor image (any width/height).

.PARAMETER OutPath
  Where to write the final 5000x720 corridor.png (defaults to the live asset).

.EXAMPLE
  powershell -File scripts/compose-floor12-corridor.ps1 -SourcePath C:\path\to\new-corridor.png
#>
param(
  [Parameter(Mandatory = $true)][string]$SourcePath,
  [string]$OutPath = "$PSScriptRoot/../assets/background/floor12/corridor.png"
)

Add-Type -AssemblyName System.Drawing

# --- Vertical calibration -----------------------------------------------
# CropTop: row where the source image's real ceiling detail starts (rows
# above this are dead black "night sky" padding from the image_gen tool and
# must be cropped, or the corridor renders with a huge pointless dark band
# at the top -- this was the "사진 높이가 어색해" bug).
# FloorSrc: the row where the DOOR LEAVES actually end (visually obvious --
# check several doors, they should all bottom out at the same row). Do NOT
# use a brightness scan to find "where it goes near-black": these images
# often draw a 30-100px decorative curb/ledge below the door before the
# foundation goes fully dark, and anchoring on the curb's bottom instead of
# the door's bottom put every door 20-70px too high in a past run (floated
# above y=570, mismatched the elevator DOM overlay, looked undersized next
# to the character -- the "바닥 높이가 안 맞고 엘베 에셋이랑 안 맞는다" bug).
# FloorTgt/CanvasH: the game's fixed floor line (floorY = 570 in player.js)
# and world height (720).
$CropTop = 0
$FloorSrc = 800
$FloorTgt = 570
$CanvasW = 5000
$CanvasH = 720

# --- Horizontal anchors ---------------------------------------------------
# (source x, target x) pairs, strictly increasing in both columns. Target
# values come straight from player.js: BUILDING_CORE.elevators/stairs and
# FLOOR12_LAYOUT's room doorX/doorWidth. Elevators and stairs are DOM
# overlays in-game (assets/objects/floor17/elevator.png, stairs.png fully
# cover the box) so their exact pixel alignment barely matters -- only the
# room doors (dev/lab/lounge) and the restroom door need to be pixel-exact,
# since those are drawn directly in this background image. IMPORTANT: measure
# each door's OUTER FRAME edge, not just the inner glass/panel leaves -- using
# the leaf edges left every door's frame overflowing 15-30px past doorX/
# doorX+doorWidth on both sides (visible outline highlight didn't match the
# drawn door at all). Fixed once by hand in corridor.png; re-measure properly
# if this script is re-run against a new source image.
$Anchors = @(
  @(0,    0),
  @(1360, 1030),  # ARCHI 개발실 door left  (FLOOR12_LAYOUT doorX=1030)
  @(1495, 1170),  # dev door right          (doorX+doorWidth=1030+140)
  @(2820, 1818),  # elevator 1 left         (BUILDING_CORE.elevators[0].x)
  @(3100, 2036),  # elevator 1 right
  @(3200, 2148),  # elevator 2 left
  @(3480, 2362),  # elevator 2 right
  @(3580, 2444),  # elevator 3 left
  @(3860, 2660),  # elevator 3 right
  @(4290, 2906),  # stairs left             (BUILDING_CORE.stairs.x)
  @(4460, 3086),  # stairs right            (BUILDING_CORE.stairs.x + width)
  @(4900, 3290),  # 성능 평가실 door left    (doorX=3290)
  @(5150, 3450),  # lab door right          (doorX+doorWidth=3290+160)
  @(5480, 3552),  # lab front end / restroom front start (BUILDING_CORE.restroom.x + width)
  @(5680, 3612),  # 화장실 door left         (BUILDING_CORE.restroom.doorX)
  @(5800, 3757),  # restroom door right     (doorX+doorWidth=3612+145)
  @(6300, 4300),  # 개발자 휴게실 front start (FLOOR12_LAYOUT room x=4300) -- plenty of real source
                  # content here (500px), no filler patch needed this time.
  @(7300, 4700),  # lounge door left        (doorX=4700)
  @(7460, 4810),  # lounge door right       (doorX+doorWidth=4700+110)
  @(7831, 5000)   # right edge
)

# --- Filler patch ----------------------------------------------------------
# Only needed if the source DOESN'T have enough real wall between the
# restroom door and the lounge front (target gap 3757..4300) to stretch
# without smearing or revealing unrelated content (glass, hazard stripes).
# The current source (7831px wide) has 500px of real column/wall there
# already covered by the (5800,3757)->(6300,4300) anchor pair above, so this
# is OFF. Turn it back on (and re-pick a genuinely PLAIN source crop with no
# window/door/sign/glass in it) only if a future source is too narrow there.
$UseFiller = $false
$FillSourceX0 = 600
$FillSourceX1 = 700
$FillTargetX0 = 3757
$FillTargetX1 = 4300

function Get-HighQualityGraphics([System.Drawing.Bitmap]$bmp) {
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  return $g
}

$src = [System.Drawing.Bitmap]::FromFile((Resolve-Path $SourcePath))
$srcH = $src.Height
$sy = $FloorTgt / ($FloorSrc - $CropTop)
$resizedH = [Math]::Round(($srcH - $CropTop) * $sy)

$canvas = New-Object System.Drawing.Bitmap $CanvasW, $CanvasH
$g = Get-HighQualityGraphics $canvas
$g.Clear([System.Drawing.Color]::FromArgb(255, 5, 8, 10))

for ($i = 0; $i -lt $Anchors.Count - 1; $i++) {
  $s0, $t0 = $Anchors[$i]
  $s1, $t1 = $Anchors[$i + 1]
  if ($t1 -le $t0 -or $s1 -le $s0) { continue }
  $srcRect = New-Object System.Drawing.Rectangle $s0, $CropTop, ($s1 - $s0), ($srcH - $CropTop)
  $destRect = New-Object System.Drawing.Rectangle $t0, 0, ($t1 - $t0), $resizedH
  $g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
}

if ($UseFiller) {
  # tile the plain-wall filler across the gap that has no real source content
  $patchW = $FillSourceX1 - $FillSourceX0
  $x = $FillTargetX0
  while ($x -lt $FillTargetX1) {
    $w = [Math]::Min($patchW, $FillTargetX1 - $x)
    $srcRect = New-Object System.Drawing.Rectangle $FillSourceX0, $CropTop, $w, ($srcH - $CropTop)
    $destRect = New-Object System.Drawing.Rectangle $x, 0, $w, $resizedH
    $g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $x += $patchW
  }
}

$g.Dispose()
$src.Dispose()
$resolvedOut = [System.IO.Path]::GetFullPath($OutPath)
$canvas.Save($resolvedOut, [System.Drawing.Imaging.ImageFormat]::Png)
$canvas.Dispose()
Write-Host "Saved $resolvedOut ($CanvasW x $CanvasH), vertical scale=$sy"
