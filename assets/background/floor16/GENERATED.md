# 16층 생성 배경과 실제 적용 규격

- 제작: 내장 image_gen, 2026-09-24. 17층 복도·사무실을 스타일 참조로 사용.
- 출력은 모두 **2172×724 PNG**. 원본을 재가공하지 않고 CSS 크기/위치로 정렬한다.
- 실내 배경에는 바닥 가구가 없고 floor-kit 소품 21개를 별도 배치한다.

| 파일 | 장면 | 월드 폭 | 표시 높이 | top | 원본 바닥 y |
| --- | --- | ---: | ---: | ---: | ---: |
| [corridor.png](corridor.png) | 복도 | 3700 | 796.4 | 39.8 | 482 |
| [office.png](office.png) | 사무실 | 2400 | 521.28 | 207.12 | 504 |
| [meeting.png](meeting.png) | 소회의실 | 2400 | 521.28 | 207.12 | 504 |
| [pantry.png](pantry.png) | 탕비실 | 2400 | 521.28 | 207.12 | 504 |

> 2026-09-24 이후: 모든 층이 17층 건물 코어(폭 5000px, 엘리베이터 x=1818/2148/2444, 계단 x=2906)를 공유하도록 바뀌어 `corridor.png`(3700px 배치 기준)는 게임에서 쓰지 않는다. 16층 복도는 CSS 임시 배경이며, 새 좌표로 복도 그림을 다시 생성해야 한다. 방 내부 3장(office/meeting/pantry)은 그대로 쓴다. 아래 복도 좌표는 예전 기록이다.

## 연결

바닥 정렬: `top + sourceFloor × 표시높이 / 724 = 570`. 복도 세로 배율 1.1, 실내 0.72. 가로는 월드 폭에 맞춘다. `player.js`의 `backgroundImage`를 `buildDynamicScene`에서 먼저 그리고 CSS 임시 벽·바닥 그림을 감춘다. 물리 충돌과 DOM 표지판은 유지한다.

실제 그림에 맞춘 복도 문 x/폭은 사무실 792/153, 회의실 1623/152, 탕비실 2305/150. y=360, 높이210. 실내 출구는 x=68, 폭144, y=360. 엘리베이터는 x=2622/2855/3088, 폭186, y=350, 높이220. 계단은 x=3393, 폭148, y=355, 높이215. 개폐 오버레이와 접근 외곽선을 이 좌표에 정렬했다.

최근접 픽셀 렌더링과 소품 밝기0.68·채도0.8을 적용한다. 15층의 별도 배치·소품 크기는 이번 16층 보정 대상에서 제외했다.

## 현실 크기

플레이어 162px를 175cm로 가정. 캔버스가 아닌 알파>8인 실제 그림 높이로 계산했다. 소품은 종횡비를 유지하고 하단8px 패딩을 제외한 앵커를 y=570에 고정한다.

| 소품 | 표시 폭 | 실제 그림 높이 | 현실 기준 |
| --- | ---: | ---: | --- |
| 캐비닛 | 72 | 139.5 | 약151cm |
| 책상+모니터 | 252 | 117.6 | 상판 약75cm / 전체127cm |
| 복합기 | 110 | 103.1 | 약111cm |
| 화분 | 78 | 141.7 | 약153cm |
| 화이트보드 | 350 | 164.1 | 약177cm |
| 회의 테이블 | 356 | 69.5 | 약75cm |
| 소파 | 250 | 79.1 | 등받이 약85cm |
| 냉온수기 | 62 | 120.1 | 약130cm |
| 싱크대+수전/전자레인지 | 312 | 123.1 | 상판 약85cm / 전체133cm |
| 자판기 | 96 | 175.5 | 약190cm |
| 사물함 | 130 | 169.6 | 약183cm |

`node tests/elevator.mjs`에서 배경 로드·바닥 정렬·21개 소품 크기·문 출입·조사·원래 출입문 복귀를 검사한다.

## 실제 생성 프롬프트

사용자가 정리한 요청에서 문 높이·좌표를 플레이어 비율에 맞춰 수정했다. 아래 값은 생성 요청이며, 결과에 맞춘 실제 배치는 위 표와 player.js가 기준이다.

### corridor.png

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the actual environment artwork, NOT a concept poster or screenshot.
Reference image 1 is the existing 17th-floor corridor. Use it ONLY as the architectural, material, lighting and pixel-art style reference. Do not copy its layout.
Create ONE very wide 3700 x 768 PNG (if the tool cannot, the widest possible image with exactly the same proportions described below). Strict orthographic SIDE VIEW, camera exactly perpendicular to a long office corridor wall. NO vanishing point, NO isometric, NO perspective corridor going into the distance. Continuous horizontal elevation.
Setting: 16th floor of a Korean software-company tower at midnight during a total building power outage. This is the business-support / general-affairs floor, one level below the floor where the story starts. All ceiling lights are OFF. Only faint city glow through glass, one small green emergency exit pictogram light and a couple of dim teal emergency lamps. Restrained atmospheric pixel art, realistic adult scale, dark desaturated blue-gray / green-gray. Mystery 80 percent, horror 20 percent: quiet, abandoned, slightly uneasy. Human sprite on screen is about 162 pixels tall, door openings about 210 pixels tall; use this scale.
CRITICAL COLLISION GEOMETRY: the continuous, perfectly horizontal top edge of the walkable floor is at y=570 of this 768-high canvas, from extreme left to extreme right. All doorway bottoms are exactly on this y=570 line. The lower 198 pixels are ONLY a dark flat cutaway floor foundation with subtle horizontal slabs, no objects. No perspective floor, no diagonal floor, no elevation changes. Ceiling band y=0..60 with dark conduits and switched-off fluorescent fixtures; main wall architecture y=60..570.
Composition across width (pixel x of this 3700-wide canvas):
x=0..32: plain structural end wall.
x=64..900: glass partition front of a dark general-affairs office, metal mullions, a few switched-off desks and monitors dimly visible behind the glass, distant city through the office's far windows. One single glass swing door flush in this front at x=755..845, top y=360, bottom y=570, thin metal frame, small card reader beside it. Keep a plain unlettered wall strip above the front at y=70..110.
x=900..940: square concrete column.
x=940..1700: glass partition front of a small meeting room, horizontal blinds half lowered, dark table silhouette behind. One glass swing door at x=1555..1645, top y=360, bottom y=570. Plain unlettered strip above at y=70..110.
x=1700..1740: square concrete column.
x=1740..2500: solid painted wall of a staff pantry with one small high window showing a dim interior, one solid wood-tone door with a narrow vision panel at x=2355..2445, top y=360, bottom y=570. Plain unlettered strip above at y=70..110.
x=2500..2610: plain wall panel, completely empty (the game places a floor sign here).
x=2610..3350: elevator lobby wall. Three shallow recessed rectangular elevator bays with simple steel frames at x=2650..2790, x=2910..3050, x=3170..3310, each from y=340 to y=570. Inside each bay draw only a flat dark closed steel surface; the game overlays its own animated elevator doors exactly on these rectangles. Small unlit call button plates between bays.
x=3350..3420: wall with a small evacuation-plan board (tiny unreadable shapes only).
x=3460..3560: plain flat recess for the stairwell fire door from y=355 to y=570, flat dark surface only; the game overlays its own door here. A small green running-man exit pictogram light above it, no letters.
x=3600..3700: plain wall and structural end.
The city is only visible THROUGH glass. Keep facade planes straight and parallel. Consistent pixel grid, precise hard-edged pixel art, subtle wear, readable dark midtones. No people, no monsters, no robots, no foreground furniture, no crates, nothing obstructing the walk lane in front of the wall, no UI, no border, no watermark, no captions, no readable lettering or numbers anywhere. Opaque PNG. Output only the finished background.

Scale correction requested by user: adult height 162px represents 1.75m. Room doors 210px high by 90px wide. Avoid oversized architecture. Preserve the specified full canvas and exact baseline; do not crop. Leave ceiling space dark. Furniture will be added separately at realistic human scale.
```

### office.png

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. Create ONE wide office INTERIOR background, 2400x768 PNG.
Reference image 1 is the existing 17th-floor office interior. Use it ONLY as the architectural, material, lighting and pixel-art style reference. This is a DIFFERENT room: the general-affairs / finance office on the 16th floor, seen from inside after entering from the corridor. Unobstructed cutaway view into the room, no corridor-facing glass wall in front of the camera.
Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point. Detailed restrained pixel art, crisp hard pixel clusters, muted gray and green-gray, midnight during a total power outage: every ceiling light and screen is OFF. Light comes only from the cool city glow through the rear windows and one faint green emergency lamp. Quiet, abandoned, mystery 80 percent horror 20 percent.
IMPORTANT: this background contains ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw desks, chairs, cabinets, copiers, plants or any floor-standing furniture. The game places those as separate sprites in front of the rear wall.
Layout (pixel x): x=95..185 a closed glass exit door in the rear wall, top y=360, bottom y=570, metal frame and small card reader. x=260..2380 a long band of tall rear windows from y=90 to y=400 showing a distant Korean city at midnight, vertical mullions about every 240px, blinds partly lowered on some panes. Below the windows a plain low wall and baseboard down to the floor, kept simple because furniture sprites stand there. Wall-mounted above x=1300..1500: a round wall clock. Near x=2200: a small switched-off wall thermostat panel. Ceiling band y=0..60 with long switched-off fluorescent fixtures and a cable tray.
Geometry: the walkable floor top is one perfectly straight horizontal line at y=570 of the 768-high canvas, full width. Door bottom aligns to it. Bottom 198 pixels are a dark building foundation cutaway with subtle horizontal slabs. Door about 210px high; human height about 162px. Room spans edge to edge; no decorative frame.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.

Scale correction requested by user: adult height 162px represents 1.75m. Room doors 210px high by 90px wide. Avoid oversized architecture. Preserve the specified full canvas and exact baseline; do not crop. Leave ceiling space dark. Furniture will be added separately at realistic human scale.
```

### meeting.png

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. Create ONE wide room INTERIOR background, 2400x768 PNG.
Reference image 1 is the existing 17th-floor office interior. Use it ONLY as the architectural, material, lighting and pixel-art style reference. This is a DIFFERENT room: a small corporate meeting room on the 16th floor.
Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point. Detailed restrained pixel art, crisp hard pixel clusters, muted blue-gray with slightly warmer wood-tone wall paneling. Midnight during a total power outage: all lights and screens OFF, light only from city glow and one faint green emergency lamp. Quiet and slightly uneasy, mystery 80 percent horror 20 percent.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw tables, chairs, sofas, whiteboards on stands, plants or water coolers; the game places those as separate sprites.
Layout (pixel x): x=95..185 closed glass exit door, top y=360, bottom y=570, metal frame. x=260..900 acoustic wood-slat wall panels. x=950..1290 a large wall-mounted presentation display, switched off, black glass with a faint reflection, from y=170 to y=330. x=1400..2380 tall windows from y=90 to y=400 with horizontal blinds half lowered, city lights visible through the gaps. A ceiling projector mount and switched-off recessed downlights in the ceiling band y=0..60.
Geometry: walkable floor top is one perfectly straight horizontal line at y=570 of the 768-high canvas, full width. Bottom 198 pixels dark foundation cutaway. Door about 210px high; human height about 162px. Room spans edge to edge.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.

Scale correction requested by user: adult height 162px represents 1.75m. Room doors 210px high by 90px wide. Avoid oversized architecture. Preserve the specified full canvas and exact baseline; do not crop. Leave ceiling space dark. Furniture will be added separately at realistic human scale.
```

### pantry.png

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. Create ONE wide room INTERIOR background, 2400x768 PNG.
Reference image 1 is the existing 17th-floor office interior. Use it ONLY as the architectural, material, lighting and pixel-art style reference. This is a DIFFERENT room: an employee pantry / break lounge on the 16th floor.
Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point. Detailed restrained pixel art, crisp hard pixel clusters, muted green-gray tiles and gray walls. Midnight during a total power outage: all lights OFF, appliance indicator lights OFF. Light only from one small window's city glow and one faint green emergency lamp. Empty and eerie, mystery 80 percent horror 20 percent.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw counters, sinks, vending machines, lockers, sofas, plants or water coolers; the game places those as separate sprites.
Layout (pixel x): x=95..185 closed solid door with a narrow vision panel, top y=360, bottom y=570. x=420..820 wall-mounted upper kitchen cabinets from y=230 to y=350 and a green-gray tiled backsplash from y=350 down to y=470. x=860..1260 plain wall, slightly lighter rectangle wear marks where tall machines stand. x=1380..1620 plain wall. x=1700..2200 one medium window from y=120 to y=360 with city lights, a small unlettered corkboard with blank paper notes beside it at x=2230..2350, y=200..300. Ceiling band y=0..60 with switched-off panel lights and a small ventilation grille.
Geometry: walkable floor top is one perfectly straight horizontal line at y=570 of the 768-high canvas, full width. Bottom 198 pixels dark foundation cutaway. Door about 210px high; human height about 162px. Room spans edge to edge.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.

Scale correction requested by user: adult height 162px represents 1.75m. Room doors 210px high by 90px wide. Avoid oversized architecture. Preserve the specified full canvas and exact baseline; do not crop. Leave ceiling space dark. Furniture will be added separately at realistic human scale.
```

