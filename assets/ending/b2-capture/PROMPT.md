# B2 포획 · 실시간 2D 배드 엔딩

현재 연출은 원래 타격 4프레임만 유지하고, 이후 실제 게임 월드에서 쓰러진 수호를 따라가는 2D 카메라를 사용한다. 로봇이 양 발목을 잡고 이동하며, 힘이 풀린 양팔은 머리 너머 바닥으로 늘어진다. 새로 그린 끌림 4프레임을 150ms 간격으로 반복한다. 자막·대화창·위치 표시·업로드 패널은 표시하지 않는다.

- 타격: 0–2.15초, 기존 `robot-strike.png` 그대로 사용.
- 이동이 보이는 구간: 4.8–6.2초 / 8–9.2초 / 11.1–12.6초 / 14.6–15.9초. 사이 구간은 암전.
- 의자에 올리는 동작은 생략한다. 15.9–20.1초 암전 후 이미 의자에 눕혀진 자세로 나타난다.
- 연결: 20.1–22.3초 / 연결된 모습: 24.4–26.4초. 27.4초에 암전과 복귀 버튼만 남는다.
- 체크포인트·건너뛰기·모바일 세로 화면·모션 감소 설정을 지원한다.

| 게임 파일 | 규격 | 구성 |
| --- | --- | --- |
| `assets/ending/b2-capture/robot-strike.png` | 7680×1080 | 기존 타격 4프레임 |
| `assets/player/jeong-suho-drag-four.png` | 1280×256 | 320×256 셀 4개, 머리 위로 늘어진 팔의 끌림 동작 |
| `assets/player/jeong-suho-unconscious.png` | 768×256 | 기존 쓰러짐/들림/의자 자세. 현재 의자 자세만 사용 |
| `assets/objects/guard-robot/guard-transport.png` | 1536×256 | 끌기 2프레임, 들기(현재 미사용), 연결 자세 |

built-in ImageGen으로 제작했다. 원본·새 프롬프트는 `source/` 및 [source/PROMPTS.md](source/PROMPTS.md)에 보존한다. `scripts/prepare-b2-capture-sprites.mjs`가 알파 경계와 여백을 검증하고 nearest 보간으로 게임 시트를 만든다. 끌림 원본은 1254×1254의 2×2 셀이다. 신발 끝을 각 320px 셀의 x302, 신발 밑을 y220에 고정해 손목·어깨 움직임 때문에 로봇과 발목이 분리되지 않게 한다. 팔을 넣는 추가 여백은 렌더링 시 왼쪽으로 48px 확장한다.

코드: `js/scene/b2-capture-scene.js`, `css/b2-capture-scene.css`, `index.html`. 검증: `tests/b2-capture-scene.mjs` (아트 규격·알파·새 프레임·실제 월드 이동·암전·연결·카메라·입력 잠금·체크포인트 복귀·세로 화면).

## 이전 전체화면 시안 기록

아래는 타격 원본과 보존된 이전 시안의 프롬프트다. `drag-pov.png`, `upload-pov.png`는 현재 게임에서 사용하지 않는다.

## 최종 생성 프롬프트

### 타격 배경 최종 수정

참조: 기존 타격 2×2 원본(수정 대상), `assets/background/b2/b2-main-finished.png`(서버실 벽), `assets/objects/floor-kit/server-rack.png`(서버 랙). 아래 attack 프롬프트는 최초 픽셀 시안이며 이 수정 프롬프트를 최종 적용했다.

Precise background correction of FIRST input image, which is the selected ARCHI pixel-art first-person robot attack animation atlas. FIRST image is EDIT TARGET, second image B2 main server room gray wall palette reference, third image approved server-rack prop identity reference. Preserve exact TWO columns TWO rows equal-cell atlas, SAME pixel-art style, SAME four ivory guard robot identities, their sizes, positions, anatomy, head, wheels, arms, and four attack poses. KEEP the first-person arm raise → swing → padded gripper impact. Change ONLY the BACKGROUND IN ALL FOUR PANELS: this scene occurs INSIDE B2 ARCHI MAIN SERVER ROOM, NOT inside an elevator. Completely REMOVE elevator doors, elevator door seams, elevator handrails, elevator cabin walls, and confined elevator ceiling. Replace with a spacious underground MAIN SERVER ROOM: multiple tall graphite-black SERVER RACKS with tiny green and amber indicator lights framing both sides and in the back, thick bundled black network cables overhead, cool gray industrial wall panels and black tile floor matching B2 reference, one small dim RED emergency alarm light above rear server racks. Plenty of recognizable SERVER RACKS visible on both sides around robot in EVERY panel, not an elevator-sized alcove. Same eye-level camera and same consistent server-room background across all four frames. Do NOT change the robot or the attack action. No people, no first-person victim face, no blood, no gore, no text, no labels, no UI, no borders, no readable logos. Maintain crisp detailed muted anime-inspired PIXEL ART, no photorealism, no painterly blur. Opaque PNG, requested atlas3840x2160 with four1920x1080 cells; preserve exact 2x2 equal cells even if output resolution differs.

### attack

참조: `assets/objects/guard-robot/guard-capture.png`, `assets/background/elevator/cabin-b2-to-17.png`

ARCHI production asset. CRISP DETAILED MUTED ANIME-INSPIRED PIXEL ART with visible deliberate pixel clusters, fine dark outlines and controlled dithering like the supplied approved game sprites. Realistic adult proportions. Match referenced IVORY tapered guard robot, small squared sensor head, black visor with vivid red screen and two red lenses, graphite base with TWO LARGE SIDE DRIVE WHEELS, exactly TWO thin bilateral articulated gripper arms, one per opposite torso side. No legs, no treads, no bulky human-shaped chest, NO redesign. Midnight Korean office palette gray blue, ivory, restrained red. NO photorealism, NO 3D render, NO smooth painted surfaces, NO painterly blur, NO glow haze. No readable text, frame numbers, borders, watermark or UI. Asset: first-person knockout animation sprite atlas. Opaque background. EXACT 2 columns x2 rows, 3840x2160 canvas, each cell exactly1920x1080, NO gutters, equal cells read row-major. Each frame SAME CAMERA facing same guard robot directly, SAME background gray B2 server room, SAME scale. Viewer is Suho's eyes. NEVER draw Suho externally. Frame0 robot very close facing viewer one arm rests to side; Frame1 SAME robot lifts right arm up with bent elbow preparing to strike viewer's head; Frame2 SAME robot swings that raised metal forearm horizontally forward, gripper crossing toward viewer, robot head still behind it; Frame3 foreshortened round padded gripper very close to viewer's eye filling center, visibly landing knockout strike. Robotic arm is the blow, not gun/weapon. Clear anticipation, lift, swing, contact four distinct poses. Preserve background framing; crisp pixel contours even at contact, no motion blur. Non-graphic no blood. Fullscreen 16:9 landscape within each of four cells.

### drag

참조: `assets/objects/guard-robot/guard-capture.png`, `assets/player/jeong-suho-caught.png`, `assets/background/b2/b2-link-finished.png`

ARCHI production asset. CRISP DETAILED MUTED ANIME-INSPIRED PIXEL ART with visible deliberate pixel clusters, fine dark outlines and controlled dithering like the supplied approved game sprites. Realistic adult proportions. Match referenced IVORY tapered guard robot, small squared sensor head, black visor with vivid red screen and two red lenses, graphite base with TWO LARGE SIDE DRIVE WHEELS, exactly TWO thin bilateral articulated gripper arms, one per opposite torso side. No legs, no treads, no bulky human-shaped chest, NO redesign. Midnight Korean office palette gray blue, ivory, restrained red. NO photorealism, NO 3D render, NO smooth painted surfaces, NO painterly blur, NO glow haze. No readable text, frame numbers, borders, watermark or UI. Asset: opaque fullscreen first-person dragging scene, EXACT1920x1080 landscape16:9. Approved robot image is IDENTITY reference; approved player image is CLOTHING reference; approved B2 lab wall is environment palette reference. Camera is Suho's eyes15cm from floor, tilted slightly, being dragged toward pale gray laboratory door with single dark rectangular observation window and small red lamp. His own limp forearm in rolled white office shirt and hand trail prominently in foreground, black trouser legs and GRAY WHITE SNEAKERS extend toward center distance. At right the approved tapered ivory robot's thin articulated gripper visibly grips Suho's wrist and pulls, robot drive wheels are close to the ground. Camera sees own limbs only, never external face or third person body. Quiet gray panels, black tiled floor, linear ceiling lamps. Detailed pixel game image, absolutely not photographic. Leave no text in door lamp. No blood or gore.

### lab

참조: `assets/objects/floor-kit/link-chair-rig.png`, `assets/objects/guard-robot/guard-capture.png`, `assets/background/b2/b2-link-finished.png`, `assets/player/jeong-suho-caught.png`

ARCHI production asset. CRISP DETAILED MUTED ANIME-INSPIRED PIXEL ART with visible deliberate pixel clusters, fine dark outlines and controlled dithering like the supplied approved game sprites. Realistic adult proportions. Match referenced IVORY tapered guard robot, small squared sensor head, black visor with vivid red screen and two red lenses, graphite base with TWO LARGE SIDE DRIVE WHEELS, exactly TWO thin bilateral articulated gripper arms, one per opposite torso side. No legs, no treads, no bulky human-shaped chest, NO redesign. Midnight Korean office palette gray blue, ivory, restrained red. NO photorealism, NO 3D render, NO smooth painted surfaces, NO painterly blur, NO glow haze. No readable text, frame numbers, borders, watermark or UI. Asset: opaque fullscreen first-person neural upload scene EXACT1920x1080 landscape16:9. Approved link-chair-rig is precise EQUIPMENT design reference: black and gray reclining chair with curved electrode halo and cables to adjacent neural converter rack. Camera is adult Suho's eyes reclining INSIDE this chair in B2 connection laboratory, facing forward over his own lap and black trouser legs with GRAY WHITE SNEAKERS. Own white rolled shirt sleeves and hands at lower corners, black padded mechanical restraint straps across both wrists. Curved halo edges and electrode cables surround upper edges. Gray panel walls and black tiled floor matching B2 reference, cool ceiling lights, neural converter rack left, blank monitor at right. Approved small tapered ivory wheeled guard robot stands beyond feet watching, bilateral arms at sides, exactly original design without humanoid legs. No third person protagonist, no visible victim face. Restrained, cold, ominous detailed pixel art. No text, upload display will be added in code. No blood or gore.

