# 옥상 관제탑 스프라이트

- 제작 도구: built-in image_gen, 2026-10-11.
- 화풍 참고: `assets/background/rooftop/rooftop.png` (스타일만 참고).
- 생성 원본: `/workspace/generated_images/exec-342b2ac0-0ce0-4fc8-9750-7b6b58d6c4e1.png`, 보존됨.
- 원본 시트: `control-tower-closed-open.png`, 1536×1024 RGBA PNG, 가로 2셀.
- 셀: 각각 768×1024, 왼쪽 문 닫힘 / 오른쪽 문 열림.
- 분할본: `control-tower-closed.png`, `control-tower-open.png`. 원본에서 크기 변경 없이 분할함.
- 두 셀의 건물 실루엣 범위(알파 128 이상): x=32..746, y=23..942로 동일.
- 배치 앵커: 각 셀의 건물 바닥 중앙 (384, 942). 열린 문 문턱은 약 y=930이며, 바닥 판 두께를 고려해 플레이어 보행선을 맞출 것.
- 출입구: 지상층 중앙, 문틀 약 x=303..480, y=640..941. 개방 시 우측 안쪽으로 열린 문이 보임.
- 검수: 밝고 어두운 바탕에서 외곽과 투명 배경을 확인함. 상부 유리 관제실, 통신 안테나, 사람 크기 출입문 확인. 프레임 기준점과 크기 확인.
- 알파: 배경에는 알파 0 영역이 있고, 건물 최대 알파는 254(약 99.6%)임. 유리 및 경고등 주변에는 반투명 영역이 있음.
- 연결 상태: 이미지 제작 및 저장만 완료. 옥상 배치, 출입 상호작용, 내부 방 장면은 아직 연결하지 않음. 게임 코드는 변경하지 않았으며 게임 실행 테스트는 생략함.

## 생성 프롬프트

Create a production sprite sheet for ARCHI, a 2D side-scrolling Korean office-building mystery/horror web game. The supplied rooftop image is STYLE REFERENCE ONLY: match its restrained midnight palette, realistic architectural proportions, cool blue-gray concrete and steel, crisp detailed anime-inspired pixel art with hard readable edges. Do not reproduce the rooftop, skyline or background. Subject: ONE small walk-in rooftop building-control tower, practical and believable on top of an office building, compact rectangular concrete lower level supporting a slightly wider glazed observation/control cabin above, flat overhanging metal roof, a slim communications antenna with one tiny red warning light, exposed conduit on the exterior, dark blue tinted upper windows with a restrained faint cyan control-monitor glow behind them. An adult-human-sized steel access door sits on the ground-level front facade; door has small wired-glass window, handle and keycard reader beside it. Make it feel like a rooftop building management control room rather than a large airport tower. STRICT ORTHOGRAPHIC FRONT ELEVATION suitable for a side-scrolling stage, no angled side faces, no perspective ground, no stairs or elevated entrance. Entire subject fully visible with transparent padding. Layout: exactly TWO equal cells in one horizontal row, target sheet 1536 by 1024 pixels, each cell 768 by 1024. LEFT CELL: tower with its access door fully closed. RIGHT CELL: exactly identical tower, same architecture, windows, antenna, lighting, size and pixel alignment, but the ground-level door fully open inward, revealing a dark walk-in doorway and a faintly lit floor threshold; the door leaf must not block the opening. Change ONLY the access door between cells. Keep tower bottom/door threshold on the same horizontal baseline at 94 percent cell height, same roof and antenna anchors, tower centered horizontally in each cell. True transparent alpha background everywhere outside the architecture, including gap between cells. No checkerboard, sky, skyline, rooftop floor slab, cast shadow outside the object, people, characters, labels, captions, cell borders, watermarks or text. No 3D render, no painterly blur, no chibi style. The dark architecture must have enough contrasting outlines to remain legible against the supplied dark rooftop environment.

