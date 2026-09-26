# 옥상 배경 스프라이트

- 제작: 사용자가 외부 image_gen 도구로 생성해 전달한 이미지를 그대로 사용.
- `source.png`: 1983×793 PNG, 8-bit RGB(알파 없음). 실제 사용 영역 전체 — 별도 아틀라스/타일 분할 없음.
- 기획 근거(`기획.md`): 옥상은 "전력 관리 층"이며, 정전 사건 당시 이웃 건물들은 정상적으로 불이
  켜져 있고 티맥스타워만 정전 상태다. 시설관리 구역에 태양광 비상 전력 제어 장치가 있다.
- 아래 "생성 프롬프트"에 요청한 구성(패널 → 태양광 어레이 → 실외기 2대 → 엘리베이터 문 3개 →
  펜스 → 계단문 → 물탱크)을 실제 결과물이 좌표까지 거의 그대로 따랐다. 다만 요청한 캔버스
  2048×820과 달리 실제로는 1983×793으로 나왔다 — 흔한 일이므로 실측 후 정렬했다(아래).

## 통합 방식

옥상은 17층처럼 고정 배경이 아니라 `js/scene/scene-builder.js`의 `buildDynamicScene()`이 매번 DOM으로 조립하는
"dynamic" 층이다. `FLOORS`(`id: 'roof'`) 항목에 다음을 추가해서 연동했다:

```js
backgroundImage: { src: 'assets/background/roof/source.png', width: 1983, height: 793, top: -40 },
```

`buildDynamicScene()`은 이 값이 있으면 `<img>`를 만들어 `dynamicScene`의 맨 처음(=가장 뒤 레이어)에
넣는다 — `office-background`와 같은 원리지만, **가로는 스케일하지 않고 1:1 그대로** 쓴다
(`width: 1983`을 그대로 게임 월드 폭으로도 사용, `FLOORS.roof.width: 1983`). 스케일이 없으므로
정렬 계산이 세로 이동 한 번으로 끝난다:

- 소스 이미지에서 걷는 길 바닥선(민트 LED 라인)의 실측 y = **610**
- 게임 충돌 바닥선 `floorY` = **570**
- `top = floorY - sourceFloorY = 570 - 610 = -40px`

가로가 1:1이라는 것은 소스 이미지에서 실측한 x좌표를 **그대로 게임 좌표로 쓸 수 있다는 뜻**이다.
아래 표는 그렇게 실측해서 `js/floors/registry.js`의 `ROOFTOP`과 `js/scene/scene-builder.js`의 옥상 분기에 넣은 값이다 (전부 `pixel_scan` +
격자 오버레이로 실측, 눈대중 아님):

| 오브젝트 | 소스 x (좌측 기준) | 게임 x (= 소스 x) | 소스 y(top) | 게임 y(top) = 소스 y − 40 |
|---|---|---|---|---|
| 제어 장치(panel) | 30 | 30 | 490 | 450 |
| 실외기 1 (hvac) | 350 | 350 | 480 | 440 |
| 실외기 2 (hvac) | 495 | 495 | 480 | 440 |
| 엘리베이터 뱅크 시작(elevatorBank) | 780 | 780 | 430 | 390 |
| 엘리베이터 문 간격(doorSpacing) | 157 | 157 | — | — |
| 계단 오프셋(stairsOffset = 1535−780) | 755 | 755 | 445 | 405 |
| 물탱크(tank) | 1740 | 1740 | 290 | 250 |

`assets/background/roof/`의 `roof-verify.png`류 검증 스크린샷(스크래치패드에 임시로 만들었던 것)에서
이 사각형들이 실제 문/장치/탱크 그림과 거의 정확히 겹치는 걸 육안으로 확인했다.

## 판정 박스는 있지만 안 보이게

`obstacles`(hvac ×2, tank)와 `panel`에는 모두 `invisible: true`를 줬다 — 이제 그림이 이미
실외기·탱크·제어 장치를 그려주므로, `.hvac`/`.tank`/`.panel` CSS 모양(칠해진 상자, 항상 켜진 민트
글로우 바)을 다시 그리면 그림 위에 중복으로 얹혀서 오히려 어색해진다. `buildDynamicScene()`에서
`invisible`이면 kind별 클래스(`hvac`/`tank`/`panel`) 대신 베이스 클래스만 붙여서 물리 판정
(Matter.js `Bodies.rectangle`)과 상호작용(`근접 시 힌트/outline`)은 그대로 살리고 시각적 칠만
없앤다. 같은 이유로 `floor`/`boundary`도 `config.backgroundImage`가 있으면 자동으로 안 보이게
처리한다(`hasArt` 플래그, `buildDynamicScene()` 참고) — 그림이 이미 바닥과 옥상 양쪽 끝을 그려준다.

`panel.near`(가까이 갔을 때의 outline)만은 예외로 계속 보인다 — `index.html`의
`.panel.invisible, .panel.invisible::after { background:none; border:none; box-shadow:none; }`가
배경/보더만 지우고 `.panel.near { outline:... }`는 건드리지 않기 때문. 즉 평소엔 그림만 보이고,
플레이어가 다가가면 여전히 상호작용 가능한 테두리가 뜬다.

엘리베이터 문/계단 문 너비·간격도 이 그림 실측값에 맞게 `doorWidth: 115`, `doorSpacing: 157`,
`doorY: 390`, `stairsWidth: 90`, `stairsY: 405`로 조정했다(기존 기본값 200/260/220과 170/232는
다른 placeholder 층엔 그대로 유지됨 — `?? 기본값` 형태로 옥상만 오버라이드).

## 생성 프롬프트 (실제로 사용한 텍스트)

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game.
This is the actual environment artwork, NOT a concept poster or screenshot.
Input image 1 (floor17.png) is a STYLE / MATERIAL / LIGHTING reference only — match its pixel
density, palette restraint, and rendering technique. Do NOT copy its composition, characters, or identity.
Create ONE very wide 2048 x 820 PNG. Strict orthographic SIDE VIEW, camera exactly perpendicular
to the rooftop, as if standing on the roof looking across it. NO vanishing point, NO isometric,
NO perspective floor receding into the distance. Continuous horizontal elevation.
Setting: the rooftop of a Korean software-company tower at midnight, during a building-wide power
outage. This building is completely dark; neighboring buildings in the distant skyline are
normally lit with warm window lights, making the outage obvious by contrast. Restrained
atmospheric pixel art, realistic adult scale, cool desaturated blue-gray night sky, a small pale
moon, faint stars, warm amber window lights on distant buildings only. Human sprite on screen is
about 162 pixels tall; doorway/bulkhead openings about 250-300 pixels tall; use this scale.
CRITICAL COLLISION GEOMETRY: the continuous, perfectly horizontal top edge of the walkable rooftop
surface is at y=620 pixels of this 820-high canvas, from extreme left to extreme right. All
door/panel/equipment bottoms sit exactly on this same y=620 line. The area below is a flat
rooftop deck/parapet foundation only, no perspective, no elevation changes. Sky and distant
skyline occupy roughly y=0..500; a low rooftop parapet wall may partially occlude the base of
distant buildings around y=450..620.
FLOOR MATERIAL (premium, not utilitarian): the rooftop deck is dark polished concrete / terrazzo
with a subtle glossy sheen that faintly reflects the moon and distant city glow — clean and
high-end, not cracked or grimy. Sparingly place one or two wide brushed-steel inlay trim strips
(spaced far apart, at least 300px, breaking naturally around equipment rather than repeating like
cheap expansion joints). Along the very top edge of the deck (the y=620 walk line), add a thin,
understated mint/teal LED edge-lighting strip glowing softly — reuse the same restrained mint
(#7fd9c2-ish) accent as the solar control panel's status light, so the whole roof reads as one
coherent high-tech facility. No rust, no stains, no exposed clutter, no graffiti — restraint and
one accent color are what make it read as premium, not extra detail.
Composition across width:
x=0..270: distant lit city skyline visible over a low rooftop parapet, a few scattered warm
windows, a small pale moon high in the sky. In the foreground, a solar-powered emergency power
control panel/console (a waist-height outdoor electrical cabinet with a small status screen).
x=270..360: a small tilted solar panel array (2-3 dark blue-black angled panels) mounted beside
the control panel.
x=380..638: two rooftop HVAC/air-handling units side by side, connecting pipes and a grated
walkway between them.
x=638..850: open rooftop deck, empty walk lane, skyline continuing in the background.
x=850..1570: three rooftop elevator machine-room bulkhead housings in a row, each a plain flush
metal doorway flush with the rear wall, bottoms exactly on y=620, evenly spaced. Leave the area
directly above each door plain (no signage) — the game overlays its own floor-indicator display there.
x=1570..1630: rooftop fencing, skyline continuing.
x=1630..1800: a stairwell bulkhead access door (fire door), small dim green exit sign above it,
bottom exactly on y=620.
x=1800..2000: a cylindrical elevated emergency water tank on a metal support frame.
x=2000..2048: rooftop edge, parapet railing, skyline glow fading out.
No people, no monsters, no robots, no foreground furniture blocking the walk lane, no UI, no
border, no watermark, no captions, no large readable lettering (small pictograms on the control
panel are fine). The game adds its own labels, hint text, and collidable hitboxes on top. Output
only the finished background.
```

## 나중에 다시 만들 때

이 이미지를 재생성하거나 다른 층에도 같은 방식을 적용하려면:
1. 위 프롬프트를 재사용하고, 필요하면 좌표 범위만 그 층의 `FLOORS` 설정에 맞게 고친다.
2. 결과물을 받으면 `file <이름>.png`로 실제 픽셀 크기를 확인한다(요청한 크기와 다르게 나오는 게 정상).
3. 걷는 길 바닥선의 실제 y를 찾는다(육안 또는 픽셀 스캔 — 이 파일에서는 바닥 라이팅 라인의
   민트색을 기준으로 여러 x에서 스캔해 y=610으로 확인했다).
4. `top = floorY(570) - 그 y`를 계산해 `backgroundImage.top`에 넣는다.
5. 가로를 스케일하지 않는다면(이 파일처럼) 소스 이미지에서 실측한 x좌표를 그대로 `FLOORS`의
   `elevatorBank`/`obstacles`/`panel` 좌표로 써도 된다. 격자를 오버레이해서 실측하면 눈대중보다
   훨씬 정확하다(이번에 사용한 방법: PowerShell + `System.Drawing`으로 50px 격자선을 그려 저장 →
   이미지 확인 → 필요하면 해당 구간만 확대 크롭).
