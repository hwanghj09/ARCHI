# 5층 배경: 단면 에셋 floor05-research.png로 방 내부·천장·바닥·복도·이동식 발판을 만든다. 문 그림은 assets/objects/floor05/를 쓴다.
# 실행: python assets/background/floor05/build.py (저장소 루트에서, Pillow·numpy).
# 가로는 1:1, 벽 행 82..441만 늘려 월드 y=100..575에 둔다(원본 바닥선 y=438 → 월드 y=570). 건물 코어는 모든 층에서 같은
# 자리라 연구개발실·기술연구실은 코어 왼쪽, 회의실은 화장실 오른쪽에 두고, 복도에는 방 앞 유리 너머로 방 그림 일부를 보인다.
# 장치(밀어서 옮기는 발판)는 그림 속 자리에 고정된 발판(원본 1070..1114)을 지우고, 게임 쪽 충돌체(movables)에 따로 그린
# floor05-step.png를 입힌다. 가장 높은 서가(원본 1155..1259, 186px)는 방 안 오른쪽 끝벽에 붙여 둔다.
import sys
sys.path.insert(0, 'assets/background')
import numpy as np
from PIL import Image, ImageDraw
from cutaway_kit import Cutaway  # noqa: E402
from cutaway_finish import finish_floor  # noqa: E402

HERE = 'assets/background/floor05/'
kit = Cutaway(HERE + 'floor05-research.png', seed=5)
A = kit.A
# 그림 속 이동식 발판(원본 1064..1122, 395..438행)을 지운다: 가운데 서가 맨 아래 칸을 같은 구조인 왼쪽 서가(110px 왼쪽)로 덮는다.
A[395:438, 1064:1122] = A[395:438, 954:1012]


def panels(width):
    """Plain perforated acoustic wall of the security lab (no objects), for widening it: the clean panel 2019..2106 above the
    chair rail (rows 0..344), the same panel's dotted rows 256..340 again below the rail, and the baseboard and slab from the
    gap between the cabinet and the desk (1400..1414)."""
    tile = np.concatenate([A[0:344, 2019:2106], ], axis=1)
    lower = A[256:340, 2019:2106]
    panel = np.concatenate([tile, lower], axis=0)                     # rows 0..428
    reps = width // panel.shape[1] + 1
    block = np.zeros((kit.H, width, 4), np.uint8)
    block[:428] = np.concatenate([panel] * reps, axis=1)[:, :width]
    block[428:] = kit.strip(1400, 1414, width)[428:]
    return block


def slate(width):
    """Plain slate wall of the R&D room (no objects): the ceiling and plenum right of the window (884..930, rows 0..180,
    mirrored in turns so the seams meet), the wall between the tallest shelf and the badge reader (1262..1267) coloured row by
    row from the suspended ceiling down to the floor line, and the floor slab tiled from 420..1040."""
    top = A[:180, 884:930]
    block = np.zeros((kit.H, width, 4), np.uint8)
    block[:180] = np.concatenate([top, top[:, ::-1]] * (width // 92 + 1), axis=1)[:, :width]
    profile = np.median(A[180:438, 1262:1267].astype(int), axis=1)             # 행별 벽색(황동 허리 띠 포함)
    wall = profile[:, None, :] + np.random.default_rng(5).integers(-2, 3, (258, width, 1)) * np.array([1, 1, 1, 0])  # 벽색만 흔들고 불투명도는 유지
    block[180:438] = np.clip(wall, 0, 255).astype(np.uint8)
    slab = A[438:, 420:1040]
    block[438:] = np.concatenate([slab, slab[:, ::-1]] * (width // 1240 + 1), axis=1)[:, :width]
    return block


# ---------------------------------------------------------------- 방 내부
# 연구개발실(2676): 원본 48..880(끝벽, 루버 창 아래 책상 두 줄)에 창 두 칸과 책상 한 줄 칸(476..880)을 세 번(번갈아 뒤집어)
# 끼우고, 자료 카트 880..932, 빈 슬레이트 벽 226, 서가 셋 932..1262, 칸막이 1 1290..1314.
# 가장 높은 서가(원본 1155..1259)는 월드 2545..2649, 오른쪽 경계(2644) 바로 앞이다.
rnd = np.concatenate([kit.cols((48, 880), (476, 880, True), (476, 880), (476, 880, True), (880, 932)),
                      slate(226), kit.cols((932, 1262), (1290, 1314))], axis=1)
# 기술연구실(1846): 칸막이 1, 보안 캐비닛, 빈 흡음 벽 328(출구 문 자리), 워크스테이션 칸 1402..1752, 빈 벽 176, 감사 로그
# 프린터·콘솔 작업대 1752..2108, 랙 두 대 칸(2108..2232) 네 번, 칸막이 2.
security = np.concatenate([kit.cols((1290, 1402)), panels(328), kit.cols((1402, 1752)), panels(176),
                           kit.cols((1752, 2108), *[(2108, 2232)] * 4, (2232, 2260))], axis=1)
# 회의실(1808): 칸막이 2·결과판·꺼진 디스플레이·회의 테이블 2232..2786, 의자 한 개 칸 74px를 열두 번(번갈아 뒤집어; 위쪽은
# 빈 목재 루버 2900..2974, 아래쪽은 테이블과 의자 2712..2786), 시계·의자·기록 보관함·끝벽 2786..3152.
chair = np.concatenate([A[:340, 2900:2974], A[340:, 2712:2786]], axis=0)
meeting = np.concatenate([kit.cols((2232, 2786)), *[chair[:, ::-1] if k % 2 else chair for k in range(12)],
                          kit.cols((2786, 3152))], axis=1)
# 퍼즐 서가까지 늘리면 발판에서 뛰어도 닿지 않으므로, 공책과 서가만 기존 1:1 크기로 다시 붙인다.
shelf = Image.new('RGBA', (330, 194))
for x0, x1, y0 in ((932, 1155, 266), (1155, 1259, 252), (1160, 1186, 238), (1200, 1230, 246)):
    shelf.paste(Image.fromarray(A[y0:424, x0:x1]), (x0 - 932, y0 - 230))
rnd[230:438, 2322:2652] = slate(330)[230:438]
# 방 안 출구 문 자리(cutaway_kit.door_bay): 복도에서 보이는 이 방 앞벽(같은 벽 모듈) 칸을 방 끝(끝벽 30px 안) 또는 빈 벽 자리에
# 끼워 출구 문을 그 벽에 세우고 양옆 96px은 빈 벽으로 둔다. 칸 폭(문 폭 + 192)만큼 오른쪽이 밀린다(방 설정 exitBay). 복도 문은 그대로다.
BAYS = {
    'rnd': (30, 240, 'wall-glass-mixed'),
    'security': (30, 130, 'wall-concrete'),
    'meeting': (1778, 130, 'wall-frosted'),
}
finish_floor(HERE, {
    'rnd': (rnd, (62, 66, 74), (78, 66, 46)),
    'security': (security, (80, 88, 94), (50, 64, 70)),
    'meeting': (meeting, (76, 66, 52), (86, 68, 42)),
}, BAYS)
with Image.open(HERE + 'floor05-rnd-interior.png') as wall:
    interior = wall.copy()
interior.alpha_composite(shelf, (2322, 262))  # 원본 top 132 + 행 230 - 새 벽 top 100
interior.save(HERE + 'floor05-rnd-interior.png')

# ---------------------------------------------------------------- 이동식 발판(84×76): 바퀴 달린 강철 2단 발판, 황동 디딤 테
W, H = 84, 76
step = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(step)
d.rectangle([1, 0, W - 2, 64], fill=(18, 20, 24, 255))                     # 외곽선
d.rectangle([3, 2, W - 4, 62], fill=(66, 72, 80, 255))                     # 몸통
d.rectangle([3, 2, W - 4, 9], fill=(34, 36, 40, 255))                      # 고무 디딤판
d.line([3, 10, W - 4, 10], fill=(164, 136, 74, 255), width=2)              # 황동 테
d.rectangle([3, 34, W - 4, 40], fill=(34, 36, 40, 255))                    # 아래 디딤
d.line([3, 41, W - 4, 41], fill=(150, 124, 66, 255), width=2)
d.rounded_rectangle([W // 2 - 14, 16, W // 2 + 14, 26], 4, fill=(22, 24, 28, 255))   # 손잡이 구멍
d.line([4, 12, 4, 61], fill=(104, 112, 120, 255))                          # 왼쪽 모서리 빛
d.rectangle([3, 52, W - 4, 62], fill=(48, 52, 58, 255))                    # 걷어차는 판
for x in (12, W - 13):                                                     # 바퀴
    d.rectangle([x - 2, 62, x + 2, 66], fill=(30, 32, 36, 255))
    d.ellipse([x - 6, 64, x + 6, 75], fill=(14, 15, 18, 255), outline=(96, 102, 110, 255))
    d.ellipse([x - 2, 68, x + 2, 72], fill=(120, 126, 132, 255))
step.save(HERE + 'floor05-step.png')
print('built 5F assets')
