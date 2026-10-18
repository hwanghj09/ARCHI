# 16층 출입문 스프라이트

내장 `image_gen`으로 만든 불투명 PNG 5종입니다. 문틀까지 캔버스를 채운 원본을 수정 없이 사용합니다.

| 파일 | 크기 | 용도 | 게임 크기 |
| --- | --- | --- | --- |
| [cafeteria-door.png](cafeteria-door.png) | 992×1586 | 식당 유리 양문·청동 프레임 | 200×320 |
| [cu-shutter-states.png](cu-shutter-states.png) | 1254×1254 | VU 셔터 닫힘 / 올라감, 627×1254 셀 2개 | 셀당 150×308 |
| [restroom-door.png](restroom-door.png) | 793×1983 | 청록색 불투명 문·화장실 표식·하부 환기구 | 145×360 |
| [cafe-door.png](cafe-door.png) | 830×1894 | 카페 아치 유리·목재·황동 손잡이 | 140×320 |
| [service-door.png](service-door.png) | 735×2139 | 주방 반입문·원형 창·충격 방지판 | 110×320 |

## 게임 연결

`index.html`의 `#dynamic-scene[data-theme="food"]` 범위에서 기존 문 스타일(cafeteria/shutter/metal/cafe/backdoor)에 배경 이미지를 적용합니다. 16층 복도와 방 내부 모두 같은 파일을 사용합니다. 화장실 내부의 기존 `data-art="true"` 규칙보다 우선해 그림을 유지합니다. 기존 문 좌표·크기·상호작용·접근성 이름은 유지하며 문틀 아래가 y=570에 놓입니다. 방 내부 출구는 기존 거울 배치 계산을 그대로 사용합니다.

VU 시트는 `background-size: 200% 100%`이며, `data-unlocked="false"`는 왼쪽, `true`는 오른쪽 셀입니다. `scene-builder.js`가 문 `unlockedBy` 아이템의 수집 여부를 복도와 방 안쪽에 동일하게 전달하고 `doors.js`가 DOM 속성으로 기록합니다. 기존 규칙대로 안에서 복도로 나오면 잠금 해제되어 이후 재입장해도 셔터가 올라간 상태를 유지합니다. 오른쪽 셀은 셔터가 올라가고 유리 출입문은 닫혀 있는 모습입니다.

검증: `npm run test:floor16` — 문 5종의 이미지 로딩·서로 다른 파일·문턱 정렬, 복도/실내의 VU 잠금 전후 셀, 화장실 내부, 기존 문 통과·단서 조사·모바일 표시.

## 생성 프롬프트

각 이미지마다 공통 프롬프트와 해당 개별 프롬프트를 이어 붙여 내장 image_gen으로 생성했습니다. 참조 이미지 입력은 없습니다.

```text
Use case: stylized-concept. Production architectural door sprite for ARCHI, a Korean side-scrolling pixel-art mystery game in a food court at midnight during power outage. Very detailed refined anime-inspired PIXEL ART, crisp hard stepped edges and visible pixel clusters, subtle wear, muted dark materials, legible ambient highlights, all lights OFF. Strict flat orthographic FRONT ELEVATION, absolutely no perspective or isometric rotation. Entire canvas is the DOOR AND ITS FRAME, full bleed: outer frame touches the top, left and right image edges; threshold touches bottom edge. NO surrounding wall or floor or padding, NO cast shadow outside frame, no scene, people, text, logos, watermark. Fully opaque PNG rectangle. Realistic proportions for a tall human-scale commercial doorway.
```

### cafeteria-door.png

```text
ONE closed elegant cafeteria DOUBLE DOOR in a portrait canvas ratio 5:8. Two equal narrow smoked-glass leaves with brushed champagne-bronze framing, prominent central seam, two matching vertical stainless pull handles facing each other, horizontal safety frosted band at mid-height, solid brushed kick plates at bottom. Subtle cool blue glass reflections; broad rectangular transom above. No readable lettering. Frame fills image edge to edge. Clearly a double glass restaurant entrance, NOT a wood door.
```

생성 원본: `exec-d20d09e1-5e37-4453-85d2-f4f227fb8f6a.png`.

### cu-shutter-states.png

```text
A TWO-STATE sprite sheet: square canvas, EXACTLY TWO adjacent equal portrait cells in ONE ROW, no gutter. Each cell is one identical tall rectangular convenience-store entrance with muted PURPLE metal frame and a small LIME-GREEN fascia across the very top; absolutely no logo. LEFT CELL: completely CLOSED corrugated steel roller shutter with horizontal slats, recessed lifting handle and keyhole near bottom. RIGHT CELL: same frame in exact same coordinates relative to cell, shutter rolled up into a compact overhead roll, revealing a CLOSED clear glass swing door with chrome vertical handle and dark unlit store beyond glass. Identical outer border thickness and ground baseline in both cells. Each cell fully filled by door/frame, no margin. Distinct states, NOT two copies.
```

생성 원본: `exec-d97ceca9-7ddb-474c-a7ad-475fc9a9134d.png`.

### restroom-door.png

```text
ONE closed restroom SINGLE DOOR in a tall portrait canvas ratio 2:5. Desaturated teal painted solid panel, brushed aluminum frame, NO transparent glass. A small centered cream plaque at upper third displays simple male and female restroom PICTOGRAM SILHOUETTES ONLY, no letters. Brushed silver horizontal lever handle at right at mid-height, small round privacy indicator above handle, wide horizontal ventilation louver at bottom, stainless kick plate. Institutional restroom appearance, modest scuffs, crisp pixels. Full-bleed outer frame.
```

생성 원본: `exec-d357ec65-fc80-4793-98f2-fc9615f39365.png`.

### cafe-door.png

```text
ONE closed cafe SINGLE DOOR in a tall portrait canvas ratio 7:16. Dark warm WALNUT wood door with distinctive arched glass inset in its upper two thirds (outer frame still rectangular and full bleed). Amber-brown narrow wood muntins divide the arched smoky glass into small panes. Curved aged-brass pull handle on left, solid wood recessed panels in bottom third, subtle wood grain, cozy traditional coffee shop identity. No text or signage, no surrounding wall. Clearly distinct from a commercial rectangular glass or metal door.
```

생성 원본: `exec-e39e4e82-de74-4e9c-929f-7a94e9c31592.png`.

### service-door.png

```text
ONE closed industrial kitchen SERVICE DOOR in a tall narrow portrait canvas ratio 11:32. Brushed gray stainless-steel panel and dark steel frame, one round porthole inspection window near upper third, thick black rubber impact bumper across lower half, reinforced kick plate at bottom, sturdy horizontal push bar at middle, exposed heavy hinges on left. Practical back-of-house delivery entrance. No colored fascia, lettering, people, or symbols. Full-bleed frame fills all image boundaries.
```

생성 원본: `exec-c1c756d2-6c6f-44bb-83da-215d1fd90738.png`.


간판 이름은 이미지에 굽지 않고 `js/core/brands.js` 설정을 따라 문틀 위에 표시합니다. 내부 파일명과 저장 키의 `cu`는 호환성을 위해 유지합니다.
