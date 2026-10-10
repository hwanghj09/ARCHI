# 8층 배경: 사용자가 준 단면 에셋 floor08-qa-planning.png(3200×556, PROMPT.md)로 복도 1장, 방 내부 3장, 문 스프라이트 3장을
# 만든다. 실행: python assets/background/floor08/build.py (저장소 루트에서, Pillow·numpy). 공용 도구는 cutaway_kit.py.
# 에셋은 플레이어 162px = 175cm 기준이라 1:1로 쓴다(원본 바닥선 y=438 → 월드 y=570, top=132). 건물 코어는 모든 층에서 같은
# 자리라 복도에는 방 앞 유리 너머로 방 그림의 일부를 보이고(QA 시험실·제품기획 업무 공간은 코어 왼쪽, 공용 제품 회의실은 화장실
# 오른쪽), 방 안에는 방 그림 전체를 반복 칸으로 넓혀 쓴다(방 양 끝은 원본 끝벽 48..78 / 3122..3152).
import sys

sys.path.insert(0, 'assets/background')
import numpy as np
from cutaway_kit import Cutaway, door_sheet

HERE = 'assets/background/floor08/'
DOORS = 'assets/objects/floor08/'                # 문 그림은 오브젝트 폴더(파일 정리 규칙)
kit = Cutaway(HERE + 'floor08-qa-planning.png', seed=8)
A = kit.A
LEFT_CAP, RIGHT_CAP = (48, 78), (3122, 3152)

# ---------------------------------------------------------------- 복도
# 벽 색은 QA실 결함 현황판과 시험석 사이의 맨 콘크리트 기둥 열(630..646)에서 뽑는다(케이블 트레이·안전 줄무늬 높이가 이어진다).
corridor = kit.corridor_wall(5000, wall=(630, 646))
kit.place(corridor, 10, A[:, 48:78])                                          # 왼쪽 끝벽 → 월드 10..40
kit.place(corridor, 40, kit.glass(kit.cols((78, 1054), (1300, 1324))))       # QA 시험실 앞 → 40..1040
kit.place(corridor, 1080, kit.glass(kit.cols((1324, 1990), (2340, 2364))))   # 제품기획 업무 공간 앞 → 1080..1770
kit.place(corridor, 4282, kit.glass(kit.cols((2364, 3052), RIGHT_CAP)))      # 공용 제품 회의실 앞 + 끝벽 → 4282..5000
kit.decor(corridor, (1333, 179, 1379, 198), 2974, 210)                        # 비상구 유도등 → 계단 문 위
# 가운데 구역(월드 3300): 꺼진 출시 판정 신호등(원본 349..363). 신호등 머리(250..332행)는 그대로, 아래 기둥과 받침은 뒤 벽과
# 다른 픽셀만 옮긴다(뒤 콘크리트는 복도 벽이 대신한다).
LIGHT_X = 3300
corridor[250:332, LIGHT_X:LIGHT_X + 15] = A[250:332, 349:364]
pole = A[332:438, 344:369]
mask = np.abs(pole[..., :3].astype(int) - A[332:438, 372:373, :3].astype(int)).sum(2) > 40
region = corridor[332:438, LIGHT_X - 5:LIGHT_X + 20]
region[mask] = pole[mask]
kit.save(corridor, HERE + 'floor08-corridor.png')

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

for name, block in (('qa', qa), ('planning', plan), ('meeting', meet)):
    print(name, kit.save(block, HERE + f'floor08-{name}-interior.png'))

# ---------------------------------------------------------------- 문 스프라이트(닫힘 | 열림), 높이 210 = 원본 강철문 높이
door_sheet('steel', 140, DOORS + 'door-qa.png', colors=((34, 36, 36), (62, 66, 66), (150, 132, 70)), accent=(214, 160, 50))
door_sheet('glass', 110, DOORS + 'door-planning.png', colors=((44, 50, 54), (28, 38, 44), (74, 92, 100)))
door_sheet('wood', 120, DOORS + 'door-meeting.png', colors=((36, 34, 32), (56, 54, 52), (88, 84, 80)))
print('built 8F assets')
