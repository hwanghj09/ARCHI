# 정수호 플레이어 스프라이트

- 출처: [Notion 리뉴얼 기획 / 주인공](https://app.notion.com/p/3e0d568232bd8001a295d103a723bf29)
- 규격: 256x256 PNG, 투명 배경, 오른쪽을 향한 보행 자세 1프레임
- 생성: 내장 image_gen 도구에 Notion 이미지를 참조로 제공
- 내보내기: 생성 원본을 최근접 보간으로 256x256 변환, 알파 채널 유지

## 파일

- `jeong-suho.png`: 게임에 사용할 256x256 스프라이트
- `jeong-suho-source.png`: 생성된 고해상도 원본
- `notion-reference.png`: Notion 주인공 페이지의 참고 이미지

## 사용한 프롬프트

Notion 원본 프롬프트를 포함하며, 게임에 사용할 수 있도록 배경을 투명하게 변경했습니다.

```text
Use case: identity-preserve
Asset type: a single player character sprite PNG for ARCHI, a 2D side-scrolling web game.
Input image 1 is the approved Notion character reference. Faithfully preserve this exact character's face, black hairstyle, tired expression, adult proportions, white shirt, rolled sleeves, loose black necktie, dark employee lanyard and ID badge, black slacks, gray-white sneakers, right-facing side profile and walking pose. No reinterpretation as a chibi or simplified geometric character.

Original art direction from the user's Notion specification:
A single full-body 2D pixel art character sprite for a side-scrolling game, centered on a plain solid medium-dark gray background, clean sprite presentation, 256x256 style, readable silhouette, crisp pixel edges, detailed but compact pixel shading.

Character: Jeong Suho, a tired Korean male software developer in side view facing right. He is walking in a side-scrolling profile pose, with a slightly hunched posture, looking exhausted but determined. Young adult East Asian man with messy black hair, pale skin, tired eyes, subtle dark circles, serious expression.

Outfit: wrinkled white office shirt with rolled-up sleeves, loosened black necktie hanging down, black slacks, gray-and-white sneakers, and an employee ID card on a dark lanyard around his neck. The employee badge should hang at chest level and be clearly visible. The clothes should look like a tired office worker who has been working late.

Pose: side-view walking pose facing right, one leg forward and one leg back, arms hanging naturally with slight tension, as if walking slowly and tiredly. The body should lean slightly forward. The tie should hang slightly diagonally as if moving a little while walking.

Style: high-quality pixel art sprite, game-ready, side-scrolling sprite aesthetic, detailed anime-inspired pixel character, clean outline, limited but polished palette, muted tones, no extra props, no environment, no text, no UI, no effects, no shadow beyond minimal grounding, no multiple frames, only one single sprite.

Important details: black messy hair, tired office worker mood, white wrinkled shirt, loose black tie, black pants, gray sneakers, visible employee ID lanyard, plain background, full body visible, sprite-like composition, centered.

Delivery adjustment for a game sprite: replace the gray background with REAL TRANSPARENT ALPHA, not a painted checkerboard, not white or gray. No floor or cast shadow. Only ONE single full-body sprite, not a sheet, no text or UI. The character must be fully visible and centered with padding on all sides, in a square canvas. Target production size is exactly 256 x 256 pixels; draw genuine crisp pixel art at that resolution with a consistent pixel grid and compact detailed shading. Keep the approved look and silhouette extremely close to the reference. Empty hands, no phone or added props. If you output a larger canvas, make it a perfect nearest-neighbor integer enlargement of a 256 x 256 source, with no fine subpixel detail.
```

