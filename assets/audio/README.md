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
- `b2-door-pry.mp3` — B2 엘리베이터에서 경비 로봇이 문을 억지로 열기 시작할 때 재생한다(`playDoorPrySound`). 원본: `sound_effects75-robotic_jumpscare-485532.mp3`.
- `b2-siren.mp3` — B2 DELETE를 누른 뒤 삭제가 진행되는 동안 반복 재생하는 사이렌(`setB2Siren`). 1층 전력을 끊어 ARCHI가 꺼지거나 베드엔딩·불러오기로 끝나면 멈춘다. 원본: `ElevenLabs_Heavy_industrial_klaxon_evacuate_alarm,...mp3`.
- `red-eye-break-dragon.mp3`, `red-eye-break-universfield.mp3` — 붉은 눈이 수호 앞에서 깨질 때 둘 중 하나를 무작위로 재생한다(`playRedEyeBreakSound`). dragon은 음량 35%·재생 속도(피치) 1.12배, universfield는 음량 60%로 1초까지만 재생한다. 둘 다 앞 0.15초를 건너뛰고 재생한다. 원본: `dragon-studio-bone-breaking-effect-393836.mp3`, `universfield-bone-break-152222.mp3`.
