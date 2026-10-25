# 06F 벽·문 에셋

복도 화면: [../../복도/06F.png](../../복도/06F.png)

## 복도 벽 구성 (walls-layout.json)

빈 구간 기본: **기본벽(흰 벽)** (`wall-concrete`). 구간 양 끝은 기둥(`pilaster`).

| x | 폭 | 벽 모듈 | 방 | 문 | 유리 너머 |
| --- | --- | --- | --- | --- | --- |
| 40 | 1000 | 혼합 유리벽 `wall-glass-mixed` | 기술 개발 업무 공간 | door-work.png | behind-a.png |
| 1080 | 690 | 기본벽(흰 벽) `wall-concrete` | 공용 엔지니어링 구역 | door-engineering.png | - |
| 4282 | 680 | 혼합 유리벽 `wall-glass-mixed` | 기술 회의실 | door-meeting.png | behind-c.png |

다시 합성: `python assets/background/wall/compose_floor.py <walls-layout.json> <walls.png>`

## 복도의 방 문

| 방 | x | 폭 | 문 x | 문 폭 | 문 그림 |
| --- | --- | --- | --- | --- | --- |
| 기술 개발 업무 공간 | 40 | 1000 | 397 | 240 | assets/objects/floor06/door-work.png |
| 공용 엔지니어링 구역 | 1080 | 690 | 1296 | 130 | assets/objects/floor06/door-engineering.png |
| 기술 회의실 | 4282 | 680 | 4782 | 130 | assets/objects/floor06/door-meeting.png |
| 화장실 | 3556 | 726 | 3612 | 145 | metal |

## 방 안

| 방 | 화면 | 배경·문 원본 |
| --- | --- | --- |
| 기술 개발 업무 공간 | [화면](../../방/06F/f6-work_기술_개발_업무_공간.png) | floor06-ceiling-work.png, floor06-floor-work.png, floor06-work-interior.png, door-work.png |
| 공용 엔지니어링 구역 | [화면](../../방/06F/f6-engineering_공용_엔지니어링_구역.png) | floor06-ceiling-engineering.png, floor06-engineering-interior.png, floor06-floor-engineering.png, door-engineering.png |
| 기술 회의실 | [화면](../../방/06F/f6-meeting_기술_회의실.png) | floor06-ceiling-meeting.png, floor06-floor-meeting.png, floor06-meeting-interior.png, door-meeting.png |
| 화장실 | [화면](../../방/06F/f6-restroom_화장실.png) | restroom-finished.png, restroom-door.png |
