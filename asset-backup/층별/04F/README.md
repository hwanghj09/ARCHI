# 04F 벽·문 에셋

복도 화면: [../../복도/04F.png](../../복도/04F.png)

## 복도 벽 구성 (walls-layout.json)

빈 구간 기본: **기본벽(흰 벽)** (`wall-concrete`). 구간 양 끝은 기둥(`pilaster`).

| x | 폭 | 벽 모듈 | 방 | 문 | 유리 너머 |
| --- | --- | --- | --- | --- | --- |
| 40 | 1000 | 혼합 유리벽 `wall-glass-mixed` | 연구개발 업무 공간 | door-lab.png | behind-a.png |
| 1080 | 690 | 투명 유리벽 `wall-glass` | 개발자 업무 구역 | door-dev.png | behind-b.png |
| 4282 | 680 | 불투명 유리벽 `wall-frosted` | 연구 회의실 | door-meeting.png | behind-c.png |

다시 합성: `python assets/background/wall/compose_floor.py <walls-layout.json> <walls.png>`

## 복도의 방 문

| 방 | x | 폭 | 문 x | 문 폭 | 문 그림 |
| --- | --- | --- | --- | --- | --- |
| 연구개발 업무 공간 | 40 | 1000 | 335 | 130 | assets/objects/floor04/door-lab.png |
| 개발자 업무 구역 | 1080 | 690 | 1135 | 130 | assets/objects/floor04/door-dev.png |
| 연구 회의실 | 4282 | 680 | 4786 | 130 | assets/objects/floor04/door-meeting.png |
| 화장실 | 3556 | 726 | 3612 | 145 | metal |

## 방 안

| 방 | 화면 | 배경·문 원본 |
| --- | --- | --- |
| 연구개발 업무 공간 | [화면](../../방/04F/f4-lab_연구개발_업무_공간.png) | floor04-ceiling-lab.png, floor04-floor-lab.png, floor04-lab-interior.png, door-lab.png |
| 개발자 업무 구역 | [화면](../../방/04F/f4-dev_개발자_업무_구역.png) | floor04-ceiling-dev.png, floor04-dev-interior.png, floor04-floor-dev.png, door-dev.png |
| 연구 회의실 | [화면](../../방/04F/f4-meeting_연구_회의실.png) | floor04-ceiling-meeting.png, floor04-floor-meeting.png, floor04-meeting-interior.png, door-meeting.png |
| 화장실 | [화면](../../방/04F/f4-restroom_화장실.png) | restroom-finished.png, restroom-door.png |
