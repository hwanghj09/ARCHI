# 층별 디자인 이미지 제작 · 2026-10-01

기준: `docs/floor-design/11F.md`, `13F.md`, `14F.md`, `15F.md`, `16F.md`의 6장.
도구: 내장 image_gen. 기존 ARCHI 소품 PNG는 화풍 참고로 사용했다.

## 범위와 상태

누락된 소품 10종과 11층 방화셔터 닫힘·열림 원본을 생성했다. 이미 존재한 원본 9종은 다시 그리지 않고 출력했다. 소품 출력본은 총 19장, 셔터 출력본은 2프레임 시트 1장이다. 기존 출입문·배경·원본 9종은 수정하지 않았다.

**이미지 제작·출력·manifest 등록 완료. 게임 렌더링·상호작용 연결은 아직 하지 않았다.** 층별 JS, CSS, 퍼즐, 좌표는 이 커밋에서 바꾸지 않는다. 연결 시 각 디자인 문서의 교체 위치를 적용하고 `tests/elevator.mjs`의 높이 표를 갱신해야 한다.

## 파일 목록

소품 경로는 이 폴더 기준이다. 새 원본은 `source/`에 보관했다. 원본 9종은 기존 GitHub 파일을 그대로 사용한다.

| 층 | 파일 | 원본 크기 | 출력 크기 | 출처 | 월드 표시 너비 | 예상 불투명 높이 |
|---|---|---|---|---|---:|---:|
| 11F | `sales-kpi-board.png` | 1821×864 | 512×256 | 기존 원본 | 350 | 163.38 |
| 11F | `sales-desk.png` | 1810×869 | 512×256 | 이번 생성 | 252 | 110.74 |
| 11F | `floor-emergency-cabinet.png` | 1734×907 | 512×256 | 기존 원본 | 198 | 92.81 |
| 11F | `trophy-cabinet.png` | 996×1579 | 256×512 | 기존 원본 | 111 | 215.06 |
| 11F | `boardroom-table.png` | 2172×724 | 512×256 | 이번 생성 | 356 | 70.23 |
| 11F | `strategy-board.png` | 1816×866 | 512×256 | 이번 생성 | 350 | 150.39 |
| 11F | `brochure-rack.png` | 1024×1536 | 256×512 | 이번 생성 | 111 | 162.16 |
| 11F | `materials-desk.png` | 1903×826 | 512×256 | 기존 원본 | 252 | 108.77 |
| 13F | `dispatch-board.png` | 1816×866 | 512×256 | 이번 생성 | 350 | 162.7 |
| 13F | `training-slide-board.png` | 1817×866 | 512×256 | 이번 생성 | 350 | 154.49 |
| 14F | `patent-display-cabinet.png` | 1024×1536 | 256×512 | 이번 생성 | 111 | 167.37 |
| 14F | `records-cabinet.png` | 887×1774 | 256×512 | 이번 생성 | 72 | 139.5 |
| 14F | `labeling-board.png` | 1817×866 | 512×256 | 이번 생성 | 350 | 153.81 |
| 14F | `experiment-table.png` | 1981×793 | 512×256 | 이번 생성 | 356 | 102.91 |
| 15F | `research-news-board.png` | 1870×841 | 512×256 | 기존 원본 | 362 | 169.69 |
| 16F | `food-cafe-table.png` | 1709×521 | 512×256 | 기존 원본 | 356 | 103.6 |
| 16F | `food-kitchen-board.png` | 1152×675 | 512×256 | 기존 원본 | 350 | 164.06 |
| 16F | `food-voice-board.png` | 872×723 | 512×256 | 기존 원본 | 350 | 164.06 |
| 16F | `food-shutter-panel.png` | 769×1538 | 256×512 | 기존 원본 | 89 | 172.44 |

## 출력 및 검수

- RGBA PNG, 실제 알파 0 바깥 여백과 다리 사이 투명을 밝고 어두운 바탕에서 확인했다.
- 알파 > 8 경계를 트림하고, 비율 유지·최근접 보간으로 `(캔버스 너비−16, 높이−16)` 안에 맞췄다. 기존 `scripts/prepare-floor-kit.ps1`의 계산 방식을 따랐다.
- `scale = min((width−16)/opaqueWidth, (height−16)/opaqueHeight)`, 출력 크기는 내림, 가로 중앙 정렬.
- 앵커 `(width/2, height−8)`, 불투명 하단 `height−8`, 모든 방향 최소 8px 여백을 검사했다.
- 월드 배치식: `top = 570 − (canvasHeight−8) × worldWidth / canvasWidth`. 예상 불투명 높이는 위 표에 실제 픽셀 경계로 계산했다.
- 기획의 미터 단위 크기는 생성 비율과 완전히 같지 않다. 특히 기존 트로피 진열장·카페 테이블·셔터 제어함과 새 실험 테이블은 연결 시 위 실측 높이를 확인해야 한다. 현재 출력은 원본 비율을 보존한다.
- `dispatch-board` 원본은 상단 모니터 외곽이 캔버스 위쪽에 닿아 있다. 출력본에는 8px 이상 투명 여백이 있으며 화면 내용과 외곽 실루엣은 보인다.
- 특허 진열장과 브로슈어 진열대는 최초 결과가 너무 가늘어 비율 수정본을 채택했다. 실험 테이블은 비율 수정본의 다리가 과도하게 짧아져 최초 결과를 채택했다.
- 눈으로 확인한 정전 상태, 단서 구성, 정면 시점, 알파, 캔버스, 앵커 검수 완료. 게임 코드는 변경하지 않았으므로 전체 게임 테스트는 실행하지 않았다.

## 11층 셔터

`../floor11/fire-shutter-states.png`: **384×1952**, 2열×1행, 칸 192×1952. **왼쪽 닫힘 / 오른쪽 열림**. 원본은 `../floor11/source/fire-shutter-closed.png`, `fire-shutter-open.png`.

닫힌 상태는 커튼이 바닥까지 내려오고 아래 경고띠가 보인다. 열린 상태는 커튼과 경고띠가 상단으로 올라가고 빈 레일과 삽입된 크랭크가 보인다. 원본의 상단 하우징과 전체 하단을 정렬한 뒤, 두 상태에 동일한 208px 가로 영역을 사용했다. 가늘고 긴 디자인 규격을 맞추기 위해 셔터 시트만 x/y를 독립적으로 최근접 보간했다. 두 칸 모두 패딩 8px, 상단 y=8, 하단 y=1944. 최종 화면 48×488로 그리면 가시 하단은 `top+486`이므로 바닥선에 맞출 때 `top=570−486=84`를 쓴다. 기존 y=82 박스에서 그대로 표시하면 2px 차이가 생긴다.

| 상태 | 원본 크기 | 공통 폭을 사용한 크롭 | x 배율 | y 배율 |
|---|---|---|---:|---:|
| fire-shutter-closed | [1241, 1267] | [550, 21, 758, 1243] | 0.846154 | 1.584288 |
| fire-shutter-open | [1241, 1267] | [548, 19, 756, 1248] | 0.846154 | 1.575264 |

두 상태를 나란히 표시해 하우징·레일 앵커가 크게 움직이지 않는지 확인했다. 생성 특성상 금속 마모와 작은 내부 디테일은 프레임 사이에 차이가 있다.

## 실제 생성 프롬프트

### sales-desk

화풍 참고: `assets/objects/floor-kit/compact-office-desk.png`

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in sales and strategic marketing floor 11 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtly worn realistic materials, realistic adult proportions. Muted desaturated deep navy and charcoal, small restrained tarnished BRASS-GOLD accents. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal visible top surfaces. Neutral dim ambient lighting but readable details. ALL monitors, equipment screens and lights OFF. No people, readable text, lettering, digits, logos or watermark. ONE isolated complete furniture object, TRUE TRANSPARENT ALPHA outside silhouette and through leg openings. No opaque backdrop, floor, cast shadow, fog, glow or checkerboard. Entire silhouette visible with small padding, feet rest on horizontal baseline. A sales account manager desk: dark walnut-veneer top with a thin brass edge, navy steel pedestal drawers at right, one black OFF monitor, a desk phone with dark display, a stack of printed customer demo reports with illegible lines, a rolled presentation poster tube, a small brass nameplate stand with a blank face. No chair. Landscape canvas, overall silhouette width to height about 2.1:1, height including monitor about 1.27 meters.
Reference image: approved ARCHI furniture, STYLE / pixel texture only, not the object to replicate. Follow the object description above exactly. No extra objects. Keep a straight front view. Final isolated asset only.
```

### boardroom-table

화풍 참고: `assets/objects/floor-kit/compact-office-desk.png`

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in sales and strategic marketing floor 11 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtly worn realistic materials, realistic adult proportions. Muted desaturated deep navy and charcoal, small tarnished BRASS-GOLD accents. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal visible top surfaces. Neutral dim ambient lighting but readable details. ALL devices OFF. No people, readable text, lettering, digits, logos or watermark. ONE isolated complete furniture object, TRUE TRANSPARENT ALPHA outside silhouette and between the legs. No opaque backdrop, floor, cast shadow, fog, glow or checkerboard. Entire silhouette visible with small padding, feet rest on horizontal baseline. A long executive boardroom table: thick dark walnut top with a thin brass inlay edge, two heavy navy pedestal bases. On the table: a dark conference speakerphone puck, a closed laptop, a single printed meeting-minutes sheet and a pen, two water glasses. No chairs. Very wide low landscape silhouette, width to height about 5:1, table height about 0.75 meters.
Reference image: approved ARCHI furniture, STYLE / pixel texture only, not the object to replicate. Follow the object description above exactly. No extra objects. Keep a straight front view. Final isolated asset only.
```

### strategy-board

화풍 참고: `assets/objects/floor-kit/research-board.png`

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in sales and strategic marketing floor 11 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtly worn realistic materials, realistic adult proportions. Muted desaturated deep navy and charcoal, small tarnished BRASS-GOLD accents. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal visible top surfaces. Neutral dim ambient lighting but readable details. ALL lights OFF. No people, readable text, lettering, digits, logos or watermark. ONE isolated complete furniture object, TRUE TRANSPARENT ALPHA outside silhouette and through leg openings. No opaque backdrop, floor, cast shadow, fog, glow or checkerboard. Entire silhouette visible with small padding, feet rest on horizontal baseline. A wide rolling strategy roadmap board, distinct from a sales chart: a horizontal timeline drawn in illegible marker with three milestone boxes, the later two boxes crossed out and pushed right with arrows, several printed slide pages and sticky notes pinned along the timeline, one sheet held by a red magnet at the bottom. Dark navy steel frame on caster legs with slim brass corner caps. Landscape canvas, overall silhouette width to height about 2.1:1, total height about 1.75 meters.
Reference image: approved ARCHI furniture, STYLE / pixel texture only, not the object to replicate. Follow the object description above exactly. No extra objects. Keep a straight front view. Final isolated asset only.
```

### brochure-rack

화풍 참고: `assets/objects/floor-kit/glass-display-cabinet.png`

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in sales and strategic marketing floor 11 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtly worn realistic materials, realistic adult proportions. Muted desaturated deep navy and charcoal, restrained accents of wine red, dusty blue and dull gold on the printed brochure covers. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal visible top surfaces. Neutral dim ambient lighting. No people, readable text, lettering, digits, logos or watermark. ONE isolated complete furniture object, TRUE TRANSPARENT ALPHA outside silhouette. No opaque backdrop, floor, cast shadow, fog, glow or checkerboard. Entire silhouette visible with small padding, base rests on horizontal baseline. A tall narrow marketing brochure display rack: charcoal steel frame with slanted acrylic pockets in five rows, each pocket stacked with identical glossy product brochures whose covers show an abstract soft human-profile silhouette graphic with no words; two sealed cardboard boxes of reprints on the bottom shelf. Portrait canvas, overall silhouette width to height about 0.7:1, total height about 1.7 meters.
Reference image: approved ARCHI furniture, STYLE / pixel texture only, not the object to replicate. Follow the object description above exactly. No extra objects. Keep a straight front view. Final isolated asset only.
```

채택한 수정 프롬프트:

```text
Edit this ARCHI sprite. Correct ONLY the overall proportions: the object is much too tall and narrow. Rebuild it as a realistically broad display unit whose opaque silhouette width divided by height is 0.70. The silhouette should occupy about 85% of canvas width and 90% of canvas height, on a portrait 2:3 canvas. Preserve front elevation, navy/steel palette, detailed pixel-art texture, contents, shelf order and ALL existing subject details. Maintain TRUE TRANSPARENT ALPHA outside the whole object; no floor, shadows, captions or backdrop. No readable text. Important: make object approximately TWICE as wide relative to its height as the input, not simply put the narrow input on a wider canvas.
```

### dispatch-board

화풍 참고: `assets/objects/floor-kit/research-board.png`

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in technical support floor 13 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtly worn realistic materials, realistic adult proportions. Muted desaturated steel gray and graphite, small restrained ochre ORANGE accents. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal visible top surfaces. Neutral dim ambient lighting but readable details. ALL monitors, equipment screens and lights OFF. No people, readable text, lettering, digits, logos or watermark. ONE isolated complete furniture object, TRUE TRANSPARENT ALPHA outside silhouette and through leg openings. No opaque backdrop, floor, cast shadow, fog, glow or checkerboard. Entire silhouette visible with small padding, feet rest on horizontal baseline. A wide mobile engineer dispatch status board on a graphite steel stand with caster wheels: a whiteboard grid of rows and columns drawn in illegible marker, a column of magnetic engineer name tiles ALL moved to the far right "away" side, leaving the left "on duty" column completely empty. A printed notice sheet taped at the bottom center with illegible lines, one orange magnet. A small BLACK unlit status monitor clamped on the top right corner of the frame. Marker tray with pens. Landscape canvas, overall silhouette width to height about 2.1:1, total height about 1.75 meters.
Reference image: approved ARCHI furniture, STYLE / pixel texture only, not the object to replicate. Follow the object description above exactly. No extra objects. Keep a straight front view. Final isolated asset only.
```

### training-slide-board

화풍 참고: `assets/objects/floor-kit/research-board.png`

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in technical support floor 13 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtly worn realistic materials, realistic adult proportions. Muted desaturated steel gray and graphite, small restrained ochre ORANGE accents. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal visible top surfaces. Neutral dim ambient lighting but readable details. ALL screens, projectors and lights OFF. No people, readable text, lettering, digits, logos or watermark. ONE isolated complete furniture object, TRUE TRANSPARENT ALPHA outside silhouette and through leg openings. No opaque backdrop, floor, cast shadow, fog, glow or checkerboard. Entire silhouette visible with small padding, feet rest on horizontal baseline. A wide classroom training board on a light steel rolling stand, distinct from an engineer dispatch board: a pale whiteboard with printed safety training slides pinned in a neat row. The central slide shows a simple wordless diagram of a rooftop solar panel with a single thick cable branching to a stack of building floors, only ONE floor block highlighted in orange and the others gray. Other slides show wordless icons of a battery and a switch. A small unlit black clicker remote and a closed laptop on the tray. Landscape canvas, overall silhouette width to height about 2.1:1, total height about 1.75 meters.
Reference image: approved ARCHI furniture, STYLE / pixel texture only, not the object to replicate. Follow the object description above exactly. No extra objects. Keep a straight front view. Final isolated asset only.
```

### patent-display-cabinet

화풍 참고: `assets/objects/floor-kit/glass-display-cabinet.png`

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in software-company research floor 14 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtle material wear, realistic adult proportions. Muted desaturated navy blue, graphite and cool steel colors. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal top surface visible. Neutral dim ambient lighting but readable details. ALL screens and equipment lights completely OFF. No characters, text, lettering, digits, logos or watermark. ONE isolated complete furniture object with TRUE TRANSPARENT ALPHA outside silhouette. No floor plane, opaque backdrop, cast shadow, glow, fog or checkerboard. Entire object visible centered with small padding. Bottom base on straight horizontal baseline. A tall narrow research achievement display case with slim navy steel frame and clear glass front, three glass shelves holding framed patent certificates standing on small easels, their surfaces showing only faint illegible gray lines and a small blank seal circle. The top shelf holds the newest, largest framed certificate with a thin cobalt ribbon across its corner. A few small acrylic research award blocks on the lower shelf. Unlit display light strip under the top. Portrait canvas, overall silhouette width to height about 0.63:1, total height about 1.9 meters.
Reference image: approved ARCHI furniture, STYLE / pixel texture only, not the object to replicate. Follow the object description above exactly. No extra objects. Keep a straight front view. Final isolated asset only.
```

채택한 수정 프롬프트:

```text
Edit this ARCHI sprite. Correct ONLY the overall proportions: the object is much too tall and narrow. Rebuild it as a realistically broad display unit whose opaque silhouette width divided by height is 0.63. The silhouette should occupy about 85% of canvas width and 90% of canvas height, on a portrait 2:3 canvas. Preserve front elevation, navy/steel palette, detailed pixel-art texture, contents, shelf order and ALL existing subject details. Maintain TRUE TRANSPARENT ALPHA outside the whole object; no floor, shadows, captions or backdrop. No readable text. Important: make object approximately TWICE as wide relative to its height as the input, not simply put the narrow input on a wider canvas.
```

### records-cabinet

화풍 참고: `assets/objects/floor-kit/glass-display-cabinet.png`

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in software-company research floor 14 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtle material wear, realistic adult proportions. Muted desaturated navy blue, graphite and cool steel colors. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal top surface visible. Neutral dim ambient lighting but readable details. ALL lights OFF. No characters, text, lettering, digits, logos or watermark. ONE isolated complete furniture object with TRUE TRANSPARENT ALPHA outside silhouette. No floor plane, opaque backdrop, cast shadow, glow, fog or checkerboard. Entire object visible centered with small padding. Bottom base on straight horizontal baseline. A tall narrow four-drawer archive records cabinet in dark slate-navy steel, clearly more important than an ordinary filing cabinet: every drawer has a small metal label holder with a blank off-white card, the top drawer has a small keyed lock and a thick bound ledger lying on top of the cabinet with colored index tabs sticking out. The second drawer is pulled open a few centimeters showing tightly packed folders. A faint diagonal scuff across the lower drawers. Portrait canvas, overall silhouette width to height about 0.5:1, total height about 1.5 meters.
Reference image: approved ARCHI furniture, STYLE / pixel texture only, not the object to replicate. Follow the object description above exactly. No extra objects. Keep a straight front view. Final isolated asset only.
```

### labeling-board

화풍 참고: `assets/objects/floor-kit/research-board.png`

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in software-company research floor 14 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtle material wear, realistic adult proportions. Muted desaturated navy blue, graphite and cool steel colors. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal top surface visible. Neutral dim ambient lighting but readable details. ALL screens and equipment lights completely OFF. No characters, text, lettering, digits, logos or watermark. ONE isolated complete furniture object with TRUE TRANSPARENT ALPHA outside silhouette and through all leg openings. No floor plane, opaque backdrop, cast shadow, glow, fog or checkerboard. Entire object visible centered with small padding. Bottom feet share straight horizontal baseline. A wide mobile data-labeling progress board on navy steel caster legs: a whiteboard with a kanban-style grid of three columns drawn in illegible marker, the left and middle columns EMPTY and the right column crowded with many small blue sticky notes, as if all the work was finished overnight. One column header row has a single empty name slot. A small black OFF tablet clipped to the top right corner. Marker tray with pens. Landscape canvas, overall silhouette width to height about 2.1:1, total height about 1.75 meters.
Reference image: approved ARCHI furniture, STYLE / pixel texture only, not the object to replicate. Follow the object description above exactly. No extra objects. Keep a straight front view. Final isolated asset only.
```

### experiment-table

화풍 참고: `assets/objects/floor-kit/compact-office-desk.png`

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in software-company research floor 14 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtle material wear, realistic adult proportions. Muted desaturated navy blue, graphite and cool steel colors. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal top surface visible. Neutral dim ambient lighting but readable details. ALL devices OFF. No characters, text, lettering, digits, logos or watermark. ONE isolated complete furniture object with TRUE TRANSPARENT ALPHA outside silhouette and between the legs. No floor plane, opaque backdrop, cast shadow, glow, fog or checkerboard. Entire object visible centered with small padding. Bottom feet share straight horizontal baseline. A long plain white-topped participant waiting table on slim navy steel legs in a user research lab: a thick clipped bundle of off-white consent forms with illegible lines at center, a pen on a coiled cord, a small stack of paper coupon envelopes at right, a closed clipboard and a small dark wrist-sensor band lying at left. Clinical and ordinary, slightly unsettling. No chairs. Very wide low landscape silhouette, width to height about 5:1, table height about 0.75 meters.
Reference image: approved ARCHI furniture, STYLE / pixel texture only, not the object to replicate. Follow the object description above exactly. No extra objects. Keep a straight front view. Final isolated asset only.
```

### fire-shutter-closed

```text
Use case: stylized-concept. Production game sprite for ARCHI, Korean 2D side-scrolling mystery game in the sales and strategic marketing division floor 11 at midnight during power outage. Detailed anime-inspired pixel art with crisp hard-edged clusters and outlines, subtly worn materials, realistic adult proportions. Muted desaturated steel gray and charcoal with restrained yellow safety accents, harmonizing with a deep navy and brass corridor. Strict orthographic SIDE PROFILE: the rolling fire shutter crosses the corridor perpendicular to the viewer, so it is seen EDGE-ON as one very tall, very narrow vertical object. No perspective, no three-quarter view. Neutral dim light, all indicator lights OFF. No characters, text, lettering, digits, logos or watermark. ONE isolated object on TRUE TRANSPARENT ALPHA background, no wall, floor, room, cast shadow, glow or checkerboard. Tall narrow portrait canvas about 1:4 with the object centered and small padding; the object itself is about 1:10 width to height. From top to bottom: a boxy charcoal steel roll-up housing mounted at the ceiling, about twice as wide as the curtain; a slim steel guide rail running the full height; STATE A (CLOSED): the corrugated steel slat curtain lowered all the way to the floor line, seen as a thin ribbed column, ending in a heavy bottom bar painted with diagonal yellow and black safety stripes that rests exactly on the bottom baseline. At waist height on the guide rail, a small gray manual override box with a round EMPTY crank socket. No fire, no scorch marks, no smoke — the shutter is lowered for no visible reason.
Actual sprite silhouette must be 1:10 WIDTH:HEIGHT. Isolated narrow SIDE PROFILE, not a broad door front. Transparent pixels around it. Single closed shutter.
```

### fire-shutter-open

```text
Edit the provided CLOSED fire shutter sprite into STATE B (OPEN). Keep the exact same ceiling housing, guide rail, manual override box, scale, position, pixel style and transparent background. Change only the curtain: the slat curtain is fully rolled up into the housing, the long rail below is empty, and only the yellow and black striped bottom bar peeks out just under the housing. A short steel crank handle is now inserted in the socket of the manual override box. Nothing else changes.
Use the ENTIRE supplied image as the edit target. Keep the original canvas and pixel coordinates of all fixed hardware. Real transparent alpha outside the narrow shutter and inside the now-empty space beside the guide. Keep the solid rail/housing visible and opaque. No broad front-facing shutter.
```

채택한 수정 프롬프트:

```text
Edit only the bottommost yellow-and-black striped block in this OPEN shutter: REMOVE that bottom striped bar completely, leaving just the slender dark steel guide rail's small plain metal foot at ground level. The striped moving curtain bottom bar is ALREADY raised beneath the ceiling housing; retain that TOP striped bar unchanged. Preserve pixel positions, the empty tall guide, the inserted crank handle, ceiling housing, canvas size, materials and actual transparent alpha. No other change.
```

