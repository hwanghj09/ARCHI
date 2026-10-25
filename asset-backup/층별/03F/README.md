# 03F 벽·문 에셋

복도 화면: [../../복도/03F.png](../../복도/03F.png)

## 복도 벽 구성 (walls-layout.json)

빈 구간 기본: **기본벽(흰 벽)** (`wall-concrete`). 구간 양 끝은 기둥(`pilaster`).

| x | 폭 | 벽 모듈 | 방 | 문 | 유리 너머 |
| --- | --- | --- | --- | --- | --- |
| 40 | 1000 | 투명 유리벽 `wall-glass` | Fitness Club | door-fitness.png | behind-a.png |
| 1080 | 690 | 혼합 유리벽 `wall-glass-mixed` | 고객만족센터 | door-cs.png | behind-b.png |
| 4282 | 680 | 기본벽(흰 벽) `wall-concrete` | Studio | door-studio.png | - |

다시 합성: `python assets/background/wall/compose_floor.py <walls-layout.json> <walls.png>`

## 복도의 방 문

| 방 | x | 폭 | 문 x | 문 폭 | 문 그림 |
| --- | --- | --- | --- | --- | --- |
| Fitness Club | 40 | 1000 | 640 | 240 | assets/objects/floor03/door-fitness.png |
| 고객만족센터 | 1080 | 690 | 1375 | 130 | assets/objects/floor03/door-cs.png |
| Studio | 4282 | 680 | 4321 | 130 | assets/objects/floor03/door-studio.png |
| 화장실 | 3556 | 726 | 3612 | 145 | metal |

## 방 안

| 방 | 화면 | 배경·문 원본 |
| --- | --- | --- |
| Fitness Club | [화면](../../방/03F/f3-fitness_Fitness_Club.png) | floor03-ceiling-gym.png, floor03-floor-gym.png, floor03-gym-interior.png, door-fitness.png |
| 고객만족센터 | [화면](../../방/03F/f3-cs_고객만족센터.png) | floor03-ceiling-cs.png, floor03-cs-interior.png, floor03-floor-cs.png, door-cs.png |
| Studio | [화면](../../방/03F/f3-studio_Studio.png) | floor03-ceiling-studio.png, floor03-floor-studio.png, floor03-studio-interior.png, door-studio.png |
| 화장실 | [화면](../../방/03F/f3-restroom_화장실.png) | restroom-finished.png, restroom-door.png |
