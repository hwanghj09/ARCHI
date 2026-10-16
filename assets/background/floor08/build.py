# 8층 배경: 단면 에셋 floor08-qa-planning.png로 방 내부·천장·바닥과 공용 벽 모듈의 복도를 만든다. 문은 다른 층의 그림을 재사용한다.
# 실행: python assets/background/floor08/build.py (저장소 루트에서, Pillow·numpy).
# 가로는 1:1, 벽 행 82..441만 늘려 월드 y=100..575에 둔다(원본 바닥선 y=438 → 월드 y=570). 건물 코어는 모든 층에서 같은
# 자리라 QA 시험실·제품기획 업무 공간은 코어 왼쪽, 공용 제품 회의실은 화장실 오른쪽이다. 방 안은 원본 그림을 반복 칸으로 넓히고
# (양 끝은 원본 끝벽 48..78 / 3122..3152), 복도는 QA실을 흰 벽으로 가리고 나머지 방은 유리벽 뒤로 일부만 보인다.
import sys

sys.path.insert(0, 'assets/background')
import numpy as np
from PIL import Image
from cutaway_kit import Cutaway
from cutaway_finish import finish_floor

HERE = 'assets/background/floor08/'
kit = Cutaway(HERE + 'floor08-qa-planning.png', seed=8)
A = kit.A
LEFT_CAP, RIGHT_CAP = (48, 78), (3122, 3152)

# 유리 구간 뒤 그림은 원본에서 잘라 공용 복도 합성기에 넘긴다.
kit.save(A[:, 1324:1990], HERE + 'behind-b.png')
kit.save(A[:, 2364:3052], HERE + 'behind-c.png')

# ---------------------------------------------------------------- 방 내부
# QA 시험실(2722): 원본 48..1300에 시험석 칸(710..1190)을 1190 자리에 세 번 끼운다. 480 = 시험석 간격 96 × 5 = 거푸집 이음매
# 120 × 4 = 천장 행거 240 × 2이고, 양 끝(710·1190)이 LED 등 사이 빈자리라 이음매가 보이지 않는다. 오른쪽 칸막이 문 대신 끝벽.
qa = kit.cols((48, 1190), *[(710, 1190)] * 3, (1190, 1300), RIGHT_CAP)

# 제품기획 업무 공간(1856): 끝벽 + 원본 1324..1762(창·책상 둘) + 같은 칸을 1762에서 1372까지 뒤집은 것 + 원본 1372..2340 + 끝벽.
# 뒤집은 칸과 그 뒤 원본은 비상구 유도등을 지운 사본에서 가져온다(유도등은 첫 칸에 한 번만).
clean = A.copy()
clean[176:200, 1372:1382] = A[176:200, 1390:1400]
plan = np.concatenate([A[:, LEFT_CAP[0]:LEFT_CAP[1]], A[:, 1324:1762], clean[:, 1372:1762][:, ::-1], clean[:, 1372:2340],
                       A[:, RIGHT_CAP[0]:RIGHT_CAP[1]]], axis=1)

# 공용 제품 회의실(1826): 끝벽 + 원본 2364..3152. 회의 테이블을 늘리는 칸은 아래 띠(338행 아래: 테이블·의자·서류)와 위 띠(펠트 흡음
# 타일, 36px 간격)를 따로 만든다. 위 띠는 화면·링 조명이 없는 타일 벽 한 칸(2976..3012)을 타일 위상에 맞춰 깔고, 아래 띠는 의자가
# 잘리지 않는 칸(2748..2856: 서류·의자·꺼진 노트북, 2856..2964: 서류·옆 의자·머그)을 번갈아 아홉 번, 그리고 2941..2977(머그) 한 번.
SPLIT, CEILING = 338, 174


def bay(lo, hi, phase_from):
    """Columns lo..hi below SPLIT; above it felt tiles at the tile phase of phase_from (36px tiles)."""
    block = A[:, lo:hi].copy()
    tiles = A[:SPLIT, 2976:3012]
    for k in range(hi - lo):
        block[:SPLIT, k] = tiles[:, (phase_from + k - 2976) % 36]
        block[:CEILING, k] = A[:CEILING, 2700 + (phase_from + k - 2700) % 240]   # 천장: 행거·브래킷 240px 간격
    return block


meet = np.concatenate([A[:, LEFT_CAP[0]:LEFT_CAP[1]], A[:, 2364:2941], bay(2941, 2977, 2941), A[:, 2941:2964],
                       *[bay(*((2748, 2856) if k % 2 == 0 else (2856, 2964)), 2964 + 108 * k) for k in range(9)],
                       A[:, 2964:RIGHT_CAP[1]]], axis=1)

finish_floor(HERE, {
    'qa': (qa, (82, 88, 90), (78, 74, 42)),
    'planning': (plan, (88, 96, 100), (58, 74, 80)),
    'meeting': (meet, (76, 82, 84), (82, 76, 46)),
})
# 예전 벽색이 남지 않게 신호등만 원본에서 옮긴다.
signal = A[250:438, 344:369].copy()
mask = np.abs(signal[..., :3].astype(int) - A[250:438, 372:373, :3].astype(int)).sum(2) > 40
signal[..., 3] = np.where(mask, 255, 0)
light = Image.fromarray(signal).resize((25, 248), Image.Resampling.LANCZOS)
with Image.open(HERE + 'walls.png') as walls:
    corridor = walls.copy()
corridor.alpha_composite(light, (3295, 322))
corridor.save(HERE + 'walls.png')
print('built 8F assets')
