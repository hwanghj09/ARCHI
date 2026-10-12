# 오디오 파일

환각 효과음은 합성음이 아닌 mp3 파일이다(js/audio/audio.js). 라이선스는 내려받은 출처 페이지에서 확인한다.

- `hallucination-jumpscare.mp3` — 환각 추격(0% 돌진) 시작 때 재생한다. 원본: `freesound_community-jumpscare-94984.mp3`.
- `hallucination-sighting-1~3.mp3` — 추격이 아닌 환각(예고·멀리 보이는 환각)이 나타날 때 이 중 하나를 무작위로 재생한다.
  직전에 들려준 소리는 건너뛰므로 같은 소리가 연달아 나오지 않는다. 원본: `soumages-jumpscare-335598.mp3`(1),
  `soumages-jumpscare-v2-335599.mp3`(2), `soumages-jumpscare-v3-335600.mp3`(3).
- `hallucination-devoured.mp3` — 환각에게 삼켜져 쓰러질 때 재생한다(`playHallucinationDevouredSound`). 원본: `five-nights-at-freddys-3-springtraps-jumpscare-brightened.mp3`.
- `b2-door-pry.mp3` — B2 엘리베이터에서 경비 로봇이 문을 억지로 열기 시작할 때 재생한다(`playDoorPrySound`). 원본: `sound_effects75-robotic_jumpscare-485532.mp3`.
- `b2-siren.mp3` — B2 DELETE를 누른 뒤 삭제가 진행되는 동안 반복 재생하는 사이렌(`setB2Siren`). 1층 전력을 끊어 ARCHI가 꺼지거나 베드엔딩·불러오기로 끝나면 멈춘다. 원본: `ElevenLabs_Heavy_industrial_klaxon_evacuate_alarm,...mp3`.
