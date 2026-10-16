# 4층 배경 적용

- 원본: 사용자가 준 `floor04-rnd.png`(3200×556 RGBA, 사방 여백 48px)와 `PROMPT.md`(제작 기록·좌표).
- 가로는 1:1, 벽은 원본 행 82..441을 높이 475px로 늘려 월드 y=100..575에 둔다(원본 바닥선 y=438 → 월드 y=570).
- `build.py`(저장소 루트에서 `python assets/background/floor04/build.py`)가 공용 도구 `assets/background/cutaway_kit.py`와 `cutaway_finish.py`로 방 내부·천장·바닥·복도를 만든다.
  빈 벽 채움은 build.py의 `tile()`(칸을 번갈아 뒤집어 이어 붙임)을 쓴다.

| 파일 | 원본 영역 | 월드 |
| --- | --- | --- |
| floor04-lab-interior.png | 48..524 + 책상·선반 칸(166..524) 4번(번갈아 뒤집음) + 빈 벽 49 + 둘째 테이프 선반(874..998, 빛 받는 테이프와 천장 CCTV는 덮음) + 빈 벽 49 + 524..1040 + 끝벽 48..78 뒤집음 | 폭 2676 |
| floor04-dev-interior.png | 기둥 1000..1040 + 1040..1656 + 통로 60 + 앞줄 책상 한 칸(1124..1376) + 통로 60 + 1656..2474 | 폭 1846 |
| floor04-meeting-interior.png | 2462..3044 + 빈 패널벽 60 + 둘째 회의 테이블(312행 아래만 2524..2728과 그 뒤집은 것, 0.8배 어둡게; 위는 빈 패널벽과 출력물 윗줄 2776..2850) + 빈 패널벽 682(출력물 두 쌍, 출구 문 자리는 비움) + 3044..3152 | 폭 1840 |

## 천장·바닥 마감 (2026-10-16)

- 각 방은 천장(`floor04-ceiling-{lab,dev,meeting}.png`, y=0..100), 바닥(`floor04-floor-{lab,dev,meeting}.png`, y=556..760), 벽 그림의 세 층이다.
- 방마다 같은 폭으로 생성·표시한다(lab 2676, dev 1846, meeting 1840). 벽 그림은 월드 y=556부터 투명하게 비워 연속 바닥과 연결한다.
- 원본 위아래 슬래브를 버려 반복 이음매를 없앴다. 천장은 방의 민트·회색 팔레트에 맞춘 천장판·몰딩·꺼진 매입등·환기구다.
- `floor4Y()`가 모든 조사 지점의 높이도 옮긴다. UPS 표시등은 top 12px·높이 21px로 늘리고, 그림 속 모니터 환각 좌표도 475px 높이에 맞췄다.
- UPS 출력 전환·회의실 잠금·테이프 회수와 판독 조건은 유지한다.

UPS 분배기의 출력 표시등은 원본에서 셋째 칸만 켜져 있다. 게임에서는 `css/game.css`의 `.fixture.f4-ups` 규칙이 지금 출력 칸(data-state)의
등만 켜고 원본의 셋째 등을 덮는다.

## 복도 벽·문 (2026-10-16)

- 복도: `walls.png`(5000×760, top 0, 바닥선 570). `walls-layout.json`의 공용 벽 모듈 합성 결과(752px)에 같은 바닥 8px을 이어 화면 끝을 채운다.
  다시 만들 때는 `python assets/background/floor04/build.py`를 쓴다. 공용 합성기만 실행하면 높이가 752px로 돌아간다.
- 유리 구간 뒤 그림(`behind-*.png`)은 이 층 단면 에셋에서 자른 것(behind_floor_y 438).
- 문: 게임 그림 `assets/objects/floor04/door-*.png`(닫힘|열림), 원본 `assets/objects/floor04/source/door-*.png`.
  유리문은 `flush_door_base.py --no-kick` → `make_door_sprite.py`(자동문은 `--double --top 0.075`). 모두 y=250, 높이 320.
- 화장실 이름표는 기존 공용 CSS에 따라 문 바로 위에 있고, 문은 16층 화장실 그림을 쓴다. 정전 대비 안내판은 공용 `wall-notice` 스타일이다.

| 방(월드 x·폭) | 벽 모듈 | 유리 너머(behind) | 문 |
| --- | --- | --- | --- |
| 연구개발 업무 공간 (40·1000) | wall-glass-mixed | `behind-a.png` | `assets/objects/floor04/door-lab.png` ← `source/door-lab.png` (혼합 유리 수동문), doorX 335, 폭 130 |
| 개발자 업무 구역 (1080·690) | wall-glass | `behind-b.png` | `assets/objects/floor04/door-dev.png` ← `source/door-dev.png` (투명 유리 수동문), doorX 1135, 폭 130 |
| 연구 회의실 (4282·680) | wall-frosted | `behind-c.png` | `assets/objects/floor04/door-meeting.png` ← `source/door-meeting.png` (불투명 유리 수동문), doorX 4716, 폭 130 |
