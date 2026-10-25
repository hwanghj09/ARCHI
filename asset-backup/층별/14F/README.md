# 14F 벽·문 에셋

복도 화면: [../../복도/14F.png](../../복도/14F.png)

## 복도 벽 구성 (walls-layout.json)

빈 구간 기본: **기본벽(흰 벽)** (`wall-concrete`). 구간 양 끝은 기둥(`pilaster`).

| x | 폭 | 벽 모듈 | 방 | 문 | 유리 너머 |
| --- | --- | --- | --- | --- | --- |
| 64 | 480 | 기본벽(흰 벽) `wall-concrete` | 연구 자료실 | vault | - |
| 560 | 640 | 혼합 유리벽 `wall-glass-mixed` | 데이터 연구실 | datalab | behind-data.png |
| 1216 | 560 | 불투명 유리벽 `wall-frosted` | 사용자 실험실 | observe | - |

다시 합성: `python assets/background/wall/compose_floor.py <walls-layout.json> <walls.png>`

## 복도의 방 문

| 방 | x | 폭 | 문 x | 문 폭 | 문 그림 |
| --- | --- | --- | --- | --- | --- |
| 연구 자료실 | 64 | 480 | 400 | 130 | vault |
| 데이터 연구실 | 560 | 640 | 620 | 150 | datalab |
| 사용자 실험실 | 1216 | 560 | 1420 | 130 | observe |
| 화장실 | 3556 | 726 | 3612 | 145 | metal |

## 방 안

| 방 | 화면 | 배경·문 원본 |
| --- | --- | --- |
| 연구 자료실 | [화면](../../방/14F/f14-archive_연구_자료실.png) | floor14-archive-interior.png, floor14-ceiling-archive.png, floor14-floor-archive.png, archive-door.png |
| 데이터 연구실 | [화면](../../방/14F/f14-data_데이터_연구실.png) | floor14-ceiling-data.png, floor14-data-interior.png, floor14-floor-data.png, data-door.png |
| 사용자 실험실 | [화면](../../방/14F/f14-ux_사용자_실험실.png) | floor14-ceiling-ux.png, floor14-floor-ux.png, floor14-ux-interior.png, observation-door.png |
| 화장실 | [화면](../../방/14F/f14-restroom_화장실.png) | restroom-finished.png, restroom-door.png |
