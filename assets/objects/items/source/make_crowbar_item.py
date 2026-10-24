"""ARCHI item: crowbar (빠루) - inspect/pickup illustration in the style of the key / ID card / pill items.
Painted look with a slight pixel grain, dark outline, warm rim light, worn paint. Transparent PNG.
Shape after the reference: black gooseneck with a split steel claw, red rubber grip, grey collar, black chisel tip.
"""
import sys, os, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import gaussian_filter, binary_dilation
from scipy.spatial import cKDTree

W, H = 1536, 1024


def centerline():
    """turtle path from the chisel tip to the claw: slight bend, long shaft, gooseneck, short claw"""
    pts, ang = [], math.radians(-158)        # heading up-left (screen y down), shallower diagonal
    x, y = 1420.0, 860.0
    def walk(length, turn_deg, step=2.0):
        nonlocal x, y, ang
        n = max(1, int(length / step)); dt = math.radians(turn_deg) / n
        for _ in range(n):
            pts.append((x, y)); ang += dt
            x += math.cos(ang) * step; y += math.sin(ang) * step
    walk(80, 16)          # chisel end bends a little
    walk(800, 0)          # straight shaft
    walk(150, 118)        # tight gooseneck over the top
    walk(88, 6)           # flat claw pointing back down
    pts.append((x, y))
    return np.array(pts, np.float32)


def width_at(s, L):
    if s < 80:                       # flattened, tapered chisel
        return 26 + 32 * (s / 80)
    if s > L - 88:                   # claw flares wide and flat
        return 58 + 40 * ((s - (L - 88)) / 88)
    return 58


def build():
    cl = centerline()
    seg = np.diff(cl, axis=0); seglen = np.hypot(seg[:, 0], seg[:, 1])
    s_arr = np.concatenate([[0], np.cumsum(seglen)]); L = s_arr[-1]
    tang = np.vstack([seg, seg[-1:]]); tang /= np.linalg.norm(tang, axis=1, keepdims=True)
    tree = cKDTree(cl)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d, idx = tree.query(np.stack([xx.ravel(), yy.ravel()], -1), k=1)
    d = d.reshape(H, W); idx = idx.reshape(H, W)
    s = s_arr[idx]; t = tang[idx]
    rel = np.stack([xx - cl[idx][..., 0], yy - cl[idx][..., 1]], -1)
    side = np.sign(t[..., 0] * rel[..., 1] - t[..., 1] * rel[..., 0])          # which side of the centreline
    wid = np.vectorize(lambda v: width_at(v, L))(s)
    v = side * d / (wid / 2)                                                     # -1..1 across the bar
    inside = (np.abs(v) <= 1.0)
    along = (rel * t).sum(-1)                                                    # cut both ends flat (no round caps)
    inside &= ~((idx == len(cl) - 1) & (along > 0)) & ~((idx == 0) & (along < 0))
    # claw: split with a V notch at the very end
    claw = s > L - 88
    notch = claw & (s > L - 42) & (np.abs(v) < 0.34 * (s - (L - 42)) / 42)          # V split widening to the tip
    inside &= ~notch
    # --- colour by position along the bar
    RED, BLACK, GREY, STEEL = map(lambda c: np.array(c, np.float32), ((196, 38, 34), (36, 38, 42), (128, 130, 132), (150, 152, 150)))
    col = np.zeros((H, W, 3), np.float32)
    bands = [(0, 26, BLACK), (26, 0.52 * L, RED), (0.52 * L, 0.55 * L, GREY), (0.55 * L, L - 62, BLACK), (L - 62, L + 1, STEEL)]
    for a, b, c in bands:
        m = (s >= a) & (s < b)
        col[m] = c
    # --- cylindrical shading with a top-left key light, specular streak, rim light on the lit edge
    n = np.stack([-t[..., 1], t[..., 0]], -1) * side[..., None]                 # outward normal of this side
    light = np.array((-0.62, -0.78), np.float32)
    facing = (n * light).sum(-1)
    vv = np.clip(np.abs(v), 0, 1)
    flat = (s < 70) | claw                                                       # flattened parts read as planes
    lam = np.where(flat, 0.78 + 0.18 * facing * vv, 0.42 + 0.5 * np.sqrt(1 - vv ** 2) + 0.38 * facing * vv)
    spec = np.exp(-((v * np.sign(-facing + 1e-6) + 0.45) / 0.16) ** 2) * (~flat)
    is_red = (s >= 26) & (s < 0.52 * L)
    is_black = ((s >= 0.55 * L) & (s < L - 62)) | (s < 26)
    rgb = col * lam[..., None]
    rgb += spec[..., None] * np.where(is_black[..., None], 70, np.where(is_red[..., None], 55, 60))
    rim = np.clip((vv - 0.82) / 0.18, 0, 1) * np.clip(facing, 0, 1)
    rgb += rim[..., None] * np.array((150, 120, 80), np.float32)                 # warm rim like the key item
    # --- wear: chipped black paint (steel shows), scratches, rubber grain on the grip, grime
    rng = np.random.default_rng(4)
    n1 = gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 5)
    n1 /= n1.std()
    chips = is_black & (n1 > 2.3) & (vv > 0.55)
    rgb[chips] = rgb[chips] * 0.6 + STEEL * 0.45
    sc = Image.new('L', (W, H), 0); dr = ImageDraw.Draw(sc); r2 = random.Random(5)
    for _ in range(70):
        i = r2.randrange(len(cl)); px, py = cl[i]; a = r2.uniform(0, math.pi)
        ln = r2.uniform(6, 26)
        ox, oy = r2.uniform(-18, 18), r2.uniform(-18, 18)
        dr.line([(px + ox, py + oy), (px + ox + math.cos(a) * ln, py + oy + math.sin(a) * ln)], fill=r2.randint(60, 140), width=1)
    scm = np.asarray(sc, np.float32) / 255
    rgb = rgb * (1 - scm[..., None] * 0.5) + np.array((190, 190, 186), np.float32) * scm[..., None] * 0.5
    grain = gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 1.2)
    rgb[is_red] *= (1 + 0.05 * grain[is_red])[..., None]
    grime = gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 18); grime /= grime.std()
    rgb *= (1 - 0.08 * np.clip(grime, 0, 2))[..., None]
    # claw: worn bright steel edge on the tips
    tip = claw & (s > L - 20)
    rgb[tip] = rgb[tip] * 0.5 + np.array((210, 212, 208), np.float32) * 0.5
    # grey collar ridges
    collar = (s >= 0.52 * L) & (s < 0.55 * L)
    rgb[collar] *= (1 + 0.18 * np.cos((s[collar] - 0.52 * L) * 0.6))[..., None]
    alpha = inside.astype(np.float32)
    return rgb, alpha


def finish(rgb, alpha, grain=2):
    """painted -> slight pixel grain (like the key/pill items) + dark outline"""
    a = gaussian_filter(alpha, 0.8)
    img = Image.fromarray(np.dstack([rgb.clip(0, 255), a * 255]).round().astype(np.uint8), 'RGBA')
    small = img.resize((W // grain, H // grain), Image.LANCZOS)
    sa = np.asarray(small).astype(np.float32)
    mk = sa[..., 3] > 110
    outline = binary_dilation(mk, iterations=2) & ~mk
    sa[..., 3] = np.where(mk, 255, 0)
    sa[outline] = (20, 15, 12, 255)
    # soft inner dark edge just inside the outline (painted look)
    inner = binary_dilation(outline, iterations=1) & mk
    sa[inner, :3] *= 0.7
    small = Image.fromarray(sa.clip(0, 255).astype(np.uint8), 'RGBA')
    return small.resize((W, H), Image.NEAREST)


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/item/out'
    os.makedirs(out, exist_ok=True)
    rgb, alpha = build()
    img = finish(rgb, alpha)
    bb = img.getchannel('A').getbbox()
    pad = 40
    img = img.crop((bb[0] - pad, bb[1] - pad, bb[2] + pad, bb[3] + pad))
    img.save(os.path.join(out, 'item-crowbar.png'))
    # inventory icon: square 256, centred
    icon = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    t = img.copy(); t.thumbnail((470, 470), Image.LANCZOS)
    icon.alpha_composite(t, ((512 - t.size[0]) // 2, (512 - t.size[1]) // 2))
    icon.resize((256, 256), Image.LANCZOS).save(os.path.join(out, 'item-crowbar-icon.png'))
    print('saved', img.size)
