# 1층 로비 배경 프롬프트 (생성 전 기획, 2026-09-28 전면 재작성)

- 상태: 이전 버전은 입구/안내데스크/로봇/게이트를 복도 왼쪽(x=32..1790)에 두는 구도였는데, 지금
  `js/floors/floor-01.js`의 `FLOOR1_LAYOUT`은 완전히 달라졌다: 왼쪽 서쪽 날개(x=40..1240)에 Harmony
  Hall·Vision Hall·건강관리실 세 방이 있고, 스피드 게이트·경비 로봇·회전문(정문)은 반대로 동쪽 끝
  (x=4330..4930)에 있다. 로비 테마도 `atrium`(밝은 트래버틴 바닥 + 황동 테, index.html CSS)으로 확정됐다.
  아래는 그 최신 구조에 맞춘 전체 재작성이다. 12층 방식(복도 여러 조각 + 방 내부 별도 조각,
  `GENERATED.md`에 실측 기록)을 그대로 따른다.
- 도구: 내장 `image_gen` 또는 동급 도구. use case는 `stylized-concept`.
- 층 설정(기획.md, 층별안내.md): 1층은 Harmony Hall(공연장) / Vision Hall(전시) / 건강관리실, 그리고
  안내 데스크·층별 안내판·경비 로봇 R-01·회전문이 있는 로비다. 게임에서 처음 보는 상태는 정전이다.
  조명·모니터·스피드게이트 화면은 꺼져 있고 빛은 회전문 밖 가로등, 초록 비상구 표시등, 경비 로봇 정비
  패널의 배터리 LED뿐이다. 추리 80%, 공포 20%. 경비 로봇 R-01은 도크에 가만히 서 있는 정지 상태로만
  그린다(첫 추격은 아직 일어나지 않았다). 사람, 괴물은 그리지 않는다.
- 게임 쪽 배치 기준: `js/core/config.js`의 `BUILDING_CORE`(엘리베이터 3대, 비상계단, 화장실 좌표는 모든
  층 공통), `js/floors/floor-01.js`의 `FLOOR1_LAYOUT`, `FLOOR1_ROOMS`. index.html CSS `[data-theme="atrium"]`가
  지금의 임시 그림이며 아래 좌표가 그 판정 좌표와 같다.

## 공통 규칙

- **조각 나누기**: 모든 조각을 2.5:1 이하로 나누고, 이음매는 반드시 **민무늬 벽면**에 둔다. 두 번째
  조각부터는 앞 조각 결과를 참조 이미지 2로 넣어 이음매 쪽 색과 재질을 맞춘다.
- **바닥선**: 캔버스 높이 720 기준 y=570(위에서 79.17%)이 수평 보행선이다.
- **소품은 그리지 않는다**: 화분, 대기 소파, 안내 데스크, 정수기는 `assets/objects/floor-kit/` 스프라이트가
  배경 위에 따로 그려진다. 배경에는 벽, 창, 천장, 벽에 붙은 것만 그린다.
- **텍스트가 있는 표지판은 빈 벽으로 남긴다**: 층별 안내판(`lines` 19줄)은 DOM이 실제 텍스트를 그리므로
  배경에는 글자 없는 액자 틀만 그린다. 반대로 **경비 로봇, 스피드 게이트, 회전문(정문)** 은 문구가 없는
  물리적 사물이라 배경에 직접 그린다(로봇은 도크에 정지한 모습, 게이트는 닫힌 날개, 정문은 멈춘 회전문).
- **게임이 겹쳐 그리는 자리**: 엘리베이터 3대와 비상계단 문은 17층 개폐 스프라이트가 겹쳐 그려지고,
  화장실 문은 CSS 금속문이 남는다. Harmony Hall/Vision Hall/건강관리실 문은 배경에 완성된 모습으로
  그린다(닫힌 채로).
- **문 크기**: 방 문(110~170px)은 복도 코어 문(엘리베이터 218px 안팎, 화장실 145px)보다 작아도 된다 —
  공연장/전시장/진료실 입구이지 보안문이 아니다.
- **스타일 참조**: 복도는 `../floor17/floor17.png`, 실내는 `../floor17/office-interior-aligned.png`. 스타일,
  재질, 조명만 참조하고 구도는 따라 그리지 않는다.
- **1층만의 색**: 밝은 베이지-크림 **무광(matte)** 석재 바닥과 벽, 무광 새틴 황동(satin brass, 광택 없음)
  테두리. 7층의 검은 대리석+샴페인 금장보다 더 밝고 공공건물답게, 12층의 흑연색과는 완전히 다르게
  보여야 한다. 그래도 정전 중이라 전체적으로 어둡게, 채도는 낮춘다 — 밝은 재질이되 조명이 꺼진 상태.
  **2026-09-30 수정**: 1차 corridor-a 생성본이 바닥이 물기 있는 대리석처럼 반들반들 비치고(예전
  1층 2차 시도 때 이미 한 번 폐기됐던 결함과 동일) 콘서트홀 문에 금장 아치까지 붙어서 호텔 로비처럼
  너무 고급스럽게 나왔다(7층 VIP 라운지보다 더 화려해 보이는 톤 역전). "무광, 반사 없음"과 "평범한
  공공/사무 건물, 호텔 아님"을 모든 조각 프롬프트에 명시적으로 넣도록 9개 `.txt` 파일을 전부
  고쳤다 — 이 문서의 각 프롬프트 블록은 최신화하지 않았으니, 실제 생성은 `prompts/*.txt`를 기준으로 한다.
  재생성한 corridor-a 2차본은 고급스러움 문제는 해결됐지만, 다른 층(7층/12층) 정전 장면보다 전체적으로
  너무 밝게 나왔다 — 재질 색이 밝은 트래버틴이라 그런지 도구가 "정전=어둡게"를 약하게 반영한 것으로
  보인다. 그래서 9개 파일 전부에 "IMPORTANT OVERALL EXPOSURE" 절을 추가해, 재질 색과 무관하게 장면
  전체 노출을 다른 층 정전 장면만큼 어둡게(중~어두운 회색조) 그리라고 명시했다.

## 파일 목록

| 파일 | 장면 | 월드 x 범위 | 요청 캔버스 | 비율 |
| --- | --- | --- | --- | --- |
| `corridor-a.png` | 복도 A: Harmony Hall·Vision Hall·건강관리실 전면, 층별 안내판 벽감 | 0..1818 | 1818×720 | 2.53:1 |
| `corridor-b.png` | 복도 B: 엘리베이터 3대, 비상계단 | 1818..3086 | 1268×720 | 1.76:1 |
| `corridor-c.png` | 복도 C: 화장실 전면 | 3086..4282 | 1196×720 | 1.66:1 |
| `corridor-d.png` | 복도 D: 스피드 게이트, 경비 로봇 도크, 회전문(정문) | 4282..5000 | 718×720 | 1:1 |
| `harmony-1.png` | Harmony Hall 왼쪽(출구+객석) | 0..1680 | 1680×720 | 2.33:1 |
| `harmony-2.png` | Harmony Hall 오른쪽(무대+피아노) | 1680..3224 | 1544×720 | 2.14:1 |
| `vision-1.png` | Vision Hall 왼쪽(출구+진열장) | 0..1178 | 1178×720 | 1.64:1 |
| `vision-2.png` | Vision Hall 오른쪽(연혁 벽+방명록대) | 1178..2356 | 1178×720 | 1.64:1 |
| `clinic.png` | 건강관리실(출구+여성휴게실 문) | 0..1860 | 1860×720 | 2.58:1 |

생성 순서는 corridor-a → corridor-b → corridor-c → corridor-d → harmony-1 → harmony-2 → vision-1 → vision-2
→ clinic을 권한다. 복도 조각끼리, Harmony/Vision 조각끼리는 앞 결과를 참조 2로 넣는다.

## 게임 연결 계획 (이미지가 생긴 뒤)

1. **측정**: 각 결과의 크기, 바닥선 y, 칠해진 문 사각형, 이음매 x를 잰다.
2. **이음매 자르기**: 조각의 왼쪽 끝이 월드 이음매(1818, 3086, 4282 / Harmony 1680 / Vision 1178)에 오게 자른다.
3. **배율과 정렬**: `s = W / cw`, `top = 570 - srcFloor × s`. 가로세로 같은 배율.
4. **엔진**: `buildDynamicScene`의 `backgroundImage`를 `{ src, left, width, height, top }` 배열로 받게 한다.
5. **문 좌표**: 칠해진 문이 `FLOOR1_LAYOUT`/`FLOOR1_ROOMS` 사각형과 몇 px 이상 다르면 그림에 맞춰
   `doorX/doorWidth/doorY`와 각 방의 출구 좌표를 조정한다.
6. **CSS**: art 모드 규칙에서 층별 안내판 DOM 텍스트는 유지하고, `.floor-room.hall-portal`/`.gallery`/
   `.clinic`, `.fixture.speed-gates`/`.guard-bot`의 CSS 그림만 숨긴다.
7. **테스트**: `checkFloor1`을 만들어 이미지 로드, `data-art`, CSS 숨김, 바닥선 정렬을 조각마다 검사한다.
8. **기록**: `GENERATED.md`에 원본 경로, 크롭 영역, 배율, top, 실제 문 좌표, 최종 프롬프트를 적는다.

## 1. 복도 A `corridor-a.png` (월드 x=0..1818)

Harmony Hall 문 x=215..385(y=?, hall-double, 크고 화려한 양문). Vision Hall 문 x=600..730(pivot-glass).
건강관리실 문 x=1100..1210(clinic-door). 층별 안내판 벽감 x=1380..1740(y=110..560, 글자 없음, DOM이
19줄 텍스트를 그린다).

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the actual environment artwork, NOT a concept poster. It is the LEFT piece of a long corridor assembled from four pieces.
Reference image 1 is the existing 17th-floor corridor. Use it ONLY as the architectural, material, lighting and pixel-art style reference. Do not copy its layout.
Create ONE landscape PNG, 1818 x 720 (ratio 2.53:1). Strict orthographic SIDE VIEW, camera exactly perpendicular to the wall. NO vanishing point, NO isometric, NO perspective.
Setting: the GROUND-FLOOR LOBBY of a Korean software-company tower, the west wing with a concert hall and an exhibition hall, midnight during a total power outage. All ceiling lights are OFF. Light comes only from faint ambient glow and one small green exit pictogram. Restrained atmospheric anime-inspired pixel art, crisp hard-edged pixel clusters, realistic adult scale. Palette: bright warm travertine-like pale beige-cream stone floor and walls with brass-gold trim and moldings — a public atrium look, but desaturated and dim because the power is out. Mystery 80 percent, horror 20 percent: an empty public lobby at night. Human sprite on screen is about 162 pixels tall; doors on this wall read at that scale.
CRITICAL COLLISION GEOMETRY: the continuous, perfectly horizontal top edge of the walkable floor is at y=570 of this 720-high canvas (79.17 percent from the top), from extreme left to extreme right. All door bottoms sit exactly on this line. Below it is a flat cutaway floor foundation, no perspective. Ceiling band y=0..60, pale stone with a thin brass accent strip (switched off recessed lights).
Composition across width (pixel x of this 1818-wide canvas):
x=0..32: plain structural end wall.
x=32..215: pale travertine wall with a brass pilaster strip.
x=215..385: ONE grand closed double door for a concert hall entrance, top y=140, bottom y=570, tall brass-framed dark wood double doors with brass handles, an ornate brass molding arch above it.
x=385..600: pale travertine wall, brass trim.
x=600..730: ONE closed pivoting glass door for an exhibition hall, top y=180, bottom y=570, slim brass frame, single large glass pane.
x=730..940: pale travertine wall.
x=940..1100: pale travertine wall, slightly more clinical/plain in tone (a health-clinic front approaching).
x=1100..1210: ONE closed clinic door, top y=230, bottom y=570, plain pale door with a small frosted glass panel and a brass handle.
x=1210..1380: pale travertine wall with brass pilaster strip.
x=1380..1740: a tall shallow wall niche/frame with a thin brass border, completely empty inside (the game draws a 19-line floor directory here — leave it blank).
x=1740..1790: plain travertine wall (a potted plant sprite stands here — keep the lower wall plain).
x=1790..1818: plain wall (the seam to the next piece — keep it completely blank).
No people, no monsters, no robots, no floor-standing furniture, nothing in the walk lane, no UI, no border, no watermark, no captions, no logos, no readable letters or numbers anywhere. Opaque PNG. Output only the finished background.
```

## 2. 복도 B `corridor-b.png` (월드 x=1818..3086, 엘리베이터+비상계단)

캔버스 x = 월드 x − 1818. `BUILDING_CORE` 공통 구조물, 재질만 1층의 밝은 트래버틴+황동으로 바뀐다.

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the MIDDLE piece of a long corridor assembled from four pieces.
Reference image 1 is the existing 17th-floor corridor: elevator lobby style reference only. Reference image 2 is the previous piece of this same corridor: match its pale travertine-and-brass palette and ceiling band exactly.
Create ONE landscape PNG, 1268 x 720 (ratio about 1.76:1). Strict orthographic SIDE VIEW, camera perpendicular to the wall, NO vanishing point, NO isometric, NO perspective.
Setting: ground-floor lobby of a Korean software-company tower, midnight, total power outage, all lights OFF. Bright pale travertine-like stone with brass trim, restrained anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent. Human sprite about 162 pixels tall.
CRITICAL COLLISION GEOMETRY: perfectly horizontal walkable floor top at y=570 of 720 (79.17 percent), full width, flat cutaway foundation below. Ceiling band y=0..60 matching reference image 2.
Composition across width (pixel x of this 1268-wide canvas):
x=0..18: plain wall (seam from the previous piece, blank).
x=18..236, x=348..562, x=644..860: THREE shallow recessed elevator bays, each from y=220 to y=570, brass brushed-metal frames about 8 px outside these rectangles. Inside each bay draw only a flat dark closed steel surface; the game overlays its own animated elevator doors exactly here. A plain pale strip at y=180..212 above each bay (the game draws a floor indicator there). Small brass call-button plates between the bays at about x=292 and x=603, y=370..410.
x=860..1088: plain travertine wall with a brass pilaster strip.
x=1088..1268: a flat recess for the stairwell fire door from y=232 to y=570, flat dark surface only (the game overlays its own door), a small green running-man exit pictogram light above it at about y=196..220, ending with a sliver of plain wall.
All three elevator bays must be the exact same width and height as each other. No people, no robots, nothing in the walk lane, no UI, no border, no watermark, no captions, no logos, no readable letters except the running-man pictogram. Opaque PNG. Output only the finished background.
```

## 3. 복도 C `corridor-c.png` (월드 x=3086..4282, 화장실)

캔버스 x = 월드 x − 3086. 정수기 벽감 x=3260..3340(소품 자리, 비움). 화장실 문 x=3612..3757(y=210..570,
모든 층 공통의 같은 금속문).

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the third piece of a long corridor assembled from four pieces.
Reference image 1 is the existing 17th-floor corridor extension: material reference only. Reference image 2 is the previous piece of this same corridor: match its pale travertine-and-brass palette and ceiling band exactly.
Create ONE landscape PNG, 1196 x 720 (ratio about 1.66:1). Strict orthographic SIDE VIEW, camera perpendicular to the wall, NO vanishing point, NO isometric, NO perspective.
Setting: ground-floor lobby, midnight, total power outage, all lights OFF. Bright pale travertine-like stone with brass trim, restrained anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent. Human sprite about 162 pixels tall.
CRITICAL COLLISION GEOMETRY: perfectly horizontal walkable floor top at y=570 of 720 (79.17 percent), full width, flat cutaway foundation below. Ceiling band y=0..60 matching reference image 2.
Composition across width (pixel x of this 1196-wide canvas):
x=0..30: seam from the previous piece, blank.
x=30..470: plain travertine wall with a shallow alcove around x=174-254 (a water cooler sprite stands there — leave it as plain recessed wall).
x=470..1196: a restroom front, cool pale gray-green matte tile wall (fine tile grid, no gloss) — the same universal restroom material used on every floor, independent of this floor's warm theme.
x=526..671: ONE plain flat dark metal recess from y=210 to y=570 (the game overlays its own restroom door here), small male/female pictograms on the wall above it, no letters.
No people, no robots, nothing in the walk lane, no UI, no border, no watermark, no captions, no logos, no readable letters or numbers except the restroom pictograms. Opaque PNG. Output only the finished background.
```

## 4. 복도 D `corridor-d.png` (월드 x=4282..5000)

캔버스 x = 월드 x − 4282. 스피드 게이트 x=4330..4450(y=470..570, 낮은 파고라식 게이트). 경비 로봇 R-01
x=4520..4592(y=440..570, 도크에 정지, 표시등 꺼짐). 정문(회전문) x=4650..4930(y=140..570).

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the RIGHT piece of a long corridor assembled from four pieces.
Reference image 1 is the existing 17th-floor corridor: material reference only. Reference image 2 is the previous piece of this same corridor: match its ceiling band and wall material at the seam exactly.
Create ONE landscape PNG, 718 x 720 (ratio about 1:1). Strict orthographic SIDE VIEW, camera perpendicular to the wall, NO vanishing point, NO isometric, NO perspective.
Setting: the main entrance area of the ground-floor lobby, midnight, a few minutes into a building-wide power outage. Bright pale travertine-like stone with brass trim, dim now that the lights are off. Restrained atmospheric anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent. Human sprite about 162 pixels tall; door openings read as roughly 250-300px tall at this scale — do not draw the robot or gates undersized relative to a person.
CRITICAL COLLISION GEOMETRY: the continuous, perfectly horizontal top edge of the walkable floor sits at y=570 of this 720-tall canvas, unbroken across the full width. Below it a flat cutaway floor foundation, no perspective. The floor is a plain matte stone walkway, not glossy, no reflections.
Composition across width (pixel x of this 718-wide canvas):
x=0..48: seam from the previous piece, plain travertine wall with brass trim.
x=48..168: a row of waist-high glass turnstile security gates, paddles closed, brass frame posts, one tiny dim red LED per gate — a fixed architectural feature, not a game prop.
x=168..238: plain travertine wall.
x=238..310: standing motionless at floor level, ONE powered-down security robot on a small charging dock — simple boxy/humanoid utility chassis, matte pale gray with brass trim accents matching the lobby, no face detail, head slightly bowed, a single tiny dim status light on its chest, currently unlit (no power). It is doing nothing, not a person, no readable text on it, roughly human height using the scale above.
x=310..400: plain travertine wall.
x=400..680: a tall glass entrance storefront with a revolving door and glass double doors leading outside, brass frame mullions, from y=140 to the floor. Through the glass: a distant, low-detail night skyline in silhouette and one or two working street lamps outside (the power outage is only inside the building), kept simple and flat, no rain, no wet reflections.
x=680..718: plain structural end wall (the far corner of the lobby).
No large readable lettering; everything blank except small pictograms. No people other than the one motionless robot, no other robots, no monsters, no UI, no border, no watermark, no captions. Opaque PNG. Output only the finished background.
```

## 5. Harmony Hall 왼쪽 `harmony-1.png` (Harmony Hall 월드 x=0..1680)

출구는 x≈1030..1200(y=140, hall-double와 같은 크기). 1층 객석 x=120..1360(y=470..570, 바닥에 붙은
좌석열 — 벽 배경이 아니라 바닥 구조물이라 여기서는 벽만 그리고 좌석은 낮게 걸치는 정도로만 암시).
소품 스프라이트(그리지 않음): 화분 x=1400..1478.

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. This is the LEFT piece of a wide room interior assembled from two pieces.
Reference image 1 is the existing 17th-floor office interior. Use it ONLY as the pixel-art style, material and lighting reference. This is a DIFFERENT room: the rear of Harmony Hall, a concert hall on the 1st floor, seen from inside after entering from the lobby, looking toward the stage.
Create ONE landscape PNG, 1680 x 720 (ratio 2.33:1). Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point. Unobstructed cutaway view into the room.
Midnight during a total power outage: every light is OFF. Light comes only from faint ambient glow and one dim green exit pictogram. Warm pale travertine and brass trim on the rear wall, deep red-brown concert-hall carpet and wood tones further into the room. Detailed restrained anime-inspired pixel art, crisp hard pixel clusters. Quiet, empty auditorium at night, mystery 80 percent horror 20 percent.
IMPORTANT: ARCHITECTURE ONLY. Do NOT draw individual auditorium seats, plants or any floor-standing furniture in detail — the game places rows of seats and plants as separate sprites in front of the rear wall; you may suggest a very low, dark riser/platform base along the floor where seats will sit, nothing more.
Layout (pixel x): x=0..32 plain end wall with brass trim. x=60..1000 a plain warm wood-paneled rear wall (the back wall of the auditorium), simple vertical panel seams every ~200px, kept low-detail because seat sprites stand there. x=1030..1200 the closed grand double door we came in through, top y=140, bottom y=570, tall brass-framed dark wood double doors, matching the lobby side. x=1640..1680 the left half of a plain dark wood column (the next piece continues it, leading toward the stage). Ceiling band y=0..60 with switched-off stage-adjacent house lights.
Geometry: the walkable floor top is one perfectly straight horizontal line at y=570 of the 720-high canvas (79.17 percent), full width; the door bottom sits on it. Below it a dark flat floor foundation cutaway. Door about 430 px high; human height about 162 px.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```

## 6. Harmony Hall 오른쪽 `harmony-2.png` (Harmony Hall 월드 x=1680..3224)

캔버스 x = 월드 x − 1680. 무대 x=320..1512(y=96..570). 자동 연주 피아노 x=620..840(무대 위, 소품이지만
검게 그린 실루엣 정도는 배경에 암시 가능 — 여기서는 소품 스프라이트가 따로 얹히므로 벽/무대만 그린다).
소품 스프라이트(그리지 않음): 화이트보드 x=280..630, 정수기 x=1470..1532.

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. This is the RIGHT piece of a wide room interior assembled from two pieces.
Reference image 1 is the existing 17th-floor office interior: style reference only. Reference image 2 is the left piece of this same room: match its warm wood tones, ceiling band and the column at its right edge exactly.
Create ONE landscape PNG, 1544 x 720 (ratio about 2.14:1). Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point.
Same room: Harmony Hall concert hall on the 1st floor, now showing the stage end, midnight, total power outage, everything OFF. Warm dark wood proscenium, a raised stage with deep red stage curtains pulled slightly open, all stage lighting dead. Detailed restrained anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent: an empty stage facing empty seats.
IMPORTANT: ARCHITECTURE ONLY. Do NOT draw a whiteboard, a piano, a water cooler or any floor-standing item; the game places those as separate sprites.
Layout (pixel x): x=0..20 the right half of the plain dark wood column that ends reference image 2. x=20..300 plain dark wood wall, low-detail for a whiteboard-on-wheels sprite. x=320..1512 a raised stage from y=96 to the floor: a tall proscenium arch in dark wood with brass trim, deep red velvet curtains partly drawn to each side, a plain dark stage floor slightly higher than the auditorium floor but visually flush at y=570 for gameplay, a single dead spotlight fixture visible in the fly space above. x=1512..1544 plain end wall. Ceiling band y=0..60 continuing reference image 2, with a dead follow-spot rig visible near the stage.
Geometry: walkable floor top is one perfectly straight horizontal line at y=570 of the 720-high canvas (79.17 percent), full width, dark flat foundation cutaway below. Human height about 162 px.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```

## 7. Vision Hall 왼쪽 `vision-1.png` (Vision Hall 월드 x=0..1178)

출구는 x≈220..350(y=180, pivot-glass). 소품 스프라이트(그리지 않음): 진열장 x=110..221, 로봇 진열장
x=700..811.

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. This is the LEFT piece of a room interior assembled from two pieces.
Reference image 1 is the existing 17th-floor office interior. Use it ONLY as the pixel-art style, material and lighting reference. This is a DIFFERENT room: Vision Hall, a small corporate history exhibition gallery on the 1st floor, seen from inside after entering from the lobby.
Create ONE landscape PNG, 1178 x 720 (ratio 1.64:1). Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point.
Midnight during a total power outage: every light is OFF. Light comes only from faint ambient glow and one dim green exit pictogram. Pale travertine gallery walls with brass display-case trim, a hushed museum feel. Detailed restrained anime-inspired pixel art, crisp hard pixel clusters. Quiet, empty gallery at night, mystery 80 percent horror 20 percent.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw display cabinets, pedestals or any floor-standing furniture; the game places those as separate sprites.
Layout (pixel x): x=0..32 plain end wall with brass trim. x=220..350 the closed pivoting glass door we came in through, top y=180, bottom y=570, slim brass frame, single large glass pane. x=60..1140 pale travertine gallery wall, simple brass picture-rail line at about y=160 running the length of the wall, kept low-detail below because display cabinets stand there. x=1140..1178 plain wall (the next piece continues it). Ceiling band y=0..60 with switched-off gallery track lighting fixtures spaced evenly.
Geometry: the walkable floor top is one perfectly straight horizontal line at y=570 of the 720-high canvas (79.17 percent), full width; the door bottom sits on it. Below it a dark flat floor foundation cutaway. Door about 390 px high; human height about 162 px.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```

## 8. Vision Hall 오른쪽 `vision-2.png` (Vision Hall 월드 x=1178..2356)

캔버스 x = 월드 x − 1178. 기술 연혁 벽 x=1680..2200(y=130..320, 글자 없이 형태만 — 5개 연도 마커,
DOM 대신 배경에 새겨도 되지만 가독 텍스트는 없이 추상 타임라인 눈금만). 소품 스프라이트(그리지 않음):
진열장 x=860..971, 방명록대 x=1400..1722, 화분 x=2280..2358.

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. This is the RIGHT piece of a room interior assembled from two pieces.
Reference image 1 is the existing 17th-floor office interior: style reference only. Reference image 2 is the left piece of this same room: match its pale travertine-and-brass palette, ceiling band and the wall at its right edge exactly.
Create ONE landscape PNG, 1178 x 720 (ratio about 1.64:1). Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point.
Same room: Vision Hall exhibition gallery on the 1st floor, midnight, total power outage, everything OFF. Pale travertine gallery walls with brass trim, restrained anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw display cabinets, a reception counter or any floor-standing furniture.
Layout (pixel x): x=0..20 continuing the plain travertine wall from reference image 2, brass picture-rail line at y=160. x=502..1022 a shallow wall-mounted timeline feature from y=130 to y=320: a thin horizontal brass rail with five small unlit marker lights spaced along it (no readable dates or text, just abstract markers). x=1022..1178 plain travertine wall, brass trim, kept low-detail near the right edge (a potted plant sprite stands there). Ceiling band y=0..60 continuing reference image 2 with switched-off gallery track lighting.
Geometry: walkable floor top is one perfectly straight horizontal line at y=570 of the 720-high canvas (79.17 percent), full width, dark flat foundation cutaway below. Human height about 162 px.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```

## 9. 건강관리실 `clinic.png` (월드 x=0..1860)

출구는 x≈950..1060(y=230, clinic-door). 여성휴게실 문 x=1680..1800(y=250..570, 잠긴 막다른 문 — 창 없는
방 안쪽에 또 있는 문). 소품 스프라이트(그리지 않음): 소파 x=200..452, 간호사 책상 x=560..812, 장비
점검함 x=800..872, 계측기 카트 x=1000..1113, 정수기 x=1200..1262, 진열장 x=1320..1431.

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. Create ONE room INTERIOR background.
Reference image 1 is the existing 17th-floor office interior. Use it ONLY as the material, lighting and pixel-art style reference. This is a DIFFERENT, windowless room: the health clinic (건강관리실) on the 1st floor, a small infirmary with one locked inner door to a rest room.
Create ONE landscape PNG, 1860 x 720 (ratio about 2.58:1). Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point.
Midnight during a total power outage: all lights OFF. No windows at all. Light comes only from one dim green exit pictogram above the door we came in through and a tiny amber standby LED. Pale clinical wall panels, cooler and plainer than the travertine lobby, a hint of pale mint-green trim (medical, not warm brass). Detailed restrained anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent: a small dark infirmary, one door that won't open.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw a sofa, desk, cabinet, instrument cart or water cooler; the game places those as separate sprites.
Layout (pixel x): the whole rear wall is pale clinical panel material with a thin mint-green chair-rail line at about y=350. x=0..32 plain end wall. x=950..1060 the closed clinic door we came in through, top y=230, bottom y=570, plain pale door with a small frosted glass panel, a green exit pictogram above it. x=1680..1800 a second, smaller closed door set into the same wall — the locked women's rest room — top y=250, bottom y=570, plain pale door, a small keyhole visible on its handle, a tiny "occupied/locked" indicator light beside it (dark, unpowered). x=1800..1860 plain wall. Ceiling band y=0..60 with switched-off clinical panel lighting.
Geometry: walkable floor top is one perfectly straight horizontal line at y=570 of the 720-high canvas (79.17 percent), full width; both door bottoms sit exactly on this line. Below it a dark flat floor foundation cutaway. Doors about 340-320 px high; human height about 162 px.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```
