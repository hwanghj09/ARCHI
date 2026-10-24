# 12층 네트워크 랙 LAN 상태 스프라이트

- 제작: 2026-10-23, built-in `image_gen`, 투명 배경.
- 참조: `../floor-kit/network-rack.png`.
- 원본: `source/network-rack-lan-states.png`.
- 출력: `network-rack-lan-states.png`, 512×512 RGBA, 가로 2프레임(각 256×512).
- 왼쪽: LAN 케이블 연결. 오른쪽: 케이블 분리, 커넥터가 아래로 늘어짐.
- 내보내기: 프레임별 alpha > 8 경계로 자른 뒤 비율 유지·nearest 축소, 높이 496px, 가로 중앙, 아래 투명 여백 8px. 발 기준선 y=504.
- 12층 모델 평가실 네트워크 랙에 적용. `f12-network-isolated` 획득 즉시 오른쪽 프레임으로 바뀌며, 재방문·불러오기에도 유지된다. 기존 위치·표시 크기·LAN 조작 방식은 유지한다. 검증: `tests/story-puzzles.mjs`.

## 최종 생성 프롬프트

```text
Use case: precise-object-edit.
Asset type: production transparent pixel-art game sprite sheet for ARCHI, a 2D side-view office mystery game.
Reference / edit target: the provided network-rack.png. Preserve its exact dark steel open-frame rack design, front-facing elevation, blue and yellow patch leads, four switch rows, bottom cable spool, realistic proportions, restrained crisp pixel clusters, narrow rails, feet, and material colors. This is the same existing game object in two states, not a redesigned rack.

Create ONE square transparent PNG sprite sheet containing EXACTLY TWO equal vertical cells SIDE BY SIDE, left connected and right unplugged, no borders or divider. Desired sheet 512x512, each cell 256x512; if higher resolution, retain this exact 1:1 overall ratio and 1:2 cell ratio. Within each cell the rack is precisely the same size and position, centered x, top at 8/512 cell height, feet baseline y=504/512. Preserve identical pixel alignment and all unrelated equipment across both frames.

Puzzle-readable change: use ONE clearly identifiable ochre-yellow Ethernet cable on the uppermost switch, connected to its far-right port. Its opposite end runs down the rack's right cable-management rail and remains attached below.
LEFT cell: this single yellow RJ45 plug is seated in the uppermost switch far-right port, small restrained green link LED next to that port.
RIGHT cell: ONLY that same plug is disconnected; the same cable now hangs in a readable curved loop down the front-right open rack, with the loose RJ45 connector visible around the rack's upper-middle height. The far-right port is visibly empty and its tiny link LED is OFF. All other blue and yellow wires, other LEDs, switches, spool, rails, feet and rack geometry remain identical. The cable and plug must be distinguishable at a small on-screen rack height of about 190px. Keep the loose loop within the rack silhouette, do not add another cable spool or extra objects.

Strict front orthographic elevation, minimal visible top surface, detailed hard-edged pixel-art game prop matching the reference, no isometric perspective, no photography, no blurry painting. Entire rack including feet visible in BOTH cells. Real transparent alpha in the exterior AND every opening within the rack. No background, wall, floor, ground shadow, fog, glow halo, checkerboard pattern, panel labels, captions, letters, numbers, logos, or watermark. No humans or hands. No extra frames.
```
