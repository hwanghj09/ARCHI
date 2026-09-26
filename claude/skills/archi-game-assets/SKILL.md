---
name: archi-game-assets
description: Generate, edit, validate, and optionally integrate ARCHI pixel-art sprites and backgrounds. Use for character animations, interactive props, room art, localized background repairs, and mouse interactions built on generated art.
---

# ARCHI 게임 에셋 제작

다른 AI가 ARCHI에서 수행한 이미지 생성, 상태별 스프라이트 제작, 배경 수정,
게임 연결 작업을 재현하는 스킬이다. 프로젝트 루트 기준 경로를 사용한다.
이 파일을 읽고 현재 사용자 요청에 해당하는 절차만 실행한다.
같은 프롬프트로도 생성 이미지의 픽셀이 같아지는 것은 보장되지 않는다.
정확히 같은 결과가 필요하면 승인된 PNG 원본을 재사용한다.

## 요청 범위

- "그려줘/이미지부터/미리 스프라이트": 이미지와 제작 기록만 저장한다.
  "나중에 움직이게"는 현재 애니메이션 연결 지시가 아니다.
- "연결까지": 생성물 검수 후 실제 게임 상태, 입력, 렌더링에 연결한다.
- "배경에서도 지워줘": 상호작용 제거만으로 끝내지 말고 배경 원본과 사용 중인 타일을 수정한다.
- 커밋·푸시는 현재 요청에서 요구한 경우에만 한다. 기존 다른 작업의 변경을 되돌리지 않는다.
- 명확한 요청은 바로 수행한다. 대상 이미지 누락이나 범위 충돌처럼 결과를 막는 경우만 질문한다.

## 시작할 때

1. 저장소 지침과 `git status --short`를 확인한다. RTK가 요구되는 환경에서는
   명령에 `rtk`를 붙인다. 출력은 필요한 경로와 작은 범위로 제한한다.
2. 가장 비슷한 승인 PNG를 실제 이미지 뷰어로 보고, 그 옆 프롬프트 문서를 읽는다.
   [에셋 기준표](references/assets.md)에서 해당 종류만 찾는다.
3. 연결 요청이면 `js/` 아래 기능별 스크립트, `index.html` 및 관련 테스트에서 해당 상태와 호출 경로를 확인한다.
   아래 규격은 기록 시점의 값이며 실제 코드와 PNG를 우선한다.
4. 기존 `.claude/skills/archi-art-prompt/SKILL.md`는 과거 프롬프트 작성 참고용이다.
   도구 가용성, 프레임 모양, 출입문 개수 등은 현재 상태를 확인하고 사용한다.

## 이미지 생성 도구

- 현재 환경에서 실제 제공되는 이미지 생성/편집 도구를 먼저 확인한다.
  특정 AI라는 이유로 도구가 없다고 단정하거나 존재하지 않는 API를 호출하지 않는다.
- Codex의 built-in `image_gen`이 있으면 기본으로 사용한다. 로컬 입력 이미지는 먼저 열어 본다.
  입력이 디자인 보존 대상인지, 화풍 참고인지 프롬프트에서 명시한다.
- 도구마다 입력 방식이 다르므로 제공된 스키마를 따른다. 참조 이미지를 쓸 수 없다면
  사용자가 첨부하도록 요청한다. 코드로 그린 SVG나 임시 도형을 생성된 스프라이트라고 대신 내놓지 않는다.
- 생성 한도/도구 부재이면 실패 이유를 알린다. 유료 API/CLI 대안은 키·비용 조건을 설명하고
  명시적 요청 또는 동의 후에만 사용한다. 반복 호출로 한도를 우회하지 않는다.
- 도구가 저장 위치를 반환하면 원본을 유지하고 최종 선택본을 프로젝트 `assets/`로 복사한다.
  사용자 교체 지시 없이 기존 에셋을 덮어쓰지 않는다.

## 프롬프트 구성

아래는 채워서 쓰는 템플릿이며 각 항목은 해당 에셋에 필요한 경우만 넣는다.

```text
Asset: ARCHI 2D side-scrolling game [sprite sheet / background / localized edit].
Reference role: [approved character identity / style only / image to edit].
Subject and action: [object or character; required pose and state per cell].
Style: crisp detailed muted anime-inspired pixel art, realistic proportions,
restrained midnight Korean office atmosphere, no painterly blur or chibi redesign.
Layout: [columns x rows], equal [width x height] cells, [reading order].
Invariants: same design, scale, lighting and [foot baseline / fixed mounting pivot].
Change only: [pose / screen / door leaves / explicitly bounded background region].
Background: [true transparent alpha for isolated sprites / opaque environment].
Constraints: entire subject visible, cell padding, no baked checkerboard, captions,
frame numbers, borders, watermarks or unrequested characters.
```

- 플레이어는 승인 정수호 이미지의 얼굴·체형·머리·의상을 보존하고 기본 진행 방향인 오른쪽을 따른다.
- 상태형 소품은 같은 물체의 상태 차이를 구체적으로 지정한다. 켜짐에 표시등만 바뀌는지,
  화면도 바뀌는지 정한다. 태양광 패널 자체는 켜졌다고 발광하지 않는다.
- CCTV 등 회전물은 고정 브래킷과 움직이는 몸체를 구분하고 고정 회전축을 지정한다.
- 횡스크롤 배경은 직선 보행 기준선과 출입구 위치가 중요하다. 소품의 입체 표현과
  엘리베이터 1인칭 내부에는 필요한 원근을 허용한다. 모든 이미지를 측면도로 강제하지 않는다.
- UI 글자와 실제 버튼은 가능한 DOM으로 만든다. 그림 속 버튼 모양만으로 클릭이 구현된 것은 아니다.

## 검수와 저장

1. 생성 결과를 눈으로 보고 종류, 자세, 프레임 순서, 잘림, 디자인 일관성을 확인한다.
2. 이미지 라이브러리로 실제 폭·높이·알파를 읽는다. 요청한 해상도 그대로 나왔다고 가정하지 않는다.
   폭/열 수, 높이/행 수가 정수인지 확인한다. 모서리 알파 0만으로 충분하지 않으므로
   밝고 어두운 바탕에서 빈 영역과 가장자리도 확인한다.
3. 프레임을 같은 기준점에 겹쳐 보거나 전환하여 발·고정부의 흔들림을 확인한다.
   생성기의 동일 위치 지시가 보장된다고 믿지 않는다. 연결 전에는 실제 정렬을 해결한다.
4. 그림 수정은 이미지 편집 도구로 수행한다. 단순 분할·복사·타일 재출력·위치 정규화는
   기존 로컬 도구나 표준 이미지 라이브러리로 처리할 수 있다. 픽셀 아트 크기 변경은 nearest-neighbor를 쓴다.
5. 결과와 가까운 위치에 `PROMPT.md` 또는 기존 명명법에 맞는 문서를 저장한다.
   실제 도구, 참조 경로, 최종 프롬프트와 수정 프롬프트, 출력 크기, 셀 규격·순서,
   앵커, 연결 여부, 남은 결함을 기록한다. 성공하지 않은 지시를 달성했다고 기록하지 않는다.
6. 사용자에게 실제 저장 파일을 보여 주고, 생성 완료와 게임 연결 완료를 구분한다.

## 연결 및 배경 수정

연결, 방/층 추가, 배경 수정, 커밋 요청은 [게임 연결 절차](references/integration.md)를 읽는다.
이미지 단독 요청에는 게임 코드나 층 구성을 변경하지 않는다.
