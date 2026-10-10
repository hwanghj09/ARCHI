# 4층 배경 적용

- 원본: 사용자가 준 `floor04-rnd.png`(3200×556 RGBA, 사방 여백 48px)와 `PROMPT.md`(제작 기록·좌표).
- 배율 1:1(원본 바닥선 y=438 → 월드 y=570, `top: 132`, 높이 556).
- `build.py`(저장소 루트에서 `python assets/background/floor04/build.py`)가 공용 도구 `assets/background/cutaway_kit.py`로 만든다.
  빈 벽 채움은 build.py의 `tile()`(칸을 번갈아 뒤집어 이어 붙임)을 쓴다.

| 파일 | 원본 영역 | 월드 |
| --- | --- | --- |
| floor04-corridor.png | 끝벽 48..78, 연구개발 업무 공간 앞 48..1000 + 기둥 1000..1040(유리), 개발자 업무 구역 앞 1040..1730(유리), 연구 회의실 앞 칸막이 2462..3122 + 빈 패널벽 28px + 끝벽 3122..3152(유리), 나머지는 원본 슬래브와 빈 벽(150..162) 색으로 이은 복도 벽. 비상구 유도등(2487..2530, 184..200행)을 계단 문 위 (2974, 210)에, UPS 옆 안내문(680..716, 240..278행)을 가운데 구역 (3240, 330)에 | 0..5000 |
| floor04-lab-interior.png | 48..524 + 책상·선반 칸(166..524) 4번(번갈아 뒤집음) + 빈 벽 49 + 둘째 테이프 선반(874..998, 빛 받는 테이프와 천장 CCTV는 덮음) + 빈 벽 49 + 524..1040 + 끝벽 48..78 뒤집음 | 폭 2676 |
| floor04-dev-interior.png | 기둥 1000..1040 + 1040..1656 + 통로 60 + 앞줄 책상 한 칸(1124..1376) + 통로 60 + 1656..2474 | 폭 1846 |
| floor04-meeting-interior.png | 2462..3044 + 빈 패널벽 60 + 둘째 회의 테이블(312행 아래만 2524..2728과 그 뒤집은 것, 0.8배 어둡게; 위는 빈 패널벽과 출력물 윗줄 2776..2850) + 빈 패널벽 682(출력물 두 쌍, 출구 문 자리는 비움) + 3044..3152 | 폭 1840 |
| floor04-lab/dev/meeting-door.png | cutaway_kit `door_sheet('glass')`, 민트 틀. 회의실 문은 붉은 카드 리더 대기등 | 140/110/120 × 210 |

UPS 분배기의 출력 표시등은 원본에서 셋째 칸만 켜져 있다. 게임에서는 `css-04`의 `.fixture.f4-ups` 규칙이 지금 출력 칸(data-state)의
등만 켜고 원본의 셋째 등을 덮는다.

## 복도 벽·문 (2026-10-10 파일 정리 기준, 이 절이 최신)

- 복도: `walls.png`(5000×752, top 0, 바닥선 570) = `assets/background/wall` 모듈을 `walls-layout.json`(`"modules": "../wall"`)으로 합성.
  다시 만들기: `python assets/background/wall/compose_floor.py assets/background/floor04/walls-layout.json assets/background/floor04/walls.png`.
- 유리 구간 뒤 그림(`behind-*.png`)은 이 층 단면 에셋에서 자른 것(behind_floor_y 438).
- 문: 게임 그림 `assets/objects/floor04/door-*.png`(닫힘|열림), 원본 `assets/objects/floor04/source/door-*.png`.
  유리문은 `flush_door_base.py --no-kick` → `make_door_sprite.py`(자동문은 `--double --top 0.075`). 모두 y=250, 높이 320.
- `build.py`는 방 내부만 만든다. 위쪽의 이전 기록에 나오는 복도 그림(`floor04-corridor.png`)·코드로 그린 문은 정리하면서 지웠다.

| 방(월드 x·폭) | 벽 모듈 | 유리 너머(behind) | 문 |
| --- | --- | --- | --- |
| 연구개발 업무 공간 (40·1000) | wall-glass-mixed | `behind-a.png` | `assets/objects/floor04/door-lab.png` ← `source/door-lab.png` (혼합 유리 수동문), doorX 335, 폭 130 |
| 개발자 업무 구역 (1080·690) | wall-glass | `behind-b.png` | `assets/objects/floor04/door-dev.png` ← `source/door-dev.png` (투명 유리 수동문), doorX 1135, 폭 130 |
| 연구 회의실 (4282·680) | wall-frosted | `behind-c.png` | `assets/objects/floor04/door-meeting.png` ← `source/door-meeting.png` (불투명 유리 수동문), doorX 4610, 폭 130 |
