# 1층 로비 배경 합성 기록 (2026-09-30 전면 재작성)

## 서쪽 벽과 엘리베이터 구간 통일 (2026-10-16)

현재 복도는 `corridor-unified-finished.png`를 사용한다. 서쪽 0..1818 구간의 벽을 엘리베이터
구간과 같은 회색 석재 패널로 편집했다. 천장 배관과 황동 띠는 기존 엘리베이터 그림에서
연결해 높이 차이를 없앴다. 문 3개, 문패, 안내판은 원본 픽셀과 좌표를 보존하며,
천장 0..100, 바닥 570 이후, 나머지 복도 1818..5000도 그대로다.

- 도구: 기본 내장 `image_gen` 편집, 입력은 기존 완성 복도의 서쪽 구간과 엘리베이터 구간.
- 생성 원본: [source/corridor-west-unified.png](source/corridor-west-unified.png).
- 프롬프트: [prompts/corridor-west-unified.txt](prompts/corridor-west-unified.txt).
- 재조립: 저장소 루트에서 `node scripts/prepare-floor1-wall.mjs`. 보존 영역 픽셀 검증 포함.
- 전체 마감 재생성 시에도 `finish_building.py`가 `corridor-unified.png`를 사용한다.
- PC 1280×720에서 이음매, 안내판, 출입 판정 및 전력 전환을 확인한다.

> 2026-10-16 마감 갱신: 게임은 원본 좌표를 보존한 높이 760의 *-finished.png를 사용한다. 원본 합성 후 저장소 루트에서 python -B assets/background/finish_building.py를 실행한다. 현재 구현·전력 전환·검증 방법은 [건물 전체 마감](../FINISHING.md)을 따른다. 아래는 원본 제작 기록이다.

이 문서는 전면 재작성이다. 이전 버전(2026-09-26, "3차")은 입구·안내데스크·로봇·게이트가 복도
왼쪽에 있던 옛 레이아웃 기준이었는데, 이후 `js/floors/floor-01.js`가 지금 구조(방 3개는
서쪽, 게이트·로봇·정문은 동쪽)로 바뀌면서 그 그림(`corridor.png`)은 코드와 맞지 않는 고아
파일이 됐다. `PROMPT.md`가 새 구조에 맞춰 corridor-a/b/c/d + harmony-1/2 + vision-1/2 + clinic
9개 프롬프트로 다시 쓰였고, 이 문서는 그 9장을 실제로 생성·합성·연결한 기록이다. 7층
(`assets/background/floor7/GENERATED.md`)과 같은 절차(바닥선 자동 검출 → 동일 배율 스케일 →
`top` 오프셋 정렬 → 문 좌표 실측 → `floor-01.js` 연결)를 그대로 따랐다.

## 프롬프트 보정 이력

1차 생성에서 두 가지 문제가 나와 프롬프트를 두 번 고쳤다(`prompts/*.txt`에 반영):
- **너무 고급스러움**: corridor-a 1차본이 바닥이 물기 있는 대리석처럼 반들거리고 콘서트홀
  문에 금장 아치까지 붙어 호텔 로비처럼 나왔다(7층 VIP 라운지보다 화려해 보이는 톤 역전).
  → 9개 파일 전부에 "무광, 반사 없음"과 "평범한 공공/사무 건물, 호텔 아님"을 명시.
- **너무 밝음**: 위 수정 후에도 다른 층(7층/12층) 정전 장면보다 전체적으로 밝게 나왔다(재질
  색 자체가 밝은 트래버틴이라 도구가 "정전=어둡게"를 약하게 반영한 것으로 보임). → 9개 파일
  전부에 "재질 색과 무관하게 장면 전체 노출을 다른 층 정전 장면만큼 어둡게" 절 추가.
- **레터박스 결함**: 어둡게 하라는 지시를 넣은 뒤 corridor-a·corridor-d 재생성본에 위/아래
  순검은색 레터박스(각각 132px+44px, 272px+143px)가 생겼다(7층 corridor-a의 흰색 레터박스와
  같은 종류의 결함, 이번엔 색만 검은색). 프롬프트에 이미 "no letterboxing" 지시가 있었는데도
  재현됐다 — 재생성으로 해결됐다(원인 불명, 도구 쪽 변동성으로 추정).
- **이음매 천장 높이 어긋남**: 레터박스까지 해결한 뒤에도, 합성한 `corridor.png`를 실제
  게임에서 보니 corridor-a→corridor-b 이음매에서 천장 높이가 눈에 띄게 어긋나 보였다(사용자
  스크린샷으로 발견). 원인은 corridor-a 원본이 b/c/d보다 바닥선 위 여백이 훨씬 적었던 것 —
  바닥을 y=570에 맞추면 top이 corridor-a만 45.5, 나머지는 88~95로 약 47px 차이가 나서, 네
  조각을 이어 붙였을 때 천장 라인이 이음매에서 계단처럼 어긋나 보였다. `compose-floor1-art.py`의
  `ca_crop = (0, 49, 1993, 789)`로 corridor-a 원본 위쪽을 49px 더 잘라내 top을 90.2로 맞춰
  해결했다(가로 위치는 자르지 않아서 문 좌표는 영향 없음).

## 바닥선 검출과 합성

`scripts/compose-floor1-art.py`가 7층과 동일한 방식(이미지 높이의 60~92% 구간에서 행 평균
밝기가 가장 높은 행을 바닥선으로 검출)으로 9장을 4개 파일로 합성한다.

| 최종 파일 | 조각 | x | 목표 폭 | 배율 | src floor_y | top | 스케일된 높이 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `corridor.png` | corridor-a | 0 | 1818 | 0.9122 | 526(원본 575, 위 49px 크롭 후) | 90.2 | 675 |
| `corridor.png` | corridor-b | 1818 | 1268 | 0.7620 | 627 | 92.2 | 720 |
| `corridor.png` | corridor-c | 3086 | 1196 | 0.7401 | 651 | 88.2 | 720 |
| `corridor.png` | corridor-d | 4282 | 718 | 0.5735 | 829 | 94.6 | 720 |
| `harmony.png` | harmony-1 | 0 | 1680 | 0.8768 | 631 | 16.7 | 720 |
| `harmony.png` | harmony-2 | 1680 | 1544 | 0.8410 | 656 | 18.3 | 720 |
| `vision.png` | vision-1 | 0 | 1178 | 0.7344 | 674 | 75.0 | 720 |
| `vision.png` | vision-2 | 1178 | 1178 | 0.7344 | 674 | 75.0 | 720 |
| `clinic.png` | clinic | 0 | 1860 | 0.9231 | 545 | 66.9 | 720 |

캔버스 채움색은 각 그림의 실측 어두운 톤(대략 RGB 3~10)에 맞춘 거의 검은색(`#050505` 등)을
썼다 — 처음에 CSS placeholder(`atrium` 테마)의 밝은 색(`#1d1b17` 등)을 그대로 썼더니 `top`
오프셋 위 빈 띠가 도드라져 보여서 고쳤다.

```
D=<9장을 받은 임시 폴더>
python scripts/compose-floor1-art.py "$D/corridor-a.png" "$D/corridor-b.png" "$D/corridor-c.png" \
  "$D/corridor-d.png" "$D/harmony-1.png" "$D/harmony-2.png" "$D/vision-1.png" "$D/vision-2.png" "$D/clinic.png"
```

| 파일 | 크기 | 내용 |
| --- | --- | --- |
| [corridor.png](corridor.png) | 5000×720 | 복도 전체: Harmony/Vision/건강관리실 전면, 층별 안내판 벽감, 엘리베이터 3대, 비상계단, 화장실, 스피드게이트, 경비로봇, 정문 |
| [harmony.png](harmony.png) | 3224×720 | Harmony Hall(`f1-harmony`) 내부: 출구, 객석 뒷벽, 무대(붉은 커튼) |
| [vision.png](vision.png) | 2356×720 | Vision Hall(`f1-vision`) 내부: 출구, 건물 사진 갤러리 벽(프롬프트는 추상 마커만 요청했는데 도구가 실제 건물/풍경 사진 액자로 그렸다 — 전시관 컨셉에 맞아 그대로 채택) |
| [clinic.png](clinic.png) | 1860×720 | 건강관리실(`f1-clinic`) 내부: 출구, 안쪽의 잠긴 여성휴게실 문 |

## 문 좌표 보정 (2026-09-30, 실측)

7층과 마찬가지로 완성된 그림의 문·엘리베이터·비상계단·화장실 위치가 설계값과 상당히
달라서(30~130px 차이) 실측값으로 `js/floors/floor-01.js`를 고쳤다. 보정 후 좌표를 마젠타
사각형으로 원본 이미지 위에 겹쳐 그려 전부 일치하는지 확인했다.

| 요소 | 설계값 | 실측값 | 적용 |
| --- | --- | --- | --- |
| Harmony Hall 문 | doorX=215, width=170 | x≈223~448 | `doorX: 223, doorWidth: 225` |
| Vision Hall 문 | doorX=600, width=130 | x≈650~793 | `doorX: 650, doorWidth: 143` |
| 건강관리실 문 | doorX=1100, width=110 | x≈1023~1122 | `doorX: 1023, doorWidth: 99` |
| 엘리베이터 3대 | x=1818/2148/2444, width~216 | 문 안쪽 어두운 칸: 1898–2095 / 2192–2390 / 2495–2695 | `elevatorOffsets: [80, 44, 51]`, `elevatorWidthDeltas: [-21, -16, -16]` |
| 비상계단 | x=2906, width=180 | 문 안쪽: 2895–3010(폭 115, 설계보다 훨씬 좁음) | `stairsOffset: -11, stairsWidthDelta: -65` |
| 화장실 문(BUILDING_CORE, 전 층 공용) | doorX=3612, width=145 | x≈3733~3891 | `restroomOverride: { doorX: 3733, doorWidth: 158 }` |
| f1-harmony 출구 | 자동 계산 | harmony.png 문 x≈1215~1420 | `exitX: 1215` |
| f1-vision 출구 | 자동 계산 | vision.png 문 x≈205~310 | `exitX: 205` |
| f1-clinic 출구 | 자동 계산 | clinic.png 문 x≈865~965 | `exitX: 865` |
| 여성휴게실 문(fixture) | x=1680, width=120 | clinic.png 안쪽 문 x≈1600~1725 | `x: 1600, width: 125` |
| 스피드 게이트(fixture) | x=4330, width=120 | x≈4300~4400 | `x: 4300, width: 100` |
| 경비 로봇(fixture) | x=4520, width=72 | x≈4495~4565 | `x: 4495, width: 70` |
| 정문(fixture) | x=4650, width=280 | x≈4600~4940 | `x: 4610, width: 320` |

`stairsOffset`/`stairsWidthDelta`(`scene-builder.js`)와 `restroomOverride`(`registry.js`)는
7층 작업 때 새로 추가한 옵션을 그대로 재사용했다 — 이번에 새 코드 변경은 없었다.

## 연결 (`js/floors/floor-01.js`)

```js
FLOOR1_LAYOUT.backgroundImage = { src: 'assets/background/floor1/corridor.png', height: 720, top: 0 };
// f1-harmony → { src: 'assets/background/floor1/harmony.png', height: 720, top: 0 }, exitX: 1215
// f1-vision  → { src: 'assets/background/floor1/vision.png',  height: 720, top: 0 }, exitX: 205
// f1-clinic  → { src: 'assets/background/floor1/clinic.png',  height: 720, top: 0 }, exitX: 865
```

## 아직 안 한 것 / 확인할 점

- **Playwright 실기 확인 못함**: 7층 때와 같은 이유(이 세션 샌드박스에 네트워크가 막혀
  `npx playwright install`이 실패)로 브라우저 스크린샷 검증은 못 했다. Pillow로 문 좌표를
  원본 그림 위에 겹쳐 그려 육안 확인하는 방식으로 대체했다(`scripts/`에 임시로 만들었다가
  확인 후 삭제함). 브라우저를 쓸 수 있게 되면 7층처럼 `tests/floor1-art.mjs`를 추가해 이미지
  로드·바닥선 정렬·문 판정을 자동 검사하는 게 좋다.
- 복도 4조각의 이음매(x=1818, 3086, 4282)와 Harmony/Vision 각 2조각의 이음매는 확대해서 육안
  검사했고 천장·바닥선이 잘 이어진다.
- Vision Hall의 "기술 연혁 벽" 자리는 프롬프트가 추상 마커만 요청했는데 실제로는 건물/풍경
  사진 액자들이 그려졌다. `FLOOR1_ROOMS`의 `기술 연혁 벽` fixture(`history-wall`, lines 텍스트)는
  그 위에 그대로 겹쳐 그려지므로, 그림의 액자들과 겹치지 않는지 확인이 필요할 수 있다(현재
  fixture 좌표 x=1680은 그림 속 오른쪽 사진 무리와 대략 겹치는 위치다 — 텍스트 라벨 상자라
  작아서 큰 문제는 아니지만, 필요하면 fixture x를 그림의 빈 공간으로 옮긴다).

## 안팎 공간 정합 보정 (2026-10-11)

위 실측 표의 `exitX`는 원본 그림 속 위치다. 현재 게임에서는 `exitArt`로 원본 문·문틀 조각을 옮기고,
이전 자리에는 같은 원본의 벽 조각을 배치한다. PNG 원본과 문 크기는 유지한다.

| 방 | 복도 전면 x / 폭 | 내부 출구 x |
| --- | --- | --- |
| Harmony Hall | 156 / 452 | 898 |
| Vision Hall | 608 / 332 | 510 |
| 건강관리실 | 940 / 262 | 896 |

복도 문 양옆 벽 길이 비율로 내부 위치를 계산하며 조사 테두리도 같은 거리만큼 이동한다.
객석과 진열장·의료 카트는 새 출구를 비웠다. 화장실 전면은 실제 타일 벽 `3630..4245`이며,
내부에 왼쪽 벽 265px를 더해 배경·설비·조사 영역을 함께 옮긴다(출구 x450, 내부 폭2065).
`tests/room-spatial-layout.mjs`가 실제 조립된 출입구 비율, 그림·테두리 정렬, 가구 간섭과 PC·터치 왕복을 검사한다.
