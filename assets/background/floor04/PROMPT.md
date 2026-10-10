# 4층 연구개발층 단면 에셋 (연구개발 업무 공간 · 개발자 업무 구역 · 연구 회의실)

- 제작: **Python(Pillow·NumPy) 코드 페인팅**. 이미지 생성 모델(image_gen)로 만든 것이 아니다. 작업 환경에 이미지 생성 도구가 없어 벽·가구·조명·질감을 코드로 직접 그렸다. `floor04-paint-source.zip`에서 `python3 scene4.py out.png`를 실행하면 같은 결과가 나온다.
- 참조: `assets/background/floor17/office-interior.png`, `floor17/source.png`, `floor16/amenity-*.png`, `assets/objects/floor-kit/*.png`(화풍·재질·조명·스케일만 참고). 팔레트와 단서는 현재 게임의 4층(`js/floors/floor-04.js`, rnd 테마: 흰 에폭시 바닥 + 청회색 벽 + 민트 표지)을 따랐다.
- 구역 구성: 사용자가 준 4층 영어 프롬프트의 세 구역을 따랐다. 층 구조표의 4F 셋째 칸은 "테스트룸"이지만, 프롬프트는 "compact research meeting room"이라 회의실로 만들었다.
- 다른 층 에셋과의 차이:

| 항목 | 7층 에셋 | 5층 에셋 | 4층 에셋 |
| --- | --- | --- | --- |
| 구역 구분 | 기둥 사이 열린 구역 | 칸막이벽으로 나눈 방 | 열린 업무 공간 + 유리 회의실 |
| 천장 | 노출 천장 | 텍스 천장 | 흡음 배플 천장 |
| 창 | 원경 스카이라인 | 세로 루버 | 커튼월 + 롤스크린, 길 건너 건물 정면·가로수·나트륨 가로등 |
| 팔레트 | 청회색 | 슬레이트·황동 | 청회색·민트, 흰 에폭시 바닥 |

## 파일

| 파일 | 크기 | 형식 |
| --- | --- | --- |
| `floor04-rnd.png` | 3200×556 | RGBA PNG, 배경 투명(알파 0/255 이진, 내부 구멍 0), 사방 여백 48px |

## 좌표 (출력 PNG 기준 px)

| 항목 | 값 |
| --- | --- |
| 단면 외곽 | x=48..3152, y=48..508 |
| 천장 슬래브 | y=48..80 (배플 하단 y≈164, 회의실 천장 y=172) |
| **바닥선(보행 기준선)** | **y=438**, 전 폭 수평 |
| 바닥 슬래브 | y=438..494 |
| 연구개발 업무 공간 | x=78..1000 (테스트 랙, 서버·삼중 모니터 책상, 테이프 카트, 벽 UPS 분배기, 로그 판독기 책상, 테이프 선반) |
| 기둥 | x=1000..1040 (민트 모서리 보호대) |
| 개발자 업무 구역 | x=1040..2462 (커튼월 x=1060..2446·y=160..416, 앞줄 벤치 x=1124..1640·1796..2312, 뒷줄 벤치 x=1080..2440, 넘어진 의자 x≈1672..1754) |
| 유리 칸막이 | x=2462..2474 (유리문은 열린 채, 카드 리더, 비상구 유도등) |
| 연구 회의실 | x=2474..3122 (해시 사슬 보드 x=2500..2756, 회의 테이블 x=2536..2884, 이동식 디스플레이 x≈2889..3035, 플립차트 x=3054..3102) |

## 스케일·게임 정렬

- 플레이어 162px = 175cm 기준. 책상 69px, 랙 150px, 이동식 디스플레이 화면 하단 96px.
- 1:1로 놓으면 `top = 570 - 438 = 132`에서 게임 바닥 `floorY = 570`과 맞는다. 배율이 `s`이면 `top = 570 - 438 × s`.
- **게임 연결은 하지 않았다.** 현재 4층 코드는 복도 + 방 3개(로그 연구실·백업 보관실·연구원 사무실) 구조다. 이 단면을 쓰려면 배치를 위 좌표에 맞춰 바꿔야 한다.

## 연출 메모 (모두 글자 없이 그림으로만)

- **정전 상태**: 천장등과 모니터는 모두 꺼져 있다. 빛은 다음뿐이다.
  - 길 건너 건물의 켜진 사무실 창
  - 아래에서 올라오는 나트륨 가로등빛(가로수 윤곽과 배플 아랫면에 비침)
  - UPS 하나로 켜진 로그 판독기·모니터·UPS 표시창
  - 배터리로 켜진 노트북 몇 대
  - 비상구 유도등과 CCTV 붉은 점
- **뒷줄 처리**: 원근 없이 깊이를 주려고 뒷줄 벤치는 따로 그린 뒤 어둡고 푸르게 눌렀다.
- **기존 4층 단서와의 연결**:
  - UPS 분배기: 출력 세 칸 중 셋째(판독기)만 켜져 있고, 둘째 줄은 천장 속 보관실 도어락으로 올라간다.
  - 꺼진 냉각 팬
  - 반출 대장 클립보드가 걸린 테이프 카트
  - 테이프 선반 맨 아래 칸에서 빛을 받는 테이프 한 개
  - 해시 사슬 보드: 넷째 블록이 지워져 붉은 원이 쳐져 있고, 그 뒤 연결이 붉은 점선으로 끊긴다. 24시간 줄의 03~04시 칸에는 붉은 빗금이 쳐져 있다.
  - 과제 요청 카드: 붉은 반려 도장 위에 민트색 승인 체크가 덧찍혀 있다.
  - 포스트잇이 몰린 선임 자리
- **오래 일한 흔적**: 통로에 넘어진 의자, 의자에 걸친 재킷, 끝까지 내려와 찢어진 롤스크린, 말라 버린 화분, 전원 기둥마다 늘어진 케이블.

## image_gen 재생성 프롬프트

```text
Use case: stylized-concept.
Asset type: single isolated 2D side-view environment asset for ARCHI, a dark psychological horror / mystery 2D side-scrolling game. Not a concept poster.
Reference images: the 17th-floor office interior and corridor and the 16th-floor amenity backgrounds of the same game, for material, lighting, palette and rendering only; do not copy their layout. Optional: the attached code-painted floor04 asset as composition and coordinate guide.
Create ONE 3200x556 PNG with REAL transparent alpha background, centered, 48px empty transparent margin on all sides, no cast shadow outside the asset.
Strict orthographic side elevation, camera perpendicular to the rear wall, no perspective, no isometric or top-down view. Depth between rows of desks is shown only by overlap and atmospheric darkening, never by size change or converging lines.
Architectural cutaway of one floor: concrete ceiling slab section y=48..80, floor top a perfectly straight horizontal line at y=438 edge to edge, floor slab section y=438..494, cut end walls at both sides. Interior floor and walls are part of the asset.
Scale: adult human 162px = 175cm; desks 69px tall.
Setting: research and development floor of a large Korean database / enterprise software company (TmaxTibero research division) at midnight during a power outage. Modern but slightly worn: blue-gray walls with a mint accent stripe, glossy white epoxy floor.
x=78..1000 research and development workspace under an exposed ceiling with cable ladder: a small test server rack, a desk with stacked 1U test servers (one lid open), three monitors on arms and laptops, a tape cartridge cart with a clipboard, a wall-mounted three-output power distributor with only one output lamp lit in mint, a desk with a tape drive log reader and the only working monitor glowing mint from a small UPS, an unpowered box fan, an open shelf of backup tapes with one tape on the bottom shelf catching light.
x=1000..1040 structural column with mint corner guards.
x=1040..2462 larger developer work area under hanging acoustic baffles: a full-height curtain wall with roller shades at different heights (one torn), showing a lit office facade across the street, dark tree crowns and warm sodium street light rising from below; two long front benches with dual-monitor workstations, ceiling power poles feeding cables, documents, mugs and sticky notes, a darker back row of workstations behind them, one office chair tipped over in the aisle, a mobile pinboard of request cards, a withered plant and a copier.
x=2462..2474 glass partition with an open glass door, card reader and green exit pictogram.
x=2474..3122 compact research meeting room with fabric wall panels: a whiteboard hash-chain diagram with the fourth block erased and circled in red and the chain broken after it, a 24-hour timeline with the 3-4 o'clock slot hatched in red, pinned technical printouts, a large white meeting table with documents and laptops, mesh chairs, a presentation display on a rolling stand and a flip chart.
Mood: quiet, focused, cold and oppressive; muted desaturated colors, soft ambient shadows, subtle directional light from the windows.
Style: detailed hand-painted 2D illustration, semi-realistic proportions, realistic materials, subtle grunge and aged textures, clear dark outlines so objects read at gameplay distance. Grounded enterprise department, no sci-fi, no fantasy shapes.
No people, no creatures, no robots, no text, letters, digits, logos, UI, watermark or decorative frame.
```
