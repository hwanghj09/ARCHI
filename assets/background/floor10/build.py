# 10층 배경: 단면 에셋 floor10-management.png로 방 내부·천장·바닥과 공용 벽 모듈의 복도를 만든다. 문은 4층 그림을 재사용한다.
# 실행: python assets/background/floor10/build.py (저장소 루트에서, Pillow·numpy).
# 가로는 1:1, 벽 행 82..441만 늘려 월드 y=100..575에 둔다(원본 바닥선 y=438 → 월드 y=570). 건물 코어는 모든 층에서 같은
# 자리라 경영관리 사무실·임원 회의실은 코어 왼쪽, 임원실은 화장실 오른쪽이다. 사무실·회의실은 유리 뒤로 일부 보이고 임원실은 벽으로 가린다.
import sys
sys.path.insert(0, 'assets/background')
import numpy as np
from PIL import Image, ImageDraw
from cutaway_kit import Cutaway  # noqa: E402
from cutaway_finish import finish_floor  # noqa: E402

HERE = 'assets/background/floor10/'
kit = Cutaway(HERE + 'floor10-management.png', seed=10)

# 공용 유리벽 뒤 그림은 기존 복도의 방별 조합을 재사용한다. 임원실은 불투명 벽이다.
kit.save(kit.cols((78, 96), (80, 82), (320, 1300)), HERE + 'behind-a.png')
kit.save(kit.cols((1590, 2280)), HERE + 'behind-b.png')

# ---------------------------------------------------------------- 방 내부
# 경영관리 사무실(2678): 원본 78..810(캐비닛·진열장·창 아래 첫 책상)에 창 두 개와 책상 한 줄 칸(446..810)을 네 번(번갈아
# 뒤집어) 끼우고, 원본 810..1300(회계·재무팀장 책상, 결산 보드, 세단기, 금고, 유리 칸막이).
office = kit.cols((78, 810), *[(446, 810, k % 2 == 1) for k in range(4)], (810, 1300))
# 임원 회의실(1844): 유리 칸막이·블랙아웃 창 1276..1590, 창과 의자 두 개 칸(1318..1590, 왼쪽 테이블 끝은 테이블 가운데로
# 덮음)을 세 번, 그리고 미디어 월·상석·크레덴자·원목 칸막이 1590..2304.
bay = kit.cols((1318, 1590)).copy()
bay[355:438, 0:28] = kit.A[355:438, 1352:1380]
meeting = np.concatenate([kit.cols((1276, 1590)), bay, bay[:, ::-1], bay, kit.cols((1590, 2304))], axis=1)
# 임원실(1822): 원목 칸막이 2280..2308, 입구 쪽 빈 벽 250(출구 문 자리), 비서 데스크~드레이프 2308..2904, 빈 벽과 유리문 책장
# 칸(2904..3120) 두 번(한 번은 뒤집음), 그리고 원래 책장과 끝벽 2904..3152. 빈 벽은 드레이프와 책장 사이 원본 2904..2906 열을 편 것
# (바닥과 슬래브는 원본 마루를 이어 붙인다).


def plain(width):
    """Plain wall: the column strip 2904..2906 stretched for the wall, the wood floor and slab below it tiled (mirrored) from
    under the executive desk area 2620..2840 so the floor keeps its grain."""
    block = kit.strip(2904, 2906, width).copy()
    floor = kit.A[438:, 2620:2840]
    tiled = np.concatenate([floor, floor[:, ::-1]] * (width // 440 + 1), axis=1)[:, :width]
    block[438:] = tiled
    return block


shelf = kit.cols((2904, 3120))
executive = np.concatenate([kit.cols((2280, 2308)), plain(250), kit.cols((2308, 2904)), plain(90), shelf, plain(70),
                            shelf[:, ::-1], plain(108), kit.cols((2904, 3152))], axis=1)
finish_floor(HERE, {
    'office': (office, (78, 90, 84), (50, 72, 62)),
    'meeting': (meeting, (52, 68, 62), (60, 72, 50)),
    'executive': (executive, (72, 60, 48), (86, 66, 42)),
})
# 원본의 벽과 몰딩을 덜어 내고 시계만 새 복도 조사 범위에 맞춰 옮긴다.
clock = Image.fromarray(kit.A[164:188, 1108:1136])
mask = Image.new('L', clock.size)
ImageDraw.Draw(mask).ellipse((2, 4, 27, 23), fill=255)
clock.putalpha(mask)
with Image.open(HERE + 'walls.png') as walls:
    corridor = walls.copy()
corridor.alpha_composite(clock.resize((40, 32), Image.Resampling.LANCZOS), (3330, 266))
corridor.save(HERE + 'walls.png')
print('built 10F assets')
