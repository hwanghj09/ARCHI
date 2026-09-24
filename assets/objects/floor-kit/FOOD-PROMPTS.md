# 16층 편의시설 스프라이트

내장 `image_gen`으로 생성한 식당·CU 편의점·카페 소품 6종. 정전 상태에 맞춰 조명과 화면은 꺼져 있습니다. 기존 16층 방 구조와 조사 문구를 유지하고 해당 소품의 그림만 교체합니다.

| 파일 | 용도 | PNG 캔버스 | 불투명 높이 | 게임 폭 | 게임 높이 |
| --- | --- | --- | --- | --- | --- |
| [food-serving-counter.png](food-serving-counter.png) | 식당 배식대 | 512×256 | 196 | 326 | 124.8 |
| [food-dining-table.png](food-dining-table.png) | 식당 벤치 테이블 | 512×256 | 146 | 243 | 69.3 |
| [food-refrigerator.png](food-refrigerator.png) | 편의점 냉장 진열장 | 256×512 | 495 | 96 | 185.6 |
| [food-checkout.png](food-checkout.png) | 편의점 계산대 | 512×256 | 204 | 312 | 124.3 |
| [food-coffee-bar.png](food-coffee-bar.png) | 카페 커피 바 | 512×256 | 233 | 296 | 134.7 |
| [food-menu-board.png](food-menu-board.png) | 메뉴 입간판 | 256×512 | 411 | 70 | 112.4 |

## 배치 및 재출력

원본은 `source/food-*.png`, 게임용 파일은 이 폴더에 있습니다. `manifest.json`과 기존 `scripts/prepare-floor-kit.ps1`을 사용해 alpha > 8 경계를 추출하고 종횡비를 보존한 nearest-neighbor 축소를 합니다. 투명 알파를 보존하며 아래 여백은 8px입니다. 원본 픽셀 편집 없이 게임 규격으로 내보냈습니다.

`player.js`의 `FLOOR16_LAYOUT`·`FLOOR16_ROOMS`에서 기존 이미지 로더로 사용합니다. 앵커는 `(canvasWidth / 2, canvasHeight - 8)`입니다. `scale = worldWidth / canvasWidth`, `top = 570 - (canvasHeight - 8) * scale`로 바닥에 맞춥니다. 플레이어 162px = 175cm 기준으로 테이블 약 75cm, 배식대 약 135cm, 냉장 진열장 약 200cm, 계산대 약 134cm, 커피 바 약 145cm, 입간판 약 122cm입니다.

새 소품만 재출력:

```powershell
powershell -NoProfile -Command "& './scripts/prepare-floor-kit.ps1' -Files 'food-serving-counter.png','food-dining-table.png','food-refrigerator.png','food-checkout.png','food-coffee-bar.png','food-menu-board.png'"
```

## 생성 프롬프트

각 이미지는 아래 공통 프롬프트에 해당 개별 문장을 그대로 이어 붙여 별도로 생성했습니다. 참조 이미지 입력 없이 내장 image_gen을 사용했습니다.

```text
Use case: stylized-concept. Asset type: ONE independently placeable environment prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game, floor 16 food court at midnight during a power outage. Match the existing restrained detailed pixel art with hard crisp pixel clusters, cool gray outlines, muted desaturated materials, realistic adult-human furniture proportions (player is 162 world px tall). Strict straight-on orthographic FRONT elevation for a side-view game, minimal top visible, no isometric or rotated view. Whole object centered and fully visible with transparent margin. True TRANSPARENT ALPHA everywhere outside the object and in gaps beneath legs. No floor, backdrop, room, shadow halo, vignette, glow, text, letters, logo, watermark, labels, people, or extra disconnected objects. One standalone prop only; no sheet or collage. All powered equipment and lights OFF, legible neutral ambient highlights.
```

### food-serving-counter.png

```text
A wide commercial cafeteria stainless-steel serving counter with a clear glass sneeze guard, four recessed metal food trays with closed lids, stacked meal trays at one end, brushed-steel front cupboards and short legs. Practical Korean company canteen equipment. Wide landscape canvas. Proportions about 3 meters wide and 1.35 meters tall including the glass guard.
```

### food-dining-table.png

```text
One cafeteria dining-table unit: pale cream rectangular tabletop, dark olive powder-coated steel legs, integrated long narrow bench seats on both sides, visible clean silhouette in front elevation. Empty tabletop, no dishes or chairs or people. Wide landscape canvas. About 2.4 meters wide and 0.75 meters tall.
```

### food-refrigerator.png

```text
One tall convenience-store glass-door refrigerated showcase, single full-height closed glass door, silver metal frame, black ventilation grille at bottom, five shelves with small wrapped triangular rice snacks and unbranded milk cartons and bottled drinks. Tiny blank pale stock stickers, no writing. Interior light entirely OFF, products still readable through dark glass. Portrait canvas. About 1.1 meters wide and 2 meters tall.
```

### food-checkout.png

```text
One Korean convenience-store checkout counter with off-white top, charcoal front, a slim muted purple strip and small muted lime-green accent panel, black OFF point-of-sale monitor angled minimally, barcode scanner, receipt roll with one dangling blank receipt, a small row of unbranded gum packets on the countertop. No writing, no brands. Wide landscape canvas. About 2.8 meters wide and 1.35 meters tall including monitor.
```

### food-coffee-bar.png

```text
One cafe coffee bar, warm muted walnut vertically slatted front, pale stone worktop, a steel two-group espresso machine with all lights OFF, a compact coffee grinder, small stack of plain cream cups. No menu or signage or lettering, no people. Straight-on broad front elevation, wide landscape canvas. About 2.7 meters wide and 1.45 meters tall including machine.
```

### food-menu-board.png

```text
One floor-standing cafe menu A-board: slightly worn muted walnut rectangular frame and two feet, dark charcoal chalkboard face, three SMALL tasteful chalk food pictograms of a bowl, a cup, and a plate, a few short pale chalk strokes suggesting an unreadable menu. No actual text, letters or digits. Straight-on front elevation, portrait canvas. About 0.7 meters wide and 1.2 meters tall.
```

