# Connector cable — seamless tileable wire texture

생성해 적용 완료.

- `wire-cable-source.png`: 2048×768 RGBA. 진짜 알파가 있지만, 불투명한 케이블 몸통은 세로
  y=298~465(약 23%)뿐이고 그 바깥은 전부 알파 0이다 — 미리보기에 보이는 붉은 발광
  그라데이션은 알파 0인 칸에도 RGB가 남아 있어서 생기는 미리보기 표시 방식일 뿐, 실제 게임
  렌더링에선 알파를 지키므로 안 보인다.
- `wire-cable.png`: 512×43 RGBA. `scripts/prepare-wire-cable-ui.ps1`이 불투명 띠 주변만 살짝
  여유를 두고(y=295~468) 잘라낸 뒤 고품질 보간(최근접 아님 — 그라데이션 질감이라)으로 줄인다.
  실측 색상각 ≈4.2~4.5°(빨강 기준점과 거의 일치).
- 용도: 전선 퍼즐(`#wire-panel`)에서 왼쪽 소켓과 오른쪽 단자를 실제로 "이은" 모습.
  `js/interaction/wire-puzzle.js`의 `drawWireLine()`이 두 점 사이 거리만큼 늘어나는 `<div>`
  (배경 타일 반복)를 각도에 맞춰 회전시킨다 — SVG `<line>` 민짜 직선은 치웠다.
- 스타일 참조: `assets/ui/wire-puzzle/wire-panel.png`(배전반 그림)의 모서리에 그려진 늘어진
  전선 다발과 같은 재질(피복 입힌 고무 케이블)로 맞췄다.

## 왜 "이음매 없는 가로 반복 타일" + "색 하나만 생성 후 hue-rotate"인가

연결선은 왼쪽 4줄 중 아무 색이나 오른쪽 4줄 중 아무 색과 — 같은 색끼리만 — 이어진다
(`shuffledWireColors()`로 양쪽 다 무작위). 왼쪽 2번째 줄이 오른쪽 4번째 줄과 이어질 수도 있어서
**선의 길이와 각도가 연결마다 다르다.** 고정된 한 장짜리 그림으로는 이 가변 길이·각도를 감당할
수 없으니, 가로로 이어 붙여도 이음매가 안 보이는 좁은 "케이블 단면" 타일 하나를 만들어서
JS가 두 점 사이 거리만큼 가로로 반복(`background-repeat: repeat-x`)시키고 각도만큼 `<div>`를
회전시킨다.

색은 4종(빨강·노랑·파랑·초록, 기존 `WIRE_COLORS`의 `#d8453a`/`#d9b03a`/`#3a7ad8`/`#3fae5c`)이
필요한데, **완전 무채색(회색/흑백)은 `hue-rotate()`가 먹히지 않는다** — 채도가 0인 픽셀은
색상각을 돌려도 여전히 채도 0이라 그대로 회색이다. 그래서 "중립 톤"이 아니라 **채도가 있는
기준색 하나(빨강, 색상각 ≈4°)로 생성**하고, 나머지 3색은 CSS `filter: hue-rotate()`로 기준색
대비 상대 회전각만큼 돌려서 우려낸다(아래 "통합" 절에 각도 계산값 있음) — 지금 소켓 원을
`--wire-color`로 칠하는 것과 같은 "한 장만 만들고 CSS로 색만 바꾸기" 절약 방식이다.

## 생성 프롬프트

```
Use case: stylized-concept. Production UI texture tile for ARCHI, a Korean pixel-art
side-scrolling mystery/horror game. Reference image is the existing exposed wiring panel
(wire-panel.png) — match the material and lighting of the loose cut wire bundles already painted
in its corners: dark rubber/braided cable insulation with a warm saturated red tone, subtle
copper/brass fleck highlights, moderate wear. Do not copy the panel's composition.

Draw ONE short straight segment of insulated electrical cable, seen from directly the side
(strict orthographic, the cable running perfectly horizontal left to right across the canvas),
as a SEAMLESSLY TILEABLE texture: the left edge of the image must match the right edge exactly
pixel-for-pixel so the segment can repeat horizontally with zero visible seam. Output ONE 128x48
transparent PNG. The cable itself is a horizontal cylindrical tube centered vertically, about
24px thick, with ample transparent padding above and below. Rubber/braided insulation texture,
a consistent highlight running along the top of the tube and a consistent shadow along the
bottom — the shading profile must be UNIFORM along the entire length (no single bright glint or
dark spot anywhere, since this repeats) so it tiles invisibly. The cable color is a warm, clearly
saturated RED (similar to a traffic-cone or warning-light red, NOT a dull brick or rust tone,
NOT grayscale) — saturation matters because this exact texture will be recolored by hue-rotating
in code.

No readable text, letters, numbers, logos, connectors, plugs, frayed ends, sparks, people,
drop shadow, background scene, checkerboard, watermark, or any asymmetry between the left and
right edges. This is a tileable game texture asset, not a finished illustration. Real alpha
transparency outside the cable, solid opaque cable body.
```

## 통합 (완료)

`wire-puzzle.css`의 `.wire-cable`이 `#wire-svg`(SVG `<line>`)를 대체한다:
```css
.wire-cable { position: absolute; left: 0; top: 0; z-index: 0; height: 2.2%; min-height: 6px;
  transform-origin: 0 50%; background-image: url('assets/ui/wire-puzzle/wire-cable.png');
  background-repeat: repeat-x; background-size: auto 100%; pointer-events: none; }
```
`.wire-column`에 `z-index: 1`을 줘서 소켓 버튼이 전선보다 위에 그려지게 했다(선이 플러그
뒤로 들어가는 것처럼 보이도록).

`js/interaction/wire-puzzle.js`의 `drawWireLine(id, from, to, colorId)`가 `#wire-board`에
`.wire-cable` div를 만들고(없으면) 두 점 사이 거리만큼 `width`를, `Math.atan2`로 각도를 구해
회전시킨다. `id`는 `wireBoard.querySelector('.wire-cable[data-wire="id"]')`로 재사용 여부를
가린다(기존 `wireSvg.querySelector` 자리를 그대로 대체) — 드래그 중 임시선(`id: 'drag'`)도
같은 함수를 타고, `pointercancel`·연결 실패 시 `removeWireLine('drag')`로 지운다.

`WIRE_HUE_ROTATE = { red: 0, yellow: 40, blue: 212, green: 132 }`를 `filter: hue-rotate()`로
적용한다. 실측해 보니 생성된 빨강의 색상각(≈4.2~4.5°)이 기존 소켓 빨강(`#d8453a`, ≈4.18°)과
거의 같아서 **계산값을 그대로 써도 잘 맞았다** — 추가 보정 없음.
