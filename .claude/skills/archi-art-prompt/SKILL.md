---
name: archi-art-prompt
description: Write an image-generation prompt (and the matching PROMPT.md writeup) for a new ARCHI game art asset — a character sprite, animation sheet, background panorama, interactive object sheet, or UI element — so it matches the house style and the technical constraints the game engine depends on. Use this whenever the user asks to create, generate, draw, or design art for ARCHI: new floor backgrounds (옥상, 12층, 7층, 1층, B1, B2), the security robot, phone UI, puzzle UI, new doors/props, or additional player animations — even if they just say "이미지 만들어줘" or "스프라이트 생성" without naming this skill. This skill does NOT call an image model — no image-gen tool is available in Claude Code. It produces the prompt text and integration plan for the user to run in whatever tool they use elsewhere (or for a future session with image-gen access).
---

# ARCHI art prompt writer

ARCHI's existing art (character sprites, the 17층 background, the office interior, the door
sheets) was all produced the same way: someone wrote a careful prompt for an external
`image_gen` tool, ran it there, and dropped the result into `assets/` with a `PROMPT.md`
documenting exactly what was asked for and how the output was wired into the game. This skill
is that same process, minus the "run it" step — Claude Code has no image-gen tool, so the job
here is to produce a prompt good enough to paste into whatever the user is using, plus the
integration math so the result drops into `player.js`/`index.html` without guesswork.

Before writing anything, skim 1-2 existing `PROMPT.md` files for the asset type closest to
what's being requested (see the map at the end of this file) — they're worked examples, and
matching their level of detail matters more than matching this skill's prose.

## Why the constraints exist

Every rule below traces back to something the game engine actually does. Skipping one doesn't
just look inconsistent — it breaks integration:

- **The world has one straight collision floor.** `floorY = 570` in `player.js` is the only
  ground the physics engine knows about. Every door, desk, and character foot line in every
  piece of art has to land on the same baseline in its own canvas coordinates, scaled the same
  way the existing assets were (see "Aligning to y=570" below). A background drawn with a floor
  that dips, rises, or recedes in perspective cannot be aligned at all.
- **Strict orthographic side view, always.** The camera in `render()` only ever translates and
  scales — it never rotates or handles depth. Isometric or perspective art will look wrong the
  instant the camera pans.
- **Sprite sheets are cropped by CSS transforms, not by cutting the image.** `player.js`
  computes `translateX(-index * cellWidth%)` to flip between frames. That only works if every
  cell is an identical square, tightly packed with no gutters, in a single row. Get the cell
  count or aspect ratio wrong and every frame after the first is misaligned.
- **Alpha channel matters by asset type.** Character sprites and interactive overlays (doors)
  need real transparency because they sit on top of other layers; background panoramas need to
  be fully opaque because they sit at the bottom. Getting this backwards produces a checkerboard
  or a black box in-game.
- **Identity has to survive regeneration.** Jeong Suho has to look like the same person across
  every sheet (idle, walk, jump, interact, and whatever comes next). That's what the
  `identity-preserve` use case with a reference image is for — describing him from scratch each
  time drifts the design.

## House style (applies to every asset)

- **Genre/tone**: mystery 80%, horror 20%. Midnight in a Korean software-company tower during a
  power outage. Restrained, desaturated, atmospheric — not jump-scare horror. Check 기획.md for
  the specific floor's story beat (e.g. 옥상 is the emergency-power floor, B2 is the server room)
  so props and mood match what that floor is *for*, not just its name.
- **Rendering**: anime-inspired pixel art, crisp hard-edged pixel clusters, realistic adult
  proportions — never chibi, never soft/painterly. Muted, desaturated palette; cool blue-gray and
  green-gray with small warm accent lights (a desk lamp, an exit sign, a status LED).
- **Camera**: strict orthographic side elevation. No isometric, no vanishing point, no depth.
- **No baked-in UI**: no text, captions, watermarks, borders, or logos in the image. The game
  draws its own labels and hint text on top.
- **Scale reference**: the player sprite renders at 162px tall in-world; doorways are about
  250-300px tall at the same scale. Mention this in every prompt so new art matches existing
  proportions instead of an independently-guessed scale.

## Pick the use case: identity-preserve vs stylized-concept

- **`identity-preserve`** — for Jeong Suho or any other named, recurring character (e.g. a
  future NPC). Attach the existing approved sprite as a reference image and instruct the model to
  faithfully preserve face, proportions, and outfit — the reference is the character, not just a
  style note. See `assets/player/PROMPT.md` for the exact phrasing that's worked before.
- **`stylized-concept`** — for environments, props, doors, and anything without a persistent
  identity. Attach an existing background (e.g. `floor17.png`) as a *style/material/lighting*
  reference only — explicitly tell the model not to copy composition or identity from it. See
  `assets/background/floor17/OFFICE-PROMPT.md` for the pattern of reusing floor17 as a style ref
  for a brand new room.

## Prompt template by asset type

Fill in the bracketed parts; keep everything else's structure, since it's what has reliably
produced usable output before.

### Single character sprite (idle pose, one frame)
```
Use case: identity-preserve.
Asset type: a single player character sprite PNG for ARCHI, a 2D side-scrolling web game.
Input image 1 is the approved [character] reference. Faithfully preserve this exact character's
face, proportions, outfit, and silhouette. No reinterpretation as chibi or simplified geometric art.
[Describe the new pose/action in one or two sentences.]
Style: high-quality pixel art sprite, side-scrolling game-ready, anime-inspired, clean outline,
muted tones, no props beyond what's specified, no environment, no text, no UI, no shadow beyond
minimal grounding, single sprite only.
Delivery: REAL TRANSPARENT ALPHA background, not checkerboard, not white/gray. No floor or cast
shadow. Centered, full body visible, padding on all sides, square canvas, exactly 256x256px
(or an exact nearest-neighbor integer multiple). Empty hands unless props are specified.
```

### Animation sheet (walk/jump/interact — N frames in a row)
```
Use case: identity-preserve.
Asset type: ARCHI 2D side-scrolling pixel-art character sprite sheet.
Reference image is the approved [character] design: [list the preserved identity details —
hair, outfit, badge, etc., copied from the existing character PROMPT.md].
Generate exactly [N] distinct poses facing RIGHT in strict side profile, arranged left to right
in [N] equally sized square cells, [N] columns x 1 row. [Describe each cell's pose in one
sentence per cell — be explicit that poses must be genuinely different, not copies.]
Maintain identical character scale and a shared horizontal hip anchor / foot baseline across all
cells, generous transparent padding, no cropping.
Layout: [N*256]x256 pixels (or an exact integer multiple with the same aspect ratio); each cell
conceptually 256x256 matching the reference sprite.
REAL transparent alpha background throughout, including between limbs. No checkerboard, ground,
shadows, motion trails, captions, text, borders, or extra figures. Output only the sprite sheet.
```

### Background panorama (a corridor, room, or open area)
```
Use case: stylized-concept.
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror
game. This is the actual environment artwork, not a concept poster.
Create ONE [width]x[height] PNG. Strict orthographic SIDE VIEW, camera exactly perpendicular to
the [wall/scene]. NO vanishing point, NO isometric, NO perspective going into the distance.
Setting: [floor name + its story purpose from 기획.md], midnight, restrained atmospheric pixel
art, [dominant palette] with [one or two warm accent lights]. Human sprite on screen is about
162px tall at this scale; door openings about 250-300px tall.
CRITICAL COLLISION GEOMETRY: the continuous, perfectly horizontal top edge of the walkable floor
is at y=[baseline] pixels of this [height]-high canvas, from extreme left to extreme right. All
doorway/prop bottoms sit exactly on this same line. The area below is a flat cutaway floor
foundation only — no perspective floor, no elevation changes.
Composition across width: [break the scene into x-coordinate ranges, each describing what
occupies it — copy the exact object x-positions from the FLOORS config in player.js so the art
lines up with real interactive elements. See "Composition across width" below.]
No people, no monsters, no robots, no foreground furniture blocking the walk lane, no UI, no
border, no watermark, no captions, no large readable lettering. Output only the finished
background.
```

### Interactive object sheet (a door, panel, or similar 2-state prop)
```
Use case: stylized-concept.
Asset type: production game sprite sheet, two states of ONE [object] for ARCHI.
Reference image is style/material/color reference only.
Create a [W]x[H] sheet consisting of EXACTLY TWO equal rectangular cells side by side, each
[W/2]x[H]. Left cell [state A], right cell [state B]. Orthographic straight-on elevation.
Each cell is entirely occupied by the object including its frame: no outside wall, no margins,
no labels, no text, no people. Identical frame position/dimensions across both states; only the
interior changes. Full-bleed opaque rectangles (this asset is drawn OVER existing background art,
so it must be fully opaque, not transparent).
[Describe the object and both states in 2-3 sentences, matching the palette/material of
assets/objects/floor17/PROMPT.md.]
```

### UI element (phone screen, puzzle console, HUD piece)
UI elements aren't image_gen'd the way world art is — check whether it can just be built with
CSS/DOM first (ARCHI's existing HUD, hints, and buttons are all plain HTML/CSS, no images). Only
write an art prompt for a UI piece that genuinely needs illustrated texture (e.g. a phone bezel,
a keypad's worn metal). If so, follow the interactive-object-sheet template and note explicitly
which states/frames are needed and where the game will overlay live DOM text on top.

## Composition across width

For wide panoramas, describe the prompt in x-coordinate ranges rather than vague spatial words
("on the left", "further along") — and make those ranges match the real positions of doors,
elevators, and obstacles defined for that floor in `player.js` (the `FLOORS` config, or the
`officeDoors`/`doors` arrays for 17층). This is what makes a generated background actually usable
as a hallway you can walk and interact in, instead of art that has to be worked around.

Example from the existing 17층 prompt (`assets/background/floor17/PROMPT.md`):
```
x=0..450: cool window to a distant lit city, unoccupied developer workspace...
x=450..1100: first two office entrances, glass walls with desks behind them...
x=1800..2550: THREE distinct closed metal elevator doors in a row...
x=2550..2900: emergency evacuation notice board and one closed stairwell fire door...
```
Note the canvas in that example is 3072px wide before export/cropping to the in-game 3200px
world — always state the source canvas size and let the PROMPT.md's export section record the
scaling/alignment math, the same way `floor17/PROMPT.md` and `OFFICE-PROMPT.md` do.

## Aligning to y=570 (or any other in-game baseline)

The floor/door baseline in-game is a fixed pixel row (`floorY` in `player.js`, currently 570).
Generated art rarely comes out with its floor already on that exact row, so the existing assets
record a small alignment step in their PROMPT.md, e.g.:

> 원본 바닥선 y=391을 게임의 충돌 바닥선 y=570에 정렬했다.

When writing the integration notes for a new asset, work out and record: the source image's
floor-line y-coordinate, the scale factor applied (if the asset is resized), and the resulting
offset used in the CSS (`top`, `height`, or a transform) so the art's floor lands exactly on
`floorY` in-game. Do the arithmetic explicitly — don't leave it as "adjust until it looks right."

## After generating: write the PROMPT.md

Every asset folder in this repo documents itself. Once art exists (generated by the user
elsewhere and dropped into `assets/...`), write a `PROMPT.md` next to it with these sections,
matching the existing files:

1. **Header line(s)**: tool used (`내장 image_gen` or whatever was actually used), what the asset
   depicts.
2. **File list**: every output file with its exact pixel dimensions and format.
3. **Integration**: how it's positioned/scaled/aligned in the game — the actual math, referencing
   the relevant `player.js` constants or `index.html` selectors, so a future reader (human or
   Claude) can regenerate or resize the asset without re-deriving alignment from scratch.
4. **생성 프롬프트 / Generation prompt**: the literal prompt text used, in a fenced code block, so
   it can be regenerated or tweaked later.

## Worked examples in this repo

Read the closest match before writing a new prompt:

- Single sprite: `assets/player/PROMPT.md`
- Animation sheet (6-frame walk): `assets/player/WALK-PROMPT.md`
- Animation sheet (2-frame jump/fall, 2-frame interact): `assets/player/ACTION-PROMPTS.md`
- Wide background panorama with composition-across-width: `assets/background/floor17/PROMPT.md`
- A second room reusing the first as a style reference: `assets/background/floor17/OFFICE-PROMPT.md`
- Two-state interactive object sheet (elevator/stairs doors): `assets/objects/floor17/PROMPT.md`

For the floors added in the multi-floor travel feature (옥상, 12층, 7층, 1층, B1, B2 — see the
`FLOORS` config in `player.js`), there is no background art yet; those floors currently render as
a flat CSS color with simple box props as a placeholder. That's the most likely next use of this
skill — check `player.js`'s `FLOORS` array for each floor's width, obstacle layout, and elevator
positions so a new background lines up with what's already interactive.
