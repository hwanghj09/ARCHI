"""7층 배경 4종(corridor/vip/test/verify) 합성 스크립트.

PROMPT.md의 9개 프롬프트(corridor-a/b/c/d, vip-1/2, test-1/2, verify)를 image_gen으로 만든 뒤,
이 스크립트로 바닥선(y=570)을 맞춰 이어 붙인다. 사용법은 GENERATED.md 참고. 12층
compose-floor12-art.py와 같은 방식(바닥선 자동 검출 → 동일 배율 스케일 → top 오프셋 정렬)이다.

floor line 탐지: 이미지 높이의 60~92% 구간에서 행 평균 밝기가 가장 높은 행을 바닥선으로 잡는다.
corridor-a 원본은 생성 결함으로 위/아래에 순백색 레터박스 띠가 있었다 — CROP_BOXES로 그 부분을
먼저 잘라내고(콘텐츠만) 그 안에서 바닥선을 다시 찾는다.
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
    # 사용법: python compose-floor7-art.py <corridor-a> <corridor-b> <corridor-c> <corridor-d> <vip-1> <vip-2> <test-1> <test-2> <verify> [--ca-crop]
    if len(sys.argv) not in (10, 11):
        print(__doc__)
        sys.exit(1)
    ca, cb, cc, cd, v1, v2, t1, t2, vf = sys.argv[1:10]
    out_dir = 'assets/background/floor7'
    # 재생성 전 corridor-a 원본(1993x789)은 위 114px/아래 82px가 순백 레터박스 결함이었다.
    # 재생성본은 정상(edge-to-edge)이라 기본은 crop 없음. 구버전 파일을 다시 쓸 때만 --ca-crop을 준다.
    ca_crop = (0, 114, 1993, 707) if len(sys.argv) == 11 and sys.argv[10] == '--ca-crop' else None
    compose(f'{out_dir}/corridor.png', [
        (ca, 1818, 0, ca_crop),
        (cb, 1268, 1818, None),
        (cc, 1196, 3086, None),
        (cd, 718, 4282, None),
    ], '#0f0e0c', 5000)
    compose(f'{out_dir}/vip.png', [
        (v1, 1750, 0, None),
        (v2, 1322, 1750, None),
    ], '#0f0e0c', 3072)
    compose(f'{out_dir}/test.png', [
        (t1, 1150, 0, None),
        (t2, 1154, 1150, None),
    ], '#20252a', 2304)
    compose(f'{out_dir}/verify.png', [
        (vf, 1856, 0, None),
    ], '#1d2023', 1856)
