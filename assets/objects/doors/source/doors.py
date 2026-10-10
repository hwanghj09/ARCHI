"""ARCHI room doors - one per room in floor-02..10 (7F excluded), all 520x1280 (= 130x320 world px)."""
import sys, os, math, random
import numpy as np
from doorkit import *

STEEL_FRAME = (62, 66, 70)
HINGES = (130, 610, 1080)


def base(leaf_src, frame_src=None, seed=1, hinge_side='L', hinge_metal=(150, 150, 146), wear=0.10):
    d = Door()
    d.frame(frame_src if frame_src is not None else mat_paint(STEEL_FRAME, seed + 50, 0.02))
    d.leaf(leaf_src)
    for y in HINGES:
        d.hinge(LX0 if hinge_side == 'L' else LX1, y, 64, hinge_side, hinge_metal)
    d.threshold()
    if wear:
        d.wear(seed, wear)
    return d


# ------------------------------------------------------------------ pictograms (drawn inside plate boxes)
def ico_headset(d, b):
    x0, y0, x1, y1 = b; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 + 3
    d.put(mask(lambda m: m.arc(R(cx - 14, cy - 16, cx + 14, cy + 12), 180, 360, fill=255, width=P(3))), (40, 40, 36))
    d.rrect((cx - 17, cy - 4, cx - 10, cy + 8), 2, (40, 40, 36)); d.rrect((cx + 10, cy - 4, cx + 17, cy + 8), 2, (40, 40, 36))
    d.line([(cx + 12, cy + 8), (cx + 4, cy + 12)], (40, 40, 36), 2)


def ico_hazard(d, b):
    x0, y0, x1, y1 = b; cx = (x0 + x1) / 2
    d.poly([(cx, y0 + 6), (x1 - 6, y1 - 6), (x0 + 6, y1 - 6)], (34, 32, 26))
    d.poly([(cx, y0 + 13), (x1 - 12, y1 - 10), (x0 + 12, y1 - 10)], (214, 180, 52))
    d.line([(cx + 3, y0 + 18), (cx - 4, y0 + 30), (cx + 3, y0 + 30), (cx - 3, y1 - 13)], (34, 32, 26), 2.2)


def ico_stage(d, b):
    x0, y0, x1, y1 = b; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    d.put(mask(lambda m: m.arc(R(cx - 16, cy - 12, cx + 16, cy + 18), 200, 340, fill=255, width=P(2.5))), (60, 46, 26))
    d.rect((cx - 18, cy + 6, cx + 18, cy + 10), (60, 46, 26))
    for k in (-8, 0, 8):
        d.ellipse((cx + k - 2, cy - 4, cx + k + 2, cy), (60, 46, 26))


def ico_dumbbell(d, b):
    x0, y0, x1, y1 = b; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    d.rect((cx - 14, cy - 2, cx + 14, cy + 2), (40, 36, 30))
    for s in (-1, 1):
        d.rect((cx + s * 14 - 3, cy - 9, cx + s * 14 + 3, cy + 9), (40, 36, 30))
        d.rect((cx + s * 20 - 2, cy - 6, cx + s * 20 + 2, cy + 6), (40, 36, 30))


def ico_bucket(d, b):
    x0, y0, x1, y1 = b; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    d.poly([(cx - 12, cy - 6), (cx + 12, cy - 6), (cx + 9, cy + 12), (cx - 9, cy + 12)], (40, 40, 36))
    d.put(mask(lambda m: m.arc(R(cx - 12, cy - 16, cx + 12, cy + 4), 180, 360, fill=255, width=P(2))), (40, 40, 36))
    d.line([(cx + 6, cy - 22), (cx + 16, cy + 10)], (40, 40, 36), 2)


def ico_book(d, b):
    x0, y0, x1, y1 = b; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    d.poly([(cx - 18, cy - 10), (cx, cy - 6), (cx, cy + 12), (cx - 18, cy + 8)], (50, 44, 30))
    d.poly([(cx + 18, cy - 10), (cx, cy - 6), (cx, cy + 12), (cx + 18, cy + 8)], (70, 62, 42))


def ico_lock(d, b):
    x0, y0, x1, y1 = b; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    d.put(mask(lambda m: m.arc(R(cx - 9, cy - 16, cx + 9, cy + 2), 180, 360, fill=255, width=P(2.5))), (40, 40, 36))
    d.rect((cx - 11, cy - 6, cx + 11, cy + 12), (40, 40, 36))
    d.ellipse((cx - 2, cy, cx + 2, cy + 4), (180, 172, 140))


def ico_people(d, b):
    x0, y0, x1, y1 = b; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    for k in (-12, 0, 12):
        d.ellipse((cx + k - 4, cy - 12, cx + k + 4, cy - 4), (40, 40, 36))
        d.rrect((cx + k - 6, cy - 2, cx + k + 6, cy + 12), 4, (40, 40, 36))


def ico_chart(d, b):
    x0, y0, x1, y1 = b; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    for k, hgt in enumerate((8, 14, 20)):
        d.rect((cx - 14 + k * 10, cy + 10 - hgt, cx - 7 + k * 10, cy + 10), (40, 40, 36))


def ico_key(d, b):
    x0, y0, x1, y1 = b; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    d.put(mask(lambda m: m.ellipse(R(cx - 18, cy - 7, cx - 4, cy + 7), outline=255, width=P(2.5))), (60, 46, 26))
    d.rect((cx - 4, cy - 1.5, cx + 18, cy + 1.5), (60, 46, 26))
    d.rect((cx + 10, cy, cx + 13, cy + 7), (60, 46, 26)); d.rect((cx + 15, cy, cx + 18, cy + 5), (60, 46, 26))


def sign(d, icon, col=(186, 178, 146), y=180):
    d.plate((LX0 + 150, y, LX0 + 230, y + 56), col, icon=icon)


# ================================================================== 2F  concert
def f2_hall():          # Harmony Hall - balcony door
    d = base(mat_wood((66, 48, 36), 201), mat_brushed((112, 94, 66), 202, 'v', 0.08), seed=201, hinge_metal=(140, 120, 84))
    for x in (LX0 + 40, LX1 - 40):
        d.rect((x - 1.5, LY0 + 40, x + 1.5, LY1 - 40), (138, 116, 78))
    d.vision((LX0 + 110, 220, LX0 + 140, 600), seed=203, frame=(118, 98, 68))
    d.pull_bar(LX1 - 76, 470, 930, metal=(170, 146, 98), w=12)
    d.kick_plate(100, metal=(140, 118, 80), seed=204)
    sign(d, ico_stage, (176, 160, 118), 150)
    return d


def f2_booth():         # 영사실 - projection booth
    d = base(mat_paint((42, 44, 48), 211), seed=211, wear=0.14)
    d.vision((LX0 + 150, 300, LX0 + 290, 400), seed=212)
    d.rect((LX0 + 143, 293, LX0 + 297, 345), mat_brushed((90, 92, 94), 213, 'h'), r=0.4)     # shutter half down
    d.bevel((LX0 + 143, 293, LX0 + 297, 345), depth=3)
    d.louver((LX0 + 70, 960, LX1 - 70, 1110), (64, 66, 70))
    d.lever(LX1 - 70, 680, 'L')
    d.rrect((FW / 2 - 26, 6, FW / 2 + 26, 24), 4, (60, 20, 18))                                # in-use lamp on the head, dim
    d.glow((FW / 2, 15), 30, (200, 50, 40), 0.25)
    return d


def f2_server():        # 서버실
    d = base(mat_brushed((148, 152, 156), 221, 'v', 0.12), seed=221, wear=0.06)
    d.vision((LX0 + 60, 260, LX0 + 110, 560), seed=222, wired=True)
    d.card_reader(LX1 - 80, 560)
    d.lever(LX1 - 64, 720, 'L')
    d.plate((LX0 + 170, 300, LX0 + 250, 370), (226, 196, 70), (40, 36, 20), icon=ico_hazard)
    d.kick_plate(80, seed=223)
    return d


# ================================================================== 3F  gym
def f3_gym_slide():     # Fitness Club - automatic sliding glass door
    d = Door()
    frame = mat_brushed((52, 54, 58), 301, 'v', 0.06)
    d.frame(frame)
    d.rect((LX0, LY0, LX1, LY1), (20, 22, 24))
    glass = mat_glass_dark(302, tint=(36, 44, 50))
    mid = FW / 2
    for gx0, gx1 in ((LX0 + 14, mid - 8), (mid + 8, LX1 - 14)):
        d.rect((gx0, LY0 + 14, gx1, LY1 - 20), glass)
        d.vision((gx0, LY0 + 14, gx1, LY1 - 20), seed=303, frame=(52, 54, 58), src=glass)
    d.rect((mid - 8, LY0, mid + 8, LY1), frame); d.bevel((mid - 8, LY0, mid + 8, LY1), depth=4)
    for y in (LY0, LY1 - 20):
        d.rect((LX0, y, LX1, y + 14 if y == LY0 else y + 20), frame)
    # orange manifestation band with gym dots
    d.rect((LX0 + 14, 600, LX1 - 14, 622), (184, 98, 46), alpha=0.85)
    for x in np.arange(LX0 + 30, LX1 - 20, 22):
        d.ellipse((x - 4, 627, x + 4, 635), (184, 98, 46), alpha=0.8)
    d.plate((LX0 + 40, 520, LX0 + 110, 572), (196, 184, 160), icon=ico_dumbbell)
    # sensor on the head
    d.rrect((mid - 46, 4, mid + 46, 24), 4, (24, 26, 28))
    d.ellipse((mid + 26, 10, mid + 34, 18), (200, 50, 40)); d.glow((mid + 30, 14), 14, (210, 60, 50), 0.4)
    d.threshold((90, 92, 94))
    return d


def f3_cs():            # 고객만족센터
    d = base(mat_paint((38, 54, 82), 311), seed=311)
    d.vision((LX0 + 50, 220, LX0 + 110, 760), seed=312)
    d.lever(LX1 - 64, 700, 'L')
    sign(d, ico_headset, (190, 186, 170), 200)
    d.kick_plate(80, seed=313)
    return d


def f3_utility():       # ㈜하누리서비스 - contractor utility door
    d = base(mat_paint((76, 86, 74), 321, 0.05), seed=321, wear=0.2)
    d.louver((LX0 + 60, 930, LX1 - 60, 1090), (70, 78, 68))
    d.lever(LX1 - 64, 700, 'L', metal=(150, 150, 144))
    # clipboard holder with a blank work sheet
    d.rrect((LX0 + 150, 300, LX0 + 260, 450), 4, (60, 50, 40))
    d.rect((LX0 + 158, 316, LX0 + 252, 444), (196, 194, 184))
    for k in range(7):
        d.line([(LX0 + 166, 334 + k * 14), (LX0 + 244, 334 + k * 14)], (130, 130, 124), 1)
    d.rrect((LX0 + 190, 296, LX0 + 222, 312), 3, (150, 150, 146))
    sign(d, ico_bucket, (180, 176, 156), 210)
    d.scuffs((LX0, 700, LX1, LY1), 322, 40, light=False)
    d.kick_plate(70, metal=(130, 130, 124), seed=323)
    return d


# ================================================================== 4F  rnd
def f4_lab():           # 로그 연구실
    d = base(mat_paint((150, 156, 158), 401, 0.02), seed=401, wear=0.05)
    d.vision((LX0 + 50, 200, LX0 + 100, 900), seed=402)
    d.rect((LX0, 640, LX1, 660), (95, 143, 134))                                               # mint band
    d.lever(LX1 - 64, 720, 'L')
    d.kick_plate(90, seed=403)
    return d


def f4_maglock():       # 백업 보관실 - electromagnetic lock
    d = base(mat_paint((72, 82, 90), 411, 0.03), seed=411)
    d.rrect((LX0 + 60, LY0 + 6, LX1 - 60, LY0 + 46), 4, mat_brushed((160, 162, 164), 412, 'h'))   # maglock armature
    d.bevel((LX0 + 60, LY0 + 6, LX1 - 60, LY0 + 46), depth=4)
    d.ellipse((LX1 - 84, LY0 + 20, LX1 - 74, LY0 + 30), (95, 200, 160)); d.glow((LX1 - 79, LY0 + 25), 14, (95, 200, 160), 0.35)
    for x in np.arange(LX0 + 30, LX1 - 20, 60):                                                 # heavy rivet line
        for y in (110, LY1 - 140):
            d.ellipse((x - 4, y - 4, x + 4, y + 4), (120, 128, 134))
    d.keypad(LX1 - 100, 560)
    d.pull_bar(LX1 - 70, 700, 900)
    d.stripes((LX0 + 4, LY1 - 110, LX1 - 4, LY1 - 70), a=(95, 143, 134), b=(30, 34, 36))
    d.kick_plate(66, seed=413)
    return d


def f4_office():        # 연구원 사무실 - frosted glass office door
    d = Door()
    alu = mat_brushed((150, 154, 158), 421, 'v', 0.1)
    d.frame(mat_paint((70, 74, 78), 422))
    d.leaf(alu)
    d.rect((LX0 + 40, LY0 + 50, LX1 - 40, LY1 - 140), mat_frosted((176, 186, 186), 423), r=0.4)
    d.bevel((LX0 + 40, LY0 + 50, LX1 - 40, LY1 - 140), depth=6, raised=False)
    d.rect((LX0 + 40, 600, LX1 - 40, 616), (95, 143, 134), alpha=0.7)
    d.pull_bar(LX1 - 70, 520, 900)
    for y in HINGES:
        d.hinge(LX0, y, 64, 'L')
    d.threshold()
    return d


# ================================================================== 5F  archive
def f5_library():       # 연구 도서실
    d = base(mat_wood((110, 78, 48), 501), mat_wood((80, 56, 36), 502), seed=501, hinge_metal=(170, 146, 98))
    gb = (LX0 + 50, LY0 + 60, LX1 - 50, 600)
    d.vision(gb, seed=503, frame=(90, 64, 40), src=mat_glass_dark(503, tint=(44, 40, 34)))
    for x in np.linspace(gb[0], gb[2], 3)[1:-1]:
        d.rect((x - 4, gb[1], x + 4, gb[3]), (90, 64, 40)); d.bevel((x - 4, gb[1], x + 4, gb[3]), depth=2)
    for y in np.linspace(gb[1], gb[3], 4)[1:-1]:
        d.rect((gb[0], y - 4, gb[2], y + 4), (90, 64, 40)); d.bevel((gb[0], y - 4, gb[2], y + 4), depth=2)
    pb = (LX0 + 50, 680, LX1 - 50, LY1 - 130)
    d.bevel(pb, depth=10, raised=True)
    d.lever(LX1 - 64, 640, 'L', metal=(176, 152, 100))
    d.kick_plate(90, metal=(160, 136, 90), seed=504)
    return d


def f5_seclab():        # 보안 연구실
    d = base(mat_paint((54, 58, 62), 511, 0.03), seed=511)
    d.put(mask(lambda m: [m.ellipse(R(x - 1.6, y - 1.6, x + 1.6, y + 1.6)) for y in np.arange(140, 560, 12)
                          for x in np.arange(LX0 + 40, LX1 - 40, 12)], 0.3), (34, 36, 40))          # perforated panel
    d.rect((LX0, 600, LX1, 628), (150, 120, 60))                                               # ochre band
    d.card_reader(LX1 - 84, 660)
    d.keypad(LX0 + 40, 660)
    d.lever(LX1 - 64, 800, 'L')
    d.vision((LX0 + 200, 880, LX0 + 260, 940), seed=512, wired=True)
    d.kick_plate(80, seed=513)
    return d


def f5_council():       # AI 권한 심의실
    d = base(mat_wood((76, 58, 42), 521), mat_brushed((120, 100, 66), 522, 'v', 0.06), seed=521, hinge_metal=(170, 146, 98))
    slats = mat_wood((92, 70, 50), 523)
    xs = list(np.arange(LX0 + 24, LX1 - 20, 22))
    d.put(mask(lambda m: [m.rectangle(R(x, LY0 + 30, x + 14, LY1 - 110)) for x in xs], 0.3), slats)   # vertical wood louvers
    d.shade(mask(lambda m: [m.rectangle(R(x, LY0 + 30, x + 3, LY1 - 110)) for x in xs], 0.4), 0.22)
    d.shade(mask(lambda m: [m.rectangle(R(x + 11, LY0 + 30, x + 14, LY1 - 110)) for x in xs], 0.4), -0.32)
    d.pull_bar(LX1 - 60, 450, 980, metal=(180, 156, 104), w=12)
    d.kick_plate(90, metal=(160, 136, 90), seed=524)
    sign(d, ico_people, (184, 168, 126), 130)
    return d


# ================================================================== 6F  oncall
def f6_headset():       # 원격 지원실
    d = base(mat_paint((78, 82, 62), 601, 0.04), seed=601)
    d.vision((LX0 + 60, 240, LX1 - 60, 470), seed=602)
    d.rect((LX0, 520, LX1, 536), (138, 130, 64))
    d.lever(LX1 - 64, 700, 'L')
    sign(d, ico_headset, (190, 182, 120), 560)
    d.kick_plate(80, seed=603)
    return d


def f6_cable():         # 회선 관리실
    d = base(mat_paint((84, 88, 82), 611, 0.04), seed=611)
    d.vision((LX0 + 60, 240, LX0 + 110, 520), seed=612, wired=True)
    d.card_reader(LX1 - 84, 560)
    d.lever(LX1 - 64, 720, 'L')
    # conduit and a new yellow fibre entering through the head
    d.rect((LX1 - 70, 0, LX1 - 50, LY0 + 4), mat_brushed((120, 120, 116), 613, 'v'))
    d.line([(LX1 - 60, 0), (LX1 - 60, LY0)], (216, 184, 58), 3)
    d.plate((LX0 + 160, 300, LX0 + 240, 356), (226, 196, 70), (40, 36, 20), icon=ico_hazard)
    d.kick_plate(80, seed=614)
    return d


def f6_duty():          # 당직실 - old wooden door
    d = base(mat_wood((92, 60, 40), 621), mat_wood((70, 46, 30), 622), seed=621, wear=0.2)
    for pb in ((LX0 + 50, LY0 + 60, LX1 - 50, 560), (LX0 + 50, 640, LX1 - 50, LY1 - 110)):
        d.bevel(pb, depth=10, raised=True)
    # duty roster on a hook (blank)
    d.line([(LX0 + 230, 300), (LX0 + 230, 316)], (120, 120, 116), 2)
    d.rect((LX0 + 190, 316, LX0 + 270, 420), (190, 186, 172))
    for k in range(6):
        d.line([(LX0 + 198, 332 + k * 13), (LX0 + 262, 332 + k * 13)], (130, 128, 120), 1)
    d.plate((LX0 + 150, 150, LX0 + 230, 196), (150, 136, 70), (60, 52, 24))
    d.lever(LX1 - 64, 640, 'L', metal=(150, 146, 136))
    d.scuffs((LX0, 600, LX1, LY1), 623, 36, light=True)
    d.kick_plate(70, metal=(130, 126, 116), seed=624)
    return d


# ================================================================== 8F  qa
def f8_hazard():        # 결함 재현실
    d = base(mat_paint((96, 100, 102), 801, 0.03), seed=801)
    d.vision((LX0 + 60, 240, LX1 - 60, 420), seed=802, wired=True)
    d.lever(LX1 - 64, 700, 'L')
    d.stripes((LX0 + 4, LY1 - 150, LX1 - 4, LY1 - 4))
    d.bevel((LX0 + 4, LY1 - 150, LX1 - 4, LY1 - 4), depth=4)
    for k, col in enumerate(((70, 26, 22), (80, 70, 20), (24, 60, 34))):                       # status stack lamp on the head
        d.rrect((FW / 2 - 50 + k * 34, 4, FW / 2 - 20 + k * 34, 24), 4, col)
    return d


def f8_seal():          # 블라인드 평가실 - sealed door
    d = base(mat_paint((168, 170, 168), 811, 0.02), seed=811, wear=0.05)
    for pb in ((LX0 + 40, LY0 + 50, LX1 - 40, 600), (LX0 + 40, 650, LX1 - 40, LY1 - 110)):
        d.bevel(pb, depth=6, raised=False)
    # seal tape across the leaf / frame gap (diagonal), dashed print without letters
    tape = [(LX1 - 50, 660), (LX1 + 26, 610), (LX1 + 26, 650), (LX1 - 50, 700)]
    d.poly(tape, (214, 186, 64))
    for k in range(5):
        x = LX1 - 40 + k * 14
        d.line([(x, 668 - k * 8), (x + 6, 664 - k * 8)], (120, 40, 34), 2)
    d.lever(LX1 - 64, 760, 'L')
    d.rrect((FW / 2 - 26, 6, FW / 2 + 26, 24), 4, (180, 40, 34))                             # occupied lamp, on
    d.glow((FW / 2, 15), 40, (230, 60, 50), 0.45)
    d.kick_plate(80, seed=812)
    return d


def f8_planner():       # 제품기획실 - glass door with sticky notes
    d = Door()
    d.frame(mat_wood((96, 72, 50), 821))
    d.leaf(mat_wood((110, 84, 58), 822))
    gb = (LX0 + 36, LY0 + 40, LX1 - 36, LY1 - 120)
    d.vision(gb, seed=823, frame=(96, 72, 50))
    rng = random.Random(824)
    for k in range(9):
        x = rng.uniform(gb[0] + 10, gb[2] - 50); y = rng.uniform(300, 760)
        col = rng.choice([(212, 196, 92), (204, 150, 160), (140, 196, 200), (212, 196, 92)])
        d.drop_shadow((x, y, x + 40, y + 40), off=2, blur=2)
        d.rect((x, y, x + 40, y + 40), col)
        d.shade(mask(lambda m: m.rectangle(R(x, y + 34, x + 40, y + 40))), -0.2)
        for l in range(3):
            d.line([(x + 6, y + 12 + l * 8), (x + 30, y + 12 + l * 8)], (90, 90, 80), 0.8, alpha=0.6)
    d.pull_bar(LX1 - 64, 540, 900)
    for y in HINGES:
        d.hinge(LX0, y, 64, 'L')
    d.kick_plate(100, seed=825)
    d.threshold()
    return d


# ================================================================== 9F  wine
def f9_push():          # 고객 브리핑 센터 - glass door with brass push bar
    d = Door()
    frame = mat_paint((70, 34, 44), 901)
    d.frame(frame)
    d.leaf(mat_paint((64, 30, 40), 902))
    d.vision((LX0 + 30, LY0 + 30, LX1 - 30, LY1 - 120), seed=903, frame=(70, 34, 44))
    d.push_bar(640, metal=(184, 158, 104))
    d.kick_plate(100, metal=(160, 136, 90), seed=904)
    for y in HINGES:
        d.hinge(LX0, y, 64, 'L', (170, 146, 98))
    d.threshold()
    return d


def f9_wine():          # 사업팀 사무실 - wine lacquer
    d = base(mat_lacquer((104, 40, 54), 911, grain=0.0), mat_paint((52, 44, 46), 912), seed=911, hinge_metal=(176, 152, 100), wear=0.04)
    d.lever(LX1 - 64, 680, 'L', metal=(184, 160, 106))
    d.plate((LX0 + 140, 300, LX0 + 260, 340), (176, 152, 100), (80, 64, 36))
    d.kick_plate(90, metal=(160, 136, 90), seed=913)
    return d


def f9_badge():         # 라이선스 관리실 - walnut with badge reader
    d = base(mat_wood((80, 56, 40), 921), mat_paint((52, 44, 46), 922), seed=921, hinge_metal=(170, 146, 98), wear=0.05)
    d.rect((LX0 + 40, LY0 + 40, LX0 + 44, LY1 - 40), (150, 128, 84))
    d.card_reader(LX1 - 84, 560)
    d.lever(LX1 - 64, 720, 'L', metal=(184, 160, 106))
    d.plate((LX0 + 140, 300, LX0 + 220, 356), (184, 168, 126), icon=ico_key)
    d.kick_plate(90, metal=(160, 136, 90), seed=923)
    return d


# ================================================================== 10F finance
def f10_brass():        # 재무회계팀 사무실 - jade panel door, cream mouldings
    d = base(mat_paint((46, 72, 62), 1001, 0.03), mat_paint((150, 142, 112), 1002, 0.02), seed=1001, hinge_metal=(176, 152, 100), wear=0.05)
    for pb in ((LX0 + 46, LY0 + 56, LX1 - 46, 560), (LX0 + 46, 640, LX1 - 46, LY1 - 120)):
        d.put(mask(lambda m: m.rectangle(R(*pb), outline=255, width=P(8))), (150, 142, 112))
        d.bevel(pb, depth=8, raised=True)
    d.vision((LX0 + 90, 150, LX1 - 90, 330), seed=1003, frame=(150, 142, 112))
    d.lever(LX1 - 64, 640, 'L', metal=(184, 160, 106))
    d.kick_plate(90, metal=(164, 140, 92), seed=1004)
    sign(d, ico_chart, (184, 168, 126), 400)
    return d


def f10_lacquer():      # 본부장실 - dark lacquered wood, double raised panels
    d = base(mat_lacquer((56, 32, 24), 1011), mat_lacquer((44, 26, 20), 1012), seed=1011, hinge_metal=(176, 152, 100), wear=0.03)
    for pb in ((LX0 + 46, LY0 + 56, FW / 2 - 8, 560), (FW / 2 + 8, LY0 + 56, LX1 - 46, 560),
               (LX0 + 46, 640, FW / 2 - 8, LY1 - 110), (FW / 2 + 8, 640, LX1 - 46, LY1 - 110)):
        d.bevel(pb, depth=12, raised=True, hi=0.28, lo=0.35)
    d.lever(LX1 - 64, 620, 'L', metal=(190, 166, 110))
    d.kick_plate(80, metal=(164, 140, 92), seed=1013)
    return d


def f10_vault():        # 금고실 - vault door with wheel
    d = base(mat_brushed((128, 132, 136), 1021, 'h', 0.08), mat_paint((50, 54, 58), 1022), seed=1021, hinge_metal=(110, 112, 114), wear=0.05)
    cx, cy = FW / 2, 600
    d.ellipse((cx - 180, cy - 180, cx + 180, cy + 180), mat_brushed((150, 154, 158), 1023, 'h', 0.1))
    d.bevel((cx - 180, cy - 180, cx + 180, cy + 180), depth=10, raised=True)
    for k in range(16):                                                                        # bolt ring
        a = k / 16 * 2 * math.pi
        bx, by = cx + math.cos(a) * 160, cy + math.sin(a) * 160
        d.ellipse((bx - 7, by - 7, bx + 7, by + 7), (90, 92, 94))
        d.shade(mask(lambda m: m.ellipse(R(bx - 7, by - 7, bx + 2, by + 2))), 0.3)
    for k in range(3):                                                                         # wheel spokes
        a = k / 3 * math.pi + 0.3
        d.line([(cx - math.cos(a) * 110, cy - math.sin(a) * 110), (cx + math.cos(a) * 110, cy + math.sin(a) * 110)], (170, 172, 174), 12)
    d.put(mask(lambda m: m.ellipse(R(cx - 110, cy - 110, cx + 110, cy + 110), outline=255, width=P(14))), (176, 178, 180))
    d.shade(mask(lambda m: m.arc(R(cx - 110, cy - 110, cx + 110, cy + 110), 180, 300, fill=255, width=P(6))), 0.25)
    d.ellipse((cx - 30, cy - 30, cx + 30, cy + 30), (120, 122, 124)); d.bevel((cx - 30, cy - 30, cx + 30, cy + 30), depth=6)
    d.keypad(LX1 - 92, 860)
    return d


DOORS = {
    '02': [('harmony-hall', 'balcony-door', f2_hall), ('projection-booth', 'booth-door', f2_booth), ('server-room', 'server-door', f2_server)],
    '03': [('fitness-club', 'gym-slide', f3_gym_slide), ('cs-center', 'cs-door', f3_cs), ('hanuri-service', 'utility-door', f3_utility)],
    '04': [('log-lab', 'lab-door', f4_lab), ('backup-vault', 'maglock', f4_maglock), ('research-office', 'office-door', f4_office)],
    '05': [('research-library', 'library-door', f5_library), ('security-lab', 'seclab', f5_seclab), ('ai-council', 'council', f5_council)],
    '06': [('remote-support', 'headset', f6_headset), ('line-room', 'cable-reader', f6_cable), ('duty-room', 'duty', f6_duty)],
    '08': [('defect-repro', 'hazard', f8_hazard), ('blind-eval', 'seal', f8_seal), ('product-planning', 'planner', f8_planner)],
    '09': [('briefing-center', 'push-bar', f9_push), ('business-office', 'wine', f9_wine), ('license-room', 'badge', f9_badge)],
    '10': [('finance-office', 'brass', f10_brass), ('director-office', 'lacquer', f10_lacquer), ('vault', 'vault-wheel', f10_vault)],
}

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/doors/out'
    only = sys.argv[2:] if len(sys.argv) > 2 else None
    for fl, items in DOORS.items():
        if only and fl not in only:
            continue
        os.makedirs(os.path.join(out, f'floor{fl}'), exist_ok=True)
        for name, style, fn in items:
            img = fn().render()
            img.save(os.path.join(out, f'floor{fl}', f'door-{name}.png'))
            print(fl, name, style, img.size, flush=True)
