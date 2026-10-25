# 11F 벽·문 에셋

복도 화면: [../../복도/11F.png](../../복도/11F.png)

## 복도 벽 구성 (walls-layout.json)

빈 구간 기본: **기본벽(흰 벽)** (`wall-concrete`). 구간 양 끝은 기둥(`pilaster`).

| x | 폭 | 벽 모듈 | 방 | 문 | 유리 너머 |
| --- | --- | --- | --- | --- | --- |
| 64 | 632 | 혼합 유리벽 `wall-glass-mixed` | 영업본부 사무실 | gilt | behind-sales.png |
| 4322 | 316 | 불투명 유리벽 `wall-frosted` | 전략회의실 | privacy | - |
| 4652 | 316 | 기본벽(흰 벽) `wall-concrete` | 마케팅 자료실 | stockroom | - |

다시 합성: `python assets/background/wall/compose_floor.py <walls-layout.json> <walls.png>`

## 복도의 방 문

| 방 | x | 폭 | 문 x | 문 폭 | 문 그림 |
| --- | --- | --- | --- | --- | --- |
| 영업본부 사무실 | 64 | 632 | 244 | 140 | gilt |
| 전략회의실 | 4322 | 316 | 4470 | 130 | privacy |
| 마케팅 자료실 | 4652 | 316 | 4668 | 120 | stockroom |
| 화장실 | 3556 | 726 | 3612 | 145 | metal |

## 방 안

| 방 | 화면 | 배경·문 원본 |
| --- | --- | --- |
| 영업본부 사무실 | [화면](../../방/11F/f11-sales_영업본부_사무실.png) | floor11-ceiling-sales.png, floor11-floor-sales.png, floor11-sales-interior.png, sales-door.png |
| 전략회의실 | [화면](../../방/11F/f11-strategy_전략회의실.png) | floor11-ceiling-strategy.png, floor11-floor-strategy.png, floor11-strategy-interior.png, strategy-door.png |
| 마케팅 자료실 | [화면](../../방/11F/f11-marketing_마케팅_자료실.png) | floor11-ceiling-marketing.png, floor11-floor-marketing.png, floor11-marketing-interior.png, materials-door.png |
| 화장실 | [화면](../../방/11F/f11-restroom_화장실.png) | restroom-finished.png, restroom-door.png |
