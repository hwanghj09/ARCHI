# 단면 에셋(3200×556, 바닥선 y=438, 사방 여백 48px, PROMPT.md 형식)을 게임 장면으로 나누는 공용 도구. 각 층의 build.py가 쓴다.
# 에셋은 플레이어 162px = 175cm 기준이라 1:1로 쓴다: 그림 y=438 → 월드 y=570, 그림 top = 132(월드 y = 그림 y + 132).
# 건물 코어(엘리베이터 x=1818..2660, 계단 2906..3086, 화장실 3556..4282)는 모든 층에서 같은 자리라 복도에는 방 앞 유리 너머로 방 그림의
# 일부만 보이고(왼쪽 구역 32..1790, 오른쪽 구역 4282..4968), 방 안에는 방 그림 전체를 반복 칸으로 넓혀 쓴다.
#
#   kit = Cutaway('assets/background/floor03/floor03-welfare.png')
#   corridor = kit.corridor_wall(wall=(1176, 1226))             # 복도 벽 색을 뽑을 원본 기둥·칸막이 열
#   kit.place(corridor, 40, kit.glass(kit.cols((48, 1024), (1176, 1200))))
#   kit.save(corridor, 'assets/background/floor03/floor03-corridor.png')
#   kit.save(kit.cols((48, 600), *[(600, 760, k % 2) for k in range(4)], (600, 1226)), '...-interior.png')
#   door_sheet('steel', 120, 'assets/background/floor03/floor03-gym-door.png')
#   preview_corridor(...), preview_interior(...)  # 확인용 합성 그림(스크래치에 저장)
from PIL import Image, ImageDraw
import numpy as np

FLOOR = 438
TOP = 132
CORE = {'elevators': [(1818, 218), (2148, 214), (2444, 216)], 'stairs': (2906, 180), 'restroom_door': (3612, 145)}
ROOT = 'assets/objects/floor17/'


class Cutaway:
    def __init__(self, path, seed=0):
        self.A = np.asarray(Image.open(path).convert('RGBA')).copy()
        self.H = self.A.shape[0]
        self.rng = np.random.default_rng(seed)

    def cols(self, *pieces):
        """Join source column ranges a..b; a third item that is truthy mirrors that piece."""
        out = []
        for piece in pieces:
            a, b = piece[:2]
            block = self.A[:, a:b]
            out.append(block[:, ::-1] if len(piece) > 2 and piece[2] else block)
        return np.concatenate(out, axis=1)

    def strip(self, a, b, width):
        """A clean column strip a..b stretched (repeated) to width: a plain wall filler."""
        return np.repeat(self.A[:, a:b], width // (b - a) + 1, axis=1)[:, :width]

    def glass(self, block, top=82):
        """A room seen from the corridor sits behind glass: darker, cooler, mullions every 160px, faint reflections."""
        out = block.astype(float)
        h, w = out.shape[:2]
        yy, xx = np.mgrid[0:h, 0:w]
        inside = (yy >= top) & (yy < FLOOR) & (out[..., 3] > 0)
        out[inside, :3] *= np.array([0.66, 0.72, 0.8])
        for offset, band in ((60, 16), (250, 8), (420, 22)):
            stripe = inside & (((xx + (yy - top) * 0.5) - offset) % 520 < band)
            out[stripe, :3] = out[stripe, :3] * 0.88 + np.array([150, 170, 185]) * 0.12
        for x in range(0, w, 160):
            out[(xx >= x) & (xx < x + 4) & inside, :3] = (22, 28, 32)
        out[(yy >= FLOOR - 4) & (yy < FLOOR) & (out[..., 3] > 0), :3] = (54, 62, 66)
        return out.astype(np.uint8)

    def corridor_wall(self, width=5000, wall=(2200, 2224), slab=(1560, 2160), floor=(700, 1400), tint=(1, 1, 1)):
        """Corridor wall in the asset's own materials: its ceiling slab (rows 48..82) and floor slab (438..510) tiled,
        a wall coloured row by row from a plain source column range (a pillar or partition), a dark ceiling band with
        unlit downlights, seams every 120px, a dado line and a skirting."""
        A = self.A
        block = np.zeros((self.H, width, 4), np.uint8)
        for y0, src in ((48, A[48:82, slab[0]:slab[1]]), (FLOOR, A[FLOOR:510, floor[0]:floor[1]])):
            reps = width // (2 * src.shape[1]) + 1
            block[y0:y0 + src.shape[0]] = np.concatenate([src, src[:, ::-1]] * reps, axis=1)[:, :width]
        profile = np.median(A[82:FLOOR, wall[0]:wall[1]].astype(int), axis=1)[:, :3] * np.array(tint)
        body = profile[:, None, :] + self.rng.integers(-3, 4, (FLOOR - 82, width, 1))
        body[:38] = body[:38] * .55
        for x in range(60, width, 240):
            body[30:34, x:x + 70] = (52, 60, 62)
        for x in range(0, width, 120):
            body[38:, x:x + 2] = body[38:, x:x + 2] * .6
        body[38:42] = (40, 46, 48)
        body[250:254] = (70, 74, 70)
        body[340:] = body[340:] * .8
        body[-6:] = (18, 22, 24)
        block[82:FLOOR, :, :3] = np.clip(body, 0, 255)
        block[82:FLOOR, :, 3] = 255
        return block

    def place(self, canvas, x, block):
        canvas[:, x:x + block.shape[1]] = block
        return canvas

    def decor(self, canvas, src_box, world_x, world_y):
        """Copy a small painted detail (src_box = x0, y0, x1, y1 in the asset) to world_x, world_y on a 1:1 scene image."""
        x0, y0, x1, y1 = src_box
        row = world_y - TOP
        canvas[row:row + (y1 - y0), world_x:world_x + (x1 - x0)] = self.A[y0:y1, x0:x1]
        return canvas

    def save(self, block, path):
        Image.fromarray(np.ascontiguousarray(block)).save(path)
        return block.shape[1]


# ---------------------------------------------------------------- 문 스프라이트(닫힘 | 열림 두 칸), 높이 210 = 에셋의 문 높이
PALETTES = {
    'steel': ((40, 46, 50), (92, 102, 106), (130, 140, 142)),
    'wood': ((52, 38, 26), (96, 72, 50), (128, 98, 70)),
    'glass': ((38, 44, 48), (30, 40, 44), (70, 86, 90)),
    'double': ((120, 98, 52), (26, 50, 54), (150, 124, 66)),
}


def _opening(d, w, h, inset):
    for y in range(inset, h):
        t = y / h
        d.line([inset, y, w - inset - 1, y], fill=(int(7 + 8 * t), int(10 + 9 * t), int(12 + 10 * t), 255))


def _door(d, w, h, opened, kind, frame, leaf, hi, accent):
    d.rectangle([0, 0, w - 1, h - 1], fill=frame + (255,))
    if opened:
        _opening(d, w, h, 4)
        if kind == 'double':
            for x0, x1 in ((4, 18), (w - 19, w - 5)):
                d.rectangle([x0, 6, x1, h - 2], fill=leaf + (255,), outline=hi + (255,))
        else:
            d.polygon([(4, 4), (20, 11), (20, h - 5), (4, h - 1)], fill=leaf + (255,))
            d.line([20, 11, 20, h - 5], fill=hi + (255,))
        return
    d.rectangle([4, 4, w - 5, h - 1], fill=leaf + (255,))
    d.line([5, 5, 5, h - 1], fill=hi + (255,))
    if kind == 'steel':
        d.rectangle([w // 2 - 12, 26, w // 2 + 12, 72], fill=(20, 26, 30, 255), outline=(60, 68, 72, 255))
        for k in range(0, 46, 6):
            d.line([w // 2 - 12, 26 + k, w // 2 + 12, 26 + k + 6], fill=(50, 58, 62, 255))
        d.rectangle([10, 108, w - 11, 114], fill=(150, 158, 160, 255))
        d.rectangle([4, h - 18, w - 5, h - 1], fill=tuple(int(c * .76) for c in leaf) + (255,))
    elif kind == 'wood':
        for y0, y1 in ((14, 92), (104, h - 14)):
            d.rectangle([12, y0, w - 13, y1], outline=frame + (255,))
            d.line([13, y0 + 1, w - 14, y0 + 1], fill=hi + (255,))
        d.ellipse([w - 20, 102, w - 12, 110], fill=(190, 170, 110, 255))
    elif kind == 'glass':
        d.rectangle([12, 12, w - 13, h - 46], fill=(24, 34, 38, 255), outline=frame + (255,))
        d.polygon([(18, 12), (32, 12), (12, 60), (12, 40)], fill=hi + (255,))
        d.rectangle([12, h - 38, w - 13, h - 8], outline=frame + (255,))
        d.rectangle([w - 22, 96, w - 18, 130], fill=(190, 186, 170, 255))
    elif kind == 'double':
        half = w // 2
        for x0 in (4, half + 1):
            d.rectangle([x0, 5, x0 + half - 6, h - 2], fill=leaf + (255,), outline=(8, 14, 16, 255))
            d.rectangle([x0 + 6, 20, x0 + half - 12, 36], outline=hi + (255,))
        d.rectangle([half - 14, 96, half - 6, 136], fill=hi + (255,))
        d.rectangle([half + 6, 96, half + 14, 136], fill=hi + (255,))
        d.line([half, 4, half, h - 1], fill=(8, 12, 14, 255), width=2)
    if accent:                                   # 카드 리더 등 작은 표시등(색)
        d.rectangle([w - 16, 92, w - 12, 100], fill=accent + (255,))


def door_sheet(kind, width, path, colors=None, accent=None, height=210):
    """Two-frame (shut | open) door sprite. kind: steel | wood | glass | double; colors = (frame, leaf, highlight)."""
    frame, leaf, hi = colors or PALETTES[kind]
    frames = []
    for opened in (False, True):
        image = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        _door(ImageDraw.Draw(image), width, height, opened, kind, frame, leaf, hi, accent)
        frames.append(np.asarray(image))
    Image.fromarray(np.concatenate(frames, axis=1)).save(path)


# ---------------------------------------------------------------- 확인용 합성 그림
def _paste_sprite(canvas, path, x, y, w, h):
    sprite = Image.open(path).convert('RGBA')
    canvas.alpha_composite(sprite.crop((0, 0, sprite.width // 2, sprite.height)).resize((w, h)), (x, y))


def preview_corridor(corridor_png, doors, out_path, spots=(), crop=None, background=(14, 20, 22, 255)):
    """doors: [(sprite_png, x, width, y)]; spots: [(x0, x1, y0, y1)] world boxes. Draws the core sprites too."""
    canvas = Image.new('RGBA', (5000, 720), background)
    canvas.alpha_composite(Image.open(corridor_png).convert('RGBA'), (0, TOP))
    stairs = Image.open(ROOT + 'stairs.png').convert('RGBA').crop((0, 0, 256, 512)).resize((180, 338))
    canvas.alpha_composite(stairs, (2906, 232))
    car = Image.open(ROOT + 'elevator.png').convert('RGBA').crop((0, 0, 256, 512))
    for x, w in CORE['elevators']:
        canvas.alpha_composite(car.resize((w, 350)), (x, 220))
    ImageDraw.Draw(canvas).rectangle([3612, 210, 3757, 570], fill=(48, 58, 64, 255))
    for sprite, x, w, y in doors:
        _paste_sprite(canvas, sprite, x, y, w, 570 - y)
    d = ImageDraw.Draw(canvas)
    for x0, x1, y0, y1 in spots:
        d.rectangle([x0, y0, x1, y1], outline=(0, 255, 120, 255), width=3)
    image = canvas.convert('RGB')
    (image.crop(crop) if crop else image).save(out_path)


def preview_interior(interior_png, exit_door, out_path, spots=(), covers=(), background=(14, 20, 22, 255)):
    """exit_door = (sprite_png, x, width, y); spots: [(x0, x1, y0, y1)] world boxes; covers: dark boxes like screen covers."""
    art = Image.open(interior_png).convert('RGBA')
    canvas = Image.new('RGBA', (art.width, 720), background)
    canvas.alpha_composite(art, (0, TOP))
    sprite, x, w, y = exit_door
    _paste_sprite(canvas, sprite, x, y, w, 570 - y)
    d = ImageDraw.Draw(canvas)
    for x0, x1, y0, y1 in covers:
        d.rectangle([x0, y0, x1, y1], fill=(5, 9, 11, 255))
    for x0, x1, y0, y1 in spots:
        d.rectangle([x0, y0, x1, y1], outline=(0, 255, 120, 255), width=3)
    canvas.convert('RGB').save(out_path)
