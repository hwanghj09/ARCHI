# 12층 배경 프롬프트 (생성 전 기획)

- 상태: 2026-09-24 프롬프트만 작성. 아직 생성하지 않았다. 생성 후 실제 크기, 바닥선, 문 좌표는 `GENERATED.md`에 따로 적는다(16층 방식).
- 도구: 내장 `image_gen` 또는 동급 도구. use case는 `stylized-concept`.
- 층 설정(기획.md): 12층은 ARCHI 개발팀이다. 낮에는 성능 3~5%, 밤에는 80~90%였다는 기록과 7층 원본 로그 백업 메모를 찾는 층이다. 게임에서 처음 보는 상태는 정전이다(전력 공급 기능 미구현). 조명, 모니터, CCTV는 모두 꺼져 있고 빛은 창밖 도시 불빛, 초록 비상구 표시등, 작은 대기 LED뿐이다. 추리 80%, 공포 20%. 사람, 로봇, 괴물은 그리지 않는다.
- 게임 쪽 배치 기준: `js/core/config.js`의 `BUILDING_CORE`, `js/floors/floor-12.js`의 `FLOOR12_LAYOUT`, `FLOOR12_ROOMS`. 지금은 CSS 임시 그림(`index.html`의 lab 테마, frosted/lab/blinds 벽, slide/security/blinds 문)이며 아래 좌표가 그 판정 좌표와 같다.

## 공통 규칙

- **조각 나누기**: 16층 결과를 보면 도구는 요청 크기와 상관없이 약 3:1(2172×724)로 출력했다. 17층 확장부는 1800×720(2.5:1)과 백분율 좌표로 요청해 잘 맞았다. 그래서 모든 조각을 2.5~3:1 이하로 나누고, 이음매는 반드시 **민무늬 콘크리트 기둥의 가운데**에 둔다. 두 번째 조각부터는 앞 조각 결과를 참조 이미지 2로 넣어 이음매 기둥의 색과 재질을 맞춘다.
- **바닥선**: 캔버스 높이 720 기준 y=570(위에서 79.17%)이 수평 보행선이다. 그 아래는 평평한 건물 단면이다.
- **소품은 그리지 않는다**: 책상, 캐비닛, 랙, 벤치, 소파, 화분, 냉온수기, 충전 도크는 `assets/objects/floor-kit/` 스프라이트가 배경 위에 따로 그려진다. 배경에는 벽, 창, 천장, 벽에 붙은 것만 그린다. 가구를 그리면 소품이 두 번 보인다.
- **게임이 겹쳐 그리는 자리**: 엘리베이터 3대와 비상계단 문은 17층 개폐 스프라이트가 겹쳐 그려지고, 화장실 문은 CSS 금속문이 남는다. 배경에는 그 자리를 스프라이트보다 조금 넓은 문틀과 평평한 어두운 면으로만 둔다. 방 이름표와 층 표지판은 DOM 글자이므로 그 자리는 글자 없는 벽으로 비운다.
- **문 크기**: 복도의 코어 문은 17층 기준으로 크다(엘리베이터 350px, 화장실 문 360px). 12층 방 문(308~326px)도 여기에 맞춘다. 방 안 출구는 복도 문과 같은 크기여야 하므로(테스트가 검사) 실내도 같은 크기다. 16층 실내처럼 210px 문으로 줄이면 같은 벽의 엘리베이터와 비율이 어긋난다.
- **스타일 참조**: 복도는 `../floor17/floor17.png`과 `../floor17/service-corridor.png`, 실내는 `../floor17/office-interior-aligned.png`. 스타일, 재질, 조명만 참조하고 구도는 따라 그리지 않는다.
- **12층만의 색**: 흑연색(graphite)과 냉한 강철 회색. 16층의 청회색 유리, 15층의 갈색 목재와 다르게 보여야 한다. 따뜻한 강조색은 작은 호박색 대기 LED 하나 정도만 쓴다.

## 파일 목록

| 파일 | 장면 | 월드 x 범위 | 요청 캔버스 | 비율 |
| --- | --- | --- | --- | --- |
| `corridor-1.png` | 복도 왼쪽: 개발실 전면, 복도 벽 | 0..1800 | 1800×720 | 2.5:1 |
| `corridor-2.png` | 복도 가운데: 엘리베이터, 계단, 모델 평가실 전면 | 1800..3548 | 1748×720 | 2.43:1 |
| `corridor-3.png` | 복도 오른쪽: 화장실 전면, 팀장실 전면 | 3548..5000 | 1452×720 | 2.02:1 |
| `dev-1.png` | 개발실 왼쪽(출구 포함) | 0..1800 | 1800×720 | 2.5:1 |
| `dev-2.png` | 개발실 오른쪽 | 1800..3280 | 1480×720 | 2.06:1 |
| `eval.png` | 모델 평가실 | 0..1804 | 1804×720 | 2.51:1 |
| `lead.png` | 팀장실 | 0..2132 | 2132×720 | 2.96:1 |

생성 순서는 corridor-1 → corridor-2 → corridor-3 → dev-1 → dev-2 → eval → lead를 권한다. 복도 조각끼리, 개발실 조각끼리는 앞 결과를 참조 2로 넣는다.

## 게임 연결 계획 (이미지가 생긴 뒤)

1. **측정**: 각 결과의 크기(`srcW×srcH`), 바닥선 y(`srcFloor`), 칠해진 문 사각형, 이음매 기둥 중심 x를 잰다.
2. **이음매 자르기**: 복도·개발실 조각은 이음매 기둥 중심에서 잘라, 각 조각의 왼쪽 끝이 월드 이음매(복도 1800, 3548 / 개발실 1800)에 오게 한다. 17층 `service-corridor.png`처럼 원본은 경로만 기록하고 크롭본을 저장한다.
3. **배율과 정렬**: 조각의 월드 폭을 `W`, 크롭 폭을 `cw`라 하면 `s = W / cw`, 표시 높이 `srcH × s`, `top = 570 - srcFloor × s`. 가로세로 같은 배율을 쓴다. `top`이 양수면 위쪽 빈 띠는 장면 배경색이 채운다.
4. **엔진**: `buildDynamicScene`의 `backgroundImage`는 지금 한 장(`left: 0`)만 받는다. `{ src, left, width, height, top }` 배열도 받게 바꾸고 조각마다 `left`를 준다. `data-art`는 그대로 true.
5. **문 좌표**: 칠해진 문이 `FLOOR12_LAYOUT` 사각형과 몇 px 이상 다르면 복도 쪽 `doorX/doorWidth/doorY`를 그림에 맞추고, 실내는 `exitX`를 적어 `doorX = x + (exitX - 32) × (width - doorWidth) / (insideWidth - 64 - doorWidth)`로 복도 문을 맞춘다. 실내 폭(3280/1804/2132, 전면 폭의 4.1배)은 바꾸지 않는다.
6. **CSS**: art 모드 규칙은 16층의 210px 문 기준이라 방 이름표를 y=260, 층 표지판을 y=282로 내린다. 12층 문 위쪽은 y=244~262이므로 lab 테마에서는 `.floor-room`을 top 118 / height 452, `.floor-number-sign`을 top 150으로 되돌린다. art 규칙이 숨기지 않는 가상 요소도 숨긴다: `.floor-room.lab::after`(경고 띠), `.room-door.slide::before`(자동문 센서), `.room-door.security::after`(카드 리더).
7. **테스트**: `checkFloor12`에 16층 `checkBackground`처럼 이미지 로드, `data-art`, CSS 바닥 숨김, 바닥선 정렬(`top + srcFloor × height / srcH = 570`)을 조각마다 검사한다. 문 거울 배치, 소품 크기 검사는 그대로 둔다.
8. **기록**: `GENERATED.md`에 원본 경로, 크롭 영역, 배율, top, 실제 문 좌표, 최종 프롬프트를 적는다.
9. **나중에**: 옥상에서 12층 전력을 켜는 기능이 생기면 조명과 모니터가 켜진 변형이 필요하다. 이번 세트는 정전 상태만 다룬다.

## 1. 복도 왼쪽 `corridor-1.png` (월드 x=0..1800)

1 캔버스 px = 1 월드 px. 소품 스프라이트: 화분 x=881..959, 로봇 충전 도크 x=1146..1215(높이 약 65), 냉온수기 x=1569..1631.

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the actual environment artwork, NOT a concept poster or screenshot. It is the LEFT piece of a long corridor that is assembled from three pieces.
Reference image 1 is the existing 17th-floor corridor. Use it ONLY as the architectural, material, lighting and pixel-art style reference. Do not copy its layout.
Create ONE landscape PNG, 1800 x 720 (ratio 2.5:1). Strict orthographic SIDE VIEW, camera exactly perpendicular to the corridor wall. NO vanishing point, NO isometric, NO perspective.
Setting: 12th floor of a Korean software-company tower, the floor of the AI development team that builds an AI called ARCHI. Midnight during a total building power outage. All ceiling lights, monitors and security cameras are OFF. Light comes only from faint city glow through glass and a tiny amber standby LED. Restrained atmospheric anime-inspired pixel art, crisp hard-edged pixel clusters, realistic adult scale. Palette: dark graphite gray and cool steel gray, clearly different from a blue-gray glass office and from a brown wood office. Mystery 80 percent, horror 20 percent: quiet, abandoned, uneasy, as if someone left in a hurry. Human sprite on screen is about 162 pixels tall; doors on this wall are about 320 pixels tall.
CRITICAL COLLISION GEOMETRY: the continuous, perfectly horizontal top edge of the walkable floor is at y=570 of this 720-high canvas (79.17 percent from the top), from extreme left to extreme right. All door bottoms sit exactly on this line. Below it is only a dark flat cutaway floor foundation with subtle horizontal slabs. Ceiling band y=0..60 with dark cable trays and switched-off linear light fixtures.
Composition across width (pixel x of this 1800-wide canvas):
x=0..32: plain structural end wall.
x=64..864: glass partition front of a dark open-plan developer office, from y=118 down to the floor. Slim graphite mullions about every 160 px, a horizontal frosted-glass band at mid height (about y=330..390). Behind the glass, dimly visible: rows of switched-off monitors on desks and the office's far windows with faint city lights. Centered in this front, ONE closed automatic sliding glass double door at x=374..554, top y=250, bottom y=570, thin graphite frame, vertical center seam, a small unlit motion-sensor box above it at y=222..236. Keep a plain unlettered wall strip above the whole front at y=60..110.
x=864..884: slim graphite column.
x=884..1790: plain graphite corridor wall with one thin horizontal steel rail at about y=400 and simple wall panel joints. Keep the lower wall x=884..1700, y=400..570 plain because furniture sprites stand there. One small unlit ceiling CCTV dome at about x=1400. A faint painted docking guide stripe on the wall base at x=1140..1220.
x=1790..1800: the left half of a plain concrete column (the next piece continues it).
No people, no monsters, no robots, no floor-standing furniture, no plants, no water cooler, nothing in the walk lane, no UI, no border, no watermark, no captions, no logos, no readable letters or numbers anywhere. Opaque PNG. Output only the finished background.
```

## 2. 복도 가운데 `corridor-2.png` (월드 x=1800..3548)

캔버스 x = 월드 x − 1800. 엘리베이터 오버레이 월드 x=1818..2036, 2148..2362, 2444..2660(y=220..570), 층 표지판 x=2694..2774, 계단 오버레이 x=2906..3086(y=232..570). 엘리베이터 층 표시 DOM이 y≈188에 붙는다.

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the MIDDLE piece of a long corridor assembled from three pieces.
Reference image 1 is the existing 17th-floor corridor: style, materials, lighting and the look of the elevator lobby only. Reference image 2 is the left piece of this same corridor: match its palette, wall panels, ceiling band and the concrete column at its right edge exactly.
Create ONE landscape PNG, 1748 x 720 (ratio about 2.43:1). Strict orthographic SIDE VIEW, camera perpendicular to the wall, NO vanishing point, NO isometric, NO perspective.
Setting: 12th floor, AI development team floor of a Korean software-company tower, midnight, total power outage, all lights and screens OFF. Dark graphite and cool steel gray, restrained anime-inspired pixel art with crisp hard pixel clusters. Mystery 80 percent, horror 20 percent. Human sprite about 162 pixels tall.
CRITICAL COLLISION GEOMETRY: perfectly horizontal walkable floor top at y=570 of 720 (79.17 percent), full width, dark flat cutaway foundation below. Ceiling band y=0..60 matching reference image 2.
Composition across width (pixel x of this 1748-wide canvas):
x=0..10: the right half of the plain concrete column that ends reference image 2.
x=18..236, x=348..562, x=644..860: THREE shallow recessed elevator bays, each from y=220 to y=570, with simple brushed-steel frames about 8 px outside these rectangles. Inside each bay draw only a flat dark closed steel surface; the game overlays its own animated elevator doors exactly on these rectangles. Above each bay a plain dark strip at y=180..212 (the game draws floor indicators there). Small unlit call-button plates between the bays at about x=292 and x=603, y=370..410.
x=860..1106: plain graphite wall. Keep x=870..1000, y=130..350 completely empty (the game places a floor number sign there).
x=1106..1286: plain flat recess for the stairwell fire door from y=232 to y=570, flat dark surface only; the game overlays its own door. A small green running-man exit pictogram light above it at about y=196..220, no letters.
x=1286..1300: narrow plain wall.
x=1300..1740: solid front of a windowless model-evaluation lab, from y=118 down to the floor: perforated dark gray metal acoustic panels with tiny regular holes, a small dark observation window at x=1554..1704, y=182..272, a yellow-and-black hazard stripe along the wall base at y=552..570. ONE heavy gray steel security door at x=1360..1490, top y=244, bottom y=570, horizontal panel grooves, vertical pull handle near its right edge. A small card reader mounted on the wall just right of the door at x=1498..1518, y=364..396 with one dim red LED. Keep a plain unlettered strip above the front at y=60..110.
x=1740..1748: the left half of a plain concrete column (the next piece continues it).
No people, no robots, no floor-standing furniture, nothing in the walk lane, no UI, no border, no watermark, no captions, no logos, no readable letters or numbers except the running-man pictogram. Opaque PNG. Output only the finished background.
```

## 3. 복도 오른쪽 `corridor-3.png` (월드 x=3548..5000)

캔버스 x = 월드 x − 3548. 화장실 CSS 금속문 월드 x=3612..3757(y=210..570), 팀장실 문 x=4700..4828(y=262), 화분 스프라이트 x=4871..4949.

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the RIGHT piece of a long corridor assembled from three pieces.
Reference image 1 is the existing 17th-floor corridor extension: style, materials and lighting only. Reference image 2 is the middle piece of this same corridor: match its palette, ceiling band and the concrete column at its right edge exactly.
Create ONE landscape PNG, 1452 x 720 (ratio about 2:1). Strict orthographic SIDE VIEW, camera perpendicular to the wall, NO vanishing point, NO isometric, NO perspective.
Setting: 12th floor, AI development team floor of a Korean software-company tower, midnight, total power outage, all lights OFF. Dark graphite and cool steel gray, restrained anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent. Human sprite about 162 pixels tall.
CRITICAL COLLISION GEOMETRY: perfectly horizontal walkable floor top at y=570 of 720 (79.17 percent), full width, dark flat cutaway foundation below. Ceiling band y=0..60 matching reference image 2.
Composition across width (pixel x of this 1452-wide canvas):
x=0..8: the right half of the plain concrete column that ends reference image 2.
x=8..734: restroom front wall, clean slightly worn pale gray-green rectangular tiles from y=118 to the floor. A plain flat dark metal recess at x=64..209 from y=210 to y=570 with a simple frame; the game overlays its own restroom door here. Small male and female pictograms on the wall above it at about y=160..196, no letters.
x=734..782: square concrete column.
x=782..1302: glass wall of the team lead's private office from y=148 to the floor, graphite frame, the glass fully covered by CLOSED horizontal venetian blinds with thin slivers of darkness between slats. ONE glass door covered by the same closed blinds at x=1152..1280, top y=262, bottom y=570, light warm-wood door trim, a lever handle with a small keyhole below it on the left side of the door. Keep a plain unlettered strip above the front at y=60..110.
x=1302..1420: plain graphite wall, lower part kept plain (a potted plant sprite stands there).
x=1420..1452: plain structural end wall.
No people, no robots, no floor-standing furniture, nothing in the walk lane, no UI, no border, no watermark, no captions, no logos, no readable letters or numbers except the restroom pictograms. Opaque PNG. Output only the finished background.
```

## 4. 개발실 왼쪽 `dev-1.png` (개발실 월드 x=0..1800)

출구는 x=1550..1730(y=250), 복도와 같은 자동문이다. 소품 스프라이트: 화분 x=61..139, 캐비닛 x=184..336, 책상 3개 x=394..1246, 복합기 x=1345..1455.

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. This is the LEFT piece of a wide room interior assembled from two pieces.
Reference image 1 is the existing 17th-floor office interior. Use it ONLY as the architectural, material, lighting and pixel-art style reference. This is a DIFFERENT room: the open-plan office of the AI development team that builds the AI called ARCHI, on the 12th floor, seen from inside after entering from the corridor.
Create ONE landscape PNG, 1800 x 720 (ratio 2.5:1). Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point. Unobstructed cutaway view into the room.
Midnight during a total power outage: every ceiling light, monitor and wall screen is OFF. Light comes only from the cool city glow through the rear windows and one faint green emergency exit pictogram. Dark graphite and cool steel gray. Detailed restrained anime-inspired pixel art, crisp hard pixel clusters. Quiet, abandoned, mystery 80 percent horror 20 percent.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw desks, chairs, monitors on desks, cabinets, copiers, plants or any floor-standing furniture. The game places those as separate sprites in front of the rear wall.
Layout (pixel x): x=0..32 plain end wall. x=60..1480 a long band of tall rear windows from y=90 to y=400 showing a distant Korean city at midnight, graphite mullions about every 240 px, blinds partly lowered on some panes; below the windows a plain low graphite wall and baseboard down to the floor, kept simple because furniture sprites stand there. x=1550..1730 the closed automatic sliding glass double door we came in through, in the rear wall, top y=250, bottom y=570, thin graphite frame, vertical center seam, a small unlit motion-sensor box above it at y=222..236, a small green running-man exit pictogram above that. x=1780..1800 the left half of a plain concrete column (the next piece continues it). Ceiling band y=0..60 with a cable tray, switched-off linear pendant lights and one unlit CCTV dome at about x=900.
Geometry: the walkable floor top is one perfectly straight horizontal line at y=570 of the 720-high canvas (79.17 percent), full width; the door bottom sits on it. Below it a dark flat floor foundation cutaway with subtle horizontal slabs. Door about 320 px high; human height about 162 px.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```

## 5. 개발실 오른쪽 `dev-2.png` (개발실 월드 x=1800..3280)

캔버스 x = 월드 x − 1800. 소품 스프라이트: 화이트보드 월드 x=1815..2165(윗면 y≈406), 책상 3개 x=2274..3126, 냉온수기 x=3169..3231.

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. This is the RIGHT piece of a wide room interior assembled from two pieces.
Reference image 1 is the existing 17th-floor office interior: style, materials and lighting only. Reference image 2 is the left piece of this same room: match its palette, window band height, ceiling band and the concrete column at its right edge exactly.
Create ONE landscape PNG, 1480 x 720 (ratio about 2:1). Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point.
Same room: the open-plan office of the AI development team on the 12th floor, midnight, total power outage, everything switched OFF. Dark graphite and cool steel gray, restrained anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw desks, chairs, whiteboards on stands, water coolers, plants or any floor-standing furniture.
Layout (pixel x): x=0..20 the right half of the plain concrete column that ends reference image 2. x=150..550 a large wall-mounted performance dashboard display, switched off, black glass with a faint reflection, from y=140 to y=320, no content on it. x=600..1440 tall rear windows from y=90 to y=400 with city lights, graphite mullions about every 240 px; below them a plain low wall down to the floor. x=1448..1480 plain end wall. Ceiling band y=0..60 continuing reference image 2, with one unlit CCTV dome at about x=1000.
Geometry: walkable floor top is one perfectly straight horizontal line at y=570 of the 720-high canvas (79.17 percent), full width, dark flat foundation cutaway below. Human height about 162 px.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```

## 6. 모델 평가실 `eval.png` (월드 x=0..1804)

출구는 x=344..474(y=244), 복도와 같은 보안문이다. 소품 스프라이트: 서버 랙 x=62..158, 네트워크 랙 x=182..278, 평가 벤치 x=630..891(윗면 y≈450), 계측 카트 x=944..1057, 서버 랙 2대와 냉각기 x=1192..1508, UPS x=1581..1739.

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. Create ONE room INTERIOR background.
Reference image 1 is the existing 17th-floor office interior. Use it ONLY as the material, lighting and pixel-art style reference. This is a DIFFERENT, windowless room: the model-evaluation lab of the AI development team on the 12th floor, where test servers and measurement benches for the AI called ARCHI are kept.
Create ONE landscape PNG, 1804 x 720 (ratio about 2.5:1). Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point.
Midnight during a total power outage: all lights and screens OFF. No windows at all. Light comes only from one green running-man exit pictogram above the door, a dim red LED on a card reader and a tiny amber standby LED on a wall panel. Dark graphite and cool steel gray, cold and technical. Detailed restrained anime-inspired pixel art, crisp hard pixel clusters. Mystery 80 percent, horror 20 percent: humming silence, too many cables.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw server racks, benches, carts, UPS cabinets or any floor-standing equipment; the game places those as separate sprites.
Layout (pixel x): the whole rear wall is perforated dark gray metal acoustic panels with tiny regular holes and panel seams about every 200 px, with a yellow-and-black hazard stripe along the wall base at y=552..570. x=0..32 plain end wall. x=344..474 the heavy gray steel security door we came in through, top y=244, bottom y=570, horizontal panel grooves, vertical pull handle near its right edge; a small card reader on the wall just right of it at x=482..502, y=364..396 with one dim red LED; a green running-man exit pictogram above the door at about y=200..228. x=600..920 a wall-mounted row of three switched-off test monitors from y=170 to y=290. x=1560..1640 a small wall-mounted control panel from y=250 to y=330 with one tiny amber standby LED. Ceiling band y=0..70 with overhead cable ladder trays and dark air ducts; bundles of cables drop down the wall behind x=60..280 and x=1190..1510 where racks will stand.
Geometry: walkable floor top is one perfectly straight horizontal line at y=570 of the 720-high canvas (79.17 percent), full width; the door bottom sits on it. Below it a raised access floor shown only in flat cutaway, perforated floor tile edges and dark cable space, no perspective. Door about 326 px high; human height about 162 px.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers except the running-man pictogram, no foreground occluders. Opaque background. Output only the finished game background.
```

## 7. 팀장실 `lead.png` (월드 x=0..2132)

출구는 x=1863..1991(y=262), 복도와 같은 블라인드 문이다. 소품 스프라이트: 화분 x=61..139, 진열장 x=225..336(높이 약 176), 캐비닛 x=414..566, 소파 x=735..985, 팀장 책상 x=1234..1486, 화분 x=1661..1739, 냉온수기 x=2029..2091.

```text
Use case: stylized-concept
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. Create ONE wide room INTERIOR background.
Reference image 1 is the existing 17th-floor office interior. Use it ONLY as the architectural, material, lighting and pixel-art style reference. This is a DIFFERENT room: the private office of the AI development team lead on the 12th floor.
Create ONE landscape PNG, 2132 x 720 (ratio about 3:1). Strict orthographic side elevation, camera perpendicular to the rear wall, no isometric view, no vanishing point.
Midnight during a total power outage: all lights OFF. Light comes only from thin slivers of city glow between closed blinds and one faint green emergency exit pictogram. Graphite gray walls with a little warm light-wood trim, the most personal room on this floor but still cold. Detailed restrained anime-inspired pixel art, crisp hard pixel clusters. Quiet and slightly uneasy, mystery 80 percent horror 20 percent.
IMPORTANT: ARCHITECTURE AND WALL-MOUNTED ITEMS ONLY. Do NOT draw desks, chairs, sofas, display cabinets, file cabinets, plants or water coolers; the game places those as separate sprites.
Layout (pixel x): x=0..32 plain end wall. x=60..680 light warm-wood wall panels; a framed photograph with only vague shapes, no readable content, at x=440..580, y=190..290; a small empty wall shelf at x=150..330, y=250..262. x=700..1780 tall windows from y=90 to y=400 fully covered by CLOSED horizontal venetian blinds, thin slivers of city light between slats; below them a plain low wall down to the floor. x=1863..1991 the glass door we came in through, covered by the same closed blinds, top y=262, bottom y=570, light warm-wood trim, a lever handle with a small keyhole below it on the left side of the door; a green running-man exit pictogram above it at about y=220..244. x=2020..2100 plain wall with one coat hook. Ceiling band y=0..60 with switched-off recessed downlights.
Geometry: walkable floor top is one perfectly straight horizontal line at y=570 of the 720-high canvas (79.17 percent), full width; the door bottom sits on it. Below it a dark flat floor foundation cutaway with subtle horizontal slabs. Door about 308 px high; human height about 162 px.
No characters, no robots, no UI, no captions, no logos, no watermarks, no legible text or numbers, no foreground occluders. Opaque background. Output only the finished game background.
```
