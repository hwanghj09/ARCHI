# 17층 배경 스프라이트

- 제작: 내장 `image_gen` 도구. 자정의 사무실, 야경, CCTV, 엘리베이터 3개, 비상계단을 연결한 횡스크롤 배경.
- `source.png`: 생성 원본, 2172×724 PNG.
- `floor17.png`: 조립된 3328×768 RGBA PNG 아틀라스. 실제 화면 영역은 좌측 상단 3200×720이며, 오른쪽 128px은 투명 패딩이다.
- `tiles/{행}-{열}.png`: **256×256 RGBA PNG 39장**, 13열 × 3행. 행·열은 0부터 시작한다. 개별 타일은 반복 텍스처가 아니라 이 배경의 고정된 조각이다.
- 내보내기: 원본을 최근접 보간으로 3200×1067로 맞추고 y=-6에 배치했다. 원본 바닥선 y=391을 게임의 충돌 바닥선 y=570에 정렬했다. 색상과 그림은 추가 편집하지 않았다.
- 게임 적용: `player.js`가 타일을 256px 간격으로 배치하고 `index.html`의 배경 영역이 맵 외곽을 잘라낸다. 캐릭터, 장애물, HUD는 별도 레이어다.
- 타일 피벗: 좌측 상단. 화면에서 1 이미지 픽셀 = 1 월드 픽셀. 필터는 nearest/point를 사용한다.
- 배경 원본의 엘리베이터와 비상계단 문 위에는 `assets/objects/floor17/`의 별도 개폐 스프라이트를 겹쳐 상호작용한다. 시작 지점에 가까운 사무실 유리문만 E로 내부 배경 `office-interior.png`에 진입하며, 내부 왼쪽 문에서 들어왔던 위치로 돌아온다. 두 번째 문은 배경에서도 고정 유리 파티션으로 교체했다. 게시판과 CCTV는 배경 그림이다.
- 두 번째 문 제거: 내장 image_gen으로 512x512 참조 영역(x=1024, y=128)을 편집했다. 생성 원본은 `office-door-removed-source.png`이며 최근접 보간으로 정규화 후 아틀라스의 유리창 안쪽(x=1224, y=174, 312x394)에 반영했다. 4~5열, 0~2행의 타일 6장을 다시 내보냈으며 첫 번째 문과 바닥선은 유지했다.

## 생성 프롬프트

```text
Use case: stylized-concept
Asset type: production background sprite panorama for ARCHI, a 2D side-scrolling mystery/horror game. This is the actual environment artwork, NOT a concept poster or screenshot.
Create ONE very wide 3072 x 1024 PNG. Strict orthographic SIDE VIEW, camera exactly perpendicular to a long office corridor wall. NO vanishing point, NO isometric, NO perspective corridor going into the distance. Continuous horizontal elevation.
Setting: 17th floor of a Korean software-company tower at midnight, the start of an AI takeover during a power outage. Restrained atmospheric pixel art, realistic adult scale, dark desaturated blue-gray / green-gray, tiny warm desk light and dull teal emergency lights. Detailed crisp pixel clusters and clean silhouettes consistent with a 256x256 anime-inspired office-worker character sprite. Human sprite on screen is about 162 pixels tall, door openings about 250 pixels tall; use this scale.
CRITICAL COLLISION GEOMETRY: the continuous, perfectly horizontal top edge of the walkable floor is at y=570 pixels of this 1024-high canvas, from extreme left to extreme right. All doorway bottoms are exactly on this same y=570 line. The lower 454 pixels are ONLY a dark flat cutaway floor foundation, subtle horizontal slabs, no objects. This large lower area is intentional for cropping. No perspective floor, no diagonal floor, no changes in floor elevation. Main architecture occupies y=110..570. Ceiling is dark at y=0..145, with conduits.
Composition across width:
x=0..450: cool window to a distant lit city, unoccupied developer workspace seen through a glass partition, small warm desk lamp, black monitor and paper notes. Keep a low-contrast clear backdrop behind the starting player at x=220, feet y=570.
x=450..1100: first two office entrances, glass walls with desks behind them, a few blinds and unlit monitors. Doors flush with rear wall, all bottoms y=570.
x=1100..1800: third office entrance, city window, narrow bulletin board with small paper rectangles, a CCTV camera above with a faint red status LED, modest corporate wall signage area.
x=1800..2550: THREE distinct closed metal elevator doors in a row, dark displays and small call panels, industrial office architecture, elevator bottoms exactly y=570.
x=2550..2900: emergency evacuation notice board and one closed stairwell fire door with a small dim green exit sign. Stairwell door bottom exactly y=570.
x=2900..3072: plain wall / structural end column. No important detail at the far edge.
The city is only visible THROUGH windows. Keep facade planes straight and parallel. Use a consistent pixel grid, precise hard-edged pixel art, subtle material wear, readable dark midtones, dark foreground floor. No people, no monsters, no robots, no foreground furniture, no crates, no furniture obstructing the walk lane, no UI, no border, no watermark, no captions. No large readable lettering; small pictograms on signs are fine. The game adds its own labels and collidable obstacles. All three office rooms, all three elevators, and stair exit must be visible.
```
