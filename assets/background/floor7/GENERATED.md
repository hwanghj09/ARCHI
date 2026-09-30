# 7층 배경 그림과 실제 적용 규격 (2026-09-29)

`PROMPT.md`의 9개 프롬프트(corridor-a/b/c/d, vip-1/2, test-1/2, verify)로 생성한 그림을
`scripts/compose-floor7-art.py`로 합성해 `js/floors/floor-07.js`에 연결한 기록이다. 12층
(`compose-floor12-art.py`/`floor12/GENERATED.md`)과 같은 절차 — 바닥선 자동 검출 → 동일 배율
스케일 → `top` 오프셋 정렬 — 을 그대로 썼다.

## 재생성 이력

- **corridor-a**: 1차 생성본(1993×789)은 위 114px·아래 82px가 순백 레터박스였다(캔버스를
  가득 채우지 않음). `prompts/corridor-a.txt`에 "CRITICAL FULL BLEED" 경고를 추가해
  재생성(1993×789, 레터박스 없음)했다.
- **corridor-d**: 1차 생성본이 1485×1059(비율 1.4:1)로, 요청한 718×720(거의 정사각형)보다
  훨씬 넓게 나왔다. `prompts/corridor-d.txt`에 "CRITICAL CANVAS SHAPE" 경고를 추가해
  재생성(1268×1240, 비율 1.02:1)했다.
- 나머지 7장(corridor-b/c, vip-1/2, test-1/2, verify)은 1차 생성본을 그대로 썼다.

## 바닥선 검출과 합성

`scripts/compose-floor7-art.py`의 `detect_floor()`가 12층과 동일하게 이미지 높이의
60~92% 구간에서 행 평균 밝기가 가장 높은 행을 바닥선으로 잡는다. 실행 결과:

| 최종 파일 | 조각 | x | 목표 폭 | 배율 | src floor_y | top | 스케일된 높이 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `corridor.png` | corridor-a | 0 | 1818 | 0.9122 | 565 | 54.6 | 720 |
| `corridor.png` | corridor-b | 1818 | 1268 | 0.7620 | 686 | 47.3 | 720 |
| `corridor.png` | corridor-c | 3086 | 1196 | 0.7401 | 689 | 60.1 | 720 |
| `corridor.png` | corridor-d | 4282 | 718 | 0.5662 | 922 | 47.9 | 702 |
| `vip.png` | vip-1 | 0 | 1750 | 0.8947 | 570 | 60.0 | 719 |
| `vip.png` | vip-2 | 1750 | 1322 | 0.7776 | 641 | 71.5 | 719 |
| `test.png` | test-1 | 0 | 1150 | 0.7251 | 720 | 47.9 | 719 |
| `test.png` | test-2 | 1150 | 1154 | 0.7272 | 719 | 47.2 | 721 |
| `verify.png` | verify | 0 | 1856 | 0.9215 | 584 | 31.8 | 720 |

corridor-d는 원본 비율이 재생성 후에도 거의 정사각형이라 스케일된 높이가 702px로 720에
살짝 못 미친다 — 위쪽 18px는 캔버스 배경색(`#0f0e0c`)이 채운다(천장 배관이 살짝 짧아
보이지만 이음매 검사에서는 문제되지 않았다).

```
D=<9장을 받은 임시 폴더>
python scripts/compose-floor7-art.py "$D/corridor-a.png" "$D/corridor-b.png" "$D/corridor-c.png" \
  "$D/corridor-d.png" "$D/vip-1.png" "$D/vip-2.png" "$D/test-1.png" "$D/test-2.png" "$D/verify.png"
```

| 파일 | 크기 | 내용 |
| --- | --- | --- |
| [corridor.png](corridor.png) | 5000×720 | 복도 전체: VIP Room 전면, 라운지 창, VIP LOUNGE 표지 벽감, 엘리베이터 3대, 비상계단, 출입 통제 안내판, 화장실, AI 테스트실 전면, 검증실 전면 |
| [vip.png](vip.png) | 3072×720 | VIP Room(`f7-vip`) 내부: 시연 스크린, 출구 이중유리문, 방명록/진열장 벽 |
| [test.png](test.png) | 2304×720 | AI 테스트실(`f7-test`) 내부: 야경 창, 출구 슬라이드문, 전력계 패널 |
| [verify.png](verify.png) | 1856×720 | 검증실(`f7-verify`) 내부: 인터록 제어반 벽, 출구 에어락 문, 백업 장비 LED 랙 |

## 문 좌표 보정 (2026-09-29, 실측)

`corridor.png`/`vip.png`/`test.png`/`verify.png`에서 격자 오버레이로 문 사각형을 육안 실측한
값이 설계값과 상당히 달라서(그림마다 30~150px 차이), 실측값으로 `js/floors/floor-07.js`를
고쳤다. 보정 후 좌표를 문 위치에 마젠타 사각형으로 그려 원본 이미지 위에 겹쳐 확인했다
(전부 일치).

| 요소 | 설계값 | 실측값 | 적용 |
| --- | --- | --- | --- |
| VIP Room 문 | doorX=360, width=150 | x≈313~518 | `doorX: 314, doorWidth: 197` |
| AI 테스트실 문 | doorX=4420, width=110 | x≈4405~4595 | `doorX: 4408, doorWidth: 188` |
| 검증실 문 | doorX=4760, width=104 | x≈4700~4805 | `doorX: 4701, doorWidth: 104`(폭은 설계값과 거의 일치) |
| 엘리베이터 3대 | x=1818/2148/2444, width~216 | 문 안쪽 어두운 칸: 1897–2072 / 2196–2373 / 2493–2666 | `elevatorOffsets: [60, 30, 30]`, `elevatorWidthDeltas: [-5, 0, -5]` |
| 비상계단 | x=2906, width=180 | 문 안쪽: 2875–3043 | `stairsOffset: -41, stairsWidthDelta: -10`(신규 옵션, 아래 참고) |
| 화장실 문(BUILDING_CORE, 전 층 공용) | doorX=3612, width=145 | x≈3746~3921 | `restroomOverride: { doorX: 3762, doorWidth: 142 }`(신규 옵션, 아래 참고) |
| f7-vip 출구(room 내부) | 자동 계산(`exitDoorX`) | vip.png 문 x≈1428~1622 | `exitX: 1428` |
| f7-test 출구 | 자동 계산 | test.png 문 x≈793~982 | `exitX: 793` |
| f7-verify 출구 | 자동 계산 | verify.png 문 x≈555~727 | `exitX: 555` |

**신규 코드 변경 2건** (다른 층에는 영향 없음, 기본값이 없을 때 전과 동일하게 동작):
- `js/scene/scene-builder.js`: 비상계단에도 엘리베이터의 `elevatorOffsets`/`elevatorWidthDeltas`와
  같은 목적의 `config.stairsOffset`/`config.stairsWidthDelta`를 추가했다.
- `js/floors/registry.js`: 화장실 방 항목에 `...(layout.restroomOverride || {})`를 추가해서,
  그 층 그림이 `BUILDING_CORE.restroom` 좌표와 어긋날 때만 `doorX`/`doorWidth`/`doorY`를
  덮어쓸 수 있게 했다.

## 연결 (`js/floors/floor-07.js`)

```js
FLOOR7_LAYOUT.backgroundImage = { src: 'assets/background/floor7/corridor.png', height: 720, top: 0 };
// f7-vip    → { src: 'assets/background/floor7/vip.png',    height: 720, top: 0 }, exitX: 1428
// f7-test   → { src: 'assets/background/floor7/test.png',   height: 720, top: 0 }, exitX: 793
// f7-verify → { src: 'assets/background/floor7/verify.png', height: 720, top: 0 }, exitX: 555
```

네 이미지 모두 자연 픽셀 크기가 각 장면의 `config.width`(복도 5000 / VIP Room 3072 / 테스트실
2304 / 검증실 1856)와 다르므로(합성 시 원본 그림 배율만 스케일했지 최종 캔버스는 정확히
저 폭으로 만들었다) `width`는 지정하지 않았다 — `scene-builder.js`가 `art.width ?? config.width`로
기본값을 그대로 쓴다. `backgroundWallsOnly`는 쓰지 않았다(문까지 이미 그려진 완성 배경이라
`data-art="true"` 기본 art 모드가 맞다).

## 아직 안 한 것 / 확인할 점

- **검증실 문의 동적 표시등**: `.room-door.airlock::after`(잠김일 때만 붉게 켜지는 CSS 표시등)는
  art 모드에서 `content: none`으로 항상 숨는다(그림 위에 겹쳐 보이는 문제를 막으려고 12층 때
  일반화한 규칙). `verify.png`에는 문 위 붉은 등을 이미 정적으로 그려 넣었지만, 인터록을 해제한
  뒤에도(`f7-release` 획득 후) 그림 속 등은 계속 붉게 보인다 — 실제 잠금 해제는 텍스트 힌트로만
  전달된다. 필요하면 그 표시등만 별도 DOM 오버레이로 분리해 상태에 따라 보이기/숨기기를 하는
  방법을 고려한다.
- **Playwright 실기 확인 못함**: 이 세션 샌드박스에 네트워크가 막혀 있어 `npx playwright install`이
  실패했다 — 브라우저 스크린샷으로 실제 렌더링을 확인하지 못했다. 대신 Pillow로 위 표의 보정
  좌표를 원본 그림 위에 사각형으로 겹쳐 그려 전부 문과 정확히 겹치는 것을 육안 확인했다
  (`scripts/`에 임시로 만들었다가 확인 후 삭제함). 브라우저를 쓸 수 있게 되면 16층
  (`tests/floor16-art.mjs`)을 본떠 `tests/floor7-art.mjs`를 추가해 이미지 로드·바닥선 정렬·문
  판정을 자동 검사하는 게 좋다.
- 복도 이음매(corridor-a/b, corridor-c/d)는 확대해서 육안 검사했고 천장·바닥선이 잘 이어진다.

## 다시 만들 때

새 이미지 9장을 받으면 `scripts/compose-floor7-art.py`를 다시 실행한다(바닥선은 자동
검출된다). corridor-a를 다시 예전 결함 있는 버전으로 되돌려 쓸 일이 있으면 스크립트에
`--ca-crop` 인자를 추가로 넘긴다(위/아래 레터박스를 잘라내고 씀). 문 위치가 크게 바뀌면
위 "문 좌표 보정" 표를 다시 실측해서 `floor-07.js`의 좌표·오프셋을 갱신한다.
