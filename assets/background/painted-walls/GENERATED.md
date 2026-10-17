# Painted interior walls

`interior-atlas.png` was generated with the image generation tool on 2026-10-17 for ARCHI's unfinished interior walls. The original opaque RGB PNG is 1774×887; no existing game artwork was edited.

The 2×2 atlas contains four front-facing wall materials:

| Quadrant | Material | Use |
| --- | --- | --- |
| Top left | Slate acoustic panels, brass service rail, vents | Offices and common corridors |
| Top right | Muted green laboratory panels, conduits, access covers | Research rooms and 15F corridor |
| Bottom left | Aged concrete blocks, pipes, junction boxes | Utility, power, security and maintenance rooms |
| Bottom right | Blue metal panels, mesh, cable trays | Server and operations rooms |

Generation direction: detailed, restrained horror pixel-game environment; flat side view and consistent scale; four equally sized rectangular wall tiles arranged in a 2×2 atlas, with no gaps or labels. No perspective floor, ceiling, doors, windows, furniture, people, readable text or active light sources. Keep the wall centers clear for separately rendered game objects.

`css/game.css` displays each quadrant as a 912×456 world-unit tile with its aspect ratio preserved. `js/floors/background-art.js` selects the material and lists the existing glass/screen areas and complete 48px pillars to retain. `addPaintedWalls` subtracts these areas, exterior windows and actual door openings from the wall, including intersecting cutouts. It keeps the original ceiling, floor, room doors and interactive objects. The existing darkness and flashlight layers apply above the artwork.

These are presentation layers. Existing background generators and their on/off variants remain the underlying scene geometry and are not replaced by this atlas.
