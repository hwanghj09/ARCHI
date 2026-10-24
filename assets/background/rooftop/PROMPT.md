# Rooftop Background

- Tool: 외부 image_gen (사용자가 생성해 전달). 신카이풍 애니메이션 배경화.
- `rooftop-night.png`: 2172x724 RGB 원본. 바닥선(실외기·계단실·물탱크 발 끝) 실측 y=566.
- `rooftop-night-finished.png`: 2400x760 RGBA, 옥상 장면(`js/world/rooftop.js`)이 1:1로 깐다.
- `rooftop.png` / `rooftop-finished.png`: 이전 옥상 그림. `rooftop-finished.png`는 다른 층의 바깥 창문
  풍경(`.exterior-window`, `css/game.css`)이 계속 쓰므로 지우지 않는다.

## 정렬

- 가로 2172 → 2400, 배율 s = 2400 / 2172 = 1.105. 세로도 같은 배율로 724 → 800.
- top = floorY(570) − 566 × s = 570 − 625.4 → −55. 그림은 y=−55..745에 놓인다.
- 남는 아래 15px(y=745..760)은 원본 마지막 4줄(어두운 난간 띠)을 늘려 채웠다.
- 합성은 PowerShell + System.Drawing(HighQualityBicubic). 원본 x는 ×1.105로 게임 x가 된다.

## 오브젝트 정합 (게임 좌표)

| 요소 | 위치 | 비고 |
|---|---|---|
| 계단실 벽 | x≈54..402, 지붕 y≈246 | 벽면은 비워 두고 게임이 `stairs.png`를 얹는다 |
| 17층 계단 문 | x=165, y=252, 170x318 | 지붕선 아래로 내리고 180:338 비율 유지 (`scene-builder.js`) |
| 실외기 2대 | x≈460..770 | 장식, 판정 없음 |
| 태양광 발전기 스프라이트 | x=810..1170 | 비워 둔 구간에 게임이 얹는다 |
| 태양광 패널·배전함·펜스·물탱크 | x≈1150..2390 | 장식, 판정 없음 |

## Prompt

```text
Wide cinematic side-view panorama of a modern city rooftop at night, anime background art style (Makoto Shinkai–inspired), highly detailed, painterly but clean. Production background for ARCHI, a 2D side-scrolling mystery game: midnight, the rooftop of a Korean software-company tower during a building-wide power outage — this building is dark while the surrounding city is normally lit.

Canvas: exactly 2400x760 (or the same 3.16:1 ratio, e.g. 2172x687). Opaque, no transparency.

Camera: strict orthographic side elevation, camera perpendicular to the rooftop. No perspective, no vanishing point, no receding floor. A standing person is about 162px tall at this scale (21% of image height); doorways are about 250–300px tall.

CRITICAL FLOOR LINE: the walkable rooftop surface is one perfectly straight horizontal line at exactly 75% of image height (y=570 of 760), from the far left edge to the far right edge. Every prop's bottom sits exactly on this line. Below it (75–100%) is only the flat wet rooftop deck seen edge-on, with a thin dark ledge and a faint cyan neon strip along the very bottom edge.

Sky (top ~50%): deep navy-to-indigo night sky, soft wispy dark clouds in horizontal bands, a few faint stars. A small bright full moon in the upper left (about 13% from left, 15% from top) with a soft glow.

Background: a low continuous concrete parapet wall across the full width, its top at about 52% of image height. Behind it, a dense city skyline — high-rise apartment and office towers with warm amber lit windows, small red aviation lights on rooftops, faint distant mountain silhouettes. Taller towers rising at center and center-right.

Rooftop layout, left to right (percent of image width):
- 0–1%: rooftop edge.
- 1–17%: a plain rectangular concrete stairwell housing rising from the floor line up to about 26% from the top, with a flat cap. Its front facade must be COMPLETELY BLANK — no door, no opening, no sign, no window, no light (the game overlays its own interactive door here). A thin metal ladder may run up its right side edge only (16–17%).
- 18–29%: two square outdoor HVAC units side by side with large circular fans, sitting low against the parapet, tops no higher than about 60% from the top.
- 30–45%: COMPLETELY EMPTY open deck — only the parapet and skyline behind. No equipment, no railing, no panels, no bright light sources here (the game places a solar generator sprite in this area).
- 46–58%: two rows of low tilted dark-blue solar panels on metal frames, tops below about 62% from the top, with a thin cable conduit running along the floor toward the left.
- 59–65%: a gray metal electrical/utility cabinet with vents and a small yellow warning sticker; its small control screen is dim and powered-off, with only one tiny faint cyan standby LED.
- 66–88%: a black metal safety railing with chain-link mesh running along the parapet top.
- 89–99%: a tall cylindrical steel water tank on a steel-frame tower with a ladder and railings.
- 99–100%: rooftop edge, skyline fading out.

Floor: wet, rain-slicked rooftop tiles below the floor line, with glossy mirror-like reflections of the city lights, amber window reflections, and faint cyan reflections. Reflections stay below the floor line; the floor line itself stays crisp and straight.

Mood: quiet, lonely, atmospheric, cool blue palette with warm amber city light accents and only small, dim cyan/teal highlights (this building has no power). No people, no text, no logos, no watermark, no UI, no border.
```

## 패럴랙스 두 겹 (현재 사용)

- `rooftop-front.png` 2170x725 RGBA(하늘 투명) → `rooftop-front-finished.png` 2400x760. 배율 2400/2170=1.106,
  바닥선 원본 y=566 → top=−56. 원본 알파가 253(약간 비침)이라 250 이상은 255로 올렸고, y≥570 아래 투명 띠(y≥700)는
  #06090e 위에 합성해 불투명하게 막았다.
- `rooftop-city.png` 2170x725 RGB(도시·하늘만) → `rooftop-city-finished.png` 2400x760. 같은 배율, top=−181
  (전경보다 125px 위 — 이전 합본처럼 스카이라인이 난간 위로 올라오게). 그 결과 원본의 달은 화면 위로 잘려 나갔다.
- `js/world/rooftop.js`: `rooftopCity`는 `translateX(cameraX × (1 − ROOFTOP_PARALLAX))`로 매 프레임 되밀린다
  (`camera.js` `render()` → `updateRooftopParallax()`). `ROOFTOP_PARALLAX = .3` → 전경 100px 이동 시 도시는 30px.
- `rooftop-night-finished.png`(한 장짜리)는 더 이상 옥상 장면에서 쓰지 않는다.
- 2026-10-24: 전경을 픽셀 아트 버전 `rooftop-front-pixel.png`(2170x725 RGBA)로 교체. 바닥선 원본 y=567 → top=−57,
  배율 1.106, 같은 알파 보정 후 `rooftop-front-finished.png`에 덮어썼다(이전 페인터리 전경 원본은 `rooftop-front.png`로 남김).
- 2026-10-24: 전경을 소품 없는 옥상 `rooftop-front-plain.png`(2172x724 RGB, 체크무늬가 그림에 박혀 있음)로 교체.
  가장자리에서 이어진 무채색·밝은 픽셀(채도차 ≤14, 밝기 ≥120)을 flood fill로 투명 처리한 뒤,
  바닥선 원본 y=527 → top = 570 − 527 × 1.105 = −12, 높이 800(아래 28px는 화면 밖)으로 `rooftop-front-finished.png`에 덮어썼다.
  이전 픽셀 아트 전경 원본은 `rooftop-front-pixel.png`로 남김.
- 2026-10-24: 도시 레이어를 top=−181 → −120으로 61px 낮췄다. 원본 달(원본 중심 324,113)은 그대로면 화면 맨 위(y≈5)에 반쯤 걸려서,
  같은 높이 오른쪽 하늘(원본 x+520)을 페더로 덮어 지우고, 달 조각(원본 140px)을 페더 처리해 월드 (360, 105)에 다시 얹었다.
- 2026-10-24: 전경을 픽셀 아트 소품 버전 `rooftop-front-pixel2.png`(2170x725 RGB, 하늘이 검정)로 교체.
  가장자리에서 이어진 거의 검은 픽셀(최대 채널 ≤10)을 원본 y<538 구간에서만 투명 처리(경계 1px은 밝기 비례 반투명).
  y=538..563 띠는 실외기·펜스 아래 틈으로 도시 불빛이 비치지 않게 불투명으로 남겼다.
  바닥선 원본 y=563 → top = 570 − 563 × 1.106 = −53, 아래 749..760은 마지막 줄을 늘려 채움.
