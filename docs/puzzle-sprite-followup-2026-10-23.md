# 추가 퍼즐 소품·연출 수정 · 2026-10-23

내장 `image_gen`으로 상태 스프라이트 4종을 제작하고 기존 상태·저장 플래그에 연결했다. 원본은 각 소품 폴더의 `source/`에 보존한다.

| 대상 | 적용 파일 | 상태 플래그 |
|---|---|---|
| B2 CCTV 분배함 | `assets/objects/b2/cctv-distribution-states.png` | `b2-cctv-off` |
| 7층 인터록 제어반 | `assets/objects/floor07/interlock-panel-states.png` | `f7-release` |
| 12층 팀장실 열쇠 서랍 | `assets/objects/floor12/key-desk-states.png` | `f12-lead-key` |
| 12층 카드키 서랍 | `assets/objects/floor12/card-cabinet-states.png` | `f12-eval-keycard` |

가로 2프레임. 왼쪽은 조작 전, 오른쪽은 분리·해제·획득 후 상태다. 책상은 1024×256(칸당 512×256), 나머지는 512×512(칸당 256×512). 원본 alpha > 8 경계를 재고 두 칸에 같은 축소율을 적용한다. 종횡비 유지·nearest 축소, 하단 8px 여백, 가로 중앙 정렬. 기존 월드 위치·표시 크기·충돌 판정은 유지한다.

## 기존 그림 재사용

- B2 충전 도크: `assets/objects/floor-kit/robot-charging-dock.png`와 `assets/objects/guard-robot/guard-patrol.png` 4번 정지 프레임을 세 자리에서 재사용한다. 출동 시 대기 로봇만 숨기고 빈 도크는 남긴다.
- 13층 셔터: `assets/objects/floor11/fire-shutter-states.png`의 닫힌 커튼 영역(x42, y260, 35×1500)을 `assets/objects/floor13/vault-shutter-curtain.png`로 내보내 가로 반복한다. 기존 하강·개방 타이밍과 판정은 유지한다.
- 13층 CCTV: `assets/objects/floor17/cctv-patrol.png` 첫 칸의 alpha >= 32 경계(x130, y189, 516×349)를 `assets/objects/floor13/vault-camera.png`로 내보낸다. 기존 위치에 비율을 유지해 그리며 정전에는 어둡고 무채색으로 표시한다.

## 전송 화면

B2 외부 전송 현황은 `61%` → `전송 차단됨` → `ARCHI OFFLINE`으로 전환한다. 차단 이후 진행 막대는 빈 상태로 표시한다. 조사창의 문구·문서·캡션도 같은 상태를 반영한다. 재방문·불러오기는 기존 `b2-transfer-cut`을 사용하고, 삭제 완료는 기존 `b2Ending.offline`을 따른다. 초기 장면 생성 중 아직 로드되지 않은 엔딩 함수를 부르지 않도록 B2 메인 서버실에서만 상태 화면을 갱신한다.

## 검증

`tests/puzzle-prop-states.mjs`에 4개 소품, 서랍 획득, 대기 로봇 출동/복원, 재사용 그림, 전송 화면/조사창/삭제 완료/복원을 추가했다. 직접 조작 UI를 즉시 완료하는 기존 테스트 도우미를 사용하며, 입력 자체는 기존 서랍·수동 조작 검사에서 확인한다.

실행 결과: `puzzle-prop-states`, `floor12-drawer`, `vault-puzzle`, `b2-ending`, `scene-assets`, `visual-layout`, `interaction-outline`, `story-consistency`, `script-syntax` 9종 통과. 95개 장면·59개 CSS 이미지 로딩, 94개 장면 배치, 스크립트 문법 92/92, 서랍의 마우스·터치·키보드와 부분 저장 복원을 포함한다. 새 게임부터 끝까지의 수동 플레이, 실기기 모바일, 전체 `npm test`는 수행하지 않았다.

## 최종 생성 프롬프트

### b2-cctv

참조: `assets/objects/floor-kit/cctv-distribution-rack.png`. 원본: `assets/objects/b2/source/cctv-distribution-states.png`.

```text
Use case: precise-object-edit. Asset type: transparent production state sprite sheet for ARCHI, a 2D side-view office mystery game. Match the provided reference's crisp detailed pixel-art clusters, worn materials, realistic scale and dark desaturated palette. Strict orthographic FRONT elevation, no isometric perspective. EXACTLY TWO frames SIDE BY SIDE, same object size, alignment, lighting and geometry in each; change only the specified state. Both objects complete with transparent margins and identical bottom baseline. TRUE TRANSPARENT alpha outside the silhouette and through openings. No wall, floor, ground shadow, fog, checkerboard, people, text, labels, numbers, logos, borders or watermark.
Square overall sheet, two tall 1:2 cells, target 512x512. Preserve this exact tall black CCTV distribution rack, glass edge, vents, server rows, gray cable bundles with red plugs and bottom cable reel. Add ONE clear thick dark-gray CCTV POWER lead with a red sleeve at the right of an upper module. LEFT: that power connector plugged into the upper-right power inlet; restrained blue status LEDs ON. RIGHT: ONLY that same power connector unplugged, visibly dangling to upper-middle of rack with exposed metal end, empty inlet visible; blue status LEDs OFF because this rack powers the disabled corridor camera. All other wire bundles and components stay exactly the same. Make the moved plug distinguishable at 190px high in-game.
```

### f7-interlock

참조: `assets/objects/b2/transfer-breaker-states.png`. 원본: `assets/objects/floor07/source/interlock-panel-states.png`.

```text
Use case: precise-object-edit. Asset type: transparent production state sprite sheet for ARCHI, a 2D side-view office mystery game. Match the provided reference's crisp detailed pixel-art clusters, worn materials, realistic scale and dark desaturated palette. Strict orthographic FRONT elevation, no isometric perspective. EXACTLY TWO frames SIDE BY SIDE, same object size, alignment, lighting and geometry in each; change only the specified state. Both objects complete with transparent margins and identical bottom baseline. TRUE TRANSPARENT alpha outside the silhouette and through openings. No wall, floor, ground shadow, fog, checkerboard, people, text, labels, numbers, logos, borders or watermark.
Square overall sheet, two tall 1:2 cells, target 512x512. Input is a TWO STATE REFERENCE for steel cabinet style and large vertical red lever. Create the matching emergency INTERLOCK release cabinet: narrow tall gray steel closed cabinet, vented lower cover, one prominent thick red mechanical lever in a vertical guide, ONE round status lamp above lever. LEFT: lever UP and status lamp RED (door locked). RIGHT: identical cabinet with lever fully DOWN and status lamp GREEN (emergency exit released). This control has its own UPS, so the lamp must stay lit in BOTH states. No text or symbols. Same cabinet and scratch pattern exactly, full silhouette.
```

### f12-key-desk

참조: `assets/objects/floor-kit/office-desk.png`. 원본: `assets/objects/floor12/source/key-desk-states.png`.

```text
Use case: precise-object-edit. Asset type: transparent production state sprite sheet for ARCHI, a 2D side-view office mystery game. Match the provided reference's crisp detailed pixel-art clusters, worn materials, realistic scale and dark desaturated palette. Strict orthographic FRONT elevation, no isometric perspective. EXACTLY TWO frames SIDE BY SIDE, same object size, alignment, lighting and geometry in each; change only the specified state. Both objects complete with transparent margins and identical bottom baseline. TRUE TRANSPARENT alpha outside the silhouette and through openings. No wall, floor, ground shadow, fog, checkerboard, people, text, labels, numbers, logos, borders or watermark.
ONE WIDE sheet with two identical wide DESKS side by side, each cell ratio 2:1, target sheet1024x256. Preserve the exact reference desk: pale gray tabletop, charcoal steel frame and left three-drawer pedestal, black OFF monitor and keyboard, pencil pot and small potted plant on left, two binders at right, no chair. LEFT: all three drawers CLOSED. RIGHT: ONLY the BOTTOM drawer of the left pedestal is pulled OPEN, its empty dark tray visibly exposed with a slight visible top interior; lower drawer front projects only slightly forward and never touches below the feet baseline. No key remains inside. All upper drawers, desktop, objects, monitor, legs and materials identical. Front game elevation, not rotated; entire desks including both feet visible; preserve the wide low silhouette.
```

### f12-card-cabinet

참조: `assets/objects/floor-kit/filing-cabinet.png`. 원본: `assets/objects/floor12/source/card-cabinet-states.png`.

```text
Use case: precise-object-edit. Asset type: transparent production state sprite sheet for ARCHI, a 2D side-view office mystery game. Match the provided reference's crisp detailed pixel-art clusters, worn materials, realistic scale and dark desaturated palette. Strict orthographic FRONT elevation, no isometric perspective. EXACTLY TWO frames SIDE BY SIDE, same object size, alignment, lighting and geometry in each; change only the specified state. Both objects complete with transparent margins and identical bottom baseline. TRUE TRANSPARENT alpha outside the silhouette and through openings. No wall, floor, ground shadow, fog, checkerboard, people, text, labels, numbers, logos, borders or watermark.
ONE SQUARE sheet with two tall cabinets side by side, each cell1:2, target512x512. Preserve exact reference olive-gray steel FOUR DRAWER vertical filing cabinet, four recessed black handles and blank nameplate slots, tiny feet, worn outlines. LEFT: all four drawers CLOSED. RIGHT: ONLY the TOP drawer is pulled OPEN, empty dark interior tray visible with a slight visible top surface, lower three drawers stay closed. Card and papers already removed, no loose paper or keycard. Front game elevation, not rotated. Keep cabinet body exactly same width, height and baseline across states; open drawer projects gently toward viewer inside cell margins. Do not accidentally add a fifth drawer.
```
