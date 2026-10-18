# Jeong Suho Run Sprites

Current runtime: `jeong-suho-run-sixteen.png`, 4096×256, with eight intact original whole-body poses plus one new midpoint between poses 0 and 1. The midpoint replaces timing cell 1; all other cells retain their original whole-body artwork. See [midpoint source and prompt](RUN-MID-01-PROMPT.md) and [movement sources](movement-inbetweens-source/README.md).

The separate torso/arm composite and mismatched in-between artwork are no longer used. Heads, torsos and arms retain their original artwork. Malformed overlapping lower legs and doubled shoe/heel profiles are corrected below the hips; see [current leg-correction sources and prompts](MOVEMENT-LEGS-FIX-PROMPTS.md).

Forward-shoe corrections are applied during export to original normal-run poses 0/3/7 and phone-run pose 0. Only the front ankle/shoe rectangle is replaced; the body, rear foot, timing and new midpoint are preserved. See [shoe correction sources and prompt](RUN-SHOE-FIX-PROMPT.md).

- Tool: built-in `image_gen`.
- Identity reference: `jeong-suho.png`.
- Output: `jeong-suho-run-six.png`, 1536x1024 RGBA PNG.
- Grid: 3 columns x 2 rows, 512x512 per cell, row-major order 0..5.
- Intended cycle: contact, compression/push-off, flight, opposite contact, opposite push-off, flight.
- Preserved six-frame sheet: `jeong-suho-run.png`, 1536x256 RGBA PNG.
- Runtime: `jeong-suho-run-eight.png`, 2048x256 RGBA PNG, eight horizontal 256x256 cells.
- Added source: `jeong-suho-run-extra.png`, 1774x887 RGBA, two near-landing poses. Order: original 0,1,2, extra 0, original 3,4,5, extra 1. Original six cells are copied pixel-for-pixel.
- Added pose generation and refinement prompts: [RUN-EXTRA-PROMPT.md](RUN-EXTRA-PROMPT.md).
- Preparation: `scripts/prepare-run.ps1` at the project root. Preserves the source, uses nearest-neighbor scaling (0.47), aligns measured hip anchors to x=128 and contact feet to y=239; flight frames retain their clearance.
- The two added poses use scale 0.285, hip anchors x=450/448 mapped to x=128, and source bottom y=808/806 mapped to y=232 (just above ground).
- Connected to either Shift key plus movement. Walking is 200px/s; running is 340px/s. The current sixteen-frame sheet advances once per 18px of grounded movement: 288px per cycle, about 0.847 seconds. The original eight-frame artwork below is archived.
- Shift release returns to walking; stationary/blocked movement is idle, airborne movement uses jump/fall. Blur and scene transitions clear sprint input.
- Transparent background samples were verified numerically. Preserve the generated alpha channel.

## Generation Prompt

Use case: identity-preserve.
Asset: production RUN ANIMATION sprite sheet for Jeong Suho in ARCHI, a 2D side-scrolling Korean office mystery game.
The reference image is the approved character identity. Preserve exact slim adult proportions, messy black hair, pale tired face, white rolled-sleeve shirt, loose black tie, dark ID lanyard and badge, black trousers, gray-white sneakers. Crisp detailed muted anime pixel art matching reference. Empty hands, no added props. Every pose faces RIGHT, strict side profile.
Create exactly SIX genuinely distinct sequential poses of a complete alternating RUN cycle, arranged in a precise THREE COLUMNS by TWO ROWS grid of equal square cells. Read top row left to right then bottom row left to right. Unlike walking, use forward leaning torso, bent elbows, stronger arm counter-swing, high knee recovery, rear heel lifted toward hip, and clear airborne flight phases.
1 near foot contacts ground ahead of hip, far knee folded back, near arm back.
2 near leg compresses then pushes off under hip, far knee drives forward, arms counter-swing.
3 airborne flight, far knee forward and high, near heel folded behind; no foot on ground.
4 far foot contacts ahead of hip, near knee folded back, opposite arms to frame 1.
5 far leg compresses then pushes off, near knee drives forward.
6 airborne flight, near knee forward and high, far heel folded behind; flows smoothly into frame 1.
Run IN PLACE: same body size, horizontal hip anchor at each cell center; same theoretical ground baseline at 90 percent cell height. Grounded feet align to baseline, airborne feet are above it. Restrained natural vertical bob, no lateral drifting or changing body proportions. Tie and ID trail subtly backwards, not exaggerated. Full body visible in every cell with generous transparent padding including toes, hair and swinging elbows. No overlaps between cells.
Layout 3x2, full sheet aspect ratio 3:2. REAL transparent alpha empty background including between limbs. No baked checkerboard, no floor, no cast shadows, no speed lines, no motion blur, no text, no frame numbers, no borders, no duplicate characters beyond the six required frames. Output only the sprite sheet.

## Refinement Prompt

Edit this exact six-frame character run sprite sheet. Remove ALL background and ALL gray/brown blurry halos around every character. Every pixel outside the crisp character silhouette must be truly transparent alpha=0, including gaps between arms, torso and legs. Preserve the character artwork, all six poses, their exact positions, size, grid layout THREE columns by TWO rows, canvas aspect ratio 3:2, outfit colors and fine pixel edges. Do not draw a new backdrop or checkerboard. Do not add any glow, shadow, haze, gradient, outline fringe or floor. Output a clean isolated transparent PNG sprite sheet only.
