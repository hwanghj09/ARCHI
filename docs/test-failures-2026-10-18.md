# 전체 테스트 오류 목록 (2026-10-18)

`npm test`를 작업 트리 전체(여러 세션의 커밋 전 수정 포함)에서 돌린 결과다. **89개 중 47개 통과, 42개 실패.**

- 기존 실패: 41개. 이번 작업(1층 추격 컷신, 엘리베이터 안 휴대폰·가방, 로그 삭제 속도, 휴대폰 배치·스크롤바) 전 HEAD에서도 똑같이 실패했다.
- 새 실패: 1개(`opening.mjs`). 다시 돌려도 같은 곳에서 실패한다.

## 새 실패

| 테스트 | 첫 오류 | 비고 |
|---|---|---|
| `opening.mjs` | AssertionError [ERR_ASSERTION]: Standing uses the idle sprite, not the walking cell of the opening sheet | 다른 세션의 수호 서 있기(idle)·컷씬 포즈 스프라이트 작업과 관련된 것으로 보인다 (`tests/opening.mjs:123`). |

## 기존 실패 (이번 작업 전부터)

| 테스트 | 첫 오류 |
|---|---|
| `access-gates.mjs` | locator.click: Timeout 30000ms exceeded. |
| `antianxiety-animation.mjs` | ReferenceError: MANAGER_MEMO_TEXT is not defined |
| `audio-gameplay.mjs` | AssertionError [ERR_ASSERTION]: Each brief flicker has an electrical click |
| `b2-ending.mjs` | AssertionError [ERR_ASSERTION]: The crate covers the door (2835-3025 vs 2785-2945) |
| `background-power.mjs` | locator.uncheck: Timeout 30000ms exceeded. |
| `blackout-scene.mjs` | AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: |
| `blackout.mjs` | AssertionError [ERR_ASSERTION]: false == true |
| `cabin-background.mjs` | AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: |
| `cabin-blackout.mjs` | Error: strict mode violation: locator('#stage') resolved to 2 elements: |
| `cabin-hallucination.mjs` | AssertionError [ERR_ASSERTION]: The hallway hallucination is paused during the ride |
| `cctv-scene.mjs` | AssertionError [ERR_ASSERTION]: The control room is dim from the start |
| `computer-desktop.mjs` | Error: strict mode violation: locator('#stage') resolved to 2 elements: |
| `computer.mjs` | Error: strict mode violation: locator('#stage') resolved to 2 elements: |
| `device-app-art.mjs` | AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal: |
| `elevator.mjs` | AssertionError [ERR_ASSERTION]: The called elevator arrives with its door open |
| `floor12-restroom.mjs` | AssertionError [ERR_ASSERTION]: Return beside the original corridor door |
| `floor17-extension.mjs` | AssertionError [ERR_ASSERTION]: Old boundary is traversable |
| `guard-capture.mjs` | Error: strict mode violation: locator('#stage') resolved to 2 elements: |
| `guard-patrol.mjs` | AssertionError [ERR_ASSERTION]: Powered patrol rolls at 80 pixels per second |
| `interaction-outline.mjs` | AssertionError [ERR_ASSERTION]: js/scene/prop-outlines.js must match the prop sprites: run node scripts/build-prop-outlines.mjs |
| `lighting.mjs` | locator.isChecked: Timeout 30000ms exceeded. |
| `manual-control-art.mjs` | AssertionError [ERR_ASSERTION]: f2-harmony/배터리 영사기: inspection opens image controls |
| `map.mjs` | AssertionError [ERR_ASSERTION]: The map window is compact |
| `movement.mjs` | AssertionError [ERR_ASSERTION]: Only the called elevator starts moving |
| `object-layout.mjs` | locator.tap: Timeout 30000ms exceeded. |
| `office.mjs` | Error: strict mode violation: locator('#stage') resolved to 2 elements: |
| `phone-charging.mjs` | locator.tap: Timeout 30000ms exceeded. |
| `phone-flash-visibility.mjs` | locator.uncheck: Timeout 30000ms exceeded. |
| `phone-photos.mjs` | locator.click: Timeout 30000ms exceeded. |
| `phone-power.mjs` | AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: |
| `phone-ui.mjs` | AssertionError [ERR_ASSERTION]: false == true |
| `power-notice.mjs` | locator.tap: Timeout 30000ms exceeded. |
| `restrooms.mjs` | locator.tap: Timeout 30000ms exceeded. |
| `rooftop.mjs` | AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal: |
| `room-spatial-layout.mjs` | locator.tap: Timeout 30000ms exceeded. |
| `running.mjs` | AssertionError [ERR_ASSERTION]: Extended map boundary still blocks sprinting |
| `sanity.mjs` | locator.uncheck: Timeout 30000ms exceeded. |
| `save-slots.mjs` | page.waitForFunction: Timeout 30000ms exceeded. |
| `solar-ui.mjs` | Error: strict mode violation: locator('#stage') resolved to 2 elements: |
| `usb-connection.mjs` | Error: Input file is missing: /C:/Users/hwang/Desktop/project/game/ARCHI/assets/ui/usb-connection/phone.png |
| `writing-ui.mjs` | AssertionError [ERR_ASSERTION]: 비상 전력 회로 안내도: document has no look manual |

자주 나오는 원인:

- `locator('#stage') resolved to 2 elements`: `#stage`가 두 개로 잡힌다. 테스트 셀렉터나 마크업 쪽 문제다.
- `MANAGER_MEMO_TEXT is not defined`: 테스트가 없어진 전역 이름을 쓴다.
- 속도·시간 단언(px/s, 프레임 간격): 동시에 여러 테스트를 돌리면 흔들릴 수 있다.
