// One opening per page load; the normal fixed-step clock also pauses it in hidden tabs.
const opening = document.getElementById('opening');
const openingSheet = document.getElementById('opening-sheet');
const openingCaption = document.getElementById('opening-caption');
let openingElapsed = 0;
let openingReady = false;
let openingBlocked = [];

function startOpening() {
  openingBlocked = [...document.body.children].filter(el => el !== opening && el.tagName !== 'SCRIPT' && !el.inert);
  for (const el of openingBlocked) el.inert = true;
  releaseInput();
  Body.setPosition(body, { x: 590, y: floorY - 107 });
  Body.setVelocity(body, { x: 0, y: 0 });
  facing = 1;
  sprite.dataset.state = 'opening';
  sprite.dataset.frame = '0';
  hint.hidden = true;
  document.getElementById('opening-skip').focus({ preventScroll: true });
  Promise.all([openingSheet.decode(), officeBackground.decode()]).then(() => {
    if (!openingActive) return;
    openingReady = true;
    world.dataset.opening = 'work';
    openingCaption.textContent = '오늘 일은 여기까지.';
    setOfficeComputerPower('on');
  }).catch(() => finishOpening());
}

function updateOpening(elapsed) {
  if (!openingReady) return;
  openingElapsed += elapsed;
  if (openingElapsed >= 5400) return finishOpening();
  const frame = openingElapsed < 1400 ? 0 : openingElapsed < 2300 ? 1 :
    openingElapsed < 3100 ? 2 : openingElapsed < 3450 ? 3 : openingElapsed < 3800 ? 4 : 5;
  sprite.dataset.frame = String(frame);
  openingSheet.style.transform = `translateX(${-frame * 100 / 6}%)`;
  const phase = frame === 0 ? 'work' : frame === 1 ? 'shutdown' : frame === 2 ? 'off' : frame === 3 ? 'turn' : frame === 4 ? 'rising' : 'standing';
  if (world.dataset.opening !== phase) {
    world.dataset.opening = phase;
    if (phase === 'shutdown') {
      setOfficeComputerPower('shutting-down');
      openingCaption.textContent = '작업을 저장하고 컴퓨터를 종료했다.';
    }
    if (phase === 'off') setOfficeComputerPower('off');
    if (phase === 'standing') openingCaption.textContent = '늦었네. 이제 퇴근하자.';
  }
  // Step away from the background chair into the gameplay floor plane while rising.
  const rise = Math.max(0, Math.min(1, (openingElapsed - 3450) / 650));
  Body.setPosition(body, { x: 590 + 66 * rise, y: floorY - 107 + 26 * rise });
  cameraX += (cameraTarget() - cameraX) * .13;
}

function finishOpening() {
  if (mainMenuActive || !openingActive) return;
  openingActive = false;
  delete world.dataset.opening;
  opening.hidden = true;
  for (const el of openingBlocked) el.inert = false;
  setOfficeComputerPower('off');
  Body.setPosition(body, { x: 656, y: floorY - 81 });
  Body.setVelocity(body, { x: 0, y: 0 });
  grounded = true;
  releaseInput();
  cameraX = cameraTarget();
  updateInteraction();
  render();
  stage.focus({ preventScroll: true });
  showStatus('퇴근할 시간이다. 복도로 나가자.', 3000);
}

document.getElementById('opening-skip').addEventListener('click', finishOpening);
