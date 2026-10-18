// 키보드 입력 상태와 입력 해제.
const buttons = [...document.querySelectorAll('nav button')];
const keys = new Set();
const keyBindingActions = {
  left: '왼쪽 이동', right: '오른쪽 이동', run: '달리기 (누른 채)', crouch: '웅크리기 (누른 채)',
  jump: '점프', interact: '상호작용 · 물건 조사', phone: '휴대폰', light: '플래시', inventory: '가방'
};
const defaultKeyBindings = {
  left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], run: ['ShiftLeft', 'ShiftRight'],
  crouch: ['ControlLeft', 'ControlRight'], jump: ['Space', 'KeyW', 'ArrowUp'],
  interact: ['KeyE'], phone: ['KeyP'], light: ['KeyF'], inventory: ['Tab']
};
let keyBindings;
let movementKeys;
const jumpKeys = new Set(), runKeys = new Set(), crouchKeys = new Set();

function isBindableKey(code) {
  return /^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|Numpad(Add|Subtract|Multiply|Divide|Decimal)|Arrow(Left|Right|Up|Down)|Shift(Left|Right)|Control(Left|Right)|Space|Tab|Backspace|Delete|Insert|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash|Backquote)$/.test(code);
}

function validKeyBindings(bindings) {
  if (!bindings || typeof bindings !== 'object') return false;
  const used = new Set();
  return Object.keys(defaultKeyBindings).every(action => Array.isArray(bindings[action]) &&
    bindings[action].length > 0 && bindings[action].length <= 3 && bindings[action].every(code => {
      if (typeof code !== 'string' || !isBindableKey(code) || code === 'Tab' && action !== 'inventory' || used.has(code)) return false;
      used.add(code);
      return true;
    }));
}

function applyKeyBindings(bindings) {
  keyBindings = Object.fromEntries(Object.keys(defaultKeyBindings).map(action => [action, [...bindings[action]]]));
  movementKeys = Object.fromEntries([...keyBindings.left.map(code => [code, -1]), ...keyBindings.right.map(code => [code, 1])]);
  for (const [set, action] of [[jumpKeys, 'jump'], [runKeys, 'run'], [crouchKeys, 'crouch']]) {
    set.clear();
    keyBindings[action].forEach(code => set.add(code));
  }
}

function keyMatches(action, code) { return keyBindings[action].includes(code); }

function keyLabel(code) {
  const labels = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
    ShiftLeft: 'Shift', ShiftRight: '오른쪽 Shift', ControlLeft: 'Ctrl', ControlRight: '오른쪽 Ctrl',
    Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\',
    Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Backquote: '`' };
  return labels[code] || code.replace(/^(Key|Digit)/, '').replace('Numpad', 'Num ');
}

function bindingLabel(action) { return keyBindings[action].map(keyLabel).join(' / '); }

applyKeyBindings(defaultKeyBindings);
try {
  const saved = JSON.parse(localStorage.getItem('archi.keybindings'));
  if (validKeyBindings(saved)) applyKeyBindings(saved);
} catch { /* 저장소가 막히거나 데이터가 손상되면 기본 조작키로 시작한다. */ }

function releaseInput() {
  keys.clear();
  setCrouching(false);
  buttons.forEach(button => button.classList.remove('active'));
  jumpQueued = false;
  previousTime = null;
  interactionTime = 0;
  accumulator = 0;
  animate(0);
}

// 지금 손가락이 누르고 있는 키. 장면 전환은 입력을 비우고 그동안의 keydown도 버리므로(키 반복은 다른 키를 누르면 끊긴다),
// 전환이 끝나면 아직 누르고 있는 이동·달리기·웅크리기 키를 다시 이어 준다(transition.js).
const heldKeys = new Set();
window.addEventListener('keydown', event => heldKeys.add(event.code), true);
window.addEventListener('keyup', event => heldKeys.delete(event.code), true);
function resumeHeldKeys() {
  for (const code of heldKeys) if (Object.hasOwn(movementKeys, code) || runKeys.has(code) || crouchKeys.has(code)) keys.add(code);
}

window.addEventListener('blur', () => { heldKeys.clear(); releaseInput(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) releaseInput();
});
