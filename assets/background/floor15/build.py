"""15F: shared finishes; preserve the seminar room's GPU crate jump route.

Run from the repository root: python -B assets/background/floor15/build.py
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, 'assets/background')
from cutaway_finish import finish_floor
from wall.compose_floor import tile

HERE = Path(__file__).parent
with Image.open(HERE.parent / 'wall/wall-concrete.png') as module:
    panel = module.convert('RGBA').crop((0, 100, 480, 556))

rooms = {}
for name, width, windows in [
    ('lab', 3440, [400, 1440, 1800, 2800]),
    ('seminar', 2480, [440, 800, 1160, 1520, 1880]),
    ('director', 1824, [700, 1060, 1420]),
]:
    wall = Image.blend(tile(panel, width), Image.new('RGBA', (width, 456), (30, 47, 45, 255)), .8)
    draw = ImageDraw.Draw(wall)
    wood = name == 'director'
    draw.rectangle((0, 348, width, 455), fill=(45, 36, 27, 255) if wood else (21, 33, 32, 255))
    for x in range(0, width, 120):
        draw.line((x, 350, x, 447), fill=(63, 51, 36, 255) if wood else (37, 54, 51, 255), width=2)
    draw.rectangle((0, 345, width, 348), fill=(113, 96, 61, 255) if wood else (68, 97, 91, 255))
    draw.rectangle((0, 448, width, 455), fill=(13, 21, 20, 255))
    for x in windows:
        draw.rectangle((x, 40, x + 336, 256), fill=(13, 24, 30, 255), outline=(69, 91, 89, 255), width=5)
        draw.line((x + 168, 44, x + 168, 252), fill=(59, 78, 78, 255), width=4)
        draw.line((x + 5, 196, x + 331, 196), fill=(47, 67, 69, 255), width=3)
        if wood:
            for y in range(48, 249, 12):
                draw.line((x + 7, y, x + 329, y), fill=(43, 57, 58, 255), width=6)
    block = Image.new('RGBA', (width, 442))
    block.paste(wall.resize((width, 360), Image.Resampling.LANCZOS), (0, 82))
    rooms[name] = (np.asarray(block), (65, 78, 75), (55, 73, 68))

behind = Image.new('RGBA', (860, 760), (16, 24, 24, 255))
behind.paste(Image.fromarray(rooms['lab'][0][82:442]).resize((860, 456)), (0, 100))
with Image.open(HERE.parent.parent / 'objects/floor-kit/research-workstation.png') as desk:
    desk = desk.convert('RGBA').resize((180, 90), Image.Resampling.LANCZOS)
    for x in (80, 360, 640):
        behind.alpha_composite(desk, (x, 480))
behind.save(HERE / 'behind-lab.png')
finish_floor(HERE, rooms)
for name, (block, _, _) in rooms.items():
    with Image.open(HERE / f'floor15-{name}-interior.png') as wall:
        assert wall.size == (block.shape[1], 475)
        assert np.asarray(wall)[:456, :, 3].min() == 255
print('built 15F assets')
