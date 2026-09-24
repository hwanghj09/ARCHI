---
name: archi-floor-builder
description: Build a new playable floor (층) for ARCHI — corridor rooms, enterable room interiors, props, inspectable clues, locked doors, dark rooms, jumpable obstacles, tests and docs — on top of the fixed building core that every floor shares. Use this whenever the user asks to make, add, fill, redesign or change a floor or a room on a floor, e.g. "14층 만들어줘", "12층 채워줘", "B1 시설관리실 만들어", "15층이랑 다르게 해줘", "방 추가해줘", "층 구조 바꿔줘", even if they do not say "skill". Also use it before moving elevators, stairs or restrooms, which must never move per floor. For art for a floor (background images), pair this with archi-art-prompt.
---

# ARCHI floor builder

Every floor except the rooftop is one building. The user decided (2026-09-24) that **floor width,
the three elevators, the emergency stair door and the restroom sit at exactly the same place on
every floor**. Only the rooms and props in between change. This skill is the recipe the room floors (12F..16F) were built with, including the mistakes that had to be fixed.
Floors 16..13 follow the lobby directory in `층별안내.md` (16F 편의시설 The Kitchen/CU/Café, 15F and 14F 연구본부,
13F 기술본부); keep the tenant from that file when rebuilding one of them.

Before writing anything:

1. Read `기획.md`. Standard floor structure (기획.md, 티맥스 건물 구조): **exactly three rooms per
   floor** (방 1, 방 2, 방 3) plus the core; the shared restroom does not count as one of them.
   Named floors have jobs: 17 start, 옥상 power, 12 ARCHI 개발팀 (fake performance), 7 AI
   테스트/검증실 (night training, external host), 1 로비 (first guard robot), B1 시설 관리실,
   B2 서버실 (ending). Other floors are ordinary company floors; invent a department whose clues
   support the plan and never contradict it.
2. Power state matters for clues: most floors are dark and unpowered at midnight, but **B1 and
   B2 already have power**, and 12F and 7F get powered by the player later (lights, PCs, CCTV,
   robots on). The power system itself is not implemented yet; write clue text for the state the
   player first sees and say so in the report.
3. Read the current `player.js` blocks named below. Values change; the code wins over this file.
4. Compare with the existing floors (`FLOOR12_LAYOUT`..`FLOOR16_LAYOUT`, 17F) and make the new
   floor **clearly different**: other department, room types, wall/door looks, interior widths,
   props, and ideally a mechanic of its own. The user rejected a 15F that re-skinned 16F. Zone use so far: 16F left 2 + right 1, 15F left 2 +
   middle 1, 14F left 3, 13F middle 1 + right 2 (open desks on the left), 12F one per zone, 11F left 1 + right 2
   (behind a corridor shutter), 10F left 2 (apart) + middle 1, 9F left 2 (apart) + right 1 with a middle-zone lounge.
   Also avoid room names another floor already uses (13F and a first 9F draft both had a 고객 교육장).

## Fixed building core — never change per floor

`BUILDING_CORE` in `player.js` is the single source, and 17F's static corridor reads it too:

| Element | Value | Hint zone (±28) |
| --- | --- | --- |
| Floor width | 5000 | |
| Elevators | x=1818 / 2148 / 2444, widths 218 / 214 / 216, y=220 | 1790..2688 |
| Stair door | x=2906, width 180, y=232 (locked except on 17F) | 2878..3114 |
| Restroom | front x=3556..4282; door x=3612, width 145, y=210, metal | door 3584..3785 |
| Floor sign | x=2694 (DOM text) | |

`FLOORS` appends the restroom to every floor's `rooms` (always last), and `RESTROOMS` creates its
interior from the shared `restroomInterior` (17F art, 1800px). Do not add either yourself.
`buildDynamicScene` returns the core doors first, so they win the E key where zones touch.

**Where per-floor content may go** (room fronts and props):

| Zone | Anything | Interactive box (hint zone clear of the core) |
| --- | --- | --- |
| Left | 32..1790 | 60..1762 |
| Middle | 3086..3556 | 3142..3556 |
| Right | 4282..4968 | 4282..4940 |

An interactive item's box is its door or prop box; its hint zone is box ±28. Keep it from
overlapping any core hint zone.

## Floor config shape

Declare the new constants **after the `FLOOR15_ROOMS` block and before `const FLOOR_LAYOUTS`**
(they are `const`; declaring them later throws a ReferenceError at load).

```js
const FLOOR14_LAYOUT = {
  header: '14F · <부서>', background: '#hex', theme: 'warm' /* optional */,
  roomDoorY: 250 /* optional: default corridor door top */,
  rooms: [                                   // exactly three
    { name: '방 이름', x, width,              // corridor wall span of the room
      style: 'glass' /* default */ | 'solid-wall' | 'panel' | 'open' | <new>,
      target: 'f14-<id>', doorX, doorWidth /* default 120 */, doorY /* optional */,
      doorStyle /* optional; none = plain teal door */: 'glass' | 'metal' | 'wood' | 'double' | <new>,
      locked: true, message: '잠긴 문 메시지' /* optional: E shows message, no entry */ },
  ],
  props: [ /* corridor props, same shape as room props */ ],
};
const FLOOR14_ROOMS = interiorRooms(14, [
  { id: 'f14-<id>', name: '방 이름', width /* default 2400: always set it, see scale rule */,
    exitX /* only when a background image has the exit door painted */,
    dark: true /* only the player's surroundings are visible */, windowless: true,
    solids: [{ x, width, height }] /* jumpable crates */,
    backgroundImage: { src, width /* optional: crop instead of squeeze */, height, top },
    props: [
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x /* centre */,
        name: '책상', message: '조사 문구' },  // message makes it inspectable; name is then required
    ] },
]);
```

Register it in **two** places: `FLOOR_LAYOUTS = { ..., 14: FLOOR14_LAYOUT }` and
`...FLOOR14_ROOMS` inside the `floorById` list. The floor already exists in `FLOOR_NUMBERS`.
Basements: `floorId(-1) === 'b1'`, so targets are `b1-<id>`, and the key must be written
`[-1]: B1_LAYOUT` (a bare `-1:` is a syntax error). 17F is different: it is static DOM, so
change it through `FLOOR17.rooms`, `FLOOR17_ROOMS`, `#floor17-extension` and
`tests/floor17-extension.mjs`.

## Room inside/outside rule

Helpers are in `tests/room-geometry.mjs` (`roomFront`, `exitDoor`, `assertMirroredDoor`,
tolerance 0.01); `tests/elevator.mjs` does the enforcing.

- The exit inside is the same door as the corridor door: same width and y.
- Its position mirrors the corridor: the share of wall left of the door is equal inside and
  out. `exitDoorX(outside, insideWidth, doorWidth)` computes it automatically:
  `32 + (insideWidth - 64 - doorWidth) * (doorX - x) / (width - doorWidth)`.
- With a painted exit door, set `exitX` and place the corridor door by the inverse:
  `doorX = x + (exitX - 32) * (width - doorWidth) / (insideWidth - 64 - doorWidth)`.
  A painted door's world x is `sourceX * displayWidth / naturalWidth`.
- Interior width scales with the corridor front. On one floor, `interior width / front width`
  is the same for the floor's own three rooms (±2%); the shared restroom (2.48) is exempt.
  16F uses 3.4 (1060→3604, 600→2040, 560→1904); 15F uses 4.0 (860→3440, 620→2480, 456→1824);
  14F 3.75; 13F 5.7 (two 320px rooms in the right zone); 11F 5.7 (632/316/316); 10F 4.2; 9F 4.4.
- Keep every interior **at least 1800px** wide (the camera shows 1280px on 16:9 and 1820px on
  21:9). A room in the middle zone (≤470px front) therefore needs a ratio of about 3.9 or more.
- Keep inspectable props clear of the exit: box edge ≥ `exitX + doorWidth + 56` or
  ≤ `exitX - 56`, and all props within 32..width-32.

## Props

Sprites are `assets/objects/floor-kit/*.png`. Take only `size` (canvas width × height) from
`manifest.json`; its `suggestedWorldWidth` values are the old oversized scale (the 17F
manager room still uses them — do not copy). A prop's box is `[x - worldWidth/2, x + worldWidth/2]`,
and its canvas bottom minus 8px sits on y=570.

Human scale: the player's 162px is 175cm, so
`worldWidth = canvasWidth * (realCm * 162 / 175) / opaqueHeight` (opaque = alpha > 8).

| Prop | Canvas | Opaque h | worldWidth | Real height |
| --- | --- | ---: | ---: | --- |
| filing-cabinet | 256x512 | 496 | 72 | 151cm (measured) |
| office-desk | 512x256 | 239 | 252 | 127cm with monitor (measured) |
| office-copier | 256x256 | 240 | 110 | 111cm (measured) |
| large-planter | 256x512 | 465 | 78 | 153cm (measured) |
| rolling-whiteboard | 512x256 | 240 | 350 | 177cm (measured) |
| meeting-table | 512x256 | 100 | 356 | 75cm (measured) |
| waiting-sofa | 512x256 | 162 | 250 | 85cm (measured) |
| water-cooler | 256x512 | 496 | 62 | 130cm (measured) |
| kitchenette-counter | 512x256 | 202 | 312 | 133cm (measured) |
| drink-vending-machine | 256x512 | 468 | 96 | 190cm (measured) |
| staff-lockers | 256x512 | 334 | 130 | 183cm (measured) |
| reception-counter | 512x256 | 162 | 322 | 110cm (suggested) |
| electronics-bench | 512x256 | 236 | 261 | 130cm (suggested) |
| robot-charging-dock | 256x256 | 239 | 69 | 70cm (suggested) |
| instrument-cart | 256x256 | 210 | 113 | 100cm (suggested) |
| glass-display-cabinet | 256x512 | 406 | 111 | 190cm (suggested) |
| server-rack / network-rack / server-cooling-unit | 256x512 | 496 | 96 | 200cm (suggested) |
| ups-cabinet | 256x256 | 180 | 158 | 120cm (suggested) |
| maintenance-tool-cabinet | 512x256 | 239 | 198 | 100cm (suggested) |
| electrical-panel | 256x512 | 321 | 89 | 120cm; wall-mounted art, but the engine stands it on the floor |

The floor tests check human scale against a `heights` table in `tests/elevator.mjs`
(`file: [opaqueHeight, minPx, maxPx]`). Add an entry for every kit file a new check covers, or
the lookup returns undefined and throws.

Clues: 1-4 inspectable items per room, short Korean sentences in the game's voice. Put the key
clue behind the floor's mechanic (e.g. past the boxed servers in the 15F seminar room). Interactions only
work while standing on the floor (y=570), never from on top of a crate.

## Styles and mechanics

- CSS lives in `index.html`. `glass` is the base `.floor-room` look (no rule of its own) and
  `.room-door.metal` is neutral. `solid-wall`, `panel`, `open`, `wood` and `double` are painted
  in 15F's brown palette; on another theme they make the floor look like 15F. For a new look, add
  new classes such as `#dynamic-scene .floor-room.<new>` and `#dynamic-scene .room-door.<new>`.
- Themes are `#dynamic-scene[data-theme="x"] ...` rules; interiors inherit the parent floor's
  theme. A theme `.floor-room` rule has the same specificity as `#dynamic-scene .floor-room.<style>`,
  so put new theme rules **before** the style rules, or name the style class in them.
  Door-style rules are unprefixed, so any theme rule on `.room-door` overrides all of them.
- `dark: true` shows the `#darkness` vision circle. `solids` adds crates. A walking jump rises
  about 135px and travels about 170px (sprinting about 290px), and the player can land on a crate
  and walk off. Keep crates ≤ 60px tall; their width is limited by the test's `jump()`
  (1300ms, about 260px of travel). A solid can set `kind` (CSS class, default `crate`); 9F uses
  `riser` for tiered seating, four 38px steps, each 240px deep.
- `barriers` on a floor or room: `{ name, x, y, width, style, requires, gives, missingMessage, message, takenMessage }`
  is a full-height solid you can inspect (11F fire shutter). With every `requires` item collected, E collects `gives`,
  removes the body at once and sets `data-open=true`; later rebuilds draw it open without a body.
- Inspectable props: `requires` is an item id or a list; until all are collected E shows `missingMessage`
  (`partialMessage` when some are) and does not hand out `gives` (10F dual-key cabinet). `base` stands a prop on
  a platform that high (`data-base`) and makes it inspectable only while standing at that height (`standY`);
  `assertHumanScale` accounts for it. `style` adds a class to `.floor-prop`.
- Background art: generate with archi-art-prompt and record it next to the art. Vertical
  alignment: `top + sourceFloor * height / sourceHeight = 570`. Horizontally the image is
  stretched to `art.width ?? config.width` (no aspect lock). With art, `data-art=true` hides the
  CSS floor, the room interior, the room fronts and the doors (metal doors stay visible), moves
  the floor sign, and dims props (brightness .68, saturate .8), so the art must paint every front
  and door. A corridor image must be drawn for the core coordinates above;
  `floor16/corridor.png` is the old 3700px layout and is unused.

## Tests

`tests/elevator.mjs` rides 17 → 16 (checked before the loop) → 15…1 (loop) → B2 → B1 (after the
loop; B1 runs at a 390×844 viewport and the test ends there).

- Floors 15..1: add a branch next to `if (floor === 15) await checkFloor15();`. The else branch
  asserts an empty floor, and floor 8 also visits its restroom.
- B2 / B1: replace their post-loop blocks (they assert `'B2 · 빈 층'`, `'B1 · 빈 층'` and 3 solids).
- 12F: `tests/movement.mjs` also rides to 12F and asserts `'12F · 빈 층'`, no obstacles and
  `/12층에 도착/`; update it too.

Write a `checkFloorNN` helper modelled on `checkFloor15` (`checkFloor16` shows `links` and a latched door,
`checkFloor14` a `litBy` light, `checkFloor13` a `requires` prop):

- Start with `roomScales.length = 0`, then `checkCore()` and `visitRestroom('14F')`.
- Corridor: sign order (the floor's three rooms in order, then '화장실'), door classes, prop
  count, locked-stairs hint at x=2996, one corridor inspect.
- Rooms: `enterRoom(name, '14F')` and `leaveRoom(room, '14F · <부서>')` assert the mirrored exit,
  entry and return positions. Also check world width, prop count, one inspect (hint text +
  message regex), then the ratio `max(roomScales) / min(roomScales) < 1.02`.
- Locked rooms: `roomFront` finds them, but check the hint `E · <name> (잠김)` and the E message
  instead of `enterRoom`.
- Dark room: `data-dark` is true inside and false after leaving. Crates: walking is blocked, then
  `walkTo(crate.x - 80)` (centre; the body edge is 60px away) and `jump('d')`.
- Walking moves about 3.3px per frame; aim for the middle of a zone, not its edge.
- End at elevator 1 (x≈1858) before pressing E to reboard.

Run `npm test` (all suites). Screenshots land in `.local/`; shrink and view a few to check the
floor looks right.

## Docs

Update the floor paragraph in `README.md`: rooms, widths, clues, config names, and the count of
remaining empty floors ("나머지 N개 층"). If the floor got art, add its PROMPT.md / GENERATED.md
via archi-art-prompt.

## Pitfalls already hit

- Rooms placed over the restroom span after it joined the core. Always check the zone table.
- A prop at the very start of the middle zone stole the stair door's E key.
- Re-skinning another floor is not "different". Change structure, room types and mechanics.
- Moving the core or the floor width breaks painted backgrounds (the unused old 16F art in `assets/background/floor16/`).
- `interiorRooms` fills `width: 2400` unless the room sets `width`, which breaks the scale rule.
- Theme `.floor-room` rules placed after `.floor-room.restroom` repaint the restroom front; give such a theme rule
  only a border colour and let every room style set its own background.
- The room backdrop used to be appended after the solids and hid crates and tiers; `buildDynamicScene` now inserts
  it before the first obstacle. Check screenshots that obstacles are visible.
- Another Claude session may be editing the same files. Re-read code before patching and keep
  edits targeted.
