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
const flashPrompt = document.getElementById('flash-prompt');
const devouredVideo = document.getElementById('devoured-video');
const redEyes = document.getElementById('red-eyes');
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
let zeroEventForced = false; // 콘솔 버튼으로 시작한 추격: 정신력이 0%보다 커도 이어진다. 단 시작할 때보다 정신력이 오르면 중지한다
let zeroEventForcedFrom = 0;
let zeroEventGhostX = 0; // 돌진 환각의 월드 x 좌표(수호를 따라다니지 않고 일정한 속도로 다가온다)
const zeroEventGhostStartGap = 320; // 돌진 환각이 나타날 때 수호와의 거리
const zeroEventReachGap = 30; // 이 거리 안으로 오면 닿은 것으로 친다


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

// 정신력 0%: 지금 보는 방향의 반대로 걸으려 하면 sanityZeroTurnDelayMs 동안 제자리에서 기다린 뒤에야 돌아선다(그동안 입력은 무시).
// 보는 방향이 바뀌거나 입력을 떼면 다시 처음부터 잰다. 0%에서 달리는 속도를 줄이는 것은 loop.js가 한다(sanityZeroRunFactor).
let zeroTurnTimer = 0;
function applyZeroSanityTurnDelay(input) {
  if (sanity > 0 || !input || input === facing) { zeroTurnTimer = 0; return input; }
  zeroTurnTimer += step;
  return zeroTurnTimer >= sanityZeroTurnDelayMs ? input : 0;
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
  zeroEventGhostX = body.position.x + zeroEventSide * zeroEventGhostStartGap;
  beginHallucinationSighting('charge', zeroEventSide, zeroEventGhostStartGap);
}

function resolveZeroEvasion() {
  zeroEventPhase = 'idle';
  zeroEventTimer = 0;
  endHallucinationSighting();
  if (zeroEventForced) {
    // 콘솔로 시작한 추격은 회피 횟수(다음 돌진까지의 대기 시간)에 포함하지 않는다.
    zeroEventForced = false;
    return;
  }
  zeroEventEvasions++;
}

// 삼켜지는 순간 영상을 모든 화면 요소 앞에서 바로 재생하고, 끝나거나 재생에 실패하면 닫아 게임 오버 창을 보여 준다.
function hideDevouredVideo() {
  devouredVideo.pause();
  devouredVideo.hidden = true;
}
devouredVideo.addEventListener('ended', hideDevouredVideo);
devouredVideo.addEventListener('error', hideDevouredVideo);
function playDevouredVideo() {
  devouredVideo.currentTime = 0;
  devouredVideo.hidden = false;
  devouredVideo.play().catch(hideDevouredVideo);
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
  playDevouredVideo();
  releaseInput();
  Body.setVelocity(body, { x: 0, y: 0 });
  hint.hidden = interactionOutline.hidden = true;
  hallucinationBlocked = [...document.body.children].filter(element => element !== hallucinationCapturePanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of hallucinationBlocked) element.inert = true;
  hallucinationCapturePanel.hidden = false;
  document.getElementById('hallucination-retry').focus();
}

function releaseHallucinationCapture() {
  hideDevouredVideo(); // 영상 도중 Enter로 다시 시작해도 영상이 남지 않게 한다
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
  if (zeroEventForced && sanity > zeroEventForcedFrom) { zeroEventForced = false; zeroEventPhase = 'idle'; zeroEventTimer = 0; endHallucinationSighting(); } // 정신력이 오르면 진행 중인 추격을 중지한다
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
    // 환각은 월드 좌표에서 일정한 속도로 수호에게 다가간다. 수호가 어느 쪽으로 움직여도 환각의 속도는 변하지 않고, 닿으면 삼켜진다.
    const gap = body.position.x - zeroEventGhostX;
    zeroEventGhostX += Math.sign(gap) * Math.min(Math.abs(gap), zeroEventGhostStartGap / zeroEventRushDurationMs * elapsed);
    if (Math.abs(body.position.x - zeroEventGhostX) <= zeroEventReachGap) triggerDevoured();
    else if (zeroEventForced && zeroEventTimer >= 6000) resolveZeroEvasion(); // 콘솔로 시작한 추격을 달려서 따돌린 경우의 안전장치
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
  return !gameStarted || mainMenuActive || openingActive || blackoutSceneActive || cctvSceneActive || playerCaught || hallucinationCaught ||
    transitioning || selectingFloor || usingComputer || usingKeypad || usingPhone || usingPowerPanel || usingInspection;
}

function debugTriggerChaseHallucination() {
  if (hallucinationEventBlocked()) return false;
  endHallucinationSighting();
  zeroEventForced = true;
  zeroEventForcedFrom = sanity;
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
  flashPrompt.hidden = mode !== 'charge'; // 돌진(추격) 이벤트 동안만 플래시 안내를 깜빡인다
}

function endHallucinationSighting() {
  hallucinationMode = null;
  delete document.body.dataset.hallucinating;
  hallucinations.hidden = true;
  hallucinationShadow.hidden = true;
  flashPrompt.hidden = true;
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

// 붉은 눈(10% 미만): 깜빡일 때마다 화면이 아니라 월드 좌표의 일반 배경(상호작용 대상 옆을 피한 곳, 너무 낮지도 높지도 않은 높이)에
// 하나씩 생긴다. 어둠 속에서도 어둠 막 위에 그려져 희미하게 빛나고(css/sanity.css), 가운데 검은 눈동자가 늘 수호 쪽으로 움직인다.
// 장면(층·방)이 바뀌면 지운다. 최대 wallEyeMaxCount개이고 넘치면 오래된 눈부터 사라진다.
const RED_EYE_SIZE = 52;
const RED_EYE_Y = [200, 330];
let redEyeScene = null;

function spawnRedEye() {
  const minX = Math.max(64, cameraX + 60);
  const maxX = Math.min(worldWidth - 64, cameraX + viewWidth - 60);
  if (maxX <= minX) return;
  for (let tries = 0; tries < 24; tries++) {
    const x = minX + Math.random() * (maxX - minX);
    const y = RED_EYE_Y[0] + Math.random() * (RED_EYE_Y[1] - RED_EYE_Y[0]);
    if (Math.abs(x - body.position.x) < 140) continue; // 수호 바로 옆은 피한다
    if (currentDoors.some(door => x > door.x - 50 && x < door.x + door.width + 50)) continue; // 문·소품 등 상호작용 대상 옆은 피한다
    if ([...redEyes.children].some(other => Math.abs(Number(other.dataset.x) - x) < 100)) continue; // 서로 겹치지 않게
    if (redEyes.children.length >= wallEyeMaxCount) redEyes.firstElementChild.remove();
    const eye = document.createElement('div');
    eye.className = 'red-eye';
    eye.dataset.x = String(x);
    eye.dataset.y = String(y);
    Object.assign(eye.style, { left: `${x}px`, top: `${y}px`, width: `${RED_EYE_SIZE}px`, height: `${RED_EYE_SIZE}px` });
    redEyes.append(eye);
    return;
  }
}

// 매 프레임(render)에서 부른다: 장면이 바뀌었으면 눈을 지우고, 눈동자를 수호가 있는 쪽으로 옮긴다.
function updateRedEyes() {
  const key = room === 'dynamic' ? dynamicFloorId : room;
  if (key !== redEyeScene) { redEyes.replaceChildren(); redEyeScene = key; }
  const targetX = body.position.x;
  const targetY = body.position.y - 20;
  for (const eye of redEyes.children) {
    const dx = targetX - Number(eye.dataset.x);
    const dy = targetY - Number(eye.dataset.y);
    const distance = Math.hypot(dx, dy) || 1;
    const reach = RED_EYE_SIZE * .2 * Math.min(1, distance / 160); // 아주 가까우면 가운데로 모인다
    eye.style.setProperty('--px', `${dx / distance * reach}px`);
    eye.style.setProperty('--py', `${dy / distance * reach}px`);
  }
}

// ---- 15% 미만, 불이 꺼진 어둠 속(플래시 없음): 9초마다 얼굴 하나가 2초 동안 흐릿 → 선명 → 흐릿하게 나타난다 ----
// 직전에 나온 얼굴은 다음에 제외하고 그다음부터 다시 나올 수 있다. 플래시·조명·엘리베이터 조명으로 밝아지거나 창·컷씬으로 멈추면 즉시 사라진다.
const darkFace = document.getElementById('dark-face');
const DARK_FACE_IMAGES = [1, 2, 3].map(n => `assets/ui/hallucination/dark-face-${n}.png`);
let darkFaceTimer = 0;
let darkFaceLife = 0;
let darkFaceLast = -1;

let darkFaceForced = false; // 콘솔의 점프스케어 버튼으로 낸 얼굴: 조건과 상관없이 2초 동안 보인다

// 얼굴 하나를 왼쪽이나 오른쪽 가장자리에 띄운다(직전 얼굴은 제외).
function showDarkFace() {
  darkFaceTimer = darkFaceLife = 0;
  const choices = DARK_FACE_IMAGES.map((_, index) => index).filter(index => index !== darkFaceLast);
  darkFaceLast = choices[Math.floor(Math.random() * choices.length)];
  darkFace.src = DARK_FACE_IMAGES[darkFaceLast];
  darkFace.style.left = Math.random() < .5 ? '16%' : '84%';
  darkFace.hidden = false;
  darkFace.style.animation = 'none'; void darkFace.offsetWidth; darkFace.style.animation = ''; // 애니메이션을 처음부터 다시
}

function updateDarkFace(elapsed, fsmPaused) {
  if (darkFaceForced) {
    darkFaceLife += elapsed;
    if (darkFaceLife >= 2000) { darkFace.hidden = true; darkFaceForced = false; }
    return;
  }
  if (fsmPaused || sanity >= 15 || sanityExposure() !== 'dark') {
    darkFace.hidden = true;
    darkFaceTimer = darkFaceLife = 0;
    return;
  }
  darkFaceTimer += elapsed;
  if (!darkFace.hidden) {
    darkFaceLife += elapsed;
    if (darkFaceLife >= 2000) darkFace.hidden = true;
  }
  if (darkFaceTimer >= 9000) showDarkFace();
}

function debugTriggerJumpscare() {
  if (hallucinationEventBlocked()) return false;
  darkFaceForced = true;
  showDarkFace();
  return true;
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
  if (fearTier >= 5) spawnRedEye();
}

function updateSanity(elapsed) {
  // 컷씬·장면 전환·포획과 문서를 읽는 동안은 공포 진행을 멈춘다.
  const paused = openingActive || blackoutSceneActive || cctvSceneActive || playerCaught || hallucinationCaught || transitioning ||
    usingComputer || usingKeypad || usingPowerPanel || usingInspection;
  const fsmPaused = paused || selectingFloor;
  const exposure = sanityExposure();
  // B2 엔딩 중에는 R-01에게 쫓겨도 줄지 않는다: 정신력은 로봇 속도(45% 규칙, b2-ending.js)를 정하는 데 쓰인다.
  const chasing = guardPatrol.mode === 'chase' && !bossFightActive && b2Ending.phase !== 'running';
  if (!paused) {
    // 정신 불안 임무: 첫 컷씬을 본 뒤 항불안제를 쓰기 전까지는 어디에 있든 1초에 2%씩 줄어든다(쫓길 때의 감소가 더 빠르면 그쪽).
    const anxiety = collectedItems.has('story-anxiety-seen') && !collectedItems.has('f16-antianxiety-used') && !collectedItems.has('b2-antianxiety-used');
    // 항불안제를 쓴 뒤에는 다시 닳기 시작하는 조건(collectedItems의 'sanity-drain-resume', 아직 정해지지 않아 어디서도 켜지 않는다)이 생기기 전까지 정신력이 닳지 않는다.
    const calm = collectedItems.has('f16-antianxiety-used') && !collectedItems.has('sanity-drain-resume');
    const rate = calm ? 0 : chasing ? -sanityChaseDrainPerSecond : anxiety ? -sanityAnxietyDrainPerSecond : exposure === 'dark' ? -sanityDarkDrainPerSecond : 0;
    // 쫓기는 동안의 감소는 10%에서 멈춘다(이미 10% 아래면 쫓겨서는 더 줄지 않는다).
    const lowest = chasing ? Math.min(sanity, sanityChaseFloor) : 0;
    sanity = Math.max(lowest, Math.min(100, sanity + rate * elapsed / 1000));
  }
  const tier = sanityTierOf(sanity);
  if (tier !== fearTier) { fearTier = tier; document.body.dataset.fearTier = String(fearTier); }
  // 30%→20% 구간에서 검은 비네트가 서서히 붉게 변하고, 20% 밑으로는 완전히 붉다.
  fearOverlayRed.style.opacity = String(Math.max(0, Math.min(1, (30 - sanity) / 10)) * (fearTier >= 1 ? .7 : 0));
  document.body.dataset.weary = String(fearTier >= 3);
  if (fearTier < 5 && redEyes.children.length) redEyes.replaceChildren();
  if (computer) computer.dataset.fear = String(fearTier >= 4);
  updateComputerFear(fearTier >= 4);
  updateBlink(elapsed, fsmPaused);
  updateDarkFace(elapsed, fsmPaused);
  updatePreZeroApproach(elapsed, fsmPaused);
  updateZeroEvent(elapsed, fsmPaused);
  updateAmbientSighting(elapsed, fsmPaused);
  updateHallucinationSighting(elapsed, fsmPaused);
  refreshSanity();
}

function renderHallucination() {
  // 탑승 중에는 복도 환각의 진행 상태를 보존하고 화면 표시만 숨긴다.
  if (selectingFloor) {
    hallucinations.hidden = hallucinationShadow.hidden = true;
    delete document.body.dataset.hallucinating;
    return;
  }
  if (!hallucinationMode) return;
  hallucinations.hidden = false;
  hallucinationShadow.hidden = false;
  hallucinations.dataset.mode = hallucinationMode;
  flashPrompt.hidden = hallucinationMode !== 'charge'; // 매 프레임 환각 종류와 맞춰, 다시 추격할 때도 안내가 뜬다
  document.body.dataset.hallucinating = 'true';
  const width = Math.min(224 * scale, stage.clientWidth * .4);
  let opacity = .5;
  let targetX;
  if (hallucinationMode === 'ambient') {
    const progress = hallucinationLife / ambientSightingLifeMs;
    opacity = .4 * Math.sin(Math.PI * Math.min(1, progress + .06));
    targetX = (hallucinationAnchorX - cameraX) * scale;
  } else if (hallucinationMode === 'charge') {
    // charge: 월드 좌표의 환각. 수호와의 실제 거리가 줄수록 짙어진다.
    const progress = 1 - Math.min(1, Math.abs(body.position.x - zeroEventGhostX) / zeroEventGhostStartGap);
    opacity = Math.min(1, .3 + progress);
    targetX = (zeroEventGhostX - cameraX) * scale;
  } else {
    // approach: 플레이어 기준 상대 거리가 진행도에 따라 줄어든다.
    const progress = Math.min(1, hallucinationLife / zeroEventApproachDurationMs);
    const offset = hallucinationStartDistance - hallucinationStartDistance * .78 * progress;
    opacity = Math.min(1, progress * 2.4) * (1 - Math.max(0, progress - .75) * 4);
    targetX = (body.position.x + hallucinationSide * offset - cameraX) * scale;
  }
  if (stage.clientWidth < 600 && hallucinationMode === 'ambient') {
    targetX = (body.position.x - cameraX) * scale < stage.clientWidth / 2 ? stage.clientWidth - width / 2 - 12 : width / 2 + 12;
  }
  const left = Math.max(12, Math.min(stage.clientWidth - width - 12, targetX - width / 2));
  const top = floorY * scale - 238 * width / 256 + width * .12;
  Object.assign(hallucinationShadow.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${width * 2 / 3}px`,
    opacity: String(Math.max(0, opacity)), transform: `scaleX(${hallucinationSide})` });
}

refreshSanity();
