# B1 방재 관제실 CCTV 모니터 벽 (전체 화면 조사 이미지)

- 제작: ChatGPT 이미지 생성(VS Code 확장).
- 용도: B1 방재 관제실(`b1-control`)의 `CCTV 모니터 벽`(js/floors/floor-b1.js)을 조사하면 화면 전체에 띄우는 정지 이미지. 월드 배경이 아니라 조사 화면이므로 `floorY` 정렬은 필요 없다.
- 이벤트 구조: 관제실에 처음 들어오면 CCTV 컷씬(js/scene/cctv-event.js)이 돌고, 꺼진 월드 모니터 벽에서 가운데 칸 하나만 켜져 수호를 등 뒤에서 비춘다. 그 칸은 이 그림의 가운데 화면을 잘라 쓴다. 벽을 조사하면 이 그림이 화면 전체에 떠서 나머지 칸도 전부 녹화 중이었다는 것이 드러난다.
- 장면: 3×3 모니터 벽. 일곱 칸은 수호가 17층부터 지나온 장면을 흑백 적외선 녹화로 보여 주고, 가운데 칸은 지금 이 관제실에서 모니터 벽을 올려다보는 수호의 뒷모습을 실시간 컬러로 보여 준다. 오른쪽 아래 B2 칸만 신호 없이 검다.
- 글자는 칸별 층 표시(17F, RF, 1F 등), REC 표시, 타임스탬프, B2 칸의 "권한 없음"처럼 CCTV 화면에 자연스러운 작은 표기만 허용한다. "추적 대상 1 · 정수호" 및 수호의 이름이나 신원을 밝히는 문구는 넣지 않는다. 읽을 수 없는 가짜 글자나 무작위 숫자도 피한다. 게임에서 HTML 표기를 추가할 경우 그림 속 표기와 중복되지 않게 한다.
- 대사와 맞추기: 조사 대사의 "한 칸에 이 관제실이 비친다 / 다른 칸들은 17층부터 지나온 층을 되감는다 / B2 칸만 검다"와 칸 구성이 같아야 한다. 칸 순서를 바꾸면 이 문서와 대사를 함께 고친다.

## 첨부할 참고 이미지

| 순서 | 파일 | 쓰임 |
| --- | --- | --- |
| 1 | `assets/player/jeong-suho.png` | 수호 정체성(검은 머리, 흰 셔츠 걷은 소매, 풀린 검은 넥타이, 사원증 목걸이, 검은 바지) |
| 2 | `assets/background/floor17/floor17.png` | 화풍·재질·색감 참고만. 구도는 따르지 않는다 |
| 3 | `assets/objects/guard-robot/guard-patrol.png` | 1층 칸에 나오는 경비 로봇 외형(빨강·아이보리) |
| 4 | `assets/objects/b1/control-door.png` | B1 관제실의 금속·도장 재질 |

## 칸 구성 (왼쪽 위부터 행 순서)

| 칸 | 장면 | 화질 |
| --- | --- | --- |
| 1 | 17층 개발팀 사무실: 자리에서 일어나는 수호. 꺼진 모니터들이 전부 조금씩 돌아가 그를 향해 있다 | 흑백 적외선 |
| 2 | 17층 복도: 닫힌 엘리베이터 세 대 앞에 선 수호. 금속 문에 비친 그림자가 몸보다 길다 | 흑백 적외선 |
| 3 | 옥상: 태양광 패널과 비상 전력 제어함 앞의 수호, 멀리 불 켜진 도시. 이 건물만 검다 | 흑백 적외선 |
| 4 | 1층 로비: 경비 로봇에게 쫓겨 달리며 겁에 질린 얼굴로 뒤돌아보는 수호. 로봇 센서만 하얗게 번진다 | 흑백 적외선 |
| 5 | **실시간**: 수호 바로 뒤, 천장 카메라가 있을 수 없는 낮고 가까운 자리에서 찍은 뒷모습. 그가 올려다보는 모니터 벽 가운데 칸에 같은 장면이 다시 비쳐 끝없이 작아진다 | 병든 듯한 컬러, 가장 밝음 |
| 6 | 12층 개발 사무실: 켜진 PC 위로 몸을 숙인 수호. 모니터 빛이 그의 얼굴만 비춘다 | 흑백 적외선 |
| 7 | 7층 검증실: 장비 랙과 붉은 인터록 경고등, 출력물을 든 수호. 붉은 빛이 그의 등에 맺힌다 | 흑백 적외선, 경고등만 붉게 |
| 8 | 엘리베이터 안: 바로 위에서 아주 가깝게 내려다본 화면. 정수리와 어깨가 화면을 채운다 | 흑백 적외선 |
| 9 | **B2**: 신호 없음. 검은 화면 한가운데에 아주 작은 붉은 점 하나. 저쪽에서 이쪽을 보는 렌즈 불빛 같다 | 검정 |

이 장면은 공포 게임의 섬뜩한 순간이다. 다만 초자연 현상은 쓰지 않는다. 범인은 귀신이 아니라 ARCHI라는 AI이기 때문이다(기획.md). 무서움은 세 가지에서 나온다.
- 모든 카메라가 수호에게 맞춰져 있다. 어느 칸이든 그가 화면 한가운데에 있다.
- 있을 수 없는 각도가 하나 있다. 실시간 칸은 천장 카메라 자리가 아니라 수호 바로 뒤, 사람 키 높이에서 찍혀 있다.
- B2 칸은 "권한 없음"으로 검지만, 그 안에서 무언가가 이쪽을 보고 있다.
수호의 얼굴은 보여도 된다(4번 칸의 겁에 질린 얼굴, 6번 칸의 모니터 빛에 비친 얼굴). 쓰지 않는 것은 괴물, 피, 귀신, 눈알, 노이즈 속에 떠오르는 낯선 얼굴처럼 수호가 아닌 초자연적인 것이다.

## 생성 프롬프트

```text
Use case: stylized-concept with an identity-preserve character inside it.
Asset type: a full-screen inspection image for ARCHI, a 2D side-scrolling mystery/horror web game. When the player inspects the CCTV monitor wall in the B1 disaster-control room, this image fills the whole screen. It is a still image, not a sprite sheet and not a world background.

Reference images:
- Input image 1 is the approved player character, Jeong Suho. Faithfully preserve his identity wherever he appears: messy black hair, pale tired face, wrinkled white office shirt with rolled-up sleeves, loosened black necktie, dark employee lanyard and ID badge, black slacks, gray-white sneakers, realistic adult proportions. Never chibi.
- Input image 2 is a style, material and lighting reference only (ARCHI's 17th-floor corridor). Do not copy its composition.
- Input image 3 is the approved security robot design (red and ivory body, wheeled). Use it in screen 4 only.
- Input image 4 is a material reference for the B1 control room (worn painted metal, utility green-gray).

Canvas: ONE landscape PNG, 1536x1024, fully opaque.

Framing: a straight-on, front-facing view of a wall of security monitors, filling almost the entire canvas. EXACTLY NINE screens of identical size in a precise 3 columns x 3 rows grid, separated by thin, even, charcoal-black monitor bezels about 14px wide. No perspective on the wall itself: every screen is a perfect rectangle, all bezels straight and parallel to the image edges. A narrow strip of the dark control-console edge may show along the very bottom (no more than 60px), with only a few tiny dim green and amber status LEDs. Nothing else outside the monitor wall.

Screen contents: seven screens (1-4 and 6-8) are recorded night-vision footage: sickly monochrome gray-green infrared, heavy grain, crushed blacks, harsh bloom on any light source, dark vignetting at the screen corners. Screen 5 is a live color feed; screen 9 is a black B2 no-signal screen. The building above ground is in a power outage, so in the recorded feeds lights and PC monitors are off unless stated. Jeong Suho is in screens 1-8, always placed at the exact CENTER of each screen, as if every camera in the building has turned to follow him. Screen 9 contains no person. His face may be clearly visible in some feeds (tired, tense, frightened), but he never looks into the camera; he does not know he is being watched.
Read left to right, top to bottom:
1. Top-left: a wide high-angle view of a dark open-plan developer office. Suho, small, is getting up from his desk chair. Every switched-off monitor on every desk has been turned slightly so that all their dead black screens face toward him.
2. Top-center: a dim office corridor with three closed metal elevator doors in a row. Suho stands in front of them. His reflection on the brushed-metal doors stretches far too long and tall.
3. Top-right: a rooftop at night, rows of solar panels and a utility power control box, Suho beside the box. Distant city lights glow on the horizon; only this building is completely dark.
4. Middle-left: a ground-floor lobby with a revolving glass door. The red-and-ivory security robot from input image 3 rolls after Suho as he runs toward the elevators, glancing back over his shoulder with a frightened face. Its sensor eye blooms as a hard white smear in the infrared.
5. CENTER, the live feed, the most disturbing screen: THIS control room, filmed from an IMPOSSIBLE position, low and very close directly behind Suho, at about his shoulder height, as if someone is standing right behind him. Suho fills the lower half of the screen from behind, looking up at a large wall of glowing monitors. This feed is in COLOR, not infrared, the brightest screen on the wall, lit by cold, slightly sickly fluorescent light: green epoxy floor, yellow safety line, a long control console. In the middle of the monitor wall he is looking at, the center screen shows this same image again, smaller, and again inside it, an infinite recursive tunnel of his own back.
6. Middle-right: a closer view of a developer desk. One PC monitor glows; its light falls only on Suho's face and hands as he bends over the keyboard, the rest of the room swallowed in black.
7. Bottom-left: an AI test and verification lab with tall equipment racks and one red interlock warning lamp. The red light is the only color in this feed, and it falls across Suho's back like a target. He holds a sheet of printout.
8. Bottom-center: the inside of a small elevator car, filmed from directly above and uncomfortably close: the top of Suho's head and his shoulders fill most of the screen, the button panel at the edge.
9. Bottom-right: B2, NO SIGNAL. A nearly pure black screen with very faint horizontal scanlines. At its exact center, one tiny dim red dot, like the status light of a lens looking back out at the viewer. No person or other image content.

Keep each screen's top-left and bottom-right corners relatively plain and dark (roughly a 160x40px area in each), suitable for small CCTV labels, timestamps and REC indicators, whether rendered in the image or later in HTML.

Style: atmospheric horror pixel art matching ARCHI, anime-inspired, crisp hard-edged pixel clusters, realistic adult proportions, desaturated palette dominated by sickly green-gray and deep black, with only two warm accents: the red lamp in screen 7 and the red dot in screen 9. The whole wall should feel cold, claustrophobic and deeply wrong: the dread of realizing the building has been watching you the entire night. Slight uneven brightness between screens and a faint electrical flicker band across one or two screens are welcome. The horror is surveillance by a machine, not the supernatural: no monsters, no ghosts, no blood, no eyeballs, no glitch-art explosions. Suho's own face is fine, but no other human figures or faces anywhere, including no faces hidden in static, reflections or shadows.

Small, legible CCTV interface text is allowed inside the individual screens: appropriate floor labels, timestamps, REC indicators, and "권한 없음" or "NO SIGNAL" on screen 9. Do not include "추적 대상 1 · 정수호", Jeong Suho's name, or any other text identifying him as the tracked subject. No random letters, invented words, illegible pseudo-text, logos, captions, watermarks, or text on signs inside the feeds. Keep the text subordinate to the imagery. No border around the whole image. Output only the finished monitor-wall image.
```

## 생성 뒤 확인할 것

- 화면 아홉 칸이 같은 크기의 3×3인지, 베젤이 곧은지 본다. 칸 크기가 들쭉날쭉하면 다시 만든다. HTML 표기를 추가할 수도 있으므로 칸 위치가 정확해야 한다.
- 글자가 들어갔다면 작은 CCTV 표기인지, 정확히 읽히는지 확인한다. "추적 대상 1 · 정수호"나 그와 같은 신원 노출 문구, 가짜 글자·무작위 숫자는 지우거나 다시 만든다. B2 칸에는 수호가 없어야 한다.
- 섬뜩함이 초자연으로 넘어가지 않았는지 본다. 수호의 얼굴은 괜찮다. 수호가 아닌 사람, 노이즈나 그림자 속의 낯선 얼굴, 귀신 형체가 생겼으면 다시 만든다. 가운데 칸의 되비침 터널과 B2 칸의 붉은 점은 남아 있어야 한다.
- 수호가 참고 이미지 1과 같은 사람으로 보이는지 본다. 특히 가운데 칸의 뒷모습: 검은 머리, 흰 셔츠, 사원증 목걸이 끈.
- 저장 위치: `assets/objects/b1/cctv-wall.png`(1536×1024).

## 연동

- 파일: `cctv-wall.png`(1536×1024, 게임에서 사용), 연결하지 않은 다른 생성본은 지웠다.
- 화면 칸(밝기 스캔으로 잰 베젤 사이, 1536×1024 기준). 칸 위 HTML 라벨을 더할 때는 백분율로 바꿔 쓰고, 그림에 이미 들어간 표기와 겹치지 않게 한다.

| 행 \ 열 | x 10~508 | x 520~1017 | x 1029~1525 |
| --- | --- | --- | --- |
| y 7~317 | 17F 사무실 | 17F 엘리베이터 앞 | RF 옥상 |
| y 329~650 | 1F 로비 | **B1 실시간** | 12F |
| y 661~956 | 7F 검증실 | 엘리베이터 안 | B2 권한 없음 |

- 전체 화면 보기: 설비의 `fullImage`(js/floors/floor-b1.js)를 `openFullImage`(js/scene/cctv-event.js)가 조사창(`#inspection[data-surface="full-image"]`, cctv-event.css)에 띄운다. 그림이 위 칸을 비율대로(contain) 채우고, 제목·조사 문구·닫기는 아래 한 줄에 둔다. 열 때 잡음 효과음 `cctv-static`이 난다.
- 월드 모니터 벽: 같은 설비가 관제실 배경(assets/background/b1/control-room-v4.png)의 빈 벽 위 419×279(3:2) 벽(x 1117, y 147)에 이 그림을 그대로 깔고, 꺼진 동안은 검은 막(::before)으로 덮는다. 첫 컷씬 뒤 CCTV를 보기 전까지는 위 표의 아홉 화면 칸에만 잡음을 씌우고(`--cctv-cells-*` 마스크), 한 번 본 뒤(`data-live="all"`)로는 그림 전체가 켜진다(cctv-event.css).
- 그림 속 날짜는 2024-08-14~15다. 게임 안 날짜 설정과 맞춰야 하면 다시 생성할 때 타임스탬프를 바꾼다.
