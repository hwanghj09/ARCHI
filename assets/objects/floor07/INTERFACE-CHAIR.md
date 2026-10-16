# 7층 검증실 인터페이스 의자

내장 `image_gen`으로 만든 투명 배경의 신경 인터페이스 실험 의자다. 머리 전극, 팔걸이 센서,
배선, 금속 받침과 실험표를 그렸다. 기존 조사 내용과 인터록 제어반의 출입문 해제는 유지한다.

- 생성 원본: [source/interface-chair.png](source/interface-chair.png)
- 게임 에셋: [interface-chair.png](interface-chair.png), 256×451 RGBA
- 최종 프롬프트: [source/interface-chair-prompt.txt](source/interface-chair-prompt.txt)
- 재조립: 저장소 루트에서 `node scripts/prepare-floor07-chair.mjs`
- 배치: `floor-07.js`의 의자 영역 x1000..1200, y340..570. 그림은 중앙 정렬하고 높이 230으로 표시한다.
- 조사 테두리: 불투명 그림 폭에 맞춘 x1035..1165, y340..570.
