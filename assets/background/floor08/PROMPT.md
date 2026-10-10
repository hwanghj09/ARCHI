# 8층 QA·제품기획층 단면 에셋 (QA 시험실 · 제품기획 업무 공간 · 공용 제품 회의실)

- 제작: **Python(Pillow·NumPy) 코드 페인팅**. 이미지 생성 모델(image_gen)로 만든 것이 아니다. 작업 환경에 이미지 생성 도구가 없어 벽·가구·조명·질감을 코드로 직접 그렸다. `floor08-paint-source.zip`에서 `python3 scene8.py out.png`를 실행하면 같은 결과가 나온다.
- 참조: `assets/background/floor17/office-interior.png`, `floor17/source.png`, `floor16/amenity-*.png`, `assets/objects/floor-kit/*.png`(화풍·재질·조명·스케일만 참고). 팔레트와 단서는 이전 업로드 ZIP(ARCHI-main_4_1)의 8층(`js/floors/floor-08.js`, qa 테마: 회색 에폭시 바닥 + 노란 안전선 + 콘크리트 회색 벽, QA실·제품기획실)을 따랐다.
- 구역 구성: 사용자 프롬프트와 층 구조표(QA 테스트실 / 제품기획실 / 회의실)가 일치한다. 큰 구역 셋만 두고 작은 사무실은 만들지 않았다.
- 분위기 대비:
  - QA 시험실: 똑같은 시험석 열두 개(앞줄 6 + 어둡게 누른 뒷줄 6)를 같은 간격으로 놓았다. 모니터, 미니 PC, 대기 표시등, 노란 자산 태그, 소형 경광등이 모두 같고, 의자도 전부 같은 자리에 밀어 넣었다. 기계적이고 반복적인 느낌이다.
  - 제품기획 공간: 정돈된 책상, 서류 트레이, 로드맵·칸반 보드, 스탠딩 토론 테이블, 이젤, 발표용 폼보드로 대화 중심의 공간을 만들었다.
- 다른 층 에셋과의 차이:

| 항목 | 8층 에셋 | 다른 층 에셋 |
| --- | --- | --- |
| QA실 | 거푸집 타이 구멍이 남은 노출 콘크리트, 철망 케이블 트레이, 반사 유리 관찰창, 출시 판정 신호등 | — |
| 기획 공간 | 빗물이 흐르는 통유리창 | — |
| 회의실 | 2톤 펠트 흡음 타일, 레일 위 슬라이딩 화이트보드 두 장, 링 펜던트 조명 | — |
| 팔레트 | 콘크리트 회색 + 노랑·검정 안전 줄무늬 | — |

## 파일

| 파일 | 크기 | 형식 |
| --- | --- | --- |
| `floor08-qa-planning.png` | 3200×556 | RGBA PNG, 배경 투명(알파 0/255 이진, 내부 구멍 0), 사방 여백 48px |

## 좌표 (출력 PNG 기준 px)

| 항목 | 값 |
| --- | --- |
| 단면 외곽 | x=48..3152, y=48..508 |
| 천장 슬래브 | y=48..80 |
| **바닥선(보행 기준선)** | **y=438**, 전 폭 수평 |
| 바닥 슬래브 | y=438..494 |
| QA 시험실 | x=78..1300 |
| ㄴ 관찰·재현 장비 | 반사 유리 관찰창 x=100..360·y=198..326, 렌즈를 가린 관찰 카메라 ~x=308..348, 재현 벤치 x=96..336 |
| ㄴ 판정·현황 | 출시 판정 신호등 x≈356, 결함 현황판 x=382..624 |
| ㄴ 시험석 | 벤치 x=650..1290 (앞줄 cx=700..1180, 뒷줄 cx=748..1228, 96px 간격) |
| 칸막이 + 강철문 | x=1300..1324 (문 위 안전 줄무늬, 기획 쪽 비상구 유도등) |
| 제품기획 업무 공간 | x=1324..2340 |
| ㄴ 창·보드 | 비 오는 창 x=1350..1760·y=188..388, 출시 로드맵 x=1790..2092, 기획 보드 x=2112..2322 |
| ㄴ 가구 | 기획 책상 x=1360..1556·1576..1756(요구사항 정의서 ~1612), 스탠딩 테이블 x=1822..1962, 이젤 ~2016, 폼보드 x=2196..2300 |
| 칸막이 + 문 | x=2340..2364 |
| 공용 제품 회의실 | x=2364..3122 (슬라이딩 화이트보드 x=2392..2706, 디스플레이+카메라 바 x=2732..2932, 회의 테이블 x=2410..2986, 링 펜던트 y≈326, 캐비닛 x=3010..3112) |

## 스케일·게임 정렬

- 플레이어 162px = 175cm 기준.

| 대상 | 높이 |
| --- | --- |
| 책상 | 69px |
| 재현 벤치 | 83px |
| 스탠딩 테이블 | 100px |
| 출시 판정 신호등 | 188px |
| 문 | 210px |

- 1:1로 놓으면 `top = 570 - 438 = 132`에서 게임 바닥 `floorY = 570`과 맞는다. 배율이 `s`이면 `top = 570 - 438 × s`.
- **게임 연결은 하지 않았다.** 현재 8층 코드는 복도(QA 공용 시험 구역 포함) + 방 3개(결함 재현실·블라인드 평가실·제품기획실) 구조다. 이 단면을 쓰려면 배치를 위 좌표에 맞춰 바꿔야 한다.

## 연출 메모 (모두 글자 없이 그림으로만)

- **정전 상태**: 천장등·모니터·신호등은 모두 꺼져 있다. 빛은 다음뿐이다.
  - 배터리로 켜진 재현 벤치(조건 칸 셋 중 둘이 초록)와 시험 단말
  - 시험석마다 똑같이 켜진 호박색 대기 표시등
  - 비 오는 창밖 도시광
  - 회의 노트북 한 대, 스피커폰 붉은 등, 비상구 유도등, CCTV 붉은 점
- **기존 8층 단서와의 연결**:
  - 시험 단말 화면의 아날로그 시계가 3시에 맞춰져 있다(시각 조건).
  - 재실 센서 제어함 스위치가 내려져 있고 초록등이 켜져 있다(재실 0명).
  - 관찰 카메라는 렌즈에 덮개를 씌우고 노란 테이프를 감았다.
  - 반사 유리 관찰창은 이쪽에서는 까만 거울일 뿐이다.
  - 결함 현황판은 앞의 세 칸이 비어 있고, 마지막 칸에 카드 47장이 몰려 있다. 구석에 QA 담당의 쪽지가 붙어 있다.
  - 출시 로드맵: 첫 목표(3월)와 둘째 목표(6월) 마름모에 붉은 X가 쳐져 있고, 화살표로 밀린 끝에 붉은 빗금 '보류' 칸이 있다. 옆에 붙은 쪽지가 ARCHI의 의견이다.
  - 요구사항 정의서 맨 위 항목에 붉은 탭이 새로 붙어 있다.
  - 회의실 화이트보드: 우선순위 목록 맨 위 줄에 붉은 상자가 쳐져 있고, 달력에는 표시한 날에서 사흘 뒤 날짜에 붉은 원이 있다(평가 일정 사전 공유).
- **사용감**: 시험 벤치 모서리의 안전 테이프, 재현 기록 출력물, 벽 얼룩, 쌓인 서류.

## image_gen 재생성 프롬프트

```text
Use case: stylized-concept.
Asset type: single isolated 2D side-view environment asset for ARCHI, a dark psychological horror / mystery 2D side-scrolling game. Not a concept poster.
Reference images: the 17th-floor office interior and corridor and the 16th-floor amenity backgrounds of the same game, for material, lighting, palette and rendering only; do not copy their layout. Optional: the attached code-painted floor08 asset as composition and coordinate guide.
Create ONE 3200x556 PNG with REAL transparent alpha background, centered, 48px empty transparent margin on all sides, no cast shadow outside the asset.
Strict orthographic side elevation, camera perpendicular to the rear wall, no perspective, no isometric or top-down view. Depth between the two rows of QA stations is shown only by overlap and atmospheric darkening.
Architectural cutaway of one floor: concrete ceiling slab section y=48..80, floor top a perfectly straight horizontal line at y=438 edge to edge, floor slab section y=438..494, cut end walls at both sides. Interior floor and walls are part of the asset. Only three large areas, no small offices.
Scale: adult human 162px = 175cm; desks 69px tall, doors 210px tall.
Setting: product QA and product planning floor of a large Korean software company headquarters at midnight during a power outage. Grey epoxy floor with a yellow safety line, concrete-grey walls, yellow-black safety stripes.
x=78..1300 QA testing room, technical and repetitive: exposed board-formed concrete wall with formwork tie holes, wire-mesh cable baskets and unlit LED battens; a dark one-way observation window that is only a black mirror from this side; an observation camera with its lens capped and wrapped in yellow tape; a battery-powered reproduction bench with a sealed test box whose small status screen shows two of three green blocks, a test terminal showing an analog clock set to three o'clock, a clamped occupancy-sensor switch box with a green light, a printout curling over the edge; a dark release-gate stack light on a floor stand; a defect kanban board with three empty columns and every card piled into the last column; two long benches of twelve completely identical test stations (same monitor, mini PC, amber standby dot, yellow asset tag and tiny stack lamp), identical chairs pushed in exactly the same way.
x=1300..1324 steel-door partition with a safety stripe and green exit pictogram.
x=1324..2340 product planning workspace, organized and discussion-oriented: a curtain wall streaked with rain over a night city, neat planning desks with laptops, stacked document trays, aligned binders and desk lamps, a thick bound requirements document with one new red tab, a release roadmap board where two milestone diamonds are crossed out in red and pushed to a hatched hold block, a sticky-note planning board, a standing discussion table with printed slides and two stools, an easel, presentation foam boards leaning on the wall.
x=2340..2364 partition with an open door.
x=2364..3122 shared product meeting room: two-tone square felt acoustic wall tiles, two sliding whiteboards on a top rail (a priority list with the top line boxed in red, and a calendar with one date ringed three days after a marked date), a large switched-off display with a camera bar, a long dark meeting table with documents, laptops, mugs and a speakerphone, office chairs, a flat ring pendant light above the table, a low cabinet with binders.
Mood: cold, oppressive, muted desaturated colors, soft ambient shadows, subtle directional light; realistic enterprise interior with subtle wear.
Style: detailed hand-painted 2D illustration, semi-realistic proportions, realistic materials, subtle grunge and aged textures, clear dark outlines so objects read at gameplay distance. No sci-fi, no fantasy shapes.
No people, no creatures, no robots, no text, letters, digits, logos, UI, watermark or decorative frame.
```
