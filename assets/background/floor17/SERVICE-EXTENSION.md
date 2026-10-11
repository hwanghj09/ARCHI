# 17층 계단 오른쪽 확장

- 제작 도구: built-in `image_gen` (2026-09-24), 각각 1회 생성.
- 화풍 참고: `assets/background/floor17/floor17.png`. 기존 배경과 타일은 보존.
- 복도 원본: `C:/Users/hwang/.codex/generated_images/01a0d124-f193-7772-9ebc-54ad57cfc0ab/exec-0c27f506-0ebb-4b6c-bed2-d13931b1a183.png` (1983×793).
- 복도 최종: `service-corridor.png` (1983×660). 원본의 `(0, 105, 1983, 765)` 영역을 단순 크롭해 검은 상단 여백 제거. 월드 x=3200, 너비=1800, 높이=785.39. 원본 바닥선 y=584를 월드 y=570에 정렬: `(584-105)×785.39/660≈570`.
- 화장실 원본: `C:/Users/hwang/.codex/generated_images/01a0d124-f193-7772-9ebc-54ad57cfc0ab/exec-011934fe-6f20-47e6-a175-226a9d56e77e.png`.
- 화장실 최종: `restroom.png` (1983×793), 원본 그대로 복사. 월드 너비=1800, 높이=824.84. 원본 바닥선 y=548를 월드 y=570에 정렬.
- 생성 결과에 맞춰 문 영역은 화장실 x=3612..3757, 관리자실 x=4378..4549, 소화전 x=4023..4168로 연결. 한국어 표지는 DOM으로 표시.
- 방이 차지하는 복도 벽면은 벽기둥 중심 기준으로 화장실 x=3556..4282, 관리자실 x=4282..4968. 방 안 출구는 복도와 같은 크기(y=210)이고 문 왼쪽 벽 비율을 따라 화장실 x=185(세면대 앞 빈 타일 벽), 관리자실 x=324에 둔다(`js/scene/scene-builder.js`의 `exitDoorX`).
- 관리자실은 기존 방 생성 코드와 floor-kit 소품을 재사용. `FLOOR17.rooms`의 `locked: true`가 출입을 막으며 내부·복귀 경로는 완성되어 있음. 게임 내 잠금 해제 이벤트는 아직 없음.
- 복도 접합부의 벽 패널 높이는 약간 다르지만 바닥선은 이어짐. `tests/floor17-extension.mjs`에서 실제 왕복, 잠금, 테스트용 잠금 해제 후 관리자실 왕복, 조명, 충돌, 모바일을 검증.

## 복도 최종 프롬프트

```text
Create ONE new game background, a right-side extension of this Korean office corridor. Reference is STYLE AND SCALE only; do not reproduce its elevators or stairs. ARCHI detailed muted blue-gray anime pixel art, same midnight office lighting and wall panel/ceiling design as reference, crisp pixels, flat orthographic side-scrolling elevation. Landscape canvas 1800x720 ratio 2.5:1. Floor walk contact line perfectly horizontal at y=570 of 720 (79.17% from top), with dark solid building cross-section beneath. Empty traversable lane. Contents left to right: left edge plain uninterrupted wall joining reference corridor, a closed restroom door occupying x=380..530 (21..29.5% width), top at y=250 and bottom at570; small restroom male/female pictogram sign above. Wall-mounted RED FIRE HOSE CABINET centered x=840 (46.7%) with glazed front and hose reel, bottom y=470, top300; small separate red extinguisher below/alongside. A locked gray metal utility/manager door at x=1240..1410 (68.9..78.3%), top250 bottom570, small red access reader on its right, blank rectangular warning placard on door. Maintenance cleaning cart at far right x=1620 against wall, not in walking lane. Ceiling pipes, ventilation grille, subdued fluorescent ceiling strips. Entire door faces visible and straight, zero depth corridor, zero vanishing point. No people, no elevators, no stairs, no windows, no UI, no labels/text apart from small pictograms, no border, no perspective floor receding into distance. Match reference's relatively dark blue-gray palette. It is an additional corridor asset, not a collage or comparison.
```

## 화장실 최종 프롬프트

공통 화장실 내부 출구는 `restroomInterior`의 `exitX: 185`, `exitStyle: 'restroom-exit'`로 정한다.
모든 층(B2~17F)이 같은 배경을 사용하므로, 복도 그림에 맞춘 문 위치나 `art-door` 숨김 스타일은 내부에
전파하지 않는다. 문 그림은 `assets/objects/floor16/restroom-door.png`를 재사용하고, 문 크기와 복귀 위치는
각 층 복도 문을 따른다. `tests/restrooms.mjs`가 19개 층의 출입·문 표시·설비 간격과 모바일 조작을 검증한다.

```text
Create one new ARCHI game background for an enterable office restroom, reference image STYLE ONLY. Detailed crisp muted anime-inspired PIXEL ART matching dark blue gray Korean office night atmosphere. WIDE horizontal canvas 1800x720 (2.5:1). Flat orthographic front elevation for 2D side-scroller, no vanishing point. Straight walk contact baseline at y570/720 (79.17%), below is dark solid floor cutaway. Leftmost wall x0..300 is blank tile reserved for game-rendered EXIT door (DO NOT DRAW a door there). Rest of wall: three porcelain washbasins below a long mirror x420..850, soap dispensers, paper towel dispenser; two toilet stalls x1030..1580 with modest partitions and one open stall clearly revealing a white toilet; small wall waste bin at far right. Clean slightly worn gray-green rectangular wall tiles, muted overhead fluorescent illumination, pipe vents at ceiling, dark nonreflective floor cross-section below y570. Fixtures stay against back wall above the walkway, empty foreground for moving player. Realistic fixture proportions matching reference doors scale (door ~320px high). No people, no blood, no labels, no UI, no border, no watermark, no exterior windows, no perspective corridor. Bathroom interior visible in one continuous side elevation.
```
