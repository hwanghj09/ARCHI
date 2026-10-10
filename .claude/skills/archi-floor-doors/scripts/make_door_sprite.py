"""Turn one door image (assets/objects/..., 4x of the door cell, frame included) into the game's two-frame door sprite.

usage:  python make_door_sprite.py <door.png> <out-sprite.png> [--double] [--top FRACTION]

Output is shut | open side by side (1040x1280, 4x of a 130x320 door cell); rooms use it as `doorSprite` and the
engine shows the right half (open) while E is pressed. The open frame keeps the painted casing and kick plate line,
fills the leaf area with a dark opening and draws the leaf swung toward the hinge side (left), narrow and darkened.
--double: two leaves swung (or slid) to both sides (double doors, auto sliding doors).
--top: share of the image height kept above the opening (default 0.026; auto doors with a motor box: 0.075).
"""
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
double = '--double' in sys.argv
shut = np.asarray(Image.open(src).convert('RGBA')).copy()
h, w = shut.shape[:2]
top = float(sys.argv[sys.argv.index('--top') + 1]) if '--top' in sys.argv else 0.026
fx, ft = round(w * 0.055), round(h * top)            # painted casing: ~28px sides, ~33px head at 520x1280
opened = shut.copy()
for y in range(ft, h):
    t = y / h
    opened[y, fx:w - fx, :3] = (int(7 + 9 * t), int(10 + 10 * t), int(12 + 11 * t))
    opened[y, fx:w - fx, 3] = 255
inner = shut[ft:, fx:w - fx]
leaf_w = round((w - 2 * fx) * (0.13 if double else 0.2))
parts = [inner[:, :inner.shape[1] // 2], inner[:, inner.shape[1] // 2:]] if double else [inner]
for k, part in enumerate(parts):
    leaf = np.asarray(Image.fromarray(part).resize((leaf_w, part.shape[0]), Image.LANCZOS)).astype(float)
    leaf[..., :3] *= 0.72
    x0 = fx if k == 0 else w - fx - leaf_w
    opened[ft:, x0:x0 + leaf_w] = leaf.astype(np.uint8)
opened[shut[..., 3] == 0] = 0                      # rows left transparent (flush_door_base.py) stay transparent when open
Image.fromarray(np.concatenate([shut, opened], axis=1)).save(out)
print('saved', out, (w * 2, h))
