"""13F: shared ceiling, floor and corridor; keep the existing interactive props.

Run from the repository root: python -B assets/background/floor13/build.py
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
for name, width in [('ops', 2622), ('testbay', 1824), ('training', 1824)]:
    wall = Image.blend(tile(panel, width), Image.new('RGBA', (width, 456), (38, 42, 48, 255)), .78)
    draw = ImageDraw.Draw(wall)
    draw.rectangle((0, 348, width, 455), fill=(28, 31, 36, 255))
    draw.rectangle((0, 345, width, 348), fill=(134, 95, 49, 255))
    draw.rectangle((0, 448, width, 455), fill=(15, 18, 22, 255))
    if name == 'ops':
        # Leave a gap in the monitor wall for the unchanged central exit.
        for left, count in [(240, 6), (1450, 4)]:
            for column in range(count):
                for row in range(3):
                    x, y = left + column * 152, 28 + row * 76
                    draw.rectangle((x, y, x + 146, y + 70), fill=(10, 14, 18, 255), outline=(68, 74, 81, 255), width=4)
                    draw.line((x + 7, y + 7, x + 139, y + 7), fill=(25, 31, 37, 255), width=2)
    elif name == 'testbay':
        for x in range(0, width, 180):
            draw.line((x, 0, x, 345), fill=(24, 28, 33, 255), width=4)
            for bx in (x + 12, x + 165):
                for y in (18, 322):
                    draw.ellipse((bx - 2, y - 2, bx + 2, y + 2), fill=(92, 98, 102, 255))
    else:
        for x in range(220, 1100, 220):
            draw.rectangle((x, 40, x + 208, 204), fill=(15, 24, 38, 255), outline=(78, 85, 94, 255), width=5)
            draw.line((x + 104, 44, x + 104, 200), fill=(67, 75, 85, 255), width=3)
            draw.line((x + 5, 150, x + 203, 150), fill=(53, 62, 74, 255), width=2)
    block = Image.new('RGBA', (width, 442))
    block.paste(wall.resize((width, 360), Image.Resampling.LANCZOS), (0, 82))
    rooms[name] = (np.asarray(block), (66, 72, 80), (62, 68, 76))

behind = Image.new('RGBA', (460, 760), (17, 20, 25, 255))
behind.paste(Image.fromarray(rooms['ops'][0][82:442]).resize((460, 456)), (0, 100))
with Image.open(HERE.parent.parent / 'objects/floor-kit/support-workstation.png') as desk:
    desk = desk.convert('RGBA').resize((180, 90), Image.Resampling.LANCZOS)
    behind.alpha_composite(desk, (70, 480))
behind.save(HERE / 'behind-ops.png')
finish_floor(HERE, rooms)
for name, (block, _, _) in rooms.items():
    with Image.open(HERE / f'floor13-{name}-interior.png') as wall:
        assert wall.size == (block.shape[1], 475)
        assert np.asarray(wall)[:456, :, 3].min() == 255
print('built 13F assets')
