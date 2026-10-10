# 5층 배경

- 원본: 사용자가 준 단면 에셋 `floor05-research.png`(PROMPT.md). `build.py`가 방 내부 3장, 문, 이동식 발판 그림(`floor05-step.png`)을 만든다(자세한 자르기 위치는 build.py 주석).

## 복도 벽·문 (2026-10-10 파일 정리 기준, 이 절이 최신)

- 복도: `walls.png`(5000×752, top 0, 바닥선 570) = `assets/background/wall` 모듈을 `walls-layout.json`(`"modules": "../wall"`)으로 합성.
  다시 만들기: `python assets/background/wall/compose_floor.py assets/background/floor05/walls-layout.json assets/background/floor05/walls.png`.
- 유리 구간 뒤 그림(`behind-*.png`)은 이 층 단면 에셋에서 자른 것(behind_floor_y 438).
- 문: 게임 그림 `assets/objects/floor05/door-*.png`(닫힘|열림), 원본 `assets/objects/floor05/source/door-*.png`.
  유리문은 `flush_door_base.py --no-kick` → `make_door_sprite.py`(자동문은 `--double --top 0.075`). 모두 y=250, 높이 320.
- `build.py`는 방 내부·이동식 발판만 만든다. 위쪽의 이전 기록에 나오는 복도 그림(`floor05-corridor.png`)·코드로 그린 문은 정리하면서 지웠다.

| 방(월드 x·폭) | 벽 모듈 | 유리 너머(behind) | 문 |
| --- | --- | --- | --- |
| 연구개발실 (40·1000) | wall-glass-mixed | `behind-a.png` | `assets/objects/floor05/door-rnd.png` ← `source/door-rnd.png` (혼합 유리 자동문), doorX 280, 폭 240 |
| 기술연구실 (1080·690) | wall-concrete | — | `assets/objects/floor05/door-security.png` ← `source/door-security.png` (방 테마 문(보안 연구실 철문)), doorX 1163, 폭 130 |
| 회의실 (4282·680) | wall-frosted | `behind-c.png` | `assets/objects/floor05/door-meeting.png` ← `source/door-meeting.png` (불투명 유리 수동문), doorX 4577, 폭 130 |
