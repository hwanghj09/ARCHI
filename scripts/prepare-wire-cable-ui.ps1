$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$dir = "$root/assets/ui/wire-puzzle"
$source = [Drawing.Bitmap]::new("$dir/wire-cable-source.png")
try {
    $w = $source.Width; $h = $source.Height
    # 생성 결과(2048x768)는 진짜 알파가 있지만, 불투명 케이블 몸통은 세로로 가운데 약 23%(실측
    # y=298~465)뿐이고 위아래는 전부 알파 0이다(미리보기에 보이는 붉은 발광 그라데이션은 알파 0인
    # 칸에도 RGB가 남아 있어서 생기는 미리보기 도구의 표시 방식일 뿐, 실제 게임에선 알파를 지키므로
    # 안 보인다). 그 빈 칸을 그대로 들고 가면 타일 대부분이 투명이라 CSS 높이를 키워도 선이 가늘게만
    # 보이므로, 불투명 띠 주변만 살짝 여유를 두고 잘라낸 뒤(y=295~468) 절반 폭으로 줄인다.
    $cropTop = 295; $cropBottom = 468
    $cropH = $cropBottom - $cropTop
    $cropped = [Drawing.Bitmap]::new($w, $cropH, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g0 = [Drawing.Graphics]::FromImage($cropped)
    try { $g0.DrawImage($source, [Drawing.Rectangle]::new(0, 0, $w, $cropH), [Drawing.Rectangle]::new(0, $cropTop, $w, $cropH), [Drawing.GraphicsUnit]::Pixel) }
    finally { $g0.Dispose() }

    $outW = 512
    $outH = [int][Math]::Round($cropH * $outW / $w)
    $sheet = [Drawing.Bitmap]::new($outW, $outH, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [Drawing.Graphics]::FromImage($sheet)
    try {
        # 부드러운 그라데이션 질감이라 패널 그림과 달리 최근접 보간 대신 고품질 보간을 쓴다.
        $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($cropped, [Drawing.Rectangle]::new(0, 0, $outW, $outH), 0, 0, $w, $cropH, [Drawing.GraphicsUnit]::Pixel)
        $sheet.Save("$dir/wire-cable.png", [Drawing.Imaging.ImageFormat]::Png)
        Write-Output "Wrote $dir/wire-cable.png ($outW x $outH, cropped from y=$cropTop..$cropBottom of source)"
    } finally { $graphics.Dispose(); $sheet.Dispose() }
    $cropped.Dispose()
} finally { $source.Dispose() }
