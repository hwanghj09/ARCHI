# 화이트보드·노트 조사 내용 설정

기존 층별 소품 데이터(`js/floors/floor-*.js`)에 아래 필드를 넣으면 E로 조사할 때 전용 UI가 열린다. 위치·상호작용 조건·열쇠 지급 등 기존 필드는 그대로 둔다. 화이트보드는 `surface: 'whiteboard'`, 노트는 `surface: 'notebook'`이다.

## 텍스트로 적기

```js
surface: 'whiteboard',
message: '옥상 열쇠는 소화전 안에 있다는 메모다.',
writing: [
  { as: 'title', text: '시설 관리 메모' },
  '옥상 열쇠는 소화전 안에 보관.',
  { as: 'hand', text: '반납 잊지 말 것!', ink: 'red' },
],
caption: '모서리가 조금 지워진 메모다.',
```

## 글까지 그려진 완성 이미지로 표시하기

```js
surface: 'notebook',
message: '노트에 적힌 단서를 화면 낭독기로도 읽을 수 있도록 여기에 쓴다.',
image: 'assets/ui/my-notebook.png', // 실제로 추가한 이미지 경로
caption: '책상 위에 펼쳐진 노트.',
```

`image`는 화이트보드·노트 등 모든 조사 표면에서 지원한다. 완성 그림을 비율 그대로 표시하므로 테두리와 글까지 이미지에 포함하면 된다. `image`와 `writing`을 함께 지정하면 완성 그림을 우선한다. 기존 사원증(`card`)만 이전과 같이 이미지와 글을 함께 표시한다. 완성 그림 아래에 `caption`이 있으면 caption까지 스크롤 없이 보이도록 그림을 조금 줄인다(높이 480px 이하 가로 화면은 caption 두 줄 몫만 비운다).

## 글 사이에 이미지 넣기

```js
surface: 'notebook',
message: '옥상 열쇠 그림 옆에 소화전 안에서 찾았다고 적혀 있다.',
writing: [
  '옥상 열쇠',
  { as: 'image', src: 'assets/ui/rooftop-key.png', alt: '낡은 황동 열쇠' },
  '소화전 안에서 찾았다.',
],
```

`writing` 항목 순서대로 글과 그림을 배치한다. 표면 전체는 기존처럼 화면 낭독기에서 숨기고 `message`를 읽으므로, 이미지에 담긴 필수 단서도 `message`에 포함한다. `caption`은 UI 아래의 설명이다. 획득 후·조건 미달 내용은 기존 `takenSheet`·`missingSheet`에도 같은 필드를 사용할 수 있다.

검증: `npm run test:writing` — 기존 조사 UI 164개, 화이트보드·노트의 이미지 전용/텍스트 혼합 표시, 데스크톱·모바일·가로 화면과 실제 소품 조사 경로.
