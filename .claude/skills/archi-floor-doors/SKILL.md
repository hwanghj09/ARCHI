---
name: archi-floor-doors
description: Give an ARCHI floor's room doors their artwork from the organized door assets in assets/objects (shared glass and white doors in assets/objects/doors, each floor's door originals and sprites in assets/objects/floorNN). Use this whenever the user says "N층을 구현해줘", "N층 구현", "N층 만들어줘", "N층 문 바꿔줘", "문 에셋 적용해줘" or asks to fix how a floor's doors look, together with archi-floor-builder (rooms, clues, tests), archi-floor-walls (corridor walls) and archi-asset-files (where assets live). The door must suit its wall: a glass wall gets a glass door of the same glass, a plain wall gets a door that fits the room; it becomes the game's two-frame shut|open sprite (130x320, auto doors 240x320).
---

# ARCHI floor doors

Room doors are picked to suit the wall they stand in. Corridor walls come from **archi-floor-walls**; rooms, clues and
tests from **archi-floor-builder**; where every asset lives from **archi-asset-files**. Read them.

## Where the assets are

Do not hard-code a kit folder. Use the organized `assets/objects/` (archi-asset-files):
- `assets/objects/doors/` — shared door art with the wall-brightness filter baked in (see its README):
  - `door-glass-{mixed,clear,frosted}-single.png` (520×1280 = 130×320);
  - `door-glass-{mixed,clear,frosted}-auto.png` (960×1280 = one glass panel, 240×320, motor box on top);
  - `door-solid-vision.png`, `door-solid-plain.png` (white doors for the plain wall);
  - `source/`: generators (`make_doors_matched.py` for walls-matched doors, `doors.py`/`doorkit.py` for room-themed doors).
- `assets/objects/floorNN/source/door-<room>.png` — the original chosen for each room (single frame, 4×).
- `assets/objects/floorNN/door-<room>.png` — the game's sprite (shut | open).
- Other floors' door art (`assets/objects/floor13`..`floor17`, `assets/objects/floorNN/source/`) can be reused.
- New door art from the user is filed with archi-asset-files first (always under `assets/objects/`).

## Which door for which wall

Read the room's wall in `assets/background/floorNN/walls-layout.json`.

| Wall | Door |
| --- | --- |
| `wall-glass-mixed` | `doors/door-glass-mixed-single` or `-auto` |
| `wall-glass` | `doors/door-glass-clear-single` or `-auto` |
| `wall-frosted` | `doors/door-glass-frosted-single` or `-auto` |
| `wall-concrete` (white plain wall) | a door that fits the room: reuse a room-themed door already in `assets/objects` (e.g. 2F Harmony Hall wood, 2F/3F/5F steel doors in `floorNN/source/`), or `doors/door-solid-vision` / `door-solid-plain` for ordinary offices; if nothing fits, make one with `doors/source/doors.py` (room-themed kit) or ask |

Type for glass doors: `single` for offices, lounges and meeting rooms; `auto` for gyms and busy work areas.

Current picks (keep them unless the user asks): 2F Harmony Hall themed wood, 직원 휴게실 mixed single, 서버실 themed steel;
3F Fitness Club clear auto, 고객만족센터 mixed single, Studio themed steel; 4F 업무 공간 mixed single, 개발자 구역 clear
single, 연구 회의실 frosted single; 5F 연구개발실 mixed auto, 기술연구실 themed steel, 회의실 frosted single; 6F 업무 공간
mixed auto, 엔지니어링 white solid-vision, 기술 회의실 mixed single.

## Recipe

1. Copy the chosen door to `assets/objects/floorNN/source/door-<room-id>.png`.
2. Flush base (the user asked for this on every walls-matched door): no kick block bulging over the frame, and the
   wall's own dark skirting runs under the door.
   `python .claude/skills/archi-floor-doors/scripts/flush_door_base.py <source> <tmp> --no-kick` for glass doors (single
   and auto); without `--no-kick` for the white solid doors. It replaces the leaves' bottom rail and kick block (world y
   ~530..556) with glass and posts running down to a thin frame line, and makes y 556..570 transparent. Room-themed
   doors on plain walls keep their painted kick plates unless the user asks.
3. Sprite into `assets/objects/floorNN/door-<room-id>.png`:
   single / white / themed → `make_door_sprite.py <in> <out>` (`--double` for a themed double door);
   auto → `make_door_sprite.py <in> <out> --double --top 0.075` (keeps the motor box). Transparent rows stay transparent.
4. Position (`doorY: 250`, height 320 under the bulkhead):
   - glass single: `doorWidth: 130`, `doorX = S + 240×k + 55` (centred in a glass panel; S = the wall segment's x);
   - glass auto: `doorWidth: 240`, `doorX = S + 240×k` (exactly one panel);
   - plain wall: `doorWidth: 130`, anywhere in the room front.
   Then check: the box is inside the room front; its hint zone (box ±28) clears the core (left zone ≤1790, right zone
   ≥4282, ≤4940) and the other door; inside, the exit (recomputed from doorX by `exitDoorX`) stays ≥56px from every
   clue. If not, try another k or shift a few px within the panel.
5. Set `doorSprite: 'assets/objects/floorNN/door-<room-id>.png'`, `doorWidth`, `doorX`, `doorY: 250`; remove `doorStyle`.
6. Tests (`checkFloorNN`): `await checkSpriteDoors(['door-<a>.png', 'door-<b>.png', 'door-<c>.png'], 1280);` and the new
   exit x values.
7. Verify without Node: `python .claude/skills/archi-floor-walls/scripts/shot.py <scratch> fNN@<door x> fNN-<room>@<exit x>`
   (errors `[]`; the door's bottom meets the skirting, top under the bulkhead), and
   `python .claude/skills/archi-asset-files/scripts/used_assets.py NN` shows no MISSING and no UNUSED door.
8. Record each room's door (source, type, doorX, width) in `assets/background/floorNN/GENERATED.md`.

## Notes

- Large door art is scaled down by the browser; leave `image-rendering` at its default.
- The walls-matched doors already include the wall filter; do not recolour or darken them per floor.
- The 3F tenant board art was removed in the 2026-10-10 cleanup (unused); the board is still the CSS fixture.
