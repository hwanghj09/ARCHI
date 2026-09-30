"""12층 배경 4종(corridor/office/eval/lead) 합성 스크립트.

PROMPT.md의 7개 프롬프트(corridor-1/2/3, dev-1/2, eval, lead)를 GPT 이미지 생성 도구로 만든 뒤,
이 스크립트로 바닥선(y=570)을 맞춰 이어 붙인다. 사용법은 GENERATED.md 참고.

floor line 탐지: 각 조각은 "바닥이 끝나고 어두운 단면이 시작되는" 지점에 밝은 가로줄이 있다.
이 스크립트는 이미지 높이의 60~92% 구간에서 행 평균 밝기가 가장 높은 행을 그 줄로 잡는다
(여러 장에서 실측 비교해 정확함을 확인했다 — GENERATED.md의 "바닥선 검출" 절 참고).
"""
import sys
from PIL import Image
import numpy as np

def detect_floor(path):
    im = Image.open(path).convert('L')
    arr = np.asarray(im, dtype=np.float32)
    h, w = arr.shape
    row_mean = arr.mean(axis=1)
    lo, hi = int(h * 0.60), int(h * 0.92)
    band = row_mean[lo:hi]
    idx = int(np.argmax(band)) + lo
    return idx, h, w

def scaled_piece(path, target_w):
    floor_y, h, w = detect_floor(path)
    s = target_w / w
    im = Image.open(path).convert('RGB')
    new_h = round(h * s)
    im2 = im.resize((target_w, new_h), Image.LANCZOS)
    top = 570 - floor_y * s
    return im2, top, s, floor_y

def compose(out_path, layout, bg_color, total_w):
    """layout: [(source_path, target_world_width, x_offset), ...]"""
    canvas = Image.new('RGB', (total_w, 720), bg_color)
    for path, target_w, x in layout:
        im2, top, s, floor_y = scaled_piece(path, target_w)
        canvas.paste(im2, (x, round(top)))
        print(f'{out_path}: {path} -> x={x} w={target_w} scale={s:.4f} '
              f'src_floor_y={floor_y} top={top:.1f} scaled_h={im2.height}')
    canvas.save(out_path)
    print('saved', out_path, canvas.size)

if __name__ == '__main__':
    # 사용법: python compose-floor12-art.py <corridor-1> <corridor-2> <corridor-3> <dev-1> <dev-2> <eval> <lead>
    if len(sys.argv) != 8:
        print(__doc__)
        sys.exit(1)
    c1, c2, c3, d1, d2, ev, ld = sys.argv[1:8]
    out_dir = 'assets/background/floor12'
    compose(f'{out_dir}/corridor.png', [(c1, 1800, 0), (c2, 1748, 1800), (c3, 1452, 3548)], '#15171b', 5000)
    compose(f'{out_dir}/office.png',   [(d1, 1800, 0), (d2, 1480, 1800)], '#151c20', 3280)
    compose(f'{out_dir}/eval.png',     [(ev, 1804, 0)], '#151c20', 1804)
    compose(f'{out_dir}/lead.png',     [(ld, 2132, 0)], '#151c20', 2132)
