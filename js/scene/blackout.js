// The fixed-step game clock pauses the whole scene in hidden tabs, like the opening.
const blackoutScene = document.getElementById('blackout-scene');
const blackoutCaption = document.getElementById('blackout-caption');
const blackoutCallSheet = document.getElementById('blackout-call-sheet');
let blackoutElapsed = 0;
let blackoutStartX = 0;
let blackoutCallX = 0;
let blackoutBlocked = [];

function startBlackoutScene(door) {
  if (buildingBlackout || blackoutSceneActive) return;
  blackoutSceneActive = true;
  blackoutElapsed = 0;
  blackoutStartX = body.position.x;
  blackoutCallX = door.x + door.width - 18;
  blackoutScene.hidden = false;
  blackoutBlocked = [...document.body.children].filter(el => el !== blackoutScene && el.tagName !== 'SCRIPT' && !el.inert);
  for (const el of blackoutBlocked) el.inert = true;
  releaseInput();
  Body.setVelocity(body, { x: 0, y: 0 });
  sprite.dataset.phoneHeld = 'false';
  hint.hidden = interactionOutline.hidden = true;
  document.getElementById('blackout-skip').focus({ preventScroll: true });
  // Warm the unlit art before the first dip, without replacing the visible lit images.
  for (const img of world.querySelectorAll('img[data-unlit-src]')) {
    const preload = new Image(); preload.src = img.dataset.unlitSrc;
  }
  updateBlackoutScene(0);
}

function updateBlackoutScene(elapsed) {
  blackoutElapsed += elapsed;
  if (blackoutElapsed >= 4800) return finishBlackoutScene();
  const time = blackoutElapsed;
  const phase = time < 1000 ? 'approach' : time < 2900 ? 'reach' : 'shock';
  if (world.dataset.blackoutScene !== phase) {
    world.dataset.blackoutScene = phase;
    blackoutCaption.textContent = phase === 'approach' ? '엘리베이터만 타면…' :
      phase === 'reach' ? '호출 버튼에 손을 뻗었다.' : '…뭐야?! 불이 왜…';
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dim = !reducedMotion && ((time >= 1500 && time < 1780) || (time >= 2250 && time < 2560));
  const light = dim ? 'off' : 'on';
  if (world.dataset.powerFlicker !== light) {
    world.dataset.powerFlicker = light;
    if (light === 'off') playGameSound('switch');
    refreshBackgroundPower();
  }
  if (phase === 'shock') triggerBuildingBlackout();
  let x = blackoutCallX;
  if (phase === 'approach') {
    x = blackoutStartX + (blackoutCallX - blackoutStartX) * time / 1000;
    facing = blackoutCallX >= blackoutStartX ? 1 : -1;
    const frame = Math.floor(Math.abs(x - blackoutStartX) / frameDistance) % walkFrames;
    sprite.dataset.state = 'walk'; sprite.dataset.frame = String(frame);
    walkSheet.style.transform = `translateX(${-frame * 100 / walkFrames}%)`;
  } else {
    facing = 1;
    const frame = time < 1300 ? 0 : 1;
    sprite.dataset.state = phase === 'reach' ? 'blackout-call' : 'startled';
    sprite.dataset.frame = phase === 'reach' ? String(frame) : '0';
    blackoutCallSheet.style.transform = `translateX(${-frame * 50}%)`;
    caughtSheet.style.transform = 'translateX(0)';
    if (phase === 'shock') x -= 24 * Math.min(1, (time - 2900) / 320);
  }
  Body.setPosition(body, { x, y: floorY - 81 });
  cameraX += (cameraTarget() - cameraX) * .13;
}

function finishBlackoutScene() {
  if (!blackoutSceneActive) return;
  // Skipping or changing scene still commits the one-time outage.
  triggerBuildingBlackout();
  blackoutSceneActive = false;
  blackoutScene.hidden = true;
  delete world.dataset.blackoutScene;
  delete world.dataset.powerFlicker;
  refreshBackgroundPower();
  for (const el of blackoutBlocked) el.inert = false;
  blackoutBlocked = [];
  Body.setVelocity(body, { x: 0, y: 0 });
  grounded = true;
  releaseInput();
  updateInteraction();
  stage.focus({ preventScroll: true });
  showStatus('건물 전체의 불이 꺼졌다. 휴대폰(P)의 플래시로 앞을 비춰 보자.', 6000);
}

document.getElementById('blackout-skip').addEventListener('click', finishBlackoutScene);
