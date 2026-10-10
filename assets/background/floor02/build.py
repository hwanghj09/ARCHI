# 2층 배경: 사용자가 준 단면 에셋 floor02-hall-server-lounge.png(3200×556, PROMPT.md)로 방 내부 3장과 장면별 천장·바닥 층을 만든다.
# 실행: python assets/background/floor02/build.py (저장소 루트에서, Pillow·numpy).
# 복도는 이 스크립트가 아니라 assets/background/wall 모듈을 walls-layout.json으로 합성한 walls.png다(archi-floor-walls 스킬).
# 문 그림은 assets/objects/floor02/(archi-floor-doors 스킬)에 있다.
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

HERE = 'assets/background/floor02/'
SRC = Image.open(HERE + 'floor02-hall-server-lounge.png').convert('RGBA')
A = np.asarray(SRC).copy()
H = A.shape[0]                      # 556
FLOOR = 438
rng = np.random.default_rng(2)


def cols(*pieces):
    """Join source column ranges; (a, b, True) is mirrored."""
    out = []
    for piece in pieces:
        a, b = piece[:2]
        block = A[:, a:b]
        out.append(block[:, ::-1] if len(piece) > 2 and piece[2] else block)
    return np.concatenate(out, axis=1)


CEIL_ROW, FLOOR_KEEP = 82, 442
FLOOR_TOP = 556               # 바닥 층 위쪽 끝(월드 y). 벽 그림 아래 띠(걸레받이·방 바닥 앞면)를 바닥이 덮는다
CEILING_H = 100               # 천장 층 높이(월드 y=0..100), 그 아래부터 벽


def trim(block):
    """Keep only the wall rows 82..441 (ceiling and floor slabs go), stretched vertically to world y=100..575 so that row 438
    lands on the floor line y=570. The ceiling layer covers y=0..100, the floor layer y=570..760."""
    rows = np.ascontiguousarray(block[CEIL_ROW:FLOOR_KEEP])
    height = round(CEILING_H + (FLOOR_KEEP - CEIL_ROW) * (570 - CEILING_H) / (FLOOR - CEIL_ROW)) - CEILING_H
    out = np.asarray(Image.fromarray(rows).resize((rows.shape[1], height), Image.LANCZOS)).copy()
    out[FLOOR_TOP - CEILING_H:] = 0                 # 바닥 층이 시작하는 월드 y=556부터 아래는 비운다(벽과 바닥 사이 틈 없음)
    return out



# ---------------------------------------------------------------- 방 내부
# 행사장(2676): 원본 48..1524 전체에 객석·벽 디스플레이 칸(1038..1278)을 1038 자리에 다섯 번(번갈아 뒤집어) 끼운다.
hall = cols((48, 1038), *[(1038, 1278, k % 2 == 1) for k in range(5)], (1038, 1524))
# 직원 휴게실(1846): 원본 2200..2884에 창·소파 칸 뒤집은 것, 자판기 한 쌍, 판벽 266px, 그리고 원본 2884..3152(안락의자·포스터·끝벽).
plain = np.repeat(A[:, 2436:2442], 266 // 6 + 1, axis=1)[:, :266]     # 자판기와 커튼 사이의 빈 판벽을 편 것
lounge = np.concatenate([cols((2200, 2884)), cols((2446, 2884, True)), cols((2242, 2432)), plain, cols((2884, 3152))], axis=1)
# 서버실(1840): 칸막이·문(1500..1538) 다음에 가동 랙(1538..1600)과 네트워크 랙(1862..1924) 한 쌍을 아홉 번, 그리고 원본 1538..2224.
server = cols((1500, 1538), *[r for _ in range(9) for r in ((1538, 1600), (1862, 1924))], (1538, 2224))
for name, block in (('hall', hall), ('lounge', lounge), ('server', server)):
    Image.fromarray(trim(block)).save(HERE + f'floor02-{name}-interior.png')
    print(name, block.shape[1])


# ---------------------------------------------------------------- 천장·바닥(16층처럼)
# 천장(복도 월드 y=0..214, 방 안 0..280): 화면 맨 위까지 이어진 평평한 천장판(바둑판 줄눈, 꺼진 매입등, 시스템 에어컨 그릴, 스프링클러)과 그 아래
# 벽 위 띠(몰딩)다. 천장 속 배관은 그리지 않는다. 바닥(월드 y=570..760): 에셋 바닥선 아래로 바로 이어지는 짙은 바닥과 은은한 반사.
CEILINGS = {
    'hall': (2676, (28, 44, 46), (20, 34, 36), (150, 124, 66)),       # 행사장: 짙은 청록 천장판, 금박 줄
    'lounge': (1846, (66, 58, 50), (70, 50, 36), (98, 76, 56)),       # 휴게실: 웜그레이 천장판, 원목 띠
    'server': (1840, (112, 120, 124), (70, 76, 80), (160, 168, 172)),  # 서버실: 흰 밀폐 천장판
}


def ceiling(name, width, board, band, line):
    H = CEILING_H
    top = H - 16                                                             # 벽 위 띠
    image = Image.new('RGBA', (width, H), board + (255,))
    d = ImageDraw.Draw(image)
    for y in range(top):                                                     # 위로 갈수록 살짝 어둡게
        t = y / top
        d.line([0, y, width, y], fill=tuple(int(c * (.78 + .22 * t)) for c in board) + (255,))
    dark = tuple(int(c * .74) for c in board) + (255,)
    d.line([0, 30, width, 30], fill=dark)                                    # 천장판 줄눈
    for x in range(0, width, 120):
        d.line([x, 0, x, top], fill=dark)
    for x in range(60, width, 240):                                          # 꺼진 매입등
        d.ellipse([x - 20, 48, x + 20, 60], fill=(14, 16, 17, 255), outline=(150, 152, 148, 255), width=2)
    for x in range(180, width, 720):                                         # 시스템 에어컨 그릴
        d.rectangle([x, 38, x + 140, 70], fill=tuple(int(c * .55) for c in board) + (255,), outline=line + (255,), width=2)
        for gx in range(x + 8, x + 134, 6):
            d.line([gx, 43, gx, 65], fill=(18, 20, 22, 255))
    for x in range(120, width, 480):                                         # 스프링클러
        d.rectangle([x - 2, 72, x + 2, 78], fill=(160, 156, 140, 255))
    d.rectangle([0, top, width, H], fill=band + (255,))
    if name == 'lounge':
        for x in range(0, width, 10):
            d.line([x, top + 2, x, H], fill=tuple(int(c * .72) for c in band) + (255,), width=2)
    d.line([0, top, width, top], fill=line + (255,), width=2)
    image.save(HERE + f'floor02-ceiling-{name}.png')
    FH = 760 - FLOOR_TOP
    floor = Image.new('RGBA', (width, FH), (0, 0, 0, 255))                   # 바닥(월드 556..760)
    f = ImageDraw.Draw(floor)
    for y in range(FH):
        t = y / FH
        f.line([0, y, width, y], fill=(int(24 - 10 * t), int(27 - 10 * t), int(30 - 10 * t), 255))
    f.rectangle([0, 0, width, 1], fill=(64, 68, 66, 255))                  # 벽과 만나는 모서리
    for y in (48, 100):
        f.line([0, y, width, y], fill=(14, 16, 18, 255))
    for x in range(0, width, 160):
        f.line([x, 4, x - 30, FH], fill=(16, 18, 20, 255))
    floor.save(HERE + f'floor02-floor-{name}.png')


for name, (width, board, band, line) in CEILINGS.items():
    ceiling(name, width, board, band, line)



print('built 2F assets')
