# Jeong Suho idle animation

- Tool: built-in image_gen.
- Identity and style reference: jeong-suho.png.
- Output: jeong-suho-idle-four.png, repaired transparent PNG (2026-10-18).
- Layout: 2 columns x 2 rows, four frames read left to right then top to bottom.
- Sequence: neutral, inhale, blink, exhale. Feet remain planted for a standing idle pose.
- Connected to the game's idle state; the original 1254x1254 PNG is reused without resampling.
- Render at 0.285 scale, with source hip anchors [325, 925, 325, 925] and sole anchors [619, 619, 1234, 1235] aligned to player-local (96, 178). CSS clips the selected pose to the player viewport.
- Loop: neutral 1200ms, inhale 900ms, blink 120ms, exhale 980ms. Movement, jumping, and interaction interrupt the loop; stopping starts again at neutral.

## Wrist/thigh repair · 2026-10-18

The original bottom-row poses contained horizontal cuts and displaced hands inside the image itself. The built-in `image_gen` edit repaired the sheet while retaining its 1254×1254 canvas, transparent background, four poses and existing runtime anchors. No runtime or CSS change was needed. `tests/idle-animation.mjs` catches the original wrist/thigh discontinuity and checks two complete idle loops after releasing movement in both directions; per-pose game captures are saved under `.local/idle-after-*.png`.

### Repair prompt

Use case: precise-object-edit. Asset type: production transparent pixel-art game sprite sheet. Edit target: the supplied 1254x1254 transparent 2x2 four-frame standing idle animation sheet of Jeong Suho. Repair ONLY the visibly broken horizontal seams and duplicated/displaced hands at the wrist/thigh area in the bottom-left and bottom-right characters (around original y=940..1015). Each character must have exactly two coherent anatomically natural hands hanging from his arms, connected wrists, clean continuous trousers with no horizontal black cutout or slice. Use the intact relaxed arms/hands of the top-row characters as the repair reference. Keep the top-row poses unchanged. Preserve every character's identity, clothing, face/eyes (bottom-left blinking), hair, body proportions, exact scale, position, foot placement, subtle breathing differences, original pixel art style, palette, and four-frame 2x2 layout. Preserve the original square canvas and transparent background, no shadows, outlines, text or new objects. Do not redesign or beautify the character. Keep all four complete characters with large transparent margins. Output the repaired sprite sheet only with genuine alpha transparency.

## Generation prompt

Use case: identity-preserve.
Asset type: production IDLE BREATHING animation sprite sheet for Jeong Suho in ARCHI, a 2D side-scrolling office mystery game.
Reference image 1 is the exact approved character identity and pixel-art style. Preserve his adult slim realistic proportions, messy black hair, tired face, white creased rolled-sleeve office shirt, loose black necktie, dark ID lanyard and badge, dark trousers, and gray-white sneakers. Same muted crisp anime-inspired pixel art, no chibi, no smoother illustration style. Empty hands.
Create exactly FOUR sequential animation frames in a precise 2-column by 2-row grid with equal square cells. Reading order: top left, top right, bottom left, bottom right. Conceptual sheet 512x512, each cell 256x256, or an exact integer multiple.
This is an IDLE STANDING loop, NOT walking. Change the reference walking pose into a natural stationary stance: both shoes planted, feet comfortably close at shoulder-width rather than in a wide stride, knees relaxed, torso slightly hunched from office-worker fatigue, both arms resting near sides, gaze RIGHT in strict side profile. Keep that exact stance and direction throughout all four frames. Fix both soles and their positions to identical ground baseline in every cell.
Frame 1: neutral at end of exhale, shoulders relaxed.
Frame 2: gentle inhale, upper chest and shoulders rise about ONE conceptual pixel, tie and badge barely follow.
Frame 3: top of inhale, shoulders about TWO conceptual pixels higher than frame 1; one natural half-closed eyelid blink, same head direction and expression.
Frame 4: exhale, shoulders return to ONE conceptual pixel above frame 1, eyes open, loops smoothly into frame 1.
Animation differences must be subtle but real. No hand waving, no stepping, no swaying across the cell, no foot lifting, no large head movement. Chest and shoulder breathing only, small cloth movement. Adult body height about 218 pixels in each 256px cell, head around y20, soles on y239, horizontal hip anchor x128. Maintain identical physical character scale, face, outfit and pixel density across frames. Full body inside every cell with generous padding, equal spacing, no limbs crossing cell boundaries.
Background: REAL TRANSPARENT ALPHA in all empty pixels including gaps between limbs. No painted checkerboard, no floor, no shadows, no glows, no labels, no captions, no frame numbers, no grid lines or cell borders, no watermark. Output only the four-frame transparent idle animation sheet.
