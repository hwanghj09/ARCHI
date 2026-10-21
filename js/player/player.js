// 플레이어 스프라이트: 움직임 상태와 대기·걷기·달리기·점프·조사 애니메이션.
const idleSheet = document.getElementById('idle-sprite');
const walkSheet = document.getElementById('walk-sheet');
const runSheet = document.getElementById('run-sheet');
const crouchSheet = document.getElementById('crouch-sheet');
const jumpSheet = document.getElementById('jump-sheet');
const interactSheet = document.getElementById('interact-sheet');
const phoneSheet = document.getElementById('phone-sheet');
const phoneLightSheet = document.getElementById('phone-light-sheet');
const phoneAwaySheet = document.getElementById('phone-away-sheet');
const phoneWalkSheet = document.getElementById('phone-walk-sheet');
const phoneRunSheet = document.getElementById('phone-run-sheet');
const caughtSheet = document.getElementById('caught-sheet');
const cutsceneSheet = document.getElementById('cutscene-sheet');
const cutscenePoses = { alert: 0, startled: 1, 'look-up': 2, 'look-back': 3, pant: 4,
  think: 6, anxious: 7, relieved: 8, badge: 9 };

function showCutscenePose(pose, elapsed = 0) {
  if (cutsceneSheet.naturalWidth !== 2560 || cutsceneSheet.naturalHeight !== 256 || !(pose in cutscenePoses)) return false;
  const frame = cutscenePoses[pose] + (pose === 'pant' ? Math.floor(elapsed / 480) % 2 : 0);
  sprite.dataset.state = 'cutscene';
  sprite.dataset.cutscenePose = pose;
  sprite.dataset.frame = String(frame);
  sprite.dataset.phoneHeld = 'false';
  cutsceneSheet.style.transform = `translateX(${-frame * 10}%)`;
  return true;
}
const antianxietySheet = document.getElementById('antianxiety-sheet');
const itemUseFrameDurations = [220, 220, 200, 280, 300, 280];
const itemUseDuration = itemUseFrameDurations.reduce((total, duration) => total + duration, 0);
let itemUseTime = 0;
let photoCaptureTime = 0;
const photoCaptureDuration = 1260;

function startItemUseAnimation() {
  if (antianxietySheet.naturalWidth !== 1536 || antianxietySheet.naturalHeight !== 256) {
    return false;
  }
  releaseInput();
  phoneAwayTime = 0;
  itemUseTime = itemUseDuration;
  world.dataset.flashlight = 'off';
  Body.setVelocity(body, { x: 0, y: body.velocity.y });
  animate(0);
  return true;
}

let phoneTime = 0;
let phoneAwayTime = 0;
let phoneRaising = false; // 플래시를 켜기 전 0.5초 동안 휴대폰을 드는 모션(phone.js가 켠다)

let walkDistance = 0;
let runDistance = 0;
let idleTime = 0;
let walkReady = false;
let facing = 1;
let grounded = false;
let jumpQueued = false;
let interactionTime = 0;
let playerPushing = false; // 이번 걸음에 상자를 밀고 있는가(pushables.js의 pushPushables가 정한다)
let pushTime = 0;
const pushSheet = document.getElementById('push-sheet');
const pushFrames = 6;
const pushFrameMs = 130; // assets/player/jeong-suho-push-box.json
let crouching = false;
let crouchDistance = 0;

function setCrouching(value, force = false) {
  if (value === crouching) return;
  if (value && (crouchSheet.naturalWidth !== 1024 || crouchSheet.naturalHeight !== 256)) return;
  const oldHeight = crouching ? 96 : 162;
  const height = value ? 96 : 162;
  if (!value && !force) {
    // Keep the feet planted and wait for headroom before standing up.
    const ceiling = { min: { x: body.bounds.min.x + .5, y: body.bounds.max.y - height },
      max: { x: body.bounds.max.x - .5, y: body.bounds.min.y - .5 } };
    if (Matter.Query.region(Composite.allBodies(engine.world).filter(part => part !== body && !part.isSensor), ceiling).length) return;
  }
  Body.scale(body, 1, height / oldHeight);
  Body.setInertia(body, Infinity);
  Body.setPosition(body, { x: body.position.x, y: body.position.y + (oldHeight - height) / 2 });
  crouching = value;
}

function checkWalkSheet() {
  walkReady = walkSheet.naturalWidth === 256 * walkFrames && walkSheet.naturalHeight === 256;
}
walkSheet.addEventListener('load', checkWalkSheet);
checkWalkSheet();

// The original 2x2 sheet has uneven cells: align each hip and sole at the walking scale.
// The opening reuses this for its final standing pose.
function showIdleFrame(index) {
  const hip = [325, 925, 325, 925][index];
  const sole = [619, 619, 1234, 1235][index];
  idleSheet.style.transform = `translate(${96 - hip * .285}px, ${178 - sole * .285}px)`;
  idleSheet.style.clipPath = `inset(${index < 2 ? 0 : 50}% ${index % 2 ? 0 : 50}% ${index < 2 ? 50 : 0}% ${index % 2 ? 50 : 0}%)`;
}

function animate(distance, sprinting = false, elapsed = 0) {
  if (openingActive || blackoutSceneActive) return;
  delete sprite.dataset.cutscenePose;
  if ((playerCaught || hallucinationCaught) && itemUseTime > 0) {
    itemUseTime = 0;
    refreshPhone();
  }
  if (playerCaught) {
    const { captureTime } = caughtBy ?? guardPatrol;
    const frame = captureTime < 640 ? 0 : 1 + Math.floor((captureTime - 640) / 240) % 3;
    sprite.dataset.state = 'caught'; sprite.dataset.frame = frame;
    caughtSheet.style.transform = `translateX(${-frame * 25}%)`;
    return;
  }
  if (photoCaptureTime > 0 && !hallucinationCaught) {
    const away = photoCaptureTime <= 360;
    const index = away ? Number(photoCaptureTime <= 180) : Math.min(3, Math.floor((photoCaptureDuration - photoCaptureTime) / 180));
    sprite.dataset.state = away ? 'photo-away' : 'photo';
    sprite.dataset.frame = index;
    sprite.dataset.phoneHeld = 'true';
    (away ? phoneAwaySheet : phoneSheet).style.transform = `translateX(${-index * (away ? 50 : 25)}%)`;
    return;
  }
  if (itemUseTime > 0) {
    itemUseTime = Math.max(0, itemUseTime - elapsed);
    if (itemUseTime > 0) {
      let time = itemUseDuration - itemUseTime;
      let index = 0;
      while (index < itemUseFrameDurations.length - 1 && time >= itemUseFrameDurations[index]) {
        time -= itemUseFrameDurations[index++];
      }
      sprite.dataset.state = 'consume';
      sprite.dataset.frame = index;
      sprite.dataset.phoneHeld = 'false';
      antianxietySheet.style.transform = `translateX(${-index * 100 / 6}%)`;
      return;
    }
    idleTime = 0;
    refreshPhone();
  }
  const pushing = !crouching && grounded && playerPushing && distance > .1 && pushSheet.naturalWidth === 256 * pushFrames; // 상자를 미는 동안은 밀기 모션
  const running = !crouching && grounded && sprinting && !pushing && distance > .1 && runSheet.naturalWidth === 256 * runFrames && runSheet.naturalHeight === 256;
  const walking = grounded && walkReady && distance > .1 && !running && !pushing;
  const holdingPhone = usingPhone || phoneLightOn;
  walkDistance = walking ? (walkDistance + distance) % (frameDistance * walkFrames) : 0;
  runDistance = running ? (runDistance + distance) % (runFrameDistance * runFrames) : 0;
  if (distance > .1 || !grounded) phoneAwayTime = 0;
  else phoneAwayTime = Math.max(0, phoneAwayTime - elapsed);
  // 휴대폰을 켠 채 서 있을 때만 휴대폰 자세이고, 움직이거나 뛰면 휴대폰을 든 걷기·달리기·점프 그림을 쓴다.
  const phoneStill = grounded && (phoneRaising || (usingPhone && !walking && !running && !pushing));
  const state = phoneStill ? (phoneLightOn ? 'phone-light' : 'phone') : !grounded ? (body.velocity.y < 0 ? 'jump' : 'fall') :
    crouching ? 'crouch' : interactionTime > 0 && !holdingPhone ? 'interact' : pushing ? 'push' : running ? 'run' : walking ? 'walk' :
    phoneLightOn ? 'phone-light' : phoneAwayTime > 0 ? 'phone-away' : 'idle';
  pushTime = state === 'push' ? pushTime + elapsed : 0;
  phoneTime = state === sprite.dataset.state && (state === 'phone' || state === 'phone-light') ? phoneTime + elapsed : 0;
  idleTime = state === 'idle' && sprite.dataset.state === 'idle' ? (idleTime + elapsed) % 3200 : 0;
  crouchDistance = state === 'crouch' && distance > .1 ? (crouchDistance + distance) % 96 : 0;
  const index = state === 'crouch' ? Math.floor(crouchDistance / 24) : state === 'phone' ? (phoneTime < 360 ? Math.floor(phoneTime / 180) : 2 + Math.floor((phoneTime - 360) / 600) % 2) :
    state === 'phone-light' ? Math.floor(phoneTime / 240) % 4 : state === 'phone-away' ? Number(phoneAwayTime <= 180) :
    state === 'fall' ? 1 : state === 'interact' ? Number(interactionTime <= 240) : state === 'push' ? Math.floor(pushTime / pushFrameMs) % pushFrames :
    running ? Math.floor(runDistance / runFrameDistance) : walking ? Math.floor(walkDistance / frameDistance) :
    state === 'idle' ? (idleTime < 1200 ? 0 : idleTime < 2100 ? 1 : idleTime < 2220 ? 2 : 3) : 0;
  sprite.dataset.state = state;
  sprite.dataset.frame = index;
  sprite.dataset.phoneHeld = String(holdingPhone);
  const light = phoneLightOn ? 'on' : 'off';
  for (const [sheet, motion] of [[phoneWalkSheet, 'walk'], [phoneRunSheet, 'run']]) {
    const src = motion === 'walk' ? `assets/player/jeong-suho-phone-walk-eight-${light}.png` :
      phoneLightOn && state !== 'run' ? 'assets/player/jeong-suho-phone-jump-on.png' : `assets/player/jeong-suho-phone-run-sixteen-${light}.png`;
    if (sheet.getAttribute('src') !== src) {
      sheet.setAttribute('src', src);
      sheet.style.width = `${100 * (motion === 'walk' ? walkFrames : phoneLightOn && state !== 'run' ? 2 : runFrames)}%`;
    }
  }
  if (state === 'idle') showIdleFrame(index);
  if (state === 'push') pushSheet.style.transform = `translateX(${-index * 100 / pushFrames}%)`;
  if (state === 'crouch') crouchSheet.style.transform = `translateX(${-index * 25}%)`;
  if (state === 'walk') (holdingPhone ? phoneWalkSheet : walkSheet).style.transform = `translateX(${-index * 100 / walkFrames}%)`;
  if (state === 'run') (holdingPhone ? phoneRunSheet : runSheet).style.transform = `translateX(${-index * 100 / runFrames}%)`;
  // Jump/fall retains its separate two-pose lit sheet.
  if (holdingPhone && (state === 'jump' || state === 'fall')) phoneRunSheet.style.transform = phoneLightOn ?
    `translateX(${state === 'jump' ? 0 : -50}%)` : `translateX(${-(state === 'jump' ? 4 : 12) * 100 / runFrames}%)`;
  if (state === 'jump' || state === 'fall') jumpSheet.style.transform = `translateX(${-index * 50}%)`;
  if (state === 'interact') interactSheet.style.transform = `translateX(${-index * 50}%)`;
  if (state === 'phone') phoneSheet.style.transform = `translateX(${-index * 25}%)`;
  if (state === 'phone-light') phoneLightSheet.style.transform = `translateX(${-index * 25}%)`;
  if (state === 'phone-away') phoneAwaySheet.style.transform = `translateX(${-index * 50}%)`;
}

