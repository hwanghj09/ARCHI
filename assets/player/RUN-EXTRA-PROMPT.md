# Additional Run Poses

- Tool: built-in image_gen.
- Reference: jeong-suho-run.png (approved six-frame sheet).
- Selected output: jeong-suho-run-extra.png, 1774x887 RGBA PNG.
- Integration and normalization: RUN-PROMPT.md and ../../scripts/prepare-run.ps1.

## Generation Prompt

Create exactly TWO additional intermediate RUN animation poses for the SAME Jeong Suho in the reference six-frame sprite sheet. Reference is approved identity, outfit, pixel-art style and motion, not an image to redraw wholesale. Output ONLY TWO poses in two equal square cells horizontally, 2:1 sheet. Both face RIGHT in strict side profile. Same adult slim Korean man, messy black hair, white rolled sleeves, loose black tie, dark ID lanyard, black slacks, gray-white sneakers. Crisp muted detailed pixel art. Empty hands. No redesign.
These two NEW poses are late airborne extension just BEFORE foot contact, to insert after reference frames 3 and 6 respectively (one-based). Frame A: far shin unfolds forward/down toward landing, far heel a little above the theoretical ground, near thigh behind and near knee folded, near forearm swinging forward. Frame B: opposite leg/arm phase: near shin unfolds forward/down toward landing, near heel a little above ground, far knee folded behind, near arm swinging back. These are fast running landing-preparation poses, not walking or high-knee tuck copies. Front knee opens to roughly 130 degrees, front shoe below hip and ahead. Torso leans forward, not falling over. Tie and badge trail subtly.
Identical scale across cells, horizontal hip anchor at center, theoretical ground y=93.4% cell height; the extended landing shoe sole is at y=91% in both cells. Character head around y=8%. Entire character including limbs within each cell with padding. TRUE transparent alpha background, no scenery, ground, shadows, halos, gradients, motion trails, text, labels, numbers, borders or checkerboard. Preserve clean pixel edges. Output only the TWO-frame transparent sprite sheet.

## Refinement Prompt

Edit this exact two-cell transparent running sprite sheet. Preserve LEFT cell completely. Correct ONLY the RIGHT cell so it is visibly the OPPOSITE leg-and-arm phase, while character still runs facing RIGHT. Right cell: viewer-near arm bends and swings BACK toward left behind his torso, near fist at left waist; far arm bends FORWARD toward right, partly hidden behind torso. Show more of the back of the white shirt as in the opposite phase of a run. Viewer-near leg extends FORWARD/DOWN toward right for impending landing with a more open knee; viewer-far leg trails toward left with heel lifted. This must not be a copy of left cell with small shifts. Same man, head, hair, clothes, 2:1 sheet, two square cells, character scale and hip anchor. Keep near-landing toe/heel airborne a few pixels, same foot baseline in both cells. Preserve real transparent alpha, no background, halos, extra outlines or text. Only two poses.

