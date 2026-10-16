# 4층 배경: 단면 에셋 floor04-rnd.png로 방 내부·천장·바닥과 공용 벽 모듈의 복도를 만든다. 문 그림은 assets/objects/floor04/를 쓴다.
# 실행: python assets/background/floor04/build.py (저장소 루트에서, Pillow·numpy). 공용 도구는 assets/background/cutaway_kit.py.
# 가로는 1:1, 벽 행 82..441만 늘려 월드 y=100..575에 둔다(원본 바닥선 y=438 → 월드 y=570). 건물 코어는 모든 층에서 같은 자리라
# 연구개발 업무 공간·개발자 업무 구역은 코어 왼쪽, 연구 회의실은 화장실 오른쪽에 둔다.
import sys

import numpy as np

sys.path.insert(0, 'assets/background')
from cutaway_kit import Cutaway  # noqa: E402
from cutaway_finish import finish_floor  # noqa: E402

HERE = 'assets/background/floor04/'
kit = Cutaway(HERE + 'floor04-rnd.png', seed=4)
A = kit.A
SPLIT = 312        # 연구 회의실 칸에서 윗벽(보드·출력물)과 아랫부분(테이블·의자)을 나누는 행: 보드 받침(≤310)과 의자 등받이(≥346) 사이



def tile(a, b, width):
    """A plain wall a..b tiled (every other copy mirrored) to width; kit.strip stretches each column into a band instead."""
    block = A[:, a:b]
    return np.concatenate([block, block[:, ::-1]] * (width // (2 * (b - a)) + 1), axis=1)[:, :width]


# ---------------------------------------------------------------- 방 내부
# 연구개발 업무 공간(2676): 원본 48..524(랙·시험 서버 책상) 다음에 책상·선반 칸(166..524)을 네 번(번갈아 뒤집어), 빈 벽·둘째 테이프 선반 222px,
# 원본 524..1000(테이프 카트·UPS 분배기·로그 판독기 책상·테이프 선반), 기둥 1000..1040, 뒤집은 끝벽 48..78.
# 빈 벽은 아래(200행부터)를 랙과 책상 사이 150..162에서, 위를 판독기 책상 위 빈 벽 722..750에서 뽑는다(왼쪽 위 케이블 다발을 피해서).
# 빈 벽 222px 대신: 빈 벽 49 + 둘째 테이프 선반(원본 874..998, 빛 받는 테이프는 옆 빈 칸으로 덮음) + 빈 벽 49.
def lab_wall(width):
    block = tile(152, 162, width)
    block[:200] = tile(722, 750, width)[:200]                # 위쪽은 왼쪽 케이블 다발이 없는 벽에서
    return block


shelf = kit.cols((874, 998))
shelf[:280] = lab_wall(124)[:280]                                # 선반 위 천장 CCTV는 원본에만
shelf[396:424, 46:72] = A[396:424, 950:976]                      # 원본 920..946의 빛 받는 테이프(단서)는 원본 선반에만 둔다
plain = np.concatenate([lab_wall(49), shelf, lab_wall(49)], axis=1)
lab = np.concatenate([kit.cols((48, 524), *[(166, 524, k % 2) for k in range(4)]), plain, kit.cols((524, 1040), (48, 78, True))], axis=1)
# 개발자 업무 구역(1846): 기둥 1000..1040 + 원본 1040..1656, 통로 60px, 앞줄 책상 한 칸(1124..1376), 통로 60px, 원본 1656..2474.
dev = np.concatenate([kit.cols((1000, 1656)), tile(1640, 1668, 60), kit.cols((1124, 1376)), tile(1640, 1668, 60),
                      kit.cols((1656, 2474))], axis=1)


# 연구 회의실(1840): 칸막이 2462 ~ 디스플레이 뒤 3044, 그 뒤에 늘린 구간 1150px, 플립차트·끝벽 3044..3152.
# 늘린 구간 = 빈 패널벽 60 + 둘째 회의 테이블(테이블 왼쪽 2524..2728과 그 뒤집은 것, 위쪽은 빈 패널벽) + 빈 패널벽 682.
def wall_only(width):
    # 디스플레이와 플립차트 사이의 빈 패널벽·민트 띠·바닥(3036..3045, 이음매 없는 칸)을 깔고, 천장은 끝벽 옆 3104..3120(배관 고정쇠
    # 없음)에서, 패널 이음매(원본 3046 열)는 120px마다 다시 넣는다.
    block = tile(3036, 3045, width)
    block[:176] = tile(3104, 3120, width)[:176]
    block[176:438, 60::120] = A[176:438, 3046:3047]
    return block


def second_table():
    lower = kit.cols((2524, 2728), (2524, 2728, True))
    block = wall_only(lower.shape[1])
    block[SPLIT:] = lower[SPLIT:]
    block[SPLIT:438, :, :3] = (block[SPLIT:438, :, :3] * .8).astype(np.uint8)   # 원본 2524..2728 아랫벽이 빈 패널벽보다 밝아 맞춘다
    # 윗벽에는 출력물 윗줄(원본 2776..2850, 204..252행: 붉은 표시 없는 두 장)을 가운데에 한 번
    x = (block.shape[1] - 74) // 2
    block[204:252, x:x + 74] = A[204:252, 2776:2850]
    return block


extra = np.concatenate([wall_only(60), second_table(), wall_only(682)], axis=1)
for x in (540, 1010):                                     # 빈 벽에도 출력물 한 쌍씩(출구 문 자리 1345..1465 위는 비운다)
    extra[204:252, x:x + 74] = A[204:252, 2776:2850]
meeting = np.concatenate([kit.cols((2462, 3044)), extra, kit.cols((3044, 3152))], axis=1)

finish_floor(HERE, {
    'lab': (lab, (66, 82, 84), (40, 62, 62)),
    'dev': (dev, (94, 100, 100), (60, 74, 72)),
    'meeting': (meeting, (82, 92, 92), (44, 68, 64)),
})

print('built 4F assets')
