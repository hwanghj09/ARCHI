# 획득 아이템 스프라이트

2026-10-18 · 내장 ImageGen 도구로 생성. 실제 투명 알파를 가진 PNG 원본을 프로젝트에 복사했다. 기존 그림은 보존한다.

| 파일 | 물건 | 적용 위치 |
|---|---|---|
| `lead-key.png` | 종이 꼬리표가 달린 팀장실 보조키 | 획득 화면, 가방, 물건 상세 |
| `eval-keycard.png` | 청록 띠·접점·바코드가 있는 모델 평가실 카드키 | 서랍, 획득 화면, 가방, 카드 리더기 조작 |
| `backup-device.png` | 금속 USB 백업 장치 | 획득 화면, 가방, 물건 상세 |

경로는 모두 `assets/objects/items/` 기준이다. 글자와 단서는 게임 UI가 표시하며 새 그림에 읽을 수 있는 문구를 넣지 않는다. 생성 원본의 투명 영역과 해상도를 그대로 보존하고 게임에서는 기존 크기와 `image-rendering: pixelated`로 표시한다.

## 실제 생성 프롬프트

### lead-key.png

Create one finished inventory item sprite for ARCHI, a Korean office horror point-and-click / side-view game. Subject: a single small worn BRASS OFFICE KEY for a team leader's room, with a small aged ivory rectangular paper luggage tag tied to its circular keyring using short brown twine. Key lies diagonally from lower left bow to upper right teeth, tag hangs below the bow without obscuring it. Authentic carefully hand-pixelled 1990s PC adventure game inventory art; crisp square pixel clusters, thin dark colored outline, restrained muted antique brass highlights and deep brown shadows, subtle scratches, 12-18 color palette, no smooth gradients. Treat as a 256x256 sprite, logical 1-2px pixel clusters. Orthographic near top-down inventory view, no environment or ground plane. Object centered and occupies about 80 percent of square canvas, complete silhouette with generous transparent padding. True transparent background and alpha, no checkerboard artwork, no backdrop, no cast shadow outside the object. No letters, numbers, readable text, logo, watermark, decorative framing, extra objects or duplicate keys. The key has visible asymmetric short teeth, a round bow hole and a distinct blank paper tag. Final production sprite only.

### eval-keycard.png

Create one finished inventory item sprite for ARCHI, a Korean office horror point-and-click / side-view game. Subject: a single worn horizontal rectangular EVALUATION LAB ACCESS KEYCARD, ivory plastic, a broad muted dark teal blue stripe across upper third, a small visible brass electronic contact chip at lower left, a short black barcode graphic at lower right, understated unlabelled cyan square security mark in top right. Card face mostly ivory blank space; NO readable text, NO words, NO numbers; title provided by game UI. Slight clockwise tilt of about 8 degrees, mostly front-on orthographic flat view, tiny dark bottom edge showing thickness, rounded corners, subtle worn corner chips and scratches. Authentic carefully hand-pixelled 1990s PC adventure game inventory art; crisp square pixel clusters, thin dark colored outline, restrained muted ivory/teal highlights and gray shadows, 12-18 color palette, no smooth gradients or vector-art smoothness. Treat as a 256x256 inventory sprite with logical 1-2px pixel clusters. Object centered, occupies about 82 percent of square canvas width, full silhouette with transparent padding. True transparent background alpha, no checkerboard artwork, no backdrop or ground plane, no cast shadow outside the card. No letters, numbers, logo, watermark, extra cards, lanyard, hands, scenery, or decorative frame. Final production sprite only.

### backup-device.png

Create one finished inventory item sprite for ARCHI, a Korean office horror point-and-click / side-view game. Subject: one rugged USB BACKUP DEVICE from a secure server room, compact rectangular portable storage module in dark blue-gray brushed metal with chamfered corners, two tiny visible dark screws, a short exposed silver USB connector at the top, shallow ridges down its sides, one tiny unlit amber status indicator near the bottom, aged cream identification sticker on front with a few short dark abstract horizontal data marks but absolutely no readable text or numbers. The device is vertical, slightly tilted counterclockwise 8 degrees, mostly front-on orthographic inventory view with narrow right side visible showing chunky thickness. Authentic carefully hand-pixelled 1990s PC adventure game inventory art; crisp square pixel clusters, thin dark colored outline, restrained desaturated steel blue / gray / charcoal palette, cool metal highlights and deep shadows, 12-18 colors, subtle scuffed texture, no smooth gradients, no glossy futuristic sci-fi lighting. Treat as a 256x256 sprite with logical 1-2px pixel clusters. Single complete centered object, occupies about 78 percent of canvas height, generous transparent padding all around. True transparent background alpha, no checkerboard artwork, no backdrop, no ground plane, no cast shadow outside the item. No readable words, letters, numbers, logo, watermark, hands, cables, extra objects or duplicates. Final production sprite only.

