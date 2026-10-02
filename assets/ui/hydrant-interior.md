# 소화전 내부 스프라이트

- 생성: 내장 image_gen, 2026-10-02
- 파일: `hydrant-interior.png`
- 규격: 256×256 RGBA PNG, 단일 프레임. 생성 원본을 최근접 보간으로 출력하고 런타임에서도 `image-rendering: pixelated` 사용.
- 참조: `assets/background/floor17/service-corridor.png`의 붉은 유리문·둥근 호스 릴 소화전, `assets/objects/floor17/stairs.png`의 정면 픽셀 아트. 외부는 투명하고 소화전 내부는 불투명.
- 사용: `js/interaction/inventory.js`, 소화전 조사 화면. 열쇠는 이미지에 포함하지 않고 하단 선반에 별도 버튼으로 배치해 획득 시 제거한다.

## 생성 프롬프트

Use case: stylized-concept. Create a production ARCHI game sprite matching the provided game assets. Reference 1 (service corridor) is the EXACT object design and palette reference: the small RED GLASS-FRONT FIRE HOSE CABINET near the center, with a circular gray hose reel and slender nozzle at right. Reference 2 is the pixel-art sprite rendering and orthographic framing reference. Draw THAT SAME cabinet with its glass-front red door OPEN, showing its coiled gray hose reel, small red central hub, connection valve, and right-side nozzle. Do not substitute a different cabinet with folded vertical hose. Flat straight-on orthographic front elevation, restrained realistic anime-inspired PIXEL ART, dark desaturated blue-gray shading and dull dark red metal, crisp pixel clusters matching the 256px tile game art. Not a photo, no photographic grain, no high-detail photoreal fabric, no perspective camera. Single square 256x256 game sprite, pixel grid authored for 256x256 pixels. Entire object within the square with 8px safe margin. Open glass door angled out left within the sprite bounds; cabinet occupies rightmost 70 percent of sprite, both door and cabinet fully visible. Leave a small empty shelf below the coiled hose at local x=62%, y=83% to place a separate clickable key. NO KEY in the artwork. Transparent RGBA outside the cabinet and open door; the interior is opaque dark gray. No wall, background, floor, UI, labels, lettering, captions or watermark. Output exactly one 256x256 sprite, not a sprite sheet, no extra poses.
