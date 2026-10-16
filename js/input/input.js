// 키보드 입력 상태와 입력 해제.
const buttons = [...document.querySelectorAll('nav button')];
const keys = new Set();
const movementKeys = { KeyA: -1, ArrowLeft: -1, KeyD: 1, ArrowRight: 1 };
const jumpKeys = new Set(['Space', 'KeyW', 'ArrowUp']);
const runKeys = new Set(['ShiftLeft', 'ShiftRight']);

function releaseInput() {
  keys.clear();
  buttons.forEach(button => button.classList.remove('active'));
  jumpQueued = false;
  previousTime = null;
  interactionTime = 0;
  accumulator = 0;
  animate(0);
}

window.addEventListener('blur', releaseInput);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) releaseInput();
});
