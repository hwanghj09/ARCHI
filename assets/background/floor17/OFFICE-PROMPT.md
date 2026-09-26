# Office interior background

- Tool: built-in image_gen.
- Reference: floor17.png, architectural and pixel-art style reference.
- Output: office-interior.png, generated original 2172x724 PNG.
- Integrated as a 2400px-wide office, with source floor y=504 aligned to world y=570 using uniform CSS scaling.
- Only the first corridor office door leads to this room. E at the interior door returns to that entrance. The second corridor door was replaced with fixed glazing in the background. Furniture remains background art; the foreground lane has floor and boundary collisions.

## 문 위치 정렬 (office-interior-aligned.png)

복도 그림(`floor17.png`)에서 사무실 유리벽은 x=32..1555, 문은 x=580..708이라 문 왼쪽에 벽면의 39%가 있고 켜진 책상도 문 왼쪽에 보인다. 원본 `office-interior.png`는 문이 왼쪽 끝에 붙어 있어 안팎이 달랐다. 새로 그리지 않고 원본 픽셀을 창 기둥·책상 사이에서 잘라 순서만 바꿨다(보간 없음, 2196×724).

| 순서 | 원본 x | 폭 | 내용 |
| --- | --- | ---: | --- |
| 1 | 0..22 | 22 | 왼쪽 끝벽 |
| 2 | 273..1015 | 742 | 창 1~3번 칸, 책상 2개(켜진 모니터·스탠드), 화분 |
| 3 | 1322..1337 | 15 | 창틀 오른쪽 끝(잘린 창을 닫음) |
| 4 | 22..282 | 260 | 카드 리더·유리문·화분·왼쪽 창틀 |
| 5 | 1015..2172 | 1157 | 나머지 창·책상, 화이트보드, 책장, 회의 테이블, 시계 |

- 게임 폭 2400px(가로 배율 2400/2196), 세로는 기존과 같이 원본 y=504를 월드 y=570에 맞춘다.
- 월드 좌표: 출구 x=895..1039(문 왼쪽 벽 비율 0.394, 복도 0.393), 켜진 컴퓨터 x=612..700, 시작 위치 x=656, 입장 위치 x=986.
- 원본 `office-interior.png`는 `index-local.html`이 계속 쓰므로 그대로 둔다.

## Generation prompt

Use case: stylized-concept.
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. Create ONE wide office INTERIOR background, 2304x768 landscape panorama, 3:1 aspect ratio.
Reference image 1 is the existing 17th-floor corridor. Use it ONLY as the architectural, material, lighting and pixel-art style reference. This new scene is INSIDE the software development office seen through those corridor windows, viewed after entering it. Remove the corridor-facing glass wall from the camera view: unobstructed cutaway view into the room, not another corridor or facade.
Strict orthographic side elevation, camera perpendicular to the rear wall, parallel horizontal/vertical architecture, no isometric view, no central vanishing point, no hallway receding into depth. Detailed restrained pixel art matching the reference, realistic adult character proportions, crisp hard pixel clusters, readable muted gray and green-gray furniture with cool nighttime windows and a few small warm task lamps. Midnight Korean software-company office, quietly unsettling and abandoned, mystery 80 percent horror 20 percent, no overt horror creatures.
Layout: left end a closed glass office exit door in the rear wall with metal frame and small access reader, returning to the corridor. Across center-left and center: three believable programmer workstations behind the walking lane, desks, monitors (most off, ONE dim pale-teal screen), keyboards, office chairs tucked in, modest papers and one coffee mug. Broad rear windows show a distant city at midnight with blinds partly lowered. Center-right: whiteboard with faint unreadable diagram marks, low filing cabinets and shelves with binders. Right end: a compact meeting table with two tucked-in chairs and a wall clock. Modest cable trays and fluorescent fixtures at the ceiling; mostly off. A single amber desk lamp is a visual focal point. The important objects must remain visible, not buried in black shadow.
Geometry: continuous walkable floor top is one perfectly straight horizontal line at y=570 of the 768-high canvas (74.2 percent of height), full width. Door bottom and furniture feet align to this baseline. Bottom 198 pixels are dark building foundation cutaway with subtle horizontal slab detailing, no basement room. All furniture belongs in the rear layer, leaving the entire foreground lane free for a separately rendered player. Door approx 300px high; human rendered height approx 162px. Ceiling top band about 100px high. Room spans entire image edge to edge; no decorative frame.
No characters, no silhouettes of people, no robots, no UI, no captions, no logos, no watermarks, no legible text, no arrows, no labels, no foreground occluders. Opaque background. Output only the finished game background.
