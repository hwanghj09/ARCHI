# 2층 배경 적용

- 원본: 사용자가 준 `floor02-hall-server-lounge.png`(3200×556 RGBA, 사방 여백 48px)와 `PROMPT.md`(제작 기록·좌표).
- 배율 1:1(원본 바닥선 y=438 → 월드 y=570, `top: 132`, 높이 556). 원본 방 천장(y≈80..120 → 월드 212..252)이 엘리베이터 문(y=220) 위에 걸리지 않는다.
- `build.py`(저장소 루트에서 `python assets/background/floor02/build.py`)가 만든다.

| 파일 | 원본 영역 | 월드 |
| --- | --- | --- |
| floor02-corridor.png | 끝벽 48..78, 행사장 앞 48..1024 + 칸막이 1500..1524(유리), 휴게실 앞 2194..2854 + 끝벽 3122..3152(유리), 서버실 앞 1524..2224 + 끝벽 3134..3152(유리), 나머지는 원본 슬래브·방화벽 색·바닥 슬래브로 이은 복도 벽. 비상구 유도등(3058..3102)을 계단 문 위에, 연주회 포스터(2892..2972)를 가운데 구역에 | 0..5000 |
| floor02-hall-interior.png | 48..1038 + 객석·벽 디스플레이 칸(1038..1278) 5번(번갈아 뒤집음) + 1038..1524 | 폭 2676 |
| floor02-lounge-interior.png | 2200..2884 + 창·소파 칸(2446..2884) 뒤집음 + 자판기(2242..2432) + 빈 판벽 266px + 2884..3152 | 폭 1846 |
| floor02-server-interior.png | 칸막이·문 1500..1538 + 가동 랙(1538..1600)·네트워크 랙(1862..1924) 9쌍 + 1538..2224 | 폭 1840 |
| floor02-hall/lounge/server-door.png | 기존 문 에셋을 16층 문 비율로 줄인 닫힘 칸 + 만든 열림 칸: 행사장 = 16층 식당 황동 양문(`floor16/cafeteria-door.png`), 휴게실 = 16층 카페 아치 원목 문(`cafe-door.png`), 서버실 = 13층 장비 검증실 철망 문(`floor13/testbay-door.png`) | 181/127/116 × 290(y=280, 방 안 천장선 y≈284 아래) |
| floor02-ceiling-corridor/hall/lounge/server.png | 16층처럼 에셋 위쪽 빈 곳을 채우는 천장: 위는 천장 속(덕트·배관·케이블 트레이·행거), 아래 40px는 장면별 천장판(슬레이트·청록+금박·원목 루버·흰 밀폐판)과 꺼진 매입등·환기구·스프링클러 | 장면 폭 × 180(top 0) |

투명 영역은 그대로 두고 층 배경색(`linear-gradient(#0b1012, #12191c)`)이 비친다. 스크린 덮개(`.fixture.screen-cover`)는 원본 스크린
(x=184..556, y=134..340) 위를 영사기가 돌기 전까지 가린다.

화장실: 문은 16층 화장실 문 그림(`floor16/restroom-door.png`)을 입히고, 이름표는 문(x=3612..3757) 바로 위 천장 슬래브(y≈184)에 둔다(index.html의 2층 규칙). 화장실 문 자리는 건물 코어라 모든 층이 같다.


천장·바닥(16층처럼): 장면 그림은 에셋의 벽 부분(행 82..441)만 남겨 세로로 약 1.32배 늘린다(월드 y=100..575, 행 438 = 바닥선 570, 그림 475px 높이). 위아래 슬래브 단면은 지우고, 화면 맨 위에 `floor02-ceiling-*.png`(0..100: 천장판·꺼진 매입등·에어컨 그릴·스프링클러·벽 위 띠), 바닥선 아래에 `floor02-floor-*.png`(570..760)를 깐다. 조사 지점 y는 `floor-02.js`의 `floor2Y(행)`으로 바꾼다.

복도 벽면(2026-10 개편): 사용자가 준 2층 벽면 세트(`facades/`, README.md·make_facades.py 포함)를 쓴다. 모든 조각이 같은 틀(상단 띠, 기준선 y=96 = 문 윗선, 걸레받이)이라, 기준선이 게임 문 윗선(월드 y=280)·조각 아래 끝이 바닥선(570)에 오도록 1.576배로 키우고 상단 띠를 천장 아래(y=100)까지 늘린다. 복도 전체는 공통 콘크리트, 방 앞면은 기둥으로 시작·끝:

| 방(월드 전면) | 조각(왼쪽→오른쪽) | 문(월드 x·폭) |
| --- | --- | --- |
| Harmony Hall (40..1040) | 기둥, hall-wall(일부), hall-wall-poster, hall-door, 기둥 | 640·296 (양여닫이) |
| 직원 휴게실 (1080..1770) | 기둥, lounge-glass(일부), lounge-door, lounge-glass(일부), 기둥 | 1337·177 (유리문) |
| 서버실 (4282..4962) | 기둥, server-door(일부), server-window(일부), server-wall, 기둥 | 4367·167 (철문) |

휴게실 유리·서버실 관찰창 뒤에는 단면 에셋의 방 그림이 비치고, 휴게실 필름(기준선 아래) 뒤는 6px 흐린다. 게임 문 그림(`floor02-*-door.png`)은 문 조각의 문짝(기준선~바닥)을 그대로 잘라 열림 칸을 붙인 것이라 벽면 속 문과 정확히 겹친다. 연주회 포스터 조사 지점은 hall-wall-poster의 액자(월드 x=451..558) 위로 옮겼다. 조각 위의 글자 없는 이름판은 그대로 두고, 방 이름은 CSS 이름표(천장 경계)가 보인다.

벽과 바닥 사이 틈 수정: 바닥 층(`floor02-floor-*.png`)을 월드 y=556..760으로 올리고 벽 그림의 556 아래(걸레받이·방 바닥 앞면 띠)는 비운다. 바닥 층 맨 위 2px는 벽과 만나는 모서리 선이다. 플레이어 발은 여전히 y=570(바닥 안쪽 깊이 14px)에 선다.

## 복도 벽·문 (2026-10-10 파일 정리 기준, 이 절이 최신)

- 복도: `walls.png`(5000×752, top 0, 바닥선 570) = `assets/background/wall` 모듈을 `walls-layout.json`(`"modules": "../wall"`)으로 합성.
  다시 만들기: `python assets/background/wall/compose_floor.py assets/background/floor02/walls-layout.json assets/background/floor02/walls.png`.
- 유리 구간 뒤 그림(`behind-*.png`)은 이 층 단면 에셋에서 자른 것(behind_floor_y 438).
- 문: 게임 그림 `assets/objects/floor02/door-*.png`(닫힘|열림), 원본 `assets/objects/floor02/source/door-*.png`.
  유리문은 `flush_door_base.py --no-kick` → `make_door_sprite.py`(자동문은 `--double --top 0.075`). 모두 y=250, 높이 320.
- `build.py`는 방 내부·천장·바닥 층만 만든다. 위쪽의 이전 기록에 나오는 복도 그림(`floor02-corridor.png`)·코드로 그린 문·벽면 세트(facades)는 정리하면서 지웠다.

| 방(월드 x·폭) | 벽 모듈 | 유리 너머(behind) | 문 |
| --- | --- | --- | --- |
| Harmony Hall (40·1000) | wall-concrete | — | `assets/objects/floor02/door-harmony.png` ← `source/door-harmony.png` (방 테마 문(콘서트홀 원목)), doorX 723, 폭 130 |
| 직원 휴게실 (1080·690) | wall-glass-mixed | `behind-b.png` | `assets/objects/floor02/door-lounge.png` ← `source/door-lounge.png` (혼합 유리 수동문), doorX 1375, 폭 130 |
| 서버실 (4282·680) | wall-concrete | — | `assets/objects/floor02/door-server.png` ← `source/door-server.png` (방 테마 문(서버실 철문)), doorX 4385, 폭 130 |

## 방 안 출구 문 자리 (3차 작업)

- 복도 문은 그대로 두고, 방 안 출구 문만 방 끝(끝벽 30px 안) 또는 몇몇 방은 가운데 빈 벽 자리에 세운다.
- `cutaway_kit.door_bay`가 그 자리에 복도와 같은 벽 모듈(`assets/background/wall`) 칸을 끼운다: 늘린 벽 그림(월드 y=100..556) 위에
  양 끝 기둥, 유리 너머는 어두운 복도 흰 벽, 밝기는 방 벽에 맞춤. 문 양옆 96px은 빈 벽이라 가구가 문에 닿지 않는다. 유리 창살은 문에서
  떨어지게(보통 문 중심 ±120, 240 자동문은 문 가운데 이음매 뒤) 깐다. `build.py`의 `BAYS`가 `door_bay`를 부르고 천장·바닥 층을 새 폭으로 만든다.
- 칸 폭(문 폭 + 192)만큼 그 오른쪽 그림·조사 지점·장애물이 밀린다(방 설정 `exitBay`). 안팎 문 비율 검사는 `exitBay` 방에서 뺀다.

| 방 | 자리 | 끼운 x | 칸 폭 | 벽 모듈 | 방 폭 | 안쪽 exitX |
| --- | --- | --- | --- | --- | --- | --- |
| Harmony Hall | 오른쪽 끝 | 2652 | 322 | wall-concrete | 2998 | 2748 |
| 서버실 | 왼쪽 끝 | 30 | 322 | wall-concrete | 2162 | 126 |

- 직원 휴게실은 `floor02-lounge-wall.png`(소파·테이블 소품)로 따로 다듬은 방이라 그대로 둔다.

- 복도 문은 기둥(구간 양 끝 48px)·유리 창살에 걸리거나 유리문 너머로 창살이 비치지 않게만 옮겼다: 직원 휴게실 1544→1580.

