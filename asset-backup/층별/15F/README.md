# 15F 벽·문 에셋

복도 화면: [../../복도/15F.png](../../복도/15F.png)

## 복도 벽 구성 (walls-layout.json)

빈 구간 기본: **기본벽(흰 벽)** (`wall-concrete`). 구간 양 끝은 기둥(`pilaster`).

| x | 폭 | 벽 모듈 | 방 | 문 | 유리 너머 |
| --- | --- | --- | --- | --- | --- |
| 64 | 860 | 혼합 유리벽 `wall-glass-mixed` | 연구실 | research | behind-lab.png |
| 954 | 620 | 불투명 유리벽 `wall-frosted` | 세미나실 | seminar | - |
| 3092 | 456 | 기본벽(흰 벽) `wall-concrete` | 연구본부장실 | director | - |

다시 합성: `python assets/background/wall/compose_floor.py <walls-layout.json> <walls.png>`

## 복도의 방 문

| 방 | x | 폭 | 문 x | 문 폭 | 문 그림 |
| --- | --- | --- | --- | --- | --- |
| 연구실 | 64 | 860 | 280 | 140 | research |
| 세미나실 | 954 | 620 | 970 | 130 | seminar |
| 연구본부장실 | 3092 | 456 | 3160 | 120 | director |
| 화장실 | 3556 | 726 | 3612 | 145 | metal |

## 방 안

| 방 | 화면 | 배경·문 원본 |
| --- | --- | --- |
| 연구실 | [화면](../../방/15F/f15-lab_연구실.png) | floor15-ceiling-lab.png, floor15-floor-lab.png, floor15-lab-interior.png, research-door.png |
| 세미나실 | [화면](../../방/15F/f15-seminar_세미나실.png) | floor15-ceiling-seminar.png, floor15-floor-seminar.png, floor15-seminar-interior.png, seminar-door.png |
| 연구본부장실 | [화면](../../방/15F/f15-director_연구본부장실.png) | floor15-ceiling-director.png, floor15-director-interior.png, floor15-floor-director.png, director-door.png |
| 화장실 | [화면](../../방/15F/f15-restroom_화장실.png) | restroom-finished.png, restroom-door.png |
