// 도어락 키패드: 번호를 맞히면 잠긴 문이 열리거나 소품의 gives를 챙긴다.
let keypadTarget = null;
const keypad = document.getElementById('keypad');
const keypadInput = document.getElementById('keypad-input');
const keypadError = document.getElementById('keypad-error');

function openKeypad(target) {
  keypadTarget = target;
  usingKeypad = true;
  releaseInput();
  hint.hidden = true;
  document.getElementById('keypad-title').textContent = target.name;
  document.getElementById('keypad-text').textContent = target.type === 'room' ? target.message : target.codePrompt;
  keypadInput.value = '';
  keypadInput.maxLength = String(target.code).length;
  keypadError.textContent = '';
  keypad.hidden = false;
  stage.inert = true;
  keypadInput.focus({ preventScroll: true });
}

function closeKeypad() {
  if (!usingKeypad) return;
  const returnToPower = keypadTarget?.type === 'power';
  usingKeypad = false;
  keypadTarget = null;
  keypad.hidden = true;
  stage.inert = false;
  stage.focus({ preventScroll: true });
  updateInteraction();
  if (returnToPower) openPowerPanel();
}

function submitKeypad() {
  const target = keypadTarget;
  if (!target) return;
  if (keypadInput.value.trim().toLowerCase() !== String(target.code).toLowerCase()) {
    keypadError.textContent = '비밀번호가 맞지 않는다.';
    playGameSound('deny');
    keypadInput.select();
    return;
  }
  if (target.type !== 'power') playGameSound(INVENTORY_ITEMS[target.gives] ? 'item-get' : 'item-use');
  if (target.type === 'power') {
    // 이 키패드는 전선이 안 고쳐졌을 때만 열린다(power.js의 레버 클릭 참고) — 비밀번호는 맞았지만 레버를
    // 당기자마자 과부하로 전선이 끊어져, 첫 성공 때만 전선 퍼즐을 풀어야 실제로 켜진다. keypadTarget을 먼저
    // 비워서 closeKeypad()가 전력 패널로 돌아가지 않게 한다 — 전력 패널이 전선 패널 밑에 열린 채로 남아
    // 있으면(둘 다 '열린 모달'로 겹침) 이 게임의 입력 라우팅이 한 번에 모달 하나만 가정하고 있어서 전선
    // 패널 쪽 클릭·드래그가 안 먹는다. 전선 패널을 닫을 때(closeWirePanel) 전력 패널로 돌아간다.
    keypadTarget = null;
    closeKeypad();
    showStatus('비밀번호는 맞았다. 그런데 레버를 당기자마자 과부하로 제어반 안의 전선 다발이 끊어져 나간다.', 4200);
    openWirePanel(() => {
      collectedItems.add('roof-wires-fixed');
      setSolarPower(true);
      showStatus('전선을 다시 연결했다. 태양광 비상 전력이 켜진다.', 4200);
    });
  } else if (target.type === 'room') {
    closeKeypad();
    unlockRoomDoor(target);
    showStatus(target.codeMessage || '도어락이 열렸다.', 5000);
  } else {
    if (target.gives) collectedItems.add(target.gives);
    closeKeypad();
    // 열린 소품의 내용은 조사 창으로 보인다(1층 경비 로봇 정비 패널은 writing이 있으면 그 화면으로).
    openInspection(target.name, target.message, target);
  }
}

// 맞는 번호를 누르거나 카드키를 대면(manual-control.js) 그 자리에서 문이 열린다. 다음에 층을 그릴 때는 unlockedBy를 챙긴 것으로 열린 채 그린다.
function unlockRoomDoor(door) {
  collectedItems.add(door.unlockedBy);
  door.locked = false;
  door.element.dataset.unlocked = 'true';
  door.element.setAttribute('aria-label', `${door.name} 출입문`);
}

// 키패드 안의 입력은 플레이어 조작으로 넘기지 않는다. Enter는 폼 제출, Esc는 닫기.
keypad.addEventListener('submit', event => {
  event.preventDefault();
  submitKeypad();
});
keypad.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.code === 'Escape') {
    event.preventDefault();
    closeKeypad();
  }
});
document.getElementById('keypad-cancel').addEventListener('click', closeKeypad);
