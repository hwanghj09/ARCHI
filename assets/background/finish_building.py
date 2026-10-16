"""Finish the remaining authored scenes without moving their interactive geometry.

Run from the repository root: python -B assets/background/finish_building.py
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance

sys.path.insert(0, 'assets/background')
from wall.compose_floor import main as compose_walls, tile

ROOT = Path('assets/background')
with Image.open(ROOT / 'wall/wall-concrete.png') as image:
    MODULE = image.convert('RGBA')
FLOOR = MODULE.crop((0, 570, 480, 752)).resize((480, 190), Image.Resampling.LANCZOS)
records = []


def surfaces(width, lit=False):
    ceiling = MODULE.crop((0, 0, 480, 100))
    if not lit:
        ceiling = ImageEnhance.Brightness(ceiling).enhance(.34)
        draw = ImageDraw.Draw(ceiling)
        for x in (120, 360):
            draw.ellipse((x - 14, 20, x + 14, 31), fill=(12, 16, 20, 255), outline=(54, 60, 65, 255), width=2)
    out = Image.new('RGBA', (width, 760))
    out.paste(tile(ceiling, width), (0, 0))
    out.paste(tile(FLOOR, width), (0, 570))
    return out


def save(image, path, **extra):
    assert image.height == 760 and np.asarray(image)[:, :, 3].min() == 255, str(path)
    image.save(path)
    records.append({'output': path.as_posix(), 'width': image.width, 'height': 760, **extra})


def painted(relative, width, height=720, left=0, outdoor=False):
    original = ROOT / relative
    for suffix in ('', '-off'):
        source_path = original.with_stem(original.stem + suffix)
        if not source_path.exists():
            continue
        with Image.open(source_path) as source:
            resized_width = width if not left else round(source.width * height / source.height)
            scaled = source.convert('RGBA').resize((resized_width, round(height)), Image.Resampling.LANCZOS)
        aligned = Image.new('RGBA', (width, 760), (20, 27, 30, 255))
        aligned.alpha_composite(scaled, (round(left), 0))
        result = surfaces(width, lit=not suffix and source_path.with_stem(original.stem + '-off').exists())
        y = 0 if outdoor else 100
        result.paste(aligned.crop((0, y, width, 570)), (0, y))
        assert np.array_equal(np.asarray(result)[y:570], np.asarray(aligned)[y:570])
        output = original.with_stem(original.stem + '-finished' + suffix)
        save(result, output, original=source_path.as_posix(), preserved=[y, 570])


for name, width in [('corridor-unified', 5000), ('harmony', 3224), ('vision', 2356), ('clinic', 1860)]:
    painted(f'floor1/{name}.png', width)
for name, width in [('corridor', 5000), ('vip', 3072), ('test', 2304), ('verify', 1856)]:
    painted(f'floor7/{name}.png', width)
painted('floor17/floor17.png', 3328, 768)
painted('floor17/service-corridor.png', 1800, 785.39)
painted('floor17/office-interior-aligned.png', 2400, 724 * 570 / 504)
painted('floor17/restroom.png', 1800, 824.84)
painted('b1/control-room-v4.png', 1892, 774 * 570 / 503, -154)
painted('rooftop/rooftop.png', 2400, 724 * 570 / 504, outdoor=True)

for folder, theme, rooms, segments in [
    ('b1', (103, 124, 113), [('office', 2064), ('power', 1806)],
     [(4290, 240, 'wall-concrete'), (4530, 220, 'wall-frosted'), (4750, 210, 'wall-concrete')]),
    ('b2', (45, 65, 80), [('main', 3150), ('power', 1800), ('link', 1800)],
     [(380, 700, 'wall-glass-mixed'), (3130, 400, 'wall-concrete'), (4300, 400, 'wall-frosted')]),
    ('floor17', (44, 56, 55), [('manager', 1800)], []),
]:
    target = ROOT / folder
    target.mkdir(exist_ok=True)
    for name, width in rooms:
        result = surfaces(width, lit=folder != 'floor17')
        wall = Image.blend(tile(MODULE.crop((0, 100, 480, 570)), width), Image.new('RGBA', (width, 470), theme + (255,)), .73)
        result.paste(wall, (0, 100))
        draw = ImageDraw.Draw(result)
        draw.rectangle((0, 548, width, 569), fill=(27, 38, 42, 255))
        if folder == 'b1':
            draw.line((0, 580, width, 580), fill=(175, 149, 56, 255), width=5)
        if folder == 'b2':
            for x in range(0, width, 160):
                draw.line((x, 574, x, 759), fill=(39, 53, 61, 255), width=2)
            for y in (620, 680, 740):
                draw.line((0, y, width, y), fill=(39, 53, 61, 255), width=2)
        save(result, target / f'{folder}-{name}-finished.png')
    if not segments:
        continue
    layout = {'modules': '../wall', 'width': 5000, 'fill': 'wall-concrete',
              'segments': [{'x': x, 'width': width, 'wall': wall} for x, width, wall in segments]}
    layout_path = target / 'walls-layout.json'
    layout_path.write_text(json.dumps(layout, indent=2) + '\n', encoding='utf-8')
    output = target / f'{folder}-corridor-finished.png'
    compose_walls(str(layout_path), str(output))
    with Image.open(output) as image:
        result = Image.new('RGBA', (5000, 760))
        result.paste(image, (0, 0))
        result.paste(image.crop((0, 751, 5000, 752)).resize((5000, 8)), (0, 752))
    save(result, output)

with Image.open(ROOT / 'floor02/walls.png') as source:
    result = Image.new('RGBA', (5000, 760))
    result.paste(source, (0, 0))
    result.paste(source.crop((0, 751, 5000, 752)).resize((5000, 8)), (0, 752))
save(result, ROOT / 'floor02/walls-finished.png')
(ROOT / 'finish-manifest.json').write_text(json.dumps({'assets': records}, indent=2) + '\n', encoding='utf-8')
print(f'finished {len(records)} background variants')
