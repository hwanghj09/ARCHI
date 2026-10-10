# 3층 배경 적용

- 원본: 사용자가 준 `floor03-welfare.png`(3200×556 RGBA, 사방 여백 48px)와 `PROMPT.md`(제작 기록·좌표).
- 배율 1:1(원본 바닥선 y=438 → 월드 y=570, `top: 132`, 높이 556).
- `build.py`(저장소 루트에서 `python assets/background/floor03/build.py`, 공용 `assets/background/cutaway_kit.py` 사용)가 만든다.

| 파일 | 원본 영역 | 월드 |
| --- | --- | --- |
| floor03-corridor.png | 끝벽 48..78, Fitness Club 앞 48..1024 + 기둥 1176..1200(유리), 고객만족센터 앞 1226..1886 + 기둥 2236..2266(유리), Studio 앞 2236..2916 + 끝벽 3114..3152(유리), 나머지는 원본 슬래브·기둥 색(1186..1206)·바닥 슬래브로 이은 복도 벽. 비상구 유도등(1237..1283, 167..185행)을 계단 문 위(2974, 209)에 | 0..5000 |
| floor03-gym-interior.png | 안쪽: 48..316 + 러닝머신 칸 104..316 세 번 + 316..510 + 빈 GX 거울 196px(위 104..300, 아래 298..312 반복). 기둥·유리 자동문 1176..1228(월드 1294, 유리 1330..1346). 바깥: 510..1088 + 빈 벽 246 + 사물함 960..1088 뒤집음 + 빈 벽 260 + 트레이너 카운터 1088..1176(속도 차트, 비상 개방 버튼 → 월드 2624..2640) + 끝벽. 퇴실 버튼은 원본 버튼(1154..1170, 292..313행)을 월드 1186에 옮겨 그림 | 폭 2676 |
| floor03-cs-interior.png | 끝벽 + 위(0..318행) 1226..1488·흡음 클라우드 칸(1488..1736) 3번과 빈 벽 744px·1488..2236 / 아래(318..행) 1226..1851·상담석 한 자리(1758..1851) 8번·1851..2236 + 기둥 1180..1212 + 끝벽 | 폭 1846 |
| floor03-studio-interior.png | 기둥·암막 커튼 2236..2316 + 쐐기형 흡음재 924px(2340..2364, 24px 주기, 하드 케이스 3026..3112 뒤집어 한 벌) + 2316..3152 | 폭 1840 |
| floor03-gym/cs/studio-door.png | `door_sheet`(glass/glass/steel, 닫힘 \| 열림) | 140/110/120 × 210 |

투명 영역에는 층 배경색(`linear-gradient(#100f0e, #191715)`)이 비친다. 자동문의 열림·닫힘은 그림 위에 CSS(`.barrier.f3-auto-door`)로 겹친다.

## 복도 벽·문 (2026-10-10 파일 정리 기준, 이 절이 최신)

- 복도: `walls.png`(5000×752, top 0, 바닥선 570) = `assets/background/wall` 모듈을 `walls-layout.json`(`"modules": "../wall"`)으로 합성.
  다시 만들기: `python assets/background/wall/compose_floor.py assets/background/floor03/walls-layout.json assets/background/floor03/walls.png`.
- 유리 구간 뒤 그림(`behind-*.png`)은 이 층 단면 에셋에서 자른 것(behind_floor_y 438).
- 문: 게임 그림 `assets/objects/floor03/door-*.png`(닫힘|열림), 원본 `assets/objects/floor03/source/door-*.png`.
  유리문은 `flush_door_base.py --no-kick` → `make_door_sprite.py`(자동문은 `--double --top 0.075`). 모두 y=250, 높이 320.
- `build.py`는 방 내부만 만든다. 위쪽의 이전 기록에 나오는 복도 그림(`floor03-corridor.png`)·코드로 그린 문은 정리하면서 지웠다.

| 방(월드 x·폭) | 벽 모듈 | 유리 너머(behind) | 문 |
| --- | --- | --- | --- |
| Fitness Club (40·1000) | wall-glass | `behind-a.png` | `assets/objects/floor03/door-fitness.png` ← `source/door-fitness.png` (투명 유리 자동문), doorX 755, 폭 240 |
| 고객만족센터 (1080·690) | wall-glass-mixed | `behind-b.png` | `assets/objects/floor03/door-cs.png` ← `source/door-cs.png` (혼합 유리 수동문), doorX 1375, 폭 130 |
| Studio (4282·680) | wall-concrete | — | `assets/objects/floor03/door-studio.png` ← `source/door-studio.png` (방 테마 문(스튜디오 철문)), doorX 4295, 폭 130 |
