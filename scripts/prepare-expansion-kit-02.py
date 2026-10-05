"""Export ARCHI expansion kit 02 from generated originals (requires Pillow)."""
import io
import json
import os
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'assets/objects/expansion-kit-02'
spec = json.loads((KIT / 'generation-spec.json').read_text(encoding='utf-8'))
entries = []
for item in spec['assets']:
    image = Image.open(KIT / 'source' / (item['id'] + '.png')).convert('RGBA')
    alpha = image.getchannel('A')
    assert alpha.getextrema()[0] == 0, item['id']
    box = alpha.point(lambda x: 255 if x > 8 else 0).getbbox()
    assert box, item['id']
    crop = image.crop(box)
    width, height = item['size']
    scale = min((width - 16) / crop.width, (height - 16) / crop.height)
    resized = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.Resampling.NEAREST)
    offset = ((width - resized.width) // 2, height - 8 - resized.height)
    output = Image.new('RGBA', (width, height))
    output.paste(resized, offset)
    assert output.getchannel('A').crop((0, height - 8, width, height)).getbbox() is None
    data = io.BytesIO()
    output.save(data, format='PNG', optimize=True)
    filename = item['id'] + '.png'
    temporary = KIT / (filename + '.tmp')
    with temporary.open('wb') as stream:
        stream.write(data.getvalue())
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(KIT / filename)
    with Image.open(KIT / filename) as check:
        check.load()
        assert check.size == (width, height)
    entries.append({'id': item['id'], 'label': item['label'], 'category': item['category'],
                    'file': filename, 'source': 'source/' + filename, 'size': [width, height],
                    'sourceSize': list(image.size), 'sourceBounds': list(box),
                    'anchor': [width // 2, height - 8], 'placement': item['placement'],
                    'suggestedWorldWidth': item['world'], 'frames': 1, 'integrated': False})
(KIT / 'manifest.json').write_text(json.dumps({'version': 1, 'generator': 'built-in image_gen', 'assets': entries}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Exported and decoded {len(entries)} transparent props.')
