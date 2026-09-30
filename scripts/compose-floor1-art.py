"""1층 배경 4종(corridor/harmony/vision/clinic) 합성 스크립트.

PROMPT.md의 9개 프롬프트(corridor-a/b/c/d, harmony-1/2, vision-1/2, clinic)를 image_gen으로 만든
뒤, 이 스크립트로 바닥선(y=570)을 맞춰 이어 붙인다. 7층 compose-floor7-art.py와 같은 방식
(바닥선 자동 검출 → 동일 배율 스케일 → top 오프셋 정렬)이다. 사용법은 GENERATED.md 참고.
"""
import sys
from PIL import Image
import numpy as np

def detect_floor(im):
    gray = im.convert('L')
    arr = np.asarray(gray, dtype=np.float32)
    h, w = arr.shape
    row_mean = arr.mean(axis=1)
    lo, hi = int(h * 0.60), int(h * 0.92)
    band = row_mean[lo:hi]
    idx = int(np.argmax(band)) + lo
    return idx, h, w

def scaled_piece(path, target_w, crop=None):
    im = Image.open(path).convert('RGB')
    if crop:
        im = im.crop(crop)
    floor_y, h, w = detect_floor(im)
    s = target_w / w
    new_h = round(h * s)
    im2 = im.resize((target_w, new_h), Image.LANCZOS)
    top = 570 - floor_y * s
    return im2, top, s, floor_y

def compose(out_path, layout, bg_color, total_w):
    """layout: [(source_path, target_world_width, x_offset, crop_or_None), ...]"""
    canvas = Image.new('RGB', (total_w, 720), bg_color)
    for path, target_w, x, crop in layout:
        im2, top, s, floor_y = scaled_piece(path, target_w, crop)
        canvas.paste(im2, (x, round(top)))
        print(f'{out_path}: {path} -> x={x} w={target_w} scale={s:.4f} '
              f'src_floor_y={floor_y} top={top:.1f} scaled_h={im2.height} crop={crop}')
    canvas.save(out_path)
    print('saved', out_path, canvas.size)

if __name__ == '__main__':
    # 사용법: python compose-floor1-art.py <corridor-a> <corridor-b> <corridor-c> <corridor-d> <harmony-1> <harmony-2> <vision-1> <vision-2> <clinic>
    if len(sys.argv) != 10:
        print(__doc__)
        sys.exit(1)
    ca, cb, cc, cd, h1, h2, v1, v2, cl = sys.argv[1:10]
    out_dir = 'assets/background/floor1'
    # 채움색은 CSS placeholder(atrium 테마)가 아니라, 새 그림의 실측 어두운 톤(대략 RGB 3~10)에 맞춘
    # 거의 검은색이다 — 밝은 채움색을 쓰면 top 오프셋 위 빈 띠가 도드라져 보인다(실측 후 발견, 아래 참고).
    # corridor-a는 원본 천장 여백이 b/c/d보다 훨씬 적어서(바닥선을 570에 맞추면 top=45.5, 나머지는
    # 88~95) 이음매에서 천장 높이가 눈에 띄게 어긋나 보였다(실측 후 발견). 위쪽을 49px 더 잘라내
    # top을 나머지 조각과 비슷하게(약 90) 맞춘다.
    ca_crop = (0, 49, 1993, 789)
    compose(f'{out_dir}/corridor.png', [
        (ca, 1818, 0, ca_crop),
        (cb, 1268, 1818, None),
        (cc, 1196, 3086, None),
        (cd, 718, 4282, None),
    ], '#050505', 5000)
    compose(f'{out_dir}/harmony.png', [
        (h1, 1680, 0, None),
        (h2, 1544, 1680, None),
    ], '#050403', 3224)
    compose(f'{out_dir}/vision.png', [
        (v1, 1178, 0, None),
        (v2, 1178, 1178, None),
    ], '#050506', 2356)
    compose(f'{out_dir}/clinic.png', [
        (cl, 1860, 0, None),
    ], '#050605', 1860)
