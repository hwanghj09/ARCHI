# 옥상 열쇠 스프라이트

- 생성: 내장 image_gen, 2026-10-02
- 파일: `rooftop-key.png`, 256×256 RGBA PNG, 단일 프레임.
- 참조: `hydrant-interior.png`의 픽셀 아트 화풍. 낡고 때가 묻은 황동 열쇠.
- 출력: 최근접 보간으로 256×256 저장, 투명 배경과 손잡이 구멍 유지. 런타임 `image-rendering: pixelated`.
- 사용: 소화전 안의 획득 버튼과 가방에서 같은 이미지를 공유한다.

## 생성 프롬프트

Use case: stylized-concept. Asset type: ARCHI inventory item sprite. Reference image is the approved fire hose cabinet sprite, use its restrained realistic pixel-art rendering, crisp pixel clusters and muted midnight-game palette. Draw ONE slightly dirty worn brass rooftop door key, alone on actual transparent background. A small ordinary utilitarian building door key with an oval bow containing a clearly open hole, a narrow shaft, and distinctive cut teeth along the lower blade; subtle grime in crevices, tarnished brown brass, a few dull pale gold edge highlights. No ornate fantasy key, no tag or keychain. Broad side view, flat readable silhouette, diagonally from lower-left bow to upper-right blade, about 20 degrees above horizontal. Authored for a square 256x256 RGBA game sprite; key fits completely inside canvas with 16px safe margins, occupies about 85% of width and 45% of height, centered. Match game sprite shading; no photorealistic photographic texture, no smooth vector gradients, no floor or cast shadow outside object, no backdrop, no painted checkerboard, no text, no labels, no border, no watermark. Transparency must also appear through the key's bow hole. Output single item, single frame.
