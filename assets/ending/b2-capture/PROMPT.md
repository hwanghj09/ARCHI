# B2 포획 · NEW HOST 배드 엔딩

- 도구: built-in ImageGen. 기존 픽셀 아트 PNG를 참조해서 새로 생성했다.
- 사용자 요청: 1인칭에서 로봇이 팔로 머리를 가격 → 기절 → 암전 사이에 짧게 보이는 이송 → B2 연결 실험실에서 수호에게 ARCHI 업로드.
- 프로젝트 기준: `claude/skills/archi-game-assets/`, `docs/INTERACTION-SPRITES.md`; 기존 엔딩 전체화면 규격 1920×1080.
- 초기 사실적 시안과 엘리베이터 배경의 타격 시안은 미채택. 타격 장소는 **B2 ARCHI 메인 서버실**이며 최종본의 네 프레임 모두 서버 랙·천장 배선·붉은 비상등으로 수정했다.
- 정수호의 흰 셔츠·검은 바지·회백색 운동화, 아이보리 로봇과 붉은 얼굴 모니터, B2 회색 패널을 유지한다. 원근은 1인칭 장면에 사용한다.
- 배경은 불투명 PNG. 글자·자막·업로드 진행률은 DOM이 표시한다.

| 게임 파일 | 실제 규격 | 구성 |
| --- | --- | --- |
| robot-strike.png | 7680×1080 | 가로 4셀, 각 1920×1080: 대치 / 팔 들기 / 휘두르기 / 접촉 |
| drag-pov.png | 1920×1080 | 바닥 시야, 손목을 잡고 끄는 로봇 |
| upload-pov.png | 1920×1080 | 손목이 고정된 연결 장비의 1인칭 |

원본은 source/에 보존한다. 생성기가 출력한 크기는 요청 크기와 다를 수 있으므로 원본 폭·높이를 읽고 `scripts/prepare-b2-capture.mjs`가 타격 원본 2×2를 같은 크기 가로 프레임으로 분할한다. nearest 보간으로 최종 규격을 맞춘다. 타격은 고정 시점·동일 셀로 표시하고 접촉 때만 시야를 기울인다. 생성 결과는 별도 3D 리깅 동작이 아닌 4개의 정지 프레임 애니메이션이다.

게임 연결: `js/scene/b2-capture-scene.js`, `css/b2-capture-scene.css`, `index.html`. 게임 고정 시계 35.4초, 비활성 탭에서 정지. 4.8–5.9초 / 7.9–8.8초 / 11.1–12.5초에만 이송을 보여 준다. 14.7초에 실제 장소를 b2-link로 옮기고, 20.5–32.5초에 업로드한다. 마지막에 NEW HOST와 재시작·체크포인트 버튼을 표시한다. Esc/버튼은 업로드 완료 결과로 건너뛴다. 모션 감소에서는 기울기·이동을 생략하고 암전을 부드럽게 표현한다.

검증: `tests/b2-capture-scene.mjs`의 규격·불투명도·포획 콜백·프레임·암전·실제 실험실 이동·업로드·입력 차단·모바일·복귀 검사. 기존 `tests/b2-ending.mjs`는 삭제 성공/실패 경로를 유지한다.

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

