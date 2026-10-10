// 정신력(공포 연출): 빛 노출은 암전 마스크를 따른다. 플래시/밝은 곳은 소모를 막을 뿐 더 이상 회복시키지 않는다.
// 어두운 곳에서는 3초에 1%씩, 경비 로봇에게 쫓기는 동안(guardPatrol.mode === 'chase')은 1초에 10%씩 줄어든다(보스전 제외).
// 50/40/30/20/10% 미만마다 화면 연출이 단계적으로 심해지고(sanityTierOf), 0%에 닿으면 '환각'이 플레이어를 노리는
// 이벤트가 시작된다: 15초 뒤 돌진 → 바라보던 반대쪽에서 뛰어들고, 그 방향으로 플래시를 비추면 회피 → 5초 뒤 재시도.
// 회피하지 못하면 잡아먹혀 게임 오버.
const sanityHud = document.getElementById('sanity-hud');
const sanityValue = document.getElementById('sanity-value');
const sanityMeter = document.getElementById('sanity-meter');
const sanityFill = document.getElementById('sanity-fill');
const sanityState = document.getElementById('sanity-state');
const hallucinations = document.getElementById('hallucinations');
const hallucinationShadow = document.getElementById('hallucination-shadow');
const wallEyes = document.getElementById('wall-eyes');
const blinkFlash = document.getElementById('blink-flash');
const hallucinationCapturePanel = document.getElementById('hallucination-caught');
const fearOverlayRed = document.getElementById('fear-overlay-red');

// 환각 모습: null(없음) | 'ambient'(30% 미만, 가끔 먼 곳에 보임) | 'approach'(0%가 되기 전 예고) | 'charge'(0% 돌진).
let hallucinationMode = null;
let hallucinationSide = 1; // -1/1, 환각이 플레이어를 기준으로 어느 쪽에서 나타났는지
let hallucinationLife = 0; // 지금 환각이 떠 있은 시간(ms)
let hallucinationAnchorX = 0; // ambient 전용: 화면이 아니라 세계 좌표에 고정된 위치(다가가면 사라진다)
let hallucinationStartDistance = 0; // approach/charge 전용: 처음 나타났을 때 플레이어와의 거리

let ambientTimer = 0;
let ambientNextIn = ambientSightingIntervalRange[0];
let blinkTimer = 0;
let blinkNextIn = Infinity;
let blinkFlashTimer = 0;

let zeroEventApproachDone = false; // 0%가 되기 전 예고 환각을 이미 보여줬다
let zeroEventPhase = 'idle'; // 'idle' | 'waiting' | 'charging' (0%에서만 의미가 있다)
let zeroEventTimer = 0;
let zeroEventSide = 1;
let zeroEventEvasions = 0;
let zeroEventForced = false; // 콘솔 버튼으로 시작한 추격: 정신력이 0%보다 커도 끝날 때까지 이어진다


let hallucinationBlocked = [];

function sanityExposure() {
  // 1인칭 엘리베이터 안에는 플레이어의 손전등 빛이 표시되지 않는다.
  if (selectingFloor) return buildingBlackout ? 'dark' : 'bright';
  const dark = world.dataset.localLight !== 'true' && (world.dataset.blackout === 'true' ||
    (currentSceneFloor === 17 && world.dataset.lights === 'off') ||
    (room === 'dynamic' && world.dataset.dark === 'true'));
  return !dark ? 'bright' : phoneLightOn && phoneBattery > 0 ? 'flashlight' : 'dark';
}

function sanityTierOf(percent) {
  let tier = 0;
  for (const threshold of sanityTierThresholds) if (percent < threshold) tier++;
  return tier;
}

// loop.js가 이동 속도에 곱한다: 30% 미만부터, 10% 미만에서 한 번 더 느려진다.
function sanitySpeedFactor() {
  return fearTier >= 5 ? sanitySlowSpeedFactor * sanityCriticalSpeedFactor : fearTier >= 3 ? sanitySlowSpeedFactor : 1;
}

function refreshSanity() {
  const percent = Math.ceil(sanity);
  const state = sanity === 0 ? 'hallucinating' : fearTier >= 1 ? 'low' : 'normal';
  if (sanityValue.value !== `${percent}%`) sanityValue.value = `${percent}%`;
  if (sanityMeter.getAttribute('aria-valuenow') !== String(percent)) sanityMeter.setAttribute('aria-valuenow', String(percent));
  sanityFill.style.width = `${percent}%`;
  sanityHud.dataset.state = state;
  const label = state === 'hallucinating' ? '환각' : state === 'low' ? '불안' : '안정';
  if (sanityState.textContent !== label) sanityState.textContent = label;
}

function randomBetween([min, max]) { return min + Math.random() * (max - min); }

// ---- 0% 이벤트: 돌진 시작, 회피, 잡아먹힘 ----

function startZeroCharge() {
  zeroEventPhase = 'charging';
  zeroEventTimer = 0;
  zeroEventSide = -facing; // 플레이어가 바라보지 않는 쪽
  if (phoneLightOn) { phoneLightOn = false; refreshPhone(); }
  showStatus('어둠 속에서 무언가 빠르게 다가온다 — 반대쪽으로 플래시를 비춰야 한다!', 2600);
  beginHallucinationSighting('charge', zeroEventSide, 320);
}

function resolveZeroEvasion() {
  zeroEventPhase = 'idle';
  zeroEventTimer = 0;
  endHallucinationSighting();
  if (zeroEventForced) {
    // 콘솔로 시작한 추격은 회피 횟수(다음 돌진까지의 대기 시간)에 포함하지 않는다.
    zeroEventForced = false;
    showStatus('환각이 사라졌다.', 2600);
    return;
  }
  zeroEventEvasions++;
  showStatus(zeroEventEvasions === 1 ? '환각이 사라졌다. 다시 올 것 같다…' : '또 한 번 피했다.', 2600);
}

function triggerDevoured() {
  zeroEventForced = false;
  zeroEventPhase = 'idle';
  zeroEventTimer = 0;
  hallucinationCaught = true;
  endHallucinationSighting();
  phoneLightOn = false;
  refreshPhone();
  playHallucinationDevouredSound();
  releaseInput();
  Body.setVelocity(body, { x: 0, y: 0 });
  hint.hidden = interactionOutline.hidden = true;
  hallucinationBlocked = [...document.body.children].filter(element => element !== hallucinationCapturePanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of hallucinationBlocked) element.inert = true;
  hallucinationCapturePanel.hidden = false;
  document.getElementById('hallucination-retry').focus();
}

function releaseHallucinationCapture() {
  hallucinationCaught = false;
  hallucinationCapturePanel.hidden = true;
  for (const element of hallucinationBlocked) element.inert = false;
  hallucinationBlocked = [];
  // 완전히 소진된 상태로 다시 몰아붙이지 않도록 한숨 돌릴 여유를 준다.
  sanity = Math.max(sanity, 35);
  zeroEventEvasions = 0;
  refreshSanity();
  animate(0);
  stage.focus();
}
document.getElementById('hallucination-retry').addEventListener('click', () => {
  if (!hallucinationCaught) return;
  releaseHallucinationCapture();
});

function updateZeroEvent(elapsed, fsmPaused) {
  if (hallucinationCaught || fsmPaused) return;
  if (zeroEventForced && zeroEventPhase !== 'charging') zeroEventForced = false;
  if (sanity > 0 && !zeroEventForced) {
    if (zeroEventPhase !== 'idle') { zeroEventPhase = 'idle'; zeroEventTimer = 0; endHallucinationSighting(); }
    return;
  }
  if (zeroEventPhase === 'idle') { zeroEventPhase = 'waiting'; zeroEventTimer = 0; }
  if (zeroEventPhase === 'waiting') {
    zeroEventTimer += elapsed;
    const waitFor = zeroEventEvasions > 0 ? zeroEventRetryWaitMs : zeroEventChargeWaitMs;
    if (zeroEventTimer >= waitFor) startZeroCharge();
    return;
  }
  if (zeroEventPhase === 'charging') {
    zeroEventTimer += elapsed;
    if (facing === zeroEventSide && phoneLightOn) { resolveZeroEvasion(); return; }
    if (zeroEventTimer >= zeroEventRushDurationMs) triggerDevoured();
  }
}

// ---- 0%가 되기 전, 한 번뿐인 예고 환각 ----

function updatePreZeroApproach(elapsed, fsmPaused) {
  if (zeroEventApproachDone || fsmPaused || hallucinationMode) return;
  if (sanity > 0 && sanity <= zeroEventApproachThreshold) {
    zeroEventApproachDone = true;
    beginHallucinationSighting('approach', Math.random() < .5 ? -1 : 1, 300);
  }
}

// ---- 30% 미만: 가끔 멀리서 보이는, 공격하지 않는 환각 ----

function updateAmbientSighting(elapsed, fsmPaused) {
  if (fsmPaused || hallucinationMode || fearTier < 3 || sanity <= 0) { ambientTimer = 0; return; }
  ambientTimer += elapsed;
  if (ambientTimer < ambientNextIn) return;
  ambientTimer = 0;
  ambientNextIn = randomBetween(ambientSightingIntervalRange);
  startAmbientSighting();
}

// 플레이어 근처(220~340px)에 나타나 공격하지 않는 환각. 정신력 연출과 콘솔 버튼이 함께 쓴다.
function startAmbientSighting() {
  hallucinationSide = Math.random() < .5 ? -1 : 1;
  hallucinationAnchorX = Math.max(60, Math.min(worldWidth - 60, body.position.x + hallucinationSide * (220 + Math.random() * 120)));
  hallucinationMode = 'ambient';
  playHallucinationSound(.5, true); // 멀리서 보이는 환각은 작게
  hallucinationLife = 0;
}

// 콘솔 창 버튼용. 컷씬·전환·포획·창이 열려 있는 동안은 정신력 진행처럼 실행하지 않는다.
function hallucinationEventBlocked() {
  return !gameStarted || mainMenuActive || openingActive || blackoutSceneActive || playerCaught || hallucinationCaught ||
    transitioning || usingComputer || usingKeypad || usingPhone || usingPowerPanel || usingInspection;
}

function debugTriggerChaseHallucination() {
  if (hallucinationEventBlocked()) return false;
  endHallucinationSighting();
  zeroEventForced = true;
  startZeroCharge();
  return true;
}

function debugTriggerAmbientHallucination() {
  if (hallucinationEventBlocked()) return false;
  endHallucinationSighting();
  startAmbientSighting();
  return true;
}

function beginHallucinationSighting(mode, side, distance) {
  hallucinationMode = mode;
  playHallucinationSound(1, mode !== 'charge'); // 돌진(추격)만 기존 소리, 예고 환각은 무작위
  hallucinationSide = side;
  hallucinationStartDistance = distance;
  hallucinationLife = 0;
}

function endHallucinationSighting() {
  hallucinationMode = null;
  delete document.body.dataset.hallucinating;
  hallucinations.hidden = true;
  hallucinationShadow.hidden = true;
}

function updateHallucinationSighting(elapsed, fsmPaused) {
  if (!hallucinationMode || fsmPaused || hallucinationMode === 'charge') return;
  // 'charge'의 진행은 updateZeroEvent의 zeroEventTimer가 끌고 간다(회피/잡아먹힘 판정과 같은 시계여야 한다).
  // approach: 플래시를 비추며 바라보면 같은 시계가 2.6배 빨리 흐른다. 끝나는 시점만 앞당기면 위치·투명도 계산(life 기준)과
  // 어긋나 환각이 중간에 갑자기 끊기거나 속도가 일정하지 않게 보인다.
  const towardIt = hallucinationMode === 'approach' && phoneLightOn && facing === hallucinationSide;
  hallucinationLife += elapsed * (towardIt ? 2.6 : 1);
  if (hallucinationMode === 'ambient') {
    const dist = selectingFloor ? Infinity : Math.abs(body.position.x - hallucinationAnchorX);
    if (hallucinationLife >= ambientSightingLifeMs || dist < 90) endHallucinationSighting();
    return;
  }
  if (hallucinationMode === 'approach') {
    if (hallucinationLife >= zeroEventApproachDurationMs) endHallucinationSighting();
    return;
  }
  // 'charge'는 updateZeroEvent가 회피/도달 시점에 endHallucinationSighting을 직접 부른다.
}

// ---- 컴퓨터 오류 창: 20% 미만에서 열 때마다 꺼짐·색상바·오류화면·지직거리는 화면 중 하나를 무작위로 보여준다 ----
// null은 "꺼진 화면"(기존 자산 없이 CSS로 표현). 계속 돌아가며 바뀌지 않고, 컴퓨터를 새로 열 때마다 다시 뽑는다.
// 컴퓨터 에셋이 여러 대가 되어도 .computer-fear-still마다 따로 뽑으므로 서로 다른 화면을 보여줄 수 있다.
const COMPUTER_FEAR_STATES = [null, 'assets/ui/computer/fear/color-bars.png', 'assets/ui/computer/fear/boot-error.png',
  'assets/ui/computer/fear/static-noise.webp'];
let computerFearWasOpen = false;

function rollComputerFearStills() {
  for (const img of document.querySelectorAll('.computer-fear-still')) {
    const state = COMPUTER_FEAR_STATES[Math.floor(Math.random() * COMPUTER_FEAR_STATES.length)];
    const panel = img.closest('.computer-fear-window');
    if (panel) panel.dataset.off = String(state === null);
    if (state === null) img.removeAttribute('src');
    else img.src = state;
  }
}

function updateComputerFear(active) {
  const open = active && usingComputer && !computer.hidden;
  if (open && !computerFearWasOpen) rollComputerFearStills();
  computerFearWasOpen = open;
}

// ---- 눈 깜빡임 연출과, 10% 미만에서 깜빡일 때마다 느는 붉은 눈 ----

function spawnWallEye() {
  if (wallEyes.children.length >= wallEyeMaxCount) wallEyes.firstElementChild?.remove();
  const eye = document.createElement('div');
  eye.className = 'wall-eye';
  const fromLeft = Math.random() < .5;
  eye.style.left = fromLeft ? `${4 + Math.random() * 18}%` : 'auto';
  eye.style.right = fromLeft ? 'auto' : `${4 + Math.random() * 18}%`;
  eye.style.top = `${18 + Math.random() * 55}%`;
  wallEyes.append(eye);
}

function updateBlink(elapsed, fsmPaused) {
  if (blinkFlashTimer > 0) {
    blinkFlashTimer -= elapsed;
    if (blinkFlashTimer <= 0) blinkFlash.dataset.active = 'false';
  }
  if (fsmPaused || fearTier < 2) { blinkTimer = 0; return; }
  if (!Number.isFinite(blinkNextIn) || blinkNextIn === Infinity) blinkNextIn = randomBetween(blinkIntervalRangeByTier[fearTier] || blinkIntervalRangeByTier[2]);
  blinkTimer += elapsed;
  if (blinkTimer < blinkNextIn) return;
  blinkTimer = 0;
  blinkNextIn = randomBetween(blinkIntervalRangeByTier[fearTier] || blinkIntervalRangeByTier[2]);
  blinkFlash.dataset.active = 'true';
  blinkFlashTimer = 180;
  if (fearTier >= 5) spawnWallEye();
}

function updateSanity(elapsed) {
  // 컷씬·장면 전환·포획과 문서를 읽는 동안은 공포 진행을 멈춘다.
  const paused = openingActive || blackoutSceneActive || playerCaught || hallucinationCaught || transitioning ||
    usingComputer || usingKeypad || usingPowerPanel || usingInspection;
  const fsmPaused = paused || selectingFloor;
  const exposure = sanityExposure();
  const chasing = guardPatrol.mode === 'chase' && !bossFightActive;
  if (!paused) {
    const rate = chasing ? -sanityChaseDrainPerSecond : exposure === 'dark' ? -sanityDarkDrainPerSecond : 0;
    // 쫓기는 동안의 감소는 10%에서 멈춘다(이미 10% 아래면 쫓겨서는 더 줄지 않는다).
    const lowest = chasing ? Math.min(sanity, sanityChaseFloor) : 0;
    sanity = Math.max(lowest, Math.min(100, sanity + rate * elapsed / 1000));
  }
  const tier = sanityTierOf(sanity);
  if (tier !== fearTier) { fearTier = tier; document.body.dataset.fearTier = String(fearTier); }
  // 30%→20% 구간에서 검은 비네트가 서서히 붉게 변하고, 20% 밑으로는 완전히 붉다.
  fearOverlayRed.style.opacity = String(Math.max(0, Math.min(1, (30 - sanity) / 10)) * (fearTier >= 1 ? .7 : 0));
  document.body.dataset.weary = String(fearTier >= 3);
  if (fearTier < 5 && wallEyes.children.length) wallEyes.replaceChildren();
  if (computer) computer.dataset.fear = String(fearTier >= 4);
  updateComputerFear(fearTier >= 4);
  updateBlink(elapsed, fsmPaused);
  updatePreZeroApproach(elapsed, fsmPaused);
  updateZeroEvent(elapsed, fsmPaused);
  updateAmbientSighting(elapsed, fsmPaused);
  updateHallucinationSighting(elapsed, fsmPaused);
  refreshSanity();
}

function renderHallucination() {
  if (!hallucinationMode) return;
  hallucinations.hidden = false;
  hallucinationShadow.hidden = false;
  hallucinations.dataset.mode = hallucinationMode;
  document.body.dataset.hallucinating = 'true';
  const width = selectingFloor ? Math.min(260, stage.clientHeight * .4) : Math.min(224 * scale, stage.clientWidth * .4);
  let opacity = .5;
  let targetX;
  if (hallucinationMode === 'ambient') {
    const progress = hallucinationLife / ambientSightingLifeMs;
    opacity = .4 * Math.sin(Math.PI * Math.min(1, progress + .06));
    targetX = selectingFloor ? stage.clientWidth * (hallucinationSide < 0 ? .28 : .72) :
      (hallucinationAnchorX - cameraX) * scale;
  } else {
    // approach/charge: 플레이어 기준 상대 거리가 진행도에 따라 줄어든다(0%에 닿으면 플레이어 바로 앞).
    const duration = hallucinationMode === 'charge' ? zeroEventRushDurationMs : zeroEventApproachDurationMs;
    const elapsedForMode = hallucinationMode === 'charge' ? zeroEventTimer : hallucinationLife;
    const progress = Math.min(1, elapsedForMode / duration);
    const minOffset = hallucinationMode === 'approach' ? hallucinationStartDistance * .22 : 0;
    const offset = hallucinationStartDistance - (hallucinationStartDistance - minOffset) * progress;
    opacity = hallucinationMode === 'approach' ? Math.min(1, progress * 2.4) * (1 - Math.max(0, progress - .75) * 4) : Math.min(1, .3 + progress);
    targetX = selectingFloor ? stage.clientWidth * (hallucinationSide < 0 ? .22 : .78) :
      (body.position.x + hallucinationSide * offset - cameraX) * scale;
  }
  if (!selectingFloor && stage.clientWidth < 600 && hallucinationMode === 'ambient') {
    targetX = (body.position.x - cameraX) * scale < stage.clientWidth / 2 ? stage.clientWidth - width / 2 - 12 : width / 2 + 12;
  }
  const left = Math.max(12, Math.min(stage.clientWidth - width - 12, targetX - width / 2));
  const top = selectingFloor ? stage.clientHeight * .3 : floorY * scale - 238 * width / 256 + width * .12;
  Object.assign(hallucinationShadow.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${width * 2 / 3}px`,
    opacity: String(Math.max(0, opacity)), transform: `scaleX(${hallucinationSide})` });
}

refreshSanity();
