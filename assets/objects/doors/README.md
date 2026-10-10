# 방 문 공용 그림 (여러 층이 함께 쓰는 문)

벽과 맞춘 문 세트(사용자 제공 archi-matched-doors-v3)의 기본 문이다. 벽 밝기 필터(brightness .72 / saturate .85)를 미리 구워 넣었다.

| 파일 | 크기(게임 px) | 짝이 되는 벽(assets/background/wall) |
| --- | --- | --- |
| `door-glass-mixed-single.png` / `-auto.png` | 130×320 / 240×320 | `wall-glass-mixed` |
| `door-glass-clear-single.png` / `-auto.png` | 〃 | `wall-glass` |
| `door-glass-frosted-single.png` / `-auto.png` | 〃 | `wall-frosted` |
| `door-solid-vision.png` / `-plain.png` | 130×320 | `wall-concrete`(흰 기본벽) |

- 그림은 게임 크기의 4배(수동 520×1280, 자동 960×1280), 위 끝 = 월드 y 250, 아래 끝 = 570.
- 방마다 쓰는 문의 원본(한 칸 그림)은 `assets/objects/floorNN/source/door-<방>.png`, 게임이 쓰는 닫힘|열림 두 칸 그림은
  `assets/objects/floorNN/door-<방>.png`이다(archi-floor-doors 스킬의 `flush_door_base.py` → `make_door_sprite.py`).
- `source/`: 생성 스크립트(`make_doors_matched.py`, `make_poster.py`는 벽에 맞춘 문·포스터, `doors.py`·`doorkit.py`는 방 테마 문).
