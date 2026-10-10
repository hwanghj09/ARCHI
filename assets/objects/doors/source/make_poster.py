"""Harmony Hall poster - aluminium snap frame (same profile/colour as the glass walls & doors), no lettering.
400 x 560 px (= 100 x 140 game px). Two files: normal (for props) and '-bg' with the walls' background filter baked in."""
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

K = 2
OW, OH = 400, 560
W, H = OW * K, OH * K
FRAME = np.array((52, 56, 60), np.float32)


def P(v):
    return int(round(v * K))


def mask(fn, r=0):
    m = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(m); d.ink = 255; d.fill = True
    fn(d)
    a = np.asarray(m, np.float32) / 255
    return gaussian_filter(a, r * K) if r else a


def put(rgb, m, col, k=1.0):
    return rgb * (1 - (m * k)[..., None]) + np.asarray(col, np.float32) * (m * k)[..., None]


def build(bake=False):
    yy = np.linspace(0, 1, H)[:, None]; xx = np.linspace(0, 1, W)[None, :]
    # art: deep night-teal hall, a single spotlight on a grand piano silhouette, gold score line
    art = np.ones((H, W, 3), np.float32) * np.array((16, 34, 40), np.float32)
    art *= (1.15 - 0.55 * yy)[..., None]
    cone = mask(lambda d: d.polygon([(P(185), P(40)), (P(215), P(40)), (P(330), P(430)), (P(70), P(430))]), 18)
    art = put(art, cone, (120, 150, 150), 0.35)
    art = put(art, mask(lambda d: d.ellipse([P(120), P(400), P(280), P(450)]), 10), (150, 170, 166), 0.35)
    # grand piano silhouette (profile, lid up)
    piano = [(130, 420), (140, 392), (190, 384), (262, 384), (276, 392), (276, 402), (130, 402)]
    art = put(art, mask(lambda d: d.polygon([(P(x), P(y)) for x, y in piano])), (8, 12, 14))
    art = put(art, mask(lambda d: d.polygon([(P(144), P(388)), (P(250), P(386)), (P(186), P(340)), (P(160), P(346))])), (10, 14, 16))
    for lx in (146, 262):
        art = put(art, mask(lambda d: d.rectangle([P(lx), P(400), P(lx + 4), P(432)])), (8, 12, 14))
    art = put(art, mask(lambda d: d.rectangle([P(196), P(408), P(232), P(412)])), (8, 12, 14))      # bench
    # gold score line + notes, piano-key band, small gold moon
    pts = [(P(40 + i * 10.6), P(200 + 26 * math.sin(i * 0.42) * math.exp(-((i - 15) / 14) ** 2))) for i in range(31)]
    art = put(art, mask(lambda d: d.line(pts, fill=255, width=P(2.2)), 0.4), (196, 166, 98))
    for k, (nx, ny) in enumerate(((96, 168), (150, 214), (232, 176), (300, 222))):
        art = put(art, mask(lambda d: d.ellipse([P(nx - 6), P(ny - 4), P(nx + 6), P(ny + 4)]), 0.4), (196, 166, 98))
        art = put(art, mask(lambda d: d.rectangle([P(nx + 5), P(ny - 26), P(nx + 6.5), P(ny)]), 0.3), (196, 166, 98))
    art = put(art, mask(lambda d: d.ellipse([P(296), P(70), P(326), P(100)]), 0.5), (206, 180, 116))
    kb = (40, 470, 360, 500)
    art = put(art, mask(lambda d: d.rectangle([P(v) for v in kb])), (200, 196, 182))
    for k in range(23):
        x = 40 + k * (320 / 23)
        art = put(art, mask(lambda d: d.rectangle([P(x), P(470), P(x + 0.8), P(500)])), (70, 70, 66))
        if k % 7 not in (2, 6):
            art = put(art, mask(lambda d: d.rectangle([P(x + 9), P(470), P(x + 16), P(488)])), (18, 18, 20))
    art = put(art, mask(lambda d: d.rectangle([P(40), P(516), P(150), P(519)])), (196, 166, 98))
    # aluminium snap frame with the wall profile + cover glass reflection
    rgb = art.copy()
    F = 12
    fm = mask(lambda d: [d.rectangle([0, 0, W, P(F)]), d.rectangle([0, H - P(F), W, H]), d.rectangle([0, 0, P(F), H]), d.rectangle([W - P(F), 0, W, H])])
    rgb = put(rgb, fm, FRAME * 1.05)
    rgb = put(rgb, mask(lambda d: d.polygon([(0, 0), (W, 0), (W - P(F), P(F)), (P(F), P(F))])), FRAME * 1.35)
    rgb = put(rgb, mask(lambda d: d.polygon([(0, 0), (P(F), P(F)), (P(F), H - P(F)), (0, H)])), FRAME * 1.2)
    rgb = put(rgb, mask(lambda d: d.polygon([(0, H), (P(F), H - P(F)), (W - P(F), H - P(F)), (W, H)])), FRAME * 0.7)
    rgb = put(rgb, mask(lambda d: d.polygon([(W, 0), (W, H), (W - P(F), H - P(F)), (W - P(F), P(F))])), FRAME * 0.75)
    rgb = put(rgb, mask(lambda d: d.rectangle([P(F), P(F), W - P(F), H - P(F)], outline=255, width=P(2)), 0.6), (14, 15, 16), 0.7)
    refl = mask(lambda d: d.polygon([(P(240), P(F)), (P(330), P(F)), (P(150), H - P(F)), (P(60), H - P(F))]), 14)
    rgb = put(rgb, refl, (210, 220, 228), 0.07)
    rgb = np.stack([gaussian_filter(rgb[..., i], 0.5) for i in range(3)], -1)
    if bake:
        rgb = rgb * 0.72
        lum = (rgb * np.array((0.2126, 0.7152, 0.0722))).sum(-1, keepdims=True)
        rgb = lum + 0.85 * (rgb - lum)
    img = Image.fromarray(rgb.clip(0, 255).round().astype(np.uint8), 'RGB').convert('RGBA')
    return img.resize((OW, OH), Image.LANCZOS)


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/gd/poster'
    os.makedirs(out, exist_ok=True)
    build(False).save(os.path.join(out, 'harmony-hall-poster.png'))
    build(True).save(os.path.join(out, 'harmony-hall-poster-bg.png'))
    print('poster')
