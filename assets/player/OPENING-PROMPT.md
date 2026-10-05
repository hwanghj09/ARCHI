# 퇴근 오프닝

내장 `image_gen`으로 생성했다. 최종 원본은 `jeong-suho-opening-source.png`, 게임용 시트는 `jeong-suho-opening.png`(1536×256, 6프레임)다. `powershell -NoProfile -File scripts/prepare-opening.ps1`로 다시 분할한다. 1536×1024 원본의 행 경계는 머리가 잘리지 않도록 y=490으로 잡는다.

1. 모니터를 향해 앉은 완전한 뒷모습, 마무리 작업.
2. 뒷모습을 유지하며 오른손으로 컴퓨터 종료.
3. 화면이 꺼지고 손을 내린 뒷모습.
4. 앉은 채로 오른쪽으로 고개와 몸을 돌림.
5. 오른쪽을 향해 몸을 앞으로 숙이며 일어남.
6. 오른쪽을 향해 완전히 선 뒤 기존 플레이어 조작으로 전환.

의자와 컴퓨터는 기존 사무실 배경을 사용한다. `js/scene/opening.js`가 5.4초 동안 여섯 포즈와 모니터 ON→종료 중→OFF를 동기화한다. 컷씬 동안 일반 입력은 잠기며 Esc 또는 버튼으로 건너뛸 수 있다. 스프라이트 로딩 실패 시에도 동일한 종료 상태로 복구한다. 재입장에는 재생하지 않고 페이지를 다시 불러오면 재생한다. 움직임 거리나 휴대폰 상태 등 일반 플레이 상태는 바꾸지 않는다.

## Final prompt

References: `assets/player/jeong-suho.png` (character identity), `assets/background/floor17/office-interior-aligned.png` (environment orientation).

Use case: identity-preserve. Create the FINAL six-frame game sprite atlas for Suho's opening cutscene. Image1 is CHARACTER IDENTITY reference; image2 is ENVIRONMENT ORIENTATION reference only: the computer monitor faces the viewer, so a man sitting at it MUST have his BACK TO THE VIEWER, NOT be in side profile initially. Character ONLY, NO chair, NO computer, NO desk, NO backdrop. Preserve slim adult male Suho, messy short black hair, white rolled-sleeve shirt, black pants, gray sneakers; black tie and blue lanyard are on his chest and NOT visible on his back. EXACT 1536x1024 canvas, 3cols by2rows,512px square cells. Same character scale and skull size in all frames, hips centered local x256, soles y474. Reading order: 1 top-left: FULL REAR VIEW, seated at the computer on an invisible chair, back of head and white-shirted back only, face completely hidden, forearms reach forward AWAY from viewer to keyboard, feet below knees. 2 top-middle: STILL FULL REAR VIEW, extends right forearm away/slightly right to click mouse and shut down, no face visible. 3 top-right: STILL REAR VIEW, computer now off, hands return beside thighs, shoulders relax; no face visible. 4 bottom-left: WHILE STILL SEATED turns head and torso CLOCKWISE toward screen-RIGHT, a three-quarter back/right-facing pose, only now the side of his face appears. 5 bottom-middle: now RIGHT-FACING three-quarter/profile, leans forward and pushes up from chair, half-standing with knees bent, feet planted. 6 bottom-right: fully upright RIGHT-FACING side view matching reference1, arms relaxed at sides. Exact sequence is back-view seated -> back-view shutdown -> back-view pause -> TURN RIGHT WHILE SEATED -> RISE -> STAND RIGHT. First3 poses' shoulders read symmetrically from the back, no chest/tie/badge facing viewer. Standing head near cell y38, seated head lower near y110, feet stay on y474. Correct human anatomy and far-arm occlusion. Fine crisp pixel art consistent with original, not smooth painted anime. Actual clean alpha=0 everywhere outside tight character silhouettes and between limbs, no fog, no halo, no shadows, no background, no labels or grid lines.
