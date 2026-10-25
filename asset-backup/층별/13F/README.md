# 13F 벽·문 에셋

복도 화면: [../../복도/13F.png](../../복도/13F.png)

## 복도 벽 구성 (walls-layout.json)

빈 구간 기본: **기본벽(흰 벽)** (`wall-concrete`). 구간 양 끝은 기둥(`pilaster`).

| x | 폭 | 벽 모듈 | 방 | 문 | 유리 너머 |
| --- | --- | --- | --- | --- | --- |
| 3090 | 460 | 혼합 유리벽 `wall-glass-mixed` | 기술지원 상황실 | ops | behind-ops.png |
| 4290 | 320 | 기본벽(흰 벽) `wall-concrete` | 장비 검증실 | cage | - |
| 4620 | 320 | 불투명 유리벽 `wall-frosted` | 고객 교육장 | classroom | - |

다시 합성: `python assets/background/wall/compose_floor.py <walls-layout.json> <walls.png>`

## 복도의 방 문

| 방 | x | 폭 | 문 x | 문 폭 | 문 그림 |
| --- | --- | --- | --- | --- | --- |
| 기술지원 상황실 | 3090 | 460 | 3240 | 160 | ops |
| 장비 검증실 | 4290 | 320 | 4300 | 130 | cage |
| 고객 교육장 | 4620 | 320 | 4800 | 120 | classroom |
| 화장실 | 3556 | 726 | 3612 | 145 | metal |

## 방 안

| 방 | 화면 | 배경·문 원본 |
| --- | --- | --- |
| 기술지원 상황실 | [화면](../../방/13F/f13-ops_기술지원_상황실.png) | floor13-ceiling-ops.png, floor13-floor-ops.png, floor13-ops-interior.png, ops-door.png |
| 장비 검증실 | [화면](../../방/13F/f13-testbay_장비_검증실.png) | floor13-ceiling-testbay.png, floor13-floor-testbay.png, floor13-testbay-interior.png, testbay-door.png |
| 고객 교육장 | [화면](../../방/13F/f13-training_고객_교육장.png) | floor13-ceiling-training.png, floor13-floor-training.png, floor13-training-interior.png, training-door.png |
| 화장실 | [화면](../../방/13F/f13-restroom_화장실.png) | restroom-finished.png, restroom-door.png |
