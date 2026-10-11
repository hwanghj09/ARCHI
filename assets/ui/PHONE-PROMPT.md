# 수호의 휴대폰 UI

- 생성 도구: built-in `image_gen`.
- 생성 결과 `exec-04e18349-9c7d-4253-ad5f-6cbf20afbe63.png`를 `assets/ui/phone-device.png`에 저장했다. 887×1774 RGBA, 투명 배경, 정면 기기 1장이다.
- 이 PNG는 지금 충전함에 꽂힌 작은 휴대폰 스프라이트(`.docked-phone`)에만 쓴다.
- 휴대폰 화면의 본체는 `assets/ui/phone-device.svg`(손으로 쓴 SVG, 887×1774 기준 1:2)다. 안드로이드 플래그십처럼 얇고 균일한 베젤과 오른쪽 볼륨·측면 키만 있고, 화면은 x 42~838 / y 46~1728(좌 4.74%, 우 5.52%, 위아래 2.59%) 안쪽에 HTML로 그린다. 펀치홀 카메라는 화면 위에 CSS로 얹는다.
- 화면은 One UI(다크 모드) 방식이다. 상태 표시줄(시계·Wi-Fi·신호·배터리)을 누르거나 아래로 쓸면 빠른 설정(손전등·Wi-Fi·소리/무음·블루투스·비행기 탑승 모드·방해 금지 타일, 밝기 막대)이 내려온다. 손전등과 밝기·무음(휴대폰 효과음 끔)만 실제로 동작하고, 나머지 타일은 상태 표시줄 아이콘만 바꾼다.
- 홈 화면은 시계 위젯, 손전등 위젯, 아래쪽 앱 독이다. 하단 탐색 버튼은 최근 앱(쓰던 앱 카드·모두 닫기) · 홈 · 뒤로다. 뒤로와 Esc는 빠른 설정 → 앱·최근 앱 → 홈 → 휴대폰 닫기 순으로 한 단계씩 돌아간다.
- 배터리 잔량과 플래시 상태는 게임 상태를 표시하며 버튼은 실제로 작동한다. 표시 시각 00:00은 게임 배경 시각이다.
- P 또는 휴대폰 버튼으로 열고, P, 본체 오른쪽 측면 버튼(화면 끄기), 홈 화면의 뒤로·Esc로 닫는다. 플래시가 켜져 있을 때만 화면을 닫은 뒤에도 휴대폰을 들고 이동한다. 플래시 OFF/배터리 소진 시 자동으로 넣으며, 별도 들기·넣기 버튼은 없다.

## 사용한 생성 프롬프트

Use case: game UI asset. Draw one realistic illustrated modern smartphone handset, front view perfectly straight-on orthographic, portrait, centered upright with no perspective, no hands. Dark graphite metal edge, subtly worn black glass bezel, rounded corners, thin silver rim highlights, small earpiece and tiny front camera at TOP BEZEL above screen, physical side power/volume keys subtle. An understated realistic hand-painted game prop for a dark Korean office survival adventure, crisp clean edges and believable glass/metal shading, not a cartoon or vector. Screen is an EMPTY uninterrupted deep midnight blue-black rounded rectangle, no icons, letters, apps, controls or reflections across its middle: interactive HTML will overlay it. Screen opening must occupy most of handset, with equal narrow side borders and a small chin. Phone outer aspect ratio 1:2, full body visible, no rotation. Canvas portrait 1024x1536, phone roughly x=160..864 y=60..1468 with transparent margins. Truly transparent alpha background, no ground, shadow outside handset, no people, no logos, no watermark, no text. Highest clarity especially outline, earpiece, camera and bezel. One isolated phone only.
