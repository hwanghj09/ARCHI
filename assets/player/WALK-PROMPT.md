# 정수호 걷기 애니메이션

현재 게임은 같은 화풍으로 걷기 한 주기를 다시 그린 `jeong-suho-walk-eight.png`를 사용한다. 접지·하강·통과·발끝 밀기를 양발로 반복하는 8프레임이며, 이전 12프레임 조합은 제거했다. 새 원본·내보내기·휴대폰 변형은 [movement-inbetweens-source/README.md](movement-inbetweens-source/README.md)를 참고한다. 아래는 보존된 6프레임 버전의 제작 기록이다.

- 생성 도구: 내장 image_gen
- 참조: `jeong-suho-source.png`, 기존 Notion 주인공 디자인
- `jeong-suho-walk-source.png`: 8프레임 생성 원본
- `jeong-suho-walk.png`: 보존된 기존 4프레임 시트, 1024×256 PNG.
- `jeong-suho-walk-down-1.png`, `jeong-suho-walk-down-2.png`: 추가된 중간 착지 자세 2장, 각각 256×256 RGBA PNG. 기존 생성 원본의 1, 5번 자세를 추출했으며 새 이미지 생성은 하지 않았다.
- `jeong-suho-walk-six.png`: 게임에서 사용하는 1536×256 PNG, 6열 × 1행, 프레임당 256×256, 투명 배경.
- 프레임 순서: 원본 0, 1, 2, 4, 5, 6번. 기존 네 자세 사이에 좌우 발의 중간 착지 동작을 하나씩 삽입했다. 기존 네 프레임의 픽셀은 변경하지 않았다.
- 내보내기: 최근접 보간으로 정규화, 기존 스프라이트에 머리 중심과 발바닥 기준선 정렬, 알파 유지
- 재생: 이동 거리 184/6px당 한 프레임, 6프레임 반복. 한 주기는 기존과 같은 184px 이동(현재 이동 속도에서 약 0.92초). 실제 이동이 없으면 기존 단일 스프라이트로 복귀.

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
