# 승인 에셋과 실제 규격

모든 경로는 프로젝트 루트 기준이다. 전체 이미지를 읽지 말고 현재 작업의 참고 이미지와
프롬프트만 연다. 다음 값은 2026-09-20 기록이며 현재 파일을 다시 확인한다.

## 캐릭터

정수호: 마른 성인 한국인 개발자, 헝클어진 검은 머리, 피곤한 얼굴, 소매를 걷은 흰 셔츠,
느슨한 검은 넥타이, 목걸이 사원증, 검은 바지, 회백색 운동화. 과장된 귀여운 비율을 피한다.

| 용도 | PNG 경로 | 배치 | 제작 기록 |
| --- | --- | --- | --- |
| 정수호 기준 | `assets/player/jeong-suho.png` | 256x256 | `assets/player/PROMPT.md` |
| 걷기 | `assets/player/jeong-suho-walk-six.png` | 1536x256, 가로 6셀 | `assets/player/WALK-PROMPT.md` |
| 점프/낙하 | `assets/player/jeong-suho-jump-fall.png` | 1774x887, 가로 2셀 | `assets/player/ACTION-PROMPTS.md` |
| 조사/상호작용 | `assets/player/jeong-suho-interact.png` | 1774x887, 가로 2셀 | `assets/player/ACTION-PROMPTS.md` |
| 대기 | `assets/player/jeong-suho-idle-four.png` | 1254x1254, 2x2셀 | `assets/player/IDLE-PROMPT.md` |

점프/낙하와 조사 이미지는 현재 연결되어 있다. 대기 시트는 생성만 완료된 상태로 기록되어 있다.
시트 전체 해상도와 게임 표시 크기는 다르다. CSS의 플레이어 표시 박스와 발 위치를 확인한다.
모든 시트가 한 줄이거나 256px 셀이라고 가정하지 않는다.

## 소품

| 용도 | PNG 경로 | 배치/상태 | 제작 기록 |
| --- | --- | --- | --- |
| 문 | `assets/objects/floor17/elevator.png`, `stairs.png` | 각 512x512, 가로 2개의 256x512셀 | 같은 폴더 `PROMPT.md` |
| PC | `assets/objects/office/pc-off-on.png` | 1774x887, 꺼짐/켜짐 | 같은 폴더 `PROMPTS.md` |
| 종이 노트 | `assets/objects/office/notebook-closed-open.png` | 1774x887, 닫힘/열림 | 같은 폴더 `PROMPTS.md` |
| CCTV | `assets/objects/floor17/cctv-patrol.png` | 2172x724, 좌/정면/우 | 같은 폴더 `CCTV-PROMPT.md` |
| 태양광 임시전력 | `assets/objects/power/solar-supply-off-on.png` | 1774x887, 화면 꺼짐/켜짐 | 같은 폴더 `PROMPT.md` |

PC·노트·CCTV는 생성만 완료된 상태로 기록되어 있다. 태양광 장치는 옥상에 배치되어 있지만 전력 기능은 없다. 현재 코드 참조를 검색해 재확인한다.
CCTV 고정부는 프레임별 위치 차이가 남아 있다. 순찰 순서는 0,1,2,1이며 연결 전에 앵커 정렬이 필요하다.
태양광 장치는 두 셀 모두 작은 초록 LED가 남아 있고 화면이 상태를 구분한다.
독립 소품은 투명 배경을 쓴다. 기존 배경 문을 가리는 사각 오버레이는 불투명 면이 필요할 수 있다.

## 환경

- `assets/background/floor17/floor17.png`: 조립 아틀라스 3328x768.
  실제 월드는 3200x720, 타일 256x256, `tiles/{row}-{col}.png` 13열 x 3행.
  오른쪽 여분과 아래쪽 여분이 있으므로 아틀라스를 월드 크기로 오인하지 않는다.
- `assets/background/floor17/office-interior.png`: 2172x724.
  현재 표시 폭 2400, 소스 바닥 y=504를 월드 y=570에 맞춘다.
  화풍 참고용으로 적합하다. 생성 절차는 같은 폴더 `OFFICE-PROMPT.md`.
- `assets/background/floor17/REMOVE-DOOR-PROMPT.md`: 두 번째 작업실 출입문을
  고정 유리로 바꾼 국소 편집 사례. 승인된 아틀라스와 타일을 함께 수정한 기록이다.
- `assets/background/elevator/cabin-b2-to-17.png`: 현재 사용 중인 엘리베이터 내부,
  1536x1024. 같은 폴더 `B2-TO-17-PROMPT.md`를 읽는다.
  이전 `cabin-closed.png`, `cabin-all-floors.png`는 이전 시안이며 현재 층 선택 기준으로 쓰지 않는다.

## 현재 월드 제약

- B2, B1, 1~17층의 19개 엘리베이터 정차 층. 0층과 옥상은 엘리베이터 선택 대상에서 제외한다.
- 옥상은 17층 비상계단으로만 왕복한다. `assets/background/rooftop/rooftop.png`와
  같은 폴더 `PROMPT.md`를 참고한다. 계단문 오른쪽 x=720에 화면이 꺼진 태양광 임시 전력장치가 배치되어 있다.
- 17층 복도와 사무실은 유지한다. 다른 18개 층은 폭 2400의 빈 공간으로,
  바닥·벽·엘리베이터 3대 외 콘텐츠를 자동으로 채우지 않는다.
- 17층 사무실 입구 1개, 내부 출구 1개. 제거된 두 번째 입구를 그림이나 코드에 복원하지 않는다.
- 기획 문서의 미래 콘텐츠는 참고일 뿐이다. 위의 현재 사용자 선택을 기획 문서로 덮어쓰지 않는다.
