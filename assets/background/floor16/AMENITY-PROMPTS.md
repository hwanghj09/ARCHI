# 16층 편의시설 배경

내장 `image_gen`으로 생성한 복도·The Kitchen·CU 편의점·Café 배경입니다. 모두 정전 상태이며 창밖 도시 불빛과 약한 주변광으로 재질을 구분합니다. 기존 경영지원팀용 `corridor.png`, `office.png`, `meeting.png`, `pantry.png`와 별개입니다.

## 파일과 배치

각 파일은 원본 그대로 **1983×793 PNG**입니다. 복도는 3장, 식당은 2장으로 구성하고 편의점·카페는 각각 1장을 사용합니다.

| 파일 | 장면 | 월드 시작 x | 월드 폭 | 원본 바닥 y | 표시 높이 |
| --- | --- | --- | --- | --- | --- |
| [amenity-corridor-left.png](amenity-corridor-left.png) | 복도 왼쪽: 식당·CU 전면 | 0 | 1800 | 562 | 804.288 |
| [amenity-corridor-core.png](amenity-corridor-core.png) | 복도 중앙: 엘리베이터·계단 | 1800 | 1756 | 601 | 752.097 |
| [amenity-corridor-right.png](amenity-corridor-right.png) | 복도 오른쪽: 화장실·카페 | 3556 | 1444 | 563 | 802.860 |
| [amenity-kitchen-dining.png](amenity-kitchen-dining.png) | 식당 식사 구역 | 0 | 1802 | 571 | 791.611 |
| [amenity-kitchen-service.png](amenity-kitchen-service.png) | 식당 주방 구역 | 1802 | 1802 | 591 | 764.822 |
| [amenity-cu-interior.png](amenity-cu-interior.png) | CU 편의점 내부 | 0 | 2040 | 602 | 750.847 |
| [amenity-cafe-interior.png](amenity-cafe-interior.png) | 카페 내부 | 0 | 1904 | 596 | 758.406 |

`js/floors/floor-16.js`의 `FLOOR16_LAYOUT`·`FLOOR16_ROOMS`에 연결합니다. 가로는 각 구간 폭에 맞추고, 세로는 측정한 벽·바닥 경계가 충돌 바닥 y=570에 오도록 `height = 793 × 570 / sourceFloor`, `top = 0`을 사용합니다. 따라서 `top + sourceFloor × height / 793 = 570`입니다. 원본 그림은 수정하지 않았습니다.

`backgroundImage`는 기존 단일 객체 또는 이미지 배열을 받습니다. `backgroundWallsOnly: true`는 `data-art="walls"`로 표시하며 CSS 임시 벽·바닥만 감춥니다. 문·셔터·반입문·엘리베이터·계단과 모든 소품은 기존 좌표에 그대로 그립니다. 방 이름표와 층 표지판도 DOM 글자로 유지합니다. 기존 화장실은 `data-art="true"`, 배경 없는 층은 `false` 동작을 유지합니다.

정전 분위기와 캐릭터 식별성을 맞추기 위해 새 배경에만 CSS `brightness(.72) saturate(.85)`를 적용합니다. 소품 이미지에는 이 필터를 적용하지 않습니다.

검증: `node tests/floor16-art.mjs` — 7장 이미지 로딩, 구간 경계, 바닥선, 문 표시, 식당→CU 반입문, 셔터 잠금 해제, 단서 조사, 모바일, 기존 화장실·15층 렌더링. 검증 화면은 `.local/floor16-art-*.png`에 저장합니다.

## 생성 프롬프트

각 호출은 다음 공통 프롬프트와 해당 개별 프롬프트를 이어 붙인 문자열을 사용했습니다. 참조 이미지 입력 없이 내장 image_gen으로 7장을 각각 생성했습니다. 요청 크기는 1800×720이었으며 실제 출력은 모두 1983×793입니다.

```text
Use case: stylized-concept. Production background artwork for ARCHI, a Korean 2D side-scrolling mystery game in a company tower at midnight during a power outage. Create ONE opaque landscape PNG, 1800 by 720, aspect 2.5:1. Strict orthographic SIDE ELEVATION, camera perpendicular to the back wall, absolutely NO perspective depth or isometric angle. Beautiful detailed anime-inspired PIXEL ART, crisp stepped pixel clusters, subdued natural materials and muted colors, richly atmospheric yet readable. No people or creatures. All ceiling lights and screens OFF. Human sprite placed later is 162 pixels tall in these canvas units. CRITICAL: horizontal floor contact line exactly at y=570 (79.1667 percent of image height), edge to edge. Below that line only a flat dark charcoal structural foundation cross-section, NOT a perspective floor, no reflections or rugs or receding tiles. Ceiling horizontal band at y=0..60 with switched-off fixtures. NO DOORS, NO DOOR FRAMES, no door-shaped empty openings: all functional doors are separate game overlays. No freestanding furniture, no tables, chairs, machines, counters, refrigerators, plants, boards, cartons, or objects on the floor: they will be separate sprite overlays. Wall-mounted architectural details and shelves are allowed when requested. NO text, letters, digits, logos, signs, labels, UI, watermark, or border.
```

### amenity-corridor-left.png

```text
Left portion of the 16F FOOD COURT corridor. Warm muted cream tile, olive-gray mullions and subtle walnut trim. In canvas x=64..1124 show the canteen's continuous smoked-glass frontage spanning y=118..560, very dim vacant tiled dining interior visible as silhouettes and distant windows only, a pair of unlit blank rectangular menu lightboxes high on the glass at y=150..225. NO furniture. At x=1124..1724 transition to convenience-store glazed frontage, five horizontal shelves of tiny unreadable product-color silhouettes behind glass and an unlit purple-and-muted-lime fascia at y=125..175. This entire storefront is continuous solid glass, no doorway gaps (game will overlay doors at x=494..694 and x=1560..1710). Rest cream ceramic corridor wall. End at x=1770..1800 with a plain full-height cream tiled structural pier; rightmost 15px are uniform cream-gray. Faint ambient blue night reflections only. Floor foundation dark #16191a throughout.
```

원본 파일명: `exec-5b590a24-3493-43a8-a955-f4719ec0aa44.png`.

### amenity-corridor-core.png

```text
Middle portion of the same 16F FOOD COURT corridor. A quiet empty elevator lobby wall made of muted cream ceramic tile panels with olive-gray base trim and a walnut ceiling accent rail. Continuous SOLID PLAIN WALL, no elevators, no doors, no openings, no recesses: game overlays three elevators at local x=18..236,348..562,644..860 and a stair door at local x=1106..1286, all from y=220 to570, so keep all those rectangles plain tiled wall with no other features. Some small unlit ceiling downlights and narrow top ventilation grilles, architectural panel seams only, blank upper area for game floor sign. At local x=1340..1690 one broad smoked-glass transom high on wall y=130..270, faint city darkness behind. Match warm cream-gray structural piers at both edges, uniform rightmost and leftmost 15px. The scene must feel like an upscale Korean office tower food court after closing. Floor foundation dark #16191a throughout.
```

원본 파일명: `exec-1723f798-72fd-4e4a-8624-66323c66a1fb.png`.

### amenity-corridor-right.png

```text
Right portion of the same 16F FOOD COURT corridor. x=0..726 is restroom frontage of muted cream ceramic tile and olive-gray stone, plain solid wall from y=190 to570 because a separate metal door overlays x=56..201; a narrow high horizontal dark frosted transom window at x=270..670 y=145..245. x=766..1326 is a tasteful cafe frontage made of dark walnut vertical wood slats with a large smoked-glass display window at x=940..1280 y=165..390, dim empty cafe visible, unlit pendant silhouettes behind glass, NO furniture. Keep x=780..920 plain wood for separate game door overlay. No actual doors anywhere. End in a cream-tiled pillar, warm cream-gray left edge matches neighboring corridor. Floor foundation dark #16191a throughout.
```

원본 파일명: `exec-bf52bcb0-e77a-451f-a16a-d8d4afcae5ed.png`.

### amenity-kitchen-dining.png

```text
LEFT HALF of a Korean company cafeteria interior. Muted cream ceramic tiled walls with olive-gray dado and a high walnut trim rail. Three broad windows on the back wall between x=180 and1400, y=130..365 show a distant Seoul-like nighttime office skyline in cool blue, sparse tiny warm distant window lights. Some dark slim mullions, a small wall-mounted ventilation grille. Absolutely no furniture, counters or floor objects. At x=1650..1800 plain cream tiled solid wall for a separate exit-door overlay; no drawn door. Both outer 20px edges plain cream-gray tiled structural pier, match neighboring kitchen half. Floor foundation dark #16191a throughout.
```

원본 파일명: `exec-5fa562cd-8361-4642-8e06-ad4be74efec6.png`.

### amenity-kitchen-service.png

```text
RIGHT HALF of the same Korean company cafeteria interior, transitioning into an industrial serving kitchen. Muted cream and desaturated sage ceramic tiled wall, upper stainless-steel wall-mounted exhaust canopy at x=450..1050 y=160..245, horizontal duct near ceiling, two shallow stainless wall shelves at x=470..1050 y=280 and340 with a few pale dishes neatly stacked ON SHELVES ONLY. Lower wall completely bare for independently placed serving-counter sprites. Leftmost x=0..130 and rightmost x=1640..1802 are plain cream tiled solid wall for separately drawn doorway overlays, absolutely no drawn doors. Both outer20px edges cream-gray tiled structural pier matching other cafeteria half. Floor foundation dark #16191a throughout.
```

원본 파일명: `exec-d26f7537-86cb-46ef-98c1-0111a2e991b6.png`.

### amenity-cu-interior.png

```text
Korean convenience store interior on an office tower amenity floor. Subdued cool gray walls with muted purple and lime-green fascia accents. Across the back wall from x=240..1380 are built-in shallow retail shelving units, shelves at y=170,230,290,350 showing small unbranded colorful snacks, instant noodle cups, and pantry packages with NO writing. The shelf units are wall-mounted with a blank bare lower wall from y=395..570 for separate refrigerator and checkout sprites. Left edge x=0..200 and right edge x=1550..1800 plain solid neutral gray wall for separate door overlays. Ceiling fluorescent fixtures are dark. No floor-standing shelves, no counters or refrigerators or doors drawn in this image. Opaque night atmosphere, products softly readable not brightly lit. Floor foundation dark #16191a throughout.
```

원본 파일명: `exec-c377b469-740b-42d3-8b5e-b6ee1e4e530c.png`.

### amenity-cafe-interior.png

```text
Quiet Korean company cafe interior after closing. Muted walnut slat wainscot below y=390, warm gray plaster walls, a panoramic blue-black city-view window at x=260..950 y=125..345 with dark mullions and faint distant amber city lights. At x=1050..1460 two thin wood wall shelves at y=240 and300 displaying a few unbranded coffee bags and plain ceramic cups. A cluster of three switched-OFF pendant lamp shades at x=1100..1400 hanging down to y=165. Leftmost x=0..240 is plain plaster wall for an exit door overlay, no drawn door. Lower wall from y=400..570 entirely empty to receive separate cafe-furniture sprites. No cafe counter, no espresso machine, no tables, no chairs, no furniture in image. Restrained cozy but uneasy deserted atmosphere. Floor foundation dark #16191a throughout.
```

원본 파일명: `exec-3f1e136a-4a51-4405-b626-2b2247c7c23a.png`.

