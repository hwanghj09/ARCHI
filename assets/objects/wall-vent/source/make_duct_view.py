"""ARCHI duct view: what Suho sees hiding inside the wall vent (js/scene/guard-patrol.js #vent-view).

One-point perspective like the elevator cabin: galvanised sheet-metal walls converge on the vent opening, which is
left TRANSPARENT so the live corridor (and a passing robot) shows through it. The opening sits low because the
corridor floor is at 79% of the screen height (world y 570 of 720). Light only comes in through the opening.
PIL only (no numpy). Output: ../duct-view.png, 1920 x 1080.
"""
import os, random
from PIL import Image, ImageDraw, ImageFilter

W, H = 1920, 1080
# opening (transparent): x 26.5%..73.5%, y 27%..88%
HX0, HY0, HX1, HY1 = 509, 292, 1411, 950
STEEL = (118, 124, 126)        # galvanised duct sheet
OUT = os.path.join(os.path.dirname(__file__), '..', 'duct-view.png')


def depth_rect(u):
    """the duct cross-section at depth u (0 = screen edge, 1 = opening), with true perspective spacing"""
    def axis(a0, a1, h0, h1):
        s1 = (h1 - h0) / (a1 - a0)                # size of the opening relative to the screen
        s = 1 / (1 + u * (1 / s1 - 1))            # 1/z
        vp = (h0 - a0 * s1) / (1 - s1)            # vanishing point
        return vp + (a0 - vp) * s, vp + (a1 - vp) * s
    x0, x1 = axis(0, W, HX0, HX1)
    y0, y1 = axis(0, H, HY0, HY1)
    return x0, y0, x1, y1


def shade(col, k):
    return tuple(max(0, min(255, round(c * k))) for c in col)


def walls(img):
    d = ImageDraw.Draw(img)
    steps = 160
    for i in range(steps):
        u0, u1 = i / steps, (i + 1) / steps
        a, b = depth_rect(u0), depth_rect(u1)
        light = 0.22 + 0.9 * u1 ** 2.2            # the only light comes in through the opening
        faces = {   # (polygon, extra brightness): the floor catches the most spill, the ceiling the least
            'top': ([(a[0], a[1]), (a[2], a[1]), (b[2], b[1]), (b[0], b[1])], 0.72),
            'bottom': ([(a[0], a[3]), (a[2], a[3]), (b[2], b[3]), (b[0], b[3])], 1.08),
            'left': ([(a[0], a[1]), (b[0], b[1]), (b[0], b[3]), (a[0], a[3])], 0.9),
            'right': ([(a[2], a[1]), (b[2], b[1]), (b[2], b[3]), (a[2], a[3])], 0.84),
        }
        for poly, k in faces.values():
            d.polygon(poly, fill=shade(STEEL, light * k) + (255,))


def seams(img):
    """duct joints (rings) with a lit lip and a dark gap, rivets, and the four corner folds"""
    d = ImageDraw.Draw(img)
    for u in (0.32, 0.58, 0.8):
        x0, y0, x1, y1 = depth_rect(u)
        light = 0.22 + 0.9 * u ** 2.2
        wid = max(2, round(10 * (1 - u) + 2))
        d.rectangle([x0, y0, x1, y1], outline=shade((30, 32, 33), 1) + (255,), width=wid)
        d.rectangle([x0 + wid, y0 + wid, x1 - wid, y1 - wid], outline=shade(STEEL, light * 1.35) + (255,), width=max(1, wid // 3))
        r = max(2, round(6 * (1 - u) + 2))
        for k in range(1, 6):
            for px, py in ((x0 + (x1 - x0) * k / 6, y0 + wid * 2.2), (x0 + (x1 - x0) * k / 6, y1 - wid * 2.2),
                           (x0 + wid * 2.2, y0 + (y1 - y0) * k / 6), (x1 - wid * 2.2, y0 + (y1 - y0) * k / 6)):
                d.ellipse([px - r, py - r, px + r, py + r], fill=shade(STEEL, light * 1.25) + (255,))
                d.ellipse([px - r * .4, py - r * .1, px + r, py + r], fill=shade(STEEL, light * .55) + (255,))
    a, b = depth_rect(0), depth_rect(1)
    for (ax, ay), (bx, by) in (((a[0], a[1]), (b[0], b[1])), ((a[2], a[1]), (b[2], b[1])),
                               ((a[0], a[3]), (b[0], b[3])), ((a[2], a[3]), (b[2], b[3]))):
        d.line([ax, ay, bx, by], fill=(22, 24, 25, 255), width=5)


def dust(img):
    """grime and dust bed on the duct floor, thicker towards the opening; a cobweb in the upper-left corner"""
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    rng = random.Random(7)
    for _ in range(900):
        u = rng.random() ** 0.6
        x0, y0, x1, y1 = depth_rect(u)
        _, _, _, yn = depth_rect(min(1, u + 0.04))
        x = rng.uniform(x0 + 20, x1 - 20); y = rng.uniform(yn, y1)
        s = rng.uniform(1, 4) * (1.4 - u)
        d.ellipse([x - s * 1.6, y - s * .5, x + s * 1.6, y + s * .5], fill=(150, 140, 122, rng.randint(40, 110)))
    for _ in range(140):                           # streaks of grime running along the walls
        u = rng.uniform(0.1, 0.9); side = rng.choice((0, 2))
        r = depth_rect(u); r2 = depth_rect(min(1, u + rng.uniform(.05, .15)))
        y = rng.uniform(.25, .95)
        p = (r[side], r[1] + (r[3] - r[1]) * y); q = (r2[side], r2[1] + (r2[3] - r2[1]) * y)
        d.line([p, q], fill=(20, 18, 16, rng.randint(30, 70)), width=rng.randint(2, 5))
    cx, cy = depth_rect(0.55)[:2]                  # cobweb
    for k in range(9):
        ang = k / 8
        d.line([cx, cy, cx + 260 * ang, cy + 260 * (1 - ang)], fill=(190, 190, 185, 55), width=2)
    for ring in (60, 120, 190, 250):
        pts = [(cx + ring * a / 8, cy + ring * (1 - a / 8)) for a in range(9)]
        d.line(pts, fill=(190, 190, 185, 45), width=2)
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(1.2)))


def opening(img):
    """light spilling onto the duct around the opening, a thin steel lip with a lit top edge, then a clean hole"""
    spill = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(spill).rectangle([HX0 - 30, HY0 - 30, HX1 + 30, HY1 + 30], fill=(200, 210, 214, 70))
    img.alpha_composite(spill.filter(ImageFilter.GaussianBlur(55)))
    d = ImageDraw.Draw(img)
    rng = random.Random(3)
    lip = 14
    d.rectangle([HX0 - lip, HY0 - lip, HX1 + lip, HY1 + lip], outline=(72, 76, 78, 255), width=lip)
    d.line([HX0 - lip, HY1 + lip, HX1 + lip, HY1 + lip], fill=(108, 112, 112, 255), width=4)   # bottom lip catches the floor light
    d.line([HX0, HY0, HX1, HY0], fill=(30, 32, 33, 255), width=4)
    # a few dents and scratches on the lip from the cover being torn off
    for _ in range(26):
        side = rng.randrange(4)
        t = rng.random()
        x = HX0 + (HX1 - HX0) * t if side < 2 else (HX0 - lip / 2 if side == 2 else HX1 + lip / 2)
        y = (HY0 - lip / 2 if side == 0 else HY1 + lip / 2) if side < 2 else HY0 + (HY1 - HY0) * t
        d.line([x - 6, y - 2, x + 6, y + 2] if side < 2 else [x - 2, y - 6, x + 2, y + 6], fill=(132, 136, 136, 255), width=2)
    for x, y in ((HX0 - lip / 2, HY0 - lip / 2), (HX1 + lip / 2, HY0 - lip / 2), (HX0 - lip / 2, HY1 + lip / 2), (HX1 + lip / 2, HY1 + lip / 2)):
        d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=(16, 16, 16, 255))                         # empty screw holes
    # the hole itself: fully transparent so the live corridor shows through
    d.rectangle([HX0, HY0, HX1, HY1], fill=(0, 0, 0, 0))


def vignette(img):
    v = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(v)
    for i in range(40):
        k = i / 40
        d.rectangle([W * k * .22, H * k * .22, W - W * k * .22, H - H * k * .22], fill=round(200 * (1 - k) ** 2))
    v = v.filter(ImageFilter.GaussianBlur(60))
    dark = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    dark.putalpha(v)
    hole = img.getchannel('A')
    img.alpha_composite(dark)
    img.putalpha(hole)   # keep the opening transparent


img = Image.new('RGBA', (W, H), (0, 0, 0, 255))
walls(img); seams(img); dust(img); opening(img); vignette(img)
img.save(OUT, optimize=True)
print('wrote', os.path.normpath(OUT))
