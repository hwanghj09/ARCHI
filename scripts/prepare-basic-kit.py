"""Re-export generated ARCHI props. Requires Pillow; run from any directory."""
import json
import io
import os
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'assets/objects/basic-kit'
spec = json.loads((KIT / 'generation-spec.json').read_text())
entries = []
def save_png(image, path):
    buffer = io.BytesIO()
    image.save(buffer, format='PNG', optimize=True)
    temporary = path.with_suffix('.png.tmp')
    with temporary.open('wb') as stream:
        stream.write(buffer.getvalue())
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(path)

for item in spec['assets']:
    image = Image.open(KIT / 'source' / (item['id'] + '.png')).convert('RGBA')
    count = 2 if item.get('sheet') else 1
    assert image.width % count == 0
    width, height = item['size']
    cell_width = width // count
    source_cell_width = image.width // count
    frames, bounds = [], []
    for i in range(count):
        frame = image.crop((i * source_cell_width, 0, (i + 1) * source_cell_width, image.height))
        box = frame.getchannel('A').point(lambda x: 255 if x > 8 else 0).getbbox()
        assert box, item['id']
        frames.append(frame.crop(box))
        bounds.append(list(box))
    # A common scale avoids changing hardware size between power states.
    scale = min((cell_width - 16) / max(f.width for f in frames),
                (height - 16) / max(f.height for f in frames))
    output = Image.new('RGBA', (width, height))
    frame_info = []
    for i, frame in enumerate(frames):
        resized = frame.resize((max(1, round(frame.width * scale)), max(1, round(frame.height * scale))), Image.Resampling.NEAREST)
        x = (cell_width - resized.width) // 2
        y = height - 8 - resized.height
        cell = Image.new('RGBA', (cell_width, height))
        cell.paste(resized, (x, y))
        output.paste(cell, (i * cell_width, 0))
        info = {'name': ['off', 'on'][i] if count == 2 else 'default',
                'rect': [i * cell_width, 0, cell_width, height],
                'anchor': [cell_width // 2, height - 8],
                'sourceBounds': bounds[i]}
        if count == 2:
            filename = item['id'] + '-' + info['name'] + '.png'
            save_png(cell, KIT / filename)
            info['file'] = filename
        frame_info.append(info)
    save_png(output, KIT / (item['id'] + '.png'))
    assert output.getchannel('A').getextrema()[0] == 0
    assert output.getchannel('A').crop((0, height-8, width, height)).getbbox() is None
    entries.append({'id': item['id'], 'label': item['label'], 'category': item['category'],
                    'file': item['id'] + '.png', 'source': 'source/' + item['id'] + '.png',
                    'size': [width, height], 'sourceSize': list(image.size),
                    'frames': frame_info, 'suggestedWorldWidth': item['world'],
                    'placement': 'wall' if item['id'] in ['restroom-urinal','restroom-toilet-accessible'] else 'floor-or-surface',
                    'integrated': False})
(KIT / 'manifest.json').write_text(json.dumps({'version': 1, 'generator': 'built-in image_gen', 'assets': entries}, ensure_ascii=False, indent=2) + '\n')
print(f'Exported {len(entries)} props, including {sum(len(a["frames"]) == 2 for a in entries)} two-state sheets.')
