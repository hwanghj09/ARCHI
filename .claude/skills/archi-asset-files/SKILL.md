---
name: archi-asset-files
description: Keep ARCHI's assets folder organized. Use this whenever the user adds, moves, replaces or cleans up art for the game, e.g. hands over a zip or folder of assets ("이 에셋 적용해줘", "zip 풀어서 넣어줘", "에셋 정리해줘", "안 쓰는 파일 지워줘"), and whenever archi-floor-walls or archi-floor-doors need an asset: they look it up through the layout below instead of a fixed kit path. It says where each kind of file belongs (floor backgrounds in assets/background/floorNN, shared wall modules in assets/background/wall, every door in assets/objects), how to file a new delivery, and how to find and remove unused files safely.
---

# ARCHI asset files

The user organized `assets/` on 2026-10-10 and wants it kept that way. When assets arrive or change, file them by the
rules below; the wall and door skills read assets from these places.

## Layout

| Path | Holds |
| --- | --- |
| `assets/background/floorNN/` | Everything for floor NN's backgrounds: the user's source painting + `PROMPT.md` + `floorNN-paint-source.zip`, `build.py`, `GENERATED.md`, generated room interiors (and 2F ceiling/floor layers), `walls-layout.json`, `walls.png`, glass-view crops `behind-*.png` |
| `assets/background/wall/` | Shared corridor wall modules (`wall-concrete`, `wall-glass`, `wall-frosted`, `wall-glass-mixed`, `pilaster`, each with `@2x`), `compose_floor.py`, `make_walls_v3.py`, `README.md` |
| `assets/background/cutaway_kit.py` | Shared build tool used by the floors' `build.py` |
| `assets/objects/doors/` | Door art shared by several floors (glass single/auto doors per glass type, white solid doors), `source/` generator scripts, `README.md` |
| `assets/objects/floorNN/` | Floor NN's objects: the game's door sprites `door-<room>.png` (shut \| open), their single-frame originals `source/door-<room>.png`, other floor-specific objects (e.g. `harmony-hall-poster.png`) |
| `assets/objects/floor-kit/` | Props (`manifest.json`) |
| other `assets/background/*` (elevator, floor12, floor16, floor17, roof, rooftop) | Untouched unless the user asks |

Floor folders use two digits (`floor02`, `floor10`); basements `floorb1` style is not in use yet, ask before inventing.

## Adding assets

1. Unzip a delivery into the scratchpad (never straight into `assets/`), read its README, and list what each file is.
2. File each file by kind and floor:
   - a floor's background painting, prompt, paint source, previews needed for rebuilding → `assets/background/floorNN/`;
   - wall modules or wall scripts → `assets/background/wall/` (same names replace the old modules; recompose every floor
     that uses them and check they still look right);
   - **any door image** (door sets, per-room doors, door sprites) → `assets/objects/` — shared sets in
     `assets/objects/doors/`, a room's original in `assets/objects/floorNN/source/`, the built sprite in
     `assets/objects/floorNN/`;
   - other objects for one floor (posters, boards) → `assets/objects/floorNN/`; props → `assets/objects/floor-kit/`.
3. Keep only what is used or needed to rebuild. Do not keep kit folders, duplicate copies, zips, comparison/preview
   images or example folders inside `assets/` (the floors' `floorNN-paint-source.zip` are kept: the user wants them).
4. Point code at the filed paths (`js/floors/floor-NN.js`, `index.html` CSS, `tests/elevator.mjs`, `build.py` outputs),
   and record what came from where in the floor's `GENERATED.md` (and `assets/objects/doors/README.md` for shared doors).

## Cleaning up

1. Find what the game loads: `python .claude/skills/archi-asset-files/scripts/used_assets.py 2 3 4` (floors). It builds
   every corridor and room in headless Chrome and prints USED, MISSING and UNUSED / KEEP-INPUT images for those floors.
   MISSING must be empty after any move.
2. Also grep `js`, `index.html`, `tests`, every `build.py` and the skills for a path before deleting or moving it; a
   `build.py` that still writes or reads a removed file must be edited so a rebuild does not bring it back (and its
   in-use outputs must come out the same; compare with a backup copy).
3. Most of `assets/` is untracked in git, so deletions are permanent. When it is unclear whether something counts as
   unused (kit folders, sources, zips), ask the user with the concrete list before deleting.
4. Only touch the floors the user names (7F and 11F..17F, B1, B2 stay as they are unless asked).

## Verify

- `used_assets.py` shows no MISSING, and screenshots of changed floors look the same
  (`python .claude/skills/archi-floor-walls/scripts/shot.py <scratch> fNN@x ...`, errors `[]`).
- `tests/elevator.mjs` still parses (load it in headless Chrome as an async function body) after path edits.
