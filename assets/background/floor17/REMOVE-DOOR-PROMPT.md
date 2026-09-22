# Remove the second office entrance

- Tool: built-in image_gen.
- Output: office-door-removed-source.png; cropped edit source for floor17.png and tiles.
- The second office door, frame, handle and card reader were replaced by fixed glazing. The first entrance remains.

## Edit prompt

Use case: precise-object-edit. Edit the provided 512x512 crop of an existing ARCHI pixel-art office corridor background. REMOVE the glass office DOOR near the center (approximately x205..348, y98..440) and its metal pull handle, all of its dark doorframe including top and bottom, plus the access-control reader immediately to its right at approximately x350..384,y262..321. Replace this whole door with a seamless FIXED floor-to-ceiling glass partition matching the glass panel on its right. Continue the distant midnight city, office window reflections and dark desk-area silhouettes naturally THROUGH the former doorway so it no longer resembles an entrance. No doorframe, handle, threshold, control panel, black rectangle outline or new object in that location. Keep the existing major structural pillar at x174..202 untouched, and keep the existing outer top horizontal glazing frame, ceiling, side borders and entire straight floor baseline at y440 exactly unchanged. Preserve ALL unrelated pixels, geometry, furniture, light, color, pixel grid and image dimensions. This is a localized repair inside an assembled game tilemap: continuity at all four image edges is essential. No relighting or global restyling, do not zoom or reframe. Output only the edited square background crop, opaque PNG, same layout and crisp subdued pixel art.
