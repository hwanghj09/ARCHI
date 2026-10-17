# 캐릭터와 맞춘 눈 도트

- 내장 image_gen 사용, 2026-10-17
- 스타일 참고: `assets/player/jeong-suho-walk-six.png`
- 형태 참고: 기존 `red-eye-sclera.png`, `red-eye-iris.png`
- 결과: `red-eye-sclera-pixel.png` 48×40 / 16색, `red-eye-iris-pixel.png` 16×16 / 8색. 투명 여백을 정리하고 최근접 보간과 무디더 팔레트로 내보냄.
- 미세 실핏줄·사진 질감을 버리고 외곽선과 큰 명암 면으로 다시 그림. CSS 가장자리 그라데이션과 홍채 흐림을 제거해 도트 윤곽을 보존.

## Shared prompt

Use case: stylized-concept. REDRAW a 2D horror game sprite in the SAME PIXEL ART LANGUAGE as the office-worker character in reference image 1. Reference image 1 is the STYLE reference: dark thin pixel outlines, compact connected pixel clusters, clean cel-like 3-to-4-step shading, subdued anime-inspired sprite art. Reference image 2 is ONLY the eye component's SHAPE and COLOR concept. Do not retain its photographic material. This must be a hand-drawn game sprite, NOT a downsampled photograph, NOT a pixelation/mosaic filter, NOT a high resolution painting. Use a small deliberate palette, around 12 colors maximum. Flat coherent color areas, one or two small angular highlight clusters, no smooth gradients, no glossy photorealism, no branching veins, no fine anatomical fibers, no procedural noise, no soft airbrush, no blur, no glow. Match the simplicity and dark outline weight of the character's face and clothes. Preserve the horror concept and shape of the eye reference but simplify its surface radically. Genuine transparent alpha background. No text, labels, frame, UI, character drawing or background scene. Only one isolated component, tightly framed without clipping. If the output canvas is large it must appear as a perfect nearest-neighbor enlargement of a tiny deliberately drawn pixel sprite, no additional high-resolution details.

## Sclera addition

Component: wide-open RED SCLERA and dark burgundy eyelid rim only. Logical sprite size 48 pixels wide by 40 pixels tall. Continuous unbroken red sclera interior with NO iris and NO pupil. Rounded wide-open eye shape. Sclera itself should be blood red, not white or pale pink. Shade volume using 4 simple red planes and dark red eyelid outline, not vein texture. No iris or hole.

## Iris addition

Component: isolated small perfectly ROUND DARK BURGUNDY IRIS with a black round pupil, logical sprite size 16 by 16 pixels. Deliberately draw a stepped pixel circle, no elliptical shape. Only 5 or 6 colors including black, deep burgundy, muted red and one tiny dull light pixel highlight. Three broad coherent color rings or clusters instead of radial hairlike fibers. No sclera, no eyelids, no extra objects.
