# 3층 복지·고객 대응층 단면 에셋 (피트니스 클럽 · 고객센터 · 스튜디오)

- 제작: **Python(Pillow·NumPy) 코드 페인팅**. 이미지 생성 모델(image_gen)로 만든 것이 아니다. 작업 환경에 이미지 생성 도구가 없어 벽·장비·조명·질감을 코드로 직접 그렸다. `floor03-paint-source.zip`에서 `python3 scene3.py out.png`를 실행하면 같은 결과가 나온다.
- 참조: `assets/background/floor17/office-interior.png`, `floor17/source.png`, `floor16/amenity-*.png`, `assets/objects/floor-kit/*.png`(화풍·재질·조명·스케일만 참고). 팔레트와 단서는 현재 게임의 3층(`js/floors/floor-03.js`, gym 테마: 고무 매트 바닥 + 꺼진 주황 네온)을 따랐다.
- 구역 구성: 사용자 프롬프트와 층 구조표(피트니스룸 / 고객센터 / 스튜디오)가 일치한다. 작은 방으로 쪼개지 않고, 세 구역을 기둥·유리 자동문 단면·걷어 둔 암막 커튼으로만 구분했다.
- 다른 층 에셋과의 차이:

| 항목 | 3층 에셋 | 4·5·7층 에셋 |
| --- | --- | --- |
| 천장 | 체육관은 노출 천장 + 대형 원형 덕트, 고객센터는 떠 있는 흡음 클라우드, 스튜디오는 검은 천장 + 조명 파이프 그리드 | 배플(4) / 텍스(5) / 노출(7) |
| 창 | 체육관 위쪽 고측창 띠(나트륨 가로등빛) | 커튼월(4) / 세로 루버(5) / 가로 블라인드(7) |
| 벽 | 금 간 거울 벽, 남색 징두리 벽, 쐐기형 흡음재 | — |
| 팔레트 | 체육관 주황, 고객센터 남색·회색, 스튜디오 숯색 | — |

## 파일

| 파일 | 크기 | 형식 |
| --- | --- | --- |
| `floor03-welfare.png` | 3200×556 | RGBA PNG, 배경 투명(알파 0/255 이진, 내부 구멍 0), 사방 여백 48px |

## 좌표 (출력 PNG 기준 px)

| 항목 | 값 |
| --- | --- |
| 단면 외곽 | x=48..3152, y=48..508 |
| 천장 슬래브 | y=48..80 |
| **바닥선(보행 기준선)** | **y=438**, 전 폭 수평 |
| 바닥 슬래브 | y=438..494 |
| 피트니스 클럽 | x=78..1176 (고측창 y=130..166, 거울 벽 x=100..760, 러닝머신 x=106..294·316..504, 파워랙 x=548..668, 덤벨 랙 x=716..860, 사물함 x=962..1082, 트레이너 책상 x=1088..1168, 비상 개방 버튼 x=1154..1170) |
| 기둥 + 유리 자동문 단면 | x=1176..1226 (문 위 센서 붉은 점 = 닫힘 고정, 비상구 유도등) |
| 고객센터 | x=1226..2236 (스크립트 보드 x=1250..1432, 콜 현황 디스플레이 x=1500..1702, 상담석 x=1244..1620·1648..2010, 서류 캐비닛 x=2024..2228, 열쇠함 x=2164..2218) |
| 기둥 + 암막 커튼 | x=2236..2316 (기둥에 꺼진 ON AIR 표시등) |
| 스튜디오 | x=2274..3122 (제작 데스크 x=2326..2470, 카메라 x≈2490..2560, 배경지 x=2620..2930, 바 스툴 x≈2778, 붐 마이크, 하드 케이스 x=3030..3106) |

## 스케일·게임 정렬

- 플레이어 162px = 175cm 기준.

| 대상 | 높이 |
| --- | --- |
| 러닝머신 콘솔 | 약 140px |
| 파워랙 | 204px |
| 사물함 | 167px |
| 책상 | 69px |
| 트레이너 카운터 | 97px |

- 1:1로 놓으면 `top = 570 - 438 = 132`에서 게임 바닥 `floorY = 570`과 맞는다. 배율이 `s`이면 `top = 570 - 438 × s`.
- **게임 연결은 하지 않았다.** 현재 3층 코드는 복도 + 방 3개(Fitness Club·고객만족센터·㈜하누리서비스) 구조다. 이 단면을 쓰려면 배치를 위 좌표에 맞춰 바꿔야 한다.

## 연출 메모 (모두 글자 없이 그림으로만)

- **정전 상태**: 조명·네온·단말은 모두 꺼져 있다. 빛은 다음뿐이다.
  - 고측창의 나트륨 가로등빛(천장 덕트와 거울 위쪽에 비침)
  - 배터리 비상 개방 버튼(초록)과 자동문 센서(붉은 점)
  - 배터리로 켜진 노트북 한 대
  - 붉은 메시지 등이 켜진 전화기 한 대
  - 붉은 녹화 표시등이 켜진 카메라와 그 위 필드 모니터
  - 비상구 유도등, CCTV 붉은 점
- **기존 3층 단서와의 연결**:
  - 러닝머신 벨트의 바퀴 자국과 대기 표시등
  - 트레이너 책상 위 벽의 속도 차트: 회원 막대 사이에 표시된 막대 하나, 그보다 높은 붉은 막대 셋
  - 빈 상담석의 노트북: 시간대별 설문 막대가 01~04시에만 붉게 치솟는다
  - 스크립트 보드: 야간 원고 세 장 아래에 붉은 손글씨 줄이 덧붙어 있다
  - 열쇠함: 꼬리표만 남은 고리 사이로 붉은 꼬리표가 걸린 빈 고리 하나
  - 서류 캐비닛 위의 펼쳐진 경비 일지와 손전등
- **스튜디오**: 불 꺼진 배경지 위에 빈 스툴이 놓여 있고, 카메라는 녹화 표시등을 켠 채 그 스툴을 계속 찍고 있다.
- **사용감**: 금 간 거울, 바닥에 놓인 덤벨, 열린 사물함, 수건, 말아 둔 매트, 빠진 덤벨 칸, 배경지의 발자국.

## image_gen 재생성 프롬프트

```text
Use case: stylized-concept.
Asset type: single isolated 2D side-view environment asset for ARCHI, a dark psychological horror / mystery 2D side-scrolling game. Not a concept poster.
Reference images: the 17th-floor office interior and corridor and the 16th-floor amenity backgrounds of the same game, for material, lighting, palette and rendering only; do not copy their layout. Optional: the attached code-painted floor03 asset as composition and coordinate guide.
Create ONE 3200x556 PNG with REAL transparent alpha background, centered, 48px empty transparent margin on all sides, no cast shadow outside the asset.
Strict orthographic side elevation, camera perpendicular to the rear wall, no perspective, no isometric or top-down view.
Architectural cutaway of one floor: concrete ceiling slab section y=48..80, floor top a perfectly straight horizontal line at y=438 edge to edge, floor slab section y=438..494, cut end walls at both sides. Interior floor and walls are part of the asset. Three broad connected areas, not small rooms.
Scale: adult human 162px = 175cm.
Setting: employee welfare and customer service floor of a large Korean software company headquarters at midnight during a power outage.
x=78..1176 compact corporate fitness club: exposed black ceiling with a large spiral duct and unlit cage pendants, a high ribbon clerestory window lit by sodium street light from below, an unlit orange neon strip, a GX mirror wall with one cracked panel faintly reflecting the machines, two treadmills in side profile with faint wheel marks on the belts and red standby lights, a power rack with a loaded barbell and flat bench, a dumbbell rack with a few gaps and one dumbbell left on the rubber floor, kettlebells, a bin of rolled yoga mats, lockers with one door open, a locker bench with a towel, a small trainer counter with a printed speed chart on the wall (one marked bar, three taller red bars), a small battery emergency door-open button glowing green.
x=1176..1226 column and a glass automatic door seen in section, its sensor showing a red locked light, green exit pictogram.
x=1226..2236 organized professional customer service center under floating acoustic ceiling clouds: two rows of support workstations with fabric privacy screens, monitors, desk phones with coiled cords (one with a red message light), headsets on hooks, script binders; one empty seat with a laptop on battery showing an hourly bar chart that spikes red between 1 and 4 a.m.; a script board whose night scripts have extra lines added in red handwriting, a switched-off call-queue display, a wall clock, lateral filing cabinets with an open guard logbook and flashlight, a wall key cabinet standing open with mostly empty hooks and one red tag.
x=2236..2316 column with an unlit on-air box and a gathered blackout curtain.
x=2274..3122 small professional studio: wedge acoustic foam walls, black ceiling with a pipe lighting grid and fresnels, a production desk with an audio mixer, switcher and monitor, a grey seamless paper backdrop on stands with an empty bar stool on it, a softbox, an LED panel on a stand with sandbag, a boom microphone with a furry windscreen over the stool, a video camera on a tripod aimed at the stool with its red tally light on and a small field monitor showing the empty stool, stacked black road cases with aluminium corners, cables on the floor.
Mood: cold and oppressive, muted desaturated colors; fitness area practical and slightly used, customer service organized and professional, studio functional and equipment-focused.
Style: detailed hand-painted 2D illustration, semi-realistic proportions, realistic materials, subtle grunge and aged textures, soft ambient shadows, clear dark outlines so objects read at gameplay distance. Grounded modern Korean corporate interior, no sci-fi, no fantasy shapes.
No people, no creatures, no robots, no text, letters, digits, logos, UI, watermark or decorative frame.
```
