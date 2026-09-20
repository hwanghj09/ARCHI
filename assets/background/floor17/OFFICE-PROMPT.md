# Office interior background

- Tool: built-in image_gen.
- Reference: floor17.png, architectural and pixel-art style reference.
- Output: office-interior.png, generated original 2172x724 PNG.
- Integrated as a 2400px-wide office, with source floor y=504 aligned to world y=570 using uniform CSS scaling.
- Both corridor office entrances lead to this room. E at the interior left door returns to the entrance used. Furniture remains background art; the foreground lane has floor and boundary collisions.

## Generation prompt

Use case: stylized-concept.
Asset type: production environment background for ARCHI, a 2D side-scrolling mystery game. Create ONE wide office INTERIOR background, 2304x768 landscape panorama, 3:1 aspect ratio.
Reference image 1 is the existing 17th-floor corridor. Use it ONLY as the architectural, material, lighting and pixel-art style reference. This new scene is INSIDE the software development office seen through those corridor windows, viewed after entering it. Remove the corridor-facing glass wall from the camera view: unobstructed cutaway view into the room, not another corridor or facade.
Strict orthographic side elevation, camera perpendicular to the rear wall, parallel horizontal/vertical architecture, no isometric view, no central vanishing point, no hallway receding into depth. Detailed restrained pixel art matching the reference, realistic adult character proportions, crisp hard pixel clusters, readable muted gray and green-gray furniture with cool nighttime windows and a few small warm task lamps. Midnight Korean software-company office, quietly unsettling and abandoned, mystery 80 percent horror 20 percent, no overt horror creatures.
Layout: left end a closed glass office exit door in the rear wall with metal frame and small access reader, returning to the corridor. Across center-left and center: three believable programmer workstations behind the walking lane, desks, monitors (most off, ONE dim pale-teal screen), keyboards, office chairs tucked in, modest papers and one coffee mug. Broad rear windows show a distant city at midnight with blinds partly lowered. Center-right: whiteboard with faint unreadable diagram marks, low filing cabinets and shelves with binders. Right end: a compact meeting table with two tucked-in chairs and a wall clock. Modest cable trays and fluorescent fixtures at the ceiling; mostly off. A single amber desk lamp is a visual focal point. The important objects must remain visible, not buried in black shadow.
Geometry: continuous walkable floor top is one perfectly straight horizontal line at y=570 of the 768-high canvas (74.2 percent of height), full width. Door bottom and furniture feet align to this baseline. Bottom 198 pixels are dark building foundation cutaway with subtle horizontal slab detailing, no basement room. All furniture belongs in the rear layer, leaving the entire foreground lane free for a separately rendered player. Door approx 300px high; human rendered height approx 162px. Ceiling top band about 100px high. Room spans entire image edge to edge; no decorative frame.
No characters, no silhouettes of people, no robots, no UI, no captions, no logos, no watermarks, no legible text, no arrows, no labels, no foreground occluders. Opaque background. Output only the finished game background.
