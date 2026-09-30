# 11층 사업본부·전략마케팅본부 스프라이트

생성: 2026-09-29, ChatGPT 이미지 생성. 기획: `docs/floor-design/11F.md` 4장·6장.

남색과 탁한 놋쇠 강조색의 출입문 3종. 문 하나를 복도 문과 방 안 출구에 함께 쓸 예정이다. **아직 게임에 연결하지 않았다** (`index.html`의 `.room-door.gilt / .privacy / .stockroom`은 CSS 그대로).

| 파일 | 현재 크기 | 목표 캔버스 | 게임 크기 | 상태 |
| --- | --- | --- | --- | --- |
| sales-door.png | 829×1897 (원본) | 840×1920 | 140×320 | 저장만 함 |
| strategy-door.png | 793×1983 (원본) | 780×1920 | 130×320 | 저장만 함 |
| materials-door.png | 768×2048 (원본) | 720×1920 | 120×320 | 저장만 함 |
| fire-shutter-states.png | — | 384×1952 (2칸) | 표시 48×488 | 미생성 (선택, 문 3개 뒤에 시도) |

세 파일은 처음에 화면 캡처본(약 300×700, 흰 배경 포함)으로 저장했다가, 같은 날 원본 파일로 교체했다. 원본에는 흰 여백이 없고 크기도 13~15층 문 원본(약 800×2000)과 비슷하다.

## 연결 전에 해결할 것

- **문 바깥 검은 여백**: 원본에도 문틀 바깥에 얇은 검은 테두리가 있고, strategy-door는 문 위 표시등 때문에 위쪽 여백이 크다. 게임은 문 이미지를 문 상자에 `background-size: 100% 100%`로 꽉 채우므로, 적용할 때 여백을 잘라 문틀이 가장자리에 닿게 할지(표시등은 빠짐), 그대로 둘지 캡처를 보고 정한다.
- **비율**: 원본 비율은 0.437, 0.400, 0.375이고 게임 문 비율은 0.4375(7:16), 0.406(13:32), 0.375(3:8)다. 그대로 늘려도 거의 티가 나지 않지만, 여백을 자르면 다시 비교한다.

## 검수 메모 (2026-09-29, 모두 "고치지 않아도 됨")

### sales-door (영업본부 사무실)
- 놋쇠 틀이 기획서의 "가느다란 틀"보다 두껍다. 그래도 "대표 출입문" 느낌이 나서 오히려 괜찮다.
- 금색 줄이 다른 층 문의 주황 띠보다 조금 밝다. 게임에서 어둡게 처리되므로 문제없다.

### strategy-door (전략회의실)
- 가로줄이 필름보다 블라인드처럼 보인다. 안이 안 보인다는 목적은 충분히 전달된다.
- 문 둘레에 검은 여백이 있고, 문 위 표시등 때문에 위쪽 여백이 특히 크다. 적용할 때 잘라낸다. 참고용으로는 문제없다.

### materials-door (마케팅 자료실)
- 명판이 기획서의 "탁한 놋쇠"보다 조금 새것처럼 밝다. 게임에서 어둡게 처리되면 괜찮다.
- 비율이 기획서(3:8)보다 살짝 넓다. 적용할 때 맞춘다. → 원본 파일(768×2048)은 정확히 3:8이라 해결됨. 캡처본에서 흰 여백 때문에 넓어 보였던 것.

## 실제 생성 프롬프트

ChatGPT에 보낸 문 설명 부분이다. 앞에 붙인 공통 화풍 지시(①)는 이 기록에 포함하지 않았다. 원문 프롬프트는 `docs/floor-design/11F.md` 6장에 있다.

### sales-door

```text
Door 1: a double glass entrance door. Two dark smoked navy glass leaves, thin brass frames, a pair of tall brass bar handles at the center, one thin gold horizontal line across both leaves at waist height. Faint empty office silhouettes behind the glass. Tall portrait, about 7:16.
```

### strategy-door

```text
Door 2: a single glass meeting-room door in a navy steel frame. The middle third of the glass is covered by frosted privacy film with fine horizontal stripes, the rest is very dark navy glass. Slim brass vertical handle on the right, a small unlit black lamp above the door. Tall portrait, about 2:5.
```

### materials-door

```text
Door 3: a windowless storeroom door. Flat matte slate-navy painted steel, scuffed paint, a small empty brass nameplate near the top, plain steel lever handle on the right, scratched kickplate at the bottom. Plain back-office door. Tall portrait, about 3:8.
```

### fire-shutter-states (미생성)

```text
Different object, same art style: a rolling steel fire shutter seen from the SIDE, as one very tall narrow vertical object on a transparent background. Top: a boxy steel housing at the ceiling. Middle: a thin ribbed steel curtain lowered to the floor. Bottom: a heavy bar with yellow and black warning stripes. A small gray box with an empty crank socket at waist height. No fire, no smoke.
```
