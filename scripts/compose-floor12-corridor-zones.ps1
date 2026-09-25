<#
.SYNOPSIS
  Composes the floor12 corridor from FOUR separately generated zone images
  instead of one extremely wide (6-7:1) single image. This avoids the
  "억지로 늘려서 어색함" (forced-stretch smearing) problem: a single very wide
  image_gen canvas can't keep door spacing consistent across its whole width,
  so lining every door up to the fixed player.js coordinates required warping
  different sections by very different amounts (some over 5x), which visibly
  blurred/smeared the source art.

  Each zone here is generated at a much more reasonable aspect ratio (close
  to what a single image_gen call can actually hit precisely), the same way
  17F's corridor extension (service-corridor.png) was made: request only the
  new section, at close to its real target size, and it barely needs any
  scaling. See assets/background/floor12/PROMPT.md's "구역 A/B/C/D" prompts.

.DESCRIPTION
  Zone A (ARCHI 개발실 front) and Zone B (elevators + stairs) are simple
  width-matched, floor-aligned pastes: each image's own aspect ratio already
  came out close to its target zone, so a single uniform scale (no warping)
  aligns the floor line and gets the door close enough.

  Zone C (lab + restroom) still needs a *small* 5-point internal warp,
  because its lab door and restroom door came out slightly closer together
  in the source than the fixed target coordinates want. This is a much
  smaller correction than the old whole-corridor warp (roughly 0.4x-1.1x
  per segment, not 5x+), so it does not introduce visible smearing.

  Zone D (lounge) came out proportioned wider than requested (its door and
  porthole take more real width than the nominal 700px slot), so it is
  scaled to match the WORLD FLOOR HEIGHT instead of the slot width, then
  positioned so its door lands exactly on FLOOR12_LAYOUT's lounge doorX;
  its left edge is allowed to extend into what would have been zone C's
  tail end, and zone C's last anchor is simply cut short to meet it (no
  gap, no filler patch needed).

.PARAMETER ZoneA / ZoneB / ZoneC / ZoneD
  Paths to the four freshly generated zone images.

.PARAMETER OutPath
  Where to write the final 5000x720 corridor.png.

.EXAMPLE
  powershell -File scripts/compose-floor12-corridor-zones.ps1 `
    -ZoneA C:\path\dev.png -ZoneB C:\path\elevators.png `
    -ZoneC C:\path\lab-restroom.png -ZoneD C:\path\lounge.png
#>
param(
  [Parameter(Mandatory = $true)][string]$ZoneA,
  [Parameter(Mandatory = $true)][string]$ZoneB,
  [Parameter(Mandatory = $true)][string]$ZoneC,
  [Parameter(Mandatory = $true)][string]$ZoneD,
  [string]$OutPath = "$PSScriptRoot/../assets/background/floor12/corridor.png"
)

Add-Type -AssemblyName System.Drawing

$CanvasW = 5000
$CanvasH = 720

function New-Graphics([System.Drawing.Bitmap]$bmp) {
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  return $g
}

$canvas = New-Object System.Drawing.Bitmap $CanvasW, $CanvasH
$g = New-Graphics $canvas
$g.Clear([System.Drawing.Color]::FromArgb(255, 5, 8, 10))

function Paste-Scaled($path, $scale, $destX, $top) {
  $img = [System.Drawing.Bitmap]::FromFile((Resolve-Path $path))
  $nw = [Math]::Round($img.Width * $scale)
  $nh = [Math]::Round($img.Height * $scale)
  $destRect = New-Object System.Drawing.Rectangle ([Math]::Round($destX)), ([Math]::Round($top)), $nw, $nh
  $srcRect = New-Object System.Drawing.Rectangle 0, 0, $img.Width, $img.Height
  $g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $img.Dispose()
}

# --- Zone A: ARCHI 개발실 front, width-matched to 1818px ---------------
# doorX=1030 doorWidth=140 (FLOOR12_LAYOUT). floorSrc MUST be the y where the
# DOOR LEAVES actually end (visually obvious in the source image), NOT the
# bottom of whatever raised curb/ledge sits below the door -- these images
# draw a thick decorative curb (30-100px) between the door bottom and the
# point where brightness finally drops to near-black, and anchoring on that
# curb's bottom edge instead of the door bottom put every door 20-70px too
# high, floating above the y=570 collision line (this was the "바닥 높이가
# 안 맞고 엘베 에셋이랑 안 맞는다" bug). Re-measure by eye on a 100px grid
# overlay: floorSrc = the row where the door frame itself ends, matching the
# elevator/room doors' visible bottom edge, not a brightness scan.
$imgA = [System.Drawing.Bitmap]::FromFile((Resolve-Path $ZoneA))
$sA = 1818 / $imgA.Width
$floorSrcA = 600
$imgA.Dispose()
Paste-Scaled $ZoneA $sA 0 (570 - $floorSrcA * $sA)

# --- Zone B: elevators + stairs, width-matched to 1282px (1818..3100) ---
$imgB = [System.Drawing.Bitmap]::FromFile((Resolve-Path $ZoneB))
$sB = 1282 / $imgB.Width
$floorSrcB = 700
$imgB.Dispose()
Paste-Scaled $ZoneB $sB 1818 (570 - $floorSrcB * $sB)

# --- Zone C: lab + restroom, small 5-point local warp (3100..4040) ------
# Local target x (0 = world x=3100): lab door 190/350 (world 3290/3450),
# restroom door 512/657 (world 3612/3757), end 940 (world 4040, where zone
# D's left edge lands -- NOT the restroom's full BUILDING_CORE width 1182,
# deliberately cut short so zone D can take over with no gap/filler).
$imgC = [System.Drawing.Bitmap]::FromFile((Resolve-Path $ZoneC))
$floorSrcC = 700  # door-bottom y, not the curb's brightness-drop row (see Zone A note above)
$syC = 570 / $floorSrcC
$hC = [Math]::Round($imgC.Height * $syC)
$anchorsC = @(@(0,0), @(310,190), @(570,350), @(975,512), @(1155,657), @(1405,940))
for ($i = 0; $i -lt $anchorsC.Count - 1; $i++) {
  $s0, $t0 = $anchorsC[$i]
  $s1, $t1 = $anchorsC[$i + 1]
  $srcRect = New-Object System.Drawing.Rectangle $s0, 0, ($s1 - $s0), $imgC.Height
  $destRect = New-Object System.Drawing.Rectangle (3100 + $t0), 0, ($t1 - $t0), $hC
  $g.DrawImage($imgC, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
}
$imgC.Dispose()

# --- Zone D: lounge, HEIGHT-matched (not width-matched) then door-positioned
# The source came out ~1.39:1 instead of the requested ~0.97:1, so matching
# width would leave the image ~220px short of the full 720 height (a dead
# gap above the ceiling). Matching height instead keeps it undistorted; its
# natural width (~1000px) is wider than the nominal 700px slot, so it's
# positioned by its OWN door instead of a fixed left edge, and is allowed to
# extend left into zone C's territory (zone C's last anchor above already
# stops at that same x so there's no seam or overlap).
$imgD = [System.Drawing.Bitmap]::FromFile((Resolve-Path $ZoneD))
$sD = 720 / $imgD.Height
$doorLeftSrcD = 975
$floorSrcD = 800  # door-bottom y, not the curb's brightness-drop row (see Zone A note above)
$offsetD = 4700 - ($doorLeftSrcD * $sD)
$imgD.Dispose()
Paste-Scaled $ZoneD $sD $offsetD (570 - $floorSrcD * $sD)

$g.Dispose()
$resolvedOut = [System.IO.Path]::GetFullPath($OutPath)
$canvas.Save($resolvedOut, [System.Drawing.Imaging.ImageFormat]::Png)
$canvas.Dispose()
Write-Host "Saved $resolvedOut ($CanvasW x $CanvasH)"
