# 3층 배경: 단면 에셋의 방 내부 3장·천장·바닥과 공용 벽 모듈의 복도를 만든다. 문 그림은 assets/objects/floor03/을 쓴다.
# 실행: python assets/background/floor03/build.py (저장소 루트에서, Pillow·numpy).
# 가로는 1:1, 벽 행 82..441만 늘려 월드 y=100..575에 둔다(원본 바닥선 y=438 → 월드 y=570). 건물 코어는 모든 층에서 같은 자리라
# 복도에는 방 앞 유리 너머로 방 그림의 일부만 보이고(Fitness Club·고객만족센터는 코어 왼쪽, Studio는 화장실 오른쪽), 방 안에는 방 그림
# 전체를 반복 칸으로 넓혀 쓴다. Fitness Club 안은 그림 속 유리 자동문(기둥 1176..1228)을 가운데로 옮겨 안쪽 유산소·GX 구역과
# 바깥 웨이트·사물함·트레이너 카운터 구역을 나누고, 카운터의 배터리 비상 개방 버튼과 자동문 사이를 약 1300px로 벌린다.
import sys
sys.path.insert(0, 'assets/background')
import numpy as np
from cutaway_kit import Cutaway
from cutaway_finish import finish_floor

HERE = 'assets/background/floor03/'
kit = Cutaway(HERE + 'floor03-welfare.png', seed=3)
A = kit.A
H = kit.H


def tile(a, b, rows, width):
    """Source columns a..b of the given rows tiled side by side (no stretching) to width."""
    block = A[rows[0]:rows[1], a:b]
    return np.concatenate([block] * (width // (b - a) + 1), axis=1)[:, :width]


def stack(*parts):
    """Rows stacked top to bottom into one full-height column block: parts = (block for rows y0..y1)."""
    return np.concatenate(parts, axis=0)


# ---------------------------------------------------------------- Fitness Club 조각
def flip_tile(a, b, rows, width):
    """Like tile(), but every other copy is mirrored so a soft left-right light falloff does not show seams."""
    block = A[rows[0]:rows[1], a:b]
    return np.concatenate([block, block[:, ::-1]] * (width // (2 * (b - a)) + 1), axis=1)[:, :width]


def profile(a, b, rows, width):
    """A plain painted wall from the per-row median colour of columns a..b, with fine per-pixel grain."""
    base = np.median(A[rows[0]:rows[1], a:b].astype(int), axis=1)[:, None, :]
    grain = kit.rng.integers(-2, 3, (rows[1] - rows[0], width, 1))
    return np.clip(base + grain * np.array([1, 1, 1, 0]), 0, 255).astype(np.uint8)


FLOOR_ROWS = (438, H)


def gym_wall(width):
    """Plain gym bay: exposed ceiling, duct and clerestory (rows 0..180, one mullion period 797..972), the clean brown wall
    above the mat bin (872..950, rows 180..350), the wall foot from the clean column 866..870 and the rubber floor."""
    return stack(tile(797, 972, (0, 180), width), flip_tile(872, 950, (180, 350), width), profile(866, 870, (350, 438), width),
                 flip_tile(600, 800, FLOOR_ROWS, width))


def gx_mirror(width):
    """Open GX mirror bay without machines: ceiling tiled, the clean upper mirror 104..300 (rows 180..294) and below it the
    mirror strip between the two treadmills (298..312) tiled, then the floor."""
    upper = A[180:294, 104:104 + width]
    lower = flip_tile(298, 312, (294, 438), width).astype(float)
    # the strip between the treadmills is a little lighter than the open mirror above: match its top rows to the mirror's foot
    gain = upper[-6:, :, :3].reshape(-1, 3).mean(axis=0) / lower[:6, :, :3].reshape(-1, 3).mean(axis=0)
    lower[:128, :, :3] *= gain
    return stack(tile(797, 972, (0, 180), width), upper, np.clip(lower, 0, 255).astype(np.uint8),
                 flip_tile(600, 800, FLOOR_ROWS, width))


LEFT_END = A[:, 48:78]
RIGHT_END = A[:, 48:78][:, ::-1]
DOOR = A[:, 1176:1228].copy()                # 기둥 + 유리 자동문 단면(센서 1212..1228), 유리는 조각 안 36..52
DOOR[438:] = flip_tile(600, 800, FLOOR_ROWS, 52)   # 원본 기둥 밑 슬래브의 홈은 지운다
inner = np.concatenate([kit.cols((48, 316)), *[kit.cols((104, 316)) for _ in range(3)], kit.cols((316, 510)),
                        gx_mirror(196)], axis=1)
outer = np.concatenate([kit.cols((510, 1088)), gym_wall(246), kit.cols((960, 1088, True)), gym_wall(260),
                        kit.cols((1088, 1176))], axis=1)
gym = np.concatenate([inner, DOOR, outer, RIGHT_END], axis=1)
door_x = inner.shape[1]
counter_x = door_x + DOOR.shape[1] + outer.shape[1] - 88
# 안쪽 퇴실 버튼: 카운터의 초록 비상 개방 버튼(1154..1170, 292..313)을 GX 거울 구역의 같은 높이에 옮겨 단다.
exit_button_x = door_x - 108
gym[292:313, exit_button_x:exit_button_x + 16] = A[292:313, 1154:1170]
print('gym', gym.shape[1], 'door chunk', door_x, 'glass', door_x + 36, 'counter', counter_x, 'button', counter_x + 66,
      'exit button', exit_button_x)

# ---------------------------------------------------------------- 고객만족센터: 원본 1226..2236. 위(0..318행)와 아래(318..행)를 따로
# 넓힌다. 위는 흡음 클라우드 한 칸(1488..1736)을 세 번 + 빈 벽을 1488 자리에, 아래는 상담석 한 자리(1758..1851)를 여덟 번 1851 자리에.
SPLIT = 318
FILL = 744
up_fill = stack(tile(1488, 1736, (0, 185), FILL), flip_tile(1440, 1496, (185, SPLIT), FILL))
upper = np.concatenate([A[:SPLIT, 1226:1488], up_fill, A[:SPLIT, 1488:2236]], axis=1)
lower = np.concatenate([A[SPLIT:, 1226:1851], *[A[SPLIT:, 1758:1851] for _ in range(8)], A[SPLIT:, 1851:2236]], axis=1)
cs = np.concatenate([LEFT_END, stack(upper, lower), A[:, 1180:1212], RIGHT_END], axis=1)     # 오른쪽 끝: 기둥 + 끝벽
print('cs', cs.shape[1])

# ---------------------------------------------------------------- Studio: 기둥·암막 커튼(2236..2316) 다음에 쐐기형 흡음재 벽(24px 주기)을
# 924px 끼우고(가운데에 하드 케이스 더미 한 벌을 뒤집어 세움), 원본 2316..3152(제작 데스크~끝벽).
FOAM = 924
foam = np.zeros((H, FOAM, 4), np.uint8)
foam[:130] = tile(2340, 2364, (0, 130), FOAM)         # 슬래브와 그 밑 그늘진 첫 단
band = A[130:322, 2340:2364]                          # 쐐기 8단(24px × 24px 주기), 데스크·커튼 레일과 겹치지 않는 열
foam[130:438] = np.concatenate([band, band], axis=0)[:308][:, np.arange(FOAM) % 24]
foam[438:] = tile(2316, 2340, (438, H), FOAM)
case_x = 520
foam[312:438, case_x:case_x + 86] = A[312:438, 3026:3112][:, ::-1]
studio = np.concatenate([A[:, 2236:2316], foam, A[:, 2316:3152]], axis=1)
print('studio', studio.shape[1])

finish_floor(HERE, {
    'gym': (gym, (44, 47, 45), (72, 60, 48)),
    'cs': (cs, (94, 100, 100), (60, 68, 70)),
    'studio': (studio, (30, 32, 36), (18, 20, 24)),
})
print('built 3F assets')
