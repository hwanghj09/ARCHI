# 옥상 계단문

- 제작: 사용자가 외부 image_gen 도구로 생성해 전달.
- `stairs-door.png`: 417x822 RGBA 원본(닫힌 문 한 장, 불투명).
- `stairs.png`: 834x822 시트. 원본을 닫힘·열림 두 칸에 그대로 복제했다. `.door img`가 200% 폭 2칸 시트를 전제로 하기 때문이다.
  옥상 계단문은 E를 누르면 열리는 대신 바로 17층으로 이동하므로 열림 칸이 화면에 나오지 않는다.
- 배치: `js/scene/scene-builder.js` 옥상 `sceneDoors` — x=175, y=274, 150x296(원본 비율 417:822 유지),
  `sprite` 필드로 이 파일을 지정한다(다른 층은 계속 `assets/objects/floor17/stairs.png`).
  계단실 지붕 테두리(y≈272) 바로 아래, 벽 가운데(x≈250 중심), 문턱은 floorY=570.
