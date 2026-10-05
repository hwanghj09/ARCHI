# ARCHI Hand

`archi-hand.woff2`: 조사 UI의 화이트보드·노트·게시판·칠판 손글씨(`writing.css`).

- 원본: Nanum Pen Script (NanumPenScript-Regular.ttf 3,201,664바이트), https://github.com/google/fonts/tree/main/ofl/nanumpenscript
- 라이선스: SIL Open Font License 1.1 (`ARCHI-HAND-OFL.txt`, 원본 OFL.txt 그대로). Copyright (c) 2010, NHN Corporation.
- 변경: fontTools 4.60.1로 KS X 1001 한글 2,350자, 호환 자모, ASCII, 자주 쓰는 문장부호와 `js/floors/*.js`에 쓰인 글자로
  줄이고 WOFF2로 바꿨다(483,036바이트). 원본에 없는 `·` `…` `→` `①` 같은 기호는 `Malgun Gothic` 등 다음 글꼴로 그린다.
- OFL의 예약 글꼴 이름(Nanum, NanumPen 등) 때문에 줄인 글꼴은 이름을 `ARCHI Hand`로 바꿨다(name 테이블 1·3·4·6·16번).
  저작권 표기(0번)와 라이선스 표기(13·14번)는 그대로 둔다.

층 문구에 KS X 1001 밖의 한글을 새로 쓰면 그 글자만 다음 글꼴로 보인다. 다시 만들 때는 원본 TTF에 같은 과정을 거친다.
