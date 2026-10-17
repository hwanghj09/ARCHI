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
// 보는 방향이 바뀌거나 입력을 떼면 다시 처음부터 잰다.
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
    // 환각은 월드 좌표에서 수호에게 다가간다. 수호가 어느 쪽으로 움직여도 환각의 속도는 같고(시간이 지나며 빨라진다), 닿으면 삼켜진다.
    const gap = body.position.x - zeroEventGhostX;
    const speedUp = zeroEventSpeedStepFactor ** Math.floor(zeroEventTimer / zeroEventSpeedStepMs); // 1.5초마다 1.5배씩 빨라진다
    zeroEventGhostX += Math.sign(gap) * Math.min(Math.abs(gap), zeroEventGhostStartGap / zeroEventRushDurationMs * speedUp * elapsed);
    if (Math.abs(body.position.x - zeroEventGhostX) <= zeroEventReachGap) triggerDevoured();
    else if (zeroEventForced && zeroEventTimer >= 6000) resolveZeroEvasion(); // 콘솔로 시작한 추격을 달려서 따돌린 경우의 안전장치
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
    transitioning || selectingFloor || usingComputer || usingKeypad || usingControl || usingPhone || usingPowerPanel || usingInspection || !wirePanel.hidden;
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

// ---- 컴퓨터 화면: 20% 미만에서 배경(17층 사무실)의 켜진 모니터가 꺼짐·색상바·오류화면·지직거리는 화면 중 하나로 바뀐다 ----
// 컴퓨터 안의 창이 아니라 월드에 놓인 모니터 그림이 바뀐다(css/sanity.css의 #office-computer[data-fear-still]). 정신력이 오르면 원래 화면으로
// 돌아오고, 20% 미만에서는 장소를 옮길 때마다(사무실 ↔ 복도, 층·방 이동) 다시 뽑는다.
const COMPUTER_FEAR_STILLS = ['off', 'color-bars', 'boot-error', 'static-noise'];

function updateComputerFear(active) {
  const monitor = officeComputer.element;
  if (!active) { delete monitor.dataset.fearStill; return; }
  if (!monitor.dataset.fearStill) { monitor.dataset.fearStill = randomFearStill(); rerollFearScreens(); }
}

// 배경에 놓인 모든 모니터 화면도 같은 식으로 바뀐다. 책상 에셋에 그려진 모니터는 아래 표의 자리(그림 크기 대비 [x0, y0, x1, y1] 비율)에
// .fear-screen을 얹고(scene-builder.js의 소품 조립), 사무실 배경 그림 속 모니터는 월드 좌표로 얹는다. 정신력이 오르거나 전력이 없으면 보이지 않는다.
const MONITOR_SCREENS = {
  'office-desk': [[.377, .07, .588, .316]],
  'compact-office-desk': [[.335, .14, .70, .32]],
  'data-workstation': [[.263, .13, .485, .37], [.515, .13, .735, .37]],
  'research-workstation': [[.268, .09, .472, .33], [.528, .09, .732, .33]],
  'support-workstation': [[.285, .10, .50, .335], [.515, .10, .72, .335]],
  'training-workstation': [[.222, .27, .365, .42], [.64, .27, .79, .42]],
  'test-terminal-desk': [[.355, .14, .56, .38]],
  'sales-desk': [[.375, .12, .625, .37]],
  'materials-desk': [[.375, .12, .625, .345]],
};
const randomFearStill = () => COMPUTER_FEAR_STILLS[Math.floor(Math.random() * COMPUTER_FEAR_STILLS.length)];

function fearScreenElement([x0, y0, x1, y1]) {
  const screen = document.createElement('div');
  screen.className = 'fear-screen';
  Object.assign(screen.style, { left: `${x0 * 100}%`, top: `${y0 * 100}%`, width: `${(x1 - x0) * 100}%`, height: `${(y1 - y0) * 100}%` });
  screen.dataset.still = randomFearStill();
  return screen;
}

function rerollFearScreens() {
  for (const screen of document.querySelectorAll('.fear-screen')) screen.dataset.still = randomFearStill();
  if (officeComputer.element.dataset.fearStill) officeComputer.element.dataset.fearStill = randomFearStill();
}

// 17층 사무실 배경 그림 속 모니터 다섯 대(켜진 컴퓨터는 #office-computer가 맡는다): 모니터 왼쪽 x에서 화면 영역(78×48)만큼 안쪽에 얹는다.
for (const left of [141, 259, 515, 1183, 1299]) {
  const screen = fearScreenElement([0, 0, 1, 1]);
  screen.classList.add('office');
  Object.assign(screen.style, { left: `${left + 5}px`, top: '398px', width: '78px', height: '48px' });
  world.insertBefore(screen, sprite);
}

// 17층 복도의 유리벽 너머로 보이는 사무실 모니터 일곱 대([x0, y0, x1, y1], 월드 좌표 = 복도 그림 픽셀 좌표).
for (const [x0, y0, x1, y1] of [[225, 414, 306, 462], [441, 414, 516, 460], [748, 424, 808, 461], [905, 414, 982, 462], [1030, 419, 1102, 465],
  [1304, 434, 1350, 460], [1397, 422, 1462, 462]]) {
  const screen = fearScreenElement([0, 0, 1, 1]);
  screen.classList.add('corridor');
  Object.assign(screen.style, { left: `${x0}px`, top: `${y0}px`, width: `${x1 - x0}px`, height: `${y1 - y0}px` });
  world.insertBefore(screen, sprite);
}

// ---- 눈 깜빡임 연출과, 10% 미만에서 수호를 둘러보는 붉은 눈 ----

// 붉은 눈(10% 미만): 깜빡일 때마다 수호 양옆과 머리 위를 감싸는 벽에 1~2개씩 늘어나고, wallEyeMaxCount개가 차면 더 생기지 않는다.
// 눈은 생성된 벽 위치에 고정되고, 홍채와 동공만 수호를 쳐다본다.
// 화면 밖으로 밀려난 눈은 다음 깜빡임에 사라지고, 장면이 바뀌면 모두 사라진다.
const RED_EYE_SIZE = 80;
const RED_EYE_SPAWN_MIN_DISTANCE = 300; // 눈은 수호에게서 이만큼 이상 떨어진 곳에만 생긴다
const RED_EYE_JUMP_REACH = 150; // 점프(속도 10.8, 중력 1.5)로 수호 중심이 올라가는 높이(약 140px)에 여유를 둔 값
const RED_EYE_FADE_MS = 1500; // 불이 켜져 눈 전체가 사라졌다 돌아오는 시간(css/sanity.css #red-eyes의 transition 1.5s)
const RED_EYE_LIT_FADE_MS = 750; // 손전등에 비춰진 눈이 사라지는 시간(.red-eye의 filter transition .75s)
let redEyeScene = null;
let redEyeBrightAt = -Infinity; // 마지막으로 불이 켜져 눈 전체가 투명했던 시각

function spawnRedEyes() {
  const minX = Math.max(48, cameraX + 48);
  const maxX = Math.min(worldWidth - 48, cameraX + viewWidth - 48);
  if (maxX <= minX) return;
  for (const eye of [...redEyes.children]) {
    const x = Number(eye.dataset.x);
    if (x < minX || x > maxX) eye.remove();
  }
  const count = Math.min(1 + Math.floor(Math.random() * 2), wallEyeMaxCount - redEyes.children.length);
  for (let tries = 0, added = 0; tries < 1000 && added < count; tries++) {
    // 수호 상반신을 중심으로 왼쪽 옆 → 머리 위 → 오른쪽 옆을 반원으로 감싼다(아래쪽에는 생기지 않는다).
    const angle = Math.PI + Math.random() * Math.PI;
    const ox = Math.cos(angle) * (200 + Math.random() * 260);
    const oy = -60 + Math.sin(angle) * (150 + Math.random() * 200);
    const x = body.position.x + ox, y = body.position.y + oy;
    if (x < minX || x > maxX || y < 80) continue;
    if (Math.hypot(x - body.position.x, y - (body.position.y - 20)) < RED_EYE_SPAWN_MIN_DISTANCE) continue; // 바로 근처에는 생기지 않는다(생기자마자 깨지지 않게)
    // 점프로 닿을 수 있는 높이에만 생긴다: 서 있는 수호 중심에서 점프 높이 + 깨지는 거리(여유 20px)보다 높은 곳에는 만들지 않는다.
    if (y < (grounded ? body.position.y : floorY - 81) - 20 - RED_EYE_JUMP_REACH - (RED_EYE_BREAK_DISTANCE - 20)) continue;
    if ([...redEyes.children].some(other => Math.hypot(Number(other.dataset.x) - x, Number(other.dataset.y) - y) < 140)) continue; // 눈끼리 간격을 둔다
    const eye = document.createElement('div');
    eye.className = 'red-eye';
    eye.dataset.x = String(x); // 생성된 벽 위치
    eye.dataset.y = String(y);
    Object.assign(eye.style, { left: `${x}px`, top: `${y}px`, width: `${RED_EYE_SIZE}px`, height: `${RED_EYE_SIZE}px` });
    eye.style.setProperty('--eye-roll', `${Math.random() * 24 - 12}deg`);
    eye.style.setProperty('--eye-size', .85 + Math.random() * .15);
    eye.style.setProperty('--eye-open', .8 + Math.random() * .25);
    redEyes.append(eye);
    added++;
  }
}

// 눈에 가까이 다가가면(RED_EYE_BREAK_DISTANCE) 눈이 즉시 사라지고, 그 자리에서 붉은 조각들이 떨어지며 흩어져 사라진다.
const RED_EYE_BREAK_DISTANCE = 120;
const redEyeShards = document.createElement('div');
redEyeShards.id = 'red-eye-shards';
redEyeShards.setAttribute('aria-hidden', 'true');
redEyes.after(redEyeShards);

function shatterRedEye(eye) {
  const x = Number(eye.dataset.x), y = Number(eye.dataset.y);
  eye.remove();
  playRedEyeBreakSound();
  for (let i = 0; i < 9; i++) {
    const shard = document.createElement('i');
    const size = 4 + Math.random() * 6;
    Object.assign(shard.style, { left: `${x + (Math.random() - .5) * RED_EYE_SIZE * .6}px`, top: `${y + (Math.random() - .5) * RED_EYE_SIZE * .4}px`,
      width: `${size}px`, height: `${size * (.6 + Math.random() * .6)}px` });
    shard.style.setProperty('--dx', `${(Math.random() - .5) * 130}px`);
    shard.style.setProperty('--dy', `${70 + Math.random() * 110}px`); // 아래로 떨어진다
    shard.style.setProperty('--spin', `${(Math.random() - .5) * 540}deg`);
    shard.style.animationDuration = `${.45 + Math.random() * .3}s`;
    shard.addEventListener('animationend', () => shard.remove());
    redEyeShards.append(shard);
  }
}

// 매 프레임(render)에서 부른다: 장면이 바뀌었으면 눈을 지우고, 고정된 눈 안의 눈동자만 수호 쪽으로 옮긴다.
function updateRedEyes() {
  const key = room === 'dynamic' ? dynamicFloorId : room;
  if (key !== redEyeScene) { redEyes.replaceChildren(); redEyeShards.replaceChildren(); redEyeScene = key; }
  // 불이 켜지면 눈 전체가, 손전등을 켜면 빛 원뿔에 닿은 눈만 서서히 사라지고, 다시 어두워지면 같은 자리에 서서히 드러난다(css/sanity.css).
  const exposure = sanityExposure();
  redEyes.dataset.lit = String(exposure === 'bright');
  const now = performance.now();
  if (exposure === 'bright') redEyeBrightAt = now;
  const beamX = parseFloat(world.style.getPropertyValue('--beam-x')), beamY = parseFloat(world.style.getPropertyValue('--beam-y')); // camera.js의 render가 정한 손전등 끝
  for (const eye of [...redEyes.children]) {
    const x = Number(eye.dataset.x);
    const y = Number(eye.dataset.y);
    // 손전등 원뿔(css/game.css의 #darkness: 바라보는 방향 ±24°)에 눈 가장자리라도 걸리면 끈다.
    const ahead = (x - beamX) * facing;
    const inBeam = ahead > 0 && Math.atan2(Math.abs(y - beamY), ahead) - Math.atan2(RED_EYE_SIZE / 2, Math.hypot(ahead, y - beamY)) < 24 * Math.PI / 180;
    eye.dataset.lit = String(exposure === 'flashlight' && inBeam);
    if (eye.dataset.lit === 'true') {
      eye.litAt = now; // 빛에 닿아 투명해진 시각
      eye.litSince ??= now;
      // 손전등으로 완전히 사라질 때까지(RED_EYE_LIT_FADE_MS) 비춰진 눈은 그대로 지운다: 빛이 걷혀도 다시 나타나지 않는다.
      if (now - eye.litSince >= RED_EYE_LIT_FADE_MS) { eye.remove(); continue; }
    } else eye.litSince = null; // 다 사라지기 전에 빛이 걷히면 다시 드러난다
    const dx = body.position.x - x;
    const dy = body.position.y - 20 - y;
    const distance = Math.hypot(dx, dy) || 1;
    // 불이나 손전등으로 투명해진 눈은, 다시 완전히 드러날 때까지(RED_EYE_FADE_MS) 가까이 가도 깨지지 않는다.
    const visible = now - redEyeBrightAt >= RED_EYE_FADE_MS && now - (eye.litAt ?? -Infinity) >= RED_EYE_LIT_FADE_MS;
    if (distance < RED_EYE_BREAK_DISTANCE && visible) { shatterRedEye(eye); continue; }
    const reach = RED_EYE_SIZE * .08 * Math.min(1, distance / 160); // 커진 홍채가 눈꺼풀 안에 머물고, 아주 가까우면 가운데로 모인다
    eye.style.setProperty('--px', `${dx / distance * reach}px`);
    eye.style.setProperty('--py', `${dy / distance * reach}px`);
    // 눈꺼풀 벌어짐에 따른 세로 눌림만 보정해 홍채의 원형을 유지한다.
    eye.style.setProperty('--iris-height', 1 / Number(eye.style.getPropertyValue('--eye-open') || 1));
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
  if (fearTier >= 5) spawnRedEyes();
}

function updateSanity(elapsed) {
  // 컷씬·장면 전환·포획과 문서를 읽는 동안은 공포 진행을 멈춘다.
  const paused = openingActive || blackoutSceneActive || cctvSceneActive || playerCaught || hallucinationCaught || transitioning ||
    usingComputer || usingKeypad || usingControl || usingPowerPanel || usingInspection || !wirePanel.hidden || !logPanel.hidden || !backupPanel.hidden;
  const fsmPaused = paused || selectingFloor;
  const exposure = sanityExposure();
  // B2 엔딩 중에는 R-01에게 쫓겨도 줄지 않는다: 정신력은 로봇 속도(45% 규칙, b2-ending.js)를 정하는 데 쓰인다.
  const chasing = guardPatrol.mode === 'chase' && !bossFightActive && b2Ending.phase !== 'running';
  if (!paused) {
    // 정신 불안 임무: 첫 컷씬을 본 뒤 항불안제를 쓰기 전까지는 어디서든 천천히 줄어든다(추격 중에는 추격 감소량 적용).
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
  const deskSrc = `assets/objects/floor17/workstation${fearTier >= 3 ? '-fear' : ''}.png`;
  if (officeDeskImage.getAttribute('src') !== deskSrc) officeDeskImage.src = deskSrc;
  // 30%→20% 구간에서 검은 비네트가 서서히 붉게 변하고, 20% 밑으로는 완전히 붉다.
  fearOverlayRed.style.opacity = String(Math.max(0, Math.min(1, (30 - sanity) / 10)) * (fearTier >= 1 ? .7 : 0));
  document.body.dataset.weary = String(fearTier >= 3);
  if (fearTier < 5 && redEyes.children.length) { redEyes.replaceChildren(); redEyeShards.replaceChildren(); }
  updateComputerFear(fearTier >= 4);
  updateBlink(elapsed, fsmPaused);
  updateDarkFace(elapsed, fsmPaused);
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
  const sizeFactor = hallucinationMode === 'charge' ? 2 : 1; // 2배 크기는 돌진(추격) 환각만, 생성(멀리 보임)·예고 환각은 처음 크기
  const width = Math.min(224 * sizeFactor * scale, stage.clientWidth * .4 * sizeFactor);
  let opacity = .5;
  let targetX;
  if (hallucinationMode === 'ambient') {
    const progress = hallucinationLife / ambientSightingLifeMs;
    opacity = .4 * Math.sin(Math.PI * Math.min(1, progress + .06));
    targetX = (hallucinationAnchorX - cameraX) * scale;
  } else if (hallucinationMode === 'charge') {
    // charge: 월드 좌표의 환각. 수호와의 실제 거리가 줄수록 짙어진다.
    const progress = 1 - Math.min(1, Math.abs(body.position.x - zeroEventGhostX) / zeroEventGhostStartGap);
    // 나타나는 순간부터 zeroEventGhostFadeInMs 동안 서서히 시작해 갈수록 빠르게 짙어진다(제곱 곡선).
    opacity = Math.min(1, .3 + progress) * Math.min(1, zeroEventTimer / zeroEventGhostFadeInMs) ** 2;
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

// 층 배경 그림 속 모니터. 키는 'assets/background/' 아래 그림 이름(확장자 제외), 값은 [그림 가로, 세로, 종류, 화면들]이다.
// 종류 'glass'는 복도 유리벽 너머로 보이는 모니터(화질을 더 낮춰 흐릿하게), 'room'은 방 안에서 보이는 모니터. 모니터를 모두 확인한 그림만 올렸다.
// 화면은 [x0, y0, x1, y1]이고 그림 픽셀 좌표다. 그림을 장면에 놓을 때(scene-builder.js) 그 자리에 .fear-screen을 얹는다.
const BACKGROUND_MONITORS = {
  'floor03/floor03-cs-interior': [1846, 475, 'room', [[73, 325, 127, 365], [325, 325, 379, 365], [475, 325, 529, 365], [595, 325, 649, 365],
    [688, 325, 742, 365], [781, 325, 835, 365], [874, 325, 928, 365], [967, 325, 1021, 365], [1060, 325, 1114, 365], [1153, 325, 1207, 365],
    [1246, 325, 1300, 365], [1339, 325, 1393, 365], [1459, 325, 1513, 365]]],
  'floor03/floor03-studio-interior': [1840, 475, 'room', [[1078, 310, 1136, 364]]],
  'floor04/floor04-lab-interior': [2676, 475, 'room', [[227, 318, 277, 359], [279, 318, 329, 359], [331, 318, 381, 358], [585, 318, 635, 359],
    [637, 318, 687, 359], [689, 318, 739, 358], [929, 318, 979, 358], [981, 318, 1031, 359], [1033, 318, 1083, 359], [1301, 318, 1351, 359],
    [1353, 318, 1403, 359], [1405, 318, 1455, 358], [1645, 318, 1695, 358], [1697, 318, 1747, 359], [1749, 318, 1799, 359],
    [393, 340, 423, 371], [751, 340, 781, 371], [887, 340, 917, 371], [1467, 340, 1497, 371], [1603, 340, 1633, 371]]],
  'floor05/floor05-security-interior': [1846, 475, 'room', [[510, 322, 566, 367], [566, 322, 622, 367]]],
  'floor10/floor10-office-interior': [2678, 475, 'room', [[456, 326, 506, 367], [600, 325, 651, 367], [820, 326, 870, 367], [964, 325, 1015, 367],
    [1177, 325, 1228, 367], [1322, 326, 1372, 367], [1548, 326, 1598, 367], [1692, 325, 1743, 367], [1905, 325, 1956, 367],
    [2050, 326, 2100, 367], [2272, 325, 2322, 367], [2410, 325, 2461, 367]]],
  'floor10/floor10-executive-interior': [1822, 475, 'room', [[319, 290, 365, 326]]],
};

function addBackgroundMonitors(image, src) {
  const entry = BACKGROUND_MONITORS[src.replace(/^assets\/background\/|\.png$/g, '')];
  if (!entry) return;
  const [naturalWidth, naturalHeight, kind, rects] = entry;
  const left = parseFloat(image.style.left) || 0, top = parseFloat(image.style.top) || 0;
  const sx = parseFloat(image.style.width) / naturalWidth, sy = parseFloat(image.style.height) / naturalHeight;
  for (const [x0, y0, x1, y1] of rects) {
    const screen = fearScreenElement([0, 0, 1, 1]);
    if (kind === 'glass') screen.classList.add('glass');
    Object.assign(screen.style, { left: `${left + x0 * sx}px`, top: `${top + y0 * sy}px`, width: `${(x1 - x0) * sx}px`, height: `${(y1 - y0) * sy}px` });
    image.after(screen);
  }
}
