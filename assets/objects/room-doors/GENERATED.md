# Background-matched ordinary doors · 2026-10-17

`matched-office-doors.png` is the unchanged 1536×1024 RGBA export from the image generation tool. References were `assets/background/painted-walls/interior-atlas.png` for wall colors/materials and `assets/objects/basic-kit/door-office-wood.png` for the ordinary lever-handle door design. An image-tool edit lowered the lever handles for the game's player scale and extended the green door's vision panel. The final generated source is retained at `/workspace/generated_images/exec-0db7ffcc-ce61-449e-b312-35002dffc94c.png`; the initial version is `/workspace/generated_images/exec-816ea8a8-b575-493e-bd3b-3c09e5104ebf.png`.

| CSS profile | Design | Atlas frame bounds (x, y, width, height) | Applied to |
| --- | --- | --- | --- |
| `office-wood` | Cool walnut, slate frame, narrow frosted vision panel, silver lever | 77, 31, 419, 953 | 13F training, 14F archive |
| `office-lab` | Muted green panel and frame, frosted vision panel, silver lever | 567, 31, 408, 953 | 15F seminar |
| `office-solid` | Matte blue-charcoal metal, blank plate, silver lever | 1049, 31, 415, 953 | Studio, facility office, manager room interior, secure-room connecting door |

Generation direction: three ordinary interior doors in one row of equally tall cells; straight front elevation, consistent scale and baseline, complete frames and thresholds; restrained detailed midnight pixel art. Match slate office, green lab and concrete utility walls. Transparent outside each frame, opaque or frosted panels inside. No emergency push bars, EXIT/WC/hazard symbols, red beacons, vents, room backgrounds, furniture, labels or people.

The CSS background positions crop each frame's transparent margins directly from the atlas without editing the PNG. The small residual panel alpha is backed by an opaque dark door opening. Existing power and darkness layers still control the rendered doors.
