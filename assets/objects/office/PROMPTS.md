# Office interaction props

- Tool: built-in image_gen.
- Style reference: ../../background/floor17/office-interior.png.
- pc-off-on.png: left power off, right power on; monitor, tower, keyboard and mouse.
- notebook-closed-open.png: left closed, right open paper notebook.
- Both files: original 1774x887 RGBA PNG, two 887x887 cells, transparent background.
- Asset-only delivery. Prop placement and interaction logic are not connected yet.
- Screen and page markings are decorative. Add readable terminal content and clues as separate game UI.

## PC prompt

Use case: stylized-concept. Asset type: transparent production prop sprite sheet for ARCHI 2D side-scrolling office mystery game.
Reference image 1 is ONLY the style and material reference: match its crisp restrained pixel art, black-gray office equipment, muted cool neutral highlights, realistic proportions, subtle wear. Do not reproduce the room.
Create exactly TWO equal square cells in ONE horizontal 2-column, 1-row sheet, 2:1 aspect ratio, conceptually 512x256 pixels or integer multiple. Each cell shows the SAME desktop PC workstation prop at precisely identical scale, location and geometry. Left state: POWER OFF. Right state: POWER ON. Each prop consists of a dark flat widescreen monitor on a short stand, compact keyboard and mouse aligned in front, a small dark desktop tower immediately beside the screen. Camera straight-on elevation consistent with side-scrolling rear-wall desks; very slight top visibility on keyboard only, no isometric angle. Full device silhouette entirely inside each cell with generous padding. All bottom contact points on the same horizontal baseline. No desk, chair, floor, room or background.
Off state: black unlit display with extremely faint gray reflection and no glowing indicators. On state: exactly same equipment silhouette; monitor shows a dim cool teal terminal window with tiny abstract pale line clusters, and one small power indicator on tower is lit. No readable text, logos, labels or captions. Keep lighting differences confined to screen and indicator, no glow outside silhouette. Consistent pixel grid, sharp pixel clusters, no smooth painterly edges. REAL TRANSPARENT ALPHA in all empty areas, including between stand, keyboard and tower. No opaque backdrop, no baked checkerboard, no shadows on an invisible surface, no cell borders. Output only the reusable two-state PC sprite sheet.

## Notebook prompt

Use case: stylized-concept. Asset type: transparent interactable notebook prop sprite sheet for ARCHI, a 2D side-scrolling office mystery game.
Reference image 1 is ONLY a style/material/lighting reference. Match its restrained crisp pixel-art clusters and muted midnight office palette. Do not reproduce the room.
Create exactly TWO equal square cells in a horizontal 2-column 1-row sprite sheet, 2:1 aspect ratio, conceptually 512x256 pixels or integer multiple. Same small physical developer's paper notebook, NOT a laptop. LEFT cell: notebook CLOSED, charcoal olive cloth cover with subtle worn corners, paper edges visible and a small pale yellow sticky tab peeking out. RIGHT cell: the SAME notebook OPEN at its middle, two facing dull off-white pages with subtle gray-blue handwritten line clusters, a small simple flowchart and one muted red underlined mark. No readable writing: actual clue text will be a separate game overlay. No title on cover. The open and closed objects have consistent physical page dimensions, same horizontal center and same bottom/tabletop contact baseline within cells; open notebook naturally wider than closed. Slightly elevated front view just sufficient to see pages on a desk, shallow foreshortening consistent with the desk surfaces in the reference, NOT a top-down inventory icon, NOT an isometric book. Entire objects comfortably inside their cells, no cropping. Crisp legible silhouette at small game-prop size, restrained highlights, paper visibly lighter than cover. Do not add a pen, desk, hand, person or other items. REAL transparent alpha in ALL empty space; no floor or cast shadow, no backdrop, no baked-in checkerboard, no UI, labels, cell dividers, captions, logos or watermark. Output only the two-state notebook sprite sheet.
