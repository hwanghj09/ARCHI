"""Finish 16F while preserving the amenity artwork and its lit/unlit variants.

Run from the repository root: python -B assets/background/floor16/build.py
"""
import json
import sys
from copy import deepcopy
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance

sys.path.insert(0, 'assets/background')
from wall.compose_floor import main as compose_walls, tile

HERE = Path(__file__).parent
with Image.open(HERE.parent / 'wall/wall-concrete.png') as module:
    module = module.convert('RGBA')
    ceiling = Image.blend(module.crop((0, 0, 480, 100)), Image.new('RGBA', (480, 100), (70, 65, 55, 255)), .7)
    floor = module.crop((0, 570, 480, 752)).resize((480, 190), Image.Resampling.LANCZOS)


def aligned(name, width, floor_y, suffix):
    with Image.open(HERE / f'amenity-{name}{suffix}.png') as source:
        return source.convert('RGBA').resize((width, round(source.height * 570 / floor_y)), Image.Resampling.LANCZOS)


layout = json.loads((HERE / 'walls-layout.json').read_text(encoding='utf-8'))
for suffix in ('', '-off'):
    top = ceiling.copy()
    if suffix:
        top = ImageEnhance.Brightness(top).enhance(.55)
        draw = ImageDraw.Draw(top)
        for x in (120, 360):
            draw.ellipse((x - 14, 20, x + 14, 31), fill=(12, 15, 18, 255), outline=(55, 58, 61, 255), width=2)
    for name, width, parts in [
        ('kitchen', 3604, [('kitchen-dining', 1802, 571), ('kitchen-service', 1802, 591)]),
        ('cu', 2040, [('cu-interior', 2040, 602)]),
        ('cafe', 1904, [('cafe-interior', 1904, 596)]),
    ]:
        finished = Image.new('RGBA', (width, 760))
        finished.paste(tile(top, width), (0, 0))
        finished.paste(tile(floor, width), (0, 570))
        left = 0
        for source_name, part_width, floor_y in parts:
            source = aligned(source_name, part_width, floor_y, suffix)
            wall = source.crop((0, 100, part_width, 570))
            finished.paste(wall, (left, 100))
            # Preserve shelves and other authored geometry at the existing world coordinates.
            assert np.array_equal(np.asarray(finished)[100:570, left:left + part_width], np.asarray(wall))
            left += part_width
        assert left == width and np.asarray(finished)[:, :, 3].min() == 255
        finished.save(HERE / f'floor16-{name}{suffix}.png')

    left = aligned('corridor-left', 1800, 562, suffix)
    right = aligned('corridor-right', 1444, 563, suffix)
    left.crop((64, 0, 1124, 760)).save(HERE / f'behind-kitchen{suffix}.png')
    left.crop((1124, 0, 1724, 760)).save(HERE / f'behind-store{suffix}.png')
    right.crop((766, 0, 1326, 760)).save(HERE / f'behind-cafe{suffix}.png')
    cfg = deepcopy(layout)
    for segment in cfg['segments']:
        segment['behind'] = segment['behind'].replace('.png', f'{suffix}.png')
    layout_path = HERE / f'walls-layout{suffix}.json'
    if suffix:
        layout_path.write_text(json.dumps(cfg, indent=2) + '\n', encoding='utf-8')
    output = HERE / f'floor16-corridor{suffix}.png'
    compose_walls(str(layout_path), str(output))
    with Image.open(output) as source:
        corridor = Image.new('RGBA', (5000, 760))
        corridor.paste(source, (0, 0))
        corridor.paste(source.crop((0, 751, 5000, 752)).resize((5000, 8)), (0, 752))
    if suffix:
        corridor = ImageEnhance.Brightness(corridor).enhance(.65)
        corridor.paste(tile(top, 5000), (0, 0))
    assert np.asarray(corridor)[:, :, 3].min() == 255
    corridor.save(output)
print('built 16F finished backgrounds and lighting variants')
