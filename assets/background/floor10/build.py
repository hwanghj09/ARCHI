# 10층 배경: 사용자가 준 단면 에셋 floor10-management.png(3200×556, PROMPT.md)로 방 내부 3장을
# 만든다. # 복도 벽과 문은 이 파일이 만들지 않는다: 복도는 walls-layout.json + assets/background/wall/compose_floor.py(→ walls.png), 문은 assets/objects/floor{n}/source → door-*.png(archi-floor-walls, archi-floor-doors). 실행: python assets/background/floor10/build.py (저장소 루트에서, Pillow·numpy).
# 에셋은 플레이어 162px = 175cm 기준이라 1:1로 쓴다(원본 바닥선 y=438 → 월드 y=570, top=132). 건물 코어는 모든 층에서 같은
# 자리라 경영관리 사무실·임원 회의실은 코어 왼쪽, 임원실은 화장실 오른쪽에 두고, 복도에는 방 앞 유리 너머로 방 그림 일부를 보인다.
import sys
sys.path.insert(0, 'assets/background')
import numpy as np
from cutaway_kit import Cutaway  # noqa: E402

HERE = 'assets/background/floor10/'
kit = Cutaway(HERE + 'floor10-management.png', seed=10)


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
for name, block in (('office', office), ('meeting', meeting), ('executive', executive)):
    print(name, kit.save(block, HERE + f'floor10-{name}-interior.png'))

print('built 10F assets')
