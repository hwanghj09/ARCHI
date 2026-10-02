# 상호작용 스프라이트

`docs/INTERACTION-SPRITES.md` 기준으로 제작한 13종, 35프레임이다.
생성 도구는 built-in `image_gen`이며 원본은 `source/`, 최종 프롬프트는
`PROMPTS.md`, 프레임 순서와 측정한 좌표는 `manifest.json`에 저장했다.
13종 모두 `index.html` 게임에 연결했다. 소품의 `sprite`·`stateBy`가 수집/전원 상태를 표시하며,
`animation`은 조사 성공 시 짧게 재생한 뒤 정지 그림으로 돌아간다.

- 사원증·비상 핸들 수집, 작업등·UPS 켜기, CU 안쪽 출구 개방 결과는 재입장해도 유지된다.
- 프린터는 UPS 전원이 있어야 출력하고, 방화셔터는 핸들을 챙겨야 회전 동작을 재생한다.
- 카페 키오스크는 16층 태양광 전력 공급 시 대기하며 조사하면 인사한다.
- 라벨링 현황판은 야간 이야기 설정에 맞춰 이미 완료된 두 번째 프레임을 표시한다.
- 휴대폰은 꺼내기·호흡·라이트·넣기 동작을 사용한다. 라이트를 켜 둔 채 UI를 닫으면
  정지 시 비추는 자세를 유지하며, 이동·점프는 기존 애니메이션을 사용한다.

검증: `npm run test:interaction-sprites` (브라우저에서 PNG 로딩, 상태 변화·재입장,
애니메이션 재시작, 휴대폰 배터리·이동·모바일 화면 확인).

| 최종 파일 | 프레임 수 | 프레임 크기 |
| --- | ---: | --- |
| `assets/objects/floor16/cafe-table-badge-states.png` | 2 | 512×256 |
| `assets/objects/floor16/shutter-panel-states.png` | 2 | 256×512 |
| `assets/objects/floor14/archive-worklight-states.png` | 2 | 256×256 |
| `assets/objects/floor13/testbay-ups-states.png` | 2 | 256×256 |
| `assets/objects/floor13/incident-printer-states.png` | 2 | 256×256 |
| `assets/objects/floor11/emergency-cabinet-states.png` | 2 | 512×256 |
| `assets/objects/floor16/voice-kiosk-states.png` | 3 | 256×512 |
| `assets/objects/floor14/labeling-board-states.png` | 2 | 512×256 |
| `assets/objects/floor13/printer-feed.png` | 4 | 256×256 |
| `assets/objects/floor11/fire-shutter-crank.png` | 4 | 192×1952 |
| `assets/player/jeong-suho-phone-idle.png` | 4 | 256×256 |
| `assets/player/jeong-suho-phone-light.png` | 4 | 256×256 |
| `assets/player/jeong-suho-phone-away.png` | 2 | 256×256 |

전부 왼쪽에서 오른쪽으로 재생하는 가로 시트다. 이미지에는 실제 RGBA 투명이
있으며 배경·프레임 번호·문구를 넣지 않았다. 켜진 상태에는 기기 표시등과
작업등 패널만 발광한다. 휴대폰 라이트의 빛줄기는 그리지 않았다.

수호는 오른쪽을 바라보며 키 221px, 머리 위 y=18, 발 기준 y=239를 사용한다.
전화기와 팔의 이동으로 전체 바운딩박스 중심이 바뀌지 않도록 몸의 중심을
x=128에 맞췄다. 소품의 바닥 기준은 셀 높이−8이며, 셔터는 기존 시트와 같은
192×1952 셀을 사용하고 움직이는 손잡이 대신 위쪽 모터 고정부를 맞췄다.
좌표는 `manifest.json`의 각 프레임 변환 기록을 따른다.

`floor-kit/manifest.json`에 지정된 worldWidth는 그대로 기록했다.
작업등·UPS·프린터는 해당 항목에 worldWidth가 없어 기존 런타임 값을 유지한다.
새 음성 키오스크는 셔터 제어함과 같은 월드 폭 89를 사용한다.

밝은 배경과 어두운 배경에서 실루엣·투명도·프레임 순서를 눈으로 확인하고,
전체 PNG 디코딩·규격·프레임 수·빈 여백·프레임 차이를 검사했다.
생성된 프레임 사이에 작은 질감 차이는 남아 있으므로 실제 게임 연결 시 상태
전환을 확인해야 한다. 런타임 재생은 `tests/interaction-sprites.mjs`로 검증한다.

Pillow를 설치한 환경에서 `python assets/interaction-sprites/rebuild.py`를 실행하면
원본을 분할·크롭·nearest-neighbor 크기 조정·위치 정렬하여 최종 시트를 재생성한다.
원본과 기존 소품 파일은 보존했다.
