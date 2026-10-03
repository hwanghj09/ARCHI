# 상호작용 스프라이트 제작 목록

현재 11F·13F·14F·15F·16F의 조사 대상은 `assets/objects/floor-kit/` 전용 이미지로 교체했다. 아래 항목은 **상태 변화 자체를 화면에 보여 주려면 추가 제작이 필요한 이미지**다. 단순 조사 소품은 현재 이미지로 충분하므로 목록에서 제외했다.

## 우선순위 A · 플레이 결과가 바뀌는 소품

| 층 | 파일 제안 | 프레임 | 상태 | 적용 데이터 |
|---|---|---:|---|---|
| 16F | `floor16/cafe-table-badge-states.png` | 2 | 사원증 있음 / 챙긴 뒤 빈 자리 | `f16-badge` |
| 16F | `floor16/shutter-panel-states.png` | 2 | SYSTEM 잠금 / 안쪽 수동 개방 | `f16-cu` |
| 14F | `floor14/archive-worklight-states.png` | 2 | 작업등 꺼짐 / 켜짐 | `f14-archive-lamp` |
| 13F | `floor13/testbay-ups-states.png` | 2 | UPS 꺼짐 / 비상 출력 켜짐 | `f13-ups` |
| 13F | `floor13/incident-printer-states.png` | 2 | 전원 꺼짐 / 경보 용지 출력 | `f13-ups` |
| 11F | `floor11/emergency-cabinet-states.png` | 2 | 핸들 걸림 / 빈 고리 | `f11-crank` |

## 우선순위 B · 반복 동작 연출

| 층 | 파일 제안 | 프레임 | 상태 |
|---|---|---:|---|
| 16F | `floor16/voice-kiosk-states.png` | 3 | 꺼짐 / 대기 / 먼저 인사 |
| 14F | `floor14/labeling-board-states.png` | 2 | 미완료 / 밤사이 완료 |
| 13F | `floor13/printer-feed.png` | 4 | 용지가 한 장씩 배출되는 짧은 루프 |
| 11F | `floor11/fire-shutter-crank.png` | 4 | 핸들 삽입 후 셔터가 올라가는 전환 |

## 공통 제작 규격

- 기존 게임 소품과 같은 정면 직교 시점, 픽셀 아트, 실제 투명 알파를 사용한다.
- 상태 시트는 가로 방향으로 프레임을 배치하며 모든 프레임의 캔버스 크기와 바닥 기준선을 동일하게 맞춘다.
- 조명이 꺼진 자정 장면이므로 자체 발광은 켜진 상태 프레임의 표시등에만 제한한다.
- 글자와 숫자는 게임 메시지 UI가 담당하므로 이미지에는 읽을 수 있는 문구를 넣지 않는다.
- 소품별 원본 크기와 월드 폭은 `assets/objects/floor-kit/manifest.json`을 따른다.

11F 방화셔터는 이미 `assets/objects/floor11/fire-shutter-states.png`의 닫힘/열림 2프레임을 사용하므로 추가 정지 이미지는 필요하지 않다.

## 경비 로봇 순찰

`assets/objects/guard-robot/guard-patrol.png`: 2048×256 투명 PNG, 가로 256×256 셀 8개. 0~3은 바퀴 회전, 4~6은 정지 탐색, 7은 전원 OFF다. 셀의 바퀴 바닥 y=237, 게임 표시 160×160으로 로봇 높이는 약 120px이다. 1층 R-01이 전력 공급 시 x=1510~4540 구간을 80px/s로 왕복하고 끝에서 1.4초 탐색한 뒤 돌아선다. 정전·조작창·장면 전환 동안 멈추고 재방문 시 위치를 유지한다. 실제 생성 프롬프트는 `assets/objects/guard-robot/PATROL-PROMPT.md`, 검증은 `node tests/guard-patrol.mjs`.

### 감지·추적·붙잡기

경비 로봇의 감지·추적·붙잡기는 `assets/objects/guard-robot/guard-capture.png`의 384×256 가로 8프레임을 사용한다(팔이 잘리지 않도록 셀 폭 확장). 수호의 붙잡힘·저항 동작은 `assets/player/jeong-suho-caught.png`의 256×256 가로 4프레임이다. 로봇은 전방에서 수호를 감지하면 머리 외장은 아이보리색을 유지하고 얼굴의 모니터만 빨갛게 켜지며 즉시 추적한다. 가까운 지상 플레이어에게 양쪽 팔을 꺼내고 관절을 펼쳐 붙잡는 동작을 6단계로 재생한다. 모든 전개 프레임에서 가까운 팔의 어깨는 보이고 반대편 어깨는 몸통 뒤에 가려진다. 다시 시도하면 수집한 단서를 유지한 채 로비 엘리베이터 앞에서 재개한다. 규격·프롬프트는 `assets/objects/guard-robot/CAPTURE-PROMPT.md`, 검증은 `node tests/guard-capture.mjs`.

## 태양광 비상 배전반 UI

`assets/ui/power/panel-off-on.png`는 768×512 투명 PNG, 가로 384×512 셀 2개다. 정면 직교 시점과 동일한 캐비닛 기준선을 유지하며 0번은 레버 위/OFF, 1번은 아래/ON이다. 글자와 층 번호는 HTML로 겹쳐 표시한다. 레버를 내린 뒤에만 층 선택이 가능하고, 다시 올리면 공급층이 해제된다. 드래그·클릭·터치·Enter/Space를 지원한다. 원본과 프롬프트는 `assets/ui/power/PROMPT.md`, 검증은 `node tests/solar-ui.mjs`.

## 휴대폰 플레이어 애니메이션

휴대폰 꺼내기·대기·넣기와 이동 전용 시트가 적용되어 있다. UI를 닫으면 휴대폰을 계속 들고 이동하며, ‘휴대폰 넣기’로 빈손 동작에 복귀한다.

| 파일 제안 | 프레임 | 구성 |
|---|---:|---|
| `assets/player/jeong-suho-phone-idle.png` | 4 | 주머니에서 꺼냄 / 들어 올림 / 화면을 봄 / 미세 호흡 |
| `assets/player/jeong-suho-phone-light.png` | 4 | 휴대폰을 앞쪽으로 들고 라이트를 비추는 반복 자세 |
| `assets/player/jeong-suho-phone-away.png` | 2 | 화면을 끄고 주머니에 넣음 |
| `assets/player/jeong-suho-phone-walk-off.png` / `-on.png` | 각각 6 | 휴대폰을 앞으로 든 걷기, 라이트 OFF / ON |
| `assets/player/jeong-suho-phone-run-off.png` | 8 | 라이트 OFF 상태에서만 달리기 |
| `assets/player/jeong-suho-phone-run-on.png` | 8 중 2개 사용 | 라이트 ON 점프·낙하 자세만 재사용; 달리기에는 사용하지 않음 |

- 기존 플레이어 시트처럼 프레임당 256×256, 발 기준선과 엉덩이 중심을 걷기 시트에 맞춘다.
- 좌우 반전 사용을 전제로 휴대폰은 캐릭터 정면 쪽 손에 둔다.
- 라이트의 실제 빛 원뿔은 CSS가 그리므로 스프라이트에는 흰 원뿔이나 렌즈 플레어를 그리지 않는다.
- `phone-idle`과 `phone-light`의 몸통 위치를 동일하게 유지해 라이트 전환 때 캐릭터가 튀지 않게 한다.

이동 시트는 프레임당 256×256이며 게임에서는 192×192로 표시한다. 점프·낙하에는 달리기의 공중 자세를 재사용해 휴대폰이 사라지지 않는다. 원본과 생성 프롬프트는 `assets/player/phone-movement-source/`, 재분할 스크립트는 `scripts/prepare-phone-movement.ps1`에 있다. `js/scene/camera.js`의 LED 좌표가 이동·좌우 반전·카메라·점프를 따라 빛의 시작점을 잡으며, CSS 마스크가 어둠에서 전방 원뿔을 드러낸다. 프레임·입력·배터리·모바일·전방/후방 실제 밝기는 `node tests/phone-movement.mjs`로 검증한다.
