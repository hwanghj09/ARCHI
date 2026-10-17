"""Finish cutaway rooms with continuous ceiling/floor layers and the shared corridor walls."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from wall.compose_floor import main as compose_walls
from cutaway_kit import door_bay


def finish_floor(directory, rooms, bays=None):
    """bays: {name: (x, door_width, wall module)} -- the room's exit wall section (cutaway_kit.door_bay), inserted into the
    stretched wall (world y=100..556) so the ceiling/floor layers below get the new width."""
    folder = Path(directory)
    prefix = folder.name
    for name, (block, board, band) in rooms.items():
        width = block.shape[1]
        # 2층과 같은 경계: 슬래브를 버리고, 걸레받이 아래는 별도 바닥으로 이어 붙인다.
        wall = np.asarray(Image.fromarray(block[82:442]).resize((width, 475), Image.Resampling.LANCZOS)).copy()
        wall[456:] = 0
        if bays and name in bays:
            x, door_width, module = bays[name]
            wall = door_bay(wall, x, door_width, module, rows=(0, 456), world_top=100)
            width = wall.shape[1]
        Image.fromarray(wall).save(folder / f'{prefix}-{name}-interior.png')

        ceiling = Image.new('RGBA', (width, 100), board + (255,))
        draw = ImageDraw.Draw(ceiling)
        for y in range(84):
            draw.line((0, y, width, y), fill=tuple(int(c * (.78 + .22 * y / 84)) for c in board) + (255,))
        for x in range(0, width, 120):
            draw.line((x, 0, x, 84), fill=tuple(int(c * .74) for c in board) + (255,))
        draw.line((0, 30, width, 30), fill=(22, 26, 28, 255))
        for x in range(60, width, 240):
            draw.ellipse((x - 20, 48, x + 20, 60), fill=(14, 16, 17, 255), outline=(150, 152, 148, 255), width=2)
        for x in range(180, width - 140, 720):
            draw.rectangle((x, 38, x + 140, 70), fill=(20, 24, 26, 255), outline=band + (255,), width=2)
            for gx in range(x + 8, x + 134, 6):
                draw.line((gx, 43, gx, 65), fill=(80, 84, 86, 255))
        draw.rectangle((0, 84, width, 99), fill=band + (255,))
        ceiling.save(folder / f'{prefix}-ceiling-{name}.png')

        floor = Image.new('RGBA', (width, 204))
        draw = ImageDraw.Draw(floor)
        for y in range(204):
            draw.line((0, y, width, y), fill=(int(24 - 10 * y / 204), int(27 - 10 * y / 204), int(30 - 10 * y / 204), 255))
        draw.rectangle((0, 0, width, 1), fill=(64, 68, 66, 255))
        for y in (48, 100):
            draw.line((0, y, width, y), fill=(14, 16, 18, 255))
        for x in range(0, width, 160):
            draw.line((x, 4, x - 30, 203), fill=(16, 18, 20, 255))
        floor.save(folder / f'{prefix}-floor-{name}.png')

    compose_walls(str(folder / 'walls-layout.json'), str(folder / 'walls.png'))
    # 공용 복도는 752px이므로 아래쪽 8px도 같은 바닥으로 채워 방 내부와 높이를 맞춘다.
    with Image.open(folder / 'walls.png') as walls:
        corridor = Image.new('RGBA', (walls.width, 760))
        corridor.paste(walls, (0, 0))
        corridor.paste(walls.crop((0, 751, walls.width, 752)).resize((walls.width, 8)), (0, 752))
    corridor.save(folder / 'walls.png')
