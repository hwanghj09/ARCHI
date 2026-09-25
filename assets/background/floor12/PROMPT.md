# 12층 픽셀아트 배경 프롬프트 (17·16층 그림 편집 방식)

- **복도 4구역 분할 생성 (2026-09-25, 현재 방식)**: 아래 "1~4. 복도 ..."(4장 편집)와 "복도 재작성"(한 장 워프)
  둘 다 폐기하고, 17층 확장부(`service-corridor.png`)처럼 **복도를 4구역으로 나눠 각각 실제 필요한 비율에 가깝게
  따로 생성**하는 방식으로 바꿨다. 정렬·합성 방법은 `GENERATED.md`의 "복도 4구역 분할 생성" 절과
  `scripts/compose-floor12-corridor-zones.ps1` 참고. 프롬프트는 아래 "구역 A~D". 방 내부 3장(개발실/성능평가실/
  휴게실)은 아래 5~7번 프롬프트로 만든 그림을 계속 쓴다(변경 없음).

## 구역 A — 개발실 전면 (1818×720)

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game.
Reference image is the existing 12th-floor corridor image already made for this game — match its exact pixel-art style, palette, material and lighting precisely. This is a continuation of the SAME wall, not a new building.
Create ONE PNG, EXACTLY 1818x720 pixels (or the closest the tool allows at this precise 2.525:1 aspect ratio — do not crop content to force a different ratio). Strict orthographic side view, no perspective, no vanishing point.
Floor walk-line perfectly horizontal at y=570 (79.17% down from top), dark flat foundation cutaway below it.
Composition across this 1818px width:
x=0..64 (0-3.5%): plain structural end wall.
x=75..170 (4-9%): a narrow glass display cabinet niche in the wall, empty trophy shelf silhouette.
x=250..1540 (14-85%): a wide glass studio front for the ARCHI development office, steel mullions, frosted band at two-thirds height, dark open office with faint desk silhouettes and city lights beyond.
x=1030..1170 (56.7-64.4%): ONE glass double door within that front, top y=280 (38.9%), bottom y=570, small badge reader with tiny red LED beside it, blank sign plate above.
x=1770..1818 (97-100%): start of a plain concrete column (this is where elevator 1 will continue in the next image — keep this edge as plain, featureless wall so the next piece can join seamlessly).
Cold desaturated blue-gray, midnight power outage, all lights off except city glow and one green emergency pictogram somewhere on the ceiling pipes. No text, no people, no robots, no floor furniture. Opaque PNG.
```

## 구역 B — 엘리베이터 3대 + 비상계단 (1282×720)

```text
Use case: stylized-concept
Reference image is the existing 12th-floor corridor image — match its exact style, palette and lighting. Continuation of the same wall.
Create ONE PNG, EXACTLY 1282x720 pixels (1.78:1 aspect). Strict orthographic side view, no perspective.
Floor walk-line perfectly horizontal at y=570 (79.17% down), dark flat foundation below.
Composition across this 1282px width:
x=0..218 (0-17%): elevator 1, closed metal door, header light above, bottom at y=570.
x=330..544 (25.7-42.4%): elevator 2, identical size and style to elevator 1.
x=626..842 (48.8-65.7%): elevator 3, identical size and style.
Small call-button panels in the plain wall between each pair of elevators.
x=940..1040 (73-81%): a narrow recessed wall niche, empty robot charging dock, one disconnected cable hanging.
x=1088..1268 (85-99%): a stairwell fire door, small green exit pictogram above it, door bottom at y=570.
All three elevator doors must be the SAME width as each other (this is important — do not make one visibly wider or narrower). Cold desaturated blue-gray, midnight power outage, ceiling pipes and conduits along the top. No text, no people, no robots. Opaque PNG.
```

## 구역 C — 성능 평가실 + 화장실 (1200×720)

```text
Use case: stylized-concept
Reference image is the existing 12th-floor corridor image — match its exact style, palette and lighting. Continuation of the same wall.
Create ONE PNG, EXACTLY 1200x720 pixels (1.67:1 aspect). Strict orthographic side view, no perspective.
Floor walk-line perfectly horizontal at y=570 (79.17% down), dark flat foundation below.
Composition across this 1200px width:
x=0..456 (0-38%): a laboratory glass front, thicker steel mullions, thin dark-red hazard stripe along the top edge, dim server racks and monitors visible through the glass.
x=190..350 (15.8-29.2%): ONE closed automatic sliding glass door within that front, split in the middle, small red LED status light, top y=260 (36.1%), bottom y=570.
x=456..1182 (38-98.5%): a restroom front, cool gray-teal tile wall, distinct material change from the lab glass.
x=512..657 (42.7-54.75%): ONE plain metal restroom door, small wall lamp above it, top y=210 (29.2%), bottom y=570.
Cold desaturated blue-gray, midnight power outage. No text, no people, no robots, no floor furniture. Opaque PNG.
```

## 구역 D — 개발자 휴게실 (700×720)

```text
Use case: stylized-concept
Reference image is the existing 12th-floor corridor image — match its exact style, palette and lighting. Continuation of the same wall, final segment (right edge is the building's end wall).
Create ONE PNG, EXACTLY 700x720 pixels (nearly square, 0.97:1 aspect). Strict orthographic side view, no perspective.
Floor walk-line perfectly horizontal at y=570 (79.17% down), dark flat foundation below.
Composition across this 700px width:
x=0..700: a developer lounge front, vertical dark wood-slat paneling across the whole width.
x=150..400 (21-57%): one large round porthole window, thick steel ring, dim lounge interior with sofa silhouette and city lights through it.
x=400..510 (57-73%): ONE closed door, small round vision window near the top, vertical handle bar, top y=280 (38.9%), bottom y=570.
x=680..700 (97-100%): plain structural end wall.
Cold desaturated blue-gray with slightly warmer wood-tone accents, midnight power outage. No text, no people, no robots, no floor furniture. Opaque PNG.
```

실제로 받은 그림들은 구역 A/B/C가 요청한 비율과 거의 같게 나왔고(각각 1991×789, 1673×940, 1619×971 —
목표 비율과 오차 1% 이내), 구역 D만 요청(0.97:1)보다 훨씬 넓게(1478×1064, 1.39:1) 나왔다. 그래서
`compose-floor12-corridor-zones.ps1`은 D만 바닥 높이 기준으로 확대하고 문 위치로 배치한다(위 GENERATED.md 참고).
- **적용 완료 (2026-09-24, 방 내부만 유효)**: 아래 7장을 생성해 `art-corridor-*.png`/`art-interior-*.png`로 저장했고,
  `scripts/compose-floor12-pixelart.ps1`로 `corridor.png`/`dev.png`/`lab.png`/`lounge.png`에 합성했다.
  적용 방식과 DOM 표지판 처리는 `GENERATED.md` 참고. **복도(`corridor.png`)는 위 항목대로 이후 다시 교체됐다.**
- 목적: 원래의 1:1 CSS 렌더(`corridor.png`, `dev.png`, `lounge.png`, `lab.png`)를 16·17층과 같은 분위기의 픽셀아트로 바꾼다.
- 1차 시도(2026-09-24): 12층 CSS 조각만 주고 "cold lab, blue-gray, moonlight"로 요청 → 전체가 남색 단색, 흐릿함, 따뜻한 도시 불빛 없음,
  배치도 무시됨. 다른 층과 분위기가 맞지 않아 폐기.
- 2차 방식: **이미지 1 = 승인된 17·16층 그림 조각을 편집 원본으로** 첨부해 화풍·색·밝기를 고정하고, **이미지 2 = 12층 CSS 조각**은
  문·벽 배치 참고로만 쓴다. 12층다움은 색이 아니라 건축 요소(유리 스튜디오 벽, 자동문, 둥근 창 벽)로 낸다.
- 도구: ChatGPT 이미지 생성(1536×1024). 7장, 한 장씩.
- 바닥선·좌표는 결과의 문 높이로 배율을 재서 제가 맞춘다. 바닥선이 **수평이기만 하면** 된다.
- 글자는 넣지 않는다. 방 표지판·"12F"는 적용할 때 DOM 글자를 다시 보이게 한다.

| # | 이미지 1 (편집 원본) | 이미지 2 (배치 참고) | 결과 파일 이름 |
| --- | --- | --- | --- |
| 1 | `reference/style-floor17-offices.png` | `reference/ref-corridor-dev.png` | `art-corridor-dev.png` |
| 2 | `reference/style-floor17-core.png` | `reference/ref-corridor-lab.png` | `art-corridor-lab.png` |
| 3 | `reference/style-floor17-core.png` | `reference/ref-corridor-restroom.png` | `art-corridor-restroom.png` |
| 4 | `reference/style-floor17-core.png` | `reference/ref-corridor-lounge.png` | `art-corridor-lounge.png` |
| 5 | `reference/style-floor16-interior.png` | `reference/ref-interior-dev.png` | `art-interior-dev.png` |
| 6 | `reference/style-floor16-interior.png` | `reference/ref-interior-lounge.png` | `art-interior-lounge.png` |
| 7 | `reference/style-floor16-interior.png` | `reference/ref-interior-lab.png` | `art-interior-lab.png` |

`style-*`는 `floor17/source.png`(x=0..1086, 1086..2172)와 `floor16/office.png`(x=150..1236)를 1536×1024로 확대한 조각이다.

## 공통 프롬프트 (매번 맨 앞에 붙인다)

```text
Edit input image 1. It is approved artwork from another floor of the SAME building in the same game (ARCHI, a 2D side-scrolling mystery/horror pixel-art game). The result must look like it was drawn by the same artist on the same day: keep its exact rendering style, pixel density, outline weight, color palette, brightness and contrast, wall material, ceiling with pale fluorescent fixtures and conduits, the thin pale baseline strip at the floor edge, the dark floor foundation with pipes below it, and the camera.
Keep the camera a strict orthographic side view, perpendicular to the wall, no perspective. Keep the floor line perfectly horizontal and at the same height as in input image 1. Keep the same framing and output size, 1536x1024 landscape.
Only replace the wall architecture as described below. Input image 2 is a rough flat layout sketch showing WHERE the new walls and doors go and their proportions (door width vs wall width). Use it for placement and proportions only; ignore its flat colors completely.
Palette rules: neutral mid-gray concrete and charcoal steel like input image 1, NOT a navy or blue monochrome image. Windows that face outside show the same lit night city as input image 1, with warm yellow window lights and small red aircraft lights. Glass toward dark rooms is dark gray with faint reflections. Keep one or two tiny red or green indicator LEDs as accents.
Midnight, power outage on this floor: interior screens are off, but the scene must keep the same readable mid-tones as input image 1, not darker.
No text, no letters, no numbers, no logos: any sign plate is blank. No people, no robots, no furniture in front of the wall, no UI, no border, no watermark.
```

## (폐기됨 — 복도는 GENERATED.md의 "복도 재작성" 프롬프트로 대체됨)

## 1. 복도 · ARCHI 개발실 전면

```text
Replace the offices in input image 1 with ONE wide glass studio front for an AI development office, spanning most of the image width as in input image 2.
Tall steel-framed glass wall with evenly spaced mullions; behind the glass, a dark open-plan developer office: rows of desks with dual unlit monitors, office chairs, a whiteboard, a plant, and the lit night city through the far windows, like input image 1.
A frosted privacy band across the glass at about two-thirds height (blank).
One glass double door with a thin center seam, placed where input image 2 shows it, with a small wall-mounted badge card reader with a tiny red LED just right of the door.
A blank sign plate above the wall, centered.
```

## 2. 복도 · 성능 평가실 전면

```text
Keep the plain concrete corridor wall of input image 1 on the left part of the image (this area will be covered by a stairwell door in game; keep it plain, no elevators).
Replace the rest with a narrower full-height laboratory glass front, placed and sized as in input image 2: steel frame, a thin dark-red warning stripe along its top edge, dark glass with faint diagonal reflections, silhouettes of test benches, a printer and server racks inside.
One closed automatic sliding glass door in it, split in the middle, placed as in input image 2, with a small blank status plate and a single dim red LED above it (power lost, locked).
A blank sign plate above the lab front, centered.
At the far right edge, the start of a dark tiled restroom wall.
```

## 3. 복도 · 화장실 전면

```text
Replace the wall with a restroom front placed as in input image 2: gray-teal ceramic tile wall with a fine tile grid and one horizontal trim line, slightly darker than the concrete.
One closed brushed-metal restroom door placed as in input image 2, with a vertical push plate near its right edge.
A blank sign plate above it. At the left edge the end of a laboratory glass wall; at the right edge the start of a slatted lounge wall. No elevators.
```

## 4. 복도 · 개발자 휴게실 전면

```text
Replace the wall with a developer lounge front placed as in input image 2: a solid wall of vertical dark teal-gray acoustic wood slats.
A large round porthole window with a thick steel ring, showing a dim lounge with a sofa and a vending machine silhouette and the lit night city beyond.
One closed gray steel door placed as in input image 2, with a small round vision window near the top and a vertical handle bar.
A blank sign plate above it. At the left edge the end of a tiled restroom wall; at the far right a plain concrete end column. No elevators.
```

## 5. 실내 · ARCHI 개발실 (출구 문 주변)

```text
Keep input image 1's room shell: ceiling, fluorescent fixtures, conduits, window band with blinds and the lit night city, wall panels, baseline strip and floor foundation.
Replace its door with a glass double door (thin center seam, steel frame) placed as in input image 2, and add a small badge reader with a tiny red LED beside it.
Make the window band continuous across the width with evenly spaced mullions so it can be repeated sideways. Remove the wall clock. Nothing in front of the lower wall: the game places desks there.
```

## 6. 실내 · 개발자 휴게실 (출구 문 주변)

```text
Keep input image 1's room shell and window band with the lit night city, but make the lower wall vertical dark teal-gray acoustic wood slats instead of concrete panels.
Replace its door with a gray steel door placed as in input image 2, with a small round vision window near the top and a vertical handle bar.
Evenly spaced window mullions so the wall can be repeated sideways. Remove the wall clock. Nothing in front of the lower wall: the game places a sofa, lockers and vending machines there.
```

## 7. 실내 · 성능 평가실 (출구 문 주변)

```text
Keep input image 1's ceiling, fixtures, conduits, baseline strip and floor foundation, but this room has NO windows: replace the whole window band with large dark gray metal wall panels with vertical seams, a cable tray and conduit runs near the top.
Replace its door with a closed automatic sliding glass door, split in the middle, placed as in input image 2, with a small blank status plate and one dim red LED above it.
Evenly spaced panel seams so the wall can be repeated sideways. Remove the wall clock. Nothing in front of the lower wall: the game places test benches and server racks there.
```
