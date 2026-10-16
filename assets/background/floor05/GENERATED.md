# 5층 배경

- 원본: 사용자가 준 단면 에셋 `floor05-research.png`(PROMPT.md). `build.py`가 방 내부·천장·바닥·복도와 이동식 발판 그림(`floor05-step.png`)을 만든다(자세한 자르기 위치는 build.py 주석).
- 다시 만들기: 저장소 루트에서 `python assets/background/floor05/build.py`(Pillow·numpy 필요). 공용 `cutaway_finish.py`로 3·4층과 같은 마감을 적용한다.

## 천장·바닥 마감 (2026-10-16)

- 가로는 1:1, 벽은 원본 행 82..441을 높이 475px로 늘려 월드 y=100..575에 놓는다. 원본 바닥선 438행은 월드 y=570에 맞춘다.
- 각 방은 천장(`floor05-ceiling-{rnd,security,meeting}.png`, y=0..100), 바닥(`floor05-floor-{rnd,security,meeting}.png`, y=556..760), 벽 그림의 세 층이다.
- 세 층의 폭은 연구개발실 2676, 기술연구실 1846, 회의실 1808로 같다. 벽은 월드 y=556부터 투명하게 비워 연속 바닥과 이어 붙이고 원본 위아래 슬래브 이음매를 없앤다.
- 천장은 방에 맞춘 회색·황동·목재 팔레트의 천장판·몰딩·꺼진 매입등·환기구다. 벽의 입자 무늬는 RGB에만 적용해 불투명도를 유지한다.
- `floor5Y()`가 조사 지점을 옮기고, 기술연구실 모니터 환각 좌표는 새 벽 높이에 맞춘다.

## 발판·서가 퍼즐

- 발판은 기존 84×76, 서가 충돌체는 x=2545·폭 99·높이 186(윗면 y=384)을 유지한다.
- 배경과 함께 서가를 늘리면 두 번째 점프로 닿지 않으므로, 서가 셋과 위의 물건은 원본 크기로 복원한다. 주변 벽은 새 배경을 유지해 사각 이음매가 생기지 않게 한다.
- 공책도 원래 위치에 둔다. 발판을 밀어 붙인 뒤 두 번 점프해 서가 위에 서야 조사할 수 있으며, 방을 나갔다 오면 발판은 초기 위치로 돌아간다.

## 복도 벽·문 (2026-10-16)

- 복도: `walls.png`(5000×760, top 0, 바닥선 570). `walls-layout.json`의 공용 벽 모듈 합성 결과(752px)에 같은 바닥 8px을 이어 화면 끝을 채운다.
- 최종 생성에는 `build.py`를 쓴다. 공용 `compose_floor.py`만 실행하면 높이가 752px로 돌아간다.
- 유리 구간 뒤 그림(`behind-*.png`)은 이 층 단면 에셋에서 자른 것(behind_floor_y 438).
- 문: 게임 그림 `assets/objects/floor05/door-*.png`(닫힘|열림), 원본 `assets/objects/floor05/source/door-*.png`.
  유리문은 `flush_door_base.py --no-kick` → `make_door_sprite.py`(자동문은 `--double --top 0.075`). 모두 y=250, 높이 320.
- 권한 기준 시행 공지는 공용 `wall-notice` 스타일이다. 화장실 이름표는 문 위에 놓고 16층 화장실 문 그림을 쓰는 기존 공용 CSS를 유지한다.

| 방(월드 x·폭) | 벽 모듈 | 유리 너머(behind) | 문 |
| --- | --- | --- | --- |
| 연구개발실 (40·1000) | wall-glass-mixed | `behind-a.png` | `assets/objects/floor05/door-rnd.png` ← `source/door-rnd.png` (혼합 유리 자동문), doorX 280, 폭 240 |
| 기술연구실 (1080·690) | wall-concrete | — | `assets/objects/floor05/door-security.png` ← `source/door-security.png` (방 테마 문(보안 연구실 철문)), doorX 1163, 폭 130 |
| 회의실 (4282·680) | wall-frosted | `behind-c.png` | `assets/objects/floor05/door-meeting.png` ← `source/door-meeting.png` (불투명 유리 수동문), doorX 4577, 폭 130 |
