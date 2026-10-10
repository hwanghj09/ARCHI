# 10층 경영관리층 단면 에셋 (경영관리 사무실 · 임원 회의실 · 임원실)

- 제작: **Python(Pillow·NumPy) 코드 페인팅**. 이미지 생성 모델(image_gen)로 만든 것이 아니다. 작업 환경에 이미지 생성 도구가 없어 벽·가구·조명·질감을 코드로 직접 그렸다. `floor10-paint-source.zip`에서 `python3 scene10.py out.png`를 실행하면 같은 결과가 나온다.
- 참조: `assets/background/floor17/office-interior.png`, `floor17/source.png`, `floor16/amenity-*.png`, `assets/objects/floor-kit/*.png`(화풍·재질·조명·스케일만 참고). 팔레트와 단서는 이전 업로드 ZIP(ARCHI-main_4_1)의 10층(`js/floors/floor-10.js`, finance 테마: 짙은 옥색 벽 + 크림색 몰딩 + 황동, 경영관리본부)을 따랐다.
- 구역 구성: 사용자 프롬프트와 층 구조표(경영관리실 / 경영회의실 / 임원실)가 일치한다.
- 위계 표현: 사치스러운 장식 없이 공간이 점점 닫히고 조용해지게 했다.

| 단계 | 경영관리 사무실 | 임원 회의실 | 임원실 |
| --- | --- | --- | --- |
| 칸막이 | — | 원목 틀 유리 칸막이 | 칠한 원목 칸막이 |
| 바닥 | 옥색 카펫 | 짙은 카펫 | 짙은 원목 마루 |
| 밀도 | 책상과 사무기기가 빽빽함 | 가지런히 놓인 가구 | 큰 책상 하나 |

  - 회의실에는 똑같은 하이백 의자들 끝에 한 치수 큰 상석 의자를 옆모습으로 두었다.
  - 임원실 입구에 비서 데스크(관문)를 두고, 그 안에 큰 책상과 커튼 친 창을 배경으로 높은 등받이 의자의 실루엣을 세웠다.
- 다른 층 에셋과의 차이:

| 항목 | 10층 에셋 |
| --- | --- |
| 창 | 크림색 문틀을 두른 세로로 긴 개별 창(펀치드 윈도) |
| 벽 | 크림색 패널 몰딩 징두리, 짙은 원목 미디어 월 |
| 회의실 | 블랙아웃 블라인드(가장자리로 새는 빛), 좌석마다 구즈넥 마이크 |
| 임원실 | 무거운 옥색 드레이프 + 쉬어 커튼, 유리문 원목 책장 |

## 파일

| 파일 | 크기 | 형식 |
| --- | --- | --- |
| `floor10-management.png` | 3200×556 | RGBA PNG, 배경 투명(알파 0/255 이진, 내부 구멍 0), 사방 여백 48px |

## 좌표 (출력 PNG 기준 px)

| 항목 | 값 |
| --- | --- |
| 단면 외곽 | x=48..3152, y=48..508 |
| 천장 슬래브 | y=48..80 |
| **바닥선(보행 기준선)** | **y=438**, 전 폭 수평 |
| 바닥 슬래브 | y=438..494 |
| 경영관리 사무실 | x=78..1280 |
| ㄴ 벽면 | 개별 창 x=480..560·680..760·880..960(y=184..298), 결산 보드 x=1000..1262 |
| ㄴ 수납 | 서류 캐비닛 x=96..320, 진열장 x=330..430 |
| ㄴ 책상·사무기기 | 책상 x=456..800·820..1150, 문서 세단기 x=1160..1196, 소형 금고 x=1210..1254 |
| 유리 칸막이 | x=1280..1300 (열린 유리문, 사무실 쪽 비상구 유도등) |
| 임원 회의실 | x=1300..2280 |
| ㄴ 벽면 | 블랙아웃 창 x=1330..1560, 미디어 월 x=1600..1980(화면 x=1650..1930·y=204..304) |
| ㄴ 가구 | 회의 테이블 x=1340..2120, 하이백 의자 6개 x=1420..1970, 상석 의자 x≈2180, 크레덴자 x=2010..2250 |
| 원목 칸막이 + 문 | x=2280..2304 |
| 임원실 | x=2304..3122 |
| ㄴ 입구 쪽 | 비서 데스크 x=2320..2450, 이중 잠금 서류함 x=2462..2546, 코트 걸이 x≈2558 |
| ㄴ 창 | 창 x=2600..2860, 드레이프 x=2564..2626·2834..2896 |
| ㄴ 가구 | 임원 책상 x=2612..2848, 손님 의자 x≈2668·2794, 책장 x=2906..3116 |

## 스케일·게임 정렬

- 플레이어 162px = 175cm 기준.

| 대상 | 높이 |
| --- | --- |
| 업무 책상 | 69px |
| 회의 테이블 | 72px |
| 임원 책상 | 76px |
| 임원 의자 등받이 | 바닥에서 약 188px |
| 책장 | 200px |
| 문 | 210px |

- 1:1로 놓으면 `top = 570 - 438 = 132`에서 게임 바닥 `floorY = 570`과 맞는다. 배율이 `s`이면 `top = 570 - 438 × s`.
- **게임 연결은 하지 않았다.** 현재 10층 코드는 복도 + 방 3개(재무회계팀 사무실·본부장실·금고실) 구조다. 이 단면을 쓰려면 배치를 위 좌표에 맞춰 바꿔야 한다.

## 연출 메모 (모두 글자 없이 그림으로만)

- **정전 상태**: 천장등과 모니터는 모두 꺼져 있다. 빛은 다음뿐이다.
  - 개별 창과 임원실 쉬어 커튼 너머의 도시광
  - 회의실 블랙아웃 블라인드 가장자리로 새는 빛
  - 상석 자리 마이크 하나의 붉은 등
  - 비서석·임원석 전화의 붉은 등, 오디오 허브 초록등
  - 비상구 유도등, CCTV 붉은 점
- **기존 10층 단서와의 연결**:
  - 회계 책상: 펼친 전기요금 고지서의 심야 칸에 노란 형광펜이 칠해져 있다.
  - 결산 보드: 할 일 목록 중 한 줄에 표시 세 개(세 번째 문의)와 붉은 원, 오른쪽에 파란 선으로 따로 떼어 낸 프로젝트 비용 칸이 있다.
  - 재무팀장 책상: 살짝 열린 서랍 속 봉투에 꼬리표 달린 열쇠가 들어 있다.
  - 진열장: 감사패 사이의 액자 사진은 어두운 복도와 작은 초록 표지판이 붙은 문이다(B2 서버실 앞).
  - 비서 데스크의 구매 요청서 사본: 결재란 네 칸이 비어 있고, 마지막 칸만 다른 도장(자동 처리)이 찍혀 있다.
  - 이중 잠금 서류함: 맨 위 서랍에 황동 열쇠 구멍 두 개가 나란히 있다.
  - 임원 책상: 붉은 탭이 붙은 결재 대기 서류 위에 열쇠가 놓여 있다.
- **사용감**: 계산기에서 바닥까지 늘어진 종이 테이프, 세단기에 반쯤 물린 종이, 코트 걸이에 남겨진 양복 상의, 벽 얼룩.

## image_gen 재생성 프롬프트

```text
Use case: stylized-concept.
Asset type: single isolated 2D side-view environment asset for ARCHI, a dark psychological horror / mystery 2D side-scrolling game. Not a concept poster.
Reference images: the 17th-floor office interior and corridor and the 16th-floor amenity backgrounds of the same game, for material, lighting, palette and rendering only; do not copy their layout. Optional: the attached code-painted floor10 asset as composition and coordinate guide.
Create ONE 3200x556 PNG with REAL transparent alpha background, centered, 48px empty transparent margin on all sides, no cast shadow outside the asset.
Strict orthographic side elevation, camera perpendicular to the rear wall, no perspective, no isometric or top-down view.
Architectural cutaway of one floor: concrete ceiling slab section y=48..80, floor top a perfectly straight horizontal line at y=438 edge to edge, floor slab section y=438..494, cut end walls at both sides. Interior floor and walls are part of the asset.
Scale: adult human 162px = 175cm; desks 69px tall, doors 210px tall.
Setting: senior management and corporate administration floor of a large Korean software company headquarters at midnight during a power outage. More formal, quiet and controlled than the floors below: deep jade-green walls with cream panel mouldings and chair rail, darker wood, glass and small brass details; realistic, not luxurious. Hierarchy grows from left to right: glass partition, then a solid lacquered wood partition; jade carpet, darker carpet, then a dark wood floor.
x=78..1280 corporate management office: tall narrow punched windows with cream architraves and half-lowered blinds, steel filing cabinets, a glass display cabinet with award plaques and one framed photo of a dark corridor door with a small green sign, desks with monitors, ledgers, stamp racks and a printing adding machine whose paper tape curls to the floor, an electricity bill with one night slot marked in yellow highlighter, a slightly open drawer with a tagged key envelope, a settlement checklist board with one line tallied three times and circled in red and a separately ruled cost column, a wall clock, a paper shredder with a half-fed sheet and a small safe.
x=1280..1300 dark-wood-framed glass partition with an open glass door and a green exit pictogram.
x=1300..2280 large executive meeting room: a window with a lowered blackout shade leaking thin light at its edges, a dark wood media wall with a recessed switched-off display, a recessed ceiling panel with downlights and a ceiling microphone, a long dark wood board table on solid pedestals with an aligned folder, name plate, water glass and gooseneck delegate microphone at every seat, identical high-back chairs, a larger high-back head chair in profile at the far end, its microphone the only one with a red light, a credenza with glasses and a conference audio hub.
x=2280..2304 solid lacquered wood partition with an open door.
x=2304..3122 restrained executive office: a secretary desk at the entrance with a phone and a purchase request copy whose approval box row is empty except for one stamp, a filing cabinet with two brass key cylinders side by side, a coat stand with a suit jacket left on it, a window with heavy jade drapes and a sheer curtain, a large dark wood executive desk with a full modesty panel, a green banker's lamp, a pending folder with a red tab and a key on top, a pen stand and phone, a tall high-back executive chair silhouetted against the window, two formal guest armchairs, a tall glass-door bookcase with books and box files.
Mood: formal, quiet, controlled, cold and oppressive; muted desaturated colors, soft ambient shadows, subtle directional light; clean furniture arrangement and spacious architecture.
Style: detailed hand-painted 2D illustration, semi-realistic proportions, realistic materials, subtle grunge and aged textures, clear dark outlines so objects read at gameplay distance. No sci-fi, no fantasy shapes, no excessive luxury.
No people, no creatures, no robots, no text, letters, digits, logos, UI, watermark or decorative frame.
```
