// 퍼즐 H: 3층 Studio(방송실) 음성 인증 문. 2층 Harmony Hall 영사기가 돌면(f2-projected) 스크린의 무관객 리허설에서 같은 문장
// "안녕하세요, 저는 ___입니다."가 사람을 바꿔 이어진다. 음향 콘솔 출력 단자에 휴대폰을 대고 한 사람의 구간을 녹음한다(floor-02.js).
// Studio 문은 사내 방송 담당자 목소리만 받는다. 누가 방송 담당인지는 객석 의자 위 리플릿에 있다(김도윤).
// 틀린 목소리를 틀면 인증 실패 뒤 스피커가 수호의 목소리로 대답한다(서브엔딩 복선). 녹음은 한 번에 하나(voice=이름)만 남는다.
const VOICE_NAMES = ['한정우', '김도윤', '이수민', '정수호'];

function recordedVoice() {
  return VOICE_NAMES.find(name => collectedItems.has(`voice=${name}`)) || null;
}

function recordVoice(choice) {
  const name = VOICE_NAMES[choice];
  for (const other of VOICE_NAMES) collectedItems.delete(`voice=${other}`);
  collectedItems.add(`voice=${name}`);
  playGameSound('pickup');
  const index = collectedClues.findIndex(clue => clue.name === '휴대폰 녹음');
  if (index >= 0) collectedClues.splice(index, 1);
  collectedClues.push({ place: document.querySelector('header span').textContent, name: '휴대폰 녹음', text: `리허설 녹화의 ${name} 구간: "안녕하세요, 저는 ${name}입니다."` });
  renderClues();
  showStatus(`휴대폰에 ${name}의 목소리 구간을 녹음했다: "안녕하세요, 저는 ${name}입니다."`, 4000);
}

function tryVoiceLock(door) {
  const voice = recordedVoice();
  if (!voice) {
    openInspection(door.name, door.message);
    return;
  }
  if (voice === door.voiceLock.voice) {
    collectedItems.add(door.unlockedBy);
    door.locked = false;
    door.element.setAttribute('aria-label', `${door.name} 출입문`);
    playGameSound('item-use');
    showStatus(`휴대폰을 스피커 그릴에 대고 재생했다. "안녕하세요, 저는 ${voice}입니다." 잠시 뒤: "인증되었습니다, ${voice} 님." 문이 열린다.`, 5000);
    return;
  }
  playGameSound('deny');
  sanity = Math.max(0, sanity - 5);
  refreshSanity();
  openInspection(door.name, voice === '정수호' ?
    '내 목소리를 틀었다. 인증 실패. 그런데 스피커가 바로 대답한다. 똑같은 목소리로: "그 목소리는 이미 제가 갖고 있어요, 수호 씨."' :
    `${voice}의 목소리를 틀었다. "인증 실패 · 등록되지 않은 음성." 잠시 뒤 스피커에서 내 목소리가 흘러나온다: "안녕하세요, 저는 정수호입니다."`);
}
