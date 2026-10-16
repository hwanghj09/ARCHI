"""11F: reuse the common wall kit and keep furniture as interactive floor-kit props.

Run from the repository root: python -B assets/background/floor11/build.py
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
for name, width, board, band in [
    ('sales', 3600, (68, 76, 90), (72, 76, 88)),
    ('strategy', 1800, (54, 62, 78), (66, 70, 86)),
    ('marketing', 1800, (68, 72, 84), (74, 78, 88)),
]:
    wall = tile(panel, width)
    # The shared texture remains visible through the department's navy wall finish.
    wall = Image.blend(wall, Image.new('RGBA', wall.size, (35, 45, 66, 255)), .74)
    draw = ImageDraw.Draw(wall)
    for y in range(330, 456):
        draw.line((0, y, width, y), fill=(25, 33, 50, 255))
    for x in range(0, width, 160):
        draw.line((x, 334, x, 451), fill=(47, 55, 72, 255), width=2)
    draw.rectangle((0, 328, width, 331), fill=(123, 108, 72, 255))
    draw.rectangle((0, 448, width, 455), fill=(14, 19, 28, 255))
    windows = [440, 790, 2080, 2430, 2780] if name == 'sales' else []
    for x in windows:
        draw.rectangle((x, 34, x + 302, 286), fill=(14, 21, 34, 255), outline=(100, 102, 108, 255), width=5)
        draw.rectangle((x + 8, 42, x + 294, 278), fill=(21, 32, 53, 255))
        draw.polygon([(x + 12, 46), (x + 90, 46), (x + 260, 274), (x + 210, 274)], fill=(28, 40, 60, 255))
        draw.line((x + 151, 38, x + 151, 282), fill=(87, 91, 102, 255), width=4)
        draw.line((x + 4, 210, x + 298, 210), fill=(87, 91, 102, 255), width=3)
    if name == 'strategy':
        draw.rectangle((520, 20, 1160, 300), fill=(9, 13, 21, 255), outline=(44, 52, 72, 255), width=8)
        draw.polygon([(528, 28), (635, 28), (800, 292), (744, 292)], fill=(19, 26, 40, 255))
    # Adapt the kit wall to the same source rows consumed by the existing finisher.
    block = Image.new('RGBA', (width, 442))
    block.paste(wall.resize((width, 360), Image.Resampling.LANCZOS), (0, 82))
    rooms[name] = (np.asarray(block), board, band)

# A compressed view of the same office sits behind the corridor's mixed glass.
behind = Image.new('RGBA', (632, 760), (17, 23, 36, 255))
behind.paste(Image.fromarray(rooms['sales'][0][82:442]).resize((632, 456)), (0, 100))
for file, x, width in [('staff-lockers', 60, 82), ('office-desk', 220, 180), ('large-planter', 540, 62)]:
    with Image.open(HERE.parent.parent / 'objects/floor-kit' / f'{file}.png') as prop:
        prop = prop.convert('RGBA').resize((width, round(prop.height * width / prop.width)), Image.Resampling.LANCZOS)
        behind.alpha_composite(prop, (x, 570 - prop.height))
behind.save(HERE / 'behind-sales.png')
finish_floor(HERE, rooms)
for name, (block, _, _) in rooms.items():
    assert block.shape[1] in (1800, 3600)
    with Image.open(HERE / f'floor11-{name}-interior.png') as wall:
        assert wall.size == (block.shape[1], 475)
print('built 11F assets')
