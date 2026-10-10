"""Painted door toolkit - materials and hardware, rendered at 2x then downsampled.

Final door image: 520 x 1280 (game door 130 x 320 world px, 4x like the team's floor16 door art).
Coordinates below are in FINAL pixels; S scales them to the internal canvas.
"""
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter

S = 2
FW, FH = 520, 1280
W, H = FW * S, FH * S
FRAME = 30                        # casing width (final px)
LX0, LX1, LY0 = FRAME, FW - FRAME, FRAME   # door leaf box
LY1 = FH - 14                     # leaf bottom (threshold below)


def P(v):
    return int(round(v * S))


# ------------------------------------------------------------------ noise / masks
def noise(h, w, sigma, seed):
    rng = np.random.default_rng(seed)
    n = gaussian_filter(rng.standard_normal((h, w)).astype(np.float32), sigma)
    return n / (n.std() + 1e-6)


def streaks(h, w, seed, along='v', length=60, width=0.6):
    rng = np.random.default_rng(seed)
    n = rng.standard_normal((h, w)).astype(np.float32)
    sig = (length, width) if along == 'v' else (width, length)
    n = gaussian_filter(n, sig)
    return n / (n.std() + 1e-6)


def mask(fn, r=0.0):
    m = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(m)
    d.ink = 255; d.fill = True
    fn(d)
    a = np.asarray(m, np.float32) / 255
    return gaussian_filter(a, r * S) if r else a


def R(x0, y0, x1, y1):
    return [P(x0), P(y0), P(x1), P(y1)]


# ------------------------------------------------------------------ materials (return float RGB arrays, full canvas)
def mat_paint(base, seed, mott=0.03):
    a = np.ones((H, W, 3), np.float32) * np.array(base, np.float32)
    a *= (1 + mott * 0.55 * noise(H, W, P(45), seed))[..., None]
    a *= (1 + 0.01 * noise(H, W, P(6), seed + 9))[..., None]
    a *= (1 + 0.012 * noise(H, W, P(2), seed + 1))[..., None]                 # orange-peel
    return a


def mat_brushed(base, seed, along='v', sheen=0.10):
    a = np.ones((H, W, 3), np.float32) * np.array(base, np.float32)
    a *= (1 + 0.03 * streaks(H, W, seed, along, length=P(70), width=P(0.4)))[..., None]
    a *= (1 + 0.025 * noise(H, W, P(40), seed + 2))[..., None]
    # broad soft reflection band
    xs = np.linspace(0, 1, W)[None, :] if along == 'v' else np.linspace(0, 1, H)[:, None]
    band = np.exp(-((xs - 0.32) / 0.12) ** 2) * sheen
    a *= (1 + band)[..., None] if along == 'v' else (1 + band)[..., None]
    return a


def mat_wood(base, seed, vertical=True, ring=0.12):
    """straight-grained veneer: fine parallel grain lines with gentle long waves, no marbling"""
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    warp = gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), (P(220), P(30)) if vertical else (P(30), P(220)))
    warp = warp / (warp.std() + 1e-6) * P(4)
    u = (xx if vertical else yy) + warp
    period = P(rng.uniform(3.2, 4.4))
    grain = 0.5 + 0.5 * np.sin(u / period)
    grain = grain ** 2
    fib = streaks(H, W, seed + 5, 'v' if vertical else 'h', length=P(120), width=P(0.4))
    band = gaussian_filter(rng.standard_normal((1, W) if vertical else (H, 1)).astype(np.float32), (0, P(10)) if vertical else (P(10), 0))
    band = np.broadcast_to(band / (band.std() + 1e-6), (H, W))
    a = np.ones((H, W, 3), np.float32) * np.array(base, np.float32)
    a *= (1 - ring * grain)[..., None]
    a *= (1 + 0.035 * fib)[..., None]
    a *= (1 + 0.05 * band)[..., None]                                          # wider light/dark veneer stripes
    return a


def mat_lacquer(base, seed, grain=0.04):
    a = mat_wood(base, seed, ring=grain)
    xs = np.linspace(0, 1, W)[None, :]
    a *= (1 + 0.22 * np.exp(-((xs - 0.28) / 0.05) ** 2) + 0.10 * np.exp(-((xs - 0.36) / 0.02) ** 2))[..., None]   # gloss streaks
    return a


def mat_glass_dark(seed, tint=(30, 40, 48), interior=True):
    a = np.ones((H, W, 3), np.float32) * np.array(tint, np.float32)
    yy = np.linspace(0, 1, H)[:, None]
    a *= (1.15 - 0.35 * yy)[..., None]
    if interior:                                                               # blurred shapes of a dark room behind
        rng = random.Random(seed)
        m = np.zeros((H, W), np.float32)
        for _ in range(10):
            x0 = rng.uniform(0, W); y0 = rng.uniform(H * 0.35, H * 0.9)
            w = rng.uniform(P(30), P(160)); h = rng.uniform(P(30), P(200))
            m = np.maximum(m, mask(lambda d: d.rectangle([x0, y0, x0 + w, y0 + h])) * rng.uniform(0.3, 1))
        m = gaussian_filter(m, P(6))
        a *= (1 - 0.35 * m)[..., None]
    return a


def mat_frosted(base, seed):
    a = np.ones((H, W, 3), np.float32) * np.array(base, np.float32)
    yy = np.linspace(0, 1, H)[:, None]
    a *= (1.06 - 0.12 * yy)[..., None]
    a *= (1 + 0.02 * noise(H, W, P(25), seed))[..., None]
    a += (np.random.default_rng(seed).random((H, W)).astype(np.float32)[..., None] - 0.5) * 4
    return a


# ------------------------------------------------------------------ door canvas
class Door:
    def __init__(self, wall=(58, 62, 66)):
        self.rgb = np.ones((H, W, 3), np.float32) * np.array(wall, np.float32)

    def put(self, m, src, alpha=1.0):
        """composite material/colour through a mask"""
        if not isinstance(src, np.ndarray):
            src = np.array(src, np.float32)
        k = (m * alpha)[..., None]
        self.rgb = self.rgb * (1 - k) + src * k

    def shade(self, m, k):
        self.rgb *= (1 + k * m)[..., None]

    def rect(self, box, src, r=0.5, alpha=1.0):
        self.put(mask(lambda d: d.rectangle(R(*box)), r), src, alpha)

    def rrect(self, box, rad, src, r=0.5, alpha=1.0):
        self.put(mask(lambda d: d.rounded_rectangle(R(*box), radius=P(rad)), r), src, alpha)

    def ellipse(self, box, src, r=0.5, alpha=1.0):
        self.put(mask(lambda d: d.ellipse(R(*box)), r), src, alpha)

    def poly(self, pts, src, r=0.5, alpha=1.0):
        self.put(mask(lambda d: d.polygon([(P(x), P(y)) for x, y in pts]), r), src, alpha)

    def line(self, pts, src, w=1.0, r=0.4, alpha=1.0):
        self.put(mask(lambda d: d.line([(P(x), P(y)) for x, y in pts], fill=255, width=max(1, P(w))), r), src, alpha)

    # --- shading helpers
    def bevel(self, box, depth=6, raised=True, hi=0.22, lo=0.30):
        """light from top-left: raised -> bright top/left, dark bottom/right; inset -> reversed"""
        x0, y0, x1, y1 = box
        top = mask(lambda d: d.polygon([(P(x0), P(y0)), (P(x1), P(y0)), (P(x1 - depth), P(y0 + depth)), (P(x0 + depth), P(y0 + depth))]), 0.6)
        left = mask(lambda d: d.polygon([(P(x0), P(y0)), (P(x0 + depth), P(y0 + depth)), (P(x0 + depth), P(y1 - depth)), (P(x0), P(y1))]), 0.6)
        bot = mask(lambda d: d.polygon([(P(x0), P(y1)), (P(x0 + depth), P(y1 - depth)), (P(x1 - depth), P(y1 - depth)), (P(x1), P(y1))]), 0.6)
        right = mask(lambda d: d.polygon([(P(x1), P(y0)), (P(x1), P(y1)), (P(x1 - depth), P(y1 - depth)), (P(x1 - depth), P(y0 + depth))]), 0.6)
        s = 1 if raised else -1
        self.shade(top, s * hi); self.shade(left, s * hi * 0.7)
        self.shade(bot, -s * lo); self.shade(right, -s * lo * 0.8)

    def drop_shadow(self, box, off=4, blur=5, k=-0.45, rad=0):
        x0, y0, x1, y1 = box
        m = mask(lambda d: d.rounded_rectangle(R(x0 + off * 0.5, y0 + off, x1 + off, y1 + off), radius=P(rad)) if rad else d.rectangle(R(x0 + off * 0.5, y0 + off, x1 + off, y1 + off)), blur)
        self.shade(m, k)

    def outline(self, box, col=(14, 15, 16), w=1.5):
        self.put(mask(lambda d: d.rectangle(R(*box), outline=255, width=max(1, P(w)))), col)

    # --- standard parts
    def frame(self, src, depth=10):
        """casing: top + both sides, with bevel and inner shadow onto the leaf"""
        m = mask(lambda d: [d.rectangle(R(0, 0, FW, FRAME)), d.rectangle(R(0, 0, FRAME, FH)), d.rectangle(R(FW - FRAME, 0, FW, FH))])
        self.put(m, src)
        self.bevel((0, 0, FW, FH), depth=8, raised=True, hi=0.18, lo=0.25)
        # inner reveal edges of the casing
        self.shade(mask(lambda d: d.rectangle(R(FRAME - 4, FRAME - 4, FW - FRAME + 4, FRAME))), -0.25)
        self.shade(mask(lambda d: d.rectangle(R(FRAME - 4, FRAME, FRAME, FH))), -0.25)
        self.shade(mask(lambda d: d.rectangle(R(FW - FRAME, FRAME, FW - FRAME + 4, FH))), 0.12)

    def leaf(self, src, box=None):
        box = box or (LX0, LY0, LX1, LY1)
        self.rect(box, src, r=0.3)
        # shadow cast by the head of the casing onto the leaf
        self.shade(mask(lambda d: d.rectangle(R(box[0], box[1], box[2], box[1] + 18)), 8) * mask(lambda d: d.rectangle(R(*box))), -0.28)
        self.shade(mask(lambda d: d.rectangle(R(box[0], box[1], box[0] + 10, box[3])), 6) * mask(lambda d: d.rectangle(R(*box))), -0.18)
        self.outline(box, w=2)

    def threshold(self, col=(120, 118, 110)):
        self.rect((0, LY1, FW, FH), np.array(col, np.float32) * 0.6)
        self.rect((LX0 - 6, LY1, LX1 + 6, LY1 + 6), col)
        self.shade(mask(lambda d: d.rectangle(R(LX0 - 6, LY1, LX1 + 6, LY1 + 2))), 0.3)

    def hinge(self, x, y, h=60, side='L', metal=(150, 150, 146)):
        x0 = x - 5 if side == 'L' else x - 3
        self.drop_shadow((x0, y, x0 + 9, y + h), off=2, blur=2)
        self.rrect((x0, y, x0 + 9, y + h), 2, metal)
        g = np.linspace(1.25, 0.75, W)[None, :, None]
        self.shade(mask(lambda d: d.rectangle(R(x0, y, x0 + 3, y + h))), 0.25)
        for k in range(3):
            self.ellipse((x0 + 2, y + 8 + k * (h - 16) / 2 - 2, x0 + 7, y + 8 + k * (h - 16) / 2 + 3), (80, 80, 78))

    def lever(self, x, y, side='R', metal=(176, 176, 172)):
        """lever handle on a round rose; side = where the lever points"""
        self.drop_shadow((x - 14, y - 14, x + 14, y + 14), off=3, blur=3, rad=14)
        self.ellipse((x - 14, y - 14, x + 14, y + 14), np.array(metal) * 0.82)
        self.ellipse((x - 10, y - 10, x + 10, y + 10), metal)
        dx = -1 if side == 'L' else 1
        x1 = x + dx * 70
        bar = (min(x, x1), y - 6, max(x, x1), y + 6)
        self.drop_shadow(bar, off=4, blur=3)
        self.rrect(bar, 6, metal)
        self.shade(mask(lambda d: d.rectangle(R(bar[0], bar[1], bar[2], bar[1] + 3))), 0.35)
        self.shade(mask(lambda d: d.rectangle(R(bar[0], bar[3] - 3, bar[2], bar[3]))), -0.35)
        # key cylinder below
        self.ellipse((x - 7, y + 38, x + 7, y + 52), np.array(metal) * 0.9)
        self.rect((x - 1.5, y + 40, x + 1.5, y + 50), (40, 40, 40))

    def pull_bar(self, x, y0, y1, metal=(180, 180, 176), w=10):
        for yy in (y0 + 14, y1 - 14):
            self.rect((x - 12, yy - 4, x, yy + 4), np.array(metal) * 0.8)
        self.drop_shadow((x - 2, y0, x + w, y1), off=5, blur=4)
        self.rrect((x - 2, y0, x + w, y1), w / 2, metal)
        self.shade(mask(lambda d: d.rectangle(R(x - 2, y0, x + 1, y1))), 0.4)
        self.shade(mask(lambda d: d.rectangle(R(x + w - 3, y0, x + w, y1))), -0.35)

    def push_bar(self, y, x0=None, x1=None, metal=(170, 170, 166)):
        x0 = x0 or LX0 + 30; x1 = x1 or LX1 - 30
        for xx in (x0, x1 - 26):
            self.drop_shadow((xx, y - 22, xx + 26, y + 22), off=3, blur=3)
            self.rrect((xx, y - 22, xx + 26, y + 22), 4, np.array(metal) * 0.75)
        bar = (x0 + 20, y - 9, x1 - 20, y + 9)
        self.drop_shadow(bar, off=5, blur=4)
        self.rrect(bar, 9, metal)
        self.shade(mask(lambda d: d.rectangle(R(bar[0], bar[1], bar[2], bar[1] + 5))), 0.35)
        self.shade(mask(lambda d: d.rectangle(R(bar[0], bar[3] - 5, bar[2], bar[3]))), -0.3)

    def kick_plate(self, h=90, metal=(160, 160, 156), seed=1):
        box = (LX0 + 4, LY1 - h, LX1 - 4, LY1 - 4)
        self.put(mask(lambda d: d.rectangle(R(*box)), 0.4), mat_brushed(metal, seed, 'h', sheen=0.06))
        self.bevel(box, depth=3, raised=True, hi=0.2, lo=0.25)
        for sx in (box[0] + 10, box[2] - 10):
            for sy in (box[1] + 10, box[3] - 10):
                self.ellipse((sx - 3, sy - 3, sx + 3, sy + 3), (90, 90, 88))
        self.scuffs(box, seed)

    def scuffs(self, box, seed, n=18, light=True):
        rng = random.Random(seed)
        x0, y0, x1, y1 = box
        for _ in range(n):
            x = rng.uniform(x0, x1); y = rng.uniform(y0, y1); L = rng.uniform(8, 40); a = rng.uniform(-0.4, 0.4)
            pts = [(x, y), (x + math.cos(a) * L, y + math.sin(a) * L)]
            self.line(pts, (220, 220, 214) if light else (20, 20, 20), w=rng.uniform(0.6, 1.4), alpha=rng.uniform(0.15, 0.35))

    def wear(self, seed, k=0.10):
        """edge wear on the leaf + grime near the bottom and around the handle area"""
        rng = random.Random(seed)
        edges = mask(lambda d: [d.rectangle(R(LX0, LY0, LX0 + 5, LY1)), d.rectangle(R(LX1 - 5, LY0, LX1, LY1))], 2)
        edges *= (noise(H, W, P(6), seed) > 0.6)
        self.shade(gaussian_filter(edges.astype(np.float32), P(0.6)), k * 2)
        grime = mask(lambda d: d.rectangle(R(LX0, LY1 - 140, LX1, LY1)), 30)
        self.shade(grime * (0.6 + 0.4 * np.clip(noise(H, W, P(20), seed + 1), -1, 1)), -0.10)

    def vision(self, box, shape='rect', seed=1, frame=(60, 62, 64), wired=False, src=None):
        x0, y0, x1, y1 = box
        src = mat_glass_dark(seed) if src is None else src
        if shape == 'round':
            self.ellipse((x0 - 8, y0 - 8, x1 + 8, y1 + 8), frame)
            self.bevel((x0 - 8, y0 - 8, x1 + 8, y1 + 8), depth=5, raised=True)
            self.put(mask(lambda d: d.ellipse(R(*box)), 0.5), src)
            shape_m = mask(lambda d: d.ellipse(R(*box)))
        else:
            self.rect((x0 - 7, y0 - 7, x1 + 7, y1 + 7), frame)
            self.bevel((x0 - 7, y0 - 7, x1 + 7, y1 + 7), depth=4, raised=True)
            self.put(mask(lambda d: d.rectangle(R(*box)), 0.4), src)
            shape_m = mask(lambda d: d.rectangle(R(*box)))
        if wired:
            for gx in np.arange(x0, x1, 14):
                self.line([(gx, y0), (gx, y1)], (150, 156, 158), w=0.8, alpha=0.45)
            for gy in np.arange(y0, y1, 14):
                self.line([(x0, gy), (x1, gy)], (150, 156, 158), w=0.8, alpha=0.45)
            self.rgb = self.rgb * (1 - shape_m[..., None]) + self.rgb * shape_m[..., None]
        # reflections on the glass
        refl = mask(lambda d: d.polygon([(P(x0 + (x1 - x0) * 0.55), P(y0)), (P(x0 + (x1 - x0) * 0.75), P(y0)), (P(x0 + (x1 - x0) * 0.25), P(y1)), (P(x0 + (x1 - x0) * 0.05), P(y1))]), 3)
        self.put(refl * shape_m, (200, 214, 224), 0.16)
        self.shade(mask(lambda d: d.rectangle(R(x0, y0, x1, y0 + 8)), 4) * shape_m, -0.3)

    def louver(self, box, col=(70, 72, 74)):
        x0, y0, x1, y1 = box
        self.rect((x0 - 6, y0 - 6, x1 + 6, y1 + 6), np.array(col) * 1.1)
        self.bevel((x0 - 6, y0 - 6, x1 + 6, y1 + 6), depth=4, raised=True)
        self.rect(box, (18, 19, 20))
        for yy in np.arange(y0 + 4, y1 - 4, 11):
            self.poly([(x0, yy), (x1, yy), (x1, yy + 6), (x0, yy + 9)], col)
            self.shade(mask(lambda d: d.rectangle(R(x0, yy, x1, yy + 2))), 0.35)

    def card_reader(self, x, y, led=(220, 60, 50)):
        self.drop_shadow((x, y, x + 34, y + 70), off=3, blur=3, rad=4)
        self.rrect((x, y, x + 34, y + 70), 4, (32, 34, 37))
        self.bevel((x, y, x + 34, y + 70), depth=3, raised=True)
        self.rrect((x + 6, y + 8, x + 28, y + 36), 3, (18, 20, 22))
        for k in range(3):
            self.line([(x + 10, y + 14 + k * 6), (x + 24, y + 14 + k * 6)], (52, 56, 60), w=0.8)
        self.ellipse((x + 13, y + 48, x + 21, y + 56), led)
        self.glow((x + 17, y + 52), 18, led, 0.5)

    def keypad(self, x, y):
        self.drop_shadow((x, y, x + 46, y + 74), off=3, blur=3, rad=4)
        self.rrect((x, y, x + 46, y + 74), 4, (40, 42, 45))
        self.bevel((x, y, x + 46, y + 74), depth=3, raised=True)
        self.rect((x + 6, y + 6, x + 40, y + 16), (16, 30, 26))
        for r in range(4):
            for c in range(3):
                bx, by = x + 7 + c * 12, y + 22 + r * 12
                self.rrect((bx, by, bx + 9, by + 9), 2, (120, 122, 124))
                self.shade(mask(lambda d: d.rectangle(R(bx, by + 6, bx + 9, by + 9))), -0.3)

    def plate(self, box, col=(180, 172, 140), border=(60, 56, 46), icon=None):
        self.drop_shadow(box, off=2, blur=2)
        self.rect(box, col)
        self.outline(box, border, 1.5)
        self.bevel(box, depth=2, raised=True, hi=0.25, lo=0.2)
        if icon:
            icon(self, box)

    def stripes(self, box, a=(200, 170, 40), b=(24, 24, 22), step=26):
        x0, y0, x1, y1 = box
        self.rect(box, b)
        for k in range(-int((y1 - y0) / step) - 2, int((x1 - x0) / step) + 2):
            sx = x0 + k * step
            m = mask(lambda d: d.polygon([(P(sx), P(y1)), (P(sx + step / 2), P(y1)), (P(sx + step / 2 + (y1 - y0)), P(y0)), (P(sx + (y1 - y0)), P(y0))])) * mask(lambda d: d.rectangle(R(*box)))
            self.put(m, a)

    def glow(self, c, rad, col, k):
        cx, cy = c
        m = mask(lambda d: d.ellipse(R(cx - rad, cy - rad, cx + rad, cy + rad)), rad * 0.5)
        self.rgb += (m * k)[..., None] * np.array(col, np.float32)

    def light(self):
        """global key light from the top-left + soft vignette"""
        yy = np.linspace(0, 1, H)[:, None]; xx = np.linspace(0, 1, W)[None, :]
        g = 1.07 - 0.10 * yy - 0.05 * xx
        self.rgb *= g[..., None]

    def render(self):
        self.light()
        out = np.stack([gaussian_filter(self.rgb[..., i], 0.5) for i in range(3)], -1)
        out += (np.random.default_rng(3).random(out.shape[:2]).astype(np.float32)[..., None] - 0.5) * 2.5
        img = Image.fromarray(out.clip(0, 255).round().astype(np.uint8), 'RGB').convert('RGBA')
        return img.resize((FW, FH), Image.LANCZOS)
