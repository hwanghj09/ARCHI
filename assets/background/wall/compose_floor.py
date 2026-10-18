"""Compose one floor-wide walls-only background from the v3 modules.

usage:  python3 compose_floor.py layout.json out.png

layout.json example:
{
  "modules": "v3",                       # folder with wall-*.png / pilaster.png (@1x) - use "@2x": true for the 2x set
  "width": 3200,                         # total width in game px (config.width of the floor)
  "fill": "wall-concrete",               # module used for everything not listed in segments
  "segments": [                          # x / width in game px (same numbers as the room x / width in floor-XX.js)
    {"x": 600,  "width": 720, "wall": "wall-frosted",     "behind": "rooms/hall.png"},
    {"x": 1500, "width": 480, "wall": "wall-concrete"},
    {"x": 2300, "width": 720, "wall": "wall-glass-mixed", "behind": "rooms/lounge.png"}
  ]
}
- every segment gets a pilaster on both ends automatically (from the wall top y=96 down: the ceiling and its soffit band run over it)
- "behind" (optional): an image drawn behind glass walls (room interior). Add "behind_floor_y": <floor line y in that image>
  so its floor is aligned to y=570 (e.g. 438 for the floor-section assets); otherwise it is scaled to the module height
- result: height 752 (floor line at 570). In floor-XX.js:
      backgroundWallsOnly: true,
      backgroundImage: { src: 'assets/background/floorXX/walls.png', height: 752, top: 0 }
"""
import json, sys, os
from PIL import Image


def tile(mod, width):
    out = Image.new('RGBA', (width, mod.size[1]), (0, 0, 0, 0))
    x = 0
    while x < width:
        out.alpha_composite(mod.crop((0, 0, min(mod.size[0], width - x), mod.size[1])), (x, 0))
        x += mod.size[0]
    return out


def main(layout_path, out_path):
    cfg = json.load(open(layout_path))
    base = os.path.join(os.path.dirname(layout_path), cfg.get('modules', 'v3'))
    k = 2 if cfg.get('@2x') else 1
    suffix = '@2x' if k == 2 else ''
    load = lambda n: Image.open(os.path.join(base, f'{n}{suffix}.png')).convert('RGBA')
    pil = load('pilaster')
    H = pil.size[1]
    Wt = cfg['width'] * k
    canvas = tile(load(cfg.get('fill', 'wall-concrete')), Wt)
    # 기둥은 벽 윗선(y=96)부터 그린다. 천장과 천장 띠는 기둥 위로 그대로 이어진다(trim_pilaster_ceiling.py와 같은 규칙).
    top = 96 * k
    pil = pil.crop((0, top, pil.size[0], H))
    for seg in cfg.get('segments', []):
        x, w = seg['x'] * k, seg['width'] * k
        layer = Image.new('RGBA', (w, H), (12, 13, 15, 255))
        if seg.get('behind'):
            b = Image.open(os.path.join(os.path.dirname(layout_path), seg['behind'])).convert('RGBA')
            fy = seg.get('behind_floor_y')            # floor line of the behind image -> aligned to y=570
            sc = (570 * k) / fy if fy else H / b.size[1]
            b = b.resize((int(b.size[0] * sc), int(b.size[1] * sc)), Image.LANCZOS)
            layer.alpha_composite(b.crop((0, 0, min(w, b.size[0]), H)), (0, 0))
        layer.alpha_composite(tile(load(seg['wall']), w))
        canvas.paste(layer, (x, 0))
        canvas.alpha_composite(pil, (x - pil.size[0] // 2, top))
        canvas.alpha_composite(pil, (x + w - pil.size[0] // 2, top))
    canvas.save(out_path)
    print('saved', out_path, canvas.size)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
