# 모든 층 배경의 비상구 유도등을 덮는 공용 그림(../exit-sign.png, 160x104).
# 초록 판, 흰 문, 문으로 달려 들어가는 초록 사람. 8배로 그려 줄인다. 실행: python3 assets/objects/floor-kit/source/exit-sign.py
from PIL import Image, ImageDraw
import os
K=8; W,H=160,104
im=Image.new('RGBA',(W*K,H*K),(0,0,0,0)); d=ImageDraw.Draw(im)
s=lambda *v:[c*K for c in v]
d.rounded_rectangle(s(0,0,W-1,H-1),radius=6*K,fill=(26,32,31,255))
d.rounded_rectangle(s(1,1,W-2,3),radius=2*K,fill=(70,82,78,255))
d.rounded_rectangle(s(5,5,W-6,H-6),radius=3*K,fill=(12,96,60,255))
for y in range(9,H-8):
    t=(y-9)/(H-17)
    c=(round(52-26*t),round(222-48*t),round(128-34*t),255)
    d.rectangle(s(9,y,W-10,y+1),fill=c)
d.rectangle(s(9,9,W-10,11),fill=(120,240,176,255))
# 문
d.rectangle(s(52,16,112,90),fill=(234,255,244,255))
d.rectangle(s(52,16,112,19),fill=(255,255,255,255))
FIG=(16,150,84,255)
def limb(*pts,w=10):
    d.line([c*K for p in pts for c in p],fill=FIG,width=w*K,joint='curve')
    for x,y in (pts[0],pts[-1]): d.ellipse(s(x-w/2,y-w/2,x+w/2,y+w/2),fill=FIG)
d.ellipse(s(89,20,103,34),fill=FIG)                     # 머리
limb((90,40),(80,60),w=13)                               # 몸통
limb((90,42),(101,50),(111,44),w=8)                      # 앞팔
limb((88,42),(77,48),(68,58),w=8)                        # 뒷팔
limb((80,60),(96,68),(97,84),(105,85),w=9)               # 앞다리
limb((79,61),(70,74),(58,79),w=9)                        # 뒷다리
im=im.resize((W,H),Image.LANCZOS)
im.save(os.path.join(os.path.dirname(__file__), '..', 'exit-sign.png'))
