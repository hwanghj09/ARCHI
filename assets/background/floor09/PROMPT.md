# 9층 사업본부 단면 에셋 (사업 업무 공간 · 영업·고객 관리 구역 · 프로젝트룸)

- 제작: **Python(Pillow·NumPy) 코드 페인팅**. 이미지 생성 모델(image_gen)로 만든 것이 아니다. 작업 환경에 이미지 생성 도구가 없어 벽·가구·조명·질감을 코드로 직접 그렸다. `floor09-paint-source.zip`에서 `python3 scene9.py out.png`를 실행하면 같은 결과가 나온다.
- 참조: `assets/background/floor17/office-interior.png`, `floor17/source.png`, `floor16/amenity-*.png`, `assets/objects/floor-kit/*.png`(화풍·재질·조명·스케일만 참고). 팔레트와 단서는 이전 업로드 ZIP(ARCHI-main_4_1)의 9층(`js/floors/floor-09.js`, wine 테마: 와인색 카펫 + 목탄색 벽, TmaxTibero 사업본부)을 따랐다.
- 구역 구성: 사용자 프롬프트와 층 구조표(사업본부 업무실 / 영업회의실 / 프로젝트룸)가 일치한다. 작은 개인 사무실 없이 큰 기능 구역 셋으로 나눴다.
  - 사업 업무 공간 ↔ 영업 구역: 기둥과 낮은 화분 박스로만 구분했다.
  - 영업 구역 ↔ 프로젝트룸: 원목 틀 유리 칸막이로 구분했다.
- 기술층과의 차이: 서버·랙·측정 장비를 넣지 않고 소통·계획·고객·사업 운영이 드러나게 했다.

| 구역 | 넣은 것 |
| --- | --- |
| 사업 업무 공간 | 원목 베니션 블라인드, 월넛 징두리 벽과 책상 칸막이, 계약서 더미와 회사 도장·인주, 계산기, 명함꽂이, 감사패 진열장, 액자 그림, 커피머신이 놓인 크레덴자 |
| 영업·고객 관리 | 고객사 핀과 실이 꽂힌 한반도 지도, 자석식 고객사 현황판, 브로슈어 거치대, 헤드셋을 건 영업석, 대형 복합기, 팩스, 벽걸이 전화 교환기, 월넛 베니어 서류 캐비닛 |
| 프로젝트룸 | 트랙 스폿 조명, 자석식 일정판(간트), 제안서 게시판, 디스플레이, 월넛 대형 테이블, 가죽 의자 |

## 파일

| 파일 | 크기 | 형식 |
| --- | --- | --- |
| `floor09-business.png` | 3200×556 | RGBA PNG, 배경 투명(알파 0/255 이진, 내부 구멍 0), 사방 여백 48px |

## 좌표 (출력 PNG 기준 px)

| 항목 | 값 |
| --- | --- |
| 단면 외곽 | x=48..3152, y=48..508 |
| 천장 슬래브 | y=48..80 |
| **바닥선(보행 기준선)** | **y=438**, 전 폭 수평 |
| 바닥 슬래브 | y=438..494 |
| 사업 업무 공간 | x=78..1200 (블라인드 창 x=104..760·y=190..368, 업무 책상 x=110..440·464..770, 감사패 진열장 x=784..894, 그림 x=924..1084, 크레덴자 x=912..1180) |
| 기둥 + 화분 박스 | x=1200..1236 (화분 x=1150..1290) |
| 영업·고객 관리 구역 | x=1236..2300 |
| ㄴ 벽면 | 지도 x=1262..1392·y=186..326, 현황판 x=1410..1690, 브로슈어 x=1708..1748, 전화 교환기 x=2236..2276 |
| ㄴ 가구·기기 | 영업석 x=1256..1640·1764..2010, 복합기 x=1660..1744, 서류 캐비닛 x=2026..2288 (가운데 위에 라이선스 대장, 왼쪽 위에 팩스) |
| 유리 칸막이 | x=2300..2318 (열린 유리문, 프로젝트룸 쪽 예약 패널 x=2334..2356, 영업 쪽 비상구 유도등) |
| 프로젝트룸 | x=2318..3122 |
| ㄴ 벽면·천장 | 트랙 조명 y≈158, 간트 보드 x=2342..2640, 제안서 x=2656..2762, 디스플레이 x=2780..2962, 천장 PTZ 카메라 x≈2870 |
| ㄴ 가구·기기 | 테이블 x=2400..2980, 삼각대 카메라 x≈3070 |

## 스케일·게임 정렬

- 플레이어 162px = 175cm 기준.

| 대상 | 높이 |
| --- | --- |
| 책상 | 69px |
| 감사패 진열장 | 180px |
| 서류 캐비닛 | 132px |
| 복합기 | 116px |

- 1:1로 놓으면 `top = 570 - 438 = 132`에서 게임 바닥 `floorY = 570`과 맞는다. 배율이 `s`이면 `top = 570 - 438 × s`.
- **게임 연결은 하지 않았다.** 현재 9층 코드는 복도(라운지) + 방 3개(고객 브리핑 센터·사업팀 사무실·라이선스 관리실) 구조다. 이 단면을 쓰려면 배치를 위 좌표에 맞춰 바꿔야 한다.

## 연출 메모 (모두 글자 없이 그림으로만)

- **정전 상태**: 천장등과 모니터는 모두 꺼져 있다. 빛은 다음뿐이다.
  - 원목 블라인드 틈으로 들어오는 도시광
  - 배터리로 켜진 회의실 예약 패널
  - 전화기 메시지등, 카메라들의 붉은 점
  - 비상구 유도등
- **기존 9층 단서와의 연결**:
  - 감사패 진열장: 금빛 명판이 달린 낡은 원목 감사패들 사이에, 맨 위 칸 끝 하나만 검은 몸체에 은빛 명판이 달린 새 패다(사내 12층 ARCHI팀 감사패).
  - 고객사 현황판: 사용량 막대 가운데 하나(사내)만 압도적으로 붉게 치솟아 있고 파란 원이 쳐져 있다.
  - 한반도 지도: 모든 고객사 핀의 실이 본사 한 점으로 모인다.
  - 라이선스 대장: 펼친 면에 똑같은 붉은 '자동 승인' 도장이 줄지어 찍혀 있다.
  - 프로젝트룸 예약 패널: 하루 시간 막대 중 새벽 3시 칸 하나만 붉게 예약돼 있다.
  - 구석 삼각대 카메라는 화면이 아니라 좌석 쪽을 향해 붉은 녹화등을 켜 두었고, 천장 PTZ 카메라도 테이블을 내려다본다(사람 반응 수집).
  - 일정판: 오늘 선(붉은 세로선) 오른쪽 끝에 붉은 자석 넷이 몰려 있다.
- **사용감**: 부러져 늘어진 블라인드 살, 계약서의 도장 자국, 엎어 둔 태블릿, 쌓인 제안서와 서류.

## image_gen 재생성 프롬프트

```text
Use case: stylized-concept.
Asset type: single isolated 2D side-view environment asset for ARCHI, a dark psychological horror / mystery 2D side-scrolling game. Not a concept poster.
Reference images: the 17th-floor office interior and corridor and the 16th-floor amenity backgrounds of the same game, for material, lighting, palette and rendering only; do not copy their layout. Optional: the attached code-painted floor09 asset as composition and coordinate guide.
Create ONE 3200x556 PNG with REAL transparent alpha background, centered, 48px empty transparent margin on all sides, no cast shadow outside the asset.
Strict orthographic side elevation, camera perpendicular to the rear wall, no perspective, no isometric or top-down view.
Architectural cutaway of one floor: concrete ceiling slab section y=48..80, floor top a perfectly straight horizontal line at y=438 edge to edge, floor slab section y=438..494, cut end walls at both sides. Interior floor and walls are part of the asset. Three large functional areas only, no small private offices.
Scale: adult human 162px = 175cm; desks 69px tall.
Setting: business division floor of a large Korean software company headquarters at midnight during a power outage. It must feel clearly different from technical floors: communication, planning, customers and business operations. Wine-colored carpet, charcoal walls, warm walnut wood, small brass accents.
x=78..1200 professional business office: a stepped plaster ceiling with a dark cove slot, a window with wooden venetian blinds (one slat snapped and hanging) letting thin stripes of city light through, walnut wainscot, business desks with low walnut screens, docked laptops and monitors, desk phones, contract stacks with seal impressions, a Korean company seal and red ink pad, a calculator, business-card holders, leather office chairs; a glass display cabinet packed with old wooden award plaques with brass plates where the newest one is black with a silver plate; a framed abstract landscape painting; a walnut credenza with binders and a coffee machine.
x=1200..1236 column and a low planter box with plants.
x=1236..2300 sales and customer management area: a framed map of the Korean peninsula with customer pins whose red threads all run back to one point, a magnetic customer status board with name cards in columns and a printed usage chart where one red bar dwarfs the others, a brochure rack, sales workstations with dark wine fabric screens, dual monitors, headsets and desk phones (one with a red message light), tabbed customer folders; a floor-standing multifunction printer, a fax machine with curled paper on a filing cabinet, a wall-mounted key-telephone system, walnut-veneer filing cabinets with brass pulls and an open ledger showing a column of identical red approval stamps.
x=2300..2318 walnut-framed glass partition with an open glass door, a small room-booking panel on battery with one block lit at three in the morning, a green exit pictogram.
x=2318..3122 project room: dark ceiling with a track of spotlights aimed at the boards, a magnetic Gantt project board with a red today line and red magnets bunched at the far right, a board of pinned proposals, a large switched-off display, a ceiling PTZ camera with a red light, a long walnut table with proposals, binders, laptops, a face-down tablet, mugs and a presenter clicker, leather chairs, and a camera on a tripod in the corner aimed at the seats rather than the screen, its red recording light on.
Mood: organized but slightly worn professional corporate interior; cold, oppressive, muted desaturated colors, soft ambient shadows, subtle directional light.
Style: detailed hand-painted 2D illustration, semi-realistic proportions, realistic materials, subtle grunge and aged textures, clear dark outlines so objects read at gameplay distance. No sci-fi, no fantasy shapes.
No people, no creatures, no robots, no text, letters, digits, logos, UI, watermark or decorative frame.
```
