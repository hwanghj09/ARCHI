# 2층 공용 시설층 단면 에셋 (대형 행사장 · 서버실 · 직원 휴게 공간)

- 제작: **Python(Pillow·NumPy) 코드 페인팅**. 이미지 생성 모델(image_gen)로 만든 것이 아니다. 작업 환경에 이미지 생성 도구가 없어 벽·장비·조명·질감을 코드로 직접 그렸다. `floor02-paint-source.zip`에서 `python3 scene2.py out.png`를 실행하면 같은 결과가 나온다.
- 참조: `assets/background/floor17/office-interior.png`, `floor17/source.png`, `floor16/amenity-*.png`, `assets/objects/floor-kit/*.png`(화풍·재질·조명·스케일만 참고). 행사장 팔레트와 단서는 현재 게임의 2층(`js/floors/floor-02.js`, concert 테마: 짙은 청록 벨벳 + 금박 몰딩, Harmony Hall·서버실)을 따랐다.
- 구역 구성: 사용자 프롬프트와 층 구조표(대형 행사장 / 서버실 / 휴게공간)가 일치한다.
  - 세 구역이 같은 슬래브·천장 배관·바닥선을 공유하게 해서 한 층으로 읽히게 했다.
  - 서버실만 흰 밀폐 천장, 흰 패널 벽, 이중바닥, 차가운 청백색 비상등으로 가장 차갑고 무균하게 만들었다.
- 행사장 구도: 무대를 왼쪽 끝에 두고, 객석 의자를 무대를 향한 옆모습 줄로 세웠다. 측면도에서 객석 줄은 x 방향으로만 늘어서므로, 뒷줄은 어둡게 눌러 깊이를 표현했다.

## 파일

| 파일 | 크기 | 형식 |
| --- | --- | --- |
| `floor02-hall-server-lounge.png` | 3200×556 | RGBA PNG, 배경 투명(알파 0/255 이진, 내부 구멍 0), 사방 여백 48px |

## 좌표 (출력 PNG 기준 px)

| 항목 | 값 |
| --- | --- |
| 단면 외곽 | x=48..3152, y=48..508 |
| 천장 슬래브 | y=48..80 |
| **바닥선(보행 기준선)** | **y=438**, 전 폭 수평 |
| 바닥 슬래브 | y=438..494 (서버실 아래는 이중바닥 공간 y=442..470) |
| 대형 행사장 | x=78..1500 |
| ㄴ 무대·스크린 | 무대 x=96..600(윗면 y=382, 계단 ~644), 스크린 x=184..556·y=134..340 |
| ㄴ 무대 위 | 그랜드 피아노 x=170..400, 강연대 x=470..504 |
| ㄴ 객석·벽 | 객석 x=700..1240, 벽 디스플레이 x=760..900·1060..1200 |
| ㄴ 장비 | 수신기 카트 x=1262..1316, 의자 운반대 x=1330..1386, 음향 콘솔 x=1398..1494 |
| 서버실 칸막이 | x=1500..1524 (강철문, 문 높이 210, 행사장 쪽 카드 리더 x=1480..1492) |
| 서버실 | x=1524..2200 |
| ㄴ 랙 | x=1540..1922: 가동 2대(NAS 디스크 반쯤 빠짐 x≈1650·y≈318), 빈 랙 3대, 네트워크 랙 1대 |
| ㄴ 기타 장비 | 서버 카트 x=1712..1782, 항온항습기 x=1950..2046, 가스 소화 용기 x=2058..2104 |
| 방화벽 | x=2200..2224 |
| 직원 휴게 공간 | x=2224..3122 |
| ㄴ 창·자판기 | 자판기 x=2242..2432, 창 x=2476..2856·y=186..396 |
| ㄴ 가구 | 소파 x=2500..2752, 연주회 포스터 x=2896..2968, 안락의자 x=2884..2984, 화분 ~3092 |

## 스케일·게임 정렬

- 플레이어 162px = 175cm 기준.

| 대상 | 높이 |
| --- | --- |
| 무대 | 56px (60cm) |
| 랙 | 186px |
| 자판기 | 176px |
| 객석 의자 등받이 | 약 90px |

- 1:1로 놓으면 `top = 570 - 438 = 132`에서 게임 바닥 `floorY = 570`과 맞는다. 배율이 `s`이면 `top = 570 - 438 × s`.
- 게임 연결은 `GENERATED.md`와 `build.py`에 적었다(복도·방 내부·문으로 나눠 적용).

## 연출 메모 (모두 글자 없이 그림으로만)

- **정전 상태**: 빛은 다음뿐이다.
  - 배터리 영사기가 비추는 스크린
  - 서버실의 차가운 비상등과 남은 랙의 LED
  - 휴게 공간 창밖 나트륨 가로등
  - 비상구 유도등, CCTV 붉은 점
- **기존 2층 단서와의 연결**:
  - 스크린: 작은 음성 파형 312개(26×12) 격자에서 맨 마지막 칸 하나만 붉은 테두리다. 화자 표본 312명의 마지막이 17F 정수호라는 단서다.
  - 빈 객석 의자마다 붉은 점이 켜진 팔걸이 마이크가 달려 있고, 객석 위에는 마이크가 매달려 있다. 수신기 카트도 켜져 있다.
  - 서버실은 랙 대부분이 비어 있다. 문이 열린 채 늘어진 케이블과 빈 레일만 남았다(CCTV·출입 통제·방송 서버를 B2로 옮긴 흔적). 남은 녹화 NAS는 디스크 하나가 반쯤 빠진 채 붉게 빛난다.
  - 서버 카트에 걸린 이전 작업표는 줄마다 체크돼 있고 마지막 한 줄만 붉게 남아 있다.
  - 휴게 공간의 연주회 포스터(피아노 건반과 파형, 여백에 볼펜 낙서)와 무대 위 그랜드 피아노가 짝을 이룬다.
- **사용감**: 넘어진 객석 의자, 의자 위 리플릿과 재킷, 쌓아 둔 의자 운반대, 소파 위 담요, 엎어 둔 휴대폰.

## image_gen 재생성 프롬프트

```text
Use case: stylized-concept.
Asset type: single isolated 2D side-view environment asset for ARCHI, a dark psychological horror / mystery 2D side-scrolling game. Not a concept poster.
Reference images: the 17th-floor office interior and corridor and the 16th-floor amenity backgrounds of the same game, for material, lighting, palette and rendering only; do not copy their layout. Optional: the attached code-painted floor02 asset as composition and coordinate guide.
Create ONE 3200x556 PNG with REAL transparent alpha background, centered, 48px empty transparent margin on all sides, no cast shadow outside the asset.
Strict orthographic side elevation, camera perpendicular to the rear wall, no perspective, no isometric or top-down view. Depth between rows of chairs is shown only by overlap and atmospheric darkening.
Architectural cutaway of one floor: concrete ceiling slab section y=48..80, floor top a perfectly straight horizontal line at y=438 edge to edge, floor slab section y=438..494, cut end walls at both sides. Interior floor and walls are part of the asset. The three areas share the same slab, ceiling services and floor line so they read as one modern corporate floor.
Scale: adult human 162px = 175cm.
Setting: shared facilities floor of a large Korean software company headquarters at midnight during a power outage.
x=78..1500 large corporate event hall: dark teal velvet acoustic wall panels with gold mouldings, coffered ceiling, a lighting truss with par cans and a hanging line-array speaker; a low stage on the left with black fascia, wood nosing, side steps and velvet side curtains; a large presentation screen behind the stage lit by a battery projector, showing a grid of 312 tiny voice waveforms with only the last one framed in red; a grand piano in profile with its lid propped, a lectern with a gooseneck microphone, a microphone stand, a stage wedge and a PA speaker on a stand; two switched-off wall displays and gold wall sconces; rows of movable upholstered chairs in profile facing the stage, a darker second row behind, a small microphone with a red light on every armrest, microphones hanging over the empty seats, one chair tipped over, a leaflet and a jacket left on seats, a receiver cart, a chair dolly with stacked chairs, a draped front-of-house desk with a mixing console.
x=1500..1524 steel door partition with a card reader.
x=1524..2200 compact server room, colder and more sterile than the rest: white panel walls, sealed white ceiling with cold blue-white emergency light strips, yellow fibre runner and black ladder tray, raised floor shown in section; tall racks under a glass containment roof: two still running with blinking LEDs (one recording NAS with a drive caddy half pulled out glowing red), three emptied racks with open doors, bare rails and dangling cables, one dense network patch rack; a server cart holding pulled servers and a migration checklist with one unchecked red line; a precision air-conditioning unit, two red gas suppression cylinders and a wall environment panel.
x=2200..2224 solid fire-rated wall.
x=2224..3122 quiet employee lounge with warm greige walls, wood wainscot and a wooden slat ceiling with unlit pendants: two switched-off vending machines (drinks and snacks), a large window whose view is filled by street-tree foliage lit by one sodium street lamp, sheer curtains, a sofa with a cushion and folded blanket, a low coffee table with mug, magazines and a face-down phone, an armchair, a floor lamp, a framed recital poster with piano keys and a waveform, a tall plant, a green exit pictogram.
Mood: subdued, cold and oppressive, muted desaturated colors, soft ambient shadows, subtle directional light; professional corporate architecture with slightly worn surfaces.
Style: detailed hand-painted 2D illustration, semi-realistic proportions, realistic materials, subtle grunge and aged textures, clear dark outlines so objects read at gameplay distance. Grounded, no sci-fi, no fantasy shapes.
No people, no creatures, no robots, no text, letters, digits, logos, UI, watermark or decorative frame.
```
