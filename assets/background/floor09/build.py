# 9층 배경: 사용자가 준 단면 에셋 floor09-business.png(3200×556, PROMPT.md)로 복도 1장, 방 내부 3장, 문 스프라이트 3장을 만든다.
# 실행: python assets/background/floor09/build.py (저장소 루트에서, Pillow·numpy). 공용 도구는 assets/background/cutaway_kit.py.
# 에셋은 플레이어 162px = 175cm 기준이라 1:1로 쓴다(원본 바닥선 y=438 → 월드 y=570, top=132). 건물 코어는 모든 층에서 같은 자리라
# 사업 업무 공간·영업·고객 관리 구역은 코어 왼쪽, 프로젝트룸은 화장실 오른쪽에서 유리 너머로 보이고, 방 안에는 방 그림 전체를
# 반복 칸으로 넓혀 쓴다. 복도 문은 그림의 중요한 물건(감사패 진열장·지도·현황판·라이선스 대장·간트 보드)을 가리지 않는 자리에 둔다.
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets/background')
from cutaway_kit import Cutaway, door_sheet  # noqa: E402

HERE = 'assets/background/floor09/'
DOORS = 'assets/objects/floor09/'                # 문 그림은 오브젝트 폴더(파일 정리 규칙)
kit = Cutaway(HERE + 'floor09-business.png', seed=9)
A = kit.A

# ---------------------------------------------------------------- 복도(5000)
# 벽 색은 프로젝트룸 디스플레이와 삼각대 사이의 빈 목탄색 벽(3010..3025)에서 뽑는다.
corridor = kit.corridor_wall(5000, wall=(3010, 3025))
corridor[:, 10:40] = A[:, 48:78]                                            # 왼쪽 끝벽
# 사업 업무 공간 앞(월드 40..1040): 창·책상 두 줄·감사패 진열장(78..910) + 크레덴자 끝·화분·기둥(1090..1236) + 유리 칸막이
kit.place(corridor, 40, kit.glass(kit.cols((78, 910), (1090, 1236), (2297, 2319))))
# 영업·고객 관리 구역 앞(월드 1080..1770): 지도·현황판(1236..1694) + 문이 설 영업석(1790..1944) + 라이선스 대장 캐비닛(2112..2190)
kit.place(corridor, 1080, kit.glass(kit.cols((1236, 1694), (1790, 1944), (2112, 2190))))
# 프로젝트룸 앞(월드 4282..5000): 칸막이·예약 패널·간트 보드(2297..2650) + 문이 설 빈 벽(2643..2655를 편 것) + 테이블 끝·삼각대·끝벽
kit.place(corridor, 4282, np.concatenate([kit.glass(np.concatenate([kit.cols((2297, 2650)), kit.strip(2643, 2655, 179),
                                                                     kit.cols((2966, 3122))], axis=1)), kit.cols((3122, 3152))], axis=1))
# 비상구 유도등(원본 2245..2291, 172..191행)을 계단 문 위에, 브로슈어 거치대(1706..1750, 216..294행)를 가운데 구역 벽에
kit.decor(corridor, (2245, 172, 2291, 191), 2974, 208)
kit.decor(corridor, (1706, 216, 1750, 294), 3240, 348)
kit.save(corridor, HERE + 'floor09-corridor.png')

# ---------------------------------------------------------------- 방 내부
END = (3122, 3152)                                                          # 오른쪽 끝벽(닫힌 방 끝)
# 사업 업무 공간(2676): 끝벽·블라인드 창·책상 두 줄(48..776), 빈 징두리 벽 31, 창·책상 칸(78..776) 뒤집은 것, 빈 벽 31, 창·책상 칸,
# 그리고 감사패 진열장·그림·크레덴자·화분·기둥(776..1236)과 끝벽.
wall_a = kit.strip(776, 784, 31)
office = np.concatenate([kit.cols((48, 776)), wall_a, kit.cols((78, 776, True)), wall_a, kit.cols((78, 776)),
                         kit.cols((776, 1236), END)], axis=1)
# 영업·고객 관리 구역(1846): 끝벽, 지도·현황판·복합기·영업석(1236..2020), 빈 벽 164, 영업석 칸(1752..2020) 뒤집은 것과 그대로,
# 팩스·라이선스 대장·전화 교환기 캐비닛과 유리 칸막이(2020..2322), 끝벽.
sales = np.concatenate([kit.cols((48, 78), (1236, 2020)), kit.strip(2012, 2024, 164),
                        kit.cols((1752, 2020, True), (1752, 2020), (2020, 2322), END)], axis=1)
# 프로젝트룸(1840): 유리 칸막이·예약 패널·간트 보드(2297..2652), 긴 테이블 칸 985(위는 빈 벽과 트랙 스폿, 아래는 테이블·의자
# 2420..2620을 번갈아 뒤집어 이음), 제안서·디스플레이·PTZ 카메라·테이블 끝·삼각대 카메라·끝벽(2652..3152).
SPLIT = 336                                                                 # 보드 아래, 벽 몰딩(343행) 위
fill_w = 985
# 빈 벽은 디스플레이와 삼각대 사이 벽(2968..3010)을 번갈아 뒤집어 잇고(질감 유지), 그 칸의 스폿 하나는 지운 뒤 120px마다 다시 단다.
upper = np.concatenate([kit.cols((2968, 3010, k % 2 == 1)) for k in range(fill_w // 42 + 1)], axis=1)[:SPLIT, :fill_w].copy()
upper[150:196] = kit.strip(3010, 3025, fill_w)[150:196]
spot = A[160:188, 2984:3008]
for x in range(50, fill_w - 24, 120):
    upper[160:188, x:x + 24] = np.where(spot[..., 3:] > 0, spot, upper[160:188, x:x + 24])
lower = np.concatenate([kit.cols((2420, 2620, k % 2 == 1)) for k in range(5)], axis=1)[SPLIT:, :fill_w]
project = np.concatenate([kit.cols((2297, 2652)), np.concatenate([upper, lower], axis=0), kit.cols((2652, 3152))], axis=1)
for name, block in (('office', office), ('sales', sales), ('project', project)):
    print(name, kit.save(block, HERE + f'floor09-{name}-interior.png'))

# ---------------------------------------------------------------- 문 스프라이트(닫힘 | 열림), 높이 210
WALNUT = (64, 44, 30)
door_sheet('double', 140, DOORS + 'door-office.png', colors=(WALNUT, (34, 40, 44), (168, 136, 82)))
door_sheet('glass', 110, DOORS + 'door-sales.png', colors=(WALNUT, (30, 38, 42), (92, 104, 108)))
door_sheet('wood', 120, DOORS + 'door-project.png', colors=(WALNUT, (50, 36, 28), (74, 54, 40)), accent=(210, 60, 52))
print('built 9F assets')
