# 8층 배경 적용

- 원본: 사용자가 준 `floor08-qa-planning.png`(3200×556 RGBA, 사방 여백 48px)와 `PROMPT.md`(제작 기록·좌표).
- 배율 1:1(원본 바닥선 y=438 → 월드 y=570, `top: 132`, 높이 556).
- `build.py`(저장소 루트에서 `python assets/background/floor08/build.py`)가 공용 `cutaway_kit.py`로 만든다.

## 복도 벽·문 (2026-10-10 파일 정리 기준, 이 절이 최신)

- 복도: `walls.png`(5000×752, top 0, 바닥선 570) = `assets/background/wall` 모듈을 `walls-layout.json`(`"modules": "../wall"`)으로 합성.
  다시 만들기: `python assets/background/wall/compose_floor.py assets/background/floor08/walls-layout.json assets/background/floor08/walls.png`.
- 유리 구간 뒤 그림(`behind-*.png`)은 이 층 단면 에셋 `floor08-qa-planning.png`에서 `crop_behind.py`로 자른 것(behind_floor_y 438).
- 문: 게임 그림 `assets/objects/floor08/door-*.png`(닫힘|열림), 원본 `assets/objects/floor08/source/door-*.png`.
  유리문은 `flush_door_base.py --no-kick` → `make_door_sprite.py`(자동문은 `--double --top 0.075`), 방 테마 문은 `flush_door_base.py` → `make_door_sprite.py`. 모두 y=250, 높이 320.
- `build.py`는 방 내부만 만든다(복도 그림과 코드로 그린 문은 정리하면서 지웠다. 아래 표의 `floor08-corridor.png` 줄은 이전 기록).
- 가운데 구역의 복도 그림 속 물건은 흰 벽 안내판(`wall-notice`)으로 옮겼다.

| 방(월드 x·폭) | 벽 모듈 | 유리 너머(behind) | 문 |
| --- | --- | --- | --- |
| QA 시험실 (40·1000) | wall-concrete | — | `door-qa.png` ← `source/door-qa.png` (3F Studio의 짙은 강철문 재사용), doorX 300, 폭 130 |
| 제품기획실 (1080·690) | wall-glass-mixed | `behind-b.png` (원본 x 1700) | `door-planning.png` ← 혼합 유리 수동문, doorX 1135, 폭 130 |
| 공용 제품 회의실 (4282·680) | wall-frosted | `behind-c.png` (원본 x 2420) | `door-meeting.png` ← 불투명 유리 수동문, doorX 4577, 폭 130 |

| 파일 | 원본 영역 | 월드 |
| --- | --- | --- |
| floor08-corridor.png | 끝벽 48..78, QA 시험실 앞 78..1054 + 칸막이 1300..1324(유리), 제품기획 공간 앞 1324..1990 + 칸막이 2340..2364(유리), 회의실 앞 2364..3052 + 끝벽 3122..3152(유리), 나머지는 콘크리트 열 630..646 색으로 이은 복도 벽. 비상구 유도등(1333..1379)을 계단 문 위에, 출시 판정 신호등(349..363, 기둥은 뒤 벽과 다른 픽셀만)을 가운데 구역 x=3300에 | 0..5000 |
| floor08-qa-interior.png | 48..1190 + 시험석 칸 710..1190 세 번 + 1190..1300 + 끝벽 3122..3152 | 폭 2722 |
| floor08-planning-interior.png | 끝벽 48..78 + 1324..1762 + 1762..1372 뒤집음 + 1372..2340 + 끝벽 3122..3152(뒤 두 칸은 비상구 유도등을 지운 사본) | 폭 1856 |
| floor08-meeting-interior.png | 끝벽 48..78 + 2364..2941 + 머그 칸 2941..2977 + 2941..2964 + 테이블 칸(2748..2856 / 2856..2964 번갈아) 아홉 번 + 2964..3152. 늘린 칸의 338행 위는 타일 벽(2976..3012, 36px 위상), 174행 위는 천장(2700..2940, 240px 위상) | 폭 1826 |
| floor08-qa/planning/meeting-door.png | `door_sheet` steel/glass/wood(닫힘 \| 열림), 높이 210 = 원본 강철문 | 140/110/120 × 210 |

## 파일 정리 (2026-10-10)

문 그림(닫힘|열림)은 `assets/objects/floor08/door-*.png`로 옮겼다(이전 이름 `floor08-*-door.png`). `build.py`도 그곳에 쓴다. 복도·방 내부 그림은 이 폴더 그대로다.
