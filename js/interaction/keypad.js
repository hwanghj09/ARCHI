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
  usingKeypad = false;
  keypadTarget = null;
  keypad.hidden = true;
  stage.inert = false;
  stage.focus({ preventScroll: true });
  updateInteraction();
}

function submitKeypad() {
  const target = keypadTarget;
  if (!target) return;
  if (keypadInput.value.trim().toLowerCase() !== String(target.code).toLowerCase()) {
    keypadError.textContent = '비밀번호가 맞지 않는다.';
    keypadInput.select();
    return;
  }
  if (target.type === 'room') {
    // 맞는 번호를 누르면 그 자리에서 문이 열린다. 다음에 층을 그릴 때는 unlockedBy를 챙긴 것으로 열린 채 그린다.
    collectedItems.add(target.unlockedBy);
    target.locked = false;
    target.element.setAttribute('aria-label', `${target.name} 출입문`);
    closeKeypad();
    showStatus(target.codeMessage || '도어락이 열렸다.', 5000);
  } else {
    if (target.gives) collectedItems.add(target.gives);
    closeKeypad();
    showStatus(target.message, 5000);
  }
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
