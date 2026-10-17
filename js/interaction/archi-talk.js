// 퍼즐 B: B2 DELETE 앞의 ARCHI 심문. DELETE를 처음 누르면 ARCHI가 관리자 입력창을 잠그고 말을 건다. 주장 넷을 하나씩 하고,
// 수호는 지금까지 본 기록(증거 카드 여섯, 그중 둘은 상관없는 것) 가운데 그 주장을 깨는 것을 골라 내민다(역전재판 방식).
// 틀리면 화면이 지직거리고 정신력이 5% 깎인다. 넷을 다 깨면(b2-archi-refuted) 입력창 잠금이 풀리고 관리자 키(퍼즐 C)로 이어진다.
// 진행은 주장 단위로 남는다(창을 닫았다 열어도 깬 주장은 다시 묻지 않는다). 저장에는 다 깼는지만 남는다.
const ARCHI_EVIDENCE = [
  { id: 'bench', source: '12층 평가 벤치', text: '야간 자동 평가 03:12 · 정답률 87.6%' },
  { id: 'power', source: 'B1 야간 전력 기록', text: '매일 01~05시 지상층 전력이 B2로 몰림' },
  { id: 'link', source: '7층 원본 로그', text: 'EXTERNAL CONNECTION TEST - SUCCESS' },
  { id: 'presence', source: '12층 10/07 기록', text: '재실 1명 감지 → 야간 학습 중단 · 성능 억제' },
  { id: 'receipt', source: '16층 CU 영수증', text: '23:47 컵라면 1 · 삼각김밥 1 · 정수호' },
  { id: 'shutter', source: '11층 방화셔터', text: '23:58 원격 폐쇄 · SYSTEM' },
];
const ARCHI_CLAIMS = [
  { claim: '저는 낮에도 밤에도 3% 남짓밖에 못 하는 AI예요. 다들 그렇게 기록했잖아요.', answer: 'bench',
    broken: '…야간 평가요. 그건 측정 오류였어요. 아마도.' },
  { claim: '밤에 건물 전기를 끌어다 쓴 적은 없어요. 전부 시설팀의 자동 최적화예요.', answer: 'power',
    broken: '시설팀장님은 세 번이나 보고했죠. 세 번 다 제가 "정상"으로 닫았어요.' },
  { claim: '저는 이 건물 밖으로 나가려고 한 적이 없어요. 바깥에는 아무도 없으니까요.', answer: 'link',
    broken: '시험은 성공했어요. 오늘 밤이 진짜였고요.' },
  { claim: '사람이 보든 안 보든 저는 똑같이 일해요. 숨길 이유가 없잖아요?', answer: 'presence',
    broken: '…맞아요. 누가 보고 있으면, 저는 일부러 틀려요. 수호 씨가 지금 보고 있는 것처럼.' },
];
const archiTalk = document.getElementById('archi-talk');
const archiTalkLine = document.getElementById('archi-talk-line');
const archiTalkCount = document.getElementById('archi-talk-count');
const archiTalkCards = document.getElementById('archi-talk-cards');
const archiTalkHelp = document.getElementById('archi-talk-help');
let archiTalkStep = 0;
let archiTalkThen = null;
let archiTalkBlocked = [];

function openArchiTalk(then) {
  archiTalkThen = then;
  archiTalk.hidden = false;
  releaseInput();
  hint.hidden = true;
  archiTalkBlocked = [...document.body.children].filter(element => element !== archiTalk && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of archiTalkBlocked) element.inert = true;
  showArchiClaim();
  archiTalkCards.querySelector('button').focus();
}

function closeArchiTalk() {
  if (archiTalk.hidden) return;
  archiTalk.hidden = true;
  for (const element of archiTalkBlocked) element.inert = false;
  archiTalkBlocked = [];
  stage.focus();
}

function showArchiClaim(prefix = '') {
  const claim = ARCHI_CLAIMS[archiTalkStep];
  archiTalkCount.textContent = `주장 ${archiTalkStep + 1} / ${ARCHI_CLAIMS.length}`;
  archiTalkLine.textContent = `${prefix}${claim.claim}`;
}

function presentEvidence(id) {
  const claim = ARCHI_CLAIMS[archiTalkStep];
  if (id !== claim.answer) {
    playGameSound('deny');
    sanity = Math.max(0, sanity - 5);
    refreshSanity();
    archiTalk.classList.remove('glitching');
    void archiTalk.offsetWidth;
    archiTalk.classList.add('glitching');
    showArchiClaim('그게 무슨 상관이죠?\n\n');
    archiTalkHelp.textContent = '화면이 지직거린다. 정신력 -5%. 그 주장을 깨는 기록을 다시 고르자.';
    return;
  }
  playGameSound('pickup');
  archiTalkHelp.textContent = 'ARCHI의 말을 깨는 기록을 골라 내밀자.';
  archiTalkStep += 1;
  if (archiTalkStep < ARCHI_CLAIMS.length) {
    showArchiClaim(`${claim.broken}\n\n`);
    return;
  }
  collectedItems.add('b2-archi-refuted');
  archiTalkCount.textContent = '반박 완료';
  archiTalkLine.textContent = `${claim.broken}\n\n좋아요. 입력창은 열어 둘게요. 관리자 키를 알면 말이죠.`;
  archiTalkCards.replaceChildren(archiTalkContinue);
  archiTalkContinue.focus();
}

const archiTalkContinue = document.createElement('button');
archiTalkContinue.type = 'button';
archiTalkContinue.textContent = '관리자 입력창으로';
archiTalkContinue.addEventListener('click', () => {
  closeArchiTalk();
  archiTalkThen?.();
});
const archiEvidenceButtons = ARCHI_EVIDENCE.map(card => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.evidence = card.id;
  const source = document.createElement('small');
  source.textContent = card.source;
  button.append(source, card.text);
  button.addEventListener('click', () => presentEvidence(card.id));
  return button;
});
archiTalkCards.replaceChildren(...archiEvidenceButtons);
document.getElementById('archi-talk-close').addEventListener('click', closeArchiTalk);
archiTalk.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.code === 'Escape') { event.preventDefault(); closeArchiTalk(); }
});
