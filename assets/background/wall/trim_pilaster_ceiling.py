"""이미 합성된 복도 배경에서 기둥(pilaster.png)이 천장·천장 띠(y=0..95)를 뚫고 올라간 부분을 천장으로 덮는다.

usage:  python3 -B assets/background/wall/trim_pilaster_ceiling.py
compose_floor.py는 이제 기둥을 y=96부터 그린다. 이 스크립트는 그 전에 만들어져 다른 마감 단계를 거친 배경(아래 FILES)을
같은 모양으로 맞춘다. 기둥 자리는 천장(5..39줄)에서 밝은 세로 띠로 찾고, 그 0..95줄을 기둥·매입등이 없고 양옆과 밝기가 맞는
옆 천장으로 바꾼다. 소등 그림(*-off.png)은 점등 그림에서 찾은 자리를 그대로 쓴다. 이미 고친 그림은 그대로 둔다.
"""
import os
import numpy as np
from PIL import Image

BAND = 96          # 천장(0..47) + 천장 띠(48..95). 벽은 96부터(wall/README.md)
PIL_W = 48
FILES = ['floor02/walls-finished.png', 'floor03/walls.png', 'floor04/walls.png', 'floor05/walls.png', 'floor06/walls.png',
         'floor08/walls.png', 'floor09/walls.png', 'floor10/walls.png', 'floor11/walls.png', 'floor13/walls.png',
         'floor14/walls.png', 'floor15/walls.png', 'floor16/floor16-corridor.png', 'b1/b1-corridor-finished.png',
         'b2/b2-corridor-finished.png']
ROOT = os.path.join(os.path.dirname(__file__), '..')


def pilasters(rgb):
    # 천장(5..39줄)은 위아래 그라데이션이라 밝기 평균이 160을 넘지 않는다. 그보다 밝은 세로 띠가 기둥(구간 끝에서 잘린 반쪽 기둥 포함)이다.
    mask = rgb[5:40].mean(axis=2).mean(axis=0) > 195
    spans, x = [], 0
    while x < len(mask):
        if not mask[x]: x += 1; continue
        a = x
        while x < len(mask) and mask[x]: x += 1
        if x - a >= 8: spans.append((a, min(len(mask), x + 5)))   # 기둥 오른쪽 그림자 5px까지
    return spans


def source(rgb, a, b, taken):
    # 기둥을 덮을 같은 폭의 천장: 기둥·매입등이 없고, 양옆 경계 열과 밝기가 가장 비슷한 자리(매입등 번짐으로 생기는 이음매를 피한다).
    w = b - a
    left, right = rgb[:BAND, max(0, a - 1)], rgb[:BAND, min(rgb.shape[1] - 1, b)]
    best = None
    for off in range(-6 * PIL_W, 6 * PIL_W + 1, 2):
        s = a + off
        if s < 0 or s + w > rgb.shape[1] or taken[s:s + w].any(): continue
        if rgb[5:44, s:s + w].mean(axis=2).max() >= 200: continue
        cost = np.abs(rgb[:BAND, s] - left).sum() + np.abs(rgb[:BAND, s + w - 1] - right).sum()
        if best is None or cost < best[0]: best = (cost, s)
    if best is None: raise SystemExit(f'no clean ceiling near x={a}')
    return best[1]


def patch(path, spans):
    im = Image.open(path)
    arr = np.array(im)
    rgb = arr[..., :3].astype(int)
    taken = np.zeros(arr.shape[1], bool)
    for a, b in spans: taken[max(0, a - 2):b + 2] = True
    for a, b in spans:
        s = source(rgb, a, b, taken)
        arr[:BAND, a:b] = arr[:BAND, s:s + b - a]
    Image.fromarray(arr, im.mode).save(path, optimize=True)
    print(os.path.relpath(path, ROOT), len(spans), 'pilasters trimmed')


for name in FILES:
    path = os.path.join(ROOT, name)
    rgb = np.asarray(Image.open(path).convert('RGB')).astype(int)
    spans = pilasters(rgb)
    if not spans: print(name, 'already clean'); continue
    patch(path, spans)
    off = path.replace('.png', '-off.png')
    if os.path.exists(off): patch(off, spans)
