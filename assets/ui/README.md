# 조사 대화창

`dialogue-frame.png`: built-in `image_gen`으로 생성한 2172×724 PNG.
`index.html`에서 110px nine-slice 테두리로 사용한다. 문구와 닫기 버튼은 HTML이며,
대화창은 데스크톱·모바일에서 하단 조작 버튼 위에 표시된다.
현재는 본문 전체를 표시하며, 한 글자씩 나타나는 연출은 아직 적용하지 않았다.

## 글이 적힌 물건의 표면

`writing`이 있는 소품은 대화창 대신 그 표면을 크게 펼친다(`js/interaction/writing.js`, `writing.css`).
화이트보드(알루미늄 틀, 광택, 지운 자국, 마커 받침)·코르크 게시판·칠판은 CSS로 그리고, 노트는
`notebook/notebook-open-blank.png`(1536×1024)의 두 쪽 글자 영역(왼쪽 160,150 / 오른쪽 845,150, 각 약 525×650) 위에
쓴다. 폭 560px 이하에서는 같은 그림의 오른쪽 쪽만 잘라 한 쪽으로, 높이 480px 이하에서는 같은 색 종이 두 쪽(CSS)으로 바꾼다.
손글씨는 `assets/vendor/fonts/archi-hand.woff2`(Nanum Pen Script 기반, 그 폴더 README 참고)다.

서류(출력물·공지문·안내판·포스터·증서·명패), 화면(모니터·초록 콘솔·장비 액정), 메모(포스트잇·쪽지), 영수증, 라벨(라벨 테이프·
스티커·경고 스티커·금속 명판·꼬리표)도 모두 CSS로 그린다. 사원증만 `assets/objects/id-cards/jo-hyeon-a.png`를 그대로 보여 준다.

## 생성 프롬프트

Use case: ui-mockup. Create a production game UI bitmap asset, NOT a scene or mockup screenshot: a single empty dialogue box frame for ARCHI, a Korean pixel-art side-view mystery game set in an office building at midnight. Wide landscape rectangle approximately 1536x512. The box fills the canvas edge to edge with square clipped/beveled corners. Restrained dark charcoal / blue-black central panel, very subtle material texture, thin desaturated sage-gray double-line metal border, tiny warm ivory wear on the four corners. Understated atmospheric survival mystery, crisp pixel-art edges, no futuristic neon. All ornamental detail stays within the outermost 40 pixels; central 90 percent is near-uniform dark opaque fill suitable for high-contrast Korean text. Designed for CSS nine-slice scaling: long borders straight and repeatable, all corners self-contained within 64x64 pixels. Fully straight-on orthographic 2D. No text, letters, numbers, portraits, icons, buttons, nameplate, symbols, extra objects, drop shadow, background scene or margins. Actual transparent alpha only outside the clipped corners, opaque dark interior. One finished dialogue panel asset.
