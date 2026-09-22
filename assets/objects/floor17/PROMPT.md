# 17층 상호작용 문

- 제작: 내장 `image_gen` 도구, 기존 `assets/background/floor17/floor17.png`를 스타일 참조로 사용.
- 파일: `elevator.png`, `stairs.png`. 각각 512×512 RGBA PNG 시트.
- 프레임: 256×512, 2열 × 1행. 0번 닫힘, 1번 열림. 각 프레임은 256px 타일 두 개 높이이며 프레임 사이 여백이 없다.
- 피벗: 하단 중앙. 최근접 보간으로 내보냈으며 게임에서도 pixelated 필터를 사용한다.
- 내부는 불투명 이미지다. 기존 배경 문을 덮으므로 열었을 때 배경의 닫힌 문이 비치지 않는다.
- 배치와 표시 크기는 `player.js`의 `doors` 배열, 문턱은 공통 y=570이다. 엘리베이터는 동일 시트를 공유하지만 개폐 상태는 독립적이다.
- 동작: 바닥에 서서 문 가까이 접근하면 E 안내와 테두리 표시. 엘리베이터는 E로 호출하면 1층부터 1.2초마다 한 층씩 상승하며 별도 표시창에 현재 층수를 표시하고 17층 도착 시 자동 개방한다. 상승 중 재호출은 무시한다. 도착한 엘리베이터와 비상계단은 E로 개폐 전환. 공중 및 범위 밖 입력과 키 반복은 무시한다. 플레이어의 층 이동은 구현하지 않았다.

## 공통 생성 프롬프트

```text
Use case: stylized-concept. Asset type: production game sprite sheet, two states of ONE door for ARCHI. Reference image is style/material/color reference only. Create a 1536x1024 sheet consisting of EXACTLY TWO equal rectangular cells side by side, each 768x1024. Left cell CLOSED, right cell FULLY OPEN. Orthographic straight-on elevation, no perspective on exterior frame. Each cell is ENTIRELY occupied by the rectangular door assembly including a narrow metal jamb at its four edges: no outside wall, no margins, no labels, no floor outside threshold, no text, no people. Identical frame position and dimensions across states; only door interior changes. Full bleed opaque rectangles, clean hard cell boundary at center; useful as runtime replacement over an existing doorway. Restrained crisp pixel-art clusters, match reference's very dark desaturated blue green gray industrial office at midnight, subtle worn metal. Open interior must be opaque dark artwork, NOT transparent.
```

## 엘리베이터 추가 프롬프트

```text
Subject: office ELEVATOR with narrow steel frame and two center-parting metal doors. Closed left cell shows both panels meeting. Open right cell shows the same jambs, doors fully retracted sideways and a dim empty elevator cabin with subtle rear handrail and a dark level floor. No indicator/sign above, no buttons outside frame.
```

## 비상계단 추가 프롬프트

```text
Subject: emergency STAIRWELL FIRE DOOR with narrow metal frame, dark blue-gray single steel leaf, small wired-glass window and horizontal push bar. Closed left cell shows door shut. Open right cell same exterior frame, door leaf swung inward with a narrow angled panel visible at right inside jamb, revealing very dim concrete stairs ascending behind it. No exit sign above, no surrounding wall. Closed and open frame silhouettes match precisely.
```
