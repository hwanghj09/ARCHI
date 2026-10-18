# 달리기 중복 신발 수정

현재 전체 걷기·달리기의 추가 하체 수정은 [MOVEMENT-LEGS-FIX-PROMPTS.md](MOVEMENT-LEGS-FIX-PROMPTS.md)를 참고한다. 아래 앞발 수정에 이어 겹친 종아리와 뒤쪽 신발도 수정하며, 같은 프레임에서는 추가 하체 수정 결과가 최종 적용된다.

- 도구: built-in ImageGen, 실제 투명 배경.
- 편집 대상: 기존 일반 달리기 원본 `jeong-suho-run-eight.png`의 0·3·7번을 가로 3셀로 배치한 참조.
- 생성 원본: `movement-inbetweens-source/run-feet-fix.png`, 2172×724 RGBA, 가로 3셀.
- 최종 적용: `assets/player/jeong-suho-run-sixteen.png` (원본 0·3·7번에 해당하는 셀), `assets/player/jeong-suho-phone-run-sixteen-off.png` (원본 0번에 해당하는 셀).
- 각 발에 하나의 발목·뒤꿈치·밑창·발끝만 있도록 중복된 뒤꿈치 조각을 제거했다.
- 내보내기: `scripts/prepare-movement-inbetweens.mjs`. 생성 결과를 nearest 보간으로 768×256에 정규화한다. 앞쪽 발목/신발 영역 x150–249, y196–255만 반영하고 정강이 중심 및 기존 신발의 최저점에 정렬한다. 몸통·머리·팔·뒤쪽 발·새 중간 자세는 변경하지 않는다.
- 검증: `tests/movement-inbetweens.mjs`의 연속된 신발 한 개/발목 연결/영역 밖 픽셀 보존/기존 중복 신발 검출 및 실제 이동 검사. `tests/phone-movement.mjs`로 휴대폰·점프·좌우 이동을 확인한다.
- 비교: `docs/previews/suho-run-shoes-fixed.png` 위쪽 수정 전, 아래쪽 수정 후 (원본 0·3·7번 순서).

## 최종 프롬프트

Use case: precise-object-edit. Edit target is the attached THREE-COLUMN by ONE-ROW full-body right-facing running sprite sheet, THREE equal square cells, transparent background. Output same 3x1 grid and same composition, preserve pixel style. The ONLY correction requested is each frame's FORWARD SHOE at lower RIGHT. Currently it has a duplicated white heel/second tiny shoe attached under/behind the main front sneaker, so each character appears to have THREE feet. Fix all THREE forward sneakers so EACH figure has exactly TWO feet total: ONE backward/upward sneaker attached to the rear leg (KEEP UNCHANGED), and ONE anatomically correct gray-white SIDE-PROFILE SNEAKER attached to the single extended front leg at lower right.
For the forward foot, remove the extra heel block/second stacked sole and redraw ONE coherent sneaker: single ankle opening, one heel, ONE continuous sole from heel to toe, one toe box pointing right slightly upward, gray fabric panels, white sole, normal slim shoe length matching the original larger sneaker. No detached mini shoe behind it, no duplicated toe, no stacked overlapping soles. Align the sneaker naturally with the trouser hem and ankle so the foot bends forward. Preserve the exact front-leg extension, shin, knee, trouser silhouette and foot location. Do NOT shorten legs or move the forward shoe to another position. Forward sneaker is around normalized cellx166..227,y207..240. Keep foot's lowest point near original floor line.
CRITICAL preserve all other pixels/composition as closely as possible: same head, face, hair, head scale, shirt, arms, hands, torso, hip, trousers and rear foot. No new pose or character redesign, no body resizing or shifted camera, no different lean, no added props or phone. The three cells are different original poses; keep their distinct body/arm poses exactly. No text, borders, labels, floor, shadow or motion trails. Fine crisp muted anime PIXEL ART as original with true transparent background, no painterly blur. Requested1536x512 canvas, exactly3x1 equal512cells. Only fix the malformed lower-right shoes.
