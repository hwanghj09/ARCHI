# 7층 배경 프롬프트 (생성 전 기획, 2026-09-28 전면 재작성)

- 상태: 이전 버전은 단일 "검증실"만 다루는 프롬프트였는데, 지금 `js/floors/floor-07.js`의
  `FLOOR7_LAYOUT`/`FLOOR7_ROOMS`는 라운지+VIP Room+AI 테스트실+검증실 네 구역으로 늘어났고
  로비 테마도 `vip`(검은 대리석 + 샴페인 금장, index.html CSS)로 확정됐다. 아래는 그 최신 구조에 맞춘
  전체 재작성이다. 12층 방식(복도 여러 조각 + 방 내부 별도 조각, `GENERATED.md`에 실측 기록)을 그대로 따른다.
- 도구: 내장 `image_gen` 또는 동급 도구. use case는 `stylized-concept`.
- 층 설정(기획.md): 7층은 손님용 라운지/VIP Room(외부 데이터센터 이관 떡밥)과, 벽 너머의 AI 테스트실·
  검증실(원본 로그 백업, 인터록으로 등 뒤에서 잠기는 방)이다. 게임에서 처음 보는 상태는 정전이다. 조명·
  모니터·CCTV는 꺼져 있고 빛은 창밖 도시 불빛, 초록 비상구 표시등, 검증실의 붉은 인터록 경고등뿐이다.
  추리 80%, 공포 20%. 사람, 로봇, 괴물은 그리지 않는다.
- 게임 쪽 배치 기준: `js/core/config.js`의 `BUILDING_CORE`(엘리베이터 3대, 비상계단, 화장실 좌표는 모든
  층 공통), `js/floors/floor-07.js`의 `FLOOR7_LAYOUT`, `FLOOR7_ROOMS`. index.html CSS `[data-theme="vip"]`가
  지금의 임시 그림이며 아래 좌표가 그 판정 좌표와 같다.

## 공통 규칙

- **조각 나누기**: 12층 결과를 보면 도구는 2.5~3:1을 넘는 요청을 임의로 잘라낸다. 그래서 모든 조각을
  2.5:1 이하로 나누고, 이음매는 반드시 **민무늬 벽면(기둥/여백)** 에 둔다. 두 번째 조각부터는 앞 조각
  결과를 참조 이미지 2로 넣어 이음매 쪽 색과 재질을 맞춘다.
- **바닥선**: 캔버스 높이 720 기준 y=570(위에서 79.17%)이 수평 보행선이다. 그 아래는 평평한 건물 단면이다.
- **소품은 그리지 않는다**: 소파, 화분, 진열장, 서버 랙, 벤치, UPS 등은 `assets/objects/floor-kit/` 스프라이트가
  배경 위에 따로 그려진다. 배경에는 벽, 창, 천장, 벽에 붙은 것만 그린다.
- **텍스트가 있는 표지판은 빈 벽으로 남긴다**: `VIP LOUNGE 표지`, `출입 통제 안내판`, 층 표지판, 엘리베이터
  층 표시는 실제 문구(`lines`)를 DOM이 그리므로, 배경에는 글자 없는 벽감(niche)만 그린다. 반대로
  **라운지 창**(도시 야경)은 문구가 없는 순수 풍경이라 배경에 직접 그린다.
- **게임이 겹쳐 그리는 자리**: 엘리베이터 3대와 비상계단 문은 17층 개폐 스프라이트가 겹쳐 그려지고, 화장실
  문은 CSS 금속문이 남는다. 방문(VIP Room/AI 테스트실/검증실)은 배경에 완성된 모습으로 그린다(닫힌 채로).
- **문 크기**: 복도 코어 문은 17층 기준 320px 안팎이다. VIP Room 문(150px)·테스트실 문(110px)·검증실 문
  (104px)은 그보다 작은 안내/보안문이므로 프롬프트에 그대로 반영한다. 방 안 출구는 복도 문과 같은 크기다.
- **스타일 참조**: 복도는 `../floor17/floor17.png`, 실내는 `../floor17/office-interior-aligned.png`. 스타일,
  재질, 조명만 참조하고 구도는 따라 그리지 않는다.
- **7층만의 색**: 검은 대리석(charcoal-black stone) 바닥과 벽, 샴페인 금장(warm champagne-gold) 트림.
  12층의 냉한 흑연색, 1층의 밝은 트래버틴+황동과 다르게 보여야 한다. 라운지 쪽은 금장을 넉넉히 쓰고,
  테스트실·검증실 쪽은 대리석 대신 차가운 회색 실험실 마감으로 바뀐다(같은 층이지만 손님 구역과
  통제구역의 재질 대비를 분명히 준다).

## 파일 목록

| 파일 | 장면 | 월드 x 범위 | 요청 캔버스 | 비율 |
| --- | --- | --- | --- | --- |
| `corridor-a.png` | 복도 A: VIP Room 전면, 라운지 창, VIP LOUNGE 표지 벽감 | 0..1818 | 1818×720 | 2.53:1 |
| `corridor-b.png` | 복도 B: 엘리베이터 3대, 비상계단 | 1818..3086 | 1268×720 | 1.76:1 |
| `corridor-c.png` | 복도 C: 출입 통제 안내판 벽감, 화장실 전면 | 3086..4282 | 1196×720 | 1.66:1 |
| `corridor-d.png` | 복도 D: AI 테스트실 전면, 검증실 전면 | 4282..5000 | 718×720 | 1:1 |
| `vip-1.png` | VIP Room 왼쪽(출구+시연 테이블 벽) | 0..1750 | 1750×720 | 2.43:1 |
| `vip-2.png` | VIP Room 오른쪽(방명록+진열장 벽) | 1750..3072 | 1322×720 | 1.84:1 |
| `test-1.png` | AI 테스트실 왼쪽(출구 포함) | 0..1150 | 1150×720 | 1.6:1 |
| `test-2.png` | AI 테스트실 오른쪽 | 1150..2304 | 1154×720 | 1.6:1 |
| `verify.png` | 검증실(출구+인터록 제어반 벽) | 0..1856 | 1856×720 | 2.58:1 |

생성 순서는 corridor-a → corridor-b → corridor-c → corridor-d → vip-1 → vip-2 → test-1 → test-2 → verify를
권한다. 복도 조각끼리, VIP/테스트실 조각끼리는 앞 결과를 참조 2로 넣는다.

## 게임 연결 계획 (이미지가 생긴 뒤)

1. **측정**: 각 결과의 크기, 바닥선 y, 칠해진 문 사각형, 이음매 x를 잰다.
2. **이음매 자르기**: 조각의 왼쪽 끝이 월드 이음매(1818, 3086, 4282 / VIP 1750 / 테스트실 1150)에 오게 자른다.
3. **배율과 정렬**: `s = W / cw`(W=조각의 월드 폭, cw=크롭 폭), `top = 570 - srcFloor × s`. 가로세로 같은 배율.
4. **엔진**: `buildDynamicScene`의 `backgroundImage`를 `{ src, left, width, height, top }` 배열로 받게 하고
   조각마다 `left`를 준다(12층과 동일한 확장).
5. **문 좌표**: 칠해진 문이 `FLOOR7_LAYOUT`/`FLOOR7_ROOMS` 사각형과 몇 px 이상 다르면 그림에 맞춰
   `doorX/doorWidth/doorY`(복도)와 각 방의 출구 좌표를 조정한다.
6. **CSS**: art 모드 규칙에서 `VIP LOUNGE 표지`, `출입 통제 안내판`, 층 표지판, 엘리베이터 층 표시 DOM은
   유지하고, `.floor-room.vip-suite`/`.floor-room.testlab`/`.floor-room.chamber`의 CSS 벽 그림만 숨긴다.
7. **테스트**: `checkFloor7`를 만들어 이미지 로드, `data-art`, CSS 벽 숨김, 바닥선 정렬을 조각마다 검사한다.
8. **기록**: `GENERATED.md`에 원본 경로, 크롭 영역, 배율, top, 실제 문 좌표, 최종 프롬프트를 적는다.

## 1. 복도 A `corridor-a.png` (월드 x=0..1818)

VIP Room 문 x=360..510(y=220~570, 150px, 복도 문 치고 낮음 — vip 이중문). 라운지 창 x=700..1340(y=120..350).
VIP LOUNGE 표지 벽감 x=1440..1680(y=170..234, 글자 없음, DOM이 "VIP LOUNGE" 문구를 그린다).

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the actual environment artwork, NOT a concept poster. It is the LEFT piece of a long corridor assembled from four pieces.
Reference image 1 is the existing 17th-floor corridor. Use it ONLY as the architectural, material, lighting and pixel-art style reference. Do not copy its layout.
Create ONE landscape PNG, 1818 x 720 (ratio 2.53:1). Strict orthographic SIDE VIEW, camera exactly perpendicular to the corridor wall. NO vanishing point, NO isometric, NO perspective.
CRITICAL FULL BLEED: the previous attempt at this same prompt had solid WHITE letterbox bars along the top and bottom of the canvas (the artwork was squeezed into the middle, not filling the full 720px height). That was wrong. The scene must fill the ENTIRE canvas edge to edge — the ceiling band starts at the very top pixel row (y=0), and the dark floor foundation reaches the very bottom pixel row (y=720). No white space, no padding, no letterboxing, no border of any color anywhere in the image.
Setting: the 7th floor guest LOUNGE of a Korean software-company tower, a VIP reception area, midnight during a total power outage. All ceiling lights and screens are OFF. Light comes only from faint city glow through a window and one small warm amber accent light. Restrained atmospheric anime-inspired pixel art, crisp hard-edged pixel clusters, realistic adult scale. Palette: dark polished black stone floor and wall panels with warm champagne-gold trim lines and frames — noticeably more luxurious and warmer than a plain office floor, but still dim and abandoned. Mystery 80 percent, horror 20 percent: an expensive room nobody is in right now. Human sprite on screen is about 162 pixels tall; doors on this wall read at that scale.
CRITICAL COLLISION GEOMETRY: the continuous, perfectly horizontal top edge of the walkable floor is at y=570 of this 720-high canvas (79.17 percent from the top), from extreme left to extreme right. All door bottoms sit exactly on this line. Below it is a dark flat cutaway floor foundation with subtle horizontal slabs. Ceiling band y=0..60, dark with thin gold accent strip lighting (all switched off, just cold metal now).
Composition across width (pixel x of this 1818-wide canvas):
x=0..32: plain structural end wall.
x=32..360: black stone wall with thin vertical champagne-gold pilaster strips every ~150px.
x=360..510: ONE closed VIP double glass door, top y=220, bottom y=570, slim champagne-gold frame, vertical center seam, frosted dark glass, small unlit reader panel beside it.
x=510..700: plain black stone wall with gold pilaster strips.
x=700..1340: a large panoramic lounge window from y=120 to y=350, dark champagne-gold mullions, showing a distant low-detail night skyline through the glass — a few sparse warm lights, nothing detailed; below the window a plain black stone wall down to the floor (kept plain, a sofa sprite stands there).
x=1340..1440: plain wall.
x=1440..1680: a shallow blank wall niche/plaque frame with a thin gold border, completely empty inside (the game draws "VIP LOUNGE" lettering here — leave it blank).
x=1680..1790: plain black stone wall with gold pilaster strips (a display cabinet sprite stands here — keep the lower wall plain).
x=1790..1818: plain wall (the seam to the next piece — keep it completely blank).
No people, no monsters, no robots, no floor-standing furniture, nothing in the walk lane, no UI, no border, no watermark, no captions, no logos, no readable letters or numbers anywhere. Opaque PNG. Output only the finished background.
```

## 2. 복도 B `corridor-b.png` (월드 x=1818..3086, 엘리베이터+비상계단)

캔버스 x = 월드 x − 1818. 이 조각은 12층/1층과 같은 `BUILDING_CORE` 구조물이라 배치는 동일하고, 재질만
7층의 검은 대리석+샴페인 금장으로 바뀐다.

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the MIDDLE piece of a long corridor assembled from four pieces.
Reference image 1 is the existing 17th-floor corridor: elevator lobby style reference only. Reference image 2 is the previous piece of this same corridor: match its black-stone-and-champagne-gold palette and ceiling band exactly.
Create ONE landscape PNG, 1268 x 720 (ratio about 1.76:1). Strict orthographic SIDE VIEW, camera perpendicular to the wall, NO vanishing point, NO isometric, NO perspective.
Setting: 7th floor of a Korean software-company tower, midnight, total power outage, all lights OFF. Dark polished black stone with warm champagne-gold trim, restrained anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent. Human sprite about 162 pixels tall.
CRITICAL COLLISION GEOMETRY: perfectly horizontal walkable floor top at y=570 of 720 (79.17 percent), full width, dark flat cutaway foundation below. Ceiling band y=0..60 matching reference image 2.
Composition across width (pixel x of this 1268-wide canvas):
x=0..18: plain wall (seam from the previous piece, blank).
x=18..236, x=348..562, x=644..860: THREE shallow recessed elevator bays, each from y=220 to y=570, with champagne-gold brushed-metal frames about 8 px outside these rectangles. Inside each bay draw only a flat dark closed steel surface; the game overlays its own animated elevator doors exactly here. A plain dark strip at y=180..212 above each bay (the game draws a floor indicator there). Small gold call-button plates between the bays at about x=292 and x=603, y=370..410.
x=860..1088: plain black stone wall with a gold pilaster strip.
x=1088..1268: a flat recess for the stairwell fire door from y=232 to y=570, flat dark surface only (the game overlays its own door), a small green running-man exit pictogram light above it at about y=196..220, ending with a sliver of plain wall.
All three elevator bays must be the exact same width and height as each other. No people, no robots, nothing in the walk lane, no UI, no border, no watermark, no captions, no logos, no readable letters except the running-man pictogram. Opaque PNG. Output only the finished background.
```

## 3. 복도 C `corridor-c.png` (월드 x=3086..4282)

캔버스 x = 월드 x − 3086. 출입 통제 안내판 벽감 x=3180..3410(y=250..380, 글자 없음). 화장실 문 x=3612..3757
(y=210..570, 12층/1층과 같은 재질의 금속문 — 화장실은 층 테마와 무관하게 항상 같은 타일).

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the third piece of a long corridor assembled from four pieces.
Reference image 1 is the existing 17th-floor corridor extension: material and lighting reference only. Reference image 2 is the previous piece of this same corridor: match its black-stone-and-champagne-gold palette and ceiling band exactly.
Create ONE landscape PNG, 1196 x 720 (ratio about 1.66:1). Strict orthographic SIDE VIEW, camera perpendicular to the wall, NO vanishing point, NO isometric, NO perspective.
Setting: 7th floor, midnight, total power outage, all lights OFF. Dark polished black stone with warm champagne-gold trim, restrained anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent. Human sprite about 162 pixels tall.
CRITICAL COLLISION GEOMETRY: perfectly horizontal walkable floor top at y=570 of 720 (79.17 percent), full width, dark flat cutaway foundation below. Ceiling band y=0..60 matching reference image 2.
Composition across width (pixel x of this 1196-wide canvas):
x=0..10: seam from the previous piece, blank.
x=10..94: a shallow blank wall niche with a thin dark-red border, completely empty inside (the game draws a "관계자 외 출입 금지" restricted-access sign here — leave it blank of text, just the frame and a faint warning stripe).
x=94..470: plain black stone wall, gold pilaster strips.
x=470..1196: a restroom front, clean pale gray-green rectangular tiles from y=118 to the floor (same universal restroom material used on every floor, independent of this floor's gold theme).
x=526..671: ONE plain flat dark metal recess from y=210 to y=570 (the game overlays its own restroom door here), small male/female pictograms on the wall above it, no letters.
No people, no robots, nothing in the walk lane, no UI, no border, no watermark, no captions, no logos, no readable letters or numbers except the restroom pictograms. Opaque PNG. Output only the finished background.
```

## 4. 복도 D `corridor-d.png` (월드 x=4282..5000)

캔버스 x = 월드 x − 4282. AI 테스트실 문 x=4420..4530(y=?, 복도 전면 y=118~570, 문 자체는 랩 슬라이드
문이라 y=250 정도), 검증실 문 x=4760..4864(airlock, y=290 정도, 다른 방보다 높게 잠기는 인터록 문).

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the RIGHT piece of a long corridor assembled from four pieces.
Reference image 1 is the existing 17th-floor corridor: material reference only. Reference image 2 is the previous piece of this same corridor: match its ceiling band and wall material at the seam exactly.
Create ONE landscape PNG, 718 x 720 (ratio about 1:1). Strict orthographic SIDE VIEW, camera perpendicular to the wall, NO vanishing point, NO isometric, NO perspective.
CRITICAL CANVAS SHAPE: the previous attempt at this same prompt was rendered as 1485x1059 (ratio 1.4:1) — noticeably WIDER than square. That was wrong. The output MUST be very close to a perfect SQUARE (718 wide, 720 tall). If the two doors and wall segments below don't fit comfortably at that width, compress the plain wall margins, NOT the canvas shape — do not widen the canvas to make room.
Setting: 7th floor, the restricted AI test/verification wing behind the gold lounge, midnight, total power outage, all lights OFF. The material shifts here from black stone to a colder, plainer gray laboratory wall (perforated metal panels, no more gold trim) — this is the working/technical half of the floor. Restrained anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent. Human sprite about 162 pixels tall.
CRITICAL COLLISION GEOMETRY: perfectly horizontal walkable floor top at y=570 of 720 (79.17 percent), full width, dark flat cutaway foundation below. Ceiling band y=0..60, cold gray, cable trays instead of gold strip lighting.
Composition across width (pixel x of this 718-wide canvas):
x=0..18: seam from the previous piece — a transition strip where black stone with gold trim fades into plain perforated gray metal panels.
x=18..238: perforated dark gray metal wall, one small unlit wall monitor at y=170..260.
x=138..248: ONE closed lab sliding door, top y=250, bottom y=570, thin steel frame, small unlit motion sensor above it.
x=248..378: perforated dark gray metal wall, a small yellow-and-black hazard stripe along the base y=552..570 starting here and continuing to the end.
x=378..478: ONE closed heavy airlock-style door, top y=290, bottom y=570, thick steel frame with visible bolts around the edge, a single dim red status LED beside it (interlock armed), a small warning light fixture above it.
x=478..718: perforated dark gray metal wall, hazard stripe continues along the base, plain structural end wall at the very right edge.
No people, no robots, nothing in the walk lane, no UI, no border, no watermark, no captions, no logos, no readable letters or numbers. Opaque PNG. Output only the finished background.
```

## 5. VIP Room 왼쪽 `vip-1.png` (VIP Room 월드 x=0..1750)

출구는 x≈1450..1600(y=220), 복도 이중문과 같은 스타일. 시연 스크린 x=1150..1650(y=140..350, 벽걸이,
소품 아님). 소품 스프라이트(그리지 않음): 화분 x=110..188, 소파 x=380..630, 시연 테이블 x=800..1156.

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. This is the LEFT piece of a wide room interior assembled from two pieces.
Reference image 1 is the existing 17th-floor office interior. Use it ONLY as the pixel-art style, material and lighting reference. This is a DIFFERENT room: the VIP Room on the 7th floor, a luxury demonstration/reception suite, seen from inside after entering from the lounge.
Create ONE landscape PNG, 1750 x 720 (ratio 2.43:1). Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point. Unobstructed cutaway view into the room.
Midnight during a total power outage: every light and screen is OFF. Light comes only from faint city glow and one dim amber standby light. Dark polished black stone floor and walls with warm champagne-gold trim and accents — more luxurious than a plain office. Detailed restrained anime-inspired pixel art, crisp hard pixel clusters. Quiet, expensive, abandoned, mystery 80 percent horror 20 percent.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw sofas, tables, display cabinets, plants or any floor-standing furniture. The game places those as separate sprites.
Layout (pixel x): x=0..32 plain end wall with gold pilaster strip. x=1150..1650 a large wall-mounted demo screen, switched off, black glass with a faint reflection, thin gold frame, from y=140 to y=350, no content on it. x=1450..1600 the closed VIP double glass door we came in through, top y=220, bottom y=570, slim gold frame, vertical center seam, frosted dark glass. x=1700..1750 the left half of a plain black stone column (the next piece continues it). Keep the rest of the rear wall (x=32..1150) plain black stone with slim gold pilaster strips every ~150px, kept simple because furniture sprites stand there. Ceiling band y=0..60 with a thin gold recessed light strip (switched off).
Geometry: the walkable floor top is one perfectly straight horizontal line at y=570 of the 720-high canvas (79.17 percent), full width; the door bottom sits on it. Below it a dark flat floor foundation cutaway. Door about 350 px high; human height about 162 px.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```

## 6. VIP Room 오른쪽 `vip-2.png` (VIP Room 월드 x=1750..3072)

캔버스 x = 월드 x − 1750. 소품 스프라이트(그리지 않음): 방명록대 x=130..452, 진열장 x=1050..1161,
화분 x=1230..1308, 소파 x=810..1060.

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. This is the RIGHT piece of a wide room interior assembled from two pieces.
Reference image 1 is the existing 17th-floor office interior: style reference only. Reference image 2 is the left piece of this same room: match its black-stone-and-gold palette, ceiling band and the concrete/stone column at its right edge exactly.
Create ONE landscape PNG, 1322 x 720 (ratio about 1.84:1). Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point.
Same room: the VIP Room on the 7th floor, midnight, total power outage, everything switched OFF. Dark polished black stone with warm champagne-gold trim, restrained anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw a reception desk, display cabinets, sofas or plants.
Layout (pixel x): x=0..20 the right half of the plain black stone column that ends reference image 2. x=20..1302 plain black stone rear wall with slim gold pilaster strips every ~150px, kept simple for furniture sprites. One small wall-mounted gold-framed empty picture panel at about x=550..750, y=180..320 (no content, just a dark frame). x=1302..1322 plain end wall. Ceiling band y=0..60 continuing reference image 2, thin gold recessed light strip.
Geometry: walkable floor top is one perfectly straight horizontal line at y=570 of the 720-high canvas (79.17 percent), full width, dark flat foundation cutaway below. Human height about 162 px.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```

## 7. AI 테스트실 왼쪽 `test-1.png` (AI 테스트실 월드 x=0..1150)

출구는 x≈720..830(y=250), 복도와 같은 랩 슬라이드문. 소품 스프라이트(그리지 않음): 캐비닛 x=110..182,
테스트 책상 x=380..632, 화이트보드 x=760..1110(윗면 y≈406).

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. This is the LEFT piece of a room interior assembled from two pieces.
Reference image 1 is the existing 17th-floor office interior. Use it ONLY as the pixel-art style, material and lighting reference. This is a DIFFERENT room: the AI test bay on the 7th floor, a cold gray laboratory room behind the VIP lounge, seen from inside after entering from the corridor.
Create ONE landscape PNG, 1150 x 720 (ratio 1.6:1). Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point.
Midnight during a total power outage: every light and monitor is OFF. Light comes only from faint city glow (this room still has one small window) and a tiny amber standby LED. Cold gray laboratory wall panels, perforated metal, no gold trim here — plainer and more technical than the lounge. Detailed restrained anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw desks, cabinets, whiteboards on stands or any floor-standing furniture.
Layout (pixel x): x=0..32 plain end wall. x=60..680 a mid-height window band from y=150 to y=340 showing a plain dark cityscape sliver, below it a plain perforated metal wall down to the floor. x=720..830 the closed lab sliding door we came in through, top y=250, bottom y=570, thin steel frame, small unlit motion sensor above it. x=1100..1150 the left half of a plain gray panel column (the next piece continues it). Ceiling band y=0..60 with cable trays and switched-off strip lights.
Geometry: the walkable floor top is one perfectly straight horizontal line at y=570 of the 720-high canvas (79.17 percent), full width; the door bottom sits on it. Below it a dark flat floor foundation cutaway. Door about 320 px high; human height about 162 px.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```

## 8. AI 테스트실 오른쪽 `test-2.png` (AI 테스트실 월드 x=1150..2304)

캔버스 x = 월드 x − 1150. 소품 스프라이트(그리지 않음): 전자기기 작업대 x=300..561, 계측기 카트
x=600..713, 책상 x=900..1152.

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. This is the RIGHT piece of a room interior assembled from two pieces.
Reference image 1 is the existing 17th-floor office interior: style reference only. Reference image 2 is the left piece of this same room: match its cold gray perforated-metal palette, ceiling band and the panel column at its right edge exactly.
Create ONE landscape PNG, 1154 x 720 (ratio about 1.6:1). Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point.
Same room: the AI test bay on the 7th floor, midnight, total power outage, everything OFF. Cold gray laboratory wall, perforated metal panels, restrained anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw an electronics bench, instrument cart or desk.
Layout (pixel x): x=0..20 the right half of the plain gray panel column that ends reference image 2. x=20..1134 perforated dark gray metal wall, panel seams every ~200px, a small wall-mounted power meter panel at about x=550..650, y=250..340 with one tiny amber LED. x=1134..1154 plain end wall. Ceiling band y=0..60 continuing reference image 2.
Geometry: walkable floor top is one perfectly straight horizontal line at y=570 of the 720-high canvas (79.17 percent), full width, dark flat foundation cutaway below. Human height about 162 px.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```

## 9. 검증실 `verify.png` (월드 x=0..1856)

출구는 x≈600..704(y=290, airlock, 등 뒤에서 잠긴다). 인터록 제어반 x=100..189(벽걸이, gives). 인터페이스
의자 x=400..600(y=380, 바닥 고정 fixture — 소품이 아니라 배경에 그려도 되는 고정 설비지만, 실루엣이
뚜렷하므로 여기서는 벽 쪽 배경만 그리고 의자 자체는 `assets/objects`쪽 스프라이트로 얹는 편이 낫다).
소품 스프라이트(그리지 않음): 서버 랙 x=780..876, 망분리 백업 장비 x=1400..1661, UPS x=1640..1798,
냉각 유닛 x=1776..1872(방 폭을 넘으므로 실제로는 잘려 보일 수 있음 — 배치 확인 필요).

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. Create ONE room INTERIOR background.
Reference image 1 is the existing 17th-floor office interior. Use it ONLY as the material, lighting and pixel-art style reference. This is a DIFFERENT, windowless room: the isolated verification chamber on the 7th floor, cut off from the company network, where an emergency interlock can lock the exit shut.
Create ONE landscape PNG, 1856 x 720 (ratio about 2.58:1). Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point.
Midnight during a total power outage: all lights OFF. No windows at all. Light comes only from one dim red interlock warning light near the door and a tiny amber standby LED on a wall panel. Cold gray laboratory wall, perforated metal panels, technical and slightly ominous. Detailed restrained anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent: a locked room, a chair with electrodes waiting in it.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw server racks, benches, UPS cabinets, the interface chair or any floor-standing equipment; the game places those as separate sprites.
Layout (pixel x): the whole rear wall is perforated dark gray metal acoustic panels with a yellow-and-black hazard stripe along the base y=552..570. x=0..32 plain end wall. x=100..189 a small wall-mounted interlock control panel from y=280 to y=420, one large red emergency-release lever handle on its front, currently in the "locked" position, a small status screen above it (blank, no text) with one dim red LED. x=600..704 the heavy airlock-style door we came in through, top y=290, bottom y=570, thick steel frame with visible bolts, a red warning light fixture above it, currently lit dim red (session active). x=1300..1500 a wall-mounted rack of small blinking status LEDs (all but one or two unlit) suggesting isolated backup equipment nearby. Ceiling band y=0..70 with overhead cable ladder trays and dark air ducts, bundles of cables dropping down the wall behind x=750..900 and x=1600..1850 where equipment will stand.
Geometry: walkable floor top is one perfectly straight horizontal line at y=570 of the 720-high canvas (79.17 percent), full width; the door bottom sits on it. Below it a raised access floor shown only in flat cutaway, no perspective. Door about 280 px high; human height about 162 px.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```
