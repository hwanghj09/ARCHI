# 달리기 중간 동작 1장

- 도구: built-in ImageGen, 실제 투명 배경.
- 참조: `assets/player/jeong-suho-run-eight.png`의 0·1번 전신 자세.
- 생성 원본: `movement-inbetweens-source/run-mid-01.png`, 1254×1254.
- 최종 단일 셀: `jeong-suho-run-mid-01.png`, 256×256.
- 적용: `jeong-suho-run-sixteen.png`의 1번 타이밍 셀만 새 그림으로 대체한다. 기존 8개 전신 자세는 그대로 두어 일반 달리기는 총 9개 고유 자세가 된다. 휴대폰 달리기는 기존 8개를 유지한다.
- 기존 16셀 선택·288px 주기·340px/s 이동을 유지하므로 한 바퀴 약 0.847초는 변하지 않는다.
- 내보내기: `scripts/prepare-movement-inbetweens.mjs`. 한 전신에 동일 배율만 적용한다. 머리 기준 x179·착지 바닥 y239에 맞추며 팔·몸통을 잘라 붙이지 않는다. 알파·여백·머리 크기와 위치·중간 착지 위치는 `tests/movement-inbetweens.mjs`에서 검사한다.
- 비교: `docs/previews/suho-run-one-inbetween.png`는 기존 0번 → 새 중간 자세 → 기존 1번 순서다.

## 최종 프롬프트

Use case: precise-object-edit. Production transparent single in-between frame for ARCHI 2D pixel game. Input1 is EDIT TARGET, an exact approved whole-character run keyframe A. Input2 is next approved whole-character keyframe B. Draw EXACTLY ONE new FULL-BODY pose halfway between A and B. Do NOT output a sheet, pair, multiple characters, diagram, text or comparison.
Identity/style/proportion invariants: SAME slim ADULT Jeong Suho, same short black hair, SAME face/head size and angle as A, same white/lightgray rolled-sleeve office shirt, gray folds, black tie and ONE dark ID lanyard, charcoal trousers, gray-white sneakers. Fine crisp anime PIXEL ART identical to A. Maintain the SAME shirt torso length/width, shoulder size, forward lean about25degrees and waist/hip point. Arms and torso must CONNECT anatomically to hips and legs as one character. Do NOT redraw a stiff upright torso or put fists near face. Preserve A's head/neck/torso almost unchanged, just a subtle transition of sleeve folds and bent arm positions toward B. No head/body swelling, no increased muscle bulk, no style/palette change.
Pose: RIGHT-facing run COMPRESSION/PASSING midpoint between A's front leg stretched far forward and B's bent passing legs. The front support foot is lower/right of hips, touching the same floor baseline, but comes back halfway toward the hips: shin inclines slightly forward, knee moderately bent to absorb landing, gray sneaker at about cellx185,y239 when normalized to256px. Rear knee folds forward halfway toward B, rear shoe lifts near cellx95,y185, behind the hips. Natural anatomical whole limbs, no twisted knees, no extra feet. Keep hips near x128,y127, head nearx179,y43 in normalized256pxcell, hairtop~22px and support sole y239px. Relative foot/pelvis positions are halfway between the two inputs, not a copy of either endpoint. Far bent forearm comes a little higher/forward than A, hand aroundx197,y110, still below chin. Near arm still swings back, relaxed fist aroundx87,y122, elbow bent, upperarm length consistent. Match actual reference positions if numeric guidance differs.
Canvas square transparent, requested1024x1024. At4x reference scale: hip(512,508), hairtop88, soles956. Full head, hands and shoes inside padding, EXACT original scale/proportions. NO floor line, cast shadow, glow, blur, speed lines, background, phone, labels, badges with readable text, extra lanyards or stray pixels. This is one genuine newly drawn midpoint, not a crossfade or duplicate of A/B.
