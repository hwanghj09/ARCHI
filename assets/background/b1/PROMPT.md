# B1 방재 관제실 실내 배경

- 생성 도구: 내장 `image_gen` (기존 배경을 참조해 실내 마감 수정).
- 현재 게임 적용본: `control-room-v4.png`, 2033×774, 불투명 RGB PNG. 이전 버전(`control-room.png`, `-v2`, `-v3`)은 게임에서 쓰지 않아 지웠다. 아래 기록은 각 버전을 만든 과정이다.
- 용도: `b1-control`의 월드 실내 배경. CCTV 조사 확대 이미지(`assets/objects/b1/cctv-wall.png`)와는 별도 에셋이다.
- 스타일 참고: `../../objects/b1/control-door.png`의 푸른 유리문과 사용자 제공 관제실 사진의 청색 조명·모던한 마감. 사진 속 콘솔·화면·설비는 옮기지 않았다.
- 별도 레이어: 기존 출입문 에셋(`../../objects/b1/control-door.png`), CCTV 모니터 벽(`x=1117..1536`, `y=147..426`), BMS 콘솔, 책상, 승강기 제어반은 게임이 그리므로 배경에서 제외했다.

## v4 문 분리

- `control-room-v3.png`에서 그려진 푸른 유리문·문틀·손잡이·출입 리더를 지우고, 그 자리를 연속된 청회색 벽 패널과 걸레받이로 채웠다. 바닥의 문 전용 반사도 제거했다.
- 배경 구도와 바닥선은 유지한다: 출력 2033×774, 벽·바닥 경계 `y≈503`, 배율 `570/503`, `left=-154`.
- `b1-control`은 `backgroundWallsOnly: true`로 별도 문 스프라이트를 표시한다. `exitOutline` 수동 좌표는 제거해 실제 문 에셋 크기로 표시한다. B1 벽 전용 배경의 색 보정은 끄고 원래 푸른 색감을 유지한다.

```text
Use case: precise-object-edit. In control-room-v3.png, remove only the painted blue-glass door, frame, handle and green reader around source x=814..918, y=220..503. Extend the adjacent blue-gray wall panels and horizontal baseboard across the opening, and continue the large tile floor naturally. Preserve the original canvas, lighting, floor line, empty CCTV wall and all other architecture. Draw no door or new objects; the game overlays the existing control-door.png sprite.
```

## v3 수정 내용과 좌표 (이전 버전 기록)

- 기존 대형 검은 CCTV 장착면과 테두리를 모두 없애고, 별도 CCTV 설비 뒤를 연속된 청회색 벽 패널로 만들었다. 3:2 모니터 벽 자체는 기존 크기를 유지한다.
- 노출 배관·안전선·녹색 에폭시 바닥을 없애고, 절제된 청색 간접 조명과 큰 무광 청회색 타일 바닥으로 바꿨다. 책상과 콘솔은 추가로 그리지 않았다.
- 원본의 벽·바닥 경계와 출입문 아래끝은 약 `y=503`. `s=570/503`, `left=-154`로 배치해 바닥을 `floorY=570`에 맞춘다. 원본 문은 약 `x=814..918`, `y=220..503`이며 화면에서는 약 `x=768..886`, `y=249..570`이다.
- 연결값: `backgroundImage: { src: 'assets/background/b1/control-room-v3.png', left: -154, width: 2034 * 570 / 503, height: 773 * 570 / 503, top: 0 }`. 출입문 테두리: `[768, 249, 118, 321]`.

### v3 이미지 수정 프롬프트

입력 1은 `control-room-v2.png`, 입력 2는 사용자가 제공한 청색 관제실 분위기 사진, 입력 3은 `../../objects/b1/control-door.png`. 입력 2는 **색감·재질·조명만** 참고한다.

```text
Keep the extra-wide orthographic side-elevation game background and the single approved blue-glass door. Remove the entire oversized dark CCTV mounting recess and any frame; leave a clean continuous blue-gray wall so a separate 3:2 monitor fixture can be overlaid. Redesign the room as an understated modern office-like control room with pale blue-gray wall panels, restrained cyan ceiling light, and large matte blue-gray floor tiles. Remove warehouse pipes, junction boxes, grime, yellow safety paint, and green epoxy flooring. Do not copy consoles, chairs, dashboards, wall screens, or other objects from the mood reference. Draw no monitors, desks, characters, text, or extra props. Keep the door aligned to the game exit and the wall-floor line aligned to the game floor.
```

## v2 게임 좌표 정렬 (이전 버전 기록)

픽셀 스캔으로 잰 원본의 바닥 구조: 벽과 바닥이 만나는 어두운 이음선 y=521, 그 앞 초록 띠 y 522~526, 노란 안전선 y 527~530, 초록 에폭시 바닥 y 531~611, 앞쪽 끝선 y≈612. 그림 속 문 아래끝은 y≈518이다. 복도와 같은 규칙(문 아래끝 = 발 높이)으로 **벽·바닥 이음선(y=521)을 충돌 바닥선 `floorY=570`에 딱 맞춘다.** 위쪽 끝을 비우지 않으려고 배율을 그에 맞춰 키우고, 방 폭(1892)보다 넓은 만큼은 좌우를 잘라 낸다.

```text
s = 570 / 521 = 1.09405
표시 크기 = 2034 × s × 773 × s = 2225.3 × 845.7, top 0 (아래 126px은 화면 밖)
그림 속 문 가운데 원본 x 880 → 962.8. 출구 판정 가운데(775 + 104/2 = 827)에 맞추려면 left = 827 − 962.8 = −135.8 → −136
```

연결값(js/floors/floor-b1.js의 `b1-control`): `backgroundImage: { src: 'assets/background/b1/control-room-v2.png', left: -136, width: 2034 * 570 / 521, height: 773 * 570 / 521, top: 0 }`. 오른쪽은 약 2089까지 그려져 방 끝(1892)을 넘는다.

| 요소 | 원본 좌표(실측) | 표시 좌표 | 게임 설정 |
| --- | --- | --- | --- |
| 출입문 | x≈826..934, y≈230..518 | x≈768..886, y≈252..567 | 판정은 복도 문 비율 그대로 `exitDoorX(...)=775`, 폭 104. 테두리는 `exitOutline: [768, 252, 118, 315]` |
| CCTV 장착면(테두리 포함, 실측) | x 1052..1623, y 134..389 | x 1015..1640, y 147..426 | 모니터 벽은 장착면 중앙 x=1117..1536, y=147..426에 419×279로 놓는다 |
| 책상 소품 | — | x 1201..1453 | 모니터 벽 가운데(1327) 아래로 옮김 |

배경에는 문이 칠해져 있어서, 아트 모드(`#dynamic-scene[data-art="true"]`)에서는 복도용 문 그림(`control-door.png`)을 얹지 않는다(index.html의 utility 문 규칙). CCTV 모니터 벽은 어두운 장착면 중앙에 놓는다. 원본 전체 이미지가 1536×1024(3:2)이므로 설비도 419×279(약 3:2)로 두어 각 칸이 원본의 약 1.6:1 비율을 유지한다. 장착면 전체 폭 625px에 맞춰 설비를 늘리면 각 칸이 약 2.5:1로 보인다. 소품(BMS 콘솔·책상·승강기 제어반)은 다른 아트 방처럼 `brightness(.68)`로 어둡게 맞춰진다.

## 최초 생성 프롬프트

```text
Use case: stylized-concept.
Asset type: PRODUCTION ROOM INTERIOR BACKGROUND for ARCHI, a 2D side-scrolling Korean software-company mystery/horror web game. This is the game world backdrop behind separately animated and interactive objects, NOT a concept illustration, not a screenshot, not a standalone CCTV closeup. A new image. Match the architectural pixel-art style of the 17F office interior and 12F lab background images shown in the conversation, and the worn B1 control-door material. The B1 control room is distinct from the 17F office: industrial facilities control room, emergency power on, no windows.

Create ONE fully opaque PNG exactly 1892x720, aspect ratio 2.63:1, full-bleed edge-to-edge. STRICT ORTHOGRAPHIC SIDE ELEVATION, camera perfectly perpendicular to the back wall. Every vertical line vertical, every horizontal line horizontal. No isometric angle, vanishing point, perspective floor, distant hallway, dramatic tilted camera, or letterbox bars.

Setting: B1 disaster-control room inside a Korean software tower at midnight. B1 is on emergency-generator power even while upper floors are dark. Cold fluorescent lights are ON. Unsettling but believable machine surveillance: an empty duty room where the controls still run themselves. Pixel art matching ARCHI: crisp hard-edged pixel clusters, detailed restrained anime-inspired industrial environment, desaturated utility green-gray and cold blue-gray, painted concrete, worn steel, exposed conduits, slight age and scuffing. Avoid painterly blur and photorealism. Small muted yellow safety paint and tiny green/amber status reflections only; no red horror lighting.

GAME GEOMETRY IS CRITICAL: continuous perfectly straight horizontal top edge of the walkable floor at source pixel y=570, all the way from left edge to right edge. Human player sprite will be about 162 px tall. Door about 320 px tall. The floor top is flat at y=570; below y=570..720 show only a dark, flat cutaway concrete/utility foundation with thin horizontal slab and cable-trench detailing. No receding floor tiles below the walking line. Ceiling band y=0..70 with exposed pipe runs, cable trays, dark ducts and three spaced cold fluorescent strip luminaires, ON. Full image area filled to all four edges with art, no margins.

Precise back-wall layout across x=0..1892:
- x=0..240: left end of enclosed control room, worn painted concrete and steel wall panels, some junction boxes and vertical conduit. The lower portion stays plain so a separate BMS control-console SPRITE at x≈270..530 can stand in front.
- x=240..650: green-gray rear wall, subtle vertical panel seams, cable runs high on wall; keep lower half largely clear behind the separately rendered BMS console.
- x≈775..879: ONE closed interior exit door back to the corridor, top y≈250 and bottom EXACTLY y=570. Metal framed industrial door, glazed upper pane of smoked blue-green safety glass and a modest metal kick plate; believable interior back of the approved B1 control-room door. No extra door. Leave enough empty wall on both sides for player interaction.
- x=920..1560: the physical back wall behind a separate dynamic CCTV MONITOR-WALL fixture. At x=1000..1480, y=100..420, place ONLY a dark flat recessed mounting zone / support rails with faint cold screen-glow spill around its edges. DO NOT DRAW ANY MONITOR SCREENS, rectangles of screens, video feeds, bezel grid, monitor console, or people here: the game overlays a separate animated nine-screen monitor fixture in exactly this region. Do not cover this mounting zone with pipes or lights. The lower wall in this region is clear for a separate office-desk sprite at x≈1114..1366.
- x=1560..1892: plain industrial wall and exposed vertical conduit, a small cable channel high up; leave x≈1655..1744 from mid-wall to the floor clear for a separate elevator-control-panel sprite.

Floor at y=570: utility green epoxy walking surface with one narrow yellow safety line painted horizontally along the back edge, straight throughout. The room may have restrained fluorescent pools of light and dark corners, but is visibly powered. The CCTV wall area should feel ominous through negative space and cold light, without depicting the separately overlaid monitors.

ARCHITECTURE AND WALL-MOUNTED NONINTERACTIVE DETAIL ONLY. No people, silhouettes, robots, ghosts, monsters, desks, chairs, floor-standing consoles, elevator panel, control panel, freestanding cabinets, monitor wall, individual monitor screens, text, labels, signage, logos, UI, watermark, frame, border, or objects blocking the player's foreground walking lane. Output only the finished game background.
```

## 위치 보정 프롬프트

```text
Precisely refine the supplied production background for the ARCHI B1 control room. Preserve the same extra-wide 2033x774 full-bleed side-elevation image, palette, pixel-art architecture, fluorescent lights, left-wall conduits, green epoxy floor, yellow safety line, flat horizontal foundation cutaway, and absence of people/furniture/monitors. Do not change its overall composition or create any new objects.

Make ONLY two geometry corrections for game overlay alignment:
1. The single exit door near the center-left should be narrower. Set its visible metal frame approximately from x=833 to x=946 in this 2033px-wide source image (about 113px wide), with its bottom remaining on the horizontal back-wall/floor line. Keep it the same worn metal door with smoked blue-green upper pane. Do not add another door.
2. The dark empty monitor mounting recess on the right should become a single clean, flat, uninterrupted dark rectangle approximately x=1075..1590 and y=110..455 in this source image. Its support rails may be thin and subtle, but do not form a fake screen grid. It will sit BEHIND a separately rendered dynamic 3x3 CCTV fixture, so this dark mount zone must have no monitor screens, no UI, no content, no labels, no bright lights or props. Keep the lower wall clear for an overlaid desk sprite.

Everything else pixel-for-pixel as close as possible. Strict orthographic, no perspective, no text, no people, no desks or consoles. Output only revised finished background.
```

## 푸른 실내·문 일치 보정 프롬프트

`control-room.png`을 수정 대상으로, `../../objects/b1/control-door.png`를 승인된 문 디자인 참고로 사용했다. 복도에서 보이는 전면 유리문과 실내의 작은 창 철문이 서로 달라 `control-room-v2.png`를 만들었다.

```text
Edit INPUT IMAGE 1, the B1 control-room background. INPUT IMAGE 2 is the APPROVED FRONT-FACING B1 CONTROL-ROOM DOOR reference, for the exact door design and its cold blue interior ambiance. The user noticed that the current gray room and small-window opaque gray door do not match what is visible from the B1 corridor. Correct that visual mismatch.

Preserve the existing image's production geometry as strictly as possible: 2033x773 fully opaque extra-wide pixel-art side-elevation background; same wall and ceiling layout, pipes, three ceiling luminaires, single door at exactly the same position and same outer frame dimensions near x≈826..934 and y≈230..520, dark empty CCTV mounting recess at exactly x≈1052..1623 and y≈134..389, yellow safety line and straight floor/foundation boundaries, no props or people. Do not move the door or dark monitor recess. Preserve the orthographic perpendicular side view, hard pixel clusters and full-bleed landscape format.

CHANGE THE DOOR'S APPEARANCE to match reference image 2: it is a dark charcoal brushed-metal frame with a FULL-HEIGHT broad blue-tinted safety-glass panel, not a painted solid metal slab with a small square window. Subtle translucent view toward the blue-lit B1 corridor through the glass. A quiet frosted horizontal band across the lower middle of the glass. A long slim vertical brushed-metal pull handle near its RIGHT edge, and a tiny green-lit access reader just to the right of the frame. Keep the same narrow overall in-world door size and exact location. This is the inside face of the same physical door from reference 2, rendered at background scale; no extra door.

SHIFT THE ROOM AMBIANCE visibly cooler and BLUER to match the control-door reference's glimpse of the interior: smoky navy-blue / steel-blue wall shadows, cool blue-white fluorescent tubes, faint cyan-blue reflections on the walls and green epoxy floor, and a dim blue wash around the empty CCTV mounting area. Preserve the room's utility green-gray material identity and narrow yellow safety line; it should read as B1 under emergency power, not a different sci-fi room. The foreground floor and foundation remain flat and the room remains legible. Avoid gray-green dominance of input image 1. Do not put visible video feeds, screen grids or text into the dark CCTV mounting recess because the game overlays a dynamic 3x3 monitor wall there.

No people, silhouettes, desks, chairs, consoles, robots, extra monitors, signs, letters, logos, watermarks, frame, or perspective. Make the visual correction substantial but keep all architecture and game-placement coordinates fixed. Output only the corrected finished background.
```
