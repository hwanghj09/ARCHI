"""Finish 12F without moving its painted doors or the adjusted building core.

Run from the repository root: python -B assets/background/floor12/build.py
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance

sys.path.insert(0, 'assets/background')
from cutaway_finish import finish_floor
from wall.compose_floor import tile

HERE = Path(__file__).parent
finish_floor(HERE, {})
with Image.open(HERE / 'corridor.png') as source, Image.open(HERE / 'walls.png') as walls:
    # Art mode has no walls-mode filter; match the neighbouring corridors in the image.
    corridor = ImageEnhance.Brightness(ImageEnhance.Color(walls).enhance(.85)).enhance(.72)
    # Keep the authored doorway sizes and highlights, including the wide sliding door.
    # 모델 평가실 보안문은 간판(방 가운데 x=3231) 아래로 139px 오른쪽에 붙인다(doorX 3159).
    for box, dx in [((707, 250, 916, 570), 0), ((3000, 295, 3185, 570), 139), ((4490, 280, 4660, 570), 0)]:
        corridor.alpha_composite(source.convert('RGBA').crop(box), (box[0] + dx, box[1]))
corridor.save(HERE / 'corridor-finished.png')

with Image.open(HERE.parent / 'wall/wall-concrete.png') as module:
    module = module.convert('RGBA')
    ceiling = Image.blend(module.crop((0, 0, 480, 100)), Image.new('RGBA', (480, 100), (20, 25, 31, 255)), .76)
    draw = ImageDraw.Draw(ceiling)
    for x in (120, 360):
        draw.ellipse((x - 14, 20, x + 14, 31), fill=(12, 15, 19, 255), outline=(67, 74, 80, 255), width=2)
    floor = module.crop((0, 570, 480, 752))
    floor = floor.resize((480, 190), Image.Resampling.LANCZOS)

for name in ('office', 'eval', 'lead'):
    with Image.open(HERE / f'{name}.png') as source:
        source = source.convert('RGBA')
        finished = Image.new('RGBA', (source.width, 760))
        finished.paste(tile(ceiling, source.width), (0, 0))
        finished.paste(source.crop((0, 100, source.width, 570)), (0, 100))
        finished.paste(tile(floor, source.width), (0, 570))
        # Door relocation crops use these exact pixels at runtime.
        assert np.array_equal(np.asarray(finished)[100:570], np.asarray(source)[100:570])
    assert np.asarray(finished)[:, :, 3].min() == 255
    finished.save(HERE / f'{name}-finished.png')
assert np.asarray(corridor)[:, :, 3].min() == 255
print('built 12F finished backgrounds')
