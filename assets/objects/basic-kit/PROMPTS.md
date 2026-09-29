# ARCHI 기본 오브젝트 확장팩

- 제작: 2026-09-29, 내장 `image_gen`.
- 22종 소품, 그중 컴퓨터 4종은 OFF/ON 2상태. 화장실 배경 3종은 `../../background/restroom-variants/`.
- 기존 에셋 교체 및 게임 배치·상호작용 연결 없음. 새 아트 리소스만 추가.
- `source/`는 생성 원본. 루트 PNG는 게임용 출력. 컴퓨터는 시트와 개별 `-off` / `-on` PNG 모두 제공.
- 투명 영역을 보존하며 alpha > 8 경계로 자른 뒤 nearest-neighbor로 축소. 셀 바닥에 8px 여백.
- 앵커는 각 셀의 `(셀 너비 / 2, 셀 높이 - 8)`. 벽걸이 설비에는 바닥 대신 원하는 설치 높이를 적용.
- 배치식: `left = worldX - anchorX * scale`, `top = worldY - anchorY * scale`.
- 컴퓨터 프레임은 공통 축척과 하단 중앙을 맞춤. 생성된 세부 하드웨어 픽셀은 상태 간 약간 다를 수 있음.
- 문은 닫힘 정지 이미지. 열림 애니메이션은 포함하지 않음.
- 재출력: Pillow 설치 후 `python scripts/prepare-basic-kit.py`.
- `preview.html`을 열어 밝은/어두운 배경에서 확인 가능.

| 종류 | 파일 | 출력 크기 | 프레임 |
|---|---|---|---|
| 일반 양변기 | [restroom-toilet-standard.png](restroom-toilet-standard.png) | 256×256 | 1 |
| 장애인 화장실 양변기 | [restroom-toilet-accessible.png](restroom-toilet-accessible.png) | 256×256 | 1 |
| 2인 세면대 | [restroom-vanity-double.png](restroom-vanity-double.png) | 512×256 | 1 |
| 남자 화장실 문 | [door-restroom-men.png](door-restroom-men.png) | 256×512 | 1 |
| 여자 화장실 문 | [door-restroom-women.png](door-restroom-women.png) | 256×512 | 1 |
| 장애인 화장실 미닫이문 | [door-restroom-accessible.png](door-restroom-accessible.png) | 256×512 | 1 |
| 목재 사무실 문 | [door-office-wood.png](door-office-wood.png) | 256×512 | 1 |
| 비상계단 방화문 | [door-fire-exit.png](door-fire-exit.png) | 256×512 | 1 |
| 몬스테라 화분 | [plant-monstera.png](plant-monstera.png) | 256×256 | 1 |
| 산세베리아 화분 | [plant-snake.png](plant-snake.png) | 256×512 | 1 |
| 야자 화분 | [plant-palm.png](plant-palm.png) | 256×512 | 1 |
| 시든 화분 | [plant-withered.png](plant-withered.png) | 256×256 | 1 |
| 구형 CRT 컴퓨터 | [computer-crt.png](computer-crt.png) | 512×256 | 2 |
| 일체형 컴퓨터 | [computer-all-in-one.png](computer-all-in-one.png) | 512×256 | 2 |
| 산업용 노트북 | [computer-rugged-laptop.png](computer-rugged-laptop.png) | 512×256 | 2 |
| 울트라와이드 워크스테이션 | [computer-ultrawide.png](computer-ultrawide.png) | 512×256 | 2 |
| 청소 카트 | [cleaning-cart.png](cleaning-cart.png) | 256×256 | 1 |
| 소변기 | [restroom-urinal.png](restroom-urinal.png) | 256×256 | 1 |
| 사무용 의자 | [task-chair.png](task-chair.png) | 256×256 | 1 |
| 소화기 | [fire-extinguisher.png](fire-extinguisher.png) | 256×256 | 1 |
| 분리수거함 | [recycling-bin.png](recycling-bin.png) | 256×256 | 1 |
| 이동식 파티션 | [acoustic-divider.png](acoustic-divider.png) | 512×256 | 1 |

## 생성 프롬프트

화분과 소품의 화풍 참조: `../floor-kit/large-planter.png`. 컴퓨터의 화풍 참조: `../office/pc-off-on.png`. 모든 참조는 화풍용이며 원본 교체 대상이 아님.

### restroom-toilet-standard

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested. One clean ivory ceramic floor-standing toilet viewed directly from front, rectangular rear cistern with chrome flush button, lid raised and seat down, bowl pedestal, restrained cool ceramic shading.
```

### restroom-toilet-accessible

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested. One accessible modern wall-hung white toilet with closed lid, rectangular exposed rear service panel and two symmetrical fold-down stainless grab rails attached to that panel. One coherent isolated fixture, straight front elevation.
```

### restroom-vanity-double

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested. One wide restroom double-basin vanity, two white inset sinks and chrome faucets in dark stone countertop, closed slate-blue two-door cabinet below, two simple rectangular mirrors mounted on a narrow shared backing panel above. Entire unified prop visible, straight front elevation.
```

### door-restroom-men

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested. ONE closed tall restroom door with entire rectangular aluminum frame and threshold, desaturated navy-blue solid panel, small ivory plaque with only a simple male pictogram, silver lever handle at right and bottom ventilation grille. No surrounding wall. Transparent outside frame; opaque inside doorway.
```

### door-restroom-women

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.ONE closed tall restroom door with entire rectangular aluminum frame and threshold, muted dusty plum solid panel, small ivory plaque with only a simple female pictogram, silver lever handle at right and bottom ventilation grille. No surrounding wall. Transparent outside frame; opaque inside doorway.
```

### door-restroom-accessible

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.ONE closed wide accessible restroom sliding door, sage-gray solid panel, brushed metal frame with a narrow overhead sliding rail, long vertical pull handle, small ivory plaque with a simple wheelchair pictogram only. Entire self-contained frame. Transparent outside; opaque interior.
```

### door-office-wood

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.ONE closed tall office door, dark walnut timber with a narrow vertically frosted glass slit, charcoal rectangular frame, silver lever handle and small plain metal blank nameplate. Full frame and threshold visible. Transparent exterior, opaque dark frosted glass.
```

### door-fire-exit

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.ONE closed tall industrial fire-exit door, weathered desaturated moss-green steel, charcoal rectangular frame, horizontal steel panic push bar, small narrow wired-glass upper window, lower kick plate, visible hydraulic closer at top. No signs or text. Transparent outside frame, opaque interior.
```

### plant-monstera

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.One lush compact monstera with distinctive split and perforated deep-green leaves, in a squat terracotta ceramic pot on a small matching saucer. Several asymmetric leaves, pot and all leaves visible, front elevation.
```

### plant-snake

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.One tall narrow snake plant with upright sword-shaped dark green striped leaves and muted yellow edges, in a charcoal faceted cylindrical pot. Distinct thin vertical silhouette, no broad leaves.
```

### plant-palm

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.One indoor areca palm, several arching feathery fronds made of many narrow leaflets, thin trunks, tall cream square planter. Broad airy canopy with transparent gaps among leaves, realistic office palm.
```

### plant-withered

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.One neglected withered office houseplant with drooping ochre and dull olive leaves on sparse brown stems, dry dark soil in a subtly cracked muted blue ceramic pot and attached saucer. No leaves floating outside object, no gore, readable sad silhouette.
```

### computer-crt

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.TWO STATE SHEET, 2 equal square cells side by side. ONE identical vintage beige desktop PC per cell: bulky curved-glass CRT on horizontal desktop computer chassis, ivory keyboard and wired mouse. LEFT OFF black screen all indicators dark. RIGHT ON pleasant blue desktop with small folder icons and a simple calendar window represented by squares, no readable text. Identical hardware geometry, scale and bottom baseline between cells. Layout ratio 2:1, exactly 2 equal square cells, no gutters, each computer completely inside its own cell with generous padding.
```

### computer-all-in-one

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.TWO STATE SHEET, 2 equal square cells side by side. ONE identical silver all-in-one computer per cell: slim wide display, thick lower silver bezel, curved aluminum single stand, compact white keyboard and mouse, NO tower. LEFT OFF black glass all indicators dark. RIGHT ON soft green landscape wallpaper with a few tiny abstract folder icons, no text. Precisely same hardware, scale, position and bottom baseline. Layout ratio 2:1, exactly 2 equal square cells, no gutters, each computer completely inside its own cell with generous padding.
```

### computer-rugged-laptop

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.TWO STATE SHEET, 2 equal square cells side by side. ONE identical open rugged industrial laptop per cell, dark gray reinforced shell, rubber corner bumpers, carrying handle folded along front edge, compact black keyboard. LEFT OFF black screen. RIGHT ON simple building maintenance dashboard with four colored gauges and a diagram, no code or text. Exact same open angle, hardware, position, scale and baseline in both cells. Layout ratio 2:1, exactly 2 equal square cells, no gutters, each computer completely inside its own cell with generous padding.
```

### computer-ultrawide

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.TWO STATE SHEET, 2 equal square cells side by side. ONE identical charcoal ultrawide office workstation per cell: one broad flat 21:9 monitor on two-leg V stand, compact tower to right, keyboard and mouse below. LEFT OFF black screen all indicators off. RIGHT ON abstract spreadsheet grid and bar chart side-by-side on a pale gray desktop, no readable text, no code. Precisely identical hardware, placement, scale and bottom baseline. Layout ratio 2:1, exactly 2 equal square cells, no gutters, each computer completely inside its own cell with generous padding.
```

### cleaning-cart

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.One compact office janitorial cart: muted blue plastic trolley frame, yellow mop bucket and wringer, short shelves with two unbranded bottles, tied charcoal refuse bag at right, upright mop secured to frame, four level casters. Single complete unified prop.
```

### restroom-urinal

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.One white ceramic wall-mounted urinal isolated without wall, elongated bowl with subtle blue-gray inner shadows, small chrome top flush pipe and sensor unit. Complete fixture straight-on, no backing wall, clean realistic form.
```

### task-chair

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.One ergonomic office swivel task chair front-on, charcoal mesh backrest, muted burgundy seat, two black armrests, gas cylinder and five-star caster base, entire chair and wheels level.
```

### fire-extinguisher

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.One red fire extinguisher in a low black floor cradle, blank off-white label patch, black hose, brass valve and small round pressure gauge, squeeze handle. No readable marks.
```

### recycling-bin

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.One connected office waste sorting bin with three narrow brushed steel compartments and muted blue, olive-green and charcoal lids, circular openings, no labels or text. Clearly a low practical three-section bin.
```

### acoustic-divider

```text
Use case: stylized-concept. Asset type: a reusable production PNG sprite for ARCHI, a Korean 2D side-scrolling office mystery game. Match attached references ONLY for art style: finely detailed anime-inspired PIXEL ART with crisp stepped contours and hard pixel clusters, realistic proportions, muted cool gray, restrained midnight office atmosphere, readable neutral highlights. Straight-on FRONT ELEVATION for a side-view game, minimal top surfaces visible, no isometric or 3/4 rotation. Complete silhouette, no clipping, ample padding. True transparent alpha in every empty region. No background, room, floor plane, cast shadow, halo, checkerboard, caption, frame border, watermark, logo or people. No readable text or code. One object only unless a two-state sheet is explicitly requested.  CRITICAL: absolutely no glow, ambient aura, vignette, cast shadows or partially transparent gray fog around the object. Exterior pixels must be fully transparent right up to crisp object edge.One wide office acoustic privacy divider, muted petrol-green fabric rectangular panel in thin aluminum frame with two short steel T feet. Freestanding, wider than tall, realistic woven texture, no papers.
```

