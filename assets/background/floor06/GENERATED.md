# 6층 배경 적용

- 원본: 사용자가 준 `floor06-tech-division.png`(3200×556 RGBA, 사방 여백 48px)와 `PROMPT.md`(제작 기록·좌표).
- 배율 1:1(원본 바닥선 y=438 → 월드 y=570, `top: 132`, 높이 556).
- `build.py`(저장소 루트에서 `python assets/background/floor06/build.py`)가 `assets/background/cutaway_kit.py`로 만든다.

| 파일 | 원본 영역 | 월드 |
| --- | --- | --- |
| floor06-corridor.png | 끝벽 48..78, 업무 공간 앞 48..1024 + 기둥 1340..1364(유리), 엔지니어링 구역 앞 서고 1378..1604 + 빈 벽 120(문 자리) + 1606..1950(유리), 회의실 앞 2360..2830 + 빈 벽 216(문 자리) + 끝벽 3120..3152(유리), 나머지는 원본 슬래브·벽(1604..1612 열)·바닥(400..1000)으로 이은 복도 벽. 야간 승인 규칙판 액자(1917..1992, 196..286행)를 가운데 구역(월드 3200, y=328)에 야간 당직 안내문으로 | 0..5000 |
| floor06-work-interior.png | 48..936 + 깨끗한 책상 칸(512..936) 3번(뒤집기·그대로·뒤집기) + 칸막이 틈 74px + 936..1378(기둥까지). 반복 칸은 포스트잇 모니터를 빈 화면으로 덮고, 켜진 비상 형광등(450..560)의 반쪽과 빛 웅덩이를 셋째 칸과 밝기를 맞춰 걷어 냄 | 폭 2676 |
| floor06-engineering-interior.png | 기둥·서고 1340..1606 + 빈 벽 150 + 서고(1384..1604) 뒤집음 + 빈 벽 200(출구 문 자리) + 서고 + 빈 벽 36 + 1606..2360 | 폭 1846 |
| floor06-meeting-interior.png | 2336..3030 + 테이블 끝 칸(2862..3030) 4번(뒤집기·디스플레이 그대로·뒤집기·그대로, 나머지 칸은 디스플레이를 빈 벽으로 덮음) + 빈 벽 352(출구 문 자리, 천장은 2920..2928 열) + 3030..3152. 빈 벽에 맞닿는 반쪽 등기구는 지움 | 폭 1840 |
| floor06-work/engineering/meeting-door.png | `door_sheet` glass / steel / steel(붉은 카드 리더 등), 올리브 팔레트 | 140/110/120 × 210 |

에셋에는 비상구 유도등이 없어 계단 문 위에 옮기지 않았다. 당직 전화가 울리는 모습(붉은 깜빡임)은 그림 위 설비
(`.fixture.duty-phone[data-ringing="true"]`)의 CSS로 그린다.

## 복도 벽·문 (2026-10-10 파일 정리 기준, 이 절이 최신)

- 복도: `walls.png`(5000×752, top 0, 바닥선 570) = `assets/background/wall` 모듈을 `walls-layout.json`(`"modules": "../wall"`)으로 합성.
  다시 만들기: `python assets/background/wall/compose_floor.py assets/background/floor06/walls-layout.json assets/background/floor06/walls.png`.
- 유리 구간 뒤 그림(`behind-*.png`)은 이 층 단면 에셋에서 자른 것(behind_floor_y 438).
- 문: 게임 그림 `assets/objects/floor06/door-*.png`(닫힘|열림), 원본 `assets/objects/floor06/source/door-*.png`.
  유리문은 `flush_door_base.py --no-kick` → `make_door_sprite.py`(자동문은 `--double --top 0.075`). 모두 y=250, 높이 320.
- `build.py`는 방 내부만 만든다. 위쪽의 이전 기록에 나오는 복도 그림(`floor06-corridor.png`)·코드로 그린 문은 정리하면서 지웠다.

| 방(월드 x·폭) | 벽 모듈 | 유리 너머(behind) | 문 |
| --- | --- | --- | --- |
| 기술 개발 업무 공간 (40·1000) | wall-glass-mixed | `behind-a.png` | `assets/objects/floor06/door-work.png` ← `source/door-work.png` (혼합 유리 자동문), doorX 280, 폭 240 |
| 공용 엔지니어링 구역 (1080·690) | wall-concrete | — | `assets/objects/floor06/door-engineering.png` ← `source/door-engineering.png` (흰 문(세로창)), doorX 1296, 폭 130 |
| 기술 회의실 (4282·680) | wall-glass-mixed | `behind-c.png` | `assets/objects/floor06/door-meeting.png` ← `source/door-meeting.png` (혼합 유리 수동문), doorX 4577, 폭 130 |
