# 10층 배경: 사용자가 준 단면 에셋 floor10-management.png(3200×556, PROMPT.md)로 복도 1장, 방 내부 3장, 문 스프라이트 3장을
# 만든다. 실행: python assets/background/floor10/build.py (저장소 루트에서, Pillow·numpy).
# 에셋은 플레이어 162px = 175cm 기준이라 1:1로 쓴다(원본 바닥선 y=438 → 월드 y=570, top=132). 건물 코어는 모든 층에서 같은
# 자리라 경영관리 사무실·임원 회의실은 코어 왼쪽, 임원실은 화장실 오른쪽에 두고, 복도에는 방 앞 유리 너머로 방 그림 일부를 보인다.
import sys
sys.path.insert(0, 'assets/background')
import numpy as np
from cutaway_kit import Cutaway, door_sheet  # noqa: E402

HERE = 'assets/background/floor10/'
DOORS = 'assets/objects/floor10/'                # 문 그림은 오브젝트 폴더(파일 정리 규칙)
kit = Cutaway(HERE + 'floor10-management.png', seed=10)

# ---------------------------------------------------------------- 복도
corridor = kit.corridor_wall(5000, wall=(1305, 1320))          # 회의실 왼쪽 빈 옥색 벽의 행별 색
corridor[:, 10:40] = kit.A[:, 48:78]                             # 왼쪽 끝벽
# 경영관리 사무실 앞(월드 40..1040): 끝벽 옆 벽 78..96 + 빈 벽 2px + 진열장부터 유리 칸막이까지 320..1300(캐비닛 셋은 뺀다)
kit.place(corridor, 40, kit.glass(kit.cols((78, 96), (80, 82), (320, 1300))))
# 임원 회의실 앞(월드 1080..1770): 미디어 월·상석·크레덴자 1590..2280
kit.place(corridor, 1080, kit.glass(kit.cols((1590, 2280))))
# 임원실 앞(월드 4282..5000): 원목 칸막이 2280..2304 + 비서 데스크~드레이프 2304..2896 + 책장 오른쪽 3044..3122 + 끝벽 3128..3152
kit.place(corridor, 4282, kit.glass(kit.cols((2280, 2304), (2304, 2896), (3044, 3122), (3128, 3152))))
# 비상구 유도등(원본 1225..1268, 166..184행)을 계단 문 위에, 멈춘 벽시계(1108..1136, 164..188행)를 가운데 구역 벽에
kit.decor(corridor, (1225, 166, 1268, 184), 2974, 210)
kit.decor(corridor, (1108, 164, 1136, 188), 3336, 340)
kit.save(corridor, HERE + 'floor10-corridor.png')

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

# ---------------------------------------------------------------- 문 스프라이트(닫힘 | 열림), 높이 210
# 사무실: 짙은 원목 틀 유리문, 회의실: 짙은 원목 문(황동 손잡이), 임원실: 칠한 원목 문, 카드 리더 붉은 대기등
door_sheet('glass', 140, DOORS + 'door-office.png', colors=((48, 38, 28), (22, 34, 32), (74, 92, 86)))
door_sheet('wood', 110, DOORS + 'door-meeting.png', colors=((40, 28, 20), (62, 44, 32), (96, 72, 50)))
door_sheet('wood', 120, DOORS + 'door-executive.png', colors=((30, 22, 18), (58, 40, 30), (150, 124, 66)),
           accent=(190, 50, 40))
print('built 10F assets')
