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

## 휴대폰 플레이어 애니메이션

휴대폰 UI와 라이트 기능은 구현되어 있지만 현재 플레이어는 조사 자세를 임시로 재사용한다. 아래 시트가 준비되면 `phone` 상태 전용 애니메이션으로 교체한다.

| 파일 제안 | 프레임 | 구성 |
|---|---:|---|
| `assets/player/jeong-suho-phone-idle.png` | 4 | 주머니에서 꺼냄 / 들어 올림 / 화면을 봄 / 미세 호흡 |
| `assets/player/jeong-suho-phone-light.png` | 4 | 휴대폰을 앞쪽으로 들고 라이트를 비추는 반복 자세 |
| `assets/player/jeong-suho-phone-away.png` | 2 | 화면을 끄고 주머니에 넣음 |

- 기존 플레이어 시트처럼 프레임당 256×256, 발 기준선과 엉덩이 중심을 걷기 시트에 맞춘다.
- 좌우 반전 사용을 전제로 휴대폰은 캐릭터 정면 쪽 손에 둔다.
- 라이트의 실제 빛 원뿔은 CSS가 그리므로 스프라이트에는 흰 원뿔이나 렌즈 플레어를 그리지 않는다.
- `phone-idle`과 `phone-light`의 몸통 위치를 동일하게 유지해 라이트 전환 때 캐릭터가 튀지 않게 한다.
