// 플레이어 스프라이트: 움직임 상태와 대기·걷기·달리기·점프·조사 애니메이션.
const idleSheet = document.getElementById('idle-sprite');
const walkSheet = document.getElementById('walk-sheet');
const runSheet = document.getElementById('run-sheet');
const jumpSheet = document.getElementById('jump-sheet');
const interactSheet = document.getElementById('interact-sheet');
const phoneSheet = document.getElementById('phone-sheet');
const phoneLightSheet = document.getElementById('phone-light-sheet');
const phoneAwaySheet = document.getElementById('phone-away-sheet');
const phoneWalkSheet = document.getElementById('phone-walk-sheet');
const phoneRunSheet = document.getElementById('phone-run-sheet');
const caughtSheet = document.getElementById('caught-sheet');
let phoneTime = 0;
let phoneAwayTime = 0;

let walkDistance = 0;
let runDistance = 0;
let idleTime = 0;
let walkReady = false;
let facing = 1;
let grounded = false;
let jumpQueued = false;
let interactionTime = 0;

function checkWalkSheet() {
  walkReady = walkSheet.naturalWidth === 256 * walkFrames && walkSheet.naturalHeight === 256;
}
walkSheet.addEventListener('load', checkWalkSheet);
checkWalkSheet();

function animate(distance, sprinting = false, elapsed = 0) {
  if (openingActive) return;
  if (playerCaught) {
    const frame = guardPatrol.captureTime < 440 ? 0 : 1 + Math.floor((guardPatrol.captureTime - 440) / 240) % 3;
    sprite.dataset.state = 'caught'; sprite.dataset.frame = frame;
    caughtSheet.style.transform = `translateX(${-frame * 25}%)`;
    return;
  }
  const running = grounded && sprinting && distance > .1 && runSheet.naturalWidth === 256 * runFrames && runSheet.naturalHeight === 256;
  const walking = grounded && walkReady && distance > .1 && !running;
  const holdingPhone = phoneHeld || phoneLightOn;
  walkDistance = walking ? (walkDistance + distance) % (frameDistance * walkFrames) : 0;
  runDistance = running ? (runDistance + distance) % (runFrameDistance * runFrames) : 0;
  if (distance > .1 || !grounded) phoneAwayTime = 0;
  else phoneAwayTime = Math.max(0, phoneAwayTime - elapsed);
  const state = usingPhone ? (phoneLightOn ? 'phone-light' : 'phone') : !grounded ? (body.velocity.y < 0 ? 'jump' : 'fall') :
    interactionTime > 0 && !holdingPhone ? 'interact' : running ? 'run' : walking ? 'walk' :
    phoneLightOn ? 'phone-light' : holdingPhone ? 'phone-ready' : phoneAwayTime > 0 ? 'phone-away' : 'idle';
  phoneTime = state === sprite.dataset.state && (state === 'phone' || state === 'phone-light') ? phoneTime + elapsed : 0;
  idleTime = state === 'idle' && sprite.dataset.state === 'idle' ? (idleTime + elapsed) % 3200 : 0;
  const index = state === 'phone' ? (phoneTime < 360 ? Math.floor(phoneTime / 180) : 2 + Math.floor((phoneTime - 360) / 600) % 2) :
    state === 'phone-light' ? Math.floor(phoneTime / 240) % 4 : state === 'phone-away' ? Number(phoneAwayTime <= 180) :
    state === 'fall' ? 1 : state === 'interact' ? Number(interactionTime <= 240) :
    running ? Math.floor(runDistance / runFrameDistance) : walking ? Math.floor(walkDistance / frameDistance) :
    state === 'idle' ? (idleTime < 1200 ? 0 : idleTime < 2100 ? 1 : idleTime < 2220 ? 2 : 3) : 0;
  sprite.dataset.state = state;
  sprite.dataset.frame = index;
  sprite.dataset.phoneHeld = String(holdingPhone);
  const light = phoneLightOn ? 'on' : 'off';
  for (const [sheet, motion] of [[phoneWalkSheet, 'walk'], [phoneRunSheet, 'run']]) {
    const src = `assets/player/jeong-suho-phone-${motion}-${light}.png`;
    if (sheet.getAttribute('src') !== src) sheet.setAttribute('src', src);
  }
  if (state === 'idle') {
    // The original 2x2 sheet has uneven cells: align each hip and sole at the walking scale.
    const hip = [325, 925, 325, 925][index];
    const sole = [619, 619, 1234, 1235][index];
    idleSheet.style.transform = `translate(${96 - hip * .285}px, ${178 - sole * .285}px)`;
    idleSheet.style.clipPath = `inset(${index < 2 ? 0 : 50}% ${index % 2 ? 0 : 50}% ${index < 2 ? 50 : 0}% ${index % 2 ? 50 : 0}%)`;
  }
  if (state === 'walk') (holdingPhone ? phoneWalkSheet : walkSheet).style.transform = `translateX(${-index * 100 / walkFrames}%)`;
  if (state === 'run') (holdingPhone ? phoneRunSheet : runSheet).style.transform = `translateX(${-index * 100 / runFrames}%)`;
  // Reuse the airborne run poses so a lit phone never disappears during a jump.
  if (holdingPhone && (state === 'jump' || state === 'fall')) phoneRunSheet.style.transform = `translateX(${-(state === 'jump' ? 2 : 6) * 100 / runFrames}%)`;
  if (state === 'jump' || state === 'fall') jumpSheet.style.transform = `translateX(${-index * 50}%)`;
  if (state === 'interact') interactSheet.style.transform = `translateX(${-index * 50}%)`;
  if (state === 'phone') phoneSheet.style.transform = `translateX(${-index * 25}%)`;
  if (state === 'phone-light') phoneLightSheet.style.transform = `translateX(${-index * 25}%)`;
  if (state === 'phone-ready') phoneLightSheet.style.transform = 'translateX(0)';
  if (state === 'phone-away') phoneAwaySheet.style.transform = `translateX(${-index * 50}%)`;
}
