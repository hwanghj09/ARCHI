# 오디오 파일

## 정신력 긴장감 BGM

아래 여섯 곡은 `scripts/generate-sanity-bgm.mjs`로 직접 작곡·합성한 48초 스테레오 WAV(24kHz, PCM 16bit)다.
외부 녹음이나 음원 샘플을 사용하지 않는다. `node scripts/generate-sanity-bgm.mjs`로 재생성한다.

- `sanity-dread.wav` — 빈 사무실: 낮은 불협화음과 유리 종 선율.
- `sanity-musicbox.wav` — 꺼진 오르골: 끊어진 고음 선율과 어긋나는 잔향.
- `sanity-vent.wav` — 환기구의 숨: 숨처럼 부푸는 공기 잡음과 거꾸로 차오르는 금속 울림.
- `sanity-pulse.wav` — 벽 너머의 박동: 불규칙한 두 번의 저음 박동과 먼 금속 소리.
- `sanity-strings.wav` — 닫힌 복도: 흔들리는 현악 드론과 길게 겹치는 불협화음.
- `sanity-signal.wav` — 빈 층의 신호: 멀리서 들리는 전자 신호와 좌우로 번지는 잔향.

정신력 50% 미만에서 재생한다. 첫 곡과 다음 곡을 무작위로 고르며 같은 곡을 연속으로 재생하지 않는다.
정신력·음량 변경과 메뉴·탭 전환은 현재 곡의 재생 위치를 유지한다. 회복하면 부드럽게 사라지고 컷씬 음원과 겹치지 않는다.
곡마다 RMS 0.106~0.140, 피크 0.65 이하로 맞췄고 양끝에 페이드를 넣어 전환 때 파형이 튀지 않게 했다.

## 환각·엔딩 효과음

환각 효과음은 합성음이 아닌 mp3 파일이다(js/audio/audio.js). 라이선스는 내려받은 출처 페이지에서 확인한다.

- `hallucination-jumpscare.mp3` — 환각 추격(0% 돌진) 시작 때 재생한다. 원본: `freesound_community-jumpscare-94984.mp3`.
- `hallucination-sighting-1~3.mp3` — 추격이 아닌 환각(예고·멀리 보이는 환각)이 나타날 때 이 중 하나를 무작위로 재생한다.
  직전에 들려준 소리는 건너뛰므로 같은 소리가 연달아 나오지 않는다. 원본: `soumages-jumpscare-335598.mp3`(1),
  `soumages-jumpscare-v2-335599.mp3`(2), `soumages-jumpscare-v3-335600.mp3`(3).
- `hallucination-devoured.mp3` — 환각에게 삼켜져 쓰러질 때 재생한다(`playHallucinationDevouredSound`). 원본: `five-nights-at-freddys-3-springtraps-jumpscare-brightened.mp3`.
- `b2-door-pry.mp3` — B2 엔딩에서 경비 로봇이 상자로 막은 서버실 문을 처음 밀어붙일 때 재생한다(`playDoorPrySound`). 원본: `sound_effects75-robotic_jumpscare-485532.mp3`.
- `b2-siren.mp3` — B2 DELETE를 누른 뒤 삭제가 진행되는 동안 반복 재생하는 사이렌(`setB2Siren`). 삭제 배틀에서 ARCHI가 꺼지거나 베드엔딩·불러오기로 끝나면 멈춘다. 원본: `ElevenLabs_Heavy_industrial_klaxon_evacuate_alarm,...mp3`.
- `red-eye-break-dragon.mp3`, `red-eye-break-universfield.mp3` — 붉은 눈이 수호 앞에서 깨질 때 둘 중 하나를 무작위로 재생한다(`playRedEyeBreakSound`). dragon은 음량 35%·재생 속도(피치) 1.12배, universfield는 음량 60%로 1초까지만 재생한다. 둘 다 앞 0.15초를 건너뛰고 재생한다. 원본: `dragon-studio-bone-breaking-effect-393836.mp3`, `universfield-bone-break-152222.mp3`.

## 환청 (2026-10-18)

정신력 50% 미만에서 22~42초 간격으로 들리는 위치 기반 합성음이다. 기존 효과음·BGM과 같은 Web Audio 마스터 음량을 따르며, 새 외부 음원이나 의존성은 사용하지 않는다.

- `hallucination-footsteps`: 아무도 없는 곳에서 세 번 나는 불규칙한 발소리.
- `hallucination-knock`: 멀리서 두 번 문을 두드리는 소리.
- `hallucination-whisper`: 잡음과 성도 공명으로 만든, 의미를 알아들을 수 없는 숨 섞인 속삭임. 녹음된 대사는 없다.

직전 종류는 연속 재생하지 않는다. 좌우 180~400px에서 들리는 스테레오 배치를 사용한다. 정신력 회복, 조사·퍼즐·휴대폰·컷씬·층 이동·실제 추격·메뉴·탭 숨김·음소거 중에는 멈춘다. 개발자 이벤트 창의 **환청 재생**으로 확인할 수 있다.

## 경비 로봇 발소리

- `robot-step.mp3` — 경비 로봇의 발이 땅에 닿을 때마다 재생한다(`playRobotStepFile`, `playGameSound('robot-step')`). 걷기·달리기 시트의 0번·4번 컷(앞발 접지)에 맞춰 `guard-patrol.js`가 부른다. 0.8초 이하 간격으로 겹치므로 `<audio>` 세 개를 돌려 쓰고, 바로 옆에서 수호 걷는 발소리(step-tile)의 약 2.4배 크기이고(음량 0.08, 원본이 약 30배 크다) 800px까지 거리에 비례해 작아지며, 재생 속도를 0.94~1.06배로 흔든다. 원본: `giant-mech-footstep-sequence-f6ad84d7.mp3`의 첫 발걸음(0~0.9초)만 잘라 끝 0.14초를 페이드아웃, 모노 128kbps.
