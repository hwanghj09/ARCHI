# 14층 연구본부 스프라이트

생성: 2026-09-26, built-in `image_gen` (`image_gen__imagegen`).

남색 마감과 정전 설정에 맞춘 출입문 3종, 전용 소품 4종. 문은 복도와 방 안에서 같은 파일을 사용한다. 모니터와 전자 표시등은 꺼져 있다. 소품 원본은 `../floor-kit/source/`, 규격화한 파일은 `../floor-kit/`에 저장했다. 기존 `scripts/prepare-floor-kit.ps1`로 투명 영역을 트림하고 비율 유지·최근접 보간·하단 8px 여백 규칙을 적용했다. 게임에서 작업등을 켜면 기존 방 조명 로직이 자료실을 밝힌다.

| 파일 | 출력 크기 | 게임 너비 |
| --- | --- | --- |
| archive-door.png | 생성 원본 | 130 |
| data-door.png | 생성 원본 | 150 |
| observation-door.png | 생성 원본 | 130 |
| ../floor-kit/archive-reading-desk.png | 512×256 | 280 |
| ../floor-kit/data-workstation.png | 512×256 | 276 |
| ../floor-kit/observation-console.png | 512×256 | 272 |
| ../floor-kit/archive-worklight.png | 256×256 | 106 |
| restroom-door.png | 생성 원본 793×1984, 화장실 문 (2026-09-29 추가, 2026-10-02 dataset 테마 `.metal`에 연결) | 145 |

## 검증

- 소품 4종의 PNG 크기, 투명 알파, 하단 8px 여백 검사 통과.
- Chromium에서 문 3종과 새 소품 이미지 로드 및 바닥선 570px 정렬 확인.
- 세 방 왕복과 안팎 출입문 위치 대응, 자료실 암전 중 열람 차단·작업등 점등 후 단서 열람·재입장 시 점등 상태 유지 확인.
- 데이터 연구실·사용자 실험실 단서, 390×844 모바일 화면, 15층 문 스타일 분리 확인. 페이지 스크립트 오류 없음.
- 실행: 로컬 QA 스크립트 `.local/check-floor14.mjs` (Git 제외). 화면 캡처 `.local/floor14-*.png`.

## 화장실 문 추가 (2026-09-29)

- 생성: ChatGPT 이미지 생성. 기획은 `docs/floor-design/14F.md` 4장·6장(`restroom-door` 프롬프트)을 따랐다. 실제로 보낸 문장은 기록되지 않았다.
- 결과: 판 손잡이 없이 오른쪽 전체 높이의 세로 손잡이 홈, 루버 없는 아랫부분, 스테인리스 킥플레이트, 문틀 안쪽의 파란 세로 선.
- 기획과 다른 점: 기획은 "밝은 청회색"이었지만 **짙은 슬레이트 남색**으로 나왔다. 14F.md에 적어 둔 "더 어두운 대안"에 가까워 복도에서 튈 걱정은 줄었다. 파란 세로 선은 기획의 "가는 코발트"보다 조금 선명하다.
- 기존 문 3종과 겹치지 않는다. 다만 색이 `archive-door.png`와 비슷하니, 연결 후 캡처로 구분되는지 확인한다(자료실 문 x=400, 화장실 문 x=3612로 멀리 떨어져 있음).
- **아직 게임에 연결하지 않았다.** 연결 시 `index.html`에 `#dynamic-scene[data-theme="dataset"] .room-door.metal` 이미지 규칙을 추가한다. 게임 크기는 145×360(y=210)이다.

## 실제 생성 프롬프트

### archive-door

```text
Use case: stylized-concept. Production game sprite for ARCHI, Korean 2D side-scrolling mystery game in software-company research floor 14 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged clusters and outlines, subtle material wear, realistic adult proportions. Muted desaturated NAVY BLUE, graphite, cool steel colors, matching dark realistic illustrated game door textures. Strict orthographic FRONT elevation, no isometric or three-quarter view. Neutral dim ambient lighting, readable details. All electronic lights OFF. No characters, no text, no lettering, digits, logos or watermark. ONE full-bleed opaque closed door and its frame ONLY. Frame touches top, left and right canvas edges, threshold touches bottom edge. NO padding, outside wall, ground, surrounding room or scene. Tall portrait canvas aspect ratio approximately 2:5. Reinforced research archive steel door, solid windowless slate-navy metal leaf with two subtle vertical reinforcing ribs, dark graphite narrow frame, brushed steel horizontal lever handle at right at waist level, small recessed black numeric keypad panel without readable digits integrated into the right door leaf just above handle. Clearly secure paper records storage, not bank vault; no wheel. Threshold thin and straight.
```

### data-door

```text
Use case: stylized-concept. Production game sprite for ARCHI, Korean 2D side-scrolling mystery game in software-company research floor 14 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged clusters and outlines, subtle material wear, realistic adult proportions. Muted desaturated NAVY BLUE, graphite, cool steel colors, matching dark realistic illustrated game door textures. Strict orthographic FRONT elevation, no isometric or three-quarter view. Neutral dim ambient lighting, readable details. All electronic lights OFF. No characters, no text, no lettering, digits, logos or watermark. ONE full-bleed opaque closed door and its frame ONLY. Frame touches top, left and right canvas edges, threshold touches bottom edge. NO padding, outside wall, ground, surrounding room or scene. Tall portrait canvas aspect ratio approximately 2:5. Data research laboratory access door, full-height smoked midnight blue GLASS in brushed graphite frame, broad muted cobalt-blue frosted horizontal safety stripe halfway down, tall brushed steel vertical pull handle on right. Slim black unlit access card reader built into right frame. Very subdued silhouettes of OFF monitors behind glass. Glass dark opaque sprite, no transparent holes. No teal or green stripe.
```

### observation-door

```text
Use case: stylized-concept. Production game sprite for ARCHI, Korean 2D side-scrolling mystery game in software-company research floor 14 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged clusters and outlines, subtle material wear, realistic adult proportions. Muted desaturated NAVY BLUE, graphite, cool steel colors, matching dark realistic illustrated game door textures. Strict orthographic FRONT elevation, no isometric or three-quarter view. Neutral dim ambient lighting, readable details. All electronic lights OFF. No characters, no text, no lettering, digits, logos or watermark. ONE full-bleed opaque closed door and its frame ONLY. Frame touches top, left and right canvas edges, threshold touches bottom edge. NO padding, outside wall, ground, surrounding room or scene. Tall portrait canvas aspect ratio approximately 2:5. User behavior observation laboratory door, solid matte slate-indigo sound-insulated leaf with one small wide rectangular dark one-way observation window in upper third, window has thick black gasket; brushed steel lever handle at right at waist height, subtle lower acoustic panel, thin graphite frame. Small unlit black rectangular status indicator inset above the window with no text. Clinical, quiet, unsettling but ordinary research facility, no horror symbols.
```

### archive-reading-desk

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in software-company research floor 14 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtle material wear, realistic adult proportions. Muted desaturated navy blue, graphite and cool steel colors. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal top surface visible. Neutral dim ambient lighting but readable details. ALL screens and equipment lights completely OFF. No characters, text, lettering, digits, logos or watermark. ONE isolated complete furniture object with TRUE TRANSPARENT ALPHA outside silhouette and through all leg openings. No floor plane, opaque backdrop, cast shadow, glow, fog or checkerboard. Entire object visible centered with small padding. Bottom feet share straight horizontal baseline. A broad archive reading desk with dark navy metal legs, warm worn gray oak top, one OPEN ivory research notebook at center with fine illegible gray line marks, a short stack of navy folders and a closed archive box at left, loose record sheets on a clipboard at right, small antique anglepoise reading lamp with NO emitted light at back right. No monitor or computer, no chair. Clear knee space beneath tabletop. Landscape canvas, total silhouette width to height about 2.5:1, realistic desk height 0.85 meters.
```

### data-workstation

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in software-company research floor 14 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtle material wear, realistic adult proportions. Muted desaturated navy blue, graphite and cool steel colors. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal top surface visible. Neutral dim ambient lighting but readable details. ALL screens and equipment lights completely OFF. No characters, text, lettering, digits, logos or watermark. ONE isolated complete furniture object with TRUE TRANSPARENT ALPHA outside silhouette and through all leg openings. No floor plane, opaque backdrop, cast shadow, glow, fog or checkerboard. Entire object visible centered with small padding. Bottom feet share straight horizontal baseline. A wide data-labeling research workstation, slate gray desk top, deep navy metal legs and one drawer block at left. Twin black OFF flat monitors side by side, keyboard, small pen tablet, blue memo sheet attached to one monitor bezel, tidy blue data binders at right, compact dark workstation tower beneath desk at right. No chair. Landscape canvas, silhouette width to height about 2.15:1. Total height including monitors about 1.3 meters.
```

### observation-console

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in software-company research floor 14 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtle material wear, realistic adult proportions. Muted desaturated navy blue, graphite and cool steel colors. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal top surface visible. Neutral dim ambient lighting but readable details. ALL screens and equipment lights completely OFF. No characters, text, lettering, digits, logos or watermark. ONE isolated complete furniture object with TRUE TRANSPARENT ALPHA outside silhouette and through all leg openings. No floor plane, opaque backdrop, cast shadow, glow, fog or checkerboard. Entire object visible centered with small padding. Bottom feet share straight horizontal baseline. A wide user-behavior observation console on charcoal metal desk legs, two completely BLACK OFF flat monitors, small dark eyetracking camera centered above one monitor, keyboard, compact physiological sensor receiver with all status lights dark, neatly coiled sensor leads at right, a small stack of off-white observation record printouts on left. Navy drawer module at left under desk, clear knee space. Looks like human-computer interaction research observation equipment, NOT electronic repair bench. No visible heart waveform, illuminated graphs or emitters. No chair. Landscape canvas, total silhouette width to height 2.15:1, total height about 1.3 meters.
```

### archive-worklight

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in software-company research floor 14 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtle material wear, realistic adult proportions. Muted desaturated navy blue, graphite and cool steel colors. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal top surface visible. Neutral dim ambient lighting but readable details. ALL screens and equipment lights completely OFF. No characters, text, lettering, digits, logos or watermark. ONE isolated complete furniture object with TRUE TRANSPARENT ALPHA outside silhouette and through all leg openings. No floor plane, opaque backdrop, cast shadow, glow, fog or checkerboard. Entire object visible centered with small padding. Bottom feet share straight horizontal baseline. A small compact two-tier navy steel utility trolley on caster wheels carrying a large rechargeable rectangular portable LED worklight with metal carrying handle and adjustable U-shaped stand. Pale gray rectangular LED diffuser clearly visible facing front but switched OFF with no glow. Two spare dark batteries and coiled cable neatly on lower shelf. This is visibly a worklight trolley, not a medical instrument trolley. Square canvas, total silhouette width to height about 1:1, total height about 1 meter. No text on batteries.
```
