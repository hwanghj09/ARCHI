# 08F 벽·문 에셋

복도 화면: [../../복도/08F.png](../../복도/08F.png)

## 복도 벽 구성 (walls-layout.json)

빈 구간 기본: **기본벽(흰 벽)** (`wall-concrete`). 구간 양 끝은 기둥(`pilaster`).

| x | 폭 | 벽 모듈 | 방 | 문 | 유리 너머 |
| --- | --- | --- | --- | --- | --- |
| 40 | 1000 | 기본벽(흰 벽) `wall-concrete` | QA 시험실 | door-security.png | - |
| 1080 | 690 | 혼합 유리벽 `wall-glass-mixed` | 제품기획실 | door-lab.png | behind-b.png |
| 4282 | 680 | 불투명 유리벽 `wall-frosted` | 공용 제품 회의실 | door-meeting.png | behind-c.png |

다시 합성: `python assets/background/wall/compose_floor.py <walls-layout.json> <walls.png>`

## 복도의 방 문

| 방 | x | 폭 | 문 x | 문 폭 | 문 그림 |
| --- | --- | --- | --- | --- | --- |
| QA 시험실 | 40 | 1000 | 620 | 130 | assets/objects/floor05/door-security.png |
| 제품기획실 | 1080 | 690 | 1160 | 130 | assets/objects/floor04/door-lab.png |
| 공용 제품 회의실 | 4282 | 680 | 4786 | 130 | assets/objects/floor04/door-meeting.png |
| 화장실 | 3556 | 726 | 3612 | 145 | metal |

## 방 안

| 방 | 화면 | 배경·문 원본 |
| --- | --- | --- |
| QA 시험실 | [화면](../../방/08F/f8-qa_QA_시험실.png) | floor08-ceiling-qa.png, floor08-floor-qa.png, floor08-qa-interior.png, door-security.png |
| 제품기획실 | [화면](../../방/08F/f8-planning_제품기획실.png) | floor08-ceiling-planning.png, floor08-floor-planning.png, floor08-planning-interior.png, door-lab.png |
| 공용 제품 회의실 | [화면](../../방/08F/f8-meeting_공용_제품_회의실.png) | floor08-ceiling-meeting.png, floor08-floor-meeting.png, floor08-meeting-interior.png, door-meeting.png |
| 화장실 | [화면](../../방/08F/f8-restroom_화장실.png) | restroom-finished.png, restroom-door.png |
