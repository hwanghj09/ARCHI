// 입력 상태(누른 키, 화면 버튼 포인터)와 입력 해제.
const buttons = [...document.querySelectorAll('nav button')];
const keys = new Set();
const pointers = new Map();
const movementKeys = { KeyA: -1, ArrowLeft: -1, KeyD: 1, ArrowRight: 1 };
const jumpKeys = new Set(['Space', 'KeyW', 'ArrowUp']);
const runKeys = new Set(['ShiftLeft', 'ShiftRight']);

let pulseDirection = 0;
let pulseTime = 0;

function releaseInput() {
  keys.clear();
  pointers.clear();
  buttons.forEach(button => button.classList.remove('active'));
  jumpQueued = false;
  pulseTime = 0;
  previousTime = null;
  interactionTime = 0;
  accumulator = 0;
  animate(0);
}

window.addEventListener('blur', releaseInput);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) releaseInput();
});
