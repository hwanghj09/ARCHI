# 15층 연구본부 스프라이트

- 생성 도구: built-in `image_gen` (`image_gen__imagegen`), 2026-09-25.
- 소품 원본: `../floor-kit/source/`. 문은 생성 원본을 이 디렉터리에 그대로 저장했다.
- 소품 출력: `scripts/prepare-floor-kit.ps1`. 알파 경계로 트림 후 비율 유지, 최근접 보간, 8px 하단 여백. 앵커 `(canvasWidth/2, canvasHeight-8)`.
- 연구실 워크스테이션 6개, 복도·연구실·세미나실 보드 3개, GPU 이관 카트, 본부장 책상을 배치했다. 상자 2개는 기존 충돌 영역에 맞춰 CSS 배경으로 표시한다.
- 문은 복도와 방 안에 같은 이미지를 사용한다. 연구실 유리 보안문, 세미나실 방음문, 본부장실 목재문을 구분한다.
- 정전 설정에 맞춰 모니터와 장비 표시등은 꺼져 있다. 기존 조사 문구와 출입 위치를 유지한다.
- 검증: `npm run test:floor15` (이미지 로드, 크기·바닥선, 출입, 단서, 상자 충돌·점프, 모바일).

## 출력 파일

| 종류 | 파일 | 크기 및 배치 |
| --- | --- | --- |
| 연구 워크스테이션 | [research-workstation.png](../floor-kit/research-workstation.png) | 512×256 / 불투명 높이 231 / 게임 너비 266 |
| 연구 보드 | [research-board.png](../floor-kit/research-board.png) | 512×256 / 불투명 높이 229 / 게임 너비 362 |
| GPU 이관 카트 | [gpu-transfer-cart.png](../floor-kit/gpu-transfer-cart.png) | 256×256 / 불투명 높이 240 / 게임 너비 100 |
| GPU 운송 상자 | [gpu-shipping-crate.png](../floor-kit/gpu-shipping-crate.png) | 512×256 / 불투명 영역 (8, 105, 496, 143) / 충돌 크기 110×50 및 90×60 |
| 연구본부장 책상 | [research-director-desk.png](../floor-kit/research-director-desk.png) | 512×256 / 불투명 높이 206 / 게임 너비 298 |
| 연구실 보안문 | [research-door.png](research-door.png) | 생성 원본 / 게임 크기 140×320 |
| 세미나실 방음문 | [seminar-door.png](seminar-door.png) | 생성 원본 / 게임 크기 130×320 |
| 본부장실 목재문 | [director-door.png](director-door.png) | 생성 원본 / 게임 크기 120×330 |
| 화장실 문 | [restroom-door.png](restroom-door.png) | 생성 원본 793×1983 / 게임 크기 145×360 / 2026-10-02 research 테마 `.metal`에 연결 |

화장실 문(2026-09-30)은 ChatGPT 이미지 생성으로 만들었다. 기획과 프롬프트는 `docs/floor-design/15F.md` 4장·6장에 있다. 연구본부 소식지(`research-news-board`) 제작 기록은 `../floor-kit/DESIGN-COMPLETION-2026-10-01.md`에 있다.

## 실제 생성 프롬프트

각 요청은 다음 공통 문자열에 개별 문자열을 그대로 이어 붙였다.

```text
Use case: stylized-concept. Production game sprite for ARCHI, a Korean 2D side-scrolling mystery game set in a software-company research department on floor 15 at midnight during a power outage. Refined detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtle material wear, realistic adult proportions (player 162 world pixels tall), muted desaturated teal, graphite and steel colors. Strict orthographic FRONT elevation, absolutely no isometric or rotated three-quarter view, minimal top surface visible. Neutral dim ambient lighting yet readable details, all screens and equipment lights completely OFF. No characters, no text, no lettering, no digits, no logos, no watermark, no room or scene.
```

### 연구 워크스테이션

생성 원본 ID: `exec-34ad6c3b-37dd-4969-b7d3-d964fc92e39a.png`

```text
 ONE isolated complete furniture prop centered with ample padding. TRUE TRANSPARENT ALPHA outside silhouette and through all leg openings. No floor plane, opaque backdrop, cast shadow, glow, fog or checkerboard. Entire object visible. Bottom feet share a straight horizontal baseline. A wide research workstation: cool ash-gray desk with dark teal metal frame, twin dark OFF monitors on articulating stands, compact keyboard, one low closed laptop, a neat stack of blue-gray research binders at right, slim dark workstation tower underneath at left. No chair. Clearly a high-compute software research desk, no laboratory glassware. Broad landscape canvas, overall width to height about 2.15:1. Desk including monitors about 1.3m high.
```

### 연구 보드

생성 원본 ID: `exec-aaaced2b-7555-4483-9775-3aae149a9c8c.png`

```text
 ONE isolated complete furniture prop centered with ample padding. TRUE TRANSPARENT ALPHA outside silhouette and through all leg openings. No floor plane, opaque backdrop, cast shadow, glow, fog or checkerboard. Entire object visible. Bottom feet share a straight horizontal baseline. One broad freestanding double-sided research planning whiteboard in a dark teal metal frame on wheeled feet. Off-white board with very faint erased GRAPH LINES and a simple abstract node-link diagram, two pale memo sheets clipped at upper right and three small teal magnets. NO readable text or mathematical symbols or letters, no active screens. Thin tray with one marker. Broad landscape canvas, whole board and legs, width to height about 2.1:1. Overall about 1.75m tall.
```

### GPU 이관 카트

생성 원본 ID: `exec-72917cba-b7cb-42cb-b7d2-a917d9329022.png`

```text
 ONE isolated complete furniture prop centered with ample padding. TRUE TRANSPARENT ALPHA outside silhouette and through all leg openings. No floor plane, opaque backdrop, cast shadow, glow, fog or checkerboard. Entire object visible. Bottom feet share a straight horizontal baseline. One sturdy low steel transport trolley on four small caster wheels, holding two stacked flat rackmount GPU servers, dark charcoal vented front panels and recessed handles, secured by two muted teal transport straps. Blank cream checklist clipped at the handle. Clearly IT equipment being moved to a server room; all power lights OFF. Handle rises slightly above equipment. Square canvas. About 1m high overall.
```

### GPU 운송 상자

생성 원본 ID: `exec-d6bcacfd-86a9-4811-be1c-48399c99b7a4.png`

```text
 ONE isolated complete furniture prop centered with ample padding. TRUE TRANSPARENT ALPHA outside silhouette and through all leg openings. No floor plane, opaque backdrop, cast shadow, glow, fog or checkerboard. Entire object visible. Bottom feet share a straight horizontal baseline. One squat wide heavy-duty plywood shipping crate for a rackmount GPU server, dull gray-green reinforced corners and steel edge brackets, two recessed carry handles and black transport straps. One blank ivory inventory sticker and tiny generic fragile/glass PICTOGRAM without letters. Horizontal rectangular front-facing silhouette, width to height 2:1. No pallet beneath. Landscape canvas. This will be a jumpable obstacle only 0.6m high.
```

### 연구본부장 책상

생성 원본 ID: `exec-e6fe0915-5a2d-47fc-b13d-87b53ef7ade2.png`

```text
 ONE isolated complete furniture prop centered with ample padding. TRUE TRANSPARENT ALPHA outside silhouette and through all leg openings. No floor plane, opaque backdrop, cast shadow, glow, fog or checkerboard. Entire object visible. Bottom feet share a straight horizontal baseline. One broad executive research director desk with dark walnut panel front, subdued forest-green leather writing pad, single black OFF thin monitor slightly left of center, closed document folder with two blank approval sheets at right, compact dark pen holder and unlit small brass desk lamp. No chair. Sophisticated but practical software research manager office, very distinct from the gray twin-monitor workstation. Landscape canvas, overall width to height about 2.15:1. Overall about 1.3m high including monitor.
```

### 연구실 보안문

생성 원본 ID: `exec-60c0c295-d707-4be5-84a7-a04415f993a4.png`

```text
 ONE full-bleed opaque closed door and its frame ONLY. Frame touches top/left/right canvas edges, threshold touches bottom edge, absolutely no padding, outside wall or ground. Tall portrait canvas. A laboratory access door, full-height smoked blue-green GLASS in a brushed graphite metal frame, wide mint frosted safety band at middle, tall vertical steel pull handle at right. A small flush rectangular unlit card reader incorporated INTO the right frame near handle height. Minimal dark laboratory reflections behind glass, no outside wall. Portrait ratio 7:16. Modern high-tech software research room identity.
```

### 세미나실 방음문

생성 원본 ID: `exec-a29048d1-f33c-4730-8ed0-9c1eb8d4dd12.png`

```text
 ONE full-bleed opaque closed door and its frame ONLY. Frame touches top/left/right canvas edges, threshold touches bottom edge, absolutely no padding, outside wall or ground. Tall portrait canvas. A muted olive-gray acoustic seminar-room SINGLE DOOR with one tall NARROW vertical dark-glass observation slit near its left edge, a silver horizontal lever handle at right, padded inset lower panel with subtle horizontal seams and a dark brushed kick plate. Flat broad graphite frame. No card reader, no porthole. Portrait ratio 13:32. Clearly an acoustic meeting/seminar room entrance.
```

### 본부장실 목재문

생성 원본 ID: `exec-b17b9645-e948-4602-b6ab-9014531f2d32.png`

```text
 ONE full-bleed opaque closed door and its frame ONLY. Frame touches top/left/right canvas edges, threshold touches bottom edge, absolutely no padding, outside wall or ground. Tall portrait canvas. A solid dark WALNUT executive-office SINGLE DOOR with three large rectangular recessed wood panels stacked vertically, thin brass inlay lines, one small unlettered brass nameplate on upper panel and a substantial horizontal brass lever handle at right. Dark bronze hinges, no glass at all. Elegant restrained research director office identity. Portrait ratio 4:11.
```

