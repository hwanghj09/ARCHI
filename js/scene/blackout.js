// The fixed-step game clock pauses the whole scene in hidden tabs, like the opening.
const blackoutScene = document.getElementById('blackout-scene');
const blackoutCaption = document.getElementById('blackout-caption');
const blackoutCallSheet = document.getElementById('blackout-call-sheet');
const blackoutFlickerTimes = [1500, 1560, 1680, 1720, 1900, 1990, 2070, 2110, 2250, 2300, 2360, 2470, 2530, 2580, 2700, 2780];
let blackoutElapsed = 0;
let blackoutStartX = 0;
let blackoutCallX = 0;
let blackoutBlocked = [];
// 대사가 바뀌는 시각(손 뻗음 1000 · 정전 2900)과 끝(4800)에서 멈추고 클릭하면 이어간다(scene-gate.js).
const blackoutGate = createSceneGate(blackoutScene, [1000, 2900, 4800]);

function startBlackoutScene(door) {
  if (realBuildingBlackout() || blackoutSceneActive) return;
  blackoutSceneActive = true;
  clearEventsForCutscene();
  blackoutElapsed = 0;
  blackoutGate.reset();
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
  blackoutElapsed = blackoutGate.advance(blackoutElapsed, elapsed);
  if (blackoutElapsed >= 4800) return finishBlackoutScene();
  const time = blackoutElapsed;
  const phase = time < 1000 ? 'approach' : time < 2900 ? 'reach' : 'shock';
  if (world.dataset.blackoutScene !== phase) {
    world.dataset.blackoutScene = phase;
    blackoutCaption.textContent = phase === 'approach' ? '엘리베이터만 타면…' :
      phase === 'reach' ? '호출 버튼에 손을 뻗었다.' : '…뭐야?! 불이 왜…';
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dim = phase === 'shock' || (!reducedMotion && blackoutFlickerTimes.filter(at => time >= at).length % 2 === 1);
  const light = dim ? 'off' : 'on';
  if (world.dataset.powerFlicker !== light) {
    world.dataset.powerFlicker = light;
    if (light === 'off' && phase !== 'shock') playGameSound('switch');
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
    sprite.dataset.state = 'blackout-call';
    sprite.dataset.frame = String(frame);
    blackoutCallSheet.style.transform = `translateX(${-frame * 50}%)`;
    if (phase === 'shock') {
      showCutscenePose(time < 3060 ? 'alert' : 'startled');
      x -= 24 * Math.min(1, (time - 2900) / 320);
    }
  }
  Body.setPosition(body, { x, y: floorY - 81 });
  cameraX += (cameraTarget() - cameraX) * .13;
}

function finishBlackoutScene() {
  if (!blackoutSceneActive) return;
  // Skipping or changing scene still commits the one-time outage.
  triggerBuildingBlackout();
  blackoutSceneActive = false;
  blackoutGate.reset();
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
  if (!collectedItems.has('story-blackout-seen')) startStoryScene(BLACKOUT_MONOLOGUE);
}

document.getElementById('blackout-skip').addEventListener('click', finishBlackoutScene);
