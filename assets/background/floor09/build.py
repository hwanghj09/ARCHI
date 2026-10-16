# 9층 배경: 단면 에셋 floor09-business.png로 방 내부·천장·바닥과 공용 벽 모듈의 복도를 만든다. 문은 4층 그림을 재사용한다.
# 실행: python assets/background/floor09/build.py (저장소 루트에서, Pillow·numpy). 공용 도구는 assets/background/cutaway_kit.py.
# 가로는 1:1, 벽 행 82..441만 늘려 월드 y=100..575에 둔다(원본 바닥선 y=438 → 월드 y=570). 건물 코어는 모든 층에서 같은 자리라
# 사업 업무 공간·영업·고객 관리 구역은 코어 왼쪽, 프로젝트룸은 화장실 오른쪽에서 유리 너머로 보이고, 방 안에는 방 그림 전체를
# 반복 칸으로 넓혀 쓴다. 복도 문은 그림의 중요한 물건(감사패 진열장·지도·현황판·라이선스 대장·간트 보드)을 가리지 않는 자리에 둔다.
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, 'assets/background')
from cutaway_kit import Cutaway  # noqa: E402
from cutaway_finish import finish_floor  # noqa: E402

HERE = 'assets/background/floor09/'
kit = Cutaway(HERE + 'floor09-business.png', seed=9)
A = kit.A

# 공용 유리벽 뒤 그림은 기존 복도의 방별 조합을 재사용한다.
kit.save(kit.cols((78, 910), (1090, 1236), (2297, 2319)), HERE + 'behind-a.png')
kit.save(kit.cols((1236, 1694), (1790, 1944), (2112, 2190)), HERE + 'behind-b.png')
kit.save(np.concatenate([kit.cols((2297, 2650)), kit.strip(2643, 2655, 179), kit.cols((2966, 3122))], axis=1), HERE + 'behind-c.png')

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
finish_floor(HERE, {
    'office': (office, (88, 78, 72), (88, 66, 46)),
    'sales': (sales, (90, 86, 80), (76, 68, 52)),
    'project': (project, (68, 64, 68), (72, 54, 58)),
})
# 브로슈어 거치대도 조사 범위와 같은 위치·크기로 새 복도에 붙인다.
brochure = Image.fromarray(A[216:294, 1706:1750]).resize((44, 103), Image.Resampling.LANCZOS)
with Image.open(HERE + 'walls.png') as walls:
    corridor = walls.copy()
corridor.alpha_composite(brochure, (3240, 277))
corridor.save(HERE + 'walls.png')
print('built 9F assets')
