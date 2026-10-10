# 6층 기술본부 단면 에셋 (기술 개발 업무 공간 · 공용 엔지니어링 구역 · 기술 회의실)

- 제작: **Python(Pillow·NumPy) 코드 페인팅**. 이미지 생성 모델(image_gen)로 만든 것이 아니다. 작업 환경에 이미지 생성 도구가 없어 벽·가구·조명·질감을 코드로 직접 그렸다. `floor06-paint-source.zip`에서 `python3 scene6.py out.png`를 실행하면 같은 결과가 나온다.
- 참조: `assets/background/floor17/office-interior.png`, `floor17/source.png`, `floor16/amenity-*.png`, `assets/objects/floor-kit/*.png`(화풍·재질·조명·스케일만 참고). 팔레트와 단서는 현재 게임의 6층(`js/floors/floor-06.js`, oncall 테마: 올리브 카펫 타일 + 카키 벽 + 겨자색 표지, TmaxTibero 기술본부)을 따랐다.
- 구역 구성: 사용자 프롬프트의 세 구역을 따랐다. 층 구조표(기술개발실 / 개발팀 업무실 / 기술회의실)와도 일치한다.
- 조명: 게임 6층은 정전 상태지만, 프롬프트에 "slightly cold fluorescent lighting"이 있다. 그래서 비상 안정기(배터리 팩)가 달린 형광등 몇 개만 차갑게 켜 두고 나머지는 꺼 두었다(업무 공간 1, 엔지니어링 구역 1, 회의실 1개는 반쯤 깜빡임).
- 다른 층 에셋과의 차이:

| 항목 | 6층 에셋 | 2~5·7층 에셋 |
| --- | --- | --- |
| 책상 | 상부 서류장(hutch)이 달린 철제 개발자 책상 | — |
| 창 | 하단 반투명 필름 + 바깥 가로 차양 핀 | 블라인드·루버·롤스크린 |
| 엔지니어링 구역 | 손잡이 바퀴가 달린 이동식 서고, 대형 플로터, 벽걸이 네트워크 캐비닛 | — |
| 회의실 | 벽 전체가 화이트보드 | — |
| 조명 | 비상 형광등의 차가운 빛 웅덩이 | 형광등이 켜진 층은 6층뿐 |
| 팔레트 | 올리브·카키·겨자색 | — |

## 파일

| 파일 | 크기 | 형식 |
| --- | --- | --- |
| `floor06-tech-division.png` | 3200×556 | RGBA PNG, 배경 투명(알파 0/255 이진, 내부 구멍 0), 사방 여백 48px |

## 좌표 (출력 PNG 기준 px)

| 항목 | 값 |
| --- | --- |
| 단면 외곽 | x=48..3152, y=48..508 |
| 천장 슬래브 / 천장 속 | y=48..80 / y=80..172, 텍스 천장선 y=172 |
| **바닥선(보행 기준선)** | **y=438**, 전 폭 수평 |
| 바닥 슬래브 | y=438..494 |
| 기술 개발 업무 공간 | x=78..1340 (창 x=104..1316·y=198..338, 서류장 책상 x=100..500·524..924·948..1320, 켜진 형광등 x=450..560) |
| 기둥 | x=1340..1378 |
| 공용 엔지니어링 구역 | x=1378..2336 |
| ㄴ 서고·플로터·게시물 | 이동식 서고 x=1392..1600, 플로터 x=1616..1748, 도면 게시판 x=1612..1900, 야간 승인 규칙판 x=1920..1990 |
| ㄴ 작업대 | x=1770..2110 (당직 전화 ~2070, VPN 토큰·대장 x=1950..2020, 신청서 묶음 x=1784..1814) |
| ㄴ 회선 장비 | 벽 네트워크 캐비닛 x=2128..2190, 전용선 단말함 x=2208..2250, 바닥 관통 슬리브 x≈2296(광케이블이 슬래브 단면을 뚫고 아래로), 사용 기록지 x=2262..2320 |
| 칸막이 + 문 | x=2336..2360 (엔지니어링 구역 쪽에 겨자색 명판) |
| 기술 회의실 | x=2360..3122 (화이트보드 벽 x=2384..2822·y=186..326, 디스플레이+카메라 바 x=2852..3028, 회의 테이블 x=2414..2996, 캐비닛 x=3040..3112) |

## 스케일·게임 정렬

- 플레이어 162px = 175cm 기준.

| 대상 | 높이·위치 |
| --- | --- |
| 책상 | 69px |
| 상부 서류장 | 바닥에서 136~178px |
| 이동식 서고 | 185px |
| 문 | 210px |

- 1:1로 놓으면 `top = 570 - 438 = 132`에서 게임 바닥 `floorY = 570`과 맞는다. 배율이 `s`이면 `top = 570 - 438 × s`.
- **게임 연결은 하지 않았다.** 현재 6층 코드는 복도 + 방 3개(원격 지원실·회선 관리실·당직실) 구조다. 이 단면을 쓰려면 배치를 위 좌표에 맞춰 바꿔야 한다.

## 연출 메모 (모두 글자 없이 그림으로만)

- **기존 6층 단서와의 연결**:
  - 작업대의 당직 전화(UPS)가 울리는 중이다. 액정과 붉은 벨 램프가 켜져 있다.
  - VPN 토큰 열두 개 가운데 붉은 것 하나, 그 옆에 대장.
  - 야간 승인 규칙판: 인쇄된 규칙 아래 테이프로 덧붙인 파란 볼펜 메모.
  - 전용선 단말함: 낡은 회색 케이블 사이로 새 노란 광케이블 하나가 프린터 라벨을 단 채 바닥 슬리브로 들어가 슬래브를 뚫고 아래층(B2)으로 내려간다.
  - 회선 사용 기록지: 하루 종일 낮은 선이다가 03:05~03:40만 100%로 꽉 찬 붉은 칸.
  - 회선 신청서 스무 장: 같은 붉은 도장이 찍힌 똑같은 서류 더미.
  - 회의실 화이트보드: B2 서버 묶음에서 고객사 DR 센터로 가는 등록된 파란 선과, DR 센터를 지나쳐 정체불명의 구름 모양까지 이어진 붉은 점선(붉은 원). 시간 막대에는 03:05~03:40 칸만 칠해져 있다.
  - 포스트잇으로 뒤덮인 엔지니어 모니터.
- **오래 일한 흔적**: 의자에 걸친 재킷, 책상 아래 접이식 매트, 서류장 위 말아 둔 도면과 상자, 천장 배관 쪽 누수 얼룩, 벗겨진 창 필름 모서리, 케이블이 꽉 찬 천장 트레이.

## image_gen 재생성 프롬프트

```text
Use case: stylized-concept.
Asset type: single isolated 2D side-view environment asset for ARCHI, a dark psychological horror / mystery 2D side-scrolling game. Not a concept poster.
Reference images: the 17th-floor office interior and corridor and the 16th-floor amenity backgrounds of the same game, for material, lighting, palette and rendering only; do not copy their layout. Optional: the attached code-painted floor06 asset as composition and coordinate guide.
Create ONE 3200x556 PNG with REAL transparent alpha background, centered, 48px empty transparent margin on all sides, no cast shadow outside the asset.
Strict orthographic side elevation, camera perpendicular to the rear wall, no perspective, no isometric or top-down view.
Architectural cutaway of one floor: concrete ceiling slab section y=48..80, ceiling plenum with duct, sprinkler pipe and an overfull cable tray y=80..172, mineral-board suspended ceiling line at y=172 with recessed 2x4 fluorescent troffers, floor top a perfectly straight horizontal line at y=438 edge to edge, floor slab section y=438..494, cut end walls at both sides. Interior floor and walls are part of the asset.
Scale: adult human 162px = 175cm; desks 69px tall, doors 210px tall.
Setting: technical division floor (TmaxTibero database technical support) of a large Korean software company headquarters at midnight; most lights are off, only a few troffers stay lit on emergency ballasts with slightly cold fluorescent light pools, one flickering. Olive carpet tiles, khaki walls, small mustard accents.
x=78..1340 technical development workspace: a band window with frosted privacy film on the lower part and exterior horizontal sunshade fins over a night city; three rows of steel developer desks with overhead binder hutches (a few flipper doors open showing binders, rolled drawings and boxes on top), large dual and portrait monitors, keyboards, document stacks, mugs, PC towers and cables; one monitor covered in sticky notes, a jacket over a chair, a folded mat under a desk, one laptop still glowing on battery.
x=1340..1378 column with a mustard band.
x=1378..2336 shared engineering area: compact mobile archive shelving with three-spoke handwheels and one aisle open, a wide-format plotter with a long drawing curling into its basket, a board of pinned architecture drawings, a framed night-approval rule sheet with a taped handwritten addition, an engineering bench with a large monitor, a small network switch and patch cables, a stack of twenty identical stamped request forms, a VPN token tray with a ledger, a desk phone ringing with its display lit and a red ring lamp; a wall network cabinet, a circuit termination box from which one new bright yellow fibre cable with a printed label runs down into a core-drilled floor sleeve and continues through the slab section, a printed usage log with one short saturated red block.
x=2336..2360 partition with an open door and a blank mustard room plate.
x=2360..3122 technical meeting room: a full-width whiteboard wall showing a replication topology (a registered blue link to one site and a red dashed link passing it to an unknown cloud shape circled in red) and a 24-hour bar with one short slot filled, a large switched-off display with a video-conference camera bar, a long light laminate meeting table with laptops, documents, mugs and a speakerphone, office chairs, a steel credenza with binders.
Mood: highly focused software engineering office, realistic corporate rather than futuristic lab; cold, oppressive, muted desaturated colors, soft ambient shadows.
Style: detailed hand-painted 2D illustration, semi-realistic proportions, realistic materials, subtle grunge and aged textures, clear dark outlines so objects read at gameplay distance. No sci-fi, no fantasy shapes.
No people, no creatures, no robots, no text, letters, digits, logos, UI, watermark or decorative frame.
```
