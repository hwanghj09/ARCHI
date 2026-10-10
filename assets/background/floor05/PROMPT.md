# 5층 연구층 단면 에셋 (연구개발실 · 기술연구실 · 회의실)

- 제작: **Python(Pillow·NumPy) 코드 페인팅**. 이미지 생성 모델(image_gen)로 만든 것이 아니다. 작업 환경에 이미지 생성 도구가 없어 벽·가구·조명·질감을 코드로 직접 그렸다. `floor05-paint-source.zip`에서 `python3 scene5.py out.png`를 실행하면 같은 결과가 나온다.
- 참조: `assets/background/floor17/office-interior.png`, `floor17/source.png`, `floor16/amenity-*.png`, `assets/objects/floor-kit/*.png`(화풍·재질·조명·스케일만 참고). 팔레트와 단서는 현재 게임의 5층(`js/floors/floor-05.js`, archive 테마: 슬레이트 석판 + 황토·황동 표지)을 따랐다.
- 방 구성: 사용자 층 구조표의 5F(연구개발실 / 기술연구실 / 회의실, 4F와 연계되는 연구층).
- 7층 에셋과의 차이:

| 항목 | 7층 에셋 | 5층 에셋 |
| --- | --- | --- |
| 구역 구분 | 기둥으로 나눈 열린 구역 | 문이 있는 단면 칸막이벽(강철·목재)으로 나눈 방 3개 |
| 천장 | 노출 천장 | 텍스 천장, 단면으로 드러난 천장 속 배관 |
| 창 | 가로 블라인드 | 세로 루버 |
| 팔레트 | 청회색 | 슬레이트 + 황동 |
| 마감 | — | 회의실 목재 루버 벽 |

## 파일

| 파일 | 크기 | 형식 |
| --- | --- | --- |
| `floor05-research.png` | 3200×556 | RGBA PNG, 배경 투명(알파 0/255 이진), 사방 여백 48px |

## 좌표 (출력 PNG 기준 px)

| 항목 | 값 |
| --- | --- |
| 단면 외곽 | x=48..3152, y=48..508 |
| 천장 슬래브 / 천장 속 | y=48..80 / y=80..180 (회의실은 y=186까지) |
| **바닥선(보행 기준선)** | **y=438**, 전 폭 수평 |
| 바닥 슬래브 | y=438..494 |
| 연구개발실 | x=78..1290 (세로 루버 창 x=104..880, 서가 3개 x=934..1260, 이동식 발판 x=1070..1114) |
| 칸막이 1 (강철문, 배지 리더) | x=1290..1314, 문 높이 205 (y=233..438) |
| 기술연구실(보안 연구) | x=1314..2236 (보안 캐비닛, 망분리 워크스테이션, 감사 로그 프린터, 네트워크 콘솔 작업대, 랙 2대, 빠진 천장 타일) |
| 칸막이 2 (목재문) | x=2236..2260, 문 높이 205 |
| 회의실 | x=2260..3122 (결과판 x=2292..2504, 벽걸이 디스플레이 x=2540..2784, 회의 테이블 x=2336..2960, 기록 보관함 x=2984..3110) |

## 스케일·게임 정렬

- 플레이어 162px = 175cm 기준. 책상 69px, 가장 높은 서가 186px, 랙 186px, 문 205px, 이동식 발판 38px.
- 1:1로 놓으면 `top = 570 - 438 = 132`에서 게임 바닥 `floorY = 570`과 맞는다. 배율이 `s`이면 `top = 570 - 438 × s`.
- **게임 연결은 하지 않았다.** 현재 5층 코드는 복도 + 방 3개(연구 도서실·보안 연구실·AI 권한 심의실) 구조다. 이 단면을 쓰려면 방 배치를 위 좌표에 맞춰 바꿔야 한다.

## 연출 메모 (모두 글자 없이 그림으로만)

- 정전 상태: 천장등은 모두 꺼져 있다. 빛은 다음뿐이다.
  - 창밖 도시광
  - 연구개발실 벽의 배터리 비상등 1개(먼지 입자)
  - 배터리로 켜진 노트북 2대
  - UPS로 켜진 로그 모니터와 랙 LED
  - 회의 스피커폰의 붉은 표시등과 녹화 중인 노트북 카메라 점
  - 비상구 유도등
- 기존 5층 단서와의 연결:
  - 가장 높은 서가 꼭대기의 공책(붉은 끈)과 앞에 놓인 이동식 발판
  - 포스트잇으로 덮인 보안 연구원 모니터
  - 바닥까지 늘어진 감사 로그 출력물
  - 결과판: 1분기 칸만 지워진 채 붉은 원이 쳐져 있고, 남은 막대는 모두 낮은 기준선 아래에 있으며, 높은 기준선은 붉은 점선이다
  - 03:12에 멈춘 회의실 시계
  - 붉은 탭이 붙은 기록 바인더
- 오래 일한 흔적: 의자에 걸친 재킷, 붉은 펜 자국이 있는 출력물 더미, 빠진 루버 날개, 천장 타일이 빠진 자리로 늘어진 케이블과 물 얼룩.

## image_gen 재생성 프롬프트

```text
Use case: stylized-concept.
Asset type: single isolated 2D side-view environment asset for ARCHI, a dark psychological horror / mystery 2D side-scrolling game. Not a concept poster.
Reference images: the 17th-floor office interior and corridor and the 16th-floor amenity backgrounds of the same game, for material, lighting, palette and rendering only; do not copy their layout. Optional: the attached code-painted floor05 asset as composition and coordinate guide.
Create ONE 3200x556 PNG with REAL transparent alpha background, centered, 48px empty transparent margin on all sides, no cast shadow outside the asset.
Strict orthographic side elevation, camera perpendicular to the rear wall, no perspective, no isometric or top-down view.
Architectural cutaway of one floor: concrete ceiling slab section y=48..80, ceiling plenum with ducts, sprinkler pipes and a cable tray y=80..180, suspended ceiling underside y=180, floor top a perfectly straight horizontal line at y=438 edge to edge, floor slab section y=438..494, cut end walls at both sides. Interior floor and walls are part of the asset.
Scale: adult human 162px = 175cm; desks 69px tall, doors 205px tall.
Setting: Korean enterprise database-software research floor (TmaxTibero research division) at midnight during a total power outage. Three rooms in a row, separated by two partition walls drawn in section with open doorways:
x=78..1290 research and development room: slate-gray walls with a thin brass chair rail, a long window with vertical fabric louvers (a few slats turned or missing, one fallen against the sill), two rows of professional developer desks with dual and ultrawide monitors, laptops, thick technical manuals and printed documents, three tall bookcases with a small notebook hidden on top of the tallest one and a two-step library stool in front, a battery emergency light with two lamp heads.
x=1290..1314 steel-door partition with a badge reader.
x=1314..2236 technical (security) research room: windowless perforated acoustic panel walls with an ochre stripe, a tall locked steel security cabinet with keypad, an air-gapped workstation with post-it covered monitors and a hardware security appliance, a line printer with a long fanfold printout spilling to the floor, a network console bench with stacked test switches and a laptop on a console cable, two server racks, two missing ceiling tiles with cables hanging down and a water stain.
x=2236..2260 wooden-door partition.
x=2260..3122 meeting room: dark wood vertical louver wall with brass trim, a whiteboard bar chart whose first column is wiped clean and circled in red with low bars under a dashed threshold and a red dashed upper threshold, a large switched-off wall display, a wall clock stopped at 3:12, a long meeting table with documents, water bottles, a conference speakerphone with a red light and an open laptop still glowing on battery, a records credenza with binders.
Mood: cold, oppressive, muted desaturated slate and brass. Only city glow, the emergency light, a few battery screens, rack LEDs and a green exit pictogram light the floor.
Style: detailed hand-painted 2D illustration, semi-realistic proportions, realistic materials, subtle grunge and aged textures, soft ambient shadows, clear dark outlines so objects read at gameplay distance. Grounded enterprise department, no excessive laboratory equipment, no sci-fi, no fantasy shapes.
No people, no creatures, no robots, no text, letters, digits, logos, UI, watermark or decorative frame.
```
