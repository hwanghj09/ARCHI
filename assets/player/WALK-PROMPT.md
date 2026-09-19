# 정수호 걷기 애니메이션

- 생성 도구: 내장 image_gen
- 참조: `jeong-suho-source.png`, 기존 Notion 주인공 디자인
- `jeong-suho-walk-source.png`: 8프레임 생성 원본
- `jeong-suho-walk.png`: 1024x256 PNG, 4열 x 1행, 프레임당 256x256, 투명 배경
- 프레임 순서: 기존 0, 2, 4, 6번 자세를 왼쪽부터 0~3번으로 배치
- 내보내기: 최근접 보간으로 정규화, 기존 스프라이트에 머리 중심과 발바닥 기준선 정렬, 알파 유지
- 재생: 이동 거리 46px당 한 프레임, 4프레임 반복. 한 주기는 기존과 같은 184px 이동(현재 이동 속도에서 약 0.92초). 실제 이동이 없으면 기존 단일 스프라이트로 복귀.

## 원본 8프레임 생성에 사용한 프롬프트

```text
Use case: identity-preserve.
Asset type: production 2D pixel-art WALK ANIMATION SPRITE SHEET for Jeong Suho, for the ARCHI side-scrolling game.
Reference image 1 shows the exact approved character. Preserve the face, messy black hair, pale tired eyes, adult slim proportions, hunched office-worker posture, white creased rolled-sleeve shirt, loose black necktie, dark ID lanyard and badge, black slacks, and gray-white sneakers. Same muted anime pixel art and crisp pixel clusters as the reference. Empty hands, no new props. All poses face RIGHT in strict side profile. Never chibi.

Create exactly EIGHT DISTINCT sequential poses of one natural walking cycle, in a regular 4-column by 2-row contact sheet. Read left to right on top row, then left to right on bottom row. This must be a real alternating walk cycle, NOT copies of the same walking silhouette.
Frame 1: near leg extends forward for heel strike, far leg extends back; near arm swings back, far arm forward.
Frame 2: near leg bears weight, knee slightly bends, far heel lifts; body lowers 2 pixels.
Frame 3: near leg is straight under torso, far knee bends and swings past the planted leg, feet close together.
Frame 4: far knee advances, near foot pushes off on toes; body rises 2 pixels.
Frame 5: far leg extends forward for heel strike, near leg extends back; near arm forward, far arm back. This is the opposite contact to frame 1.
Frame 6: far leg bears weight, near heel lifts; body lowers 2 pixels.
Frame 7: far leg straight under torso, near knee bends and swings past planted leg, feet close together.
Frame 8: near knee advances, far foot pushes off on toes; body rises 2 pixels. This flows back into frame 1.
Make the passing poses in frames 3 and 7 CLEARLY different from the extended contacts in 1 and 5. Arms counter-swing gently with legs; tie and ID sway only a little.

Layout: square cells in a precise seamless 4x2 grid, each cell conceptually 256x256; entire sheet 1024x512 (or exact integer multiple with the SAME 2:1 aspect ratio). Each body has identical size and horizontal hip anchor at cell x=128, ground baseline at cell y=239, head around y=18; keep every character completely inside its own cell with padding. The character walks IN PLACE within each cell, never shifts across cells. Do not draw cell borders or dividers. Consistent stable head and torso from frame to frame, only the small walk bob. No perspective changes, no changes in lighting or outfit. DO NOT scale individual characters differently.

Background must be REAL TRANSPARENT ALPHA throughout all empty areas, including between arms and body and between the legs. No white or gray backdrop, no checkerboard drawn into pixels, no floor, no shadows, no text, no labels, no frame numbers, no UI. Clean silhouettes, no stray pixels or colored halos. Output only the animation sheet.
```
