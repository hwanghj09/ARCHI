# 05F 벽·문 에셋

복도 화면: [../../복도/05F.png](../../복도/05F.png)

## 복도 벽 구성 (walls-layout.json)

빈 구간 기본: **기본벽(흰 벽)** (`wall-concrete`). 구간 양 끝은 기둥(`pilaster`).

| x | 폭 | 벽 모듈 | 방 | 문 | 유리 너머 |
| --- | --- | --- | --- | --- | --- |
| 40 | 1000 | 혼합 유리벽 `wall-glass-mixed` | 연구개발실 | door-rnd.png | behind-a.png |
| 1080 | 690 | 기본벽(흰 벽) `wall-concrete` | 기술연구실 | door-security.png | - |
| 4282 | 680 | 불투명 유리벽 `wall-frosted` | 회의실 | door-meeting.png | behind-c.png |

다시 합성: `python assets/background/wall/compose_floor.py <walls-layout.json> <walls.png>`

## 복도의 방 문

| 방 | x | 폭 | 문 x | 문 폭 | 문 그림 |
| --- | --- | --- | --- | --- | --- |
| 연구개발실 | 40 | 1000 | 397 | 240 | assets/objects/floor05/door-rnd.png |
| 기술연구실 | 1080 | 690 | 1163 | 130 | assets/objects/floor05/door-security.png |
| 회의실 | 4282 | 680 | 4577 | 130 | assets/objects/floor05/door-meeting.png |
| 화장실 | 3556 | 726 | 3612 | 145 | metal |

## 방 안

| 방 | 화면 | 배경·문 원본 |
| --- | --- | --- |
| 연구개발실 | [화면](../../방/05F/f5-rnd_연구개발실.png) | floor05-ceiling-rnd.png, floor05-floor-rnd.png, floor05-rnd-interior.png, floor05-step.png, door-rnd.png |
| 기술연구실 | [화면](../../방/05F/f5-security_기술연구실.png) | floor05-ceiling-security.png, floor05-floor-security.png, floor05-security-interior.png, door-security.png |
| 회의실 | [화면](../../방/05F/f5-meeting_회의실.png) | floor05-ceiling-meeting.png, floor05-floor-meeting.png, floor05-meeting-interior.png, door-meeting.png |
| 화장실 | [화면](../../방/05F/f5-restroom_화장실.png) | restroom-finished.png, restroom-door.png |
