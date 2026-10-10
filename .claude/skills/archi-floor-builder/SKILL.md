---
name: archi-floor-builder
description: Build a new playable floor (층) for ARCHI — corridor rooms, enterable room interiors, props, inspectable clues, locked doors, dark rooms, jumpable obstacles, tests and docs — on top of the fixed building core that every floor shares. Use this whenever the user asks to make, add, fill, redesign or change a floor or a room on a floor, e.g. "14층 만들어줘", "12층 채워줘", "B1 시설관리실 만들어", "15층이랑 다르게 해줘", "방 추가해줘", "층 구조 바꿔줘", even if they do not say "skill". Also use it before moving elevators, stairs or restrooms, which must never move per floor. For art for a floor (background images), pair this with archi-art-prompt.
---

# ARCHI floor builder

Every floor except the rooftop is one building. The user decided (2026-09-24) that **floor width,
the three elevators, the emergency stair door and the restroom sit at exactly the same place on
every floor**. Only the rooms and props in between change. This skill is the recipe the room floors (12F..16F) were built with, including the mistakes that had to be fixed.
Floors follow the lobby directory in `층별안내.md` (16F 편의시설 The Kitchen/CU/Café, 15F and 14F 연구본부,
13F 기술본부, 8F QA실·제품기획실, 4F TmaxTibero 연구본부, 3F Fitness Club/㈜하누리서비스/고객만족센터/Studio,
2F Harmony Hall/서버실, 1F Harmony Hall/Vision Hall/건강관리실/여성휴게실); keep the tenant from that file when
rebuilding one of them. `js/elevator/cabin.js` relies on the 1F info-desk clue (Suho's badge deregistered at 23:58).

Corridor look: when the user asks to implement a floor ("N층을 구현해줘"), also load **archi-floor-walls** (corridor walls
from `assets/background/wall`), **archi-floor-doors** (room doors from `assets/objects`) and **archi-asset-files** (where
every asset lives, how to file new ones). This skill covers rooms, clues, mechanics and tests.

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
3. Read the current code named below (`js/core/config.js`, `js/floors/`, `js/scene/scene-builder.js`). Values change; the code wins over this file.
4. Compare with the existing floors (`FLOOR12_LAYOUT`..`FLOOR16_LAYOUT`, 17F) and make the new
   floor **clearly different**: other department, room types, wall/door looks, interior widths,
   props, and ideally a mechanic of its own. The user rejected a 15F that re-skinned 16F. Zone use so far: 16F left 2 + right 1, 15F left 2 +
   middle 1, 14F left 3, 13F middle 1 + right 2 (open desks on the left), 12F one per zone, 11F left 1 + right 2
   (behind a corridor shutter), 7F left 1 (VIP Room past an open lounge) + right 2, 1F left 3 (entrance, gates and robot
   at the east end), B1 right 3 (open robot charging bay on the left), B2 one per zone (the main server room is the left one).
   2F..6F and 8F..10F are cutaway-asset floors (see "Cutaway-asset floors" below): all left 2 (x=40 w1000, x=1080 w690)
   + right 1 (x=4282 w680), doors 210 tall at y=360, interiors about 2.68x their fronts.
   Mechanics taken so far: 16F links + latched shutter, 15F crates, 14F dark room + `litBy`, 13F `requires`,
   12F key + `unlockedBy`, 11F `barriers`, 10F two-key `requires`, 9F cross-room clue chain (`requires` list + `partialMessage` on a painted-art hotspot; earlier 9F: risers + `base`), 8F `sequences`, 7F `exitLock`,
   6F `ring`, 5F `movables` + inspectable solid, 4F one-output UPS `cycle`, 3F timed door (`opens` + sprint),
   2F cross-room projection (fixture `requires` → `data-ready`), 1F fixture keypad `code` with a decoy,
   B1 elevator restriction (cabin.js `restrictedFloors`, lifted by a prop's `gives`), B2 sweeping CCTV `cameras`.
   B1 and B2 are the only floors with power, so they are drawn lit (monitors, card readers and ceiling lights on).
   The first 1F..4F (speed gate, cross-floor Harmony Hall links, inner room, door keypad) were rebuilt on 2026-09-25.
   Also avoid room names another floor already uses (13F and a first 9F draft both had a 고객 교육장).

## Fixed building core — never change per floor

`BUILDING_CORE` in `js/core/config.js` is the single source, and 17F's static corridor reads it too:

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

Put the new constants in their own file **`js/floors/floor-NN.js`** (two digits; e.g. `floor-b1.js` for B1)
and add its `<script>` tag in `index.html` **between the other floor files and `js/floors/registry.js`**.
All game scripts are classic scripts sharing one global scope, so load order is dependency order;
a floor file loaded after `registry.js` throws a ReferenceError at load.

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

Register it in **two** places in `js/floors/registry.js`: `FLOOR_LAYOUTS = { ..., 14: FLOOR14_LAYOUT }` and
`...FLOOR14_ROOMS` inside the `floorById` list. The floor already exists in `FLOOR_NUMBERS`.
Basements: `floorId(-1) === 'b1'`, so targets are `b1-<id>`, and the key must be written
`[-1]: B1_LAYOUT` (a bare `-1:` is a syntax error). 17F is different: it is static DOM, so
change it through `FLOOR17.rooms`, `FLOOR17_ROOMS` (`js/floors/floor-17.js`), `#floor17-extension` and
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
  14F 3.75; 13F 5.7 (two 320px rooms in the right zone); 11F 5.7 (632/316/316); the cutaway floors 2F..6F, 8F..10F about 2.68 (1000/690/680 → ~2676/1846/1840); 1F 6.2 (520/380/300).
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
- `sequences` on a room: `[{ id, steps, gives, wrongMessage }]`, and props with `sequence: id, step: n` (props only,
  not fixtures). Inspecting the next step (or the current one again) advances and sets `data-done` (green light);
  a wrong or skipped step resets and shows `wrongMessage`; the last step collects `gives`, after which every step
  shows `takenMessage || message`. Progress clears on every scene change (8F reproduction procedure).
- Timed door: a prop or fixture with `opens: { barrier: <barrier name>, duration }` removes that barrier's body for
  `duration` ms (`data-open`); pressing again restarts the count, and it only closes once the player is clear of it.
  Barrier `closedMessage` shows on closing. Walking is 200px/s and sprinting (Shift) 340px/s, so 3F puts the button
  ~1300px from the door with 5000ms: walking fails, sprinting passes. Test sprint with `keyboard.down('ShiftLeft')`.
- Selector: a prop with `cycle: { id, states, messages, initial }` advances one state per E and holds exactly one item
  `${id}=${state}` (`data-state` = index). Other props `requires` it and doors use it as `unlockedBy`, so a device
  works only while selected; the corridor door re-locks on the next rebuild once the state moves (4F UPS).
- A fixture with `requires` gets `data-requires` and `data-ready` (all collected). `refreshReady()` runs on build,
  after any `gives` and after a cycle step, so CSS can show a state change in the same room (2F booth window).
- A fixture can take `code` + `codePrompt` + `gives` like a prop (1F robot panel); after the right code, E shows
  `takenMessage` without the keypad.
- Painted-art floors (9F): when the art already paints the furniture, clues are `fixtures` with style `art-spot`
  (transparent, dashed outline when near) over it. A room door sprite with a second, open frame can show it via
  `[data-open="true"]`: pressing E on any room door sets `data-open` before the fade (9F `f9-glass`).
- `cameras` on a floor or room (B2, `js/interaction/cctv.js`): `{ name, x, y, spans: [[from, to], ...], period, guards,
  lockMs, disabledBy, detectedMessage, lockedMessage }`. The camera watches one span per `period` ms in turn
  (cone `data-active`); the player's centre inside the watched span locks the `guards` room's corridor door (hint
  `(잠김)`, E shows `lockedMessage`) until `lockMs` after leaving it (`.cctv` `data-alert`). Gaps between spans are
  blind spots. With `disabledBy` collected the camera is drawn off with no cones. The count restarts on every rebuild.
- Elevator restriction: `restrictedFloors` / `restrictionItem` in `js/elevator/cabin.js` refuse a floor button
  (`data-restricted`) until the item is collected, like the 15F..12F `badgeFloors` (B2, lifted on B1).
- Background art: generate with archi-art-prompt and record it next to the art. Vertical
  alignment: `top + sourceFloor * height / sourceHeight = 570`. Horizontally the image is
  stretched to `art.width ?? config.width` (no aspect lock). With art, `data-art=true` hides the
  CSS floor, the room interior, the room fronts and the doors (metal doors stay visible), moves
  the floor sign, and dims props (brightness .68, saturate .8), so the art must paint every front
  and door. A corridor image must be drawn for the core coordinates above;
  `floor16/corridor.png` is the old 3700px layout and is unused.

## Cutaway-asset floors (2F..6F, 8F..10F)

The user supplies one 3200×556 cutaway painting per floor (`assets/background/floorNN/<asset>.png` + `PROMPT.md`, floor line
y=438, 1:1 scale: world y = asset y + 132, `top: 132`, height 556). `assets/background/cutaway_kit.py` cuts it: a 5000px
corridor (`corridor_wall()` from the asset's own slab, wall colour and floor, each room's front as a `glass()` crop), each
room's interior (the full painted room widened with repeated bays), and two-frame door sprites (`door_sheet`, 210 tall).
Each floor's `build.py` and `GENERATED.md` record the cuts. Rooms use `style: 'painted'`, `doorSprite` (no doorStyle; the
exit uses the same sprite and E shows the open frame), walls-only art, and clues as `fixtures` with `style: 'art-spot'`
(transparent, dashed outline when near) over the painted objects. Fixtures take `sequence`/`step`, `ring` and `cycle` like
props, so mechanics sit on painted devices; `screen-cover` fixtures hide painted screens until their `requires` is met.
Tests use `checkCutawayArt`, `checkSpriteDoors` and `enterThroughSpriteDoor` in `tests/elevator.mjs`.

## Tests

`tests/elevator.mjs` rides 17 → 16 (checked before the loop) → 15…1 (loop) → B1 → B2 (after the
loop: B2 is refused from 1F, `checkFloorB1` lifts the restriction, the B1 → B2 ride runs at a 390×844 viewport, then
`checkFloorB2` runs back at 1280×720 and the test ends there).

- Floors 15..1: add a branch next to `if (floor === 15) await checkFloor15();`. The else branch
  asserts an empty floor, and the first empty floor it meets also visits its restroom (`emptyRestroomVisited`).
  No floor is empty any more, so that branch only guards future changes.
- B1 / B2: change `checkFloorB1` / `checkFloorB2`. Camera timing in a test: wait for a span to start afresh
  (`nextSpan` in `checkFloorB2`), not just to be active, or the period may run out mid-walk.
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
- Leaving a room by its exit collects the room's own id (the latch behind `unlockedBy: <room id>`). A `gives` equal to
  a room id is therefore collected just by walking out; 8F's sequence first used `f8-repro` and was solved that way.
  Give items their own ids (`f8-repro-record`).
- Another Claude session may be editing the same files. Re-read code before patching and keep
  edits targeted.
