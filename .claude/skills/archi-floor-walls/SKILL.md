---
name: archi-floor-walls
description: Implement an ARCHI floor's corridor walls from the shared wall modules in assets/background/wall. Use this whenever the user says "N층을 구현해줘", "N층 구현", "N층 만들어줘", "N층 벽 바꿔줘" or asks to build or redo a floor's look, together with archi-floor-builder (rooms, clues, mechanics, tests), archi-floor-doors (room doors) and archi-asset-files (where assets live). It composes one full-height walls-only corridor background per floor (white plain wall, clear, frosted or mixed glass per room, pilasters, shared ceiling and floor) that matches the team's 16F, restroom and elevator art.
---

# ARCHI floor walls

When the user asks to implement a floor ("N층을 구현해줘"), build its corridor look from the shared wall modules. Room
layout, clues, mechanics and tests follow **archi-floor-builder**; room doors follow **archi-floor-doors**; where every
asset lives follows **archi-asset-files**. Read them.

## Where the assets are

Do not hard-code a kit folder. Use the organized `assets/` (archi-asset-files):
- Wall modules: **`assets/background/wall/`** by default (`wall-concrete`, `wall-glass`, `wall-frosted`,
  `wall-glass-mixed`, `pilaster`, `@2x`, `compose_floor.py`, `README.md`). Read its README first.
- The floor's own files: `assets/background/floorNN/` (source painting for glass views, `walls-layout.json`, `walls.png`,
  `behind-*.png`).
- If the user delivers new wall art, file it with archi-asset-files first (same names replace the modules in
  `assets/background/wall/`), then recompose every floor that uses them.

Do not edit the modules or `compose_floor.py`; to change a module, regenerate it with `make_walls_v3.py` (needs scipy)
and say so.

## The modules

Every module is a full-height slice of the corridor, 480×752 @1x (pilaster 48×752), top = world y 0, floor line y=570:

| y | part |
| --- | --- |
| 0..48 | ceiling with recessed downlights |
| 48..96 | bulkhead band (same on every module) |
| 96..556 | wall; plain-wall joint and glass transom at the door line y=250, film edge y=330 |
| 556..570 | skirting |
| 570..752 | glossy floor |

| Module | Use for | Behind image |
| --- | --- | --- |
| `wall-concrete` | the white plain wall: default everywhere; server rooms, vaults, executive rooms, halls, studios | no |
| `wall-frosted` | private rooms that should glow but hide detail (meeting rooms, labs) | optional |
| `wall-glass-mixed` | lounges, cafés, team offices (clear above y=330, film below) | yes |
| `wall-glass` | gyms, showrooms, open offices that must be seen into | yes, required |
| `pilaster` | added automatically at both ends of every segment | — |

Default choice when the user does not say: keep what the floor already uses (its `walls-layout.json`); for a new floor,
corridor and plain rooms `wall-concrete`, lounges, cafés and team offices `wall-glass-mixed`, meeting rooms
`wall-frosted`, gyms and open work areas `wall-glass`. If a room's type is unclear, ask before composing. Every glass
wall gets a glass door of the same glass (archi-floor-doors).

## Recipe

1. Read `js/floors/floor-NN.js`: the floor width is 5000 (`BUILDING_CORE`), and each room's `x`/`width` is its
   segment. Keep the fixed core (elevators 1818..2660, stairs 2906..3086, restroom 3556..4282) as plain fill; the game
   draws the elevators, stair door and restroom door on top.
2. Behind images for glass segments (walls mode hides the CSS room interiors, so the view through the glass is baked in):
   - cutaway floors (`assets/background/floorNN/<painting>.png`, floor line 438): crop the painted room with
     `python .claude/skills/archi-floor-walls/scripts/crop_behind.py <painting.png> <source_x> <segment_width>
     assets/background/floorNN/behind-<a|b|c>.png` and set `"behind_floor_y": 438`;
   - floors with interior art: crop it the same way with that image's floor line;
   - no art: do not use `wall-glass` (dark void); use `wall-frosted` or `wall-concrete`.
3. Write `assets/background/floorNN/walls-layout.json` (paths relative to the json):
   ```json
   { "modules": "../wall", "width": 5000, "fill": "wall-concrete",
     "segments": [
       {"x": 40, "width": 1000, "wall": "wall-concrete"},
       {"x": 1080, "width": 690, "wall": "wall-glass-mixed", "behind": "behind-b.png", "behind_floor_y": 438}
     ] }
   ```
4. Compose from the repo root:
   `python assets/background/wall/compose_floor.py assets/background/floorNN/walls-layout.json assets/background/floorNN/walls.png`
5. In `floor-NN.js`, the corridor background is just:
   ```js
   backgroundWallsOnly: true,
   backgroundImage: { src: 'assets/background/floorNN/walls.png', height: 752, top: 0 },
   ```
   Leave room interiors, fixtures and props alone unless the user asks. Doors are drawn by the game, never baked into
   the walls (archi-floor-doors, y=250, height 320). Corridor `art-spot` fixtures that pointed at painted details now sit
   on plain wall: turn them into a panel (`wall-notice`) or a prop, and say which.
6. Signs and doors: the shared rule in `index.html` (themes concert, gym, rnd, archive, oncall) puts room signs just
   under the bulkhead band and the restroom sign over its door, and gives the restroom the 16F door art. Add the
   floor's theme to that `:is(...)` list for a new floor.
7. Tests: in `checkFloorNN` (tests/elevator.mjs) use `await checkWallsV3('floorNN/walls.png');` for the corridor.
8. Verify without Node: `python .claude/skills/archi-floor-walls/scripts/shot.py <scratch_dir> fNN@1000 fNN@2400 fNN@4600`
   and look at the PNGs; every line's script errors must be `[]`. Then
   `python .claude/skills/archi-asset-files/scripts/used_assets.py NN` must show no MISSING.
9. Record the modules per room and the behind crops (with source x) in the floor's `GENERATED.md`; keep `README.md`
   and the current `N차 작업.md` (archi-work-log) in step. No unused files left behind (archi-asset-files).

## Notes

- Brightness: the game applies `brightness(.72) saturate(.85)` to walls-mode backgrounds; the white wall (~222) lands
  near ~160 in game. Do not add extra darkening or tinting per floor.
- Room segments narrower than a module are cropped by `compose_floor.py`; very narrow rooms (< 200px) look better as
  `wall-concrete`.
- 2F..6F and 8F..10F use these modules now.
