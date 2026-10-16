"""14F: shared finishes with archive panels, data-room windows and observation glass.

Run from the repository root: python -B assets/background/floor14/build.py
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
for name, width in [('archive', 1800), ('data', 2400), ('ux', 2100)]:
    wall = Image.blend(tile(panel, width), Image.new('RGBA', (width, 456), (30, 35, 54, 255)), .8)
    draw = ImageDraw.Draw(wall)
    draw.rectangle((0, 348, width, 455), fill=(21, 25, 39, 255))
    draw.rectangle((0, 345, width, 348), fill=(72, 82, 115, 255))
    draw.rectangle((0, 448, width, 455), fill=(12, 16, 25, 255))
    if name == 'archive':
        # Keep the archive's stacked panel pattern clear of the exit on the right.
        for x in range(40, 1300, 240):
            draw.rectangle((x, 28, x + 224, 330), fill=(23, 27, 44, 255), outline=(53, 61, 85, 255), width=4)
            for y in range(88, 330, 64):
                draw.rectangle((x + 4, y, x + 220, y + 5), fill=(49, 57, 80, 255))
    elif name == 'data':
        for x in range(560, 1900, 320):
            draw.rectangle((x, 40, x + 304, 256), fill=(13, 22, 37, 255), outline=(69, 80, 103, 255), width=5)
            draw.line((x + 152, 44, x + 152, 252), fill=(60, 72, 94, 255), width=4)
            draw.line((x + 5, 196, x + 299, 196), fill=(47, 59, 81, 255), width=3)
    else:
        draw.rectangle((180, 20, 880, 260), fill=(8, 12, 21, 255), outline=(56, 65, 93, 255), width=8)
        draw.polygon([(390, 28), (414, 28), (550, 252), (526, 252)], fill=(21, 28, 43, 255))
        draw.polygon([(680, 28), (693, 28), (829, 252), (816, 252)], fill=(16, 23, 38, 255))
    block = Image.new('RGBA', (width, 442))
    block.paste(wall.resize((width, 360), Image.Resampling.LANCZOS), (0, 82))
    rooms[name] = (np.asarray(block), (60, 68, 86), (54, 62, 84))

behind = Image.new('RGBA', (640, 760), (15, 19, 31, 255))
behind.paste(Image.fromarray(rooms['data'][0][82:442]).resize((640, 456)), (0, 100))
with Image.open(HERE.parent.parent / 'objects/floor-kit/data-workstation.png') as desk:
    desk = desk.convert('RGBA').resize((180, 90), Image.Resampling.LANCZOS)
    for x in (100, 340):
        behind.alpha_composite(desk, (x, 480))
behind.save(HERE / 'behind-data.png')
finish_floor(HERE, rooms)
for name, (block, _, _) in rooms.items():
    with Image.open(HERE / f'floor14-{name}-interior.png') as wall:
        assert wall.size == (block.shape[1], 475)
        assert np.asarray(wall)[:456, :, 3].min() == 255
print('built 14F assets')
