# Rooftop breaker overload — exposed wiring panel

v2 프롬프트로 생성해 적용 완료.

- 생성 도구: 사용자 보유 도구(어떤 모델인지는 기록 없음), v2 프롬프트 사용.
- `wire-panel-source.png`: 1098×1433, 생성 결과 원본. 알파 채널이 없고(색상 유형 2, RGB) 배경이
  순수 검정(0,0,0)이라 "진짜 투명"이 아니다.
- `wire-panel.png`: 480×626 RGBA. `scripts/prepare-wire-panel-ui.ps1`로 만든다 — 순수 검정
  (R/G/B 모두 8 이하)만 알파 0으로 치환하고(안쪽 어두운 공동은 실측 결과 가장 어두운 곳도
  28 이상이라 안전하게 구분됨), 최근접 보간으로 480px 폭(원본 비율 유지, 높이 626px)으로 줄인다.
- 용도: `js/interaction/wire-puzzle.js` / `wire-puzzle.css` / `index.html`의 `#wire-panel` —
  옥상 비상 전력 비밀번호(1997)에 처음 성공한 순간 뜨는 "과부하로 전선이 끊어졌다" 모달의 배경.
  `power.css`와 같은 패턴(그림을 배경으로 깔고 실제 버튼·텍스트를 퍼센트 좌표로 얹기)으로
  `wire-puzzle.css`에 연결했다.
- 스타일 참조: `assets/ui/power/panel-off-on.png`(기존 옥상 배전반 레버 패널)를 재질·색감·조명
  참조로 사용했다(`assets/ui/power/PROMPT.md` 참고). v1은 참조와 톤이 많이 어긋나(거의 검정에
  녹슨 느낌, 공사장 테이프 줄무늬, 경첩 달린 바깥 캐비닛까지 보임) 폐기하고 v2로 다시 생성했다.

## 왜 그림에 전선 색을 안 그리는가

전선 퍼즐은 왼쪽 끝 4개·오른쪽 단자 4개를 같은 색(빨강·노랑·파랑·초록)끼리 드래그/클릭으로
연결하는 방식이고, **양쪽 색 배치는 `openWirePanel()`이 열 때마다 무작위로 섞는다**
(`js/interaction/wire-puzzle.js`의 `shuffledWireColors()`). 그림에 색이 박혀 있으면 매번 바뀌는
배치를 표현할 수 없다. 그래서 `assets/ui/power/panel-off-on.png`가 층 선택 버튼 자리를
"칠해진 버튼 없이 완전히 비워 둔" 것과 똑같은 방식으로, 이 그림도 8개 자리를 **빈 소켓/단자
모양만** 그리고 색은 전혀 칠하지 않는다. 실제 색 동그라미와 연결선은 지금처럼 계속
CSS(`.wire-column button`의 `--wire-color`)·SVG(`#wire-svg`)로 그 위에 얹는다 — 바뀌는 건
좌표뿐이다(아래 "정렬" 절).

## 생성 프롬프트 (v2)

v1은 `panel-off-on.png`를 참조로 지정했는데도 실제로는 거의 새까만 녹슨 톤, 대각선 공사장
테이프 줄무늬, 경첩 달린 바깥 캐비닛 문짝까지 열어젖힌 넓은 구도로 나와 기존 배전반과
느낌이 많이 어긋났다. v2는 그 세 가지(색감·경고 모티프·구도)를 참조 이미지에 실제로 있는
디테일(슬레이트블루 금속, 작은 화살표형 셰브런, 패널 정면만 보여주는 크롭)로 구체적으로
못박아 재발을 막는다.

```
Use case: stylized-concept. Production UI art for ARCHI, a Korean pixel-art side-scrolling
mystery/horror game set in an office tower at midnight. Reference image is the existing solar
emergency distribution panel (panel-off-on.png). Match it closely: the same cool slate-blue-gray
brushed metal body color, the same cream/ivory nameplate color, the same small alternating
orange-and-dark diagonal CHEVRON (arrow-shaped, not a solid stripe) accents in the corners only,
the same moderate, tasteful wear level — NOT heavily rusted, NOT charcoal-black, NOT a horror-grime
look. Do not copy the reference's composition, its lever, or its screen content.

Draw ONLY the flat front face of a matching industrial electrical panel, straight-on orthographic,
cropped tight to the panel exactly like the reference — NO surrounding outer cabinet, NO hinged
door, NO door vents, NO latch or keyhole, NO dangling exterior cable; this is the same kind of
panel face as the reference, not a wider shot of a locker. The panel face is open/damaged because
an overload tore its interior wiring loose: a few thin bare wire ends with frayed insulation and
two or three small bright amber sparks near the top corners are the ONLY damage accents — keep
scorch marks light and localized, not covering large areas. Output ONE 768x1024 transparent PNG,
portrait orientation, matching the reference's lighting, material and line-weight exactly. Panel
occupies x=4%-96%, y=3%-97% of the canvas with transparent outer margin.

Layout: narrow empty cream nameplate x15%-85% y6%-12%, same style as the reference's nameplates.
Below it, a dark recessed interior cavity x8%-92% y15%-82% showing the overload damage (a few
loose cut wire ends, light scorch streaks, one bent conduit clamp) as background texture ONLY —
keep most of the cavity plain dark metal, damage only near the top edge and corners. Inside that
cavity, leave TWO vertical empty zones completely free of any painted wire color, number or label:
a LEFT zone at x18%-26% with four small identical empty dark socket/clip shapes stacked with
centers at y24%, y40%, y56%, y72%; a RIGHT zone at x74%-82% with four small identical empty open
terminal-lug shapes at the SAME four y rows, same size as the left sockets. The broad middle area
between the two zones (x26%-74%) must stay visually plain, dark and low-contrast — no texture, no
cables crossing it — reserved for live colored connector graphics added later. Narrow blank cream
nameplate strip x14%-88% y85%-90% for a status line. Small blank rounded rectangle button area
x38%-62% y91%-96% near the bottom edge, same button style as a real panel control.

No readable text, letters, digits, legends, logos, people, painted wire insulation colors, dots,
or numerals at the eight socket positions, heavy rust, caution-tape stripe, outer cabinet frame,
hinges, vents, latch, keyhole, drop shadow, perspective tilt, glow halos beyond the small sparks,
checkerboard or watermark. This is game-ready mechanical UI art, not a webpage, mockup, or
screenshot. Real alpha transparency outside the panel, solid opaque panel and recesses.
```

## 통합 (완료 — 아래는 실측값)

생성 결과(1098×1433, 알파 없음)를 PowerShell(`Add-Type -AssemblyName System.Drawing`)로
직접 픽셀 샘플링해 8개 소켓과 두 명판의 실제 좌표를 쟀다(생성 지시값과 2~3%p 정도 어긋나 있었다
— 특히 오른쪽 열 1번째·4번째 줄). `scripts/prepare-wire-panel-ui.ps1`이 순수 검정만 알파 0으로
치환하고(안쪽 어두운 공동은 가장 어두운 곳도 RGB 28 이상이라 8 이하 기준으로 안전하게 구분됨)
480×626으로 최근접 보간 축소한다.

`wire-puzzle.css`는 `power.css`와 같은 패턴(배경 이미지 위에 퍼센트 좌표로 실제 버튼을 얹기)으로
다시 짰다:

- `.wire-box`: `assets/ui/wire-puzzle/wire-panel.png` 배경, `aspect-ratio: 480/626`(생성 결과가
  정확히 3:4가 아니라서 실측 비율을 그대로 씀, `power-cabinet`의 3:4와 다름).
- `#wire-title`: x15%-85%, top 7%(윗 명판).
- `#wire-left button` 4개: x=22% · `#wire-right button` 4개: x=78%. 네 줄 모두
  `:nth-child(1~4)`로 top=29%/41%/55%/67% (생성 지시값 24/40/56/72%에서 실측 보정).
- `#wire-svg`(연결선): `#wire-board`가 `.wire-box` 전체(inset:0)를 덮고, `wirePlugCenter()`가
  각 버튼의 실제 `getBoundingClientRect()`로 선 끝 좌표를 구하므로 레이아웃 방식과 무관하게 맞는다.
- `#wire-status`(아래 명판, 안내문+진행 상황 겸용): x14%-88%, top 83%.
- `#wire-cancel`(맨 아래 버튼): x36%-64%, top 89.5%.

`#wire-help`는 더 이상 별도 DOM이 아니다 — 안내문을 `openWirePanel()`이 여는 순간
`#wire-status`에 바로 써서 같은 명판 한 줄을 안내문·진행 상황 둘 다로 쓴다(그림에 명판이
위아래 두 줄뿐이라).
