# 표지판 스프라이트

ImageGen 내장 도구로 생성한 투명 배경 아틀라스는 `source/atlas.png`에 보관한다.
2×2 셀을 분리하고 투명 여백을 잘라 폭 512px로 내보냈다.

- `bronze-plaque.png`: VIP·연구본부·연혁 표지, 따뜻한 색상의 방 이름표·층수판.
- `steel-plaque.png`: ARCHI 구역·로봇 현황판, 일반 방 이름표·층수판.
- `notice-board.png`: 입주사·UPS·야간 당직·시설 점검·배치도·비상 전원 공지.
- `warning-sign.png`: 시설관리 구역·출입 통제 안내.

문구는 게임의 기존 텍스트를 겹쳐 표시한다. 1층 층별 안내판은 복도 배경에 이미 그려진 금장 벽감을 사용한다.

생성 프롬프트:

Use case: stylized-concept. Asset type: one production sprite atlas for ARCHI, a Korean 2D side-scrolling office horror game. Create exactly FOUR blank wall-sign sprites in a perfectly aligned 2x2 grid, all cells identical in size. Each sprite is an upright front-facing rectangular panel, landscape 3:2 aspect ratio, occupying almost its whole cell with only a small transparent gutter. Top-left: aged dark charcoal metal nameplate, thin brushed bronze beveled rim, four tiny corner screws, nearly black warm center. Top-right: cold graphite industrial metal nameplate with subtly blue-grey steel beveled rim and four small screws, empty dark slate center. Bottom-left: worn pale ivory paper notice mounted inside a narrow dark aged metal frame, tiny pins at corners, very subtle paper fibers, large clean ivory center. Bottom-right: industrial caution sign, dark graphite flat empty center with narrow black and faded ochre diagonal hazard stripes confined to outer top and bottom rim, corner screws. NO letters, text, logos, numbers, icons, writing, or symbols anywhere: readable Korean labels will be overlaid by the game. Carefully crafted detailed pixel-art game prop sprites, crisp pixel clusters, restrained texture, no photorealistic rendering, no smooth 3D gradients, no perspective, no isometric tilt, no environment, no wall, no lighting effects outside object, no cast shadow beyond a few pixels. Neutral diffuse frontal lighting, subtle top edge highlight. Keep each central 75% area visually calm and solid for legible overlaid text. Four sprites must not overlap and must align exactly with their grid cells. Transparent background.
