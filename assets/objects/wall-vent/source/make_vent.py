"""ARCHI wall vent (louvre grille) + pry-open states, matched to the v3 white wall set.

Vent: 120 x 96 game px (about 1.3 m x 1 m at the game's wall scale), canvas 132 x 108 incl. a 6px margin for the
soft contact shadow. Every state uses the SAME canvas and anchor, so the game only swaps the image.
Output 4x (528 x 432). Vent states have the walls' background filter (brightness .72 / saturate .85) baked in,
like the matched doors, so they sit on the wall at the same brightness.
"""
import sys, os, math, random
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

K = 8
M = 6                                   # margin (game px)
VW, VH = 120, 96                        # vent outer size
GW, GH = VW + 2 * M, VH + 2 * M
W, H = GW * K, GH * K
FR = 7                                  # frame width
X0, Y0, X1, Y1 = M, M, M + VW, M + VH   # outer frame box
IX0, IY0, IX1, IY1 = X0 + FR, Y0 + FR, X1 - FR, Y1 - FR

FRAME = np.array((176, 178, 178), np.float32)     # powder-coated steel, a step darker than the white wall
BLADE = np.array((198, 200, 200), np.float32)
DUCT = np.array((26, 28, 30), np.float32)


def P(v):
    return int(round(v * K))


def R(x0, y0, x1, y1):
    return [P(x0), P(y0), P(x1), P(y1)]


def mask(fn, r=0.0, w=W, h=H):
    m = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(m); d.ink = 255; d.fill = True
    fn(d)
    a = np.asarray(m, np.float32) / 255
    return gaussian_filter(a, r * K) if r else a


class C:
    def __init__(self):
        self.rgb = np.zeros((H, W, 3), np.float32)
        self.a = np.zeros((H, W), np.float32)

    def put(self, m, col, alpha=255.0):
        col = np.asarray(col, np.float32)
        self.rgb = self.rgb * (1 - m[..., None]) + col * m[..., None]
        self.a = np.maximum(self.a, m * alpha)

    def shade(self, m, k):
        self.rgb *= (1 + k * m)[..., None]

    def bevel(self, box, depth, raised=True, hi=0.22, lo=0.30, r=0.4):
        x0, y0, x1, y1 = box
        s = 1 if raised else -1
        top = mask(lambda d: d.polygon([(P(x0), P(y0)), (P(x1), P(y0)), (P(x1 - depth), P(y0 + depth)), (P(x0 + depth), P(y0 + depth))]), r)
        left = mask(lambda d: d.polygon([(P(x0), P(y0)), (P(x0 + depth), P(y0 + depth)), (P(x0 + depth), P(y1 - depth)), (P(x0), P(y1))]), r)
        bot = mask(lambda d: d.polygon([(P(x0), P(y1)), (P(x0 + depth), P(y1 - depth)), (P(x1 - depth), P(y1 - depth)), (P(x1), P(y1))]), r)
        right = mask(lambda d: d.polygon([(P(x1), P(y0)), (P(x1), P(y1)), (P(x1 - depth), P(y1 - depth)), (P(x1 - depth), P(y0 + depth))]), r)
        self.shade(top, s * hi); self.shade(left, s * hi * 0.7); self.shade(bot, -s * lo); self.shade(right, -s * lo * 0.8)

    def contact_shadow(self, box, k=0.55, blur=2.5, off=(1.2, 1.8)):
        x0, y0, x1, y1 = box
        m = mask(lambda d: d.rectangle(R(x0 + off[0], y0 + off[1], x1 + off[0], y1 + off[1])), blur)
        self.rgb = self.rgb * (1 - m[..., None] * k) + np.zeros(3) * m[..., None] * k
        self.a = np.maximum(self.a, m * 255 * k)

    def screw(self, x, y, popped=False, missing=False):
        if missing:                                                    # empty hole with a little torn paint
            self.put(mask(lambda d: d.ellipse(R(x - 2.2, y - 2.2, x + 2.2, y + 2.2)), 0.3), (60, 60, 58))
            self.put(mask(lambda d: d.ellipse(R(x - 1.2, y - 1.2, x + 1.2, y + 1.2)), 0.2), (18, 18, 18))
            return
        if popped:
            self.contact_shadow((x - 2, y - 2, x + 2, y + 2), 0.5, 0.8, (1.2, 1.6))
        self.put(mask(lambda d: d.ellipse(R(x - 2, y - 2, x + 2, y + 2)), 0.25), (150, 150, 146))
        self.shade(mask(lambda d: d.ellipse(R(x - 2, y - 2, x + 0.6, y + 0.6)), 0.4), 0.3)
        self.put(mask(lambda d: d.line([P(x - 1.3), P(y), P(x + 1.3), P(y)], fill=255, width=P(0.5))), (60, 60, 58))
        self.put(mask(lambda d: d.line([P(x), P(y - 1.3), P(x), P(y + 1.3)], fill=255, width=P(0.5))), (60, 60, 58))

    def bake(self, filt=True):
        rgb = np.stack([gaussian_filter(self.rgb[..., i], 0.5) for i in range(3)], -1)
        rgb += (np.random.default_rng(7).random(rgb.shape[:2]).astype(np.float32)[..., None] - 0.5) * 2.5
        if filt:
            rgb = rgb * 0.72
            lum = (rgb * np.array((0.2126, 0.7152, 0.0722), np.float32)).sum(-1, keepdims=True)
            rgb = lum + 0.85 * (rgb - lum)
        img = Image.fromarray(np.dstack([rgb, self.a]).clip(0, 255).round().astype(np.uint8), 'RGBA')
        return img.resize((GW * 4, GH * 4), Image.LANCZOS)


def duct_interior(c, box, dust=True):
    """dark duct seen through the opening: inner rim lit at the top, galvanised seams, dust, fading into black"""
    x0, y0, x1, y1 = box
    m = mask(lambda d: d.rectangle(R(*box)))
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32) / K
    # distance to the opening edge -> depth falloff
    dx = np.minimum(xx - x0, x1 - xx); dy = np.minimum(yy - y0, y1 - yy)
    depth = np.clip(np.minimum(dx, dy) / 14, 0, 1)
    col = DUCT[None, None, :] * (1.9 - 1.2 * depth[..., None])
    col *= (1 + 0.6 * np.clip((y0 + 10 - yy) / 10, 0, 1))[..., None]                   # top rim catches light
    # inner galvanised rim as a band
    rim = (np.minimum(dx, dy) < 5).astype(np.float32)
    rim = gaussian_filter(rim, K * 0.8)
    col = col * (1 - 0.6 * rim[..., None]) + np.array((92, 96, 98), np.float32) * 0.6 * rim[..., None] * (1.1 - 0.5 * (yy > (y0 + y1) / 2))[..., None]
    c.rgb = c.rgb * (1 - m[..., None]) + col * m[..., None]
    c.a = np.maximum(c.a, m * 255)
    # seam lines of the sheet metal duct, receding
    for k in range(3):
        sx = x0 + 10 + k * (x1 - x0 - 20) / 2
        c.put(mask(lambda d: d.line([P(sx), P(y0 + 4), P(sx), P(y0 + 12)], fill=255, width=P(0.6)), 0.3) * m, (70, 74, 76), 120)
    if dust:
        rng = random.Random(4)
        dust_m = mask(lambda d: [d.ellipse(R(px - 0.7, py - 0.4, px + 0.7, py + 0.4)) for px, py in
                                 [(rng.uniform(x0 + 3, x1 - 3), rng.uniform(y1 - 7, y1 - 3)) for _ in range(18)]], 0.3)
        c.put(dust_m * m, (96, 92, 86), 120)
        c.put(mask(lambda d: d.rectangle(R(x0 + 2, y1 - 4, x1 - 2, y1)), 1.5) * m, (70, 68, 64), 90)    # dust bed
        # a cobweb in the upper-left corner
        for k in range(5):
            a = k / 4 * math.pi / 2
            c.put(mask(lambda d: d.line([P(x0 + 1), P(y0 + 1), P(x0 + 1 + math.cos(a) * 12), P(y0 + 1 + math.sin(a) * 12)], fill=255, width=P(0.3))) * m, (150, 150, 146), 90)
        for r in (5, 9):
            c.put(mask(lambda d: d.arc(R(x0 + 1 - r, y0 + 1 - r, x0 + 1 + r, y0 + 1 + r), 0, 90, fill=255, width=P(0.3))) * m, (150, 150, 146), 80)


def louvre_cover(c, ox=0.0, oy=0.0, bent=False, popped=None, missing=()):
    """frame + horizontal blades. ox/oy shift; bent lifts the lower-right corner; popped/missing screw indices 0..3"""
    x0, y0, x1, y1 = X0 + ox, Y0 + oy, X1 + ox, Y1 + oy
    ix0, iy0, ix1, iy1 = x0 + FR, y0 + FR, x1 - FR, y1 - FR
    c.contact_shadow((x0, y0, x1, y1), 0.5 if not bent else 0.6, 2.2 if not bent else 3.2, (1.0, 1.6) if not bent else (2.0, 2.8))
    # gaps between the blades: dark duct
    duct_interior(c, (ix0, iy0, ix1, iy1), dust=False)
    # blades: pitch 4px, each with a lit top edge, body and a hard shadow line under it
    n = int((iy1 - iy0 - 2) / 4)
    for k in range(n):
        by = iy0 + 1.5 + k * 4
        m = mask(lambda d: d.rectangle(R(ix0, by, ix1, by + 2.6)), 0.15)
        t = np.clip((np.arange(H, dtype=np.float32) / K - by) / 2.6, 0, 1)[:, None, None]
        col = BLADE * (1.10 - 0.28 * t) * np.ones((1, W, 1))
        c.rgb = c.rgb * (1 - m[..., None]) + col * m[..., None]; c.a = np.maximum(c.a, m * 255)
        c.put(mask(lambda d: d.rectangle(R(ix0, by, ix1, by + 0.45))), BLADE * 1.18)
        c.put(mask(lambda d: d.rectangle(R(ix0, by + 2.6, ix1, by + 3.3)), 0.2), (34, 36, 38))
        # grime collecting on the lower blades
        if k > n * 0.6:
            g = mask(lambda d: d.rectangle(R(ix0, by + 1.6, ix1, by + 2.6)), 0.3)
            c.shade(g * (0.5 + 0.5 * np.clip(gaussian_filter(np.random.default_rng(k).standard_normal((H, W)).astype(np.float32), K * 3), -1, 1)), -0.10)
    # blade ends tucked under the frame
    c.shade(mask(lambda d: [d.rectangle(R(ix0, iy0, ix0 + 2, iy1)), d.rectangle(R(ix1 - 2, iy0, ix1, iy1))], 0.6), -0.25)
    # frame with bevel
    fm = mask(lambda d: [d.rectangle(R(x0, y0, x1, iy0)), d.rectangle(R(x0, iy1, x1, y1)), d.rectangle(R(x0, y0, ix0, y1)), d.rectangle(R(ix1, y0, x1, y1))], 0.2)
    fcol = FRAME[None, None, :] * (1 + 0.012 * gaussian_filter(np.random.default_rng(3).standard_normal((H, W)).astype(np.float32), K * 6)[..., None] * 8)
    c.rgb = c.rgb * (1 - fm[..., None]) + fcol * fm[..., None]; c.a = np.maximum(c.a, fm * 255)
    c.bevel((x0, y0, x1, y1), 2.2, True)
    c.bevel((ix0 - 1.2, iy0 - 1.2, ix1 + 1.2, iy1 + 1.2), 1.2, False, 0.18, 0.25)
    c.put(mask(lambda d: d.rectangle(R(x0, y0, x1, y1), outline=255, width=P(0.6)), 0.2), (90, 92, 92))
    # dirt line along the bottom edge of the frame
    c.shade(mask(lambda d: d.rectangle(R(x0 + 2, y1 - 3, x1 - 2, y1 - 1)), 0.8), -0.10)
    screws = [(x0 + FR / 2, y0 + FR / 2), (x1 - FR / 2, y0 + FR / 2), (x0 + FR / 2, y1 - FR / 2), (x1 - FR / 2, y1 - FR / 2)]
    for i, (sx, sy) in enumerate(screws):
        if i in missing:
            c.screw(sx, sy, missing=True)
        else:
            c.screw(sx, sy, popped=(popped == i))


def scratch_marks(c, pts, n=5, seed=1):
    rng = random.Random(seed)
    for (x, y) in pts:
        for _ in range(n):
            L = rng.uniform(2, 6); a = rng.uniform(-0.6, 0.6) + (math.pi if rng.random() < 0.5 else 0)
            c.put(mask(lambda d: d.line([P(x), P(y), P(x + math.cos(a) * L), P(y + math.sin(a) * L)], fill=255, width=P(0.45)), 0.15), (232, 232, 228), 200)


# ------------------------------------------------------------------ states
def closed():
    c = C(); louvre_cover(c); return c


def prying():
    """crowbar wedged under the lower-right corner: cover pulled out of the wall at that corner, gap shows the hole"""
    c = C()
    # the wall opening behind, visible through the widened gap
    duct_interior(c, (X0 + 4, Y0 + 4, X1 - 4, Y1 - 4), dust=False)
    tmp = C(); louvre_cover(tmp, ox=-1.0, oy=-0.6, bent=True, popped=3)
    # bend: shear the lower-right part of the cover a few px outward (down/right)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    wgt = np.clip((xx / W - 0.45) / 0.55, 0, 1) * np.clip((yy / H - 0.45) / 0.55, 0, 1)
    sx = (xx - wgt * P(4.5)).clip(0, W - 1).astype(np.int32); sy = (yy - wgt * P(3.0)).clip(0, H - 1).astype(np.int32)
    bent_rgb = tmp.rgb[sy, sx]; bent_a = tmp.a[sy, sx]
    k = bent_a[..., None] / 255
    c.rgb = c.rgb * (1 - k) + bent_rgb * k; c.a = np.maximum(c.a, bent_a)
    # a dark wedge-shaped gap along the lifted edges
    # thin dark gap + soft shadow only along the lifted corner (the cover is pulled toward the viewer there)
    gap = mask(lambda d: [d.line([P(X1 - 34), P(Y1 + 0.3), P(X1 + 3.2), P(Y1 + 2.6)], fill=255, width=P(1.1)),
                          d.line([P(X1 + 0.3), P(Y1 - 30), P(X1 + 3.4), P(Y1 + 2.4)], fill=255, width=P(1.1))], 0.3)
    c.put(gap, (10, 10, 10), 235)
    sh = mask(lambda d: d.polygon([(P(X1 - 34), P(Y1 + 1)), (P(X1 + 4), P(Y1 + 3.5)), (P(X1 + 5), P(Y1 - 30)), (P(X1 + 2), P(Y1 - 30))]), 1.6)
    c.rgb *= (1 - 0.35 * sh)[..., None]; c.a = np.maximum(c.a, sh * 90)
    scratch_marks(c, [(X1 - 2, Y1 + 1), (X1 - 10, Y1 + 1.5), (X1 + 2, Y1 - 8)], 6, 3)
    return c


def opened():
    """cover removed: rough opening in the wall, screw holes, clean outline where the frame sat, scratches"""
    c = C()
    # paler rectangle where the frame protected the paint + thin dirt outline
    c.put(mask(lambda d: d.rectangle(R(X0, Y0, X1, Y1)), 0.4), (232, 233, 233), 255)
    c.put(mask(lambda d: d.rectangle(R(X0, Y0, X1, Y1), outline=255, width=P(0.8)), 0.4), (150, 148, 140), 220)
    # rough cut edge of the board around the hole
    rng = random.Random(9)
    edge = [(X0 + 5 + rng.uniform(-0.6, 0.6), Y0 + 5 + rng.uniform(-0.6, 0.6))]
    for t in np.linspace(0, 1, 40)[1:]:
        edge.append((X0 + 5 + t * (VW - 10), Y0 + 5 + rng.uniform(-0.6, 0.6)))
    for t in np.linspace(0, 1, 30)[1:]:
        edge.append((X1 - 5 + rng.uniform(-0.6, 0.6), Y0 + 5 + t * (VH - 10)))
    for t in np.linspace(0, 1, 40)[1:]:
        edge.append((X1 - 5 - t * (VW - 10), Y1 - 5 + rng.uniform(-0.6, 0.6)))
    for t in np.linspace(0, 1, 30)[1:-1]:
        edge.append((X0 + 5 + rng.uniform(-0.6, 0.6), Y1 - 5 - t * (VH - 10)))
    c.put(mask(lambda d: d.polygon([(P(x), P(y)) for x, y in edge]), 0.3), (196, 196, 192), 255)   # exposed board edge
    duct_interior(c, (X0 + 7, Y0 + 7, X1 - 7, Y1 - 7), dust=True)
    c.shade(mask(lambda d: d.rectangle(R(X0 + 7, Y0 + 7, X1 - 7, Y0 + 9)), 0.6), 0.2)
    for (sx, sy) in [(X0 + FR / 2, Y0 + FR / 2), (X1 - FR / 2, Y0 + FR / 2), (X0 + FR / 2, Y1 - FR / 2), (X1 - FR / 2, Y1 - FR / 2)]:
        c.screw(sx, sy, missing=True)
    # crowbar gouges at the lower-right corner
    scratch_marks(c, [(X1 - 3, Y1 - 2), (X1 - 12, Y1 - 1), (X1 - 2, Y1 - 12)], 7, 5)
    c.put(mask(lambda d: d.polygon([(P(X1 - 16), P(Y1 - 1)), (P(X1 - 4), P(Y1 - 0.5)), (P(X1 - 3), P(Y1 - 3)), (P(X1 - 14), P(Y1 - 2.4))]), 0.3), (120, 116, 108), 230)
    return c


def cover_alone():
    """removed cover, slightly bent corner, two screws still hanging in it - drop it on the floor or rotate it in CSS"""
    c = C()
    tmp = C(); louvre_cover(tmp, popped=None, missing=(0, 2))
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    wgt = np.clip((xx / W - 0.6) / 0.4, 0, 1) * np.clip((yy / H - 0.6) / 0.4, 0, 1)
    sx = (xx - wgt * P(2.5)).clip(0, W - 1).astype(np.int32); sy = (yy - wgt * P(2.5)).clip(0, H - 1).astype(np.int32)
    c.rgb = tmp.rgb[sy, sx]; c.a = tmp.a[sy, sx]
    scratch_marks(c, [(X1 - 3, Y1 - 2), (X1 - 6, Y1 - 6)], 6, 8)
    return c


def crowbar():
    """inventory / prop crowbar (not filtered): one continuous red bar - gooseneck claw on the left, chisel on the right"""
    Z = 4
    w, h = 220 * Z, 64 * Z
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    OUTL, RED, RED_HI, RED_LO, STEEL = (24, 22, 22, 255), (170, 34, 28, 255), (226, 98, 82, 255), (110, 20, 16, 255), (176, 178, 178, 255)
    cx, cy, r = 46 * Z, 34 * Z, 20 * Z                      # gooseneck centre / radius; shaft runs along y = cy + r
    sy = cy + r
    def stroke(width, col):
        d.line([(cx, sy), (190 * Z, sy)], fill=col, width=width)
        d.arc([cx - r, cy - r, cx + r, cy + r], 90, 300, fill=col, width=width)
    stroke(13 * Z, OUTL)                                      # outline
    stroke(10 * Z, RED)
    d.line([(cx, sy - 3 * Z), (190 * Z, sy - 3 * Z)], fill=RED_HI, width=2 * Z)     # top highlight
    d.line([(cx, sy + 3 * Z), (190 * Z, sy + 3 * Z)], fill=RED_LO, width=2 * Z)
    d.arc([cx - r + 3 * Z, cy - r + 3 * Z, cx + r - 3 * Z, cy + r - 3 * Z], 110, 290, fill=RED_HI, width=2 * Z)
    # claw at the end of the gooseneck: worn steel, split in two
    ex, ey = cx + r * math.cos(math.radians(300)), cy + r * math.sin(math.radians(300))
    d.polygon([(ex - 6 * Z, ey - 5 * Z), (ex + 14 * Z, ey + 2 * Z), (ex + 12 * Z, ey + 7 * Z), (ex - 4 * Z, ey + 5 * Z)], fill=OUTL)
    d.polygon([(ex - 4 * Z, ey - 3 * Z), (ex + 12 * Z, ey + 3 * Z), (ex - 3 * Z, ey + 3 * Z)], fill=STEEL)
    d.line([(ex + 1 * Z, ey - 1 * Z), (ex + 9 * Z, ey + 3 * Z)], fill=OUTL, width=Z)
    # chisel end: worn steel, slight upward bend
    d.polygon([(190 * Z, sy - 6.5 * Z), (204 * Z, sy - 7.5 * Z), (214 * Z, sy - 10 * Z), (214 * Z, sy - 6 * Z), (204 * Z, sy + 6.5 * Z), (190 * Z, sy + 6.5 * Z)], fill=OUTL)
    d.polygon([(190 * Z, sy - 4.5 * Z), (203 * Z, sy - 5.5 * Z), (211 * Z, sy - 8 * Z), (203 * Z, sy + 4.5 * Z), (190 * Z, sy + 4.5 * Z)], fill=STEEL)
    d.line([(190 * Z, sy - 4 * Z), (203 * Z, sy - 5 * Z)], fill=(230, 232, 232, 255), width=Z)
    # paint chips along the shaft
    rng = random.Random(2)
    for _ in range(9):
        x = rng.uniform(70, 185) * Z
        d.ellipse([x, sy - 2 * Z, x + rng.uniform(1.5, 3.5) * Z, sy + 1 * Z], fill=(150, 150, 146, 255))
    img = img.filter(__import__('PIL.ImageFilter', fromlist=['GaussianBlur']).GaussianBlur(Z * 0.35))
    return img.resize((220, 64), Image.LANCZOS)

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/vent/out'
    which = sys.argv[2:]
    os.makedirs(out, exist_ok=True)
    jobs = [('vent-closed', closed), ('vent-prying', prying), ('vent-open', opened), ('vent-cover-removed', cover_alone)]
    for name, fn in jobs:
        if which and name not in which:
            continue
        fn().bake().save(os.path.join(out, f'{name}.png'))
        print(name, flush=True)
    if not which or 'crowbar' in which:
        crowbar().save(os.path.join(out, 'crowbar.png')); print('crowbar')
