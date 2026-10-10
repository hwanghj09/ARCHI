"""ARCHI doors matched to the v3 wall set.

Door box in game px: 130 x 320, drawn at doorY=250 -> covers wall y 250..570.
Output image 520 x 1280 (4x), RGBA: glass areas stay translucent so the wall background behind shows through,
exactly like the glass walls. Colours/profiles are the wall script's values, and the game's background filter
(brightness .72 / saturate .85, applied to walls only) is BAKED in so door and wall read the same on screen.

Styles : frameless (통유리, double)  /  framed (프레임, single, wall-frame profile)  /  auto (자동 미닫이, double)
Glass  : clear / frosted / mixed   (mixed film edge at wall y=330 = door y 80, same as the walls)
Solid  : white-wall doors (painted leaf in the same aluminium frame)
"""
import sys, os, math, random
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

K = 8                                  # internal px per game px
GW, GH = 130, 320                      # door box (game px)
W, H = GW * K, GH * K
OUT_W, OUT_H = 520, 1280
DOOR_Y = 250                           # wall y of the door top
WALL_TOP_GLASS, WALL_BOT_GLASS = 106, 552
FILM_Y = 330 - DOOR_Y                  # 80
BOT = 552 - DOOR_Y                     # 302 : glass bottom on the walls
FLOOR = 320

FRAME = np.array((52, 56, 60), np.float32)
HI, LO = np.array((128, 134, 140), np.float32), np.array((20, 22, 24), np.float32)
GLASS_TINT = np.array((52, 70, 84), np.float32)
FILM_TOP = np.array((104, 110, 115), np.float32)
FILM_BOT = np.array((88, 94, 99), np.float32)


def P(v):
    return int(round(v * K))


def mask(fn, r=0.0):
    m = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(m); d.ink = 255; d.fill = True
    fn(d)
    a = np.asarray(m, np.float32) / 255
    return gaussian_filter(a, r * K) if r else a


def R(x0, y0, x1, y1):
    return [P(x0), P(y0), P(x1), P(y1)]


class Canvas:
    def __init__(self):
        self.rgb = np.zeros((H, W, 3), np.float32)
        self.a = np.zeros((H, W), np.float32)

    def put(self, m, col, alpha=255.0):
        col = np.asarray(col, np.float32)
        k = m[..., None] if col.ndim == 1 else m[..., None]
        self.rgb = self.rgb * (1 - k) + col * k
        self.a = np.maximum(self.a * (1 - m), m * alpha) if np.isscalar(alpha) else self.a * (1 - m) + m * alpha

    # --- glass fill exactly like the walls (alpha and film follow the wall's y)
    def glass(self, box, mode, film_from=None):
        x0, y0, x1, y1 = box
        m = mask(lambda d: d.rectangle(R(x0, y0, x1, y1)))
        yy = (np.arange(H, dtype=np.float32) / K)[:, None]
        wall_y = yy + DOOR_Y
        a_clear = 38 + 26 * np.clip((wall_y - WALL_TOP_GLASS) / (WALL_BOT_GLASS - WALL_TOP_GLASS), 0, 1)
        ff = {'clear': 10 ** 6, 'frosted': -10 ** 6, 'mixed': FILM_Y}[mode]
        film = (yy >= ff).astype(np.float32) * np.ones((1, W), np.float32)
        t = np.clip((yy - max(ff, 0)) / max(1, BOT - max(ff, 0)), 0, 1)[..., None]
        film_col = FILM_TOP * (1 - t) + FILM_BOT * t
        xs = np.linspace(-1, 1, W)[None, :]
        film_col = film_col * (1 + 0.04 * np.exp(-(xs / 0.6) ** 2))[..., None]
        film_col = film_col + (np.random.default_rng(5).random((H, W)).astype(np.float32)[..., None] - 0.5) * 3
        col = GLASS_TINT * (1 - film[..., None]) + film_col * film[..., None]
        alpha = a_clear * np.ones((1, W)) * (1 - film) + 222 * film
        self.rgb = self.rgb * (1 - m[..., None]) + col * m[..., None]
        self.a = self.a * (1 - m) + alpha * m
        # strips at the shared line (door y 80)
        if mode == 'mixed':
            e = mask(lambda d: d.rectangle(R(x0, FILM_Y - 1, x1, FILM_Y + 1)), 0.4) * m
            self.rgb = self.rgb * (1 - e[..., None]) + np.array((160, 166, 168)) * e[..., None]; self.a = np.maximum(self.a, e * 235)
            sh = mask(lambda d: d.rectangle(R(x0, FILM_Y - 6, x1, FILM_Y - 1)), 2) * m * (yy < FILM_Y)
            self.a = np.maximum(self.a, sh * 60)
        else:
            e = mask(lambda d: d.rectangle(R(x0, FILM_Y - 3, x1, FILM_Y + 3)), 0.5) * m
            col = np.array((150, 156, 160)) if mode == 'clear' else np.array((96, 102, 108))
            k = 0.7 if mode == 'clear' else 1.0
            self.rgb = self.rgb * (1 - e[..., None] * k) + col * e[..., None] * k
            self.a = np.maximum(self.a, e * (120 if mode == 'clear' else 230))
        # diagonal reflections (same strengths as the walls)
        rng = random.Random(int(x0 * 7 + y0))
        refl = np.zeros((H, W), np.float32)
        bx = x0 + rng.uniform(0.2, 0.5) * (x1 - x0)
        for (bw, al, r) in ((0.30 * (x1 - x0), 0.10, 10), (0.06 * (x1 - x0), 0.16, 1.5)):
            mm = mask(lambda d: d.polygon([(P(bx), P(y0)), (P(bx + bw), P(y0)), (P(bx + bw - 120), P(y1)), (P(bx - 120), P(y1))]), r)
            refl = np.maximum(refl, mm * al)
            bx += 0.35 * (x1 - x0)
        refl *= m
        k = refl if mode == 'clear' else refl * 0.6
        self.rgb = self.rgb * (1 - k[..., None]) + np.array((200, 214, 226)) * k[..., None]
        self.a = np.maximum(self.a, k * 255 * 0.9)
        # glazing-bead shadow along the inside edges
        bead = mask(lambda d: d.rectangle(R(x0, y0, x1, y1), outline=255, width=P(2.5)), 0.8) * m
        self.rgb = self.rgb * (1 - bead[..., None] * 0.6) + LO * bead[..., None] * 0.6
        self.a = np.maximum(self.a, bead * 200)

    # --- aluminium members with the wall's profile
    def vmember(self, x0, x1, y0, y1):
        m = mask(lambda d: d.rectangle(R(x0, y0, x1, y1)))
        t = np.clip((np.arange(W, dtype=np.float32) / K - x0) / max(0.01, x1 - x0), 0, 1)[None, :, None]
        prof = FRAME * (1.25 - 0.55 * t)
        self.rgb = self.rgb * (1 - m[..., None]) + prof * m[..., None]; self.a = np.maximum(self.a, m * 255)
        self.put(mask(lambda d: d.rectangle(R(x0 + 1, y0, x0 + 1.8, y1))) * m, HI)
        self.put(mask(lambda d: d.rectangle(R(x1 - 1.2, y0, x1, y1))) * m, LO)

    def hmember(self, y0, y1, x0=0, x1=GW, top_light=True):
        m = mask(lambda d: d.rectangle(R(x0, y0, x1, y1)))
        t = np.clip((np.arange(H, dtype=np.float32) / K - y0) / max(0.01, y1 - y0), 0, 1)[:, None, None]
        prof = FRAME * ((1.3 - 0.6 * t) if top_light else (0.8 + 0.4 * t))
        self.rgb = self.rgb * (1 - m[..., None]) + prof * m[..., None]; self.a = np.maximum(self.a, m * 255)
        self.put(mask(lambda d: d.rectangle(R(x0, y0, x1, y0 + 1))) * m, (130, 136, 142))
        self.put(mask(lambda d: d.rectangle(R(x0, y1 - 1, x1, y1))) * m, (18, 20, 22))

    def threshold(self):
        self.hmember(BOT + 6, FLOOR, top_light=True)
        self.put(mask(lambda d: d.rectangle(R(0, FLOOR - 4, GW, FLOOR))), (150, 150, 146))
        self.put(mask(lambda d: d.rectangle(R(0, FLOOR - 4, GW, FLOOR - 3.4))), (200, 200, 196))

    def lever(self, x, y, side='L', metal=(160, 160, 156)):
        metal = np.array(metal, np.float32)
        self.shadow((x - 6, y - 6, x + 6, y + 6), 1.5)
        self.put(mask(lambda d: d.ellipse(R(x - 5.5, y - 5.5, x + 5.5, y + 5.5)), 0.3), metal * 0.8)
        self.put(mask(lambda d: d.ellipse(R(x - 4, y - 4, x + 4, y + 4)), 0.3), metal)
        x1 = x - 22 if side == 'L' else x + 22
        bar = (min(x, x1), y - 2.2, max(x, x1), y + 2.2)
        self.shadow(bar, 2)
        self.put(mask(lambda d: d.rounded_rectangle(R(*bar), radius=P(2.2)), 0.3), metal)
        self.put(mask(lambda d: d.rectangle(R(bar[0], bar[1], bar[2], bar[1] + 1))), metal * 1.25)
        self.put(mask(lambda d: d.ellipse(R(x - 2.5, y + 12, x + 2.5, y + 17)), 0.3), metal * 0.9)

    def shadow(self, box, off=2.0, k=0.45):
        x0, y0, x1, y1 = box
        m = mask(lambda d: d.rectangle(R(x0 + off * 0.5, y0 + off, x1 + off, y1 + off)), off * 0.8)
        self.rgb *= (1 - k * m)[..., None]
        self.a = np.maximum(self.a, m * 255 * k * 0.6)

    def bake(self, filter_bg=True):
        out_w, out_h = GW * 4, GH * 4
        rgb = np.stack([gaussian_filter(self.rgb[..., i], 0.6) for i in range(3)], -1)
        a = gaussian_filter(self.a, 0.4)
        if filter_bg:                                                # what CSS does to the wall background
            rgb = rgb * 0.72
            lum = (rgb * np.array((0.2126, 0.7152, 0.0722), np.float32)).sum(-1, keepdims=True)
            rgb = lum + 0.85 * (rgb - lum)
        img = Image.fromarray(np.dstack([rgb, a]).clip(0, 255).round().astype(np.uint8), 'RGBA')
        return img.resize((out_w, out_h), Image.LANCZOS)


# ------------------------------------------------------------------ the three glass door styles
def framed(mode):
    """single leaf in the wall's aluminium profile (ref. image 2 frame, matched to the glass wall)"""
    c = Canvas()
    c.vmember(0, 6, 0, BOT + 6); c.vmember(GW - 6, GW, 0, BOT + 6)       # jambs = wall mullion profile
    c.hmember(0, 6)                                                       # head = the wall transom line
    lx0, lx1, ly0, ly1 = 7, GW - 7, 7, BOT + 6
    c.glass((lx0 + 8, ly0 + 8, lx1 - 8, ly1 - 22), mode)
    c.vmember(lx0, lx0 + 8, ly0, ly1); c.vmember(lx1 - 8, lx1, ly0, ly1)
    c.hmember(ly0, ly0 + 8); c.hmember(ly1 - 22, ly1, top_light=True)      # deep kick rail
    for y in (40, 150, 270):                                               # hinges
        c.put(mask(lambda d: d.rectangle(R(5.5, y, 8, y + 16)), 0.3), (120, 124, 128))
    c.lever(lx1 - 14, 170, 'L')
    c.threshold()
    return c


def frameless(mode):
    """double frameless glass doors with patch fittings and long H pull handles (ref. image 1)"""
    c = Canvas()
    c.vmember(0, 4, 0, BOT + 6); c.vmember(GW - 4, GW, 0, BOT + 6)       # slim channel jambs
    c.hmember(0, 6)                                                       # head rail = transom line
    mid = GW / 2
    for gx0, gx1 in ((5, mid - 1), (mid + 1, GW - 5)):
        c.glass((gx0, 7, gx1, BOT + 4), mode)
        c.put(mask(lambda d: d.rectangle(R(gx0, 7, gx0 + 0.8, BOT + 4))), (170, 180, 186), 140)   # polished glass edges
        c.put(mask(lambda d: d.rectangle(R(gx1 - 0.8, 7, gx1, BOT + 4))), (170, 180, 186), 140)
    c.put(mask(lambda d: d.rectangle(R(mid - 1, 7, mid + 1, BOT + 4))), (14, 16, 18), 160)          # leaf gap
    for (fx, fy) in ((5, 7), (GW - 21, 7), (5, BOT - 12), (GW - 21, BOT - 12)):                 # patch fittings
        c.shadow((fx, fy, fx + 16, fy + 14), 1.5)
        c.put(mask(lambda d: d.rounded_rectangle(R(fx, fy, fx + 16, fy + 14), radius=P(1.5)), 0.3), (70, 74, 78))
        c.put(mask(lambda d: d.rectangle(R(fx, fy, fx + 16, fy + 1))), (130, 136, 142))
    # long matt-black H pull handles either side of the centre with a small lock between (ref. image 1)
    for hx in (mid - 9, mid + 6):
        c.shadow((hx, 120, hx + 3, 230), 2.5)
        c.put(mask(lambda d: d.rounded_rectangle(R(hx, 120, hx + 3, 230), radius=P(1.5)), 0.3), (28, 29, 31))
        c.put(mask(lambda d: d.rectangle(R(hx, 120, hx + 0.8, 230))), (80, 82, 86))
    c.put(mask(lambda d: d.rectangle(R(mid - 12, 160, mid + 12, 163)), 0.3), (28, 29, 31))
    c.put(mask(lambda d: d.rounded_rectangle(R(mid - 4, 154, mid + 4, 172), radius=P(1)), 0.3), (22, 23, 25))
    c.threshold()
    return c


def auto(mode):
    """automatic sliding double doors: operator header, slim leaf edges, centre floor lock, floor track (ref. image 3)"""
    c = Canvas()
    c.vmember(0, 6, 0, BOT + 6); c.vmember(GW - 6, GW, 0, BOT + 6)
    c.hmember(0, 14)                                                      # deeper operator box over the transom line
    c.put(mask(lambda d: d.rectangle(R(GW / 2 - 14, 4, GW / 2 + 14, 10)), 0.3), (24, 26, 28))       # sensor
    c.put(mask(lambda d: d.ellipse(R(GW / 2 + 8, 5.5, GW / 2 + 11, 8.5))), (200, 60, 50))
    mid = GW / 2
    for lx0, lx1 in ((7, mid - 0.5), (mid + 0.5, GW - 7)):
        c.glass((lx0 + 3, 18, lx1 - 3, BOT - 2), mode)
        c.vmember(lx0, lx0 + 3, 15, BOT + 2); c.vmember(lx1 - 3, lx1, 15, BOT + 2)
        c.hmember(15, 18); c.hmember(BOT - 2, BOT + 2)
    c.put(mask(lambda d: d.rounded_rectangle(R(mid - 3, 190, mid + 3, 206), radius=P(1)), 0.3), (22, 23, 25))   # centre lock
    # stainless floor track
    c.threshold()
    c.put(mask(lambda d: d.rectangle(R(0, BOT + 6, GW, BOT + 9))), (160, 162, 160))
    return c


# ------------------------------------------------------------------ doors for the white plain walls
def solid(vision=True, leaf=(212, 214, 214)):
    c = Canvas()
    c.vmember(0, 6, 0, BOT + 6); c.vmember(GW - 6, GW, 0, BOT + 6); c.hmember(0, 6)
    box = (7, 7, GW - 7, BOT + 6)
    m = mask(lambda d: d.rectangle(R(*box)))
    yy = np.linspace(0, 1, H)[:, None]
    leafc = np.array(leaf, np.float32) * (1.02 - 0.06 * yy)[..., None] * np.ones((1, W, 1))
    leafc = leafc * (1 + 0.006 * gaussian_filter(np.random.default_rng(3).standard_normal((H, W)).astype(np.float32), 40)[..., None] * 20)
    c.rgb = c.rgb * (1 - m[..., None]) + leafc * m[..., None]; c.a = np.maximum(c.a, m * 255)
    c.rgb *= (1 - 0.22 * mask(lambda d: d.rectangle(R(7, 7, GW - 7, 12)), 2) * m)[..., None]           # head shadow
    c.put(mask(lambda d: d.rectangle(R(*box), outline=255, width=P(0.8))), (150, 152, 154))
    if vision:
        c.glass((22, 30, 34, 170), 'clear')
        c.vmember(20, 22, 28, 172); c.vmember(34, 36, 28, 172); c.hmember(28, 30, 20, 36); c.hmember(170, 172, 20, 36)
    for y in (40, 150, 270):
        c.put(mask(lambda d: d.rectangle(R(5.5, y, 8, y + 16)), 0.3), (120, 124, 128))
    c.lever(GW - 21, 170, 'L')
    kp = (8, BOT - 16, GW - 8, BOT + 4)
    c.put(mask(lambda d: d.rectangle(R(*kp)), 0.3), (176, 178, 178))
    c.put(mask(lambda d: d.rectangle(R(kp[0], kp[1], kp[2], kp[1] + 0.8))), (220, 222, 222))
    c.threshold()
    return c


# ------------------------------------------------------------------ v2: single manual door + full-panel automatic door
def configure(gw, gh, door_y, k=8):
    """switch the canvas to another door box (game px) - all helpers read these module globals"""
    global GW, GH, W, H, DOOR_Y, FILM_Y, BOT, FLOOR, K
    K = k
    GW, GH, DOOR_Y = gw, gh, door_y
    W, H = GW * K, GH * K
    FILM_Y = 330 - DOOR_Y
    BOT = 552 - DOOR_Y
    FLOOR = 570 - DOOR_Y


def single(mode):
    """manual door: ONE framed leaf (ref. image 3 leaf) inside the slim channel frame of the old frameless door (image 4)"""
    configure(130, 320, 250)
    c = Canvas()
    c.vmember(0, 4, 0, BOT + 6); c.vmember(GW - 4, GW, 0, BOT + 6)       # slim outer channel jambs (image 4)
    c.hmember(0, 6)                                                       # head rail on the transom line (image 4)
    lx0, lx1, ly0, ly1 = 5, GW - 5, 7, BOT + 6
    c.glass((lx0 + 8, ly0 + 8, lx1 - 8, ly1 - 22), mode)
    c.vmember(lx0, lx0 + 8, ly0, ly1); c.vmember(lx1 - 8, lx1, ly0, ly1)
    c.hmember(ly0, ly0 + 8); c.hmember(ly1 - 22, ly1, top_light=True)
    for y in (40, 150, 270):
        c.put(mask(lambda d: d.rectangle(R(lx0 - 1.5, y, lx0 + 1, y + 16)), 0.3), (120, 124, 128))
    c.lever(lx1 - 14, 170, 'L')
    c.threshold()
    return c


def auto_panel(mode):
    """automatic sliding doors one wall panel wide (240) and as tall as every other door (320, wall y 250..570).
    The operator box sits on the transom line; the wall's own glass stays visible above it.
    Edges carry the wall's half-mullion profile so the neighbouring wall completes the mullion."""
    configure(240, 320, 250, k=6)
    c = Canvas()
    mid = GW / 2
    c.vmember(0, 5, 0, BOT + 4); c.vmember(GW - 5, GW, 0, BOT + 4)        # half mullions = wall seam profile
    c.hmember(0, 16)                                                      # operator box on the transom line
    c.put(mask(lambda d: d.rectangle(R(mid - 30, 4, mid + 30, 12)), 0.4), (24, 26, 28))         # sensor window
    c.put(mask(lambda d: d.ellipse(R(mid + 18, 5.5, mid + 23, 10.5))), (210, 60, 50))
    c.put(mask(lambda d: d.rectangle(R(5, 15, GW - 5, 17)), 0.5), (14, 16, 18))                  # shadow line under the box
    for lx0, lx1 in ((6, mid - 1), (mid + 1, GW - 6)):
        c.glass((lx0 + 6, 24, lx1 - 6, BOT - 16), mode)
        c.vmember(lx0, lx0 + 6, 18, BOT + 2); c.vmember(lx1 - 6, lx1, 18, BOT + 2)
        c.hmember(18, 24); c.hmember(BOT - 16, BOT + 2, top_light=True)     # same kick-rail height as the manual door
    c.put(mask(lambda d: d.rectangle(R(mid - 1, 18, mid + 1, BOT + 2))), (12, 13, 15))          # meeting gap
    c.put(mask(lambda d: d.rounded_rectangle(R(mid - 4, 160, mid + 4, 180), radius=P(1.5)), 0.3), (22, 23, 25))   # centre lock (same height as the lever)
    c.hmember(BOT + 2, FLOOR, top_light=True)                             # stainless floor track
    c.put(mask(lambda d: d.rectangle(R(0, BOT + 6, GW, BOT + 9))), (168, 170, 168))
    c.put(mask(lambda d: d.rectangle(R(0, FLOOR - 4, GW, FLOOR))), (150, 150, 146))
    return c

STYLES = {'frameless': frameless, 'framed': framed, 'auto': auto}

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/gd/doors2'
    which = sys.argv[2:]
    os.makedirs(out, exist_ok=True)
    jobs = []
    for mode in ('mixed', 'clear', 'frosted'):
        jobs.append((f'door-glass-{mode}-single', lambda mode=mode: single(mode)))
        jobs.append((f'door-glass-{mode}-auto', lambda mode=mode: auto_panel(mode)))
    for name, fn in jobs:
        if which and not any(w in name for w in which):
            continue
        fn().bake().save(os.path.join(out, f'{name}.png'))
        print(name, flush=True)
