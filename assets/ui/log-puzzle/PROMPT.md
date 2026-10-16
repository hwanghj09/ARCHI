# 12층 모델 평가실 — 야간 로그 단말기 클로즈업 (생성 완료 — 통합까지 끝남)

두 그림 모두 사용자가 직접 생성해 넣었고, 실측 좌표까지 `log-puzzle.css`에 반영 완료다.
- `log-terminal.png`: 1448×1086 (정확히 4:3).
- `log-quiz-slots.png`: 1499×1049, 알파 있음(32bppArgb).
아래 프롬프트는 그 생성에 쓴 것 그대로 남겨 둔다(재생성·변형할 때 참고용).

- 참조 이미지: `assets/objects/floor-kit/test-terminal-desk.png` — 이 책상 소품이 이미 12층
  모델 평가실 안에 "야간 로그 단말기"로 놓여 있다(`js/floors/floor-12.js`). 조사(E)했을 때 뜨는
  `#log-panel` 창은 그 책상 위 모니터를 바짝 당겨 본 화면이라는 설정이라, 같은 모니터(검정
  베젤·받침, 화면의 차가운 청백색 발광)를 그대로 가져온다.
- 용도: `js/interaction/log-puzzle.js` / `log-puzzle.css` / `index.html`의 `#log-panel` — 지금은
  `#keypad`처럼 배경 그림 없는 평판 다이얼로그(`css/log-puzzle.css`)인데, `power.css`·
  `wire-puzzle.css`와 같은 패턴(그림을 배경으로 깔고 실제 줄글·퀴즈 버튼을 퍼센트 좌표로 얹기)으로
  바꾼다.
- 화면 속 실제 글자(로그 4줄·경고문·퀴즈 질문/보기 4개)는 전부 그림이 아니라 DOM이 그린다 — 이
  퀴즈 보기는 매번 똑같은 4개 고정 문구라 숨길 이유는 없지만, 지워지는 줄(`data-deleted`)·지직
  효과(`data-glitching`)처럼 상태에 따라 실시간으로 글자가 바뀌고 사라져야 해서 그림에 박아 넣을
  수 없다(`wire-puzzle`이 색 배치를 매번 섞어야 해서 소켓 자리를 비워 둔 것과 같은 이유).
  그래서 화면 안쪽은 완전히 빈 검정 화면으로만 받고, 그 위에 CSS로 글자를 얹는다.

## 생성 프롬프트 (v2 — 실제 플레이 스크린샷 색감에 맞춤)

v1(아래 "v1" 절)은 화면 안을 통째로 비워서 CSS 색감과 무관했다. v2는 실제로 지금 CSS가 그리고
있는 배색(패널 `#0d1417`, 로그 영역 `#05090b`, 글자 녹색 `#9fe0b0`, 강조 줄 호박색 `#f2d689`,
경고문 붉은빛 `#e08a7a`, 버튼 `#192328`/테두리 `#647579`)을 그대로 참조로 못박아서, 그림의 베젤이
지금 색감과 자연스럽게 이어 붙게 하고, "컴퓨터 화면을 보고 있다"는 느낌을 베젤 쪽에서 더 강하게
준다(두꺼운 CRT/LCD 테, 살짝 둥근 화면 모서리, 유리 느낌의 아주 옅은 가장자리 비네트·반사).

```
Use case: stylized-concept. Production UI art for ARCHI, a Korean pixel-art side-scrolling
mystery/horror game set in an office tower at midnight, during a power outage.

Reference image is test-terminal-desk.png, an existing office desk prop showing a black-bezel
LCD monitor. Match that monitor's bezel shape and stand. Do not copy the rest of the desk (no
filing cabinets, no plant, no lamp, no server tower).

Draw a tight CLOSE-UP of ONLY that same monitor, as if the player leaned in very close to read
the screen: the screen fills almost the whole frame, with a moderately thick dark bezel border
on all four sides (thicker and more clearly a physical CRT/LCD monitor frame than a flat UI
panel) and a sliver of the stand's neck at the very bottom. Strict orthographic straight-on view,
camera exactly perpendicular to the screen — NO angle, NO perspective.

Output ONE 1200x900 opaque PNG, landscape, 4:3. The screen itself occupies x=6%-94%, y=8%-88% of
the canvas, with slightly rounded screen corners (a real monitor glass edge, radius about 2% of
the screen width). Color the screen interior to match this EXACT existing in-game UI palette —
background a very dark near-black navy (#0d1417 outer screen tint, #05090b at the very center,
like the monitor backlight is dim at the edges and darkest in the middle) — but keep it a plain
gradient only, with NO text, NO lines, NO chart graphics, NO cursor, NO icons, NO scanlines,
because the game draws its own live log lines (in a green monospace, #9fe0b0), one highlighted
amber line (#f2d689), and red warning text (#e08a7a) on top of this exact rectangle every frame;
baked-in text or graphics here would double up with the live text and look wrong. Along the inner
edge of the screen, add a very subtle cool blue-white glass reflection/vignette (faint diagonal
sheen in one corner only, like glass catching a dim light) to sell that this is a glossy monitor
surface, not a flat matte CSS box — keep it subtle enough not to reduce contrast with text that
will be drawn on top. The bezel border (outside the screen rectangle) is matte black plastic,
color close to #192328/#0d1417, with a thin #647579 trim line along the inner edge of the bezel
(matching this game's existing panel border color) and one small dim power-indicator LED (a tiny
soft #9fe0b0 green dot) centered on the bottom bezel edge only — no brand name, no model text, no
buttons, no ports.

No people, no hands, no reflections of a room, no desk surface beyond the thin stand sliver at
the bottom center, no other objects, no text anywhere, no watermark, no border decoration beyond
the plain bezel described above. Output only the finished close-up image.
```

### v1 (화면 안을 완전히 비운 버전 — 참고용으로 남김)

```
Use case: stylized-concept. Production UI art for ARCHI, a Korean pixel-art side-scrolling
mystery/horror game set in an office tower at midnight, during a power outage.

Reference image is test-terminal-desk.png, an existing office desk prop showing a black-bezel
LCD monitor with a cool blue-white glowing screen, matte black plastic stand, and a dark gray
mechanical keyboard. Match that exact monitor's bezel color, stand shape, and screen glow color
closely. Do not copy the rest of the desk (no filing cabinets, no plant, no lamp, no server tower).

Draw a tight CLOSE-UP of ONLY that same monitor, as if the player leaned in very close to read
the screen: the screen fills almost the whole frame, with just a thin dark bezel border visible
on all four sides and a sliver of the stand's neck at the very bottom. Strict orthographic
straight-on view, camera exactly perpendicular to the screen — NO angle, NO perspective, NO
reflection or glare sweep across the glass.

Output ONE 1200x900 opaque PNG, landscape, 4:3. The screen itself occupies x=6%-94%, y=8%-88% of
the canvas: render it as a PLAIN, UNIFORM, near-black screen (a very subtle dark blue-gray tint
like the monitor is on but idle, not pure #000) with NO text, NO lines, NO chart graphics, NO
cursor, NO icons, NO glow hotspots, NO scanlines — completely flat and empty, because the game
draws its own live log lines and glitch effects on top of this exact rectangle every frame, and
any baked-in texture would show through and clash. The bezel border (outside that rectangle) is
matte black plastic, same material as the reference, with one small dim power-indicator LED dot
centered on the bottom bezel edge only — no brand name, no model text, no buttons, no ports.

No people, no hands, no reflections of a room, no desk surface beyond the thin stand sliver at
the bottom center, no other objects, no text anywhere, no watermark, no border decoration beyond
the plain bezel described above. Output only the finished close-up image.
```

## 퀴즈 화면용 추가 그림 (log-quiz-slots.png)

`#log-panel`은 모니터 하나다 — 로그를 보는 중이든 퀴즈를 푸는 중이든 같은 화면이라, 위 모니터
베젤·화면 그림 한 장을 그대로 공유한다(배경을 또 만들 필요는 없다). 다만 지금 퀴즈 화면
스크린샷을 보면 보기 4개가 그냥 CSS 사각 버튼이라 "컴퓨터가 그려 주는 선택지"라기보다 웹페이지
버튼처럼 보인다. 그래서 위 모니터 화면 그림과 별도로, **퀴즈가 떠 있을 때만 그 위에 겹치는
투명 PNG 한 장**을 추가로 만든다 — wire-panel이 전선 색은 비워 두고 소켓 자리만 그림에 박아 둔
것과 같은 방식으로, 보기 4개 자리의 "빈 버튼 테두리"만 그림에 그리고 글자(보기 문구·정답/오답
색)는 계속 DOM이 얹는다.

```
Use case: stylized-concept. Production UI art for ARCHI, a Korean pixel-art side-scrolling
mystery/horror game set in an office tower at midnight, during a power outage.

Asset type: a transparent overlay PNG that sits on top of an existing dark computer-monitor
screen (already generated separately) to look like a terminal multiple-choice menu. This overlay
does NOT include the monitor bezel at all — only the thin button-slot outlines that sit inside
the screen.

Output ONE 1000x700 PNG with REAL alpha transparency everywhere except the button outlines
described below (the dark monitor screen it sits on top of will already be visible through the
transparent areas, so do not paint any background fill, gradient, or screen color here at all).

Draw a thin horizontal divider line at y=18%, full width, color #647579 at low opacity (a
terminal rule between a question line above and the answer choices below) — just the line, no
text on either side of it.

Below that line, draw a 2x2 grid of FOUR identical empty rounded-rectangle button outlines
(radius about 6% of button height), arranged with a comfortable gap between them: top-left at
x=4%-48%, y=26%-46%; top-right at x=52%-96%, y=26%-46%; bottom-left at x=4%-48%, y=54%-74%;
bottom-right at x=52%-96%, y=54%-74%. Each outline is a 2px stroke in color #647579 with a very
faint inner fill wash of #192328 at low opacity (matching this game's existing button chrome —
dark slate fill, lighter slate-gray border), plus a subtle 1px highlight along the top inner edge
in #b9e89c at very low opacity to suggest a slight terminal glow, like the existing in-game
button hover state. Leave the inside of every button completely empty — no text, no icons, no
checkmarks, no letters, no numbers, no placeholder words, because the game writes each button's
actual choice text on top of this exact rectangle every time, and any baked-in marks would
double up or misalign with different answer lengths.

No people, no other UI chrome, no monitor bezel, no screen background fill, no logos, no
watermark, no scanlines, no glow outside the four button rectangles and the one divider line.
Output only the finished transparent overlay.
```

### 실측·배치 계획 (그림이 나오면 채운다)

- 이 오버레이는 모니터 화면 그림(위 v2)의 화면 영역(x=6%-94%, y=8%-88%, 그 중 아래쪽 구간)
  **안쪽**에서 다시 시작하는 좌표계다 — `#log-quiz`를 그 화면 사각형 안의 아래쪽 절반쯤에
  `background-image`로 깔고, 그 안의 `#log-quiz-question`(위 구분선 위)과
  `#log-quiz-options button` 4개(아래 4칸)를 실측 퍼센트로 맞춘다.
- `#log-quiz-options button`의 지금 CSS 배경(`#192328`)·테두리(`#647579`)는 그림이 그 자리를
  이미 그려 주므로 투명/테두리 없음으로 바꾸고, 글자와 `:hover`/`:focus-visible` 상태만 CSS로
  남긴다.

## 통합 (완료 — 실측값까지 전부 반영됨)

`#log-panel`을 `#cctv-scene`처럼 화면 전체를 덮는 레터박스 전체화면으로 바꿨다(기존의 작은 중앙
박스 다이얼로그 대신). PowerShell(`System.Drawing`)로 두 그림을 직접 픽셀 샘플링해서, 아래
실측값으로 `css/log-puzzle.css`를 채웠다(생성 지시값과 조금씩 어긋나 있었다 — wire-panel 때와
같은 패턴).

- `log-terminal.png` (1448×1086, 정확히 4:3) — `#log-frame`의 배경. `#log-frame`은
  `aspect-ratio: 4/3`에 `width: min(100vw, 133.334vh)`로 뷰포트 안에서 비율 그대로 최대 크기로
  뜬다(레터박스는 `#log-panel`의 검정 배경이 채운다). 화면(짙은 남색) 영역을 가운데 행·열을
  스캔해 실측: x=33~1414px(2.28%~97.65%), y=40~985px(3.68%~90.70%) → `#log-screen`을
  `left:2.3%; top:3.7%; width:95.3%; height:87%`로 앉혔다.
- `log-quiz-slots.png` (1499×1049, 알파 있음) — `#log-quiz`의 배경. 알파>10인 영역을 행/열별로
  스캔해 구분선과 보기 4칸을 실측: 구분선 y=217~222px(20.7%), 위쪽 줄 버튼 y=315~508px
  (30.03%~48.43%), 아래쪽 줄 버튼 y=585~778px(55.76%~74.17%), 왼쪽 칸 x=56~731px
  (3.74%~48.77%), 오른쪽 칸 x=770~1445px(51.37%~96.40%) → `#log-quiz-options`를
  `left:3.74%; top:30.03%; width:92.66%; height:44.17%`에 `column-gap:2.8%; row-gap:16.6%`인
  2x2 그리드로 앉혀서 네 버튼이 칸 테두리에 정확히 겹치게 했다.
- `#log-quiz-question`(top:3%)·`#log-quiz-record`(top:12%)는 구분선(20.7%) 위 빈 공간에 둘 다
  들어가도록 배치했다.
- `#log-title`·`#log-rows`·`#log-status`는 `#log-screen` 안에 세로로 쌓인다(그림 쪽에 별도
  명판이 없어 전부 DOM 한 화면 안에 넣기로 함). `justify-content:center`로 세로 가운데,
  `text-align:center`로 가로 가운데 정렬했다. 글자 색(`#9fe0b0` 녹색·`#f2d689` 호박색·
  `#e08a7a` 빨강)은 그대로 유지.
- 보기 버튼은 배경·테두리 없이 글자만 그려서(오버레이가 테두리를 맡음) 그리드 칸에 얹힌다.
- `#log-close`는 그림에 자리가 없어 `wire-cancel`과 같은 방식으로 `#log-frame` 하단
  (left:38% top:90.5%)에 평범한 반투명 DOM 버튼으로 얹었다.
