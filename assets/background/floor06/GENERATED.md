# 6층 배경 적용

- 원본: 사용자가 준 `floor06-tech-division.png`(3200×556 RGBA, 사방 여백 48px)와 `PROMPT.md`(제작 기록·좌표).
- 가로는 1:1, 벽은 원본 행 82..441을 높이 475px로 늘려 월드 y=100..575에 둔다(원본 바닥선 y=438 → 월드 y=570).
- `build.py`(저장소 루트에서 `python assets/background/floor06/build.py`, Pillow·numpy 필요)가 공용 `cutaway_kit.py`와 `cutaway_finish.py`로 방 내부·천장·바닥·복도를 만든다.

| 파일 | 원본 영역 | 월드 |
| --- | --- | --- |
| floor06-work-interior.png | 48..936 + 깨끗한 책상 칸(512..936) 3번(뒤집기·그대로·뒤집기) + 칸막이 틈 74px + 936..1378(기둥까지). 반복 칸은 포스트잇 모니터를 빈 화면으로 덮고, 켜진 비상 형광등(450..560)의 반쪽과 빛 웅덩이를 셋째 칸과 밝기를 맞춰 걷어 냄 | 폭 2676 |
| floor06-engineering-interior.png | 기둥·서고 1340..1606 + 빈 벽 150 + 서고(1384..1604) 뒤집음 + 빈 벽 200(출구 문 자리) + 서고 + 빈 벽 36 + 1606..2360 | 폭 1846 |
| floor06-meeting-interior.png | 2336..3030 + 테이블 끝 칸(2862..3030) 4번(뒤집기·디스플레이 그대로·뒤집기·그대로, 나머지 칸은 디스플레이를 빈 벽으로 덮음) + 빈 벽 352(출구 문 자리, 천장은 2920..2928 열) + 3030..3152. 빈 벽에 맞닿는 반쪽 등기구는 지움 | 폭 1840 |

## 천장·바닥 마감 (2026-10-16)

- 각 방은 천장(`floor06-ceiling-{work,engineering,meeting}.png`, y=0..100), 바닥(`floor06-floor-{work,engineering,meeting}.png`, y=556..760), 벽 그림의 세 층이다.
- 세 층의 폭은 업무 공간 2676, 엔지니어링 구역 1846, 회의실 1840으로 같다. 벽은 월드 y=556부터 투명하게 비워 연속 바닥과 연결하고 원본 위아래 슬래브 이음매를 없앤다.
- 천장은 방의 올리브·카키·겨자색에 맞춘 천장판·몰딩·꺼진 매입등·환기구다. 원본의 비상 형광등은 벽 그림에 남긴다.
- `floor6Y()`가 조사 지점을 옮긴다. 당직 전화는 y=441·높이 39가 되어 벨 표시와 함께 그림에 맞는다.
- 입장 2.5초 뒤 벨이 울리고 7.5초 동안 응답을 기다리는 규칙, 부재중 후 재입장 시 재호출, 응답 후 회의실 출입 승인은 유지한다.

에셋에는 비상구 유도등이 없어 계단 문 위에 옮기지 않았다. 당직 전화가 울리는 모습(붉은 깜빡임)은 그림 위 설비
(`.fixture.duty-phone[data-ringing="true"]`)의 CSS로 그린다.

## 복도 벽·문 (2026-10-16)

- 복도: `walls.png`(5000×760, top 0, 바닥선 570). `walls-layout.json`의 공용 벽 모듈 합성 결과(752px)에 같은 바닥 8px을 이어 화면 끝을 채운다.
- 최종 생성에는 `build.py`를 쓴다. 공용 `compose_floor.py`만 실행하면 높이가 752px로 돌아간다.
- 유리 구간 뒤 그림(`behind-*.png`)은 이 층 단면 에셋에서 자른 것(behind_floor_y 438).
- 문: 게임 그림 `assets/objects/floor06/door-*.png`(닫힘|열림), 원본 `assets/objects/floor06/source/door-*.png`.
  유리문은 `flush_door_base.py --no-kick` → `make_door_sprite.py`(자동문은 `--double --top 0.075`). 모두 y=250, 높이 320.
- 야간 당직 안내문은 공용 `wall-notice` 스타일이다. 화장실 이름표는 문 위에 놓고 16층 화장실 문 그림을 쓰는 기존 공용 CSS를 유지한다.

| 방(월드 x·폭) | 벽 모듈 | 유리 너머(behind) | 문 |
| --- | --- | --- | --- |
| 기술 개발 업무 공간 (40·1000) | wall-glass-mixed | `behind-a.png` | `assets/objects/floor06/door-work.png` ← `source/door-work.png` (혼합 유리 자동문), doorX 280, 폭 240 |
| 공용 엔지니어링 구역 (1080·690) | wall-concrete | — | `assets/objects/floor06/door-engineering.png` ← `source/door-engineering.png` (흰 문(세로창)), doorX 1296, 폭 130 |
| 기술 회의실 (4282·680) | wall-glass-mixed | `behind-c.png` | `assets/objects/floor06/door-meeting.png` ← `source/door-meeting.png` (혼합 유리 수동문), doorX 4749, 폭 130 |

## 방 안 출구 문 자리 (3차 작업)

- 복도 문은 그대로 두고, 방 안 출구 문만 방 끝(끝벽 30px 안) 또는 몇몇 방은 가운데 빈 벽 자리에 세운다.
- `cutaway_kit.door_bay`가 그 자리에 복도와 같은 벽 모듈(`assets/background/wall`) 칸을 끼운다: 늘린 벽 그림(월드 y=100..556) 위에
  양 끝 기둥, 유리 너머는 어두운 복도 흰 벽, 밝기는 방 벽에 맞춤. 문 양옆 96px은 빈 벽이라 가구가 문에 닿지 않는다. 유리 창살은 문에서
  떨어지게(보통 문 중심 ±120, 240 자동문은 문 가운데 이음매 뒤) 깐다. `build.py`가 `finish_floor(HERE, {...}, BAYS)`로 넘긴다(천장·바닥 층도 새 폭).
- 칸 폭(문 폭 + 192)만큼 그 오른쪽 그림·조사 지점·장애물이 밀린다(방 설정 `exitBay`). 안팎 문 비율 검사는 `exitBay` 방에서 뺀다.

| 방 | 자리 | 끼운 x | 칸 폭 | 벽 모듈 | 방 폭 | 안쪽 exitX |
| --- | --- | --- | --- | --- | --- | --- |
| 기술 개발 업무 공간 | 왼쪽 끝 | 30 | 432 | wall-glass-mixed | 3108 | 126 |
| 공용 엔지니어링 구역 | 가운데 | 653 | 322 | wall-concrete | 2168 | 749 |
| 기술 회의실 | 오른쪽 끝 | 1810 | 322 | wall-glass-mixed | 2162 | 1906 |

- 복도 문은 기둥(구간 양 끝 48px)·유리 창살에 걸리거나 유리문 너머로 창살이 비치지 않게만 옮겼다: 기술 개발 업무 공간 280→397, 기술 회의실 4749→4782.

