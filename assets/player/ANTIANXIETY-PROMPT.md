# 항불안제 아이콘 · 수호 복용 애니메이션

- 생성 도구: 내장 image_gen. 수호의 기존 `jeong-suho.png`를 캐릭터 참조로 사용했다.
- 아이템: `assets/objects/items/antianxiety-v2.png`, **134×125 RGBA PNG**. 기존 `antianxiety.png`는 보존했다. 선반, 가방 목록, 상세 이미지에 새 아이콘을 연결했다.
- 애니메이션: `assets/player/jeong-suho-antianxiety.png`, **1536×256 RGBA PNG**, 6열 × 1행, 프레임당 256×256.
- 생성 원본: `assets/objects/items/antianxiety-source.png` 1254×1254, `assets/player/jeong-suho-antianxiety-source.png` 1536×1024 (3열 × 2행).
- 순서: 약 꺼내기 → 가슴 높이 → 입으로 올리기 → 입에 넣기 → 삼키기 → 손 내리기.
- 프레임 시간: 220/220/200/280/300/280ms, 총 **1500ms**, 한 번 재생. 이동·점프·가방·휴대폰·상호작용 입력은 재생 중 차단한다. Esc 메뉴는 일시 정지하고 재개할 수 있다.
- 효과와 사용 플래그는 클릭 시 즉시 반영한다. 정신력 **+50**, 최대 100, 중복 사용 불가. 자동 저장 후 재개해도 약이 되살아나지 않는다. 이미지가 아직 준비되지 않으면 소모하지 않고 다시 시도할 수 있다.
- 가방을 닫고 월드에서 동작을 보여 준다. 기존 방향 반전으로 좌우 모두 재생한다. 손에 약을 든 동안 플래시 표시를 감추고 완료 후 원래 상태로 복구한다. 물리·경비 로봇·월드 시간은 계속 진행된다.

## 내보내기와 정렬

`node scripts/prepare-antianxiety.mjs` (sharp 필요). 생성 알파를 보존하며 최근접 보간으로 규격만 정규화한다. 원본 세로 크기 491px을 216px로 맞춘 배율 216/491, 셀 출력은 225px이다. 각 프레임의 허리 중심을 x=128, 발바닥을 y=237에 맞춘다. 게임의 192px 뷰포트에서 0.75배 표시되어 발바닥이 y=177.75가 되고, 기존 플레이어 정렬 y=178과 0.25px 이내로 일치한다. 프레임별 허리/발 원본 좌표는 내보내기 스크립트에 기록했다.

## 아이콘 생성 프롬프트

```text
Use case: stylized-concept. Asset type: a production inventory/world collectible sprite for ARCHI, a 2D Korean office mystery/horror web game. Generate ONE anti-anxiety medication item icon: a small muted cyan-blue cardboard medicine carton with a simple white cross and an exposed silver blister strip containing several tiny round white tablets, angled slightly for inventory readability. No brand, no drug name, no text, no numbers. Match the attached/reference game's clean anime-inspired PIXEL ART: crisp hard-edged pixel clusters, dark outlines, desaturated cyan, slate blue, silver, off-white; readable at 134 by 125 game pixels. Single isolated object centered in a square transparent canvas with 10% padding, no people, no other props. Real transparent alpha background including surrounding space. No checkerboard, floor, shadows, glow, border, watermark. Output a finished raster sprite only.
```

## 복용 애니메이션 생성 프롬프트

```text
Use case: identity-preserve. Asset type: production medication-taking animation sprite sheet for Jeong Suho in ARCHI, 2D side-scrolling web game. Input image 1 is the exact character identity/style reference: preserve the same slim adult Korean male, messy black hair, tired face, rolled-sleeve white office shirt, loose black tie, dark ID lanyard/badge, dark charcoal trousers, gray-white sneakers. Crisp anime-inspired pixel art, adult realistic proportions, matching reference pixel density, muted colors. Create exactly SIX full-body poses in a 3-column by 2-row grid of equal square cells, read left to right, then top to bottom. All faces RIGHT in strict orthographic side profile. Stationary standing with feet comfortably close; soles planted at identical baseline and horizontal hip anchor in each cell. Frames: 1 holding a small silver blister strip at waist and pressing out one tiny white tablet; 2 holding the tablet between right fingertips with hand at lower chest, left hand holds strip at waist; 3 right hand rises halfway toward mouth; 4 right fingertips reach lips, putting ONE tablet into mouth; 5 right hand moves slightly down from lips, chin tips up subtly while swallowing; 6 both arms lower back to relaxed stance, strip held near waist. Clearly distinct hand/arm poses, continuous single action, same body scale and outfit in every frame. No smartphone, no water bottle, no carton in hands, no extra objects. Conceptual frame 256x256: hip x128, soles y237, crown y20, height 217. Need 6 evenly spaced isolated sprites with generous transparent padding, no cropped shoes or hands, no cell overlaps. REAL transparent alpha throughout, including between limbs. No painted checkerboard, floor, shadows, glow, captions, labels, numbers, grid lines, borders, watermark. Output only the transparent six-frame sheet.
```

원본 편집에는 배경 제거 프롬프트로 회색 광원·안개를 제거하고, 6개 자세/의상/격자를 보존하도록 요청했다. 실행 환경에서 Chromium 다운로드가 실패해 브라우저 E2E는 실행하지 못했다. PNG 크기·알파/프레임 정렬 및 실제 게임 스크립트의 소비·회복·프레임 진행·조작 차단·복귀·반복 사용 방지를 검증하는 `node tests/antianxiety-animation.mjs`를 추가했다. 기존 `tests/antianxiety.mjs`에도 실제 브라우저용 애니메이션 검증을 추가했다.

