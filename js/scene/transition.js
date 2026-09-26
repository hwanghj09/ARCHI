// 장면 전환: 검은 화면으로 페이드아웃한 뒤 장면을 바꾸고 다시 페이드인한다.
const roomTransition = document.getElementById('room-transition');
let sceneTransition = null;

function changeRoom(onChange = performRoomChange) {
  if (transitioning) return;
  if (onChange === performRoomChange && room === 'corridor' && (!officeBackground.complete || !officeBackground.naturalWidth)) {
    showStatus('사무실 배경을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    return;
  }
  transitionScene(onChange);
}

function transitionScene(onChange) {
  if (transitioning) return;
  sceneTransition = { onChange, elapsed: 0, focus: document.activeElement };
  transitioning = true;
  releaseInput();
  stage.inert = true;
  cabin.inert = true;
  computer.inert = true;
  roomTransition.dataset.phase = 'out';
  roomTransition.style.opacity = '0';
  roomTransition.classList.add('visible');
}

function updateSceneTransition() {
  const transition = sceneTransition;
  // Keep a fully black frame between scenes; use the same clock as gameplay.
  if (roomTransition.dataset.phase === 'black') {
    transition.onChange();
    stage.inert = true;
    cabin.inert = true;
    computer.inert = true;
    transition.elapsed = 0;
    roomTransition.dataset.phase = 'in';
    return;
  }
  transition.elapsed += step;
  const amount = Math.min(1, transition.elapsed / 350);
  const fadingOut = roomTransition.dataset.phase === 'out';
  roomTransition.style.opacity = String(fadingOut ? amount : 1 - amount);
  if (amount < 1) return;
  if (fadingOut) {
    roomTransition.dataset.phase = 'black';
    return;
  }
  transitioning = false;
  sceneTransition = null;
  roomTransition.dataset.phase = 'idle';
  roomTransition.classList.remove('visible');
  stage.inert = selectingFloor || usingComputer;
  cabin.inert = false;
  computer.inert = false;
  const previousFocus = computer.contains(transition.focus) ? computerReturnFocus :
    cabin.contains(transition.focus) ? cabinReturnFocus : transition.focus;
  const focus = usingComputer ? computer.querySelector('button') : selectingFloor ? cabin :
    previousFocus?.isConnected && previousFocus !== document.body ? previousFocus : stage;
  focus.focus({ preventScroll: true });
}
