# 10F 벽·문 에셋

복도 화면: [../../복도/10F.png](../../복도/10F.png)

## 복도 벽 구성 (walls-layout.json)

빈 구간 기본: **기본벽(흰 벽)** (`wall-concrete`). 구간 양 끝은 기둥(`pilaster`).

| x | 폭 | 벽 모듈 | 방 | 문 | 유리 너머 |
| --- | --- | --- | --- | --- | --- |
| 40 | 1000 | 혼합 유리벽 `wall-glass-mixed` | 경영관리 사무실 | door-lab.png | behind-a.png |
| 1080 | 690 | 불투명 유리벽 `wall-frosted` | 임원 회의실 | door-meeting.png | behind-b.png |
| 4282 | 680 | 기본벽(흰 벽) `wall-concrete` | 임원실 | door-meeting.png | - |

다시 합성: `python assets/background/wall/compose_floor.py <walls-layout.json> <walls.png>`

## 복도의 방 문

| 방 | x | 폭 | 문 x | 문 폭 | 문 그림 |
| --- | --- | --- | --- | --- | --- |
| 경영관리 사무실 | 40 | 1000 | 369 | 130 | assets/objects/floor04/door-lab.png |
| 임원 회의실 | 1080 | 690 | 1344 | 130 | assets/objects/floor04/door-meeting.png |
| 임원실 | 4282 | 680 | 4321 | 130 | assets/objects/floor04/door-meeting.png |
| 화장실 | 3556 | 726 | 3612 | 145 | metal |

## 방 안

| 방 | 화면 | 배경·문 원본 |
| --- | --- | --- |
| 경영관리 사무실 | [화면](../../방/10F/f10-office_경영관리_사무실.png) | floor10-ceiling-office.png, floor10-floor-office.png, floor10-office-interior.png, door-lab.png |
| 임원 회의실 | [화면](../../방/10F/f10-meeting_임원_회의실.png) | floor10-ceiling-meeting.png, floor10-floor-meeting.png, floor10-meeting-interior.png, door-meeting.png |
| 임원실 | [화면](../../방/10F/f10-executive_임원실.png) | floor10-ceiling-executive.png, floor10-executive-interior.png, floor10-floor-executive.png, door-meeting.png |
| 화장실 | [화면](../../방/10F/f10-restroom_화장실.png) | restroom-finished.png, restroom-door.png |
