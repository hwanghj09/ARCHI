# Floor prop kit

- Generator: built-in image_gen; style reference: ../../background/floor17/office-interior.png.
- 28 completed isolated props. The six food-court sprites are placed on 16F; see [FOOD-PROMPTS.md](FOOD-PROMPTS.md) for their prompts, dimensions, and placement.
- Production PNG files in this directory use a 256px tile grid: 256x256, 512x256 or 256x512.
- Unmodified high-resolution generated originals are in source/. They are NOT the production sprites.
- Export: trim to alpha > 8 bounds, preserve aspect ratio, nearest-neighbor scale, horizontal center, 8px bottom padding. Alpha is preserved.
- Anchor uses top-left image coordinates: (width / 2, height - 8). For floor placement at world (x,y), place image top-left at (x - anchor.x * scale, y - anchor.y * scale).
- The electrical panel is wall-mounted; its anchor is a convenient lower-center alignment point rather than floor contact.
- manifest.json records exact canvas sizes and anchors. suggestedWorldWidth is an initial placement suggestion, not a required display size.
- Re-export and check sizes/padding/alpha/baselines: powershell -NoProfile -File scripts/prepare-floor-kit.ps1 (from project root).

## Files

| Asset | File | Canvas | Anchor |
| --- | --- | --- | --- |
| 개발팀 책상 | [office-desk.png](office-desk.png) | 512x256 | 256, 248 |
| 복합기 | [office-copier.png](office-copier.png) | 256x256 | 128, 248 |
| 문서 캐비닛 | [filing-cabinet.png](filing-cabinet.png) | 256x512 | 128, 504 |
| 이동식 화이트보드 | [rolling-whiteboard.png](rolling-whiteboard.png) | 512x256 | 256, 248 |
| 로비 안내 데스크 | [reception-counter.png](reception-counter.png) | 512x256 | 256, 248 |
| 대기실 소파 | [waiting-sofa.png](waiting-sofa.png) | 512x256 | 256, 248 |
| 회의 테이블 | [meeting-table.png](meeting-table.png) | 512x256 | 256, 248 |
| 로비 화분 | [large-planter.png](large-planter.png) | 256x512 | 128, 504 |
| 전자장비 시험대 | [electronics-bench.png](electronics-bench.png) | 512x256 | 256, 248 |
| 로봇 충전 도크 | [robot-charging-dock.png](robot-charging-dock.png) | 256x256 | 128, 248 |
| 계측장비 카트 | [instrument-cart.png](instrument-cart.png) | 256x256 | 128, 248 |
| 시험장비 보관장 | [glass-display-cabinet.png](glass-display-cabinet.png) | 256x512 | 128, 504 |
| 메인 서버 랙 | [server-rack.png](server-rack.png) | 256x512 | 128, 504 |
| 네트워크 패치 랙 | [network-rack.png](network-rack.png) | 256x512 | 128, 504 |
| 비상 UPS 전원장치 | [ups-cabinet.png](ups-cabinet.png) | 256x256 | 128, 248 |
| 서버실 냉각장치 | [server-cooling-unit.png](server-cooling-unit.png) | 256x512 | 128, 504 |
| 정비 공구함 | [maintenance-tool-cabinet.png](maintenance-tool-cabinet.png) | 512x256 | 256, 248 |
| 배전반 | [electrical-panel.png](electrical-panel.png) | 256x512 | 128, 504 |
| 직원용 사물함 | [staff-lockers.png](staff-lockers.png) | 256x512 | 128, 504 |
| 음료 자판기 | [drink-vending-machine.png](drink-vending-machine.png) | 256x512 | 128, 504 |

| 탕비실 싱크대 | [kitchenette-counter.png](kitchenette-counter.png) | 512x256 | 256, 248 |
| 냉온수기 | [water-cooler.png](water-cooler.png) | 256x512 | 128, 504 |

## Shared generation prompt

Use case: stylized-concept. Asset type: ONE independently placeable environment prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Input image is ONLY an art-style and material reference; do not reproduce its room. Match restrained finely detailed pixel-art clusters, realistic office proportions, crisp stepped outlines, subtle wear, readable neutral highlights. Camera: straight-on front elevation consistent with a side-view game, minimal top surface visible, NOT isometric, NOT a rotated 3/4 object. ONE complete object centered with ample transparent margin all around, whole silhouette visible, bottom contact points level, intended pivot at bottom center. True transparent alpha in ALL empty space including under/through legs and cutouts. No ground plane, room, wall backdrop, floor, display plinth, cast shadow outside silhouette, opaque background, gray/checkerboard backdrop, people, text, letters, digits, labels, logos, captions, border or watermark. No programming code. Do not make a sheet, collage, multiple views or multiple states. Output one clean reusable isolated game prop, softly lit enough to remain readable when placed in a dark level. Extra strict cutout requirement: no ambient glow, no vignette, no shadow halo outside the object. Empty space must be fully transparent, not partially transparent fog.

The extra strict cutout sentence was added after the first two images. Source output resolution is controlled by the generator; production dimensions are verified by the export script.

## Individual prompts

### office-desk.png

A broad practical office desk with a pale gray laminate top, charcoal metal frame, three-drawer pedestal at the left, open knee space, one small dark monitor and keyboard on top, a compact blue binder stack at the far right. Monitor is OFF. No chair. Wide silhouette. Landscape canvas.

### office-copier.png

A standalone bulky multifunction office photocopier, off-white upper housing, graphite lower paper drawers, flatbed scanner lid and document feeder on top, small dim blue control panel, protruding dark paper output tray. Clearly a copier, not a computer. Square canvas.

### filing-cabinet.png

A tall closed steel filing cabinet, muted olive-gray, four full-width file drawers with recessed black handles and empty label slots, small mechanical keyhole, modest scuffs. Distinct four-drawer vertical silhouette. Portrait canvas.

### rolling-whiteboard.png

A wide completely BLANK slightly cool-white dry erase board in a thin brushed aluminum frame, on two charcoal uprights and wheeled feet, narrow empty marker tray, straight-on. Absolutely no writing, doodles, charts or magnets. Landscape canvas.

### reception-counter.png

A long modern reception counter with a stepped white solid-surface countertop and charcoal front panel interrupted by vertical muted teal accent slats. Small low monitor barely visible behind top. Full front elevation, asymmetric higher counter on left, accessible lower return on right. No sign or branding, no chair. Landscape canvas.

### waiting-sofa.png

A three-seat office lobby sofa upholstered in muted burgundy red fabric, broad squared armrests, three separated seat cushions, low dark metal legs, subtle fabric texture and slight lived-in wear. No pillows, no side table. Landscape canvas.

### meeting-table.png

A long empty conference table, cool ash-gray oval rectangular tabletop with softly rounded ends, TWO sturdy black pedestal supports, small closed cable port centered in the top. Minimal top visibility, no chairs, no equipment. One clean broad silhouette. Landscape canvas.

### large-planter.png

One tall indoor broad-leaf office plant in a heavy pale gray cylindrical planter. Rich varied natural green leaves on several brown-green stems, upward silhouette, leaves distinct and crisp, small stones visible in pot, not a palm. No other props. Portrait canvas.

### electronics-bench.png

A wide electronics testing workbench with brushed steel top and dark teal legs, lower open storage shelf. On top: one small oscilloscope displaying a simple green waveform, a compact bench power supply with unlettered display, a restrained coil of test cable. Small organized parts drawers on lower shelf. No chair. Landscape canvas.

### robot-charging-dock.png

An EMPTY autonomous security robot charging dock, no robot. Waist-high dark gray rectangular wall-style freestanding charging pedestal with a curved low floor docking tongue, two recessed silver charging contacts, a small cool blue status light, restrained amber corner bumpers. Compact industrial practical form, clearly an empty docking station. Square canvas.

### instrument-cart.png

A mobile two-tier metal equipment trolley on four caster wheels, brushed gray frame, top shelf with a compact cream-colored diagnostic instrument showing two small muted amber meters and dark knobs, lower shelf with neatly coiled black leads and one closed blue equipment case. Single unified cart. Square canvas.

### glass-display-cabinet.png

A tall laboratory equipment storage cabinet with brushed silver frame and two CLOSED smoky glass doors, three visible shelves holding a few unbranded black electronics modules and folded antistatic bags. Glass doors reveal interior but cabinet back panel is opaque. Slim black handles and short feet. Portrait canvas.

### server-rack.png

A tall closed-front black server rack with multiple densely stacked horizontal rackmount server units, ventilation slits, subtle silver handles, a varied few tiny green and amber status LEDs. No transparent front door, exposed unit fronts. Full height rack on a short dark plinth. No cables extending off silhouette. Portrait canvas.

### network-rack.png

An open-frame network distribution rack, visibly different from a server cabinet: exposed dark steel four-post frame, several silver network patch panels, carefully bundled BLUE and YELLOW short patch cables linking panels, open lower space with cable spool. Cable bundles contained within rack. Very sparse tiny green port LEDs. Portrait canvas.

### ups-cabinet.png

A heavy industrial uninterruptible power supply cabinet, waist-to-chest high graphite housing, small unlettered amber display at upper front, large broad louvered lower intake, one recessed maintenance handle and two small green indicators. Squat wide rectangular silhouette, robust flat base. No electrical hazard text or symbols. Square canvas.

### server-cooling-unit.png

A tall narrow precision cooling cabinet for a server room, pale gray industrial housing, large dark vertical louvered outlet on upper front, two stacked circular fan grilles behind mesh in lower half, tiny muted cyan status strip. No text. Distinct pale tower silhouette. Portrait canvas.

### maintenance-tool-cabinet.png

A rolling maintenance tool chest, muted industrial RED powder-coated metal with six shallow drawers, stainless steel top, black recessed drawer pulls and four chunky caster wheels. Closed drawers, slightly scuffed corners, one small side handle, no loose tools above. Wide waist-height silhouette. Landscape canvas.

### electrical-panel.png

One standalone wall-mounted electrical distribution panel shown isolated without wall: a rectangular dull galvanized steel frame, outer access door swung modestly to right revealing ordered rows of small black breakers, three colored status lamps across the top, wiring confined neatly inside. No labels, numbers, text, symbols or sparking. Portrait canvas.

### staff-lockers.png

A connected bank of THREE tall narrow staff lockers, desaturated teal painted metal, each with upper and lower ventilation slots and a slim recessed handle with keyhole. All doors closed, subtle different wear patterns, one shared low plinth. Empty label holders, no writing or stickers. Square canvas.

### drink-vending-machine.png

One tall office drinks vending machine, pale blue-gray casing with a dark framed glass display containing orderly rows of small colorful unbranded drink cans, a slim selection-button column on the right, black payment slot and lower collection hatch. Drinks use solid red, green, cream and blue colors without text. Tiny soft display lights. Portrait canvas.

### kitchenette-counter.png

One wide office kitchenette cabinet: muted sage-green lower doors, brushed stainless countertop with sink and curved faucet, compact white microwave on right and a small kettle on left. Blank microwave display. Low wide silhouette, no upper cabinets or backsplash. All appliances rest on the counter and belong to this single prop.

### water-cooler.png

One tall freestanding office water cooler, rounded translucent pale blue refill bottle above an ivory body, two small red and blue taps, charcoal drip tray and lower vent. Slight wear, modest industrial realism.

## Pending additional props

The following 14 prompts are NOT generated assets and are not in manifest.json. Built-in image generation hit its usage limit after kitchenette-counter and water-cooler on 2026-09-23. Resume with the shared prompt plus each subject below; save originals in source/, then add completed entries to manifest.json and re-export. Do not add placeholder files or game placement.

### coffee-station.png (커피 스테이션)

- Planned canvas: 256x256; anchor: 128, 248; suggested world width: 140.

One compact office coffee station: small cherry-red espresso machine with dark face and chrome nozzles sitting on its own low charcoal storage cabinet, with two plain white cups on its tray. Square overall silhouette, no lettering or brand marks.

### breakroom-table.png (휴게실 원형 테이블)

- Planned canvas: 256x256; anchor: 128, 248; suggested world width: 145.

One round break-room pedestal table viewed straight-on, circular desaturated mustard-yellow tabletop seen as a shallow ellipse, black central pedestal and broad low steel foot. No chairs, no objects on table.

### task-chair.png (사무용 의자)

- Planned canvas: 256x256; anchor: 128, 248; suggested world width: 85.

One ergonomic office swivel task chair facing viewer, charcoal mesh backrest, subdued burgundy fabric seat, two black armrests, adjustable gas cylinder and five-star caster base. Whole chair with wheels level, realistic front elevation.

### projector-cart.png (프로젝터 이동대)

- Planned canvas: 256x256; anchor: 128, 248; suggested world width: 130.

One compact wheeled projector cart, off-white projector on top facing viewer with a large dark glass lens on the left, two dark gray metal shelves holding a neatly coiled cable and a closed slim remote case, four small casters. No projected light beam.

### coat-rack.png (스탠드 옷걸이)

- Planned canvas: 256x512; anchor: 128, 504; suggested world width: 100.

One freestanding brushed steel coat rack, tall narrow central pole with several curved hooks, one dark teal jacket neatly hanging from a left hook and a muted gray scarf on right, heavy circular base. No people or hats.

### acoustic-divider.png (이동식 파티션)

- Planned canvas: 512x256; anchor: 256, 248; suggested world width: 240.

One wide office acoustic privacy divider: muted petrol-green fabric rectangular panel with thin aluminum frame, two short T-shaped steel feet. Freestanding, wider than tall, clean unadorned fabric texture, no labels or attached papers.

### security-console.png (보안 관제 콘솔)

- Planned canvas: 512x256; anchor: 256, 248; suggested world width: 310.

One integrated wide security-room control console: low charcoal metal desk with two built-in tilted monitor screens showing tiny abstract grayscale surveillance-room silhouettes, no text or numbers, a compact joystick and amber/red status buttons, closed cabinet base. Single coherent console.

### security-turnstile.png (보안 출입 게이트)

- Planned canvas: 256x256; anchor: 128, 248; suggested world width: 145.

One waist-high tripod security turnstile, brushed stainless steel rectangular body, three tubular rotating barrier arms visible from straight front, small dark card reader with single green status pixel on top. No logos or lettering.

### fire-hose-cabinet.png (소화전 보관함)

- Planned canvas: 256x512; anchor: 128, 504; suggested world width: 115.

One tall wall-mount fire-hose cabinet as an isolated object with no wall: dark red powder-coated steel enclosure, upper glazed door revealing neatly wound cream hose reel and brass valve, lower solid door with small silver handle. Absolutely no text, labels, icons or numbers.

### fire-extinguisher.png (소화기 거치대)

- Planned canvas: 256x256; anchor: 128, 248; suggested world width: 48.

One red fire extinguisher held in a low black metal floor cradle. Cylindrical red body with blank small off-white label patch, black rubber hose, brass valve and simple pressure gauge, squeeze handle. No readable writing, no placard or background.

### cleaning-cart.png (청소용 카트)

- Planned canvas: 256x256; anchor: 128, 248; suggested world width: 135.

One office janitorial cart with muted blue plastic body, yellow mop bucket and wringer, short shelves holding two plain cleaning bottles, a tied charcoal refuse bag on right, upright mop handle secured to cart, four caster wheels. Compact clear silhouette, no brand marks.

### parts-shelf.png (부품 보관 선반)

- Planned canvas: 256x512; anchor: 128, 504; suggested world width: 175.

One tall freestanding gray industrial open shelving unit with four shelves of neatly organized small teal and muted red plastic parts bins, cable coils and folded cloths. No cardboard boxes. Subtle wear, contents clear at pixel scale, blank bins without labels.

### hand-trolley.png (운반용 핸드카트)

- Planned canvas: 256x512; anchor: 128, 504; suggested world width: 95.

One empty upright two-wheel hand trolley facing viewer, muted yellow steel tubular frame, curved black handgrips, two chunky dark rubber wheels and a low folded-out steel toe plate. No cargo, no cardboard boxes, no ground shadow.

### portable-worklight.png (이동식 작업등)

- Planned canvas: 256x512; anchor: 128, 504; suggested world width: 105.

One industrial portable LED worklight on a telescoping black tripod, rectangular muted yellow lamp housing with pale off-white unlit LED panel, steel side brackets and a neatly coiled black power cable secured low on the stand. No glow, beam, halo or cast shadow.
