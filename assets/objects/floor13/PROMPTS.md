# 13층 기술본부 스프라이트

생성: 2026-09-26, built-in `image_gen` (`image_gen__imagegen`).

강철색·흑연색 바탕에 주황색 포인트를 적용한 출입문 3종과 소품 5종. 문은 복도와 방 안에 동일하게 사용한다. 복도 공용석과 상황실에는 엔지니어 작업대, 검증실에는 UPS와 서버 검증 벤치, 교육장에는 노트북을 갖춘 2인용 책상을 배치했다.

소품 원본은 `../floor-kit/source/`, 게임용 PNG는 `../floor-kit/`에 있다. 기존 `scripts/prepare-floor-kit.ps1`로 알파 경계를 트림하고 비율 유지·최근접 보간·하단 8px 여백을 적용했다. 모든 이미지는 정전 시 기본 정지 프레임이다. UPS를 켜고 프린터에서 단서를 얻는 기능은 기존 상호작용 로직을 사용한다.

| 파일 | 게임용 규격 | 게임 너비 |
| --- | --- | --- |
| ops-door.png | 원본, 상황실 유리 양문 | 160 |
| testbay-door.png | 원본, 검증실 철망문 | 130 |
| training-door.png | 원본, 교육장 문 | 120 |
| ../floor-kit/support-workstation.png | 512×256, 불투명 높이 228 | 270 |
| ../floor-kit/incident-printer.png | 256×256, 불투명 높이 240 | 117 |
| ../floor-kit/testbay-ups.png | 256×256, 불투명 높이 240 | 107 |
| ../floor-kit/server-validation-bench.png | 512×256, 불투명 높이 232 | 260 |
| ../floor-kit/training-workstation.png | 512×256, 불투명 높이 185 | 300 |
| restroom-door.png | 원본 793×1983, 화장실 문 (2026-09-29 추가, 2026-10-02 support 테마 `.metal`에 연결) | 145 |

## 검증

- 소품 5종의 PNG 규격, 투명 알파, 하단 여백 검사 통과.
- Chromium에서 8종 이미지 로드, 바닥선 570px 정렬, 세 방 왕복과 안팎 출입문 위치 대응 확인.
- UPS 활성화 전에는 프린터 단서가 차단되고, 활성화 후에는 B2 장애 기록을 읽을 수 있으며 재입장 후에도 전원 상태가 유지됨을 확인.
- 근무 일지·검증 보고서·교육 자료·설문지 단서, 390×844 모바일 표시, 14층 문 스타일 분리 확인. 페이지 스크립트 오류 없음.
- 실행: `node .local/check-floor13.mjs`. 로컬 QA 스크립트와 `.local/floor13-*.png` 화면 캡처는 Git 제외.

## 화장실 문 추가 (2026-09-29)

- 생성: ChatGPT 이미지 생성. 기획은 `docs/floor-design/13F.md` 4장·6장(`restroom-door` 프롬프트)을 따랐다. 실제로 보낸 문장은 기록되지 않았다.
- 결과: 흑연색 강철 문, 허리 아래 주황 가로 띠, 오른쪽 밀판, 아래 루버, 킥플레이트, 문틀 오른쪽 빈 점검표 꽂이. 기획 항목이 모두 들어 있다.
- 기존 문 3종(유리 양문·철망문·교육장 문)과 겹치지 않는다. 16층 `restroom-door.png`와 루버·킥플레이트 배치는 비슷하지만 색(흑연 vs 청록)과 표지 유무로 구분된다.
- **아직 게임에 연결하지 않았다.** 연결 시 `index.html`에 `#dynamic-scene[data-theme="support"] .room-door.metal` 이미지 규칙을 추가한다. 게임 크기는 145×360(y=210)이고, 원본 비율 0.400은 게임 비율 0.403과 거의 같다.

## 실제 생성 프롬프트

### ops-door

```text
Use case: stylized-concept. Production door sprite for ARCHI, Korean 2D side-scrolling mystery game in technical support department floor 13 at midnight during power outage. Detailed anime-inspired pixel art with crisp hard-edged clusters and outlines, subtly worn materials, realistic adult proportions, dark realistic illustrated game textures. Muted desaturated STEEL GRAY, graphite and restrained ochre-orange accents. Strict orthographic FRONT elevation, no perspective or three-quarter view. Neutral dim ambient light but readable details. All electronic lights OFF. No characters, text, lettering, digits, logos or watermark. ONE full-bleed opaque CLOSED door and frame ONLY. Frame touches top/left/right canvas edges, thin threshold touches bottom edge. No padding, outside wall, floor, room or background scene. Tall portrait canvas approximately 1:2. A technical operations room double GLASS door: equal two narrow smoked charcoal blue glass leaves, thin central mullion, dark steel perimeter frame, two brushed steel vertical pull handles near center seam, thin muted orange horizontal safety band across BOTH leaves at waist height. Very faint silhouettes of OFF control-room monitors behind dark glass. Full closed double door fills entire canvas.
```

### testbay-door

```text
Use case: stylized-concept. Production door sprite for ARCHI, Korean 2D side-scrolling mystery game in technical support department floor 13 at midnight during power outage. Detailed anime-inspired pixel art with crisp hard-edged clusters and outlines, subtly worn materials, realistic adult proportions, dark realistic illustrated game textures. Muted desaturated STEEL GRAY, graphite and restrained ochre-orange accents. Strict orthographic FRONT elevation, no perspective or three-quarter view. Neutral dim ambient light but readable details. All electronic lights OFF. No characters, text, lettering, digits, logos or watermark. ONE full-bleed opaque CLOSED door and frame ONLY. Frame touches top/left/right canvas edges, thin threshold touches bottom edge. No padding, outside wall, floor, room or background scene. Tall portrait canvas approximately 2:5. A secure equipment testing cage door with rigid graphite steel perimeter frame and finely spaced diamond wire mesh filling main leaf. Behind mesh very dark opaque charcoal backing with faint indistinct equipment shadow, NOT transparency. Solid steel lower kickplate. Right-side latch and short steel lever, left hinges. A small ochre triangular electrical hazard pictogram containing one dark lightning bolt in upper third, no letters or numbers. Industrial but clean, not prison.
```

### training-door

```text
Use case: stylized-concept. Production door sprite for ARCHI, Korean 2D side-scrolling mystery game in technical support department floor 13 at midnight during power outage. Detailed anime-inspired pixel art with crisp hard-edged clusters and outlines, subtly worn materials, realistic adult proportions, dark realistic illustrated game textures. Muted desaturated STEEL GRAY, graphite and restrained ochre-orange accents. Strict orthographic FRONT elevation, no perspective or three-quarter view. Neutral dim ambient light but readable details. All electronic lights OFF. No characters, text, lettering, digits, logos or watermark. ONE full-bleed opaque CLOSED door and frame ONLY. Frame touches top/left/right canvas edges, thin threshold touches bottom edge. No padding, outside wall, floor, room or background scene. Tall portrait canvas approximately 3:8. A customer IT training classroom door, flat matte medium steel-gray leaf with a small narrow rectangular dark glazed vision panel in upper left, slim dark graphite frame, brushed silver horizontal lever on right, narrow low kickplate, small empty muted orange rectangular plaque centered near top with absolutely no text. Restrained office training facility, no wood grain.
```

### support-workstation

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in technical support floor 13 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtly worn realistic materials, realistic adult proportions. Muted desaturated steel gray and graphite, small restrained ochre ORANGE accents. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal visible top surfaces. Neutral dim ambient lighting but readable details. ALL monitors, equipment screens and lights OFF. No people, readable text, lettering, digits, logos or watermark. ONE isolated complete furniture object, TRUE TRANSPARENT ALPHA outside silhouette and through leg openings. No opaque backdrop, floor, cast shadow, fog, glow or checkerboard. Entire silhouette visible with small padding, feet rest on horizontal baseline. Wide technical support engineer desk: gray laminated desktop with dark graphite steel legs and left drawer cabinet, two OFF black monitors, keyboard and headset lying on desk, a closed service laptop at right, open paper shift log with indistinct lines at left, one muted orange folder. Compact unlit PC tower underneath right. No chair. Landscape canvas, overall silhouette width to height about 2.1:1, height including monitors about 1.3 meters.
```

### incident-printer

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in technical support floor 13 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtly worn realistic materials, realistic adult proportions. Muted desaturated steel gray and graphite, small restrained ochre ORANGE accents. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal visible top surfaces. Neutral dim ambient lighting but readable details. ALL monitors, equipment screens and lights OFF. No people, readable text, lettering, digits, logos or watermark. ONE isolated complete furniture object, TRUE TRANSPARENT ALPHA outside silhouette and through leg openings. No opaque backdrop, floor, cast shadow, fog, glow or checkerboard. Entire silhouette visible with small padding, feet rest on horizontal baseline. Freestanding compact enterprise laser printer on low wheeled equipment stand. Light cool-gray printer shell, dark graphite front and paper output slot, completely black OFF control display and no lit indicators. Small tidy white paper stack in lower shelf, blank small orange cable-identification tag visible at right. No paper emerging from output slot yet. Rectangular recognizable printer silhouette; square canvas, about 1 meter high. No loose cable trailing outside silhouette.
```

### testbay-ups

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in technical support floor 13 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtly worn realistic materials, realistic adult proportions. Muted desaturated steel gray and graphite, small restrained ochre ORANGE accents. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal visible top surfaces. Neutral dim ambient lighting but readable details. ALL monitors, equipment screens and lights OFF. No people, readable text, lettering, digits, logos or watermark. ONE isolated complete furniture object, TRUE TRANSPARENT ALPHA outside silhouette and through leg openings. No opaque backdrop, floor, cast shadow, fog, glow or checkerboard. Entire silhouette visible with small padding, feet rest on horizontal baseline. One freestanding industrial UPS battery cabinet, squat rectangular graphite steel housing on four short feet, front upper panel with black unlit LCD and a small dark circular status indicator, prominent physical rocker switch on upper right front, large lower horizontal ventilation louvers and access panel seams, narrow subdued orange safety stripe near base. Realistic data-center electrical equipment. No glowing LEDs, no visible numerals, no hazard text. Square canvas, overall width-to-height about 0.85:1, 1 meter high.
```

### server-validation-bench

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in technical support floor 13 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtly worn realistic materials, realistic adult proportions. Muted desaturated steel gray and graphite, small restrained ochre ORANGE accents. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal visible top surfaces. Neutral dim ambient lighting but readable details. ALL monitors, equipment screens and lights OFF. No people, readable text, lettering, digits, logos or watermark. ONE isolated complete furniture object, TRUE TRANSPARENT ALPHA outside silhouette and through leg openings. No opaque backdrop, floor, cast shadow, fog, glow or checkerboard. Entire silhouette visible with small padding, feet rest on horizontal baseline. Wide server hardware verification workbench, dark steel frame with muted orange edge trim and drawers, gray anti-static work surface. A flat rackmount server under test at center with perforated front panel and two recessed handles, one black OFF test monitor on stand at left, compact OFF diagnostic meter at right, neat coiled test leads and paper inspection report. Lower shelf holds two spare flat server units. No soldering flame or glowing oscilloscope, no chair. Landscape canvas, silhouette width-to-height about 2.1:1, total height 1.3 meters.
```

### training-workstation

```text
Use case: stylized-concept. Production furniture sprite for ARCHI, Korean 2D side-scrolling mystery game in technical support floor 13 at midnight during power outage. Detailed anime-inspired pixel art, crisp hard-edged pixel clusters and outlines, subtly worn realistic materials, realistic adult proportions. Muted desaturated steel gray and graphite, small restrained ochre ORANGE accents. Strict orthographic FRONT elevation, absolutely no isometric or three-quarter view, minimal visible top surfaces. Neutral dim ambient lighting but readable details. ALL monitors, equipment screens and lights OFF. No people, readable text, lettering, digits, logos or watermark. ONE isolated complete furniture object, TRUE TRANSPARENT ALPHA outside silhouette and through leg openings. No opaque backdrop, floor, cast shadow, fog, glow or checkerboard. Entire silhouette visible with small padding, feet rest on horizontal baseline. Wide paired customer training desk, light ash-gray laminated tabletop, simple charcoal steel legs and low cable modesty panel, two neatly spaced thin laptops with completely BLACK OFF screens, each with a mouse, one off-white printed feedback questionnaire lying at front right and small muted orange course folder at left. No chairs. Clean instructional workstation distinct from heavy engineer service desk, no desktop towers. Landscape canvas, overall silhouette width-to-height about 2.6:1, height including screens about 1.1 meters.
```
