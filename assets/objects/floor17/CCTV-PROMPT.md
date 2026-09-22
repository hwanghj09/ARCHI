# CCTV patrol sprites

- Tool: built-in image_gen.
- Reference: ../../background/floor17/floor17.png, CCTV above the notice board.
- Output: cctv-patrol.png, original 2172x724 RGBA PNG with transparent background.
- Layout: three 724x724 cells, left-facing, forward-facing, right-facing.
- Intended patrol order: 0, 1, 2, 1, repeat.
- Asset-only delivery; the current background CCTV and gameplay remain unchanged.
- Generated mounting anchors still vary between cells. Align each frame to the wall plate before runtime animation, or separate the fixed mount from the moving housing during integration.

## Initial prompt

Use case: stylized-concept.
Asset type: production transparent CCTV PATROL sprite sheet for ARCHI, a 2D side-scrolling office mystery game.
Reference image 1 is the approved background. Specifically reference the small dark rectangular CCTV camera mounted high on the wall above the notice board, just LEFT of the elevator bank. Extract its visual design into a reusable standalone prop: compact charcoal-black rectangular bullet-camera housing, short metal swivel bracket and small wall mounting plate, recessed dark glass lens, a tiny red power LED. Preserve the restrained realistic pixel-art style, muted gray-green highlights, subtly worn industrial metal and crisp pixel clusters. No white dome camera, no new futuristic design.
Create EXACTLY THREE sequential surveillance pan poses, arranged in ONE horizontal row of THREE equally sized square cells (3 columns x 1 row, full image 3:1 aspect ratio; target 1536x512 or exact integer multiple). Read left to right:
Frame 1: camera body swiveled LEFT, lens looking diagonally down-left along corridor.
Frame 2: camera body looking FORWARD toward viewer, slightly downward; visible front lens and narrow housing sides.
Frame 3: camera body swiveled RIGHT, lens looking diagonally down-right along corridor.
These must depict the SAME physical camera rotating horizontally on its swivel, not three different models or mirrored copies. Housing perspective changes naturally; lens position and small red indicator remain mechanically consistent. The wall mounting plate and fixed part of bracket remain in the EXACT SAME pixel position, size and orientation in every cell. Rotating joint anchor conceptually x128,y106 in every 256x256 cell. Constant object scale, identical lighting, enough padding for the full pan range, no clipping. Compact camera body occupies roughly central 65 percent of each cell. The three poses should form an idle left-center-right-center patrol sequence in a game. Do not move the mounting plate, change lens size, add cables or duplicate parts between frames.
Background must be REAL TRANSPARENT ALPHA in every empty region, including bracket holes. No room, wall, floor, people, props, cast shadows, motion blur, detection cones, scan beams, text, labels, frame numbers, grid lines, cell borders or watermark. Tiny red LED only, no large glow halo. Output only the clean three-frame sprite sheet.

## Refinement prompt

Refine this three-frame transparent CCTV sprite sheet for actual animation use. Preserve the exact same dark pixel-art camera design and left/front/right lens directions. Correct ONLY the frame layout and mounting geometry: currently the wall mounting plate drifts between frames. Use a precise 3-column x 1-row grid, each cell the same square size. In EVERY cell place the SAME wall plate with its center at normalized local cell x=0.62, y=0.64 and identical width=0.10, height=0.18. Fixed bracket arm and its swivel pivot must have exactly the same coordinates in all cells. Do NOT mirror or translate the bracket or wall plate. The camera HOUSING alone pans around the same physical pivot. Left pose shows lens pointing down-left, middle lens toward viewer and slightly downward, right pose lens pointing down-right. In the right pose the camera body naturally partly occludes the fixed support, but do not move support to the other side. All camera parts fully inside each cell with padding. Exactly three cells, no extra frames, preserve 3:1 aspect ratio and REAL transparent alpha. No backdrop, painted checkerboard, floor, shadows, text or grid. Maintain crisp pixel-art edges and small red LED.
