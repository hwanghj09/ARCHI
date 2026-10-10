# 9층 배경 적용

- 원본: 사용자가 준 `floor09-business.png`(3200×556 RGBA, 사방 여백 48px)와 `PROMPT.md`(제작 기록·좌표).
- 배율 1:1(원본 바닥선 y=438 → 월드 y=570, `top: 132`, 높이 556).
- `build.py`(저장소 루트에서 `python assets/background/floor09/build.py`)가 공용 `assets/background/cutaway_kit.py`로 만든다.

## 복도 벽·문 (2026-10-10 파일 정리 기준, 이 절이 최신)

- 복도: `walls.png`(5000×752, top 0, 바닥선 570) = `assets/background/wall` 모듈을 `walls-layout.json`(`"modules": "../wall"`)으로 합성.
  다시 만들기: `python assets/background/wall/compose_floor.py assets/background/floor09/walls-layout.json assets/background/floor09/walls.png`.
- 유리 구간 뒤 그림(`behind-*.png`)은 이 층 단면 에셋 `floor09-business.png`에서 `crop_behind.py`로 자른 것(behind_floor_y 438).
- 문: 게임 그림 `assets/objects/floor09/door-*.png`(닫힘|열림), 원본 `assets/objects/floor09/source/door-*.png`.
  유리문은 `flush_door_base.py --no-kick` → `make_door_sprite.py`(자동문은 `--double --top 0.075`), 방 테마 문은 `flush_door_base.py` → `make_door_sprite.py`. 모두 y=250, 높이 320.
- `build.py`는 방 내부만 만든다(복도 그림과 코드로 그린 문은 정리하면서 지웠다. 아래 표의 `floor09-corridor.png` 줄은 이전 기록).
- 가운데 구역의 복도 그림 속 물건은 흰 벽 안내판(`wall-notice`)으로 옮겼다.

| 방(월드 x·폭) | 벽 모듈 | 유리 너머(behind) | 문 |
| --- | --- | --- | --- |
| 사업 업무 공간 (40·1000) | wall-glass | `behind-a.png` (원본 x 100) | `door-office.png` ← 투명 유리 자동문, doorX 520, 폭 240 |
| 영업·고객 관리 구역 (1080·690) | wall-glass-mixed | `behind-b.png` (원본 x 1260) | `door-sales.png` ← 혼합 유리 수동문, doorX 1375, 폭 130 |
| 프로젝트룸 (4282·680) | wall-frosted | `behind-c.png` (원본 x 2330) | `door-project.png` ← 불투명 유리 수동문, doorX 4577, 폭 130 |

| 파일 | 원본 영역 | 월드 |
| --- | --- | --- |
| floor09-corridor.png | 끝벽 48..78; 사업 업무 공간 앞 78..910 + 1090..1236 + 칸막이 2297..2319(유리, 월드 40..1040); 영업·고객 관리 구역 앞 1236..1694 + 영업석 1790..1944 + 라이선스 대장 캐비닛 2112..2190(유리, 1080..1770); 프로젝트룸 앞 2297..2650 + 빈 벽(2643..2655를 179px로) + 2966..3122(유리) + 끝벽 3122..3152(4282..5000). 나머지는 벽 3010..3025의 행별 색으로 이은 복도 벽. 비상구 유도등(2245..2291, 172..191행)을 계단 문 위(2974, y=208)에, 브로슈어 거치대(1706..1750, 216..294행)를 가운데 구역(3240, y=348)에 | 0..5000 |
| floor09-office-interior.png | 48..776 + 빈 벽 31 + 창·책상 칸 78..776 뒤집음 + 빈 벽 31 + 78..776 + 776..1236(감사패 진열장·그림·크레덴자·화분·기둥) + 끝벽 3122..3152 | 폭 2676 |
| floor09-sales-interior.png | 끝벽 48..78 + 1236..2020 + 빈 벽(2012..2024) 164 + 영업석 칸 1752..2020 뒤집음·그대로 + 2020..2322(팩스·라이선스 대장·전화 교환기·칸막이) + 끝벽 | 폭 1846 |
| floor09-project-interior.png | 2297..2652(칸막이·예약 패널·간트 보드) + 긴 테이블 칸 985(336행 위는 2968..3010 벽을 번갈아 뒤집어 잇고 트랙 스폿을 120px마다, 아래는 테이블·의자 2420..2620을 번갈아 뒤집어) + 2652..3152(제안서·디스플레이·PTZ·삼각대·끝벽) | 폭 1840 |
| floor09-office/sales/project-door.png | `door_sheet`로 그린 월넛 틀 문(닫힘 \| 열림): 양문 유리문 / 유리문 / 나무문(붉은 예약등) | 140/110/120 × 210 |

복도 문은 그림 속 단서 물건을 가리지 않는 자리에 있다: 사업 업무 공간 문(880)은 크레덴자 끝·화분·기둥, 영업 문(1538)은 영업석,
프로젝트룸 문(4665)은 빈 벽 위. 투명 영역은 층 배경색(`linear-gradient(#100c0e, #171215)`)이 비친다.

## 파일 정리 (2026-10-10)

문 그림(닫힘|열림)은 `assets/objects/floor09/door-*.png`로 옮겼다(이전 이름 `floor09-*-door.png`). `build.py`도 그곳에 쓴다. 복도·방 내부 그림은 이 폴더 그대로다.
