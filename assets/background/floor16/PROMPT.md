# 16층 배경 프롬프트 (초기 기획 기록)

- 상태: 2026-09-24 내장 image_gen으로 4종 생성 및 게임 연결 완료. 실제 생성 프롬프트·파일·바닥 정렬·문 좌표·소품 크기는 [GENERATED.md](GENERATED.md)를 참고한다. 아래는 생성 전 기획이며 크기와 좌표는 최종 규격과 다르다.
- 도구: 내장 `image_gen` 또는 동급 도구. use case는 `stylized-concept`.
- 스타일 참조: `../floor17/floor17.png`(복도), `../floor17/office-interior.png`(방 내부). 스타일, 재질, 조명만 참조하고 구도는 따라 그리지 않는다.
- 층 설정(기획.md): 16층은 기획에 따로 나오는 이야기 층이 아니며, 공통 층 구조(방 3개, 엘리베이터 3대, 계단)를 따른다. 게임에서는 경영지원팀 층으로 쓴다. 자정이고 건물 전체가 정전 상태라 이 층에는 전기가 들어오지 않는다. 조명은 모두 꺼져 있고, 창밖 도시 불빛과 초록 비상구 표시등, 작은 비상등만 밝다. 분위기는 추리 80%, 공포 20%이며 괴물이나 로봇, 사람은 그리지 않는다.
- 소품 규칙: 책상, 캐비닛, 자판기 같은 바닥 소품은 `assets/objects/floor-kit/` 스프라이트가 배경 위에 따로 그려진다. 배경에는 **바닥 가구를 그리지 않는다.** 벽, 창, 천장, 벽에 붙은 요소만 그린다. 가구를 그리면 소품이 두 번 보인다.

## 파일 목록 (생성 후 채울 것)

| 파일 | 장면 | 게임 폭 | 요청 캔버스 |
| --- | --- | --- | --- |
| `corridor.png` | 16층 복도 (`f16`) | 3700px | 3700x768 (불가 시 아래 분할안) |
| `office.png` | 경영지원팀 사무실 (`f16-office`) | 2400px | 2400x768 |
| `meeting.png` | 소회의실 (`f16-meeting`) | 2400px | 2400x768 |
| `pantry.png` | 탕비실 (`f16-pantry`) | 2400px | 2400x768 |

## 공통 정렬 계산

- 게임 충돌 바닥선은 `player.js`의 `floorY = 570`이다. 화면에 보이는 월드 높이는 720px이다.
- 요청 캔버스의 높이를 768로 잡으면 바닥선은 y=570(74.2%)이 된다. 이렇게 나오면 1 이미지 픽셀이 1 월드 픽셀이고 `left: 0; top: 0`에 그대로 놓으면 된다.
- 다른 크기로 나오면 원본 바닥선 y를 `srcFloor`, 원본 폭을 `srcW`, 게임 폭을 `W`라고 둔다. 이때 배율은 `s = W / srcW`, 표시 높이는 `srcH * s`, `top = 570 - srcFloor * s`다. 예를 들어 사무실 원본이 2172x724이고 `srcFloor = 504`라면 `s = 1.105`, 높이 800, `top = 13`이다. 기존 `office-interior.png`는 `top 0`, 높이 `724 * 570 / 504`로 맞췄다.
- 보간은 최근접(nearest)을 쓰고 CSS에는 `image-rendering: pixelated`를 준다.

## 게임 연결 계획 (이미지가 생긴 뒤)

1. `player.js`의 `FLOOR16_LAYOUT`과 `FLOOR16_ROOMS` 항목마다 `backgroundImage` 경로를 추가한다. `buildDynamicScene`에서 옥상의 `rooftopBackground`처럼 `<img>`를 `dynamicScene` 맨 앞에 넣는다.
2. 배경이 있는 장면에서는 `.floor-room`과 `.room-interior`의 CSS 그림을 숨긴다. `.floor-room-sign`(방 이름표)과 `.floor-number-sign`(16F 표지판)은 DOM 텍스트이므로 유지한다.
3. `.room-door`는 17층 `.office-door`처럼 배경은 투명하게, 가까이 갔을 때 외곽선만 보이게 바꾼다. 문 그림은 배경에 들어 있다. 판정 좌표는 바꾸지 않는다.
4. 엘리베이터(`elevator.png`)와 비상계단(`stairs.png`) 개폐 스프라이트는 기존처럼 배경 위에 겹쳐 그린다. 배경에서 그 자리는 겹칠 스프라이트보다 조금 넓은 벽면이나 문틀 정도만 둔다.

## 1. 복도 `corridor.png`

게임 좌표(월드 px, 문과 판정 위치는 `player.js` 기준):

| x 범위 | 내용 | 비고 |
| --- | --- | --- |
| 0..32 | 왼쪽 끝 벽 | 경계 충돌 |
| 64..900 | 경영지원팀 사무실 전면: 유리 파티션, 안쪽은 어두운 사무실 | 출입문 x=740..860, y=250..570 |
| 900..940 | 구조 기둥 | |
| 940..1700 | 소회의실 전면: 유리 파티션, 블라인드 반쯤 내림 | 출입문 x=1540..1660, y=250..570 |
| 1700..1740 | 구조 기둥 (분할 생성 시 이음매) | |
| 1740..2500 | 탕비실 전면: 불투명 벽에 작은 창 | 출입문 x=2340..2460, y=250..570 |
| 2500..2610 | 민무늬 벽 | DOM `16F` 표지판이 x=2510, y=150에 올라간다 |
| 2620..2820, 2880..3080, 3140..3340 | 엘리베이터 3대 자리 | 오버레이 y=220..570, 폭 200 |
| 3420..3600 | 비상계단 문 자리 | 오버레이 y=232..570, 폭 180 |
| 3668..3700 | 오른쪽 끝 벽 | 경계 충돌 |

각 방 전면 위 y=70..110에는 DOM 방 이름표가 붙는다. 그 자리는 글자 없는 벽면으로 비워 둔다.

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the actual environment artwork, NOT a concept poster or screenshot.
Reference image 1 is the existing 17th-floor corridor. Use it ONLY as the architectural, material, lighting and pixel-art style reference. Do not copy its layout.
Create ONE very wide 3700 x 768 PNG (if the tool cannot, the widest possible image with exactly the same proportions described below). Strict orthographic SIDE VIEW, camera exactly perpendicular to a long office corridor wall. NO vanishing point, NO isometric, NO perspective corridor going into the distance. Continuous horizontal elevation.
Setting: 16th floor of a Korean software-company tower at midnight during a total building power outage. This is the business-support / general-affairs floor, one level below the floor where the story starts. All ceiling lights are OFF. Only faint city glow through glass, one small green emergency exit pictogram light and a couple of dim teal emergency lamps. Restrained atmospheric pixel art, realistic adult scale, dark desaturated blue-gray / green-gray. Mystery 80 percent, horror 20 percent: quiet, abandoned, slightly uneasy. Human sprite on screen is about 162 pixels tall, door openings about 320 pixels tall; use this scale.
CRITICAL COLLISION GEOMETRY: the continuous, perfectly horizontal top edge of the walkable floor is at y=570 of this 768-high canvas, from extreme left to extreme right. All doorway bottoms are exactly on this y=570 line. The lower 198 pixels are ONLY a dark flat cutaway floor foundation with subtle horizontal slabs, no objects. No perspective floor, no diagonal floor, no elevation changes. Ceiling band y=0..60 with dark conduits and switched-off fluorescent fixtures; main wall architecture y=60..570.
Composition across width (pixel x of this 3700-wide canvas):
x=0..32: plain structural end wall.
x=64..900: glass partition front of a dark general-affairs office, metal mullions, a few switched-off desks and monitors dimly visible behind the glass, distant city through the office's far windows. One single glass swing door flush in this front at x=740..860, top y=250, bottom y=570, thin metal frame, small card reader beside it. Keep a plain unlettered wall strip above the front at y=70..110.
x=900..940: square concrete column.
x=940..1700: glass partition front of a small meeting room, horizontal blinds half lowered, dark table silhouette behind. One glass swing door at x=1540..1660, top y=250, bottom y=570. Plain unlettered strip above at y=70..110.
x=1700..1740: square concrete column.
x=1740..2500: solid painted wall of a staff pantry with one small high window showing a dim interior, one solid wood-tone door with a narrow vision panel at x=2340..2460, top y=250, bottom y=570. Plain unlettered strip above at y=70..110.
x=2500..2610: plain wall panel, completely empty (the game places a floor sign here).
x=2610..3350: elevator lobby wall. Three shallow recessed rectangular elevator bays with simple steel frames at x=2620..2820, x=2880..3080, x=3140..3340, each from y=220 to y=570. Inside each bay draw only a flat dark closed steel surface; the game overlays its own animated elevator doors exactly on these rectangles. Small unlit call button plates between bays.
x=3350..3420: wall with a small evacuation-plan board (tiny unreadable shapes only).
x=3420..3600: plain flat recess for the stairwell fire door from y=232 to y=570, flat dark surface only; the game overlays its own door here. A small green running-man exit pictogram light above it, no letters.
x=3600..3700: plain wall and structural end.
The city is only visible THROUGH glass. Keep facade planes straight and parallel. Consistent pixel grid, precise hard-edged pixel art, subtle wear, readable dark midtones. No people, no monsters, no robots, no foreground furniture, no crates, nothing obstructing the walk lane in front of the wall, no UI, no border, no watermark, no captions, no readable lettering or numbers anywhere. Opaque PNG. Output only the finished background.
```

분할안: 도구가 3:1보다 넓은 이미지를 못 만들면, 같은 프롬프트로 x=0..1720(1720x768)과 x=1720..3700(1980x768)을 따로 생성한다. 두 번째 이미지는 x 좌표에서 1720을 빼서 쓴다. 두 번째를 만들 때는 첫 번째 이미지를 참조로 넣어 이음매 기둥(x=1700..1740)의 색과 재질을 맞춘다. 이음매가 민무늬 기둥 가운데에 오게 한다.

## 2. 경영지원팀 사무실 `office.png`

소품 스프라이트 위치(배경 뒤 벽은 이 자리를 단순하게 둔다): 문서 캐비닛 x=260..550(높이 280), 책상 4개 x=570..2020(높이 170), 복합기 x=2040..2180, 화분 x=2225..2355. 출구 문 x=68..212, y=250..570.

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. Create ONE wide office INTERIOR background, 2400x768 PNG.
Reference image 1 is the existing 17th-floor office interior. Use it ONLY as the architectural, material, lighting and pixel-art style reference. This is a DIFFERENT room: the general-affairs / finance office on the 16th floor, seen from inside after entering from the corridor. Unobstructed cutaway view into the room, no corridor-facing glass wall in front of the camera.
Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point. Detailed restrained pixel art, crisp hard pixel clusters, muted gray and green-gray, midnight during a total power outage: every ceiling light and screen is OFF. Light comes only from the cool city glow through the rear windows and one faint green emergency lamp. Quiet, abandoned, mystery 80 percent horror 20 percent.
IMPORTANT: this background contains ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw desks, chairs, cabinets, copiers, plants or any floor-standing furniture. The game places those as separate sprites in front of the rear wall.
Layout (pixel x): x=68..212 a closed glass exit door in the rear wall, top y=250, bottom y=570, metal frame and small card reader. x=260..2380 a long band of tall rear windows from y=90 to y=400 showing a distant Korean city at midnight, vertical mullions about every 240px, blinds partly lowered on some panes. Below the windows a plain low wall and baseboard down to the floor, kept simple because furniture sprites stand there. Wall-mounted above x=1300..1500: a round wall clock. Near x=2200: a small switched-off wall thermostat panel. Ceiling band y=0..60 with long switched-off fluorescent fixtures and a cable tray.
Geometry: the walkable floor top is one perfectly straight horizontal line at y=570 of the 768-high canvas, full width. Door bottom aligns to it. Bottom 198 pixels are a dark building foundation cutaway with subtle horizontal slabs. Door about 320px high; human height about 162px. Room spans edge to edge; no decorative frame.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```

## 3. 소회의실 `meeting.png`

소품 스프라이트 위치: 화분 x=255..385, 화이트보드 x=450..710, 회의 테이블 x=920..1320(윗면 y≈374), 소파 x=1570..1870, 화분 x=1935..2065, 냉온수기 x=2198..2303. 출구 문 x=68..212.

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. Create ONE wide room INTERIOR background, 2400x768 PNG.
Reference image 1 is the existing 17th-floor office interior. Use it ONLY as the architectural, material, lighting and pixel-art style reference. This is a DIFFERENT room: a small corporate meeting room on the 16th floor.
Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point. Detailed restrained pixel art, crisp hard pixel clusters, muted blue-gray with slightly warmer wood-tone wall paneling. Midnight during a total power outage: all lights and screens OFF, light only from city glow and one faint green emergency lamp. Quiet and slightly uneasy, mystery 80 percent horror 20 percent.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw tables, chairs, sofas, whiteboards on stands, plants or water coolers; the game places those as separate sprites.
Layout (pixel x): x=68..212 closed glass exit door, top y=250, bottom y=570, metal frame. x=260..900 acoustic wood-slat wall panels. x=950..1290 a large wall-mounted presentation display, switched off, black glass with a faint reflection, from y=170 to y=330. x=1400..2380 tall windows from y=90 to y=400 with horizontal blinds half lowered, city lights visible through the gaps. A ceiling projector mount and switched-off recessed downlights in the ceiling band y=0..60.
Geometry: walkable floor top is one perfectly straight horizontal line at y=570 of the 768-high canvas, full width. Bottom 198 pixels dark foundation cutaway. Door about 320px high; human height about 162px. Room spans edge to edge.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```

## 4. 탕비실 `pantry.png`

소품 스프라이트 위치: 냉온수기 x=278..383, 싱크대 x=440..800(윗면 y≈394), 자판기 2대 x=870..1250(높이 360), 사물함 x=1385..1615, 소파 x=1800..2100, 화분 x=2205..2335. 출구 문 x=68..212.

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. Create ONE wide room INTERIOR background, 2400x768 PNG.
Reference image 1 is the existing 17th-floor office interior. Use it ONLY as the architectural, material, lighting and pixel-art style reference. This is a DIFFERENT room: an employee pantry / break lounge on the 16th floor.
Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point. Detailed restrained pixel art, crisp hard pixel clusters, muted green-gray tiles and gray walls. Midnight during a total power outage: all lights OFF, appliance indicator lights OFF. Light only from one small window's city glow and one faint green emergency lamp. Empty and eerie, mystery 80 percent horror 20 percent.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw counters, sinks, vending machines, lockers, sofas, plants or water coolers; the game places those as separate sprites.
Layout (pixel x): x=68..212 closed solid door with a narrow vision panel, top y=250, bottom y=570. x=420..820 wall-mounted upper kitchen cabinets from y=230 to y=350 and a green-gray tiled backsplash from y=350 down to y=470. x=860..1260 plain wall, slightly lighter rectangle wear marks where tall machines stand. x=1380..1620 plain wall. x=1700..2200 one medium window from y=120 to y=360 with city lights, a small unlettered corkboard with blank paper notes beside it at x=2230..2350, y=200..300. Ceiling band y=0..60 with switched-off panel lights and a small ventilation grille.
Geometry: walkable floor top is one perfectly straight horizontal line at y=570 of the 768-high canvas, full width. Bottom 198 pixels dark foundation cutaway. Door about 320px high; human height about 162px. Room spans edge to edge.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```
