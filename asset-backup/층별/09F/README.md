# 09F 벽·문 에셋

복도 화면: [../../복도/09F.png](../../복도/09F.png)

## 복도 벽 구성 (walls-layout.json)

빈 구간 기본: **기본벽(흰 벽)** (`wall-concrete`). 구간 양 끝은 기둥(`pilaster`).

| x | 폭 | 벽 모듈 | 방 | 문 | 유리 너머 |
| --- | --- | --- | --- | --- | --- |
| 40 | 1000 | 혼합 유리벽 `wall-glass-mixed` | 사업 업무 공간 | door-lab.png | behind-a.png |
| 1080 | 690 | 혼합 유리벽 `wall-glass-mixed` | 영업·고객 관리 구역 | door-lab.png | behind-b.png |
| 4282 | 680 | 불투명 유리벽 `wall-frosted` | 프로젝트룸 | door-meeting.png | behind-c.png |

다시 합성: `python assets/background/wall/compose_floor.py <walls-layout.json> <walls.png>`

## 복도의 방 문

| 방 | x | 폭 | 문 x | 문 폭 | 문 그림 |
| --- | --- | --- | --- | --- | --- |
| 사업 업무 공간 | 40 | 1000 | 849 | 130 | assets/objects/floor04/door-lab.png |
| 영업·고객 관리 구역 | 1080 | 690 | 1351 | 130 | assets/objects/floor04/door-lab.png |
| 프로젝트룸 | 4282 | 680 | 4608 | 130 | assets/objects/floor04/door-meeting.png |
| 화장실 | 3556 | 726 | 3612 | 145 | metal |

## 방 안

| 방 | 화면 | 배경·문 원본 |
| --- | --- | --- |
| 사업 업무 공간 | [화면](../../방/09F/f9-office_사업_업무_공간.png) | floor09-ceiling-office.png, floor09-floor-office.png, floor09-office-interior.png, door-lab.png |
| 영업·고객 관리 구역 | [화면](../../방/09F/f9-sales_영업·고객_관리_구역.png) | floor09-ceiling-sales.png, floor09-floor-sales.png, floor09-sales-interior.png, door-lab.png |
| 프로젝트룸 | [화면](../../방/09F/f9-project_프로젝트룸.png) | floor09-ceiling-project.png, floor09-floor-project.png, floor09-project-interior.png, door-meeting.png |
| 화장실 | [화면](../../방/09F/f9-restroom_화장실.png) | restroom-finished.png, restroom-door.png |
