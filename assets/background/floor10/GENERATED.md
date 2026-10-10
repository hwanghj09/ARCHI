# 10층 배경 적용

- 원본: 사용자가 준 `floor10-management.png`(3200×556 RGBA, 사방 여백 48px)와 `PROMPT.md`(제작 기록·좌표).
- 배율 1:1(원본 바닥선 y=438 → 월드 y=570, `top: 132`, 높이 556).
- `build.py`(저장소 루트에서 `python assets/background/floor10/build.py`)가 `assets/background/cutaway_kit.py`로 만든다.

## 복도 벽·문 (2026-10-10 파일 정리 기준, 이 절이 최신)

- 복도: `walls.png`(5000×752, top 0, 바닥선 570) = `assets/background/wall` 모듈을 `walls-layout.json`(`"modules": "../wall"`)으로 합성.
  다시 만들기: `python assets/background/wall/compose_floor.py assets/background/floor10/walls-layout.json assets/background/floor10/walls.png`.
- 유리 구간 뒤 그림(`behind-*.png`)은 이 층 단면 에셋 `floor10-management.png`에서 `crop_behind.py`로 자른 것(behind_floor_y 438).
- 문: 게임 그림 `assets/objects/floor10/door-*.png`(닫힘|열림), 원본 `assets/objects/floor10/source/door-*.png`.
  유리문은 `flush_door_base.py --no-kick` → `make_door_sprite.py`(자동문은 `--double --top 0.075`), 방 테마 문은 `flush_door_base.py` → `make_door_sprite.py`. 모두 y=250, 높이 320.
- `build.py`는 방 내부만 만든다(복도 그림과 코드로 그린 문은 정리하면서 지웠다. 아래 표의 `floor10-corridor.png` 줄은 이전 기록).
- 가운데 구역의 복도 그림 속 물건은 흰 벽 안내판(`wall-notice`)으로 옮겼다.

| 방(월드 x·폭) | 벽 모듈 | 유리 너머(behind) | 문 |
| --- | --- | --- | --- |
| 경영관리 사무실 (40·1000) | wall-glass-mixed | `behind-a.png` (원본 x 330) | `door-office.png` ← 혼합 유리 자동문, doorX 520, 폭 240 |
| 임원 회의실 (1080·690) | wall-frosted | `behind-b.png` (원본 x 1590) | `door-meeting.png` ← 불투명 유리 수동문, doorX 1375, 폭 130 |
| 임원실 (4282·680) | wall-concrete | — | `door-executive.png` ← 2F Harmony Hall 원목문 재사용, doorX 4580, 폭 130 |

| 파일 | 원본 영역 | 월드 |
| --- | --- | --- |
| floor10-corridor.png | 끝벽 48..78, 경영관리 사무실 앞 78..96 + 진열장~유리 칸막이 320..1300(캐비닛 셋은 뺌, 유리), 임원 회의실 앞 1590..2280(유리), 임원실 앞 원목 칸막이 2280..2304 + 2304..2896 + 책장 오른쪽 3044..3122 + 끝벽 3128..3152(유리), 나머지는 원본 슬래브·회의실 옥색 벽(1305..1320) 색·바닥 슬래브로 이은 복도 벽. 비상구 유도등(1225..1268)을 계단 문 위에, 벽시계(1108..1136)를 가운데 구역(월드 3336, y=340)에 | 0..5000 |
| floor10-office-interior.png | 78..810 + 창 두 개와 책상 한 줄 칸(446..810) 4번(번갈아 뒤집음) + 810..1300 | 폭 2678 |
| floor10-meeting-interior.png | 1276..1590 + 블랙아웃 창·의자 두 개 칸(1318..1590, 왼쪽 테이블 끝은 테이블 가운데 1352..1380으로 덮음) 3번(가운데는 뒤집음) + 1590..2304 | 폭 1844 |
| floor10-executive-interior.png | 칸막이 2280..2308 + 빈 벽 250 + 2308..2904 + 빈 벽 90 + 책장 칸(2904..3120) + 빈 벽 70 + 책장 칸 뒤집음 + 빈 벽 108 + 2904..3152. 빈 벽은 원본 2904..2906 열을 펴고 바닥·슬래브는 원본 마루 2620..2840을 이음 | 폭 1822 |
| floor10-office/meeting/executive-door.png | `door_sheet`로 그린 문(닫힘 \| 열림): 원목 틀 유리문, 짙은 원목 문, 칠한 원목 문(붉은 대기등) | 140/110/120 × 210 |

투명 영역은 그대로 두고 층 배경색(`linear-gradient(#0b1311, #111b18)`)이 비친다. 예전 판의 벽만 그린 그림(2배 해상도, 금고실)과
floor-kit 소품(ledger-shelf, double-lock-cabinet, executive-desk)은 이 층에서 더 쓰지 않는다.

## 파일 정리 (2026-10-10)

문 그림(닫힘|열림)은 `assets/objects/floor10/door-*.png`로 옮겼다(이전 이름 `floor10-*-door.png`). `build.py`도 그곳에 쓴다. 복도·방 내부 그림은 이 폴더 그대로다.
