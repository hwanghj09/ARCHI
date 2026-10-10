# B1 CCTV 모니터 벽 조사 그림

- 생성: 내장 image_gen, 2026-10-10. 참조를 바탕으로 생성한 결과를 768×432로 정규화한 뒤 최근접 보간으로 정확히 2배 출력.
- 파일: `cctv-wall-screen.png`. 1536×864 불투명 RGB PNG, 단일 프레임. 픽셀 한 칸 = 2×2. 알파 채널은 넣지 않는다.
- 참조:
  1. `assets/background/floor17/floor17.png`: 화풍, 팔레트, 픽셀 렌더링만 참고한다. 구도는 따라 하지 않는다.
  2. `assets/player/jeong-suho-idle-four.png`: 정수호 idle 시트(왼쪽 위 칸만 잘라 넣어도 된다). 화면 속 작은 인물의 옷차림과 실루엣.
  3. `assets/objects/guard-robot/guard-patrol.png`: 경비 로봇 R-01. 로비 화면 속 작은 로봇으로 쓴다.
- 사용: `js/floors/floor-b1.js` 방재 관제실(`b1-control`)의 `CCTV 모니터 벽` 조사 화면. `image`가 writing보다 우선한다. `.writing-art`는 caption을 포함해 데스크톱·모바일 세로·가로에서 스크롤 없이 보이도록 그림 크기를 조정한다.
- 그림에는 글자를 넣지 않는다. 단서 "추적 대상 1 · 정수호"는 그림 아래 caption으로 보여 주고, 화면 낭독기는 지금처럼 message를 읽는다.

## 연결과 검증

`js/floors/floor-b1.js`의 CCTV 모니터 벽에 image와 caption을 연결했다. 기존 writing은 글자 화면 데이터로 유지한다.

- `node tests/floor-prop-art.mjs`: 파일, 불투명 PNG 규격과 이미지 연결.
- `node tests/writing-ui.mjs`: 데스크톱 1280×720, 모바일 세로 390×844, 가로 844×390에서 그림과 caption 배치.
- `node scripts/check-writing.mjs -1 "CCTV 모니터 벽"`: 실제 조사창 스크린숏. 오른쪽 아래 B2 칸이 검고 그림이 잘리지 않는지 확인한다.

## 생성 프롬프트

```text
Use case: stylized-concept.
Asset type: a single full-frame inspection illustration for ARCHI, a 2D side-scrolling
mystery/horror pixel-art game. It is shown large in an inspection dialog when the player
examines the CCTV monitor wall in the B1 disaster-control room.
Reference image 1 (floor17.png) is the style, palette and pixel-rendering reference only; do
not copy its composition. Reference image 2 is the approved player character (Jeong Suho:
short messy black hair, glasses, white dress shirt with rolled sleeves, thin black tie, ID badge
on a lanyard, black trousers, gray sneakers); preserve his outfit and silhouette in the tiny
figure. Reference image 3 is the guard robot design; reuse it as a tiny figure.

Composition: a straight-on, perfectly frontal view of a security monitor wall filling the whole
frame: a dark graphite metal rack holding a grid of 4 columns x 3 rows of identical
16:9 CRT-style security monitors with thin bezels, small red recording LEDs on each bezel top.
No room, desk or people outside the monitors; the wall itself is the image.
Monitor contents (each a grainy, desaturated, slightly scan-lined blue-green night-vision feed,
low-angle high ceiling-camera view):
- Row 1, col 1: THIS control room from a high ceiling corner, a man (Jeong Suho, tiny) standing
  at a desk, head tilted up, staring straight at the camera. This screen is subtly brighter, the
  focal point.
- Row 1, cols 2-4 and row 2, cols 1-3: places he has passed tonight, as if rewinding: a dark
  office floor with one glowing PC, an elevator hall with three closed steel doors, a rooftop
  with solar panels and city lights, a building lobby with a security robot standing in the
  dark, a café with chairs on tables, a corridor with glass security gates. In several feeds the
  same tiny white-shirted figure appears, small, seen from behind or side.
- Row 2, col 4 and row 3, cols 1-3: corridors and stairwells, empty, dim, with faint motion blur
  ghosting as if rewinding.
- Row 3, col 4 (bottom-right): COMPLETELY BLACK screen, no signal, only a faint dull red
  glow at the edge: the one feed the player is not allowed to see.
Mood: mystery 80%, horror 20%, midnight, restrained. Cool blue-gray / green-gray palette, warm
accents only from the red LEDs.
Rendering: crisp anime-inspired pixel art, hard-edged pixel clusters, realistic adult
proportions, never chibi, never painterly or photoreal. Pixel grid authored at 768x432.
Delivery: ONE opaque 16:9 image, 768x432 pixel grid (export may be an exact 2x nearest-neighbor
upscale, 1536x864). No text, no letters, no numbers, no timestamps, no Korean or English
writing, no UI, no captions, no watermark, no border outside the monitor rack.
```

프롬프트는 2026-10-09 플레이 테스트 수정 요청 정리(9번 항목) 부록의 원문에서 긴 줄표만 쌍점, 쌍반점, 쉼표로 바꾼 것이다.
