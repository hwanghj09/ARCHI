# 수호 휴대폰 이동 스프라이트

제작: 내장 `image_gen` 도구, 실제 투명 알파. 생성 원본은 이 폴더의 `walk-off.png`, `walk-on.png`, `run-off.png`, `run-on.png`이다. 게임용 PNG는 상위 폴더의 `jeong-suho-phone-{walk,run}-{off,on}.png`다.

원본은 걷기 3열×2행(1536×1024), 달리기 4열×2행(1774×887)이다. 생성 결과의 실제 크기를 기준으로 `scripts/prepare-phone-movement.ps1`이 픽셀 보간 없이 256×256 셀의 가로 시트로 분할한다. 달리기 원본의 행 경계는 y=460이며, 접지 프레임의 발 기준은 y=237, 공중 프레임은 y=230/219다. ON/OFF가 동일한 정렬값을 사용한다.

최종 수정본 `walk-off-hands.png`, `walk-on-hands.png`에서는 요청받은 1·2·4번 셀만 사용하고, 3·5·6번 셀은 최초 원본을 유지한다. 1·4번은 빈손 팔의 어깨·윗팔을 몸통 뒤로 가리고 뒤쪽 골반에서 아래팔만 보이며, 2번은 허벅지 뒤의 손끝만 보인다. 라이트 ON 달리기는 게임에서 비활성화되었으며, `run-on`의 3·7번 공중 자세만 점프·낙하에 재사용한다.

## Final far-arm occlusion OFF

Reference: previous corrected OFF atlas. This is the final replacement for `walk-off-hands.png`.

Use case: precise-object-edit. Critical anatomical OCCLUSION correction, not a hand-shape correction. EDIT ONLY frames 1,2,4 (top-left, top-middle, bottom-left) of this 3x2 sprite sheet. The EMPTY arm is the FAR-SIDE arm, on the OTHER side of his body. It is currently mistakenly painted IN FRONT of the visible shirt/torso and near hip, making it look like a second near arm. Correct the layer order: empty FAR shoulder and upper arm must be HIDDEN BEHIND the shirt torso. Remove its exposed near-side shoulder/sleeve bulge. The shirt body and foreground phone-holding arm must overlap and occlude that far arm. In frame 1 and 4, show only a narrow darker sliver of the free forearm trailing from BEHIND the back waist contour; keep most of its elbow hidden behind the torso, with the free hand partially occluded by the far/back hip and leg. In frame 2, the free arm hangs on the far side, so the torso and pants must hide nearly all of it; only a small piece of fingertips can peek from behind the far thigh. It is better to HIDE the far arm than falsely draw it across the near hip. The PHONE-HOLDING arm alone remains the clear foreground near-side arm, bent forward at chest height. Preserve that phone arm, phone position and OFF LED exactly. KEEP ALL OTHER PIXELS AND POSES, face, shirt, tie, badge, trousers, legs, shoes, framing and scale unchanged. Frames3,5,6 untouched. Same 1536x1024 canvas, 512x512 cells, all face RIGHT. Actual alpha=0 background everywhere outside tight character silhouettes and all gaps; remove any gray/brown haze, no background, no glow or shadows. Crisp original pixel art.

## Final far-arm occlusion ON

Reference: final `walk-off-hands.png`. This is the final replacement for `walk-on-hands.png`.

Use case: precise-object-edit. Turn each smartphone's flashlight LED ON in this sprite sheet, preserving all character pixels and anatomy. Draw one clear bright WHITE 10x10-pixel LED spot INSIDE the BLACK PHONE CASING near its TOP RIGHT CORNER in each of the 6 frames. The LED must be a solid white visibly luminous spot sitting ON the phone body, NOT a detached tiny sparkle outside its silhouette; it must survive downscaling to half resolution. Example first cell: the phone occupies approx x338..365 y128..163; put the white LED centered near x356,y138 fully inside that black phone. All other pixels must remain unchanged. Especially preserve the corrected far-arm occlusion: frames1/4 have their empty far arm partly hidden behind the back hip, frame2 has the far arm almost completely hidden behind the torso/thigh. Do not redraw arms, hands, clothing, faces or legs. Exact1536x1024 canvas,3columns2rows. Fully transparent alpha outside tight character silhouettes, no backdrop or hazy outline. No beam, no rays, no extra light spill, just 6 unmistakably lit LED spots inside the existing phone casings.

## Hand correction OFF

Reference: `walk-off.png` (edit target).

Use case: precise-object-edit. Correct the anatomy of the HANDS AND WRISTS in ONLY frames 1, 2, and 4 of this six-frame sprite sheet (reading order: top-left, top-middle, bottom-left). The free hanging/swinging hands in those three frames currently look like blunt detached clubs, too far from the hip or at a broken wrist angle. Redraw them as natural slender relaxed adult male hands with a small inward palm curve, a readable thumb and gently curled fingers, aligned with each forearm. Free arm should originate correctly at the shoulder behind the torso, bend very slightly at the elbow, hang/swing near the hip in a plausible walking arc. Keep consistent hand size with frames 3, 5, 6. Also refine the phone gripping hand in frames 1, 2, 4: wrist smoothly continuous with forearm, palm wraps around the lower half of the smartphone, visible fingers on the front edge and thumb on the opposite side, no bent-back wrist, no additional fingers, no disconnected hand. Preserve exact smartphone position and orientation and OFF LED, so it still faces forward RIGHT at chest level. Lock all heads, torsos, clothing, legs, shoes, silhouettes outside the hands/forearms, all character positions and scale. Frames 3, 5, 6 must be completely unchanged. Preserve the exact 1536x1024 canvas, three columns by two rows of 512x512 cells, and actual alpha transparency. Same crisp pixel art style and shading, no new background or light, no labels, no new props.

## Hand correction ON

Reference: `walk-off-hands.png` (edit target).

Use case: precise-object-edit. This is the corrected-hand Suho PHONE WALK OFF sprite sheet. Create the corresponding flashlight ON sheet. Change ONLY the tiny LED at the top outward-facing edge of each smartphone into a small bright warm-white point, with a very restrained local glow. Keep all six poses, in particular the newly corrected relaxed free hands and phone gripping hands in frames 1, 2 and 4, EXACTLY unchanged. Do not move or repaint arms, wrists, fingers, phones, clothes, heads, legs, shoes, or any other pixels except the tiny LEDs. Preserve 1536x1024 canvas, 3x2 grid, exact character positions and original true transparent alpha. No cone or beam, no surrounding light, no background, no text. All six characters face RIGHT and are identical to input except their phone LEDs are on.

## OFF alpha cleanup

Reference: the corrected OFF atlas. The delivered `walk-off-hands.png` is this final cleanup output; its first edit had partially opaque haze and was rejected by the alpha test.

Use case: background-extraction. This sprite atlas contains SIX isolated pixel-art men holding phones. REMOVE ALL of the surrounding gray/brown/black hazy background and every glow/halo around the figures. Every pixel outside each person's tight outer silhouette (hair, clothing, skin, shoes, phone) must be FULLY TRANSPARENT alpha=0, including the space BETWEEN the legs and between the arm and torso. No semi-transparent fog, no drop shadows, no soft gray fringes, no checkerboard. Keep the visible characters EXACTLY unchanged, especially their corrected hands and phone grips; phones remain OFF. Do not rescale, reposition, repaint, smooth, recolor or alter any character. Preserve exact 1536x1024 canvas and 3 columns by 2 rows of 512x512 cells. This is a technical clean cutout for game animation, not an illustration with a backdrop. CRITICAL: actual clean alpha cutout, not black background or a fake transparency texture.

## Walk OFF

References: `jeong-suho-walk-six.png` (edit target), `jeong-suho-phone-light.png` (identity/phone).

Use case: identity-preserve. Asset: production 2D side scrolling pixel art sprite sheet for ARCHI. Image 1 is the EDIT TARGET (six-frame walk cycle), image 2 character/phone reference. Create the PHONE-HELD FLASHLIGHT OFF walking sheet. Preserve exactly Suho's black messy hair, white rolled sleeve office shirt, loosened black tie, blue lanyard ID, black trousers and gray sneakers, existing pixel density and outlines. Keep the six leg poses in their exact order and consistent anatomy and proportions. Change the near arm to bend forward at chest level, holding a dark smartphone upright with rear camera/LED pointing horizontally RIGHT to illuminate the way when activated; face looks ahead rather than down. The other arm naturally swings. LED OFF, no light emitted, no beam or glow. All six full-body characters face RIGHT, same scale and ground baseline, complete heads and feet, consistent phone position across frames. Layout MUST be a clean 3 columns by 2 rows regular grid, 1536x1024 total, each cell 512x512 with transparent margins, each body hip at cell x=256 and soles at cell y=474, head near cell y=38. First three walk frames across top, final three across bottom. Genuinely transparent background, no checkerboard painted, no ground/shadows, no text, no labels, no cell borders, no extra objects.

## Walk ON

Reference: `walk-off.png` (edit target).

Use case: precise-object-edit. EDIT TARGET is the supplied six-frame Suho PHONE WALK OFF sprite atlas. Produce its flashlight ON counterpart. Change ONLY the small flashlight LED near the top outward-facing edge of each held smartphone into a bright warm-white pixel with a tiny restrained glow. Do NOT draw any beam, cone, rays, halo behind characters or surrounding illumination: the game renders actual directional lighting. Preserve every pose, silhouette, clothing, face, expression, scale, feet position, phone position, crisp pixel art and the exact 1536x1024 image with 3 columns x 2 rows 512x512 cells. Do not repaint the characters. Preserve true alpha transparency outside all characters. No background, no text, no outlines around cells. The six people remain identical to input except the six tiny lit LEDs.

## Run OFF

References: `jeong-suho-run-eight.png` (edit target), `walk-off.png` (identity/phone/style).

Use case: identity-preserve. Asset: production 2D side-scroller game pixel-art RUN cycle, smartphone held, flashlight OFF. Image 1 is the EDIT TARGET eight run poses; Image 2 defines exactly matching Suho's character, phone, arm and pixel art styling. Preserve slim adult male identity, messy black hair, white rolled-sleeve shirt, loose black tie, blue ID badge lanyard, black trousers and gray sneakers. Adapt all EIGHT running phases in order from image 1: wide contact, recoil, knee up, flight, opposite wide contact, recoil, opposite knee up, flight. More forward body lean and higher knees than walking. Near hand carries a dark smartphone upright at chest height, held forward with flashlight at its top facing RIGHT to light the way. Free arm swings, the phone-carrying arm stays steady with small natural bob. LED OFF, no glow or beam. All characters full-body facing RIGHT, same scale, consistent proportions, head near cell y=40 and soles near cell y=474, hips consistently at cell x=256. Layout MUST be exactly FOUR columns and TWO rows of square 512x512 transparent cells, total 2048x1024. Eight distinct running poses in reading order, evenly spaced, no overlap. Actual transparent alpha background, no painted checkerboard, no environment, no ground shadows, no halo, no text, no borders. Keep the original game's fine crisp pixel clusters rather than smooth high-resolution painting.

## Run ON

Reference: `run-off.png` (edit target).

Use case: precise-object-edit. Input is the EDIT TARGET eight-frame Suho PHONE RUN OFF sprite atlas. Create its flashlight ON counterpart. Change ONLY the small LED at the top outward-facing edge of each smartphone to a bright warm-white point with a tiny restrained glow. No beam or cone, no rays or surrounding scene lighting: game code draws it. Preserve precisely the same canvas dimensions, FOUR columns x TWO rows grid, frame positions, running poses, silhouettes, full heads and feet, phone positions, pixel art styling, face and clothing, all unchanged. Eight characters face RIGHT. Actual alpha transparency outside sprites must be preserved; no ground, no background, no text, no borders. Do not add glowing outlines to bodies or repaint the characters. Only the eight tiny phone LEDs turn on.
