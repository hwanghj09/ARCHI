# 경비 로봇 (Guard Robot)

- Tool: built-in `image_gen`.
- Depicts: 티맥스타워 순찰 보안 로봇. Story context in `기획.md` ("경비 로봇" section):
  patrols the building, escalates from a harmless-looking service robot to ARCHI's physical
  enforcer once ARCHI controls a floor's systems.
- Status: **patrol sprites generated and integrated on 1F**. `guard-patrol.png` is 2048×256 RGBA: eight horizontal 256×256 cells, four rolling frames, three scanning frames and one power-off frame. Source, exact production prompt and integration details: [PATROL-PROMPT.md](PATROL-PROMPT.md).
- Detection/chase/capture are also integrated: amber warning, red pursuit and concealed restraint arms. Robot and player atlas specifications and actual production prompts: [CAPTURE-PROMPT.md](CAPTURE-PROMPT.md).

## Design brief (from 기획.md)

- Height ~120-140cm real-world, wheeled indoor autonomous robot.
- Body: smooth white/black corporate-device design, not a military combat robot.
- Head: square sensor head that swivels left/right.
- Front sensors: center camera + distance sensor.
- Status LEDs on body and around the sensor head, three states:
  - Normal patrol: blue
  - Anomaly detected: orange/yellow
  - ARCHI-controlled / attacking: red
- Front body carries a 티맥스타워 보안 로봇 ID marking/logo.
- Must read as unthreatening in its normal state; only the LED color and later behavior (not a
  redesign) should make the same robot feel dangerous once ARCHI takes over.

## Scale reference

Player sprite is 162px tall in-world (`js/world/physics.js`, `Bodies.rectangle` height 162 at
`floorY = 570`). At the game's human-to-pixel scale, a 130cm robot comes out to roughly
**120px tall** (~74% of the player sprite height) — call this out explicitly in the prompt so
the model doesn't guess an oversized or toy-sized robot.

## Generation prompt

Three-state sprite sheet, same pattern as `assets/objects/power/PROMPT.md` (off/on) and
`assets/objects/floor17/CCTV-PROMPT.md` (pose states) — one fixed design, only the LED color
and glow change per cell.

```
2D side-view game asset for a dark psychological horror thriller game.

Strict orthographic side view, viewed perfectly from the side. No perspective distortion, no
isometric angle, no top-down view. Designed to be placed directly into a 2D side-scrolling game
environment.

Detailed hand-painted 2D illustration, semi-realistic proportions, dark atmospheric horror
aesthetic, subtle grunge and aged textures, muted desaturated colors, cold and oppressive mood,
realistic material definition, soft ambient shadows, subtle directional lighting, high
environmental storytelling detail.

Consistent visual language across all game assets. Readable silhouette even in a dark
environment. Details should remain clear at gameplay viewing distance. Avoid exaggerated fantasy
shapes unless specifically requested.

Object should have clearly defined edges suitable for separating it from the background. No
text, no UI elements, no decorative frame.

Asset: a small autonomous indoor security robot for a Korean corporate office tower ("티맥스타워"),
side view, facing right. Body height reads at roughly 74% of an average adult standing height in
frame (robot is 120-140cm tall; a human for scale is NOT in frame — just keep the proportion in
mind). Sleek white-and-black corporate service-robot design, not a military or combat robot —
should look like unthreatening building equipment, similar to a hotel delivery bot or airport
assistance robot. Body sits on a wheeled base for smooth indoor floors, wheels partially hidden
by a low skirt/fairing. Square sensor head capable of swiveling left/right, mounted on a short
neck/pivot above the body. Front of the head has a central camera lens and a small distance
sensor. Status LED strip embedded along the body and around the sensor head rim. Small
identification badge/logo area on the front torso reading as a corporate security-robot ID plate
(no legible text, just a plausible badge shape/emblem). Clean hard-surface panel lines, subtle
wear and smudges consistent with daily hallway use, no exposed wiring or damage.

Create a 3x1 horizontal sheet of three equally sized square cells, same robot design, same pose,
same camera angle and same body/head orientation in every cell — ONLY the LED color and LED glow
intensity change between cells:
Cell 1 (normal patrol): LED strip and head-ring LEDs are a calm blue, soft glow, robot reads as
harmless and idle-alert.
Cell 2 (anomaly detected): LED strip and head-ring LEDs are amber/orange, slightly brighter
glow, head angled very slightly more alert but same base pose.
Cell 3 (ARCHI-controlled / attacking): LED strip and head-ring LEDs are red, strong glow with a
faint red rim-light spilling onto the nearby body panels, same base pose and silhouette as cells
1-2 — the robot must be instantly recognizable as the SAME machine, only its lighting state
communicates the escalation.

Do not change body proportions, wheel position, head shape, sensor placement, or badge position
between cells. Do not add weapons, arms, or new attachments in cell 3 — the escalation reads
entirely through LED color and glow, not through a redesign.

Delivery: REAL TRANSPARENT ALPHA background in all three cells, not checkerboard, not
white/gray. Single sprite sheet only, no ground plane, no cast shadow beyond a minimal contact
shadow directly under the wheels. No text, no UI, no frame.
```

## After generating

- Save the output PNG under this folder (e.g. `guard-robot-states.png`) and fill in the file
  list (exact pixel dimensions, cell size) above.
- Note the actual floor(s) this appears on (1층 first encounter, later B2 per `기획.md`) and
  whether integration reuses a single design across floors or needs per-floor variants.
- If a patrol/walk-cycle or facing-direction (left vs right) variant is needed later, follow the
  CCTV-style pose-sheet pattern with the same LED-state cells duplicated per facing, and record
  the mounting/foot-baseline anchor the way `CCTV-PROMPT.md` and `js/core/config.js`'s `floorY = 570`
  require for alignment.
