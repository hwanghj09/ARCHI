# B1 CCTV 모니터 벽 조사 그림

- 생성: 아직 안 함. 이 저장소 작업 환경에는 그림 생성 도구가 없어서 프롬프트와 연결 방법만 적어 둔다. 생성하면 도구와 날짜를 이 줄에 적는다.
- 파일: `cctv-wall-screen.png`(아직 없음). 1536×864 불투명 PNG, 단일 프레임. 768×432 픽셀 격자로 그린 원본을 최근접 보간으로 정확히 2배 키운 것이다(픽셀 한 칸 = 2×2). 알파 채널은 넣지 않는다.
- 참조:
  1. `assets/background/floor17/floor17.png`: 화풍, 팔레트, 픽셀 렌더링만 참고한다. 구도는 따라 하지 않는다.
  2. `assets/player/jeong-suho-idle-four.png`: 정수호 idle 시트(왼쪽 위 칸만 잘라 넣어도 된다). 화면 속 작은 인물의 옷차림과 실루엣.
  3. `assets/objects/guard-robot/guard-patrol.png`: 경비 로봇 R-01. 로비 화면 속 작은 로봇으로 쓴다.
- 사용: `js/floors/floor-b1.js` 방재 관제실(`b1-control`)의 `CCTV 모니터 벽` 조사 화면. `image`가 있으면 writing(LCD 글자 화면)보다 우선하고(`js/interaction/writing.js`), 크기는 `.writing-art`(`writing.css`, 최대 높이 65dvh)가 조사창에 맞춘다. 16:9라 데스크톱과 모바일 세로 화면 모두 조사창 안에 들어간다.
- 그림에는 글자를 넣지 않는다. 단서 "추적 대상 1 · 정수호"는 그림 아래 caption으로 보여 주고, 화면 낭독기는 지금처럼 message를 읽는다.

## 연결

1. 생성 결과가 768×432 격자가 아니면 먼저 768×432로 맞춘 뒤, 최근접 보간으로 1536×864로 키워 `assets/objects/b1/cctv-wall-screen.png`로 저장한다. 키우는 방법은 `scripts/prepare-solar-ui.ps1`처럼 `InterpolationMode = NearestNeighbor`, `PixelOffsetMode = Half`를 쓰면 된다.
2. `js/floors/floor-b1.js`의 `CCTV 모니터 벽` 항목에서 지금 `caption:` 줄을 지우고, 그 아래 주석 두 줄(`image:`, `caption:`)의 주석을 푼다. `writing`은 그림이 없을 때 쓰던 화면으로 그대로 둔다. 그림 파일 없이 주석만 풀면 조사창에 깨진 그림이 뜨고 `tests/floor-prop-art.mjs`가 실패한다.
3. 확인:
   - `node tests/floor-prop-art.mjs`: 그림 파일과 `image` 줄이 함께 있는지.
   - `node tests/writing-ui.mjs`: 조사창 배치(데스크톱 1280×720, 모바일 세로 390×844, 가로 844×390).
   - `node scripts/check-writing.mjs -1 "CCTV 모니터 벽"`: 세 화면 크기의 스크린숏이 `.local/writing-check/-1/`에 남는다. 그림이 잘리지 않는지, 모바일 세로 화면에서도 오른쪽 아래 B2 칸이 다른 칸과 확실히 구분되는지 눈으로 본다.

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
