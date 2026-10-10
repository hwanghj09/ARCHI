# 6층 배경: 사용자가 준 단면 에셋 floor06-tech-division.png(3200×556, PROMPT.md)로 복도 1장, 방 내부 3장, 문 스프라이트 3장을
# 만든다. 실행: python assets/background/floor06/build.py (저장소 루트에서, Pillow·numpy).
# 에셋은 플레이어 162px = 175cm 기준이라 1:1로 쓴다(원본 바닥선 y=438 → 월드 y=570, top=132). 건물 코어는 모든 층에서 같은
# 자리라 기술 개발 업무 공간·공용 엔지니어링 구역은 코어 왼쪽, 기술 회의실은 화장실 오른쪽에 둔다. 방 안 폭은 복도 전면 폭의
# 약 2.68배(1000/690/680 → 2676/1846/1840).
import sys
sys.path.insert(0, 'assets/background')
import numpy as np
from cutaway_kit import Cutaway

HERE = 'assets/background/floor06/'
kit = Cutaway(HERE + 'floor06-tech-division.png', seed=6)
A = kit.A

# ---------------------------------------------------------------- 깨끗한 반복 칸
# 업무 공간 책상 칸(512..936: 서류장 책상 한 줄, 칸막이 틈 가운데에서 가운데까지). 포스트잇 붙은 모니터(599..631, 332..346)는
# 단서 물건이라 반복 칸에서는 같은 칸 오른쪽 모니터의 빈 화면으로 덮는다.
desk_bay = A[:, 512:936].copy()
desk_bay[332:346, 599 - 512:631 - 512] = A[340:354, 779:811]
# 칸 왼쪽 끝(512..600)은 켜진 비상 형광등(450..560)의 반쪽과 빛 웅덩이가 걸린다. 같은 구조의 셋째 칸(936..1024)과 열별 밝기를
# 비교해 빛을 걷어 내고, 반쪽 등기구는 꺼진 등기구(750..860)의 오른쪽 반으로 바꾼다. 반복 칸에는 켜진 등이 없다.
def smooth(values, k=15):
    return np.convolve(np.pad(values, k // 2, mode='edge'), np.ones(k) / k, mode='valid')


for r0, r1 in ((82, 240), (240, 330), (330, 438)):          # 천장·창 / 서류장 / 책상 아래, 띠마다 따로
    lum = A[r0:r1, :, :3].astype(float).mean(axis=(0, 2))
    ratio = smooth(np.clip(smooth(lum[936:1096]) / smooth(lum[512:672]), .3, 1))[:140]
    lit = desk_bay[r0:r1, :140, :3].astype(float) * ratio[None, :, None]
    desk_bay[r0:r1, :140, :3] = np.clip(lit, 0, 255).astype(np.uint8)
desk_bay[140:180, 0:48] = A[140:180, 812:860]
# 회의실 테이블 끝 칸(2862..3030): 테이블·의자·머그잔. 꺼진 디스플레이와 카메라 바(186..306행)는 빈 벽(3030..3038)으로 덮는다.
table_bay = A[:, 2862:3030].copy()
table_bay[186:306] = np.repeat(A[186:306, 3030:3038], 21, axis=1)[:, :168]
table_disp = A[:, 2862:3030]
# 회의실 빈 벽: 천장은 등기구 없는 열(2920..2928), 벽·바닥은 디스플레이와 캐비닛 사이 빈 열(3030..3038).
# 3030 열은 꺼진 등기구(2960..3070, 146..172행) 한가운데라, 빈 벽에 맞닿는 양쪽(마지막 테이블 칸 끝, 캐비닛 쪽 시작)의 반쪽 등기구도 지운다.
CLEAN_CEILING = A[:186, 2920:2928]


def meeting_wall(width):
    column = np.concatenate([CLEAN_CEILING, A[186:, 3030:3038]], axis=0)
    return np.repeat(column, width // 8 + 1, axis=1)[:, :width]


def no_troffer(block, x0, x1):
    block = block.copy()
    block[140:176, x0:x1] = np.repeat(CLEAN_CEILING[140:176], (x1 - x0) // 8 + 1, axis=1)[:, :x1 - x0]
    return block


def flip(block, mirrored):
    return block[:, ::-1] if mirrored else block


# 복도·문은 이 스크립트가 만들지 않는다: 복도는 assets/background/wall 모듈로 합성한 walls.png(walls-layout.json, archi-floor-walls),
# 문 그림은 assets/objects/floorNN/(archi-floor-doors).

# ---------------------------------------------------------------- 방 내부
# 기술 개발 업무 공간(2676): 원본 48..936, 깨끗한 책상 칸 세 번(뒤집기·그대로·뒤집기, 칸막이 틈 가운데끼리 맞닿는다), 칸막이 틈 74px, 원본 936..1378(기둥까지)
gap = np.repeat(desk_bay[:, 2:10], 10, axis=1)[:, :74]          # 칸막이 틈(칸 첫 열들)을 편 것
work = np.concatenate([kit.cols((48, 936)), flip(desk_bay, True), desk_bay, flip(desk_bay, True), gap, kit.cols((936, 1378))], axis=1)
# 공용 엔지니어링 구역(1846): 기둥 1340..1378, 서고 1378..1606, 빈 벽 150, 서고(1384..1604) 뒤집은 것, 빈 벽 200(출구 문 자리),
# 서고 하나 더, 빈 벽 36, 원본 1606..2360(플로터·게시판·작업대·회선 장비·칸막이)
archive = kit.cols((1384, 1604))
engineering = np.concatenate([kit.cols((1340, 1606)), kit.strip(1604, 1612, 150), flip(archive, True), kit.strip(1604, 1612, 200),
                              archive, kit.strip(1604, 1612, 36), kit.cols((1606, 2360))], axis=1)
# 기술 회의실(1840): 원본 2336..3030(칸막이·화이트보드·테이블·디스플레이), 테이블 끝 칸 넷(뒤집기·그대로(디스플레이)·뒤집기·그대로),
# 빈 벽 352(출구 문 자리), 원본 3030..3152(캐비닛·끝벽)
meeting = np.concatenate([kit.cols((2336, 3030)), flip(table_bay, True), table_disp, flip(table_bay, True), no_troffer(table_bay, 96, 168),
                          meeting_wall(352), no_troffer(kit.cols((3030, 3152)), 0, 42)], axis=1)
for name, block in (('work', work), ('engineering', engineering), ('meeting', meeting)):
    print(name, kit.save(block, HERE + f'floor06-{name}-interior.png'))

print('built 6F assets')
