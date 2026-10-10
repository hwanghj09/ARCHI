"""Crop the room view that shows through a glass wall segment from a floor cutaway asset.

usage:  python crop_behind.py <cutaway.png> <source_x> <segment_width> <out.png>

compose_floor.py scales a "behind" image with "behind_floor_y": 438 by 570/438 (~1.30) and then crops it to the
segment width, so this takes segment_width * 438/570 source pixels starting at source_x (all rows, floor line 438).
Pick source_x so the interesting part of the painted room (desks, screen, shelves) sits behind the glass.
"""
import sys
from PIL import Image

src, x0, seg_w, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
img = Image.open(src).convert('RGBA')
need = round(seg_w * 438 / 570) + 2
x0 = max(0, min(x0, img.width - need))
img.crop((x0, 0, x0 + need, img.height)).save(out)
print('saved', out, 'source x', x0, '..', x0 + need)
