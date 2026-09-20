# Jeong Suho idle animation

- Tool: built-in image_gen.
- Identity and style reference: jeong-suho.png.
- Output: jeong-suho-idle-four.png, original transparent PNG.
- Layout: 2 columns x 2 rows, four frames read left to right then top to bottom.
- Sequence: neutral, inhale, blink, exhale. Feet remain planted for a standing idle pose.
- Asset-only delivery; not connected to the game. Normalize frame scale and foot anchors against the existing player when integrating.

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
