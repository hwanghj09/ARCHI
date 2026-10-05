# 추가 오브젝트 8종

내장 `image_gen`으로 생성했다. 원본 PNG는 `source/`, 게임용 PNG는 이 폴더에 있다. 기존 사무실·화장실 이미지를 눈으로 확인해 프롬프트에 화풍을 반영했으며 생성 요청에 이미지를 첨부하지 않았다. `scripts/prepare-floor-kit.ps1`로 알파 > 8 경계를 찾아 종횡비를 보존하고, 최근접 보간으로 축소해 아래쪽 8px 여백을 맞췄다.

| 파일 | 원본 크기 | 게임 크기 | 앵커 | 배치 |
| --- | --- | --- | --- | --- |
| `visitor-chair.png` | 1024×1536 | 256×512 | (128, 504) | 3F 고객만족센터 |
| `short-bookcase.png` | 1536×1024 | 512×256 | (256, 248) | 3F 고객만족센터 |
| `coat-rack.png` | 1024×1536 | 256×512 | (128, 504) | 3F ㈜하누리서비스 |
| `parcel-boxes.png` | 1536×1024 | 256×256 | (128, 248) | 3F ㈜하누리서비스 |
| `fire-extinguisher.png` | 1024×1536 | 256×512 | (128, 504) | 3F 복도 |
| `umbrella-stand.png` | 1024×1536 | 256×512 | (128, 504) | 3F 복도 |
| `restroom-bin.png` | 1237×1272 | 256×256 | (128, 248) | 공용 화장실 |
| `restroom-supply-cabinet.png` | 1024×1536 | 256×512 | (128, 504) | 공용 화장실 |

## 최종 생성 프롬프트

### 방문객 의자

> Use case: stylized-concept. Asset type: ONE isolated reusable transparent PNG prop for ARCHI, a Korean 2D side-scrolling office mystery game. Subject: one empty visitor side chair, distinct from an ergonomic swivel chair: slender dark steel four-leg frame, straight low backrest, muted tan-brown fabric padded seat and back, no wheels or armrests. Realistic adult seating proportions. Style: crisp detailed subdued anime-inspired pixel art, dark modern Korean office palette, sharp stepped pixel edges, readable in dim lighting. Camera straight-on front elevation, minimal top visible, not isometric. Full single silhouette centered, all four feet level, generous genuine alpha transparency around and between legs. No floor, room, wall, shadow halo, checkerboard, writing, logo, person, border, watermark or extra objects.

### 낮은 서가

> Use case: stylized-concept. Asset type: ONE isolated reusable transparent PNG prop for ARCHI, a Korean 2D side-scrolling office mystery game. Subject: a short waist-high office bookcase with three horizontal open shelves, dark graphite metal frame, neatly arranged gray and navy ring binders, a few folded files, one empty shelf compartment, subtle wear, no doors. Wide but not tall, clearly a standalone storage object. Style: crisp detailed muted anime-inspired pixel art, realistic proportions, modern Korean office materials, stepped pixel edges, readable in a dim game scene. Straight-on front elevation, minimal top surface visible, no isometric perspective. Complete single silhouette with level feet, generous genuine transparent alpha margin. No floor, wall, room, text, labels, letters, logos, person, halo, checkerboard, border or watermark.

### 옷걸이

> Use case: stylized-concept. Asset type: ONE isolated reusable transparent PNG prop for ARCHI, a Korean 2D side-scrolling office mystery game. Subject: one freestanding office coat rack: slim black steel vertical pole on a stable four-foot base, three simple hooks at top, one dark navy work jacket hanging naturally from one hook, other hooks empty. Realistic adult height, compact narrow silhouette, no umbrella. Style: finely detailed restrained anime-inspired pixel art, muted modern Korean office colors, crisp stepped pixel edges, readable in dim lighting. Camera straight-on front elevation, no isometric rotation. Whole single object fully in frame, base level, generous actual alpha-transparent margin around hooks and jacket. No floor, wall, room, person, shadow halo, checkerboard, writing, logo, border or watermark.

### 택배 상자 묶음

> Use case: stylized-concept. Asset type: ONE isolated reusable transparent PNG prop for ARCHI, a Korean 2D side-scrolling office mystery game. Subject: a compact stack of THREE sealed corrugated cardboard delivery boxes in two levels, two boxes below and one offset above, natural brown paper, gray packing tape, slightly worn corners; no printed labels, barcodes or words. Realistic office storage scale, stable silhouette with bottom edges level. Style: crisp detailed muted anime-inspired pixel art with stepped pixels, realistic proportions, dark modern Korean office game, softly readable in low light. Straight-on front elevation, minimal visible top, no isometric view. One complete grouping centered with generous genuine transparent alpha around and between boxes. No floor, wall, room, shadow halo, checkerboard, people, logos, captions, border or watermark.

### 소화기

> Use case: stylized-concept. Asset type: ONE isolated reusable transparent PNG prop for ARCHI, a Korean 2D side-scrolling office mystery game. Subject: one portable red fire extinguisher standing upright in a simple narrow black metal floor cradle, visible curved black hose, steel handle and pressure gauge, realistic office safety equipment proportions, no wall mounting. The cylinder is unbranded and has no readable label or text. Style: crisp finely detailed subdued anime-inspired pixel art, restrained color, stepped pixel outlines, readable in a dark office corridor. Straight-on front elevation with slight visible depth, no isometric perspective. Full single silhouette centered with level bottom base and generous true alpha transparency. No room, wall, floor, shadow halo, checkerboard, letters, numbers, logo, person, border or watermark.

### 우산꽂이

> Use case: stylized-concept. Asset type: ONE isolated reusable transparent PNG prop for ARCHI, a Korean 2D side-scrolling office mystery game. Subject: one floor-standing office umbrella holder: narrow brushed charcoal steel cylinder with a few small perforations near the top, THREE neatly closed umbrellas inside in muted navy, gray and dark burgundy, curved handles at varied heights, contained tips. Realistic compact size for an office lobby. Style: crisp finely detailed restrained anime-inspired pixel art, stepped edges, softly readable in dim light, straight-on front elevation, not isometric. One complete grouped object centered with bottom contact level and generous genuinely transparent alpha outside and between the handles. No floor, wall, room, people, shadow halo, checkerboard, writing, logos, border or watermark.

### 화장실 휴지통

> Use case: stylized-concept. Asset type: ONE isolated reusable transparent PNG prop for ARCHI, a Korean 2D side-scrolling office mystery game. Subject: a compact stainless steel restroom pedal trash bin with a closed gently domed lid, front foot pedal, small black rubber base, realistic calf-height proportions and cool gray metal reflections, one bin only. Style: crisp finely detailed muted anime-inspired pixel art, clean stepped pixels, dark modern Korean office restroom aesthetic, softly readable in low light. Straight-on front elevation with a little visible lid top, not isometric. Full silhouette centered with bottom level and generous true alpha transparency all around. No toilet, sink, wall, floor, room, cast shadow halo, checkerboard, writing, logo, border or watermark.

### 위생용품 수납장

> Use case: stylized-concept. Asset type: ONE isolated reusable transparent PNG prop for ARCHI, a Korean 2D side-scrolling office mystery game. Subject: a narrow floor-standing restroom supply cupboard, matte blue-gray powder-coated steel, closed lower double doors, one shallow open upper shelf with neatly stacked white paper towel packs and two spare toilet paper rolls, short sturdy feet, no labels. Realistic adult shoulder-height and narrow silhouette for a service closet. Style: crisp detailed restrained anime-inspired pixel art, stepped pixel edges, dim modern Korean office restroom palette, readable but not glowing. Straight-on front elevation, minimal top visible, no isometric angle. Complete one object centered with level base and generous genuine transparent alpha margin. No floor, wall, room, toilet, sink, people, shadow halo, checkerboard, writing, logos, border or watermark.
