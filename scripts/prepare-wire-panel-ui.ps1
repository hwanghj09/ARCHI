$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$dir = "$root/assets/ui/wire-puzzle"
$source = [Drawing.Bitmap]::new("$dir/wire-panel-source.png")
try {
    $w = $source.Width; $h = $source.Height
    # 생성 도구가 진짜 알파 없이 순수 검정 배경(RGB 0,0,0)에 그려 보냈다 — 안쪽 어두운 공동(배경 역할이
    # 아닌, 색 칠해질 소켓 주변의 '진짜' 패널 음영)은 가장 어두운 곳도 R/G/B 28 이상이라(실측), 8 이하만
    # 투명으로 치환해도 안전하다. 키잉 뒤 최근접 보간으로 표시 크기(480px 폭, 원본 비율 유지)로 줄인다.
    $keyed = [Drawing.Bitmap]::new($w, $h, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $rect = [Drawing.Rectangle]::new(0, 0, $w, $h)
    $srcData = $source.LockBits($rect, [Drawing.Imaging.ImageLockMode]::ReadOnly, [Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $dstData = $keyed.LockBits($rect, [Drawing.Imaging.ImageLockMode]::WriteOnly, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $srcStride = $srcData.Stride; $dstStride = $dstData.Stride
    $srcBytes = New-Object byte[] ($srcStride * $h)
    $dstBytes = New-Object byte[] ($dstStride * $h)
    [Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $srcBytes, 0, $srcBytes.Length)
    $threshold = 8
    for ($y = 0; $y -lt $h; $y++) {
        $srcRow = $y * $srcStride; $dstRow = $y * $dstStride
        for ($x = 0; $x -lt $w; $x++) {
            $sp = $srcRow + $x * 3; $dp = $dstRow + $x * 4
            $b = $srcBytes[$sp]; $g = $srcBytes[$sp + 1]; $r = $srcBytes[$sp + 2]
            $opaque = ($r -gt $threshold) -or ($g -gt $threshold) -or ($b -gt $threshold)
            $dstBytes[$dp] = $b; $dstBytes[$dp + 1] = $g; $dstBytes[$dp + 2] = $r
            $dstBytes[$dp + 3] = if ($opaque) { 255 } else { 0 }
        }
    }
    [Runtime.InteropServices.Marshal]::Copy($dstBytes, 0, $dstData.Scan0, $dstBytes.Length)
    $source.UnlockBits($srcData)
    $keyed.UnlockBits($dstData)

    $outW = 480
    $outH = [int][Math]::Round($h * $outW / $w)
    $sheet = [Drawing.Bitmap]::new($outW, $outH, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [Drawing.Graphics]::FromImage($sheet)
    try {
        $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::Half
        $graphics.DrawImage($keyed, [Drawing.Rectangle]::new(0, 0, $outW, $outH), 0, 0, $w, $h, [Drawing.GraphicsUnit]::Pixel)
        $sheet.Save("$dir/wire-panel.png", [Drawing.Imaging.ImageFormat]::Png)
        Write-Output "Wrote $dir/wire-panel.png ($outW x $outH)"
    } finally { $graphics.Dispose(); $sheet.Dispose() }
    $keyed.Dispose()
} finally { $source.Dispose() }
