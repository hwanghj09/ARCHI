# 일반 복도 출입문 수정 · 2026-10-18

내장 ImageGen으로 네 구간을 편집했다. `*-before.png`는 원본 조각의 확대본, `*-generated.png`는 생성 원본, `*-fixed.png`는 게임 원본 크기로 축소한 최종 조각이다. 각 최종 조각은 `manifest.json`의 `base`에 해당하는 `.png`와 `-finished.png` 양쪽의 `box: [x, y, 폭, 높이]`에 합성했다. 지정 영역 밖 픽셀의 일치를 확인했다.

12층 팀장실은 비상구 표지를 없애고 문 너머 블라인드·야경을 실내 복도로 교체했다. 나머지 세 곳은 표지와 발광 흔적만 제거했다. 문 좌표·출입 판정·주변 가구는 유지한다. `js/world/background-power.js`에서도 일반 출입문에 겹쳐 그리던 발광 표지 여섯 항목(원본·마감본)을 제거했다.

원본 이미지도 수정했으므로 `floor12/build.py` 및 `finish_building.py`의 마감 재생성 경로에 수정이 유지된다.

## 최종 프롬프트 세트

### 건강관리실 천장 보정 조각의 프롬프트

Use case: precise-object-edit. Edit target: this cropped dark pixel-art office interior wall, horizontal black ceiling band at the top and partial doorway frame at the bottom. Remove the central glowing GREEN emergency exit sign entirely, including its casing, white pictogram, all green halo and reflected green illumination across the wall. Seamlessly rebuild the original muted BLUE-GRAY metal wall panels behind it, continuing existing subtle horizontal and vertical panel seams. Preserve the exact upper black ceiling band, tiny partial ceiling object at top, doorway frame at bottom, original geometry, flat orthographic perspective and low-resolution pixel-art grain. Match the cool blue-gray color of the unlit wall near the side edges, not green. Plain wall, no signs, text, symbols, marks or new objects. Opaque rectangular crop, preserve aspect ratio.

건강관리실은 최종 문 조각 외에 `f1-clinic-ceiling-generated.png`의 위쪽 210×40 구간도 사용했다(생성 원본을 210×107로 축소한 기준). 기존 표시등의 빛이 `exitArt` 바깥 천장 띠에 남지 않도록 최종 문 조각과 합성했으며, `f1-clinic-fixed.png`와 `manifest.json`은 합쳐진 218×400 영역을 기록한다.

## f12-lead

Use case: precise-object-edit. Edit target is the attached narrow tall pixel-art game background crop showing a brown wooden office exit door. Keep EXACT composition, outer brown wood frame, left silver lever handle and lock, three hinges on the right, straight-on orthographic view, all original positions and relative sizes, muted dark blue-gray palette and pixel-art rendering. Remove the green running-man emergency exit sign completely and seamlessly restore plain dark blue-gray wall in its place; no new signage, no symbols or text, no residual green glow. Replace ONLY the inner glass panel's horizontal blinds, blue sky and distant city lights with a view into an ENCLOSED INTERIOR OFFICE CORRIDOR. Through this glass show a dim gray indoor wall with subtle panel seams, a closed ordinary gray door in the opposite wall, and a small strip of gray indoor floor at the bottom. No outside, no sky, no city, no buildings, no windows, no blinds inside the door. Keep the wood frame, handle, hinges and wall edges exactly fixed so this crop fits back into an existing game scene. Do not add characters or furniture. Opaque full rectangular crop, same tall aspect ratio.

## f12-eval

Use case: precise-object-edit. Edit target: this cropped pixel-art dark perforated steel wall with a small green emergency exit sign. Completely REMOVE the entire sign including its black rectangular casing, running-man symbol, green light and shadow. Reconstruct the same uniform dark blue-gray PERFORATED steel panel over that area: continue the existing regular aligned grid of small circular black ventilation holes at the same pitch and scale. Preserve the original left vertical seam, bottom horizontal seam, dark palette, straight-on composition and pixel-art grain. It should look like a plain continuous piece of perforated wall with no sign ever mounted. No text, no new objects, no solid blank rectangle, no green tint. Opaque rectangular image, preserve aspect ratio.

## f1-clinic

Precisely edit this full cropped pixel-art metal office door. Keep ALL original geometry and pixels outside the small sign and its green light as close as possible: dark blue-gray steel door and frame, narrow black textured vision window, long silver pull handle on RIGHT, left and right adjacent wall strips, horizontal wall trim at lower middle, floor line, original sizes and alignments. Remove ONLY the bright green emergency running-man sign above the doorway and ALL its green illumination spilling onto the upper wall, top of door frame and top of door. Restore a plain continuous DARK BLUE-GRAY wall panel above the frame, matched in brightness and color to the existing wall strips near the lower sides. Keep existing faint horizontal wall seam aligned across the top panel. The sign is mounted on a PLAIN HEADER WALL, not on a separate rectangular plate: remove the entire casing, no replacement plate, no rectangular patch outline or extra seams. Door must remain same dark matte blue-gray steel. Do NOT brighten the wall to light gray, do NOT add trim or objects. Exact straight-on 2D game background, pixel-art grain, no text, no signs, no green light. Preserve original tall aspect ratio; opaque crop.

## f1-vision

Precise object removal in this cropped pixel-art gallery GLASS DOOR. Remove ONLY the small green running-man emergency sign centered on the dark wall header ABOVE the door, including its black casing and ALL green reflections on the header and upper door frame. Replace the sign area with the SAME uninterrupted plain dark BLUE-GRAY header wall matched to its left and right. IMPORTANT: the thin horizontal brass architectural trim lies ABOVE the header wall at the very top, it must stay there unchanged. Do not add a brass line through the removed sign area. Preserve EVERYTHING else exactly: brass/black door perimeter, long silver handle on LEFT, existing indoor corridor with pillars, indoor floor and potted plant visible through the glass, all original pixel positions, size, original darkness, side wall edges. No new objects, no replacement sign/plate or symbols, no text, no rectangular patch outline or green residual glow. Same low-resolution detailed pixel-art style and tall aspect ratio. Opaque rectangular crop.

