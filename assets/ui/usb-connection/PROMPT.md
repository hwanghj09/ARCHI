# 탁자 위 USB 연결 스프라이트

도구: image_gen.imagegen. 현실적인 정면 휴대폰과 위를 향한 USB-C 단자, 회색 탁자를 각각 생성했다. 그림 안에 UI 문자를 넣지 않고 DOM으로 안내한다.

| 파일 | 최종 규격 | 용도 / 앵커 |
| --- | --- | --- |
| phone.png | 512 × 1024, RGBA | 휴대폰 전체. 소켓 중심 (256, 1009), 이동 앵커 중앙. |
| plug.png | 128 × 320, RGBA | 금속 끝, 하우징, 스트레인 릴리프. 삽입 앵커 상단 중앙 (64, 0). |
| cord.png | 40 × 40, RGBA | 생성된 단자 이미지에서 잘라낸 직선 전선. 아래 방향으로 반복. |
| desk.png | 1536 × 1024, RGB | 회색 탁자 상판, 연결 화면 전체 배경. |

폰 생성 원본: /workspace/generated_images/exec-967f0b25-19df-46db-854b-334a672bd2a9.png (934 × 1684). 알파 실루엣 범위 (128,72)–(808,1609)를 잘라 종횡비를 유지하며 512 × 1024로 정규화했다.
단자 생성 원본: /workspace/generated_images/exec-9c325a2a-f546-4485-84be-b90ce8d4753a.png (724 × 2172). (160,131,405,1013)를 128 × 320으로 정규화하고, 전선 (295,1500,136,136)을 40 × 40으로 분리했다.
탁자 원본: /workspace/generated_images/exec-2a67974c-80bf-4180-9fb3-04b2432e0f45.png (1536 × 1024).
원본은 삭제하지 않았다. 생성기에서 지정한 픽셀 규격이 그대로 출력되지 않아 단순 크기 정규화와 분할만 수행했다.

참조는 같은 형태의 앞선 생성 휴대폰과 단자다. 최초 갈색 탁자는 사용하지 않는다. 휴대폰과 단자의 외부는 투명 알파이며 바깥 그림자는 CSS로 합성한다.

연결: index.html, css/usb-connection.css, js/computer/usb-connection.js. 두 물체를 마우스/터치로 독립적으로 움직이며 금속 끝과 소켓을 맞추고 놓으면 PC로 돌아간다. 휴대폰 전체는 조작 영역 안으로 제한한다. 전선은 단자 아래에서 화면 바깥으로 이어져 컴퓨터 쪽 연결부가 보이지 않는다. 키보드는 방향키 이동 또는 단자 선택 후 소켓 선택을 지원한다. 실제 휴대폰 하드웨어 입력 검증은 별도다.

## 최종 생성 프롬프트

### usb_phone_v2

투명 배경: true. 참조: /workspace/generated_images/exec-7b2be715-9613-42d5-ba21-0a871dca6d7f.png.

Redraw this phone as a GAME SPRITE, preserving its graphite black realistic design and centered USB-C port along the bottom visible bevel. Target normalized sprite canvas 512 x 1024 pixels (1:2 portrait). One entire phone, upright, perfectly centered, body approximately 440 x 936, safe 32 pixel transparent padding all around. Entire front, all four corners and bottom socket visible. Strict straight overhead near-orthographic view lying flat on a table (but DO NOT draw the table). Tiny bottom bevel visible to show the centered USB-C port; no perspective tilt, no diagonal angle. Realistic detailed restrained illustrated office game style, very sharp edges and material details, dark glass screen with subtle reflection, no UI or writing. IMPORTANT true transparent alpha outside ONLY the handset silhouette, absolutely NO background, NO gray halo, NO glow, NO cast shadow outside silhouette, no cables. This must composite cleanly on a light gray table. Single isolated sprite, no sprite sheet.

### usb_plug_v2

투명 배경: true. 참조: /workspace/generated_images/exec-8f92172d-ec88-40c7-9c4d-21e436f7e32c.png.

Redraw this USB-C MALE PLUG as a compact realistically proportioned game sprite. Target normalized canvas 128 x 384 pixels. One connector centered x=64, metallic insertion tip pointing UP at y=16, realistic USB-C connector silver tip width about 56 pixels, tip height 24 pixels. Black plastic housing width about 68 pixels height 70 pixels (not the oversized very long housing of the reference), short black strain relief below, then straight black cord width about 20 pixels extending down to the very bottom of the canvas. Connector and cord perfectly vertical. Strict straight overhead near orthographic view, same view as a black phone lying flat on table, restrained crisp detailed realistic illustrated game style. Brushed metal rounded USB-C tip and black rubber housing, upper left gentle highlight. TRUE TRANSPARENT background, no shadow outside object, no backdrop, no glow. No computer, no phone, no hands, no lettering, no labels, no extra objects. Cord ends at bottom edge because continuation will be tiled off-screen; the computer end is not visible.

### usb_desk_v2

투명 배경: false. 참조: 없음.

ARCHI realistic office game desktop BACKGROUND, 1536 x 1024 landscape. Straight perpendicular overhead view of an EMPTY GRAY OFFICE TABLE. Neutral medium-light gray matte laminate tabletop, subtle fine surface grain and sparse slight wear, very restrained flat gray variation, soft broad light upper left, subtle night office cool tint. Must clearly read as a gray table, not wood, not brown, not black. Entire frame is continuous unobstructed gray tabletop, no edges or legs. Crisp realistic detailed game illustration. NO phone, NO cable, NO computer, NO keyboard, NO paper, NO objects, NO hands, NO UI, NO text. Surface light enough that a black handset and cable will be clearly visible. Uncluttered, no decorative objects.

