# 엘리베이터 호출·정전 컷씬

- 생성 도구: built-in `image_gen`. 기존 `jeong-suho-interact.png`를 인물·복장 참고 이미지로 사용했다.
- 채택한 출력: `exec-036b8f06-4716-4baa-81e3-15c0054c7836.png` → `jeong-suho-blackout-call-source.png` (1774×887 RGBA).
- 게임용: `jeong-suho-blackout-call.png` (512×256 RGBA), 가로 256×256 셀 2개. 두 프레임 모두 뒤통수와 등이 보인다. 0번은 팔을 들어 올리는 자세, 1번은 오른손으로 벽의 호출 버튼에 손을 뻗는 자세다.
- `scripts/prepare-blackout-call.ps1`로 기계적 분할·최근접 축소한다. 몸 중심 x=128, 신발 바닥 y=237, 화면 표시 192×192를 유지한다.
- 놀라는 자세는 기존 `jeong-suho-caught.png`의 첫 프레임을 재사용한다. 붙잡힘 상태에는 들어가지 않는다.
- 진행: 0~1000ms 호출 위치로 이동, 1000~1300ms 등을 돌리고 팔 준비, 1300~2900ms 버튼에 손 뻗기, 1500~1780ms / 2250~2560ms 조명 소등 후 복구, 2900ms 영구 정전, 2900~3220ms 24px 뒷걸음, 4800ms 조작 복귀.
- Esc/버튼으로 건너뛰어도 정전은 확정된다. 한 번만 재생하며 층 변경 시 잠금을 해제한다. 동작 줄이기 설정에서는 중간 깜빡임을 생략한다.
- 검증: `tests/blackout-scene.mjs`, `tests/blackout.mjs`.

## 최종 생성 프롬프트

Create a replacement TWO-FRAME game animation sprite atlas using this reference ONLY for exact character identity, costume and detailed illustrated pixel-game rendering. Character: Suho, slim Korean young adult male office worker, short tousled black hair, white business shirt with rolled sleeves, straight black trousers and gray-white sneakers. CRITICAL: BOTH poses are BACK VIEW facing AWAY FROM VIEWER toward a wall/elevator, NOT SIDE VIEW. Show BACK OF HEAD ONLY: black hair and nape, no face, eyes, nose, mouth or profile. Back of white shirt, back of trousers, heels visible. ID badge and tie are on front and must NOT appear on back. The elevator is in the background behind his far side, so he reaches AWAY from viewer and slightly toward screen-right to an unseen wall call button at shoulder/head-base height. Exactly TWO equal square cells in a HORIZONTAL strip 1024x512, transparent background. Same body/feet anchor in both cells, identical scale. Character body center x=245 local cell, top of hair y=44, soles y=474, standing height430. FIRST cell: standing with back fully toward viewer, right elbow beginning to lift, right hand near right shoulder at x=310 y=170. SECOND cell: still fully back toward viewer, right upper arm raised naturally outward screen-right, elbow bent, right index finger extended to press an unseen wall button at local x=385 y=130, below head top; left arm relaxed beside left hip. Foreshortened forearm reaches away into the wall plane. No backward facing palm, no weird reversed elbow, exactly two normal arms, natural anatomy and five fingers. Body and shoes DO NOT move between frames. Preserve narrow realistic proportions, same full-body size as source character; no chibi. Do NOT draw elevator, wall, UI, button, floor, cast shadow, text, grid or extra character. Real transparent alpha around clean silhouettes.
