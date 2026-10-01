"""Rebuild final sheets from retained sources and measured manifest transforms."""
from pathlib import Path
from PIL import Image
import io
import json
import os

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = json.loads((Path(__file__).parent / 'manifest.json').read_text())

for asset in MANIFEST['assets']:
    source = Image.open(ROOT / asset['source']).convert('RGBA')
    sheet = Image.new('RGBA', tuple(asset['sheetSize']))
    for index, transform in enumerate(asset['transforms']):
        cell = source.crop(transform['sourceCell']).crop(transform['sourceCrop'])
        x, y, width, height = transform['destinationRect']
        cell = cell.resize((width, height), Image.Resampling.NEAREST)
        sheet.paste(cell, (index * asset['frameSize'][0] + x, y))
    target = ROOT / asset['path']
    target.parent.mkdir(parents=True, exist_ok=True)
    data = io.BytesIO()
    sheet.save(data, format='PNG', optimize=True)
    pending = target.with_suffix('.pending')
    with pending.open('wb') as output:
        output.write(data.getvalue())
        output.flush()
        os.fsync(output.fileno())
    os.replace(pending, target)
