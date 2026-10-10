# 복도 벽 모듈 (공용)

모든 층 복도 벽 배경을 만드는 공용 모듈이다(archi-floor-walls 스킬). 사용자가 준 벽 세트(흰색 walls-v3 → 문과 맞춘 v3)를 정리한 것이다.

| 파일 | 내용 |
| --- | --- |
| `wall-concrete.png` | 흰 기본벽(줄눈, 가로 줄눈 y=250) |
| `wall-glass.png` | 투명 유리벽(트랜섬 y=250) |
| `wall-frosted.png` | 불투명 유리벽 |
| `wall-glass-mixed.png` | 혼합 유리벽(필름 경계 y=330) |
| `pilaster.png` | 구간 양 끝 기둥 48px |
| `@2x` | 각 모듈의 2배 판 |
| `compose_floor.py` | 층 레이아웃 json → 층 하나짜리 벽 배경 PNG |
| `make_walls_v3.py` | 모듈 생성 스크립트(scipy 필요) |

구조(@1x, 모듈 480×752, 기둥 48×752): 천장·매입등 0..48, 천장 띠 48..96, 벽 96..556(기준선 250), 걸레받이 556..570, 바닥 570..752.

쓰는 법: 층 폴더에 `walls-layout.json`(`"modules": "../wall"`, 방마다 x·width·wall, 유리 구간은 `behind`)을 두고
`python assets/background/wall/compose_floor.py assets/background/floorNN/walls-layout.json assets/background/floorNN/walls.png`.
게임은 `backgroundImage: { src: 'assets/background/floorNN/walls.png', height: 752, top: 0 }`로 쓴다. 문은 벽에 넣지 않는다(assets/objects).
