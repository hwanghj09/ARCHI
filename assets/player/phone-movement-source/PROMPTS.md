# 수호 휴대폰 이동 스프라이트

## 2026-10-24 · 웅크리기 후레쉬와 달리기 팔 고정

### 현재 최종 방식 · 전신 16프레임을 한 번에 제작

현재 게임의 휴대폰 달리기는 `run-full-body-on-generated.png`의 전신 4×4 아틀라스를 그대로 사용한다. 내장 image_gen으로 머리·어깨·몸통·양팔·양다리·신발을 함께 다시 그렸다. 팔, 머리, 다리를 따로 붙이는 코드와 관절 회전용 중간 파일은 제거했다. 아래 팔 분리·고정 상체 관련 내용은 이전 제작 기록이며 현재 달리기 출력에 사용하지 않는다.

최종 프롬프트: 기존 인물의 얼굴·검은 머리·흰색 걷어 올린 셔츠·검은 넥타이·사원증·검은 바지·회색 운동화와 픽셀 표현을 유지한다. 전신 16개 자세를 하나의 일관된 달리기 주기로 그린다. 휴대폰은 같은 손으로 들고 작게 안정시키며, 빈팔은 팔꿈치를 부드럽게 굽힌 작은 호를 따라 앞뒤로 움직인다. 어깨·몸통의 반대 회전과 머리·가슴의 작은 상하 움직임을 다리의 접지·압축·공중 동작과 함께 그린다. 프레임을 중복하지 않고 15→0도 이어지게 한다. 붙인 부위·이중 소매·어긋난 관절·떠 있는 손·과장된 직선 팔 흔들림을 만들지 않는다. 4×4 배치와 전신 여백, 실제 투명 배경을 유지하며 광선·후광·그림자·문자를 추가하지 않는다.

`scripts/prepare-phone-run.mjs`는 모든 셀에 같은 크기를 적용해 256×256 여백에 배치하고, 떨어진 배경 잡픽셀을 정리한 뒤 가로로 패킹한다. 신체 부위의 위치를 바꾸거나 기존 다리·머리를 덮어 붙이지 않는다. OFF 출력은 같은 전신 그림의 작은 LED만 어둡게 한다. 출력은 `../jeong-suho-phone-run-sixteen-{on,off}.png`(4096×256)이며, 미리보기는 `docs/previews/phone-run-full-body.gif`다.

16프레임 LED 좌표: `[[203,84],[203,85],[204,86],[203,85],[204,85],[204,85],[204,84],[204,85],[203,84],[203,83],[203,83],[203,82],[203,83],[203,83],[204,84],[203,84]]`. 테스트는 전신 연결·16개 서로 다른 자세·팔 이동 폭·루프 이음·투명 여백·ON/OFF 일치·광원 정합을 확인한다. 웅크리기 그림은 변경하지 않았다.

이하 이전 제작 기록:

### 최종 조정 · 빈팔·어깨·상체를 포함한 달리기 주기

현재 달리기는 `run-natural-on.png`(2048×256, 8자세)를 사용한다. 내장 image_gen으로 양팔과 어깨가 연결된 전체 달리기 주기를 편집한 뒤 셀 크기에 맞췄다. 빈팔은 뒤→아래→앞→아래→뒤로 흔들고, 휴대폰을 든 팔은 같은 쪽을 유지하며 작게 움직인다. 앞으로 나온 빈손과 휴대폰 손 사이를 띄워 휴대폰을 주고받는 것처럼 보이지 않게 했다. 셔츠와 어깨도 팔의 움직임에 반응한다. 머리는 기본 첫 프레임의 원래 픽셀을 `[0,1,0,-1,0,1,0,-1]`px만큼 이동해 착지 리듬을 준다. 기존 다리 16셀과 중간 동작은 계속 사용한다. 아래 고정 상체와 팔 부분 편집 내용은 이전 제작 기록이다.

최종 프롬프트: 같은 인물·의상·픽셀 밀도·전방 기울기를 유지한다. 보폭에 맞춰 같은 쪽 빈팔이 자연스럽게 뒤에서 앞으로 회전하고 되돌아오게 하며, 팔꿈치 굽힘과 팔 길이·손 크기를 일정하게 유지한다. 휴대폰은 항상 같은 반대쪽 손에 있고 작은 흔들림만 허용한다. 두 손은 분리해 보이게 한다. 어깨와 셔츠에 작은 몸통 반응을 주고, 원래 다리 자세·회색 신발·셀 배치와 실제 투명 배경을 보존한다. 여분의 팔·손·휴대폰, 빛줄기·후광·그림자·텍스트를 추가하지 않는다.

광원은 8자세의 실제 LED 좌표 `[[202,84],[201,83],[202,84],[203,84],[201,84],[201,82],[202,85],[202,85]]`를 따라간다. ON/OFF 출력은 계속 `../jeong-suho-phone-run-sixteen-{off,on}.png`이며, LED 영역만 다르다. 테스트가 빈팔의 앞뒤 이동 폭·8개 어깨 자세·머리의 작은 이동·같은 쪽 휴대폰 손·기존 다리·광원 정합을 검사한다.

현재 게임용 출력은 `scripts/prepare-phone-poses.mjs`로 재생성한다. `prepare-flashlight-run.mjs`도 같은 처리를 호출하며, `prepare-movement-inbetweens.mjs`는 기본 동작 생성 후 이 처리를 실행한다. 아래 2026-10-20의 전체 달리기 생성본은 과거 기록이다.

- `crouch-on-generated.png`: 내장 image_gen으로 기본 웅크리기 4프레임을 편집했다. 머리·등·발을 보존하고, 앞팔을 굽혀 검은 휴대폰과 작은 흰색 LED를 추가하도록 요청했다. 원본의 실제 크기는 2170×725이며, 빌드 시 기본 자세의 머리·발 기준에 정렬한 뒤 팔·휴대폰 영역만 반영한다.
- `run-upper-on.png`: 내장 image_gen으로 기본 달리기의 손에 휴대폰과 흰 LED만 추가한 결과 중 첫 셀을 256×256으로 정렬한 원본이다. 프레임마다 앞으로 나온 손에 휴대폰을 붙이면 잡는 팔이 교대하므로, 이 상체를 전 프레임에 공통으로 사용한다. 얼굴은 기본 달리기 첫 셀의 픽셀을 쓰며, 다리·신발은 기본 16프레임에서 가져온다. 1번 중간 동작과 올라오는 무릎도 보존한다.

최종 프롬프트 요지: 기존 인물·의상·픽셀 표현·기본 동작을 유지하고, 검은 휴대폰을 자연스럽게 쥔 손과 상단의 흰 LED를 추가한다. 실제 투명 배경을 유지하며 광선·번짐·바닥·그림자·텍스트를 그리지 않는다. ON/OFF 시트는 LED 영역만 다르다. 웅크리기는 4개 LED 좌표를 사용한다.

출력: `../jeong-suho-phone-crouch-{off,on}.png` (1024×256), `../jeong-suho-phone-run-sixteen-{off,on}.png` (4096×256). `tests/phone-pose-consistency.mjs`가 같은 팔의 작은 4동작, 기본 다리·신발, ON/OFF 실루엣과 LED 위치를 검사한다.

### 추가 조정 · 달리기 팔의 작은 움직임

`run-arm-motion-on.png`는 내장 image_gen으로 제작한 4개 팔 자세를 기존 셀에 정렬한 1024×256 원본이다. 프롬프트: 같은 쪽 팔과 어깨·팔꿈치 기준을 유지하고, 휴대폰을 쥔 아래팔·손목·손만 중립→조금 올림→중립→조금 내림으로 움직인다. 머리·몸통·반대 팔·다리·의상·픽셀 표현과 투명 배경은 유지하며 광선·번짐·그림자를 추가하지 않는다. 생성된 올림 자세의 폭을 줄여 LED 높이가 81~89px 안에서 움직이도록 정렬했다.

빌드 시 팔 영역만 공통 상체에 반영하고, 기본 다리·올라온 무릎과 머리는 유지한다. 16개 시간 셀에서 각 자세를 2셀씩 재생하며, 두 걸음에 같은 굽힘 주기를 반복한다. 게임 화면의 손 상하 이동 폭은 6px이다. 광원 좌표는 `[[202,85],[202,81],[203,85],[203,89]]`이며 `js/scene/camera.js`가 같은 위상으로 선택한다.

제작: 내장 `image_gen` 도구, 실제 투명 알파. 생성 원본은 이 폴더의 `walk-off.png`, `walk-on.png`, `run-off.png`, `run-on.png`이다. 게임용 PNG는 상위 폴더의 `jeong-suho-phone-{walk,run}-{off,on}.png`다.

원본은 걷기 3열×2행(1536×1024), 달리기 4열×2행(1774×887)이다. 생성 결과의 실제 크기를 기준으로 `scripts/prepare-phone-movement.ps1`이 픽셀 보간 없이 256×256 셀의 가로 시트로 분할한다. 달리기 원본의 행 경계는 y=460이며, 접지 프레임의 발 기준은 y=237, 공중 프레임은 y=230/219다. ON/OFF가 동일한 정렬값을 사용한다.

최종 수정본 `walk-off-hands.png`, `walk-on-hands.png`에서는 요청받은 1·2·4번 셀만 사용하고, 3·5·6번 셀은 최초 원본을 유지한다. 1·4번은 빈손 팔의 어깨·윗팔을 몸통 뒤로 가리고 뒤쪽 골반에서 아래팔만 보이며, 2번은 허벅지 뒤의 손끝만 보인다. 기존 `run-on`의 3·7번 공중 자세는 점프·낙하에 재사용한다. 2026-10-20부터 지상 플래시 달리기는 아래 새 16프레임 시트를 사용한다.

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


## 2026-10-20 · 플래시 ON 달리기 16프레임

사용자 요청에 따라 플래시를 켠 채 Shift 달리기를 지원한다. 새 원본 `run-sixteen-on-generated.png`는 image_gen으로 그렸으며, 현재 `jeong-suho-phone-run-sixteen-off.png`의 16개 셀을 4×4 격자로 배치한 이미지를 참조했다. 생성 결과는 1254×1254의 실제 알파 PNG다. 과거 8프레임 ON 파일도 존재하며, 이를 누락 파일로 기술했던 문제 기록은 정정했다.

프롬프트: 기존 캐릭터의 얼굴·옷·실루엣·16개 달리기 자세와 순서를 유지한다. 검은 휴대폰의 앞쪽 상단에 프레임마다 밝은 흰색 LED를 그린다. 빛줄기·배경·바닥·그림자·글자·격자선은 그리지 않는다. 게임이 방향성 빛을 그리므로 실제 투명 배경과 셀 주변 여백을 유지한다. 인접한 자세의 홀드도 유지한다.

재생성:

```sh
node scripts/prepare-flashlight-run.mjs
```

빌드 스크립트는 아트를 새로 그리지 않고, 생성 원본을 최근접 보간으로 1024×1024로 맞춘 뒤 256×256 셀 16개를 가로로 패킹한다. 최종 파일은 `assets/player/jeong-suho-phone-run-sixteen-on.png`(4096×256). 출력되는 LED 좌표는 `js/scene/camera.js`의 `runLitPhoneLamps`에 반영했다. 테스트가 16개 셀의 투명 여백·실제 LED와 광원 정합·좌우 달리기 속도·점프 전환·방전을 확인한다.

플래시를 켜도 달리기 속도는 기본 달리기와 같다. 배터리·정신력·점프·플래시 켜기 지연 규칙은 유지한다. 점프·낙하는 기존 2프레임 시트를 계속 사용한다.

### 16프레임 ON 외곽 정리

최초 생성본에 목뒤·어깨·팔 주변의 회색 매트와 반투명 잔상이 남아 있었다. image_gen으로 원본의 배경·알파를 보정하고 `run-sixteen-on-generated.png`를 교체했다. 4×4 격자·1254×1254 크기와 16개 자세 순서를 유지한다.

편집 지시: 캐릭터 바깥과 팔·다리 사이의 회색/갈색 쐐기 모양 배경, 연무, 붉은 잡픽셀을 실제 투명 알파로 제거한다. 머리·셔츠·바지·신발·휴대폰의 자연스러운 외곽선과 의상 내부 회색 디테일은 보존한다. 전신 자세·프레임 위치·LED를 유지하고 배경·빛줄기·그림자·테두리를 추가하지 않는다.

`prepare-flashlight-run.mjs`로 최종 가로 시트를 다시 패킹하고 출력 LED 좌표를 광원에 반영했다. 보정본 8·9번 프레임의 발이 기존 기준선을 2px 넘어서, 신발을 자르지 않고 셀 안 배치를 2px 올렸다. 16개 셀을 어두운 배경에 합성해 외곽을 확인한다. 참고: 투명 PNG 뷰어만으로 확인하지 않고 실제 배경 위 합성 결과도 확인해야 반투명 매트가 드러난다.
