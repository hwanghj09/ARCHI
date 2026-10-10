"""Make a walls-matched door (assets/objects/doors or floorNN/source, 4x scale, top = world y 250, bottom = 570) sit flush with the wall.

usage:  python flush_door_base.py <door.png> <out.png> [--no-kick]

- Rows from the wall's skirting top (world y 556) down to the floor line (570) become transparent, so the wall's own
  dark skirting shows through and lines up with the wall beside the door (no lighter rail strip under the door).
- --no-kick (glass doors): the leaves' bottom rail and the dark kick block (world y ~532..556) are replaced by the glass
  and frame posts continuing straight down from a row inside the glass (y 528), closed by a thin frame line just above
  the skirting.
Run make_door_sprite.py on the result; it keeps transparent rows transparent in the open frame.
"""
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
a = np.asarray(Image.open(src).convert('RGBA')).copy()
S = a.shape[0] / 320                      # px per world px (4)
row = lambda world_y: round((world_y - 250) * S)
skirt, glass_end, sample = row(556), row(530), row(528)
if '--no-kick' in sys.argv:
    source = a[sample].copy()                               # a row inside the glass (leaf + frame posts)
    a[glass_end:skirt] = source                             # glass runs down over the bottom rail and kick block
    post = a[sample, round(2 * S)].copy()                   # frame colour at the left post
    a[skirt - round(3 * S):skirt, :, :3] = post[:3]
    a[skirt - round(3 * S):skirt, :, 3] = 255
a[skirt:] = 0
Image.fromarray(a).save(out)
print('saved', out)
