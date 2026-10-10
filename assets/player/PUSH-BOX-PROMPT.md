# 정수호 박스 밀기 애니메이션

- 생성: 내장 image_gen. 기존 `jeong-suho.png`를 정수호 외형 참조로 사용.
- 오른쪽을 향해 두 손으로 박스를 미는 6프레임 반복 동작. 박스가 이미지에 포함되어 있다.
- `jeong-suho-push-box-source.png`: 생성 원본, 1536×1024 RGBA PNG, 3열×2행.
- `jeong-suho-push-box.png`: 게임용 시트, 1536×256 RGBA PNG, 6열×1행. 프레임당 256×256.
- `jeong-suho-push-box.json`: 프레임 좌표, 재생 시간, 정렬 정보.
- `../../docs/previews/suho-push-box.gif`: 6프레임 반복 미리보기, 프레임당 130ms, 한 주기 780ms.
- `../../scripts/prepare-push-box.cjs`: 원본으로 시트, JSON, GIF 재생성. 저장소 루트에서 `node scripts/prepare-push-box.cjs` 실행. Node.js와 sharp 필요.

## 사용 및 정렬

원본을 512×512 셀로 나누고 각 프레임 전체를 평행이동해 박스 우측 경계와 밑면을 원본 좌표 (500, 480)에 맞춘 후 최근접 보간으로 256×256으로 축소했다. 알파 채널은 유지했다. 프레임별 이동량은 JSON에 기록했다. 미세한 신체 흔들림은 유지되므로 모든 발의 픽셀이 완전히 같은 높이는 아니다.

PNG 프레임 순서는 왼쪽부터 0~5이다. `x = frameIndex * 256`, `y = 0`, `width = height = 256`으로 읽는다. 130ms마다 프레임을 바꾸며 반복한다. 왼쪽 방향은 렌더링 시 가로 반전한다.

발 기준선은 셀 y≈244이다. 기존의 세계 바닥 y=570에 배치할 때 셀 표시 크기를 S라고 하면 셀 상단은 `570 - 244 * S / 256`이다. 예를 들어 S=192면 상단 y=387이다. 박스는 캐릭터와 함께 들어 있는 연출용 시트이므로 별도 박스 오브젝트를 같은 위치에 중복 렌더링하지 않는다. 게임의 밀기 입력, 충돌 처리, 애니메이션 상태 전환은 아직 연결하지 않았으며 이 커밋은 아트 에셋 추가이다.

## 검증

- PNG 크기와 6개 정사각형 셀 확인.
- 실제 알파 채널을 다른 배경 위에 합성해 투명 영역 확인.
- GIF 6프레임, 무한 반복, 프레임별 130ms 확인.

## 최초 생성 프롬프트

```text
Use case: identity-preserve.
Asset type: production 2D pixel-art sprite animation sheet for ARCHI side-scrolling web game, Jeong Suho PUSHING A CARDBOARD BOX.
Reference image 1 is the exact approved character identity, not merely a style reference. Faithfully preserve his face, messy black hair, pale skin, slim realistic young adult Korean male proportions, wrinkled white office shirt with rolled sleeves, loose black necktie, dark ID lanyard and employee badge, black slacks, gray-white sneakers. Match the reference's crisp detailed anime-inspired pixel clusters, muted colors, clean silhouette. Never chibi.

Generate exactly SIX distinct sequential frames of a seamless heavy-box pushing walk cycle, arranged in a precise THREE-COLUMN TWO-ROW contact sheet. Read left to right across the top row, then left to right across the bottom row. Every frame shows ONE full-body Suho on the LEFT and ONE identical closed brown corrugated cardboard box on the RIGHT. All frames strict orthographic SIDE PROFILE facing RIGHT, no perspective camera. Box is waist-high, plain taped carton with no readable markings. It sits on the same ground baseline as his shoes. Both palms remain pressed against the LEFT VERTICAL FACE of the box, around its upper third, elbows slightly bent. His torso leans forward about 25 degrees with obvious effort; push the box along the floor, do not lift or carry it. Keep box size, location, tape and shading exactly identical across all six cells. Keep hand contact point fixed. Legs do the pushing walk IN PLACE; no root translation. Subtle effort through shoulder and elbow changes, low stable head position; badge and tie hang down naturally.

Frame 1 upper left: near leg forward bent bearing weight, far leg extended back pushing on toes.
Frame 2 upper middle: near leg straightening beneath hips; far knee flexing as rear foot lifts to advance.
Frame 3 upper right: far knee swings forward beneath body, near heel lifting; legs closer together, distinct passing pose.
Frame 4 lower left: far leg forward bent bearing weight, near leg extended back pushing on toes, opposite contact to frame 1.
Frame 5 lower middle: far leg straightening beneath hips, near knee flexing as rear foot lifts to advance.
Frame 6 lower right: near knee swings forward beneath body, far heel lifting, opposite passing pose; flows naturally back to frame 1.
The six lower-body silhouettes MUST be genuinely different. No stationary repeated poses.

Layout exact 1536x1024 pixels, 3 columns by 2 rows of 512x512 square cells, without gutters or borders. Designed on a 256x256 logical pixel grid per cell enlarged 2x with hard crisp pixel edges. Within EACH 512 square cell: head approx x=185,y=135; hip approx x=170,y=310; shoe soles y=474. Box occupies approx x=305..470,y=290..474, all limbs and hair stay inside cell. Generous transparent padding. All six instances identical character scale, baseline, orientation and palette. Human would render about 162 pixels tall in the game.

Background MUST be REAL TRANSPARENT ALPHA throughout every empty area, including between the limbs. No painted checkerboard, white backdrop, floor, cast shadows, environment, motion streaks, text, labels, frame numbers, UI, borders, watermarks, extra people or objects. Output only the complete six-frame transparent animation sheet.
```

## 최종 보정 프롬프트

입력 1: 첫 생성 시트. 입력 2: 기존 정수호 스프라이트.

```text
Use case: identity-preserve.
Asset type: production 2D pixel-art sprite animation sheet for ARCHI side-scrolling web game, Jeong Suho PUSHING A CARDBOARD BOX.
Reference image 1 is the exact approved character identity, not merely a style reference. Faithfully preserve his face, messy black hair, pale skin, slim realistic young adult Korean male proportions, wrinkled white office shirt with rolled sleeves, loose black necktie, dark ID lanyard and employee badge, black slacks, gray-white sneakers. Match the reference's crisp detailed anime-inspired pixel clusters, muted colors, clean silhouette. Never chibi.

Generate exactly SIX distinct sequential frames of a seamless heavy-box pushing walk cycle, arranged in a precise THREE-COLUMN TWO-ROW contact sheet. Read left to right across the top row, then left to right across the bottom row. Every frame shows ONE full-body Suho on the LEFT and ONE identical closed brown corrugated cardboard box on the RIGHT. All frames strict orthographic SIDE PROFILE facing RIGHT, no perspective camera. Box is waist-high, plain taped carton with no readable markings. It sits on the same ground baseline as his shoes. Both palms remain pressed against the LEFT VERTICAL FACE of the box, around its upper third, elbows slightly bent. His torso leans forward about 25 degrees with obvious effort; push the box along the floor, do not lift or carry it. Keep box size, location, tape and shading exactly identical across all six cells. Keep hand contact point fixed. Legs do the pushing walk IN PLACE; no root translation. Subtle effort through shoulder and elbow changes, low stable head position; badge and tie hang down naturally.

Frame 1 upper left: near leg forward bent bearing weight, far leg extended back pushing on toes.
Frame 2 upper middle: near leg straightening beneath hips; far knee flexing as rear foot lifts to advance.
Frame 3 upper right: far knee swings forward beneath body, near heel lifting; legs closer together, distinct passing pose.
Frame 4 lower left: far leg forward bent bearing weight, near leg extended back pushing on toes, opposite contact to frame 1.
Frame 5 lower middle: far leg straightening beneath hips, near knee flexing as rear foot lifts to advance.
Frame 6 lower right: near knee swings forward beneath body, far heel lifting, opposite passing pose; flows naturally back to frame 1.
The six lower-body silhouettes MUST be genuinely different. No stationary repeated poses.

Layout exact 1536x1024 pixels, 3 columns by 2 rows of 512x512 square cells, without gutters or borders. Designed on a 256x256 logical pixel grid per cell enlarged 2x with hard crisp pixel edges. Within EACH 512 square cell: head approx x=185,y=135; hip approx x=170,y=310; shoe soles y=474. Box occupies approx x=305..470,y=290..474, all limbs and hair stay inside cell. Generous transparent padding. All six instances identical character scale, baseline, orientation and palette. Human would render about 162 pixels tall in the game.

Background MUST be REAL TRANSPARENT ALPHA throughout every empty area, including between the limbs. No painted checkerboard, white backdrop, floor, cast shadows, environment, motion streaks, text, labels, frame numbers, UI, borders, watermarks, extra people or objects. Output only the complete six-frame transparent animation sheet.
Revision requirements: Use image 1 as the six-frame layout and pushing-pose edit target; use image 2 as Suho's identity and outfit reference. Fix ONLY the following defects of image 1: remove ALL blurred ambient glow and translucent shading in empty space; empty space must be alpha zero and the character and carton solid opaque hard-edged sprites, no atmospheric rendering. Put back the visible ID card on its dark lanyard around Suho's neck, hanging toward his lower chest naturally in the lean, like image 2. Use crisp pixel shading, less soft fine texture, matching image 2. Align every carton to the SAME coordinates within its square cell (left x=310, right x=475, top y=220, bottom y=480) and keep all soles at the same y=480 baseline. Preserve six distinct pushing leg poses, alternating near and far legs across the two rows. Preserve facial identity and white shirt. No background of any kind, no glow, no vignette, no shadows. Actual cutout transparent sprite sheet.
```
