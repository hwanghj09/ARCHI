# 02F 벽·문 에셋

복도 화면: [../../복도/02F.png](../../복도/02F.png)

## 복도 벽 구성 (walls-layout.json)

빈 구간 기본: **기본벽(흰 벽)** (`wall-concrete`). 구간 양 끝은 기둥(`pilaster`).

| x | 폭 | 벽 모듈 | 방 | 문 | 유리 너머 |
| --- | --- | --- | --- | --- | --- |
| 40 | 1000 | 기본벽(흰 벽) `wall-concrete` | Harmony Hall | door-harmony.png | - |
| 1080 | 690 | 혼합 유리벽 `wall-glass-mixed` | 직원 휴게실 | door-lounge.png | behind-b.png |
| 4282 | 680 | 기본벽(흰 벽) `wall-concrete` | 서버실 | door-server.png | - |

다시 합성: `python assets/background/wall/compose_floor.py <walls-layout.json> <walls.png>`

## 복도의 방 문

| 방 | x | 폭 | 문 x | 문 폭 | 문 그림 |
| --- | --- | --- | --- | --- | --- |
| Harmony Hall | 40 | 1000 | 723 | 130 | assets/objects/floor02/door-harmony.png |
| 직원 휴게실 | 1080 | 690 | 1580 | 130 | assets/objects/floor02/door-lounge.png |
| 서버실 | 4282 | 680 | 4385 | 130 | assets/objects/floor02/door-server.png |
| 화장실 | 3556 | 726 | 3612 | 145 | metal |

## 방 안

| 방 | 화면 | 배경·문 원본 |
| --- | --- | --- |
| Harmony Hall | [화면](../../방/02F/f2-harmony_Harmony_Hall.png) | floor02-ceiling-hall.png, floor02-floor-hall.png, floor02-hall-interior.png, door-harmony.png |
| 직원 휴게실 | [화면](../../방/02F/f2-lounge_직원_휴게실.png) | floor02-ceiling-lounge.png, floor02-floor-lounge.png, floor02-lounge-wall.png, door-lounge.png |
| 서버실 | [화면](../../방/02F/f2-server_서버실.png) | floor02-ceiling-server.png, floor02-floor-server.png, floor02-server-interior.png, door-server.png |
| 화장실 | [화면](../../방/02F/f2-restroom_화장실.png) | restroom-finished.png, restroom-door.png |
