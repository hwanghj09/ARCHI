# 화장실 배경 3종

- 제작: 내장 `image_gen`, 2026-09-29. 참조 이미지 없음.
- 세 파일 모두 2172×724 RGB 불투명 PNG. 생성 원본 그대로 저장.
- 현재 게임에 배치되지 않은 재사용 배경. 표시 폭·출입구·충돌·조명은 실제 방에 연결할 때 정해야 함.
- 아래 바닥선 값은 시각적으로 측정한 근사치이며 실제 연결 시 재확인.
- 배치 계산: `scale = displayWidth / 2172`, `top = floorY - sourceFloorY * scale`.

## 현대식 공용 화장실

파일: `restroom-modern.png`, 바닥 기준선 약 y=591.

```text
Use case: stylized-concept. Create one finished wide reusable restroom background for ARCHI, a 2D side-scrolling Korean office mystery game. Style: detailed anime-inspired pixel art, crisp visible pixel clusters and stepped contours, realistic human scale, restrained cool midnight atmosphere, no painterly blur. Output landscape 3:1 panorama. STRICT FLAT FRONT ORTHOGRAPHIC ELEVATION of the back wall, no isometric, no receding side walls or vanishing point. A perfectly horizontal walkable floor line spans the image at 82% height; bottom 18% is a flat dark cutaway floor foundation, not a perspective tiled floor. Furnishings attached to the back wall leave foreground walk lane clear. Complete room wall across full width, ceiling strip above. No people, monsters, blood, captions, UI, readable text, logos or watermark. Fully opaque image. Modern shared office restroom: pale cool gray rectangular wall tiles with thin navy horizontal stripe, left quarter has two rectangular mirrors over a double washbasin vanity, center has two white wall-mounted urinals with narrow privacy screens, right third has two closed navy stall doors with thin metal legs. Simple ceiling fluorescent housings OFF, dim cool ambient light, modest clean wear. Far left slim utility door. Fixtures and stall feet align consistently.
```

## 노후 화장실

파일: `restroom-old.png`, 바닥 기준선 약 y=578.

```text
Use case: stylized-concept. Create one finished wide reusable restroom background for ARCHI, a 2D side-scrolling Korean office mystery game. Style: detailed anime-inspired pixel art, crisp visible pixel clusters and stepped contours, realistic human scale, restrained cool midnight atmosphere, no painterly blur. Output landscape 3:1 panorama. STRICT FLAT FRONT ORTHOGRAPHIC ELEVATION of the back wall, no isometric, no receding side walls or vanishing point. A perfectly horizontal walkable floor line spans the image at 82% height; bottom 18% is a flat dark cutaway floor foundation, not a perspective tiled floor. Furnishings attached to the back wall leave foreground walk lane clear. Complete room wall across full width, ceiling strip above. No people, monsters, blood, captions, UI, readable text, logos or watermark. Fully opaque image. Older service-floor restroom: small desaturated sage square wall tiles with worn grout and localized water stains, exposed dull plumbing high on wall, left has old single sink and lightly cracked mirror, center has two shut muted brown toilet cubicles with chipped paint, right has a plain gray service door, a dark ventilation grille above. Uneasy abandoned office mood, no destruction or gore, readable subdued gray-green ambient lighting, all fixtures off.
```

## 고급층 화장실

파일: `restroom-executive.png`, 바닥 기준선 약 y=567.

```text
Use case: stylized-concept. Create one finished wide reusable restroom background for ARCHI, a 2D side-scrolling Korean office mystery game. Style: detailed anime-inspired pixel art, crisp visible pixel clusters and stepped contours, realistic human scale, restrained cool midnight atmosphere, no painterly blur. Output landscape 3:1 panorama. STRICT FLAT FRONT ORTHOGRAPHIC ELEVATION of the back wall, no isometric, no receding side walls or vanishing point. A perfectly horizontal walkable floor line spans the image at 82% height; bottom 18% is a flat dark cutaway floor foundation, not a perspective tiled floor. Furnishings attached to the back wall leave foreground walk lane clear. Complete room wall across full width, ceiling strip above. No people, monsters, blood, captions, UI, readable text, logos or watermark. Fully opaque image. Executive-floor restroom: charcoal stone wall panels with thin bronze trims, warm walnut accents, left has a long floating dark-stone vanity with two white basins and two round mirrors, center is clear textured stone wall with one wall-mounted paper dispenser, right has two full-height closed walnut cubicle doors with discreet brass pulls. Restrained elegant upscale atmosphere, soft dim warm mirror lights contrasting blue-gray shadows. No plants or foreground furniture.
```

