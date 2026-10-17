# 수호 웅크리기

- 생성 도구: 내장 image_gen. 기존 `jeong-suho.png`를 캐릭터·그림체 참조로 사용.
- 원본: `jeong-suho-crouch-source.png`, 1254×1254 RGBA, 2열×2행.
- 게임용: `jeong-suho-crouch.png`, 1024×256 RGBA, 4열×1행. 프레임당 256×256, 발바닥 y=237, 골반 x=128. 게임에서 기존 0.75배 배율과 좌우 반전을 사용.
- Ctrl 좌/우를 누른 동안 웅크리고, A/D 또는 좌우 방향키로 90px/s 이동. 이동 거리 24px마다 다음 프레임. 정지 시 첫 프레임.
- 웅크리는 동안 Shift 달리기와 점프 차단. 공중에서는 시작하지 않고 착지 후 적용.
- 충돌체 높이 162→96px, 발 위치와 회전 잠금 유지. 머리 위 장애물이 있으면 이동으로 벗어날 때까지 웅크림 유지.
- 창 초점 상실·메뉴·장면 전환에서 입력 해제. 장면 변경 시 충돌체 복구. 저장 좌표는 서 있는 몸체 중심으로 정규화해 기존 저장 규격 유지.
- 플래시가 켜져 있으면 웅크린 손 높이에서 계속 비춘다. 별도의 휴대폰 소지 웅크림 그림은 만들지 않았다.
- 재내보내기: `node scripts/prepare-crouch.mjs`. 원본 알파 보존, 최근접 보간, 자세별 골반·발 정렬.
- 검증: `node tests/crouching.mjs` (PNG 알파·규격·발 정렬 및 Chromium에서 Ctrl 입력·이동·프레임·점프/달리기 우선순위·착지·초점 상실·플래시·천장 충돌·저장 좌표·장면 전환).

## 생성 프롬프트

```text
Use case: identity-preserve. Asset type: production crouching animation sprite sheet for Jeong Suho in ARCHI, a 2D side-scrolling office horror game.
Input image 1 is the exact character identity and pixel-art style reference. Preserve the same slim adult Korean office worker, messy black hair, tired pale face, rolled-sleeve off-white shirt, loose black tie, dark ID badge/lanyard, charcoal trousers, gray-white sneakers. Match the original crisp hard-edged pixel clusters, adult proportions, muted palette.
Create exactly FOUR full-body poses arranged in a 2-column by 2-row grid of equal square cells, ordered left to right then top to bottom. ALL face RIGHT in strict orthographic side profile; no frontal, rear or three-quarter poses. Same head, limbs and clothing proportions at the SAME character scale in every cell.
All four poses are a deep crouch/squat with sharply bent knees, hips near knee height, both feet near the ground, torso leaning forward, arms bent beside knees. Head top is about 60% of standing height above the floor. NOT sitting, kneeling, crawling or standing. Frame 1: stationary balanced deep squat, arms resting loosely near knees. Frame 2: small rightward crouch step, front foot advances while hips remain low. Frame 3: balanced low passing crouch-walk pose. Frame 4: opposite leg advances to complete crouch-walk cycle. Subtle arm counter-motion. Every sprite baseline and horizontal pelvis anchor consistent, generous empty transparent space above and around them. In conceptual 256x256 cells, soles y237, pelvis x128, crown near y106 (standing crown y20). Keep head size identical to reference, do not shrink the entire person.
REAL transparent alpha background and between limbs. No ground, shadows, glow, props, phone, boxes, checkerboard, grid lines, text, labels, borders, watermark. Output only the four-frame transparent sprite sheet.
```

