# 1층 로비 배경 프롬프트

- 대상 파일: `assets/background/floor1/corridor.png` (`FLOOR1_LAYOUT.backgroundImage`).
- 전체 폭(월드) = 5000px, 세로 720px, 바닥선 y=570(79.17%) — 12층/7층과 같은 "flat" 1:1 배경(문·엘리베이터·
  화장실까지 그림 자체에 다 그려져 있고, DOM은 위치·상호작용만 담당).
- 건물 공통 좌표(`BUILDING_CORE`, 모든 층 동일하게 맞춰야 per-floor 보정치가 필요 없다):
  엘리베이터 3대 x=1818/2148/2444(폭 218/214/216, 문 위 y=220~바닥 y=570), 비상계단 x=2906(폭180, y=232~570),
  화장실 문 x=3612(폭145, y=210~570, 화장실 전면 x=3556..4282).
- 로비 소품(안내 데스크 x=820 폭400, 화분 x=100/1040/1300, 대기 소파 x=1200 폭250, 정수기 x=3300, 화분 x=4900)은
  `FLOOR1_LAYOUT.props`의 DOM 스프라이트로 바닥 위에 따로 올라간다 — **소품이 놓일 자리 벽면에는 가구를
  그리지 말 것**(빈 바닥/벽으로 비워둔다). 안내 데스크 옆 경비 로봇은 상호작용 소품이 아니라 배경 그림에만
  고정으로 그려 넣는 연출용 디테일이다(기획.md: 1층은 "첫 경비 로봇 사건" 층 — 로봇은 평상시엔 가만히 서
  있다가 나중에 플레이어를 추격한다. 이 배경 그림은 그 "이전", 즉 정지 상태만 담는다).

## 2026-09-26 전면 재작성

기존 프롬프트(17층 프롬프트를 변형한 버전)를 참고하지 않고 처음부터 다시 썼다. 좌표는 전부 현재
`player.js`의 `BUILDING_CORE`/`FLOOR1_LAYOUT`을 그대로 따르며, 기존 그림에 있던 `elevatorOffsetX`/
`stairsOffsetX`/`restroomOverride` 같은 층별 보정치는 그림이 애초에 이 좌표에 맞게 나오면 필요 없어진다 —
새로 생성한 뒤에는 실측해서 저 보정치들을 지우거나 재조정할 것.

## 생성 프롬프트

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the actual environment artwork, NOT a concept poster or screenshot.
Create ONE very wide 5000 x 720 PNG. Strict orthographic SIDE VIEW, camera exactly perpendicular to a long ground-floor lobby wall. NO vanishing point, NO isometric, NO perspective corridor going into the distance. Continuous horizontal elevation, flat side-on lighting.
Setting: the GROUND-FLOOR LOBBY of a Korean software-company tower (17 floors above this one) at midnight, a few minutes into an unexplained building-wide power outage. Restrained atmospheric pixel art, realistic adult proportions (never chibi), anime-inspired character design consistent with a 256x256 pixel-art player sprite. Muted, desaturated cool palette — blue-gray and green-gray surfaces — with only a few small warm or emergency accent lights (a dim red LED, a pale green exit pictogram). Human sprite on screen is about 162px tall; door openings read as roughly 250-300px tall at this scale — use this to judge every object below, do not draw doors or furniture undersized relative to a person.
CRITICAL COLLISION GEOMETRY: the continuous, perfectly horizontal top edge of the walkable floor sits at y=570 pixels of this 720-tall canvas (79.2% down from the top), unbroken from the extreme left edge to the extreme right edge. Every doorway's bottom edge sits exactly on this same y=570 line — no steps, ramps, or level changes anywhere. Below y=570 is a flat dark cutaway floor foundation with structural piping, no objects, no perspective. The floor itself is a plain matte walkway — not glossy, not mirror-reflective, no reflections of lights or the glass entrance on it.
Composition across this 5000px width (each x range is a slice of the same continuous wall, left to right):
x=0..32: plain structural end wall (building corner pillar).
x=32..560: a tall glass entrance storefront with double glass doors leading outside. Through the glass: a distant, low-detail night skyline in silhouette — dark building shapes, a handful of sparse warm window lights, one tiny red aircraft-warning light. Keep it simple and flat, tinted by the glass; no rain, no wet reflections, no detailed street-level objects.
x=560..1020: a long reception/security desk facing the entrance, dark unlit monitor and a blank sign plate on the wall above it. Standing motionless at the right end of the desk, around x=950-1030: ONE powered-down security robot — simple boxy/humanoid utility chassis, matte dark gray, no face detail, head slightly bowed, a single tiny dim status light on its chest. It is doing nothing, not a person, no readable text on it, roughly human height using the scale above.
x=1020..1790: plain lobby wall and floor only — no painted furniture here, the game places a waiting area (sofa, potted plants) here as separate sprites. You may add a row of waist-high glass turnstile security gates around x=1350..1700, paddles closed, one tiny dim red LED per gate, as a fixed architectural feature (not a game prop).
x=1790..1818: plain wall (structural gap before the elevator bank).
x=1818..2036: elevator 1, closed metal double doors filling this whole 218px-wide slot, small header display panel above the doors, a header light fixture above that, door bottom exactly at y=570, door top at y=220.
x=2036..2148: plain wall with a small call-button panel and a tiny dim LED (gap between elevator 1 and 2 — keep this gap noticeably narrower than the doors themselves).
x=2148..2362: elevator 2, IDENTICAL 214px width and the same height as elevator 1.
x=2362..2444: plain wall with a call-button panel (gap between elevator 2 and 3, same narrow width as the other gap).
x=2444..2660: elevator 3, IDENTICAL 216px width and the same height as elevator 1.
x=2660..2906: plain wall, ceiling pipes and conduits, no furniture.
x=2906..3086: a stairwell fire door, same height as the elevators (top y=232, bottom y=570), a small dim green exit pictogram above it, 180px wide.
x=3086..3556: plain lobby wall with a shallow alcove around x=3260-3340 (the game places a freestanding water cooler there as a separate sprite — do not paint one).
x=3556..4282: a restroom front, cool gray-teal matte tile wall (fine tile grid, no gloss), a clearly different material from the lobby wall around it.
x=3612..3757: ONE plain metal restroom door within that tile front, a small wall lamp above it, top y=210, bottom y=570.
x=4282..4968: plain lobby wall, a small framed blank building-directory board around x=4400-4600, no furniture near x=4900 (the game places a potted plant there separately).
x=4968..5000: plain structural end wall.
All three elevator doors must be the exact same width and height as each other — double check before finalizing, none may be narrower or shorter than the others. Use a consistent pixel grid, precise hard-edged pixel art, subtle material wear, readable dark midtones, dark foreground floor. No large readable lettering anywhere; small pictograms (exit sign, restroom icon) are fine, everything else left blank — the game draws its own labels and hint text on top. No people other than the one motionless security robot, no other robots, no monsters, no rain, no UI, no border, no watermark, no captions. Output only the finished background.
```

## 2026-09-26 4구역 분할로 전환

위 5000×720(6.94:1) 프롬프트를 실제 image_gen 도구에 넣었더니 2172×724(약 3:1)로 잘려 나왔다 — 도구가
극단적으로 넓은 비율을 못 받는다. 12층이 같은 문제를 겪고 "복도 4구역 분할 생성"으로 전환한 것과 같은
이유로, 1층도 4구역으로 나눈다(`GENERATED.md`의 12층 기록 참고). 나눈 기준은 room-content 블록 경계이자
전부 민무늬 벽인 지점(구역 경계에서 이음매가 안 보이게):

| 구역 | x 범위(월드) | 폭 | 비율 | 내용 |
| --- | --- | ---: | ---: | --- |
| A | 0..1818 | 1818 | 2.53:1 | 출입구+안내 데스크+경비 로봇+대기 공간+회전문 |
| B | 1818..3086 | 1268 | 1.76:1 | 엘리베이터 3대 + 비상계단 |
| C | 3086..4282 | 1196 | 1.66:1 | 정수기 벽감 + 화장실 |
| D | 4282..5000 | 718 | 1.00:1 | 안내판 + 화분 벽감 + 끝벽 |

전부 3:1 이하라 위에서 실측된 도구 상한(약 3:1) 안에 들어온다. 각 구역은 세로 720px로 요청해서(바닥선
y=570 그대로) 합성 스크립트가 세로 배율 없이 가로만 맞추면 되게 했다. 네 장을 받으면 `scripts/`에
`compose-floor12-corridor-zones.ps1`을 본떠 1층용 합성 스크립트를 새로 작성 — 문 좌우 픽셀을 실측해서
앵커를 정하고 5000×720 캔버스에 붙인다(정확한 방법은 그 스크립트와 12층 `GENERATED.md`의 "복도 4구역
분할 생성" 절 참고).

아래 네 프롬프트는 각각 독립적으로 실행 가능하도록 스타일 문장을 반복하고, 구역 경계가 항상 민무늬 벽에서
끊기도록 양 끝에 여유 벽면을 넣었다.

### 구역 A (출입구~회전문, 1818x720)

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the actual environment artwork, NOT a concept poster or screenshot.
Create ONE 1818 x 720 PNG. Strict orthographic SIDE VIEW, camera exactly perpendicular to a ground-floor lobby wall. NO vanishing point, NO isometric, NO perspective going into the distance.
Setting: the GROUND-FLOOR LOBBY of a Korean software-company tower at midnight, a few minutes into a building-wide power outage. Restrained atmospheric pixel art, realistic adult proportions (never chibi), anime-inspired character design consistent with a 256x256 pixel-art player sprite. Muted, desaturated cool blue-gray/green-gray palette, only small warm or emergency accent lights. Human sprite on screen is about 162px tall; door openings read as roughly 250-300px tall at this scale.
CRITICAL COLLISION GEOMETRY: the continuous, perfectly horizontal top edge of the walkable floor sits at y=570 pixels of this 720-tall canvas, unbroken from the extreme left edge to the extreme right edge. Below y=570 is a flat dark cutaway floor foundation, no perspective. The floor is a plain matte walkway, not glossy, no reflections.
Composition across this 1818px width, left to right:
x=0..32: plain structural end wall (building corner pillar).
x=32..560: a tall glass entrance storefront with double glass doors leading outside. Through the glass: a distant, low-detail night skyline in silhouette, a few sparse warm window lights, one tiny red aircraft-warning light. Keep it simple and flat, no rain, no wet reflections.
x=560..1020: a long reception/security desk facing the entrance, dark unlit monitor, a blank sign plate on the wall above it. Standing motionless at the right end of the desk, around x=950-1030: ONE powered-down security robot — simple boxy/humanoid utility chassis, matte dark gray, no face detail, head slightly bowed, one tiny dim status light on its chest. Not a person, no readable text on it, roughly human height using the scale above.
x=1020..1790: plain lobby wall and floor only, no furniture painted here (the game adds a sofa and potted plants as separate sprites). Add a row of waist-high glass turnstile security gates around x=1350..1700, paddles closed, one tiny dim red LED per gate, as a fixed architectural feature.
x=1790..1818: plain wall (structural gap, this is the seam to the next zone — keep it completely blank).
No large readable lettering; everything blank except small pictograms. No people other than the one robot, no other robots, no monsters, no UI, no border, no watermark, no captions. Output only the finished background.
```

### 구역 B (엘리베이터+비상계단, 1268x720)

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the actual environment artwork, NOT a concept poster or screenshot.
Create ONE 1268 x 720 PNG. Strict orthographic SIDE VIEW, camera exactly perpendicular to a ground-floor lobby wall. NO vanishing point, NO isometric, NO perspective going into the distance.
Setting: the GROUND-FLOOR LOBBY of a Korean software-company tower at midnight, a few minutes into a building-wide power outage. Restrained atmospheric pixel art, realistic adult proportions (never chibi), anime-inspired character design consistent with a 256x256 pixel-art player sprite. Muted, desaturated cool blue-gray/green-gray palette, only small warm or emergency accent lights. Human sprite on screen is about 162px tall; door openings read as roughly 250-300px tall at this scale — do not draw the elevator or stair doors undersized relative to a person.
CRITICAL COLLISION GEOMETRY: the continuous, perfectly horizontal top edge of the walkable floor sits at y=570 pixels of this 720-tall canvas, unbroken from the extreme left edge to the extreme right edge. Every doorway bottom sits exactly on this line. Below y=570 is a flat dark cutaway floor foundation, no perspective. The floor is a plain matte walkway, not glossy, no reflections.
Composition across this 1268px width, left to right (this is the elevator bank, x=1818..3086 of the full lobby — treat x=0 here as world x=1818):
x=0..28: plain wall (seam from the previous zone — keep it blank, matching a plain corridor wall).
x=0..218: elevator 1, closed metal double doors filling this whole 218px-wide slot, small header display panel above the doors, a header light fixture above that, door bottom exactly at y=570, door top at y=220 (i.e. 350px tall).
x=218..330: plain wall with a small call-button panel and a tiny dim LED (gap between elevator 1 and 2 — keep this gap noticeably narrower than the doors themselves).
x=330..544: elevator 2, IDENTICAL 214px width and the same height as elevator 1.
x=544..626: plain wall with a call-button panel (gap between elevator 2 and 3, same narrow width as the other gap).
x=626..842: elevator 3, IDENTICAL 216px width and the same height as elevator 1.
x=842..1088: plain wall, ceiling pipes and conduits, no furniture.
x=1088..1268: a stairwell fire door, same height as the elevators (top y=232, bottom y=570), a small dim green exit pictogram above it, 180px wide, ending with a sliver of plain wall at the very right edge.
All three elevator doors must be the exact same width and height as each other — double check before finalizing. Use a consistent pixel grid, precise hard-edged pixel art, subtle material wear, readable dark midtones, dark foreground floor. No large readable lettering; small pictograms only. No people, no robots, no monsters, no UI, no border, no watermark, no captions. Output only the finished background.
```

### 구역 C (정수기 벽감+화장실, 1196x720)

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the actual environment artwork, NOT a concept poster or screenshot.
Create ONE 1196 x 720 PNG. Strict orthographic SIDE VIEW, camera exactly perpendicular to a ground-floor lobby wall. NO vanishing point, NO isometric, NO perspective going into the distance.
Setting: the GROUND-FLOOR LOBBY of a Korean software-company tower at midnight, a few minutes into a building-wide power outage. Restrained atmospheric pixel art, realistic adult proportions (never chibi), anime-inspired character design consistent with a 256x256 pixel-art player sprite. Muted, desaturated cool blue-gray/green-gray palette, only small warm or emergency accent lights. Human sprite on screen is about 162px tall; the door here reads as roughly 250-300px tall at this scale.
CRITICAL COLLISION GEOMETRY: the continuous, perfectly horizontal top edge of the walkable floor sits at y=570 pixels of this 720-tall canvas, unbroken from the extreme left edge to the extreme right edge. The doorway bottom sits exactly on this line. Below y=570 is a flat dark cutaway floor foundation, no perspective. The floor is a plain matte walkway, not glossy, no reflections, no tile pattern outside the restroom section below.
Composition across this 1196px width, left to right (this is x=3086..4282 of the full lobby — treat x=0 here as world x=3086):
x=0..30: plain wall (seam from the previous zone, blank).
x=0..470: plain lobby wall with a shallow alcove around x=174-254 (the game places a freestanding water cooler there as a separate sprite — do not paint one, leave it as plain recessed wall).
x=470..1196: a restroom front, cool gray-teal matte tile wall (fine tile grid, no gloss), a clearly different material from the plain lobby wall to its left.
x=526..671: ONE plain metal restroom door within that tile front, a small wall lamp above it, top y=210, bottom y=570, a small restroom pictogram on the door.
No large readable lettering. No people, no robots, no monsters, no UI, no border, no watermark, no captions. Output only the finished background.
```

### 구역 D (안내판+화분+끝벽, 718x720)

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the actual environment artwork, NOT a concept poster or screenshot.
Create ONE 718 x 720 PNG. Strict orthographic SIDE VIEW, camera exactly perpendicular to a ground-floor lobby wall. NO vanishing point, NO isometric, NO perspective going into the distance.
Setting: the GROUND-FLOOR LOBBY of a Korean software-company tower at midnight, a few minutes into a building-wide power outage. Restrained atmospheric pixel art, realistic adult proportions (never chibi), anime-inspired character design consistent with a 256x256 pixel-art player sprite. Muted, desaturated cool blue-gray/green-gray palette, only small warm or emergency accent lights.
CRITICAL COLLISION GEOMETRY: the continuous, perfectly horizontal top edge of the walkable floor sits at y=570 pixels of this 720-tall canvas, unbroken from the extreme left edge to the extreme right edge. Below y=570 is a flat dark cutaway floor foundation, no perspective. The floor is a plain matte walkway, not glossy, no reflections.
Composition across this 718px width, left to right (this is x=4282..5000 of the full lobby — treat x=0 here as world x=4282):
x=0..18: plain wall (seam from the previous zone, blank, matching the restroom tile's right edge fading back to plain lobby wall).
x=18..686: plain lobby wall. A small framed blank building-directory board mounted on the wall around x=118-318 (no readable text on it — the game overlays its own). No furniture painted around x=618 (the game places a potted plant there as a separate sprite).
x=686..718: plain structural end wall (the far corner of the lobby).
No large readable lettering. No people, no robots, no monsters, no UI, no border, no watermark, no captions. Output only the finished background.
```
