---
name: archi-wall-vent
description: Place ARCHI's hide-in wall vents (덮개가 떨어진 환풍구, 앉아서 E로 들어가 로봇을 피하는 곳) on floors' corridors and in fitting rooms, and compose the outside view seen from inside each vent. Use this whenever the user says "환풍구 배치해줘", "N층에 환풍구 넣어줘", "방에 환풍구", "숨을 곳 만들어줘", "로봇 피할 공간", "환풍구 안 배경 바꿔줘" or asks to add, move, remove or check vents, together with archi-floor-builder (floor configs and tests) and archi-asset-files (where the vent art lives). Two rules are mandatory: every vent's outside view (viewX) is chosen with care and checked in screenshots, and vents only go where they suit the floor and room — one per corridor, rooms only when they fit, never every room.
---

# ARCHI wall vents (숨는 환풍구)

A vent is a floor-config fixture. It starts with its louvre cover screwed on. Without the crowbar (`f17-crowbar`, 17F
manager's tool locker) E only inspects it. With the crowbar, E starts prying: Suho crouches on the vent's right, wedges
the crowbar under the cover's lower-right corner and plays a Dead-by-Daylight style skill check. A red needle sweeps
a circle from 12 o'clock very fast: one turn every 0.7 s, so the zone gives about 0.1 s, a pure reaction test. He
presses Space/Enter (or E, or the button on mobile) while it is in the white zone. Hitting the small yellow "perfect" part at the zone's leading edge opens it at once;
the white part needs two hits, not necessarily in a row. Pressing outside the zone, or letting the needle pass it,
fails and a new zone comes shortly after; earned hits are kept. Robots keep patrolling and can catch him because he
is not hidden. When enough hits are in, the cover drops to the floor on the left and the hole stays open (saved). Then crouch
(Ctrl) in front of it and press E: the screen fades like the elevator and Suho hides in the duct. Robots cannot see or catch him there and a chasing one gives up. The duct screen shows the
corridor or room outside through the hole, with the nearest robot passing in front (drawn twice its size). E leaves.

**Two rules you must keep, every time:**
1. **The outside view is designed, not left to chance.** Pick each vent's `viewX` by looking at the scene's background
   art, then confirm it in screenshots, both lit and in blackout, with a robot passing (see "Choose the outside view").
2. **Vents go where they fit.** Every corridor (복도) gets exactly one vent. A room gets one only when a vent belongs
   there. Do not fill every room (see "Where vents fit").

## How it works (do not re-implement)

| Piece | Where |
| --- | --- |
| Vent art (closed, prying, open, fallen cover, crowbar), duct screen `duct-view.png` + generator | `assets/objects/wall-vent/` (README) |
| Fixture → interactable `type: 'vent'`, dressed closed/open on build | `js/scene/scene-builder.js` (fixtures loop, `hideSpot`) → `dressVent` |
| Prying: crowbar, skill-check dial, cover falling, saved as `vent-open:<scene>@<x>` in `collectedItems` | `js/interaction/vent-pry.js`, `#vent-pry-gauge` |
| Hints "E · 환풍구 조사" / "E · 빠루로 덮개 뜯기" / "Ctrl · 앉아서 들어가기" / "E · 환풍구에 숨기" | `js/interaction/interaction.js` |
| Skill-check keys (Space/Enter, Esc or a move key stops) | `js/input/keyboard.js` |
| Hiding state, duct screen, outside view, robot copy | `js/scene/guard-patrol.js` (`setVentHiding`, `updateVentView`, `playerHidden`) |
| World keeps running while hidden | `js/core/loop.js` (`hidingInVent` branch) |
| Duct screen DOM / CSS | `index.html` `#vent-view`, `css/guard-patrol.css` |
| Behaviour + layout-rule test | `tests/wall-vent.mjs` |

The outside view is the opposite wall. It clones the scene's wall layers in world coordinates: the background images
(one for corridors; ceiling, floor and wall layers for rooms), the painted interior wall (`.painted-wall`, the navy
steel/brass-rail panels most corridors and many rooms actually show, `js/floors/background-art.js`) and exterior
windows. Doors, elevators, props and fixtures are left out, and the painted wall is re-clipped **without** door, elevator
or stairs openings so they read as plain wall. Glass fronts (`preserve`) and pillars keep their original art. It
shows the band nearest the floor: 380 world px high, floor line at 80% of the hole. That is about **520 world px
wide, centred on `viewX`, world y 266–646**. The art under the painted wall (e.g. white `walls.png`) is not what the
player sees, so judge views from screenshots, not from the raw background file.

## The fixture

Add it with the helper `wallVent(x, viewX, extra)` (`js/floors/helpers.js`) to the scene's `fixtures` in
`js/floors/floor-NN.js` (the corridor layout, or the room's fixture list). Create `fixtures: [...]` if the layout has
none:

```js
// 숨는 환풍구(<어디: 벽·옆 문>). 안에서는 <무엇이 보이는지>가 보인다.
wallVent(3900, 2500),
wallVent(3777, 2500, { pryFrom: 'left' }), // 덮개가 오른쪽으로 떨어진다
```

- Size and height are fixed (132×108 at y 454): the 120×96 hole fits a crouching Suho (96 px tall) with its bottom at
  y 556, just above the floor strip. Never resize or raise it.
- Prying needs room on both sides. By default Suho crouches on the **right** (90 px, free of props; standing briefly in
  front of a door is fine) and the cover falls to the **left** (120 px, free of doors and props: it stays there).
  `pryFrom: 'left'` mirrors both. Use it when one side is a door, e.g. right next to the restroom door.
- The open state is keyed by scene id and `x` (`vent-open:<scene>@<x>`). Moving a placed vent's `x` closes it again in
  existing saves. That is fine before release, but mention it to the user.
- Write the comment line saying what the view shows. That is how the next person knows `viewX` was chosen, not guessed.

## Where vents fit

**Corridors: one each, 2F–16F and B1.** The user decided that **1F and B2 have no vents** (R-01's lobby and the ending
chase). Do not add any there. The 17F corridor is built separately (`js/world/corridor17.js`) and cannot take a vent.

Pick the spot on the corridor wall:
- on a **plain/concrete wall stretch** (`assets/background/floorNN/walls-layout.json`: `fill` or a `wall-concrete`
  segment). Never on glass fronts (`wall-glass*`, `wall-frosted`): you would see into the room through a vent;
- at least 20 px clear of every door, elevator, stairs, restroom door, inspect fixture and wall sign, and not
  behind a prop (`props`) or painted object;
- somewhere the player passes while R-03 patrols: between rooms or near the core, not at a dead end the robot never
  reaches. Spread positions across floors where the walls allow.
- If no stretch fits, you may nudge **decorative** props (planters, sofas, display cabinets, water coolers; never
  anything with `name`/`message`/`gives`) 100–200 px. The user approved this for 4F, 11F, 13F and 16F. Note the old x
  in a comment.

Finding spots by hand is slow. Build each corridor in headless Chrome and collect blockers: `currentDoors`,
`.floor-prop` / `.fixture` elements reaching below y 440, and solids. Add the glass segments from `walls-layout.json`.
Then list the x values where the vent body avoids glass and blockers (±20) and both prying sides are free. The 2026-10
placement did exactly this. Then confirm with the screenshots below.

**Rooms: only where a vent belongs.** Good: maintenance, storage, server and electrical rooms, archives, large open
offices with a free wall, kitchens/back rooms. A vent is a hiding place, so it suits rooms R-03 can follow Suho into
(it follows through any door). Skip: tiny rooms, rooms whose back wall is glass or windows at floor level, restrooms,
showpiece rooms (VIP, boardrooms, lobbies) unless the user asks, puzzle rooms where a hiding spot would trivialise the
puzzle, and rooms whose painted furniture covers the lower wall everywhere. In rooms the art includes furniture: the
vent must sit on a visible bare stretch of wall, not on desks, shelves or cabinets. Check the `-wall.png` shot.
Aim for roughly one room vent every two or three floors, chosen for fit. When unsure, propose the list to the user
before writing it. Shoot the whole room first (viewport ~3300×720, `cameraX = 0`) to see where the painted furniture
leaves bare wall. 2026-10: of the six rooms the user picked, only 6F 공용 엔지니어링 구역 and 13F 장비 검증실 had bare
wall. The desk/rack rooms (2F 서버실, 4F 연구개발 업무 공간, 8F QA 시험실, 10F 경영관리 사무실) were left without one;
the user does not want other hiding spots (under desks etc.).

## Choose the outside view (`viewX`)

1. Look at what the player actually sees on that wall. Use a screenshot, not the raw background file: most scenes are
   painted over by `background-art.js`. Rooms: shoot the whole room.
2. Pick the 520 px window (`viewX ± 260`, lower half of the wall down to the floor) that reads best from a duct at floor
   level:
   - something **recognisable and calm**: steel panels with the brass rail, a white pillar at one side for depth (most
     corridors have pillars at 1040/1080/1770/4282), B1's piped concrete, 15F's green lab panels, 7F's night window,
     12F's steel door, a cabinet row or bench painted in a room;
   - **contrast for the robot**: the ivory/black robot must stand out. Avoid glass fronts (`preserve` in
     `background-art.js`), which turn into a dark smear in blackout; 8F and 14F were moved off them;
   - not the vent's own neighbourhood if that is cluttered. `viewX` is free; it does not have to be the vent's x;
   - stay inside the art: `260 ≤ viewX ≤ art width − 260` (the test enforces it).
3. Shoot it (below) and look at `-lit.png` and `-dark.png`. If the view is empty, muddy, or the robot is hard to read,
   move `viewX` and shoot again. Keep the comment line in the config in sync.

## Verify (always)

```
node .claude/skills/archi-wall-vent/scripts/vent-view.mjs <scratchpad>/vents f5 f5-rnd ...
```

For every vent in each listed scene it writes `<scene>-vent<i>-wall.png` (crouched in front of the closed cover, the
placement), `-open.png` (after prying: the hole and the cover lying on the left), `-lit.png` (inside, lights on) and
`-dark.png` (inside, blackout, R-03 right in front, drawn 2× size). It
prints vent counts and page errors (must be `[]`). Read every image before reporting. Show the user the inside shots
when they asked to see them.

For many vents, make contact sheets: crop each `-open.png` around the vent and each `-lit`/`-dark` around the hole
(about 640×470 from (320,180)), then tile them four across.

Then run `node tests/wall-vent.mjs`. It checks hiding and leaving, and the layout rules for every vent in every scene:
fixed size, inside the walls, clear of doors and inspect targets, free cover side (doors and props) and crouch side
(props), one per corridor, `viewX` inside the art, none on 17F. Also run the robot tests when placement is near the core: `tests/roaming-guard.mjs`, `tests/guard-regression.mjs`.

Finally note new placements in `assets/objects/wall-vent/README.md` ("게임 적용" list: floor, x, viewX and what it
shows).
