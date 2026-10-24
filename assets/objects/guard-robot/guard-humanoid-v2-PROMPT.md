# 감시 로봇 v2 — 전신 포즈 수정 프롬프트

도구: 내장 `image_gen`, 실제 투명 배경. 원안은 `guard-combat-concept.png`이며 변경하지 않았다.

이 수정본은 완성된 전신 그림을 생성·편집했다. 팔다리 부품의 회전 조립은 사용하지 않는다. 수호 걷기 0–7, 달리기 0·2·4·6·8·10·12·14를 4×2로 재배치한 포즈 가이드를 참조했다. 교차가 불명확한 프레임은 전신 한 장씩 수정했다.

최종 원본 선택과 위치·균일 배율은 `guard-humanoid-v2-layout.json`, 공통 RGB는 `guard-humanoid-v2-palette.json`, 출력 규격 검사는 `guard-humanoid-v2-validation.json`을 참조한다. 빌드 후처리는 셀 추출, 전신 균일 배율·이동, 원안 추출 RGB 선택, 알파 이진화와 4픽셀 이하의 분리된 샘플링 잡티 제거다. 최종 사용색은 원안의 8개 회색과 어두운 눈선 빨강이다.

## 대표 포즈

```text
Use case: stylized-concept. Asset type: ARCHI side-scroller pixel-art robot model sprite.
Input image 1 is the APPROVED DESIGN MASTER. Reproduce this exact robot, do not redesign it: the narrow sideways curved faceplate with a single tiny thin dark-red horizontal eye slit; long exposed cable neck; one swept angular shoulder blade on each shoulder; NARROW flat chest and very narrow segmented waist; circular shoulder/elbow/hip/knee joints; long slender angular silver-gray arm and leg armor; full-sized mechanical fists and long armored feet. Preserve the master’s lean threatening proportions, small head and long limbs.
Input image 2 is ONLY the final game sprite rendering STYLE and pixel-density reference. Do not draw the human.
Create ONE complete full-body robot facing RIGHT in a clean near-side-view, with the same slight three-quarter visibility as the master, in an understated neutral walking contact pose: near leg extended forward and heel down, far leg extended behind with toe down; near arm back, far arm slightly forward, elbows relaxed. Both knees almost straight, feet well apart but not a split. Exactly two arms, two hands, two legs, two feet. No detached parts.
Important corrections: chest must not become a broad frontal breastplate; keep the original flat narrow torso seen from the side. Hands and feet must not shrink into tiny nubs. The red slit must remain dark subdued red, not orange bright glow.
Pixel art: draw deliberately at a 256x256 logical sprite resolution, with a roughly 220-pixel tall figure, shown as exact 4x nearest-neighbor enlargement on a 1024x1024 transparent canvas. Fine mostly one-logical-pixel charcoal outlines, coherent 3-4 flat gray cel-shading bands, broad calm pixel clusters like the human reference. No dithering, grain, stipple, speckles, texture noise, antialiasing, gradients, blur, glow, sketch lines or thin high-resolution hatching. Neutral silver-gray from the master only. Center the pelvis horizontally; ground level at 94% canvas height; generous padding, nothing clipped. Real transparent alpha. No other figure, no floor, no shadow, no text, no labels, no frame. This is a fully assembled sprite, NOT a modular rig.
```

## 걷기 포즈 치환

```text
Use case: precise-object-edit, pose-preserving CHARACTER REPLACEMENT in a sprite sheet.
EDIT IMAGE1 (the 4x2 human animation sheet): replace the human IN EACH OF ITS EIGHT EXACT POSES with the robot from IMAGE2. IMAGE1 is the absolute pose/motion guide and IMAGE2 is the absolute robot design guide. Preserve image1's frame order, changing arm positions, changing near/far limb occlusions, body lean, contacts and in-betweens in every corresponding cell. Do NOT put eight copies of image2's pose. The BOTTOM ROW MUST HAVE THE OPPOSITE ARM/LEG PHASE TO THE TOP ROW. In cells0,1,2,3 the NEAR arm is behind; in cells4,5,6 the NEAR ARM IS FORWARD overlapping the chest, FAR ARM BEHIND, with both shoulder sockets visibly switching which arm is in front. Cell7 is the transition back. This arm exchange is critical.
Robot identity locked: small narrow sideways curved faceplate, thin subdued DARK RED eye slit, long cable neck, swept shoulder blades, narrow side-on silver-gray flat chest and narrow ribbed waist, round joints, long slim angular armor, substantial dark hands and long armored feet. The same head/trunk size, limb lengths and armor patterns every frame. Same sidecamera facingRIGHT. Exactly TWO arms/TWO hands/TWO legs/TWO feet; no human skin/hair/clothes. Never copy colored outlines or yellow/red artifacts from guide: robot neutral silver-gray/charcoal with red ONLY inside its tiny eye slit.
Deliberately drawn pixel sprite, thin clean charcoal outlines at256x256logicalcellscale,3-4 coherent flat cel-shading steps, no texture/hatching/grain/stipple/speckles/dithering/blur/glow/antialiasing/smoothpainting. 8 fully assembled whole-figure poses, no detached body parts, no cutout-rig demonstration. True transparent background, no shadows, floor, text, numbering, guide/gridlines, decorations.
Preserve the4columns×2rows even square-cell arrangement and FULL BODY scale, centered pelvis, consistent ground baseline and transparent gutters. Target2048x1024.
Action is WALK as image1: restrained arms, low foot clearance, NO high-knee march. Mirror the exact eight walking poses and their change of weight. Preserve relaxed elbow bend, heel strike, down, passing, up poses from the guide. Bothfeet contact in cell0.
```

## 걷기 머리 비율

```text
Precise-object-edit of this8-frame4x2 walking robot sprite sheet. Single targeted change: reduce the HEAD/faceplate SIZE of EACH OF ALL8robots to about80percent of its current width and height, anchored at the existing cable neck top. The current heads are too large relative to the approved tall lean robot. Keep the long cable neck and connect the now-smaller head correctly; preserve head orientation facingRIGHT, same curved black/silver faceplate, circular ear and thin DARKRED slit. Do not shorten neck. Keep exactly the same scale and silhouette for all other body parts, same armor design, same walking poses and changing arm overlaps, all8cells and theirorder, same overall atlas. No broadening chest, no tiny hands/feet, no new parts. Preserve clean flat silvergray cel pixel style; no texture noise, hatching, gradient or glow. Real transparent background, no text or shadows. All figures contained in owncells withpadding.
```

## 걷기 개별 교차 수정

```text
undefined
```

## 달리기 포즈 치환

```text
Use case: precise-object-edit, pose-preserving CHARACTER REPLACEMENT in a sprite sheet.
EDIT IMAGE1 (the 4x2 human animation sheet): replace the human IN EACH OF ITS EIGHT EXACT POSES with the robot from IMAGE2. IMAGE1 is the absolute pose/motion guide and IMAGE2 is the absolute robot design guide. Preserve image1's frame order, changing arm positions, changing near/far limb occlusions, body lean, contacts and in-betweens in every corresponding cell. Do NOT put eight copies of image2's pose. The BOTTOM ROW MUST HAVE THE OPPOSITE ARM/LEG PHASE TO THE TOP ROW. In cells0,1,2,3 the NEAR arm is behind; in cells4,5,6 the NEAR ARM IS FORWARD overlapping the chest, FAR ARM BEHIND, with both shoulder sockets visibly switching which arm is in front. Cell7 is the transition back. This arm exchange is critical.
Robot identity locked: small narrow sideways curved faceplate, thin subdued DARK RED eye slit, long cable neck, swept shoulder blades, narrow side-on silver-gray flat chest and narrow ribbed waist, round joints, long slim angular armor, substantial dark hands and long armored feet. The same head/trunk size, limb lengths and armor patterns every frame. Same sidecamera facingRIGHT. Exactly TWO arms/TWO hands/TWO legs/TWO feet; no human skin/hair/clothes. Never copy colored outlines or yellow/red artifacts from guide: robot neutral silver-gray/charcoal with red ONLY inside its tiny eye slit.
Deliberately drawn pixel sprite, thin clean charcoal outlines at256x256logicalcellscale,3-4 coherent flat cel-shading steps, no texture/hatching/grain/stipple/speckles/dithering/blur/glow/antialiasing/smoothpainting. 8 fully assembled whole-figure poses, no detached body parts, no cutout-rig demonstration. True transparent background, no shadows, floor, text, numbering, guide/gridlines, decorations.
Preserve the4columns×2rows even square-cell arrangement and FULL BODY scale, centered pelvis, consistent ground baseline and transparent gutters. Target2048x1024.
Action is RUN as image1: forward-leaning body, elbows bent, shoulder and pelvis counterrotation, loaded leg/down pose, toe push, airborne exchange. BOTH ARMS change front/back across the cycle, not just legs. Preserve the strong forward stride and changing trunk angles from guide while robot anatomy stays same. Cell0contact,1down,2up,3flight,4oppositecontact,5down,6up,7flight.
```

## 달리기 머리·발끝 수정

```text
Precise-object-edit of this8-frame4x2 running robot sprite sheet. Preserve each exact existing body pose and changing arm overlaps; do not replace them with one repeated pose. Make only these production corrections:
1. Reduce ALL8 heads/faceplates to80percent of currentwidth/height, anchored at existingcablenecktop. Keep longneck, samefaceplatedesign,thinDARKREDslit,alllookingRIGHT. Headsize mustmatch acrosswalk/run andremain smallrelativebody.
2. Restore the clipped toe tips in the TWO RIGHTMOST cells(topright,bottomright). Move those two WHOLE figures a little LEFT in theircells and complete their long armoredfeet withtransparentpadding. Do not redraw their arm/legpose. Both rightmost toes must be whole and insideimage.
Everythingelse remainsunchanged: SAMEsilvergray/charcoalarmor, narrowchest, limbsizes, fullassembledfigures, eachrow’s DIFFERENT neararm front/backpositions, exact4x2layout8frames, samefloorbaseline. No extralimbs, no addedhands. No gradients/noise/glow;flatcelpixels. TRUEtransparentbackground, no text/shadows/floor.
```

## 달리기 4번 교차

```text
Precise-object-edit. Image1 is the full robot frame to correct. Image2 is the intended skeleton (orangeNEAR,blueFAR). Change ONLY the two LEGS’ near/far placement/occlusion in image1. Keep head,neck,torso,arms,hands,colors and pixelartstyle unchanged.
Currently the near arm is FORWARD, but the visible near thigh also points forward, an anatomical gait error. The large visible round HIP DISK must instead attach to the leg FOLDED BACK TO THE LEFT. From that nearhipdisk, the silver NEAR THIGH goes almost VERTICALLY DOWN with slight LEFT/back angle to the bent knee BEHIND the hip. From that knee the NEAR SHIN goes LEFT nearly horizontal, to the lifted heel far behind. The close large round knee should now be the LEFT/back knee, not right/front knee.
The OTHER FAR LEG extends DOWN AND RIGHT to the planted forward foot, and emerges from the FAR side of pelvis behind the nearleg. Use slightly darker armor on that FAR front leg to showdepth. Remove the previous bright nearthigh running downright. Two legs ONLY, no thirdleg. Maintain original bone lengths, armor pattern and round joints. This is exactly the ORANGE near leg versus BLUE far leg arrangement in image2; do NOT copy the guide's colors or text.
Keep all other parts as image1, same small head, two arms/hands, stance silhouette and silvergray/charcoal. Wholefigure with transparentpadding and completefeet, REALtransparentbackground, nofloor/shadow/text.
```

## 달리기 5번 교차

```text
Precise-object-edit. Image1 is ONE robot animation frame to correct; image2 is its EXACT skeleton pose (orangeNEAR,blueFAR). Preserve the same robot design, small curved faceplate/redslit, longcableneck, narrow torso, slimarmor,bone lengths and grayscale palette. Correct the near/far limb arrangement anatomically, following image2. The ORANGE chains must become the VISIBLE NEAR arm and leg; BLUE are FAR behind. Do not retain orange/blue, numbers or text. Exactlytwoarms/twohands/twolegs/twofeet. Entire singlefigure with transparentpadding, completefeet, REALtransparentbackground; nofloor/shadow/text/straypieces. Same thin charcoal outlines and coherent flat gray celshading, no texture, glow or hatching.
Opposite leg loading. Keep currentarms (NEARarmforward,FARarmback),head,torso andarmor. CHANGE LEGS: NEAR HIP DISK attaches to thigh pointing DOWN/BACK LEFT toward a bent knee BEHINDhip, then shin points BACK/LEFT toward a raised heel. The NEAR leg is the folded-back bright leg. FAR DARK LEG goes DOWN underpelvis to groundedfoot and bearsweight. Remove current brightnearhip-to-forwardknee connection. Twolegs only. Remove any tiny unrelatedbits at imageedges.
```

## 달리기 2·3·7번 중간 동작

```text
undefined
```

## 제압 4단계

```text
Use case: stylized-concept. Asset type: ARCHI robot grabbing animation, transparent sprite sheet.
Image1 is the approved EXACT ROBOT MODEL. Image2 is Suho’s caught animation, ONLY for matching where a robot’s hands grip his two forearms. DO NOT draw Suho or any person.
Create 4 FULL-BODY robot poses in a strict 2-column x 2-row square-cell atlas, 1024x1024 target, each cell512x512 (logical256x256 enlarged2x). Read top-left,top-right,bottom-left,bottom-right. Robot faces LEFT in strict near-side-view with same slight 3/4 visibility as model. Pelvis centered in every cell; full figure about86% cellheight; same size in all4. Keep entire outstretched arms inside owncell.
Reproduce identical original design: small narrow curved faceplate with one thin subdued dark-red slit, long cable neck, small swept shoulder blades, NARROW side-on silver-gray chest and segmented narrow waist, circular joints, long slim angular armored limbs, full-size dark hands and long armored feet. Keep chest narrow, not frontal or broad. Exactly2arms,2hands,2legs,2feet, all connected anatomically. Shoulder→upperarm→elbow→forearm→wrist→hand chains clearly traceable. Far arm darker and positioned slightly above near arm so no third-arm illusion.
Action is TWO-HAND FOREARM RESTRAINT of one invisible opponent at the LEFT. Opponent facingrobot, forearms offered near robotwaistheight. Both hands each grip a SEPARATE opponentforearm, not neck or torso. Never draw invisible opponent's arms.
4 visibly different sequential keyposes:
0 ANTICIPATE: wide grounded staggered stance, both elbows bent, open hands held close to chest/front at lower-ribheight, body upright.
1 REACH: lean forward from ankles, extend both forearms LEFT and slightly down toward opponent’s two wrists/forearms; hands OPEN readyto grasp; farhand slightlyabove nearhand. Both feet anchored.
2 CONTACT: both hands CLOSE into small C-shaped clamps, one above the other separated about10logicalpixels; hands at waist/lower-ribheight, about75logicalpixels LEFT of pelvis. Elbows partially extended, forward weight shift, clear 2hands only.
3 RESTRAIN: draw captured forearms back a little toward ownwaist, elbows bend and lower, knees brace lower, pelvis shifts back a little, shoulders set; two hands remain closed, not fists punching. Distinct pull-and-hold that reads strong and threatening. Finalhands about65logicalpixels LEFT of pelvis and at145-160logicalpixels from celltop. No extra hands or arms.
Style matches Suho’s thin dark pixel outlines and coherent deliberate sprite clusters at256logicalresolution. Clean3-4step flat cel shading, neutral silvergray/charcoal same as model, one red eye slit only; no stipple/noise, tinyhatching, gradients, blur, glow, antialiasing or smooth illustration. Whole-figure redraws with correct changing overlaps, not modular puppet parts.
TRUE transparent RGBA background, binary sharp edges, no floor, no shadow, no scene, no text/numbers/dividers. Same plantedfootbaseline in allframes; every hand/foot/fin within transparentpaddedcell.
```

## 제압 머리 방향

```text
Precise-object-edit of the supplied 4-pose robot sprite sheet. CHANGE ONLY THE ORIENTATION OF THE FOUR HEADS. Every robot is reaching LEFT, but its face erroneously looks RIGHT. Make ALL FOUR HEADS LOOK LEFT toward the grasp target. The narrow black front faceplate and its thin red eye slit must sit at the LEFTMOST edge of each head, with the small circular ear pivot at the RIGHT/back of the head. The hooked chin points DOWN AND LEFT. Cable neck connects correctly. Do not leave the red eye on rightmost edge. Preserve the robot's exact head size, design, silver-gray shell and small dark-red slit. Preserve EVERYTHING ELSE pixel-for-pixel as far as possible: the body, two arms/two hands/two legs/two feet, all4poses, armor, 2x2 arrangement, figure scale and grounded baseline. No extra red marks. Transparent background. No text, shadows or floor.
```

