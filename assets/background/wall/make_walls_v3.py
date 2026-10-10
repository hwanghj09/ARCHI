"""ARCHI wall set v3 - painted, full game height, matched to the team's 16F / restroom / elevator art.

Each module is ONE full-height background slice, exactly like the existing walls-only backgrounds
(floor-16.js style: image top = 0, floor line at y=570):
    y   0..48   ceiling soffit with recessed downlights
    y  48..96   bulkhead face (shared header for every wall)
    y  96..556  wall  (datum line at y=250 = 2/3 of the wall from the bottom)
    y 556..570  skirting / bottom track
    y 570..752  floor with a soft glossy reflection
Module 480 x 752 @1x (two 240px panels, tiles horizontally), pilaster 48 x 752. Also @2x.
Brightness: the game draws these with filter brightness(.72); wall mean luma is ~80 so it reads as dark grey (~58) in game.
"""
import math, random, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

S = 4                                   # internal = 4x of @1x
W1, H1 = 480, 752
W, H = W1 * S, H1 * S
PW = W // 2                             # panel width
SOFFIT, BULK, DATUM, SKIRT, FLOOR = 48 * S, 96 * S, 250 * S, 556 * S, 570 * S
FILM_Y = 330 * S                        # film edge / etched strip on glass walls = same height on the glass doors
LIGHTS_X = [PW // 2, PW + PW // 2]      # downlights over each panel centre


# ------------------------------------------------------------------ small numpy toolkit
def P(v):
    return int(round(v * S))


def blur(arr, r):
    """gaussian blur of a float 2D array, wrapping horizontally so tiles stay seamless"""
    from scipy.ndimage import gaussian_filter
    return gaussian_filter(arr.astype(np.float32), sigma=r, mode=('nearest', 'wrap'))


def wrap_noise(w, h, cell, seed):
    """smooth value noise that tiles horizontally"""
    rng = np.random.default_rng(seed)
    gw, gh = max(2, w // cell), max(2, h // cell + 2)
    g = rng.random((gh, gw)).astype(np.float32)
    g = np.concatenate([g, g[:, :1]], axis=1)                       # wrap column
    im = Image.fromarray(g, 'F').resize((w + w // gw, h), Image.BICUBIC)
    a = np.asarray(im, np.float32)[:, :w]
    return (a - a.mean()) / (a.std() + 1e-6)


def mask_from(fn, w=None, h=None, r=0):
    w = W if w is None else w; h = H if h is None else h
    m = Image.new('L', (w, h), 0)
    dr = ImageDraw.Draw(m)
    dr.ink = 255
    dr.fill = True                      # shapes are filled unless a width is given
    fn(dr)
    a = np.asarray(m, np.float32) / 255
    return blur(a, r) if r else a


def paint(rgb, mask, col, alpha=1.0):
    col = np.array(col, np.float32)
    m = (mask * alpha)[..., None]
    rgb[:] = rgb * (1 - m) + col * m


def shade(rgb, mask, k):
    """multiply brightness by (1 + k*mask); k<0 darkens"""
    rgb *= (1 + k * mask)[..., None]


# ------------------------------------------------------------------ shared header / skirting / floor
def ceiling_and_bulkhead(rgb):
    y = np.arange(H, dtype=np.float32)[:, None]
    # soffit: dark, slightly lighter toward the bulkhead edge
    t = np.clip(y / SOFFIT, 0, 1)
    soffit = np.array((150, 153, 156), np.float32) * (0.80 + 0.25 * t)[..., None]
    rgb[:SOFFIT] = np.broadcast_to(soffit[:SOFFIT], rgb[:SOFFIT].shape)
    # bulkhead face: smooth plaster, lit from below by the wall wash
    tb = np.clip((y - SOFFIT) / (BULK - SOFFIT), 0, 1)
    face = np.array((206, 208, 210), np.float32) * (0.95 + 0.06 * tb)[..., None]
    rgb[SOFFIT:BULK] = np.broadcast_to(face[SOFFIT:BULK], rgb[SOFFIT:BULK].shape)
    rgb[SOFFIT:BULK] *= (1 + 0.025 * wrap_noise(W, H, P(40), 7)[SOFFIT:BULK])[..., None]
    # crisp lip lines
    paint(rgb, mask_from(lambda d: d.rectangle([0, SOFFIT, W, SOFFIT + P(1.5)])), (226, 228, 230))
    paint(rgb, mask_from(lambda d: d.rectangle([0, BULK - P(4), W, BULK])), (150, 152, 155))
    paint(rgb, mask_from(lambda d: d.rectangle([0, BULK - P(4), W, BULK - P(3)])), (236, 238, 240), 0.8)
    # linear slot diffuser on the bulkhead face
    for x0 in (P(30), PW + P(30)):
        paint(rgb, mask_from(lambda d: d.rectangle([x0, SOFFIT + P(20), x0 + PW - P(60), SOFFIT + P(27)]), r=P(0.5)), (70, 73, 77))
        for k in range(int((PW - P(60)) / P(6))):
            xx = x0 + k * P(6)
            paint(rgb, mask_from(lambda d: d.rectangle([xx, SOFFIT + P(21), xx + P(1.4), SOFFIT + P(26)])), (150, 153, 156), 0.8)
    # recessed downlights in the soffit (seen from below, slight ellipses)
    for lx in LIGHTS_X:
        paint(rgb, mask_from(lambda d: d.ellipse([lx - P(15), P(20), lx + P(15), P(31)]), r=P(0.5)), (96, 99, 102))
        paint(rgb, mask_from(lambda d: d.ellipse([lx - P(11), P(22), lx + P(11), P(29)]), r=P(0.8)), (238, 238, 230))
        glow = mask_from(lambda d: d.ellipse([lx - P(30), P(10), lx + P(30), P(44)]), r=P(10))
        rgb += (glow * 38)[..., None] * np.array((1.0, 0.98, 0.9), np.float32)


def wall_wash(h0=BULK, strength=0.32, reach=330):
    """soft scallops of light under each downlight (returns 2D gain map)"""
    g = np.zeros((H, W), np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    for lx in LIGHTS_X:
        for off in (-W, 0, W):
            dx = (xx - (lx + off)) / P(1)
            dy = (yy - h0) / P(1)
            width = 26 + dy * 0.55
            shape = np.exp(-(dx / np.maximum(width, 1)) ** 2) * np.exp(-np.clip(dy, 0, None) / reach)
            shape *= np.clip(dy / 18, 0, 1)                                 # starts just under the bulkhead
            g = np.maximum(g, shape)
    return blur(g, P(3)) * strength


def skirting(rgb, col=(36, 38, 42), top_hi=(98, 102, 108)):
    paint(rgb, mask_from(lambda d: d.rectangle([0, SKIRT, W, FLOOR])), col)
    paint(rgb, mask_from(lambda d: d.rectangle([0, SKIRT, W, SKIRT + P(1.5)])), top_hi)
    # contact shadow on the wall just above the skirting
    sh = mask_from(lambda d: d.rectangle([0, SKIRT - P(14), W, SKIRT]), r=P(6))
    shade(rgb, sh * (np.arange(H)[:, None] < SKIRT), -0.22)


def floor(rgb, wall_rgb_for_reflection):
    y = np.arange(H, dtype=np.float32)[:, None]
    t = np.clip((y - FLOOR) / (H - FLOOR), 0, 1)
    base = np.array((26, 28, 31), np.float32) * (1.0 - 0.35 * t)[..., None]
    rgb[FLOOR:] = np.broadcast_to(base[FLOOR:], rgb[FLOOR:].shape)
    # glossy reflection of the wall (mirrored, blurred, fading)
    ref_h = H - FLOOR
    src = wall_rgb_for_reflection[FLOOR - ref_h:FLOOR][::-1]
    src = np.stack([blur(src[..., i], P(4)) for i in range(3)], -1)
    fade = (0.22 * (1 - np.linspace(0, 1, ref_h)) ** 2)[:, None, None]
    rgb[FLOOR:] = rgb[FLOOR:] * (1 - fade) + src * fade
    paint(rgb, mask_from(lambda d: d.rectangle([0, FLOOR, W, FLOOR + P(1.2)])), (88, 92, 98))
    rgb[FLOOR:] *= (1 + 0.02 * wrap_noise(W, H, P(60), 99)[FLOOR:])[..., None]


def finish(rgb, alpha=None, soften=0.6):
    """painterly softening: tiny blur, then very fine low-contrast grain, clamp"""
    out = np.stack([blur(rgb[..., i], P(soften)) for i in range(3)], -1)
    rng = np.random.default_rng(5)
    out += (rng.random(out.shape[:2]).astype(np.float32)[..., None] - 0.5) * 2.2
    a = np.full(out.shape[:2], 255, np.float32) if alpha is None else alpha
    return Image.fromarray(np.dstack([out, a]).clip(0, 255).round().astype(np.uint8), 'RGBA')


# ------------------------------------------------------------------ (1) concrete
CONC = (74, 78, 84)


def concrete(seed=1, width=W):
    global W
    rgb = np.zeros((H, W, 3), np.float32)
    ceiling_and_bulkhead(rgb)
    wall = np.ones((H, W, 3), np.float32) * np.array(CONC, np.float32)
    rng = random.Random(seed)
    # each cast panel slightly different in tone (above / below the datum too)
    for px in (0, PW):
        for (a, b) in ((BULK, DATUM), (DATUM, SKIRT)):
            wall[a:b, px:px + PW] *= 0.95 + rng.uniform(0, 0.1)
    wall *= (1 + 0.022 * wrap_noise(W, H, P(90), seed))[..., None]           # large soft mottling
    wall *= (1 + 0.012 * wrap_noise(W, H, P(10), seed + 1))[..., None]       # finer cement texture
    # faint vertical weather streaks running down from the tie holes
    streak = np.zeros((H, W), np.float32)
    holes = []
    for px in (0, PW):
        for hxp in (0.22, 0.78):
            for hy in (150, 320, 470):
                holes.append((px + PW * hxp, P(hy)))
    for (hx_, hy_) in holes:
        m = mask_from(lambda d: d.rectangle([hx_ - P(2.5), hy_, hx_ + P(2.5), hy_ + P(rng.uniform(30, 90))]), r=P(3))
        streak = np.maximum(streak, m * rng.uniform(0.3, 1.0))
    shade(wall, streak, -0.06)
    rgb[BULK:SKIRT] = wall[BULK:SKIRT]
    # light wash under the downlights + soft top shadow under the bulkhead
    shade(rgb, wall_wash(strength=0.42) * (np.arange(H)[:, None] >= BULK), 1.0)
    top_sh = mask_from(lambda d: d.rectangle([0, BULK, W, BULK + P(10)]), r=P(8)) * (np.arange(H)[:, None] >= BULK)
    shade(rgb, top_sh, -0.25)
    # recessed panel joints (seam, centre, datum): dark groove, light catch on the lower / right lip
    for x in (0, PW, W):
        paint(rgb, mask_from(lambda d: d.rectangle([x - P(2), BULK, x + P(2), SKIRT]), r=P(0.6)), (34, 36, 40))
        paint(rgb, mask_from(lambda d: d.rectangle([x + P(2), BULK, x + P(3), SKIRT]), r=P(0.5)), (104, 108, 114), 0.7)
    paint(rgb, mask_from(lambda d: d.rectangle([0, DATUM - P(2), W, DATUM + P(2)]), r=P(0.6)), (34, 36, 40))
    paint(rgb, mask_from(lambda d: d.rectangle([0, DATUM + P(2), W, DATUM + P(3)]), r=P(0.5)), (108, 112, 118), 0.75)
    for px in (0, PW):
        for (a, b) in ((BULK, DATUM), (DATUM, SKIRT)):
            hi = mask_from(lambda d: [d.rectangle([px + P(3), a + P(3), px + PW - P(3), a + P(5)]), d.rectangle([px + P(3), a + P(3), px + P(5), b - P(3)])], r=P(1.2))
            lo = mask_from(lambda d: [d.rectangle([px + P(3), b - P(6), px + PW - P(3), b - P(3)]), d.rectangle([px + PW - P(6), a + P(3), px + PW - P(3), b - P(3)])], r=P(1.5))
            shade(rgb, hi, 0.10); shade(rgb, lo, -0.12)
    # formwork tie holes: shaded discs
    for (hx_, hy_) in holes:
        paint(rgb, mask_from(lambda d: d.ellipse([hx_ - P(4.5), hy_ - P(4.5), hx_ + P(4.5), hy_ + P(4.5)]), r=P(0.8)), (52, 55, 60))
        paint(rgb, mask_from(lambda d: d.ellipse([hx_ - P(3), hy_ - P(3), hx_ + P(3), hy_ + P(3)]), r=P(0.5)), (30, 32, 36))
        paint(rgb, mask_from(lambda d: d.arc([hx_ - P(4.5), hy_ - P(4.5), hx_ + P(4.5), hy_ + P(4.5)], 20, 160, fill=255, width=P(1.2)), r=P(0.4)), (110, 114, 120), 0.6)
    skirting(rgb)
    floor(rgb, rgb.copy())
    return finish(rgb)


# ------------------------------------------------------------------ (1b) plain wall: smooth surface, lines only
PLAIN = (226, 228, 228)


def plain_wall(panels=3):
    """monotone painted wall: no holes, no stains, no light pools - just a soft gradient and joint lines"""
    rgb = np.zeros((H, W, 3), np.float32)
    ceiling_and_bulkhead(rgb)
    y = np.arange(H, dtype=np.float32)[:, None]
    t = np.clip((y - BULK) / (SKIRT - BULK), 0, 1)
    wall = np.array(PLAIN, np.float32) * (1.01 - 0.05 * t)[..., None]      # a touch lighter near the top
    wall = np.broadcast_to(wall, (H, W, 3)).copy()
    wall *= (1 + 0.006 * wrap_noise(W, H, P(120), 3))[..., None]           # barely-there surface variation
    rgb[BULK:SKIRT] = wall[BULK:SKIRT]
    top_sh = mask_from(lambda d: d.rectangle([0, BULK, W, BULK + P(8)]), r=P(7)) * (y >= BULK)
    shade(rgb, top_sh, -0.10)
    # joint lines: thin dark groove + faint light edge, vertical every panel and one horizontal on the datum
    pw = W // panels
    for k in range(panels + 1):
        x = k * pw
        paint(rgb, mask_from(lambda d: d.rectangle([x - P(1), BULK, x + P(1), SKIRT]), r=P(0.4)), (178, 180, 182))
        paint(rgb, mask_from(lambda d: d.rectangle([x + P(1), BULK, x + P(1.8), SKIRT]), r=P(0.3)), (246, 247, 247), 0.6)
    paint(rgb, mask_from(lambda d: d.rectangle([0, DATUM - P(1), W, DATUM + P(1)]), r=P(0.4)), (178, 180, 182))
    paint(rgb, mask_from(lambda d: d.rectangle([0, DATUM + P(1), W, DATUM + P(1.8)]), r=P(0.3)), (246, 247, 247), 0.6)
    skirting(rgb)
    floor(rgb, rgb.copy())
    return finish(rgb, soften=0.4)


def pilaster():
    """48px concrete pier, rounded light falloff, same header / skirting / floor"""
    global W, LIGHTS_X
    Wsave, Lsave = W, LIGHTS_X
    W = 48 * S; LIGHTS_X = [W // 2]
    rgb = np.zeros((H, W, 3), np.float32)
    ceiling_and_bulkhead(rgb)
    x = np.linspace(-1, 1, W)[None, :]
    col = np.array((232, 234, 234), np.float32)
    body = np.ones((H, W, 3), np.float32) * col
    body *= (1.02 - 0.10 * (x + 1) / 2)[..., None]                            # lit left, falling off to the right
    body *= (1 + 0.006 * wrap_noise(W, H, P(60), 4))[..., None]
    rgb[0:SKIRT] = body[0:SKIRT]                                              # pier runs up through the bulkhead
    paint(rgb, mask_from(lambda d: d.rectangle([0, 0, P(2), SKIRT])), (248, 249, 249), 0.9)
    paint(rgb, mask_from(lambda d: d.rectangle([W - P(4), 0, W, SKIRT]), r=P(1)), (150, 152, 155))
    skirting(rgb, col=(40, 42, 46))
    floor(rgb, rgb.copy())
    img = finish(rgb)
    W, LIGHTS_X = Wsave, Lsave
    return img


# ------------------------------------------------------------------ glass family
FRAME = (52, 56, 60)


def frame_profile(rgb, alpha, x0, x1, y0, y1):
    """bevelled aluminium mullion: lit left face, dark right face, thin specular line"""
    w = x1 - x0
    t = np.linspace(0, 1, max(1, w))[None, :, None]
    prof = np.array(FRAME, np.float32) * (1.25 - 0.55 * t)
    rgb[y0:y1, x0:x1] = prof
    alpha[y0:y1, x0:x1] = 255
    rgb[y0:y1, x0 + P(1):x0 + P(1.8)] = (128, 134, 140)
    rgb[y0:y1, x1 - P(1.2):x1] = (20, 22, 24)


def rail(rgb, alpha, y0, y1, top_light=True):
    t = np.linspace(0, 1, y1 - y0)[:, None, None]
    prof = np.array(FRAME, np.float32) * ((1.3 - 0.6 * t) if top_light else (0.8 + 0.4 * t))
    rgb[y0:y1] = prof
    alpha[y0:y1] = 255
    rgb[y0:y0 + P(1)] = (130, 136, 142)
    rgb[y1 - P(1):y1] = (18, 20, 22)


FILM_TOP = (104, 110, 115)
FILM_BOT = (88, 94, 99)
GLASS_TINT = (52, 70, 84)


def glass_module(mode, seed):
    """mode: 'clear' | 'frosted' | 'mixed'"""
    rgb = np.zeros((H, W, 3), np.float32)
    alpha = np.zeros((H, W), np.float32)
    ceiling_and_bulkhead(rgb)
    alpha[:BULK] = 255
    top, bot = BULK + P(10), SKIRT - P(4)
    film_from = {'clear': bot, 'frosted': top, 'mixed': FILM_Y}[mode]
    y = np.arange(H, dtype=np.float32)[:, None]
    # clear glass: faint blue-grey tint, a little denser toward the bottom
    a_clear = (38 + 26 * np.clip((y - top) / (bot - top), 0, 1)) * np.ones((1, W))
    rgb[top:film_from] = np.array(GLASS_TINT, np.float32)
    alpha[top:film_from] = a_clear[top:film_from]
    # frosted film: smooth milky gradient, diffused light brighter at each panel centre and under the lights
    if film_from < bot:
        t = np.clip((y - film_from) / (bot - film_from), 0, 1)[..., None]
        film = np.array(FILM_TOP, np.float32) * (1 - t) + np.array(FILM_BOT, np.float32) * t
        film = np.broadcast_to(film, (H, W, 3)).copy()
        xx = np.arange(W, dtype=np.float32)[None, :]
        lift = sum(np.exp(-((xx - (c + off)) / (PW * 0.45)) ** 2) for c in LIGHTS_X for off in (-W, 0, W))
        film *= (1 + 0.07 * lift)[..., None]
        film *= (1 + 0.015 * wrap_noise(W, H, P(50), seed))[..., None]
        rgb[film_from:bot] = film[film_from:bot]
        alpha[film_from:bot] = 222
    # light wash also falls on the glass/film
    wash = wall_wash(strength=0.22 if mode == 'clear' else 0.30) * (y >= top) * (y < bot)
    rgb *= (1 + wash)[..., None]
    alpha = np.minimum(255, alpha * (1 + 0.6 * wash))
    # reflections: one broad soft diagonal band + one thin sharp band per panel, wrapped across the seam
    rng = random.Random(seed)
    refl = np.zeros((H, W), np.float32)
    for px in (0, PW):
        x0 = px + rng.uniform(0.1, 0.5) * PW
        for (bw, a, r) in ((rng.uniform(0.18, 0.26) * PW, 0.10, P(10)), (rng.uniform(0.03, 0.05) * PW, 0.16, P(1.5))):
            m = mask_from(lambda d: [d.polygon([(x0 + off, top), (x0 + bw + off, top), (x0 + bw - P(180) + off, bot), (x0 - P(180) + off, bot)]) for off in (-W, 0, W)], r=r)
            refl = np.maximum(refl, m * a)
    refl *= (y >= top) * (y < bot)
    k = refl if mode == 'clear' else refl * 0.6
    rgb = rgb * (1 - k[..., None]) + np.array((200, 214, 226), np.float32) * k[..., None]
    alpha = np.maximum(alpha, k * 255 * 0.9)
    # reflected bulkhead edge: a soft dark band near the top of clear glass
    if film_from > top:
        band = mask_from(lambda d: d.rectangle([0, top, W, top + P(26)]), r=P(6)) * (y >= top) * (y < film_from)
        alpha = np.maximum(alpha, band * 70)
        rgb = rgb * (1 - band[..., None] * 0.5) + np.array((24, 28, 34), np.float32) * band[..., None] * 0.5
    # film edge on the datum (mixed) / manifestation strip (frosted & clear)
    if mode == 'mixed':
        m = mask_from(lambda d: d.rectangle([0, FILM_Y - P(1), W, FILM_Y + P(1)]), r=P(0.4))
        paint(rgb, m, (160, 166, 168)); alpha = np.maximum(alpha, m * 235)
        sh = mask_from(lambda d: d.rectangle([0, FILM_Y - P(6), W, FILM_Y - P(1)]), r=P(2)) * (y < FILM_Y)
        alpha = np.maximum(alpha, sh * 60)
    else:
        m = mask_from(lambda d: d.rectangle([0, FILM_Y - P(3), W, FILM_Y + P(3)]), r=P(0.5))
        paint(rgb, m, (150, 156, 160) if mode == 'clear' else (96, 102, 108), 0.7 if mode == 'clear' else 1.0)
        alpha = np.maximum(alpha, m * (120 if mode == 'clear' else 230))
    # frames: head track, bottom track, mullion at the seam (split) and centre
    rail(rgb, alpha, BULK, top, True)
    rail(rgb, alpha, bot, SKIRT, False)
    rail(rgb, alpha, DATUM - P(2), DATUM + P(4), True)                      # transom at door-head height (y=250)
    frame_profile(rgb, alpha, PW - P(5), PW + P(5), top, bot)
    frame_profile(rgb, alpha, 0, P(5), top, bot)
    frame_profile(rgb, alpha, W - P(5), W, top, bot)
    # glazing bead shadow along the inside of every frame
    bead = mask_from(lambda d: [d.rectangle([x, top, x + P(2.5), bot]) for x in (P(5), PW + P(5))] +
                     [d.rectangle([x - P(2.5), top, x, bot]) for x in (PW - P(5), W - P(5))] +
                     [d.rectangle([0, top, W, top + P(2.5)]), d.rectangle([0, bot - P(2.5), W, bot])], r=P(0.8))
    rgb = rgb * (1 - bead[..., None] * 0.6) + np.array((14, 16, 18), np.float32) * bead[..., None] * 0.6
    alpha = np.maximum(alpha, bead * 200)
    skirting(rgb, col=(40, 43, 47))
    alpha[SKIRT:] = 255
    full = rgb.copy()
    floor(rgb, full)
    return finish(rgb, alpha)


# ------------------------------------------------------------------ export
def save(img, name, out):
    w = img.size[0] // S
    img.resize((w, H1), Image.LANCZOS).save(os.path.join(out, f'{name}.png'))
    img.resize((w * 2, H1 * 2), Image.LANCZOS).save(os.path.join(out, f'{name}@2x.png'))


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/walls/v3'
    os.makedirs(out, exist_ok=True)
    save(plain_wall(), 'wall-concrete', out); print('plain wall')
    save(glass_module('clear', 201), 'wall-glass', out); print('glass')
    save(glass_module('frosted', 202), 'wall-frosted', out); print('frosted')
    save(glass_module('mixed', 203), 'wall-glass-mixed', out); print('mixed')
    save(pilaster(), 'pilaster', out); print('pilaster')
