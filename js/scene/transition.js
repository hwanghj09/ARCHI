// 장면 전환: 검은 화면으로 페이드아웃한 뒤 장면을 바꾸고 다시 페이드인한다.
const roomTransition = document.getElementById('room-transition');
let sceneTransition = null;
// 장면을 바꾼 뒤 화면에 보이는 그림(img·배경 그림)이 모두 불러와질 때까지 검은 화면에 로딩 바를 띄우고 기다린다.
// 늦게 뜨는 스프라이트가 하나씩 튀어나오지 않게 한다. 오래 걸리거나 실패한 그림은 sceneLoadTimeoutMs 뒤 건너뛴다.
const sceneLoadTimeoutMs = 10000;
const sceneLoadBarDelayMs = 150; // 이미 받아 둔 그림만 있으면 바를 띄우지 않는다
const roomLoading = document.createElement('div');
roomLoading.className = 'room-loading';
roomLoading.innerHTML = '<span class="room-loading-label">불러오는 중</span><span class="room-loading-track"><span class="room-loading-fill"></span></span>';
roomTransition.append(roomLoading);
const sceneImageCache = new Map();

function sceneImages() {
  const urls = new Set();
  for (const element of document.body.querySelectorAll('*')) {
    if (element === roomTransition || roomTransition.contains(element) || !element.getClientRects().length) continue;
    if (element.tagName === 'IMG' && element.currentSrc) urls.add(element.currentSrc);
    const background = getComputedStyle(element).backgroundImage;
    if (background !== 'none') for (const [, url] of background.matchAll(/url\("?([^")]+)"?\)/g)) urls.add(url);
  }
  return [...urls].map(url => {
    if (!sceneImageCache.has(url)) {
      const image = new Image();
      image.onerror = () => { image.failed = true; };
      image.src = url;
      sceneImageCache.set(url, image);
    }
    return sceneImageCache.get(url);
  });
}

function refreshSceneLoading(transition) {
  const done = transition.images.filter(image => image.complete || image.failed).length;
  roomLoading.style.setProperty('--progress', String(transition.images.length ? done / transition.images.length : 1));
  roomLoading.classList.toggle('visible', transition.elapsed >= sceneLoadBarDelayMs);
  return done === transition.images.length || transition.elapsed >= sceneLoadTimeoutMs;
}

function changeRoom(onChange = performRoomChange) {
  if (transitioning) return;
  if (onChange === performRoomChange && room === 'corridor' && (!officeBackground.complete || !officeBackground.naturalWidth)) {
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
    transition.images = sceneImages();
    roomTransition.dataset.phase = 'loading';
    return;
  }
  transition.elapsed += step;
  if (roomTransition.dataset.phase === 'loading') {
    if (!refreshSceneLoading(transition)) return;
    roomLoading.classList.remove('visible');
    transition.elapsed = 0;
    roomTransition.dataset.phase = 'in';
    return;
  }
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
  if (!selectingFloor && !usingComputer) resumeHeldKeys();
}
