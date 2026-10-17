# 수호 이동 중간 프레임

2026-10-17 · 내장 `image_gen`으로 기존 수호 시트를 참조해 새 자세를 그렸다.

| 원본 | 배열 | 추가 자세 | 게임용 시트 |
| --- | --- | --- | --- |
| `walk.png` | 3열 × 2행 | 6장 | `../jeong-suho-walk-twelve.png` |
| `run.png` | 4열 × 2행 | 8장 | `../jeong-suho-run-sixteen.png` |
| `phone-walk-{off,on}.png` | 3열 × 2행 | 각 6장 | `../jeong-suho-phone-walk-twelve-{off,on}.png` |
| `phone-run-{off,on}.png` | 4열 × 2행 | 각 8장 | `../jeong-suho-phone-run-sixteen-{off,on}.png` |

각 원본의 k번 자세는 기존 k번과 다음 자세 사이에 들어간다. 마지막 자세는 첫 자세로 돌아가는 연결이다. 기존 프레임은 새 시트의 짝수 인덱스에 픽셀 그대로 보존하고 새 그림은 홀수 인덱스에 배치했다. 게임용 셀은 모두 256×256이다.

걷기는 발뒤꿈치 접지 → 체중을 받으며 무릎 굽힘 → 반대 다리가 지지 다리를 지나감 → 발끝으로 밀며 반대 발을 내미는 과정을 보강했다. 달리기는 착지 압축, 무릎 회수, 발끝 밀기, 공중에서 정강이 펴기와 다음 착지 준비를 보강했다. 반주기에서 팔과 다리의 앞뒤가 바뀌도록 수정했고, 걷기의 상체 기울기와 휴대폰을 들지 않은 먼쪽 팔의 가림 관계를 별도로 보정했다. 손전등 ON은 OFF 원본을 참조해 LED만 켜도록 생성했다.

재생 주기는 기존과 같다. 걷기는 한 주기 184px 이동(200px/s에서 0.92초), 달리기는 192px 이동(340px/s에서 약 0.565초)이다. 점프·낙하의 휴대폰 그림은 기존 공중 자세를 유지하도록 새 인덱스 4/12를 사용한다. 손전등의 시작 좌표는 `js/scene/camera.js`에서 모든 새 프레임의 실제 LED 위치에 맞췄다.

## 내보내기와 검증

프로젝트 루트에서 `node scripts/prepare-movement-inbetweens.mjs`로 게임용 여섯 시트를 다시 만든다. 이 스크립트는 그림을 생성하거나 관절을 변형하지 않는다. 원본 그리드를 자르고 최근접 보간으로 크기를 맞추며, 머리 기준점과 발 높이를 정렬하고 중간 프레임의 알파를 0/255로 정리한다. ON/OFF는 같은 OFF 정렬값을 공유한다. 원본 생성 PNG는 보존한다.

`node tests/movement-inbetweens.mjs`로 기존 픽셀 보존·프레임별 구별·투명 여백·잘림·접지를 검사한다. 브라우저 동작은 `tests/movement.mjs`, `tests/running.mjs`, `tests/phone-movement.mjs`에서 확인한다. 미리보기는 `docs/previews/suho-walk-inbetweens.gif`와 `suho-run-inbetweens.gif`이며, 왼쪽부터 일반 이동·휴대폰 OFF·휴대폰 ON이다. GIF 시간 단위에 맞춰 걷기 주기는 0.92초, 달리기는 약 0.56초로 내보냈다.
