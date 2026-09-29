# ARCHI 소품 확장팩 02

- 제작: 2026-09-30, 내장 `image_gen`.
- 신규 소품 20종. 모든 소품은 투명 RGBA PNG의 정지 상태 1프레임.
- 원본은 `source/`, 게임용 출력은 이 폴더의 PNG. 기존 에셋과 게임 로직은 변경하지 않음.
- 화풍 참조: `../basic-kit/cleaning-cart.png`.
- 알파 > 8 경계로 자르고 비율을 보존해 nearest-neighbor 축소. 하단 8px 여백.
- 기준점은 `(너비 / 2, 높이 - 8)`. 좌상단 배치: `(worldX - anchorX * scale, worldY - anchorY * scale)`.
- `placement`: floor=바닥, wall=벽 설치 높이, surface=책상/선반 위. 권장 폭은 초기 배치용 참고값.
- 이미지 생성 및 파일 검증 완료. 게임 맵 배치·작동·충돌·상호작용 연결은 포함하지 않음.
- 재출력: Pillow 설치 후 `python scripts/prepare-expansion-kit-02.py`.
- 파일 전체 보기: [preview.html](preview.html). 배경 밝기 전환으로 투명 가장자리 확인 가능.
- 생성 이미지에는 세부 표현 차이가 있음: 사다리는 3개 중간 발판과 상단 플랫폼, 벽시계는 그림에 고정된 시각, 장비 표시등도 그림에 고정됨.

| 소품 | 파일 | 출력 크기 | 배치 |
|---|---|---|---|
| 간식 자판기 | [snack-vending-machine.png](snack-vending-machine.png) | 256×512 | floor |
| 전자동 커피머신 | [coffee-machine.png](coffee-machine.png) | 256×256 | surface |
| 전자레인지 이동대 | [microwave-cart.png](microwave-cart.png) | 256×256 | floor |
| 벽걸이 음수대 | [water-fountain.png](water-fountain.png) | 256×256 | wall |
| 보안 출입 게이트 | [security-turnstile.png](security-turnstile.png) | 256×256 | floor |
| 구급함 | [first-aid-cabinet.png](first-aid-cabinet.png) | 256×256 | wall |
| 소화전 보관함 | [fire-hose-cabinet.png](fire-hose-cabinet.png) | 256×512 | wall |
| 비상 조명등 | [emergency-light.png](emergency-light.png) | 512×256 | wall |
| 사무실 전화기 | [desk-telephone.png](desk-telephone.png) | 256×256 | surface |
| 문서 세단기 | [paper-shredder.png](paper-shredder.png) | 256×256 | floor |
| 프로젝터 이동대 | [projector-cart.png](projector-cart.png) | 256×256 | floor |
| 사무실 벽시계 | [wall-clock.png](wall-clock.png) | 256×256 | wall |
| 접이식 사다리 | [folding-ladder.png](folding-ladder.png) | 256×512 | floor |
| 수동 파렛트 운반기 | [pallet-jack.png](pallet-jack.png) | 256×512 | floor |
| 공업용 선풍기 | [industrial-fan.png](industrial-fan.png) | 256×512 | floor |
| 공구 벽걸이판 | [tool-pegboard.png](tool-pegboard.png) | 512×256 | wall |
| 연구실 현미경 | [lab-microscope.png](lab-microscope.png) | 256×256 | surface |
| 의무실 침대 | [medical-bed.png](medical-bed.png) | 512×256 | floor |
| 화장실 핸드드라이어 | [hand-dryer.png](hand-dryer.png) | 256×256 | wall |
| 비누·종이타월 디스펜서 | [soap-towel-station.png](soap-towel-station.png) | 256×256 | wall |

## 간식 자판기

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One tall muted burgundy snack vending machine, glass front shows five rows of spiral dispensers holding varied cream, ochre, teal snack packets without labels. Narrow right payment panel, small dim display and a black lower collection hatch. Clearly snacks not drink cans.
```

## 전자동 커피머신

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One compact commercial bean-to-cup coffee machine, charcoal body, transparent top bean hopper with brown beans, twin chrome dispensing nozzles, single white ceramic cup resting on drip tray, small dark display, brushed steel lower face. No cabinet or table.
```

## 전자레인지 이동대

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One compact brushed steel two-tier kitchen trolley on four wheels, ivory microwave with dark glass door on upper shelf, two stacked plain trays and a kettle on lower shelf, no labels. Coherent mobile pantry unit, microwave display off.
```

## 벽걸이 음수대

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One wall-mounted brushed stainless drinking fountain with shallow rounded basin, small bubbler faucet at left and push button on front, compact sloped lower housing. No wall behind it, entirely isolated.
```

## 보안 출입 게이트

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One waist-high stainless steel tripod security turnstile, rectangular pedestal with small black card reader at top, three tubular barrier arms, tiny muted green indicator. Front elevation, complete coherent structure.
```

## 구급함

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One wall-mounted ivory metal first-aid cabinet with closed door, simple bold green cross symbol centered on door, small silver latch on right, modest worn corners. No writing or brand, no wall.
```

## 소화전 보관함

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One tall wall-mounted dark red steel fire-hose cabinet, upper glass panel revealing neatly wound cream hose and brass valve, lower closed metal door with small silver handle. Blank surfaces without text. No wall.
```

## 비상 조명등

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One compact wall-mounted emergency light unit: ivory central rectangular battery box with tiny dark status LED, two adjustable round white lamp heads on short arms pointing slightly outward symmetrically. Both lamps OFF, no light beam, no wall.
```

## 사무실 전화기

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One dark charcoal office landline desk telephone, handset resting in cradle, small unlit LCD, neat keypad of blank gray buttons, coiled cord contained beside base. Front view with slight visible keypad surface, no labels or digits.
```

## 문서 세단기

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One tall compact office paper shredder, light gray top with narrow paper slot, dark graphite body with a smoked inspection window revealing fine shredded paper strips, small caster wheels, small silver control buttons, no loose paper outside.
```

## 프로젝터 이동대

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One two-tier charcoal metal projector trolley on four casters. Off-white projector on top facing viewer with a large dark lens at left, slim remote and neatly coiled cable on lower shelf. No projection beam.
```

## 사무실 벽시계

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One round analog office wall clock, brushed steel rim, ivory face, twelve simple dark tick marks instead of numerals, black hour and minute hands indicate ten past ten, thin muted red second hand. Isolated with no wall or shadow.
```

## 접이식 사다리

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One open aluminum A-frame stepladder facing viewer, four horizontal treads, yellow top platform, two clearly separated front feet with black rubber caps and narrow rear supports, modest scuffs, entire ladder visible.
```

## 수동 파렛트 운반기

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One empty industrial manual pallet jack, faded mustard-yellow steel body, upright black loop handle, two long low parallel fork tines extending toward viewer only slightly foreshortened, small dark wheels. Flat readable game prop, no pallet or cargo.
```

## 공업용 선풍기

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One tall standing industrial fan, large circular charcoal wire cage with three broad metal blades, dull blue-gray motor housing, adjustable narrow pole and heavy cross-shaped floor base. Fan OFF, no motion blur.
```

## 공구 벽걸이판

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One wide dark teal perforated workshop pegboard in thin steel frame holding an orderly arrangement of two wrenches, pliers, three screwdrivers, hammer, and small shallow lower parts tray. Tools all fully inside board outline, no labels, isolated board with opaque backing.
```

## 연구실 현미경

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One laboratory binocular microscope, ivory and charcoal curved frame, two angled dark eyepieces, rotating objective turret, flat specimen stage with blank glass slide and dark knobs, heavy horseshoe-shaped base. Front elevation, single complete scientific instrument.
```

## 의무실 침대

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One simple office infirmary examination bed seen in flat long-side elevation: pale sage vinyl mattress, slightly raised small pillow section on left, folded ivory blanket at foot right, thin white tubular steel legs and low stretcher-style rail. Empty bed, no patient, no room.
```

## 화장실 핸드드라이어

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One wall-mounted automatic hand dryer, compact brushed silver rounded housing, recessed black lower air nozzle and tiny dark sensor, subtle vents, no logo, no wall. Front elevation, inactive.
```

## 비누·종이타월 디스펜서

```text
Use case: stylized-concept. Asset type: ONE reusable isolated prop PNG for ARCHI, a Korean 2D side-scrolling office mystery game. Attached image is ONLY a STYLE/material reference, do not copy its object. Finely detailed anime-inspired PIXEL ART, crisp hard pixel clusters and stepped outlines, realistic proportions, muted charcoal, cool gray, teal and modest warm accents, readable neutral ambient highlights. Straight-on FRONT ELEVATION consistent with a side-scrolling game, only minimal top surface visible, no isometric view or rotated 3/4 view. One complete centered object with generous padding and level bottom contact. Actual transparent alpha in all empty spaces and cutouts. No floor, room, wall, background, cast shadow, glow halo, fog, checkerboard, captions, borders, text, logos, watermarks or people. No collage or sprite sheet. No readable writing. Entire object visible including feet and attachments. One integrated wall-mounted hygiene dispenser unit, ivory rectangular housing with slim translucent muted blue soap reservoir on left and stainless paper towel compartment on right, a single folded ivory towel protrudes from lower slot. Single unified object, no text, no wall.
```
