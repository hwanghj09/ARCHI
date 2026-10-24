// 정신력은 피로와 드문 기척으로 드러난다. 형상은 월드의 조명·소품과 같은 깊이에서 그린다.
const sanityHud = document.getElementById('sanity-hud');
const sanityValue = document.getElementById('sanity-value');
const sanityMeter = document.getElementById('sanity-meter');
const sanityFill = document.getElementById('sanity-fill');
const sanityState = document.getElementById('sanity-state');
const sanityCalm = document.getElementById('sanity-calm');
const hallucinations = document.getElementById('hallucinations');
const hallucinationShadow = document.getElementById('hallucination-shadow');
const flashPrompt = document.getElementById('flash-prompt');
const hallucinationEffects = document.getElementById('hallucination-effects');
const devouredVideo = document.getElementById('devoured-video');
const redEyes = document.getElementById('red-eyes');
const blinkFlash = document.getElementById('blink-flash');
const fearOverlayRed = document.getElementById('fear-overlay-red');
const hallucinationCapturePanel = document.getElementById('hallucination-caught');
world.insertBefore(hallucinations, sprite);

// 환각 모습: null(없음) | 'ambient'(30% 미만, 먼 곳의 기척) | 'charge'(0% 접근).
let hallucinationMode = null;
let hallucinationSide = 1; // -1/1, 환각이 플레이어를 기준으로 어느 쪽에서 나타났는지
let hallucinationLife = 0; // 지금 환각이 떠 있은 시간(ms)
let hallucinationAnchorX = 0; // ambient 전용: 화면이 아니라 세계 좌표에 고정된 위치(다가가면 사라진다)
let hallucinationStartDistance = 0; // 접근 속도를 정하는 최초 거리

let blinkTimer = 0;
let blinkNextIn = Infinity;
let blinkFlashTimer = 0;
let ambientTimer = 0;
let ambientNextIn = randomBetween(ambientSightingIntervalRange);
let ambientSeenScene = null;
let ambientLightFade = 0; // 멀리 보이는 형상에 플래시를 비춘 뒤 사라지기까지 흐른 시간(ms)
const ambientLightFadeMs = 400;
let hallucinationScene = null;
let zeroEventLightTime = 0;
let zeroEventStepTimer = 0;

let zeroEventPhase = 'idle'; // 'idle' | 'waiting' | 'charging' (0%에서만 의미가 있다)
let zeroEventTimer = 0;
let zeroEventSide = 1;
let zeroEventEvasions = 0;
let zeroEventForced = false; // 콘솔 버튼으로 시작한 추격: 정신력이 0%보다 커도 이어진다. 단 시작할 때보다 정신력이 오르면 중지한다
let zeroEventForcedFrom = 0;
let zeroEventTravel = 0; // 추격 환각이 시작부터 걸어온 거리(걸음 그림을 이 거리에 맞춘다)
let zeroEventGhostX = 0; // 돌진 환각의 월드 x 좌표(수호를 따라다니지 않고 일정한 속도로 다가온다)
const zeroEventGhostStartGap = 320; // 돌진 환각이 나타날 때 수호와의 거리
const zeroEventReachGap = 30; // 이 거리 안으로 오면 닿은 것으로 친다


let hallucinationBlocked = [];

function sanityExposure() {
  // 1인칭 엘리베이터 안은 비상 회선으로 천장 조명이 켜져 있어 정전 중에도 밝은 곳으로 친다.
  if (selectingFloor) return 'bright';
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
  sanityCalm.hidden = antianxietyCalm <= 0;
  const calmText = `진정 효과 · ${Math.ceil(antianxietyCalm / 1000)}초`;
  if (sanityCalm.textContent !== calmText) sanityCalm.textContent = calmText;
  const percent = Math.ceil(sanity);
  const state = sanity === 0 ? 'hallucinating' : fearTier >= 1 ? 'low' : 'normal';
  if (sanityValue.value !== `${percent}%`) sanityValue.value = `${percent}%`;
  if (sanityMeter.getAttribute('aria-valuenow') !== String(percent)) sanityMeter.setAttribute('aria-valuenow', String(percent));
  sanityFill.style.width = `${percent}%`;
  sanityHud.dataset.state = state;
  // 상태 글자는 공포 단계를 따른다: 50% 미만 불안, 30% 미만 공포, 10% 미만 한계, 0% 환각.
  const tier = sanityTierOf(sanity);
  const label = state === 'hallucinating' ? '환각' : tier >= 5 ? '한계' : tier >= 3 ? '공포' : tier >= 1 ? '불안' : '안정';
  if (sanityState.textContent !== label) sanityState.textContent = label;
}

function randomBetween([min, max]) { return min + Math.random() * (max - min); }

// ---- 0% 이벤트: 돌진 시작, 회피, 잡아먹힘 ----

function hallucinationSceneKey() { return room === 'dynamic' ? dynamicFloorId : room; }

// 화면 가장자리나 벽 밖에서 출발하지 않도록 실제로 보이는 쪽에 둔다.
function hallucinationSpawnX(distance) {
  const left = Math.max(96, cameraX + 64);
  const right = Math.min(worldWidth - 96, cameraX + viewWidth - 64);
  // 보이는 범위 안에 자리가 있는 쪽(왼쪽·오른쪽) 중 무작위로 고른다. 수호가 화면 왼쪽에 서 있어 오른쪽에만 나타나던 것을 바로잡는다.
  const leftRoom = body.position.x - left, rightRoom = right - body.position.x, need = Math.min(distance, 160);
  const sides = [leftRoom >= need ? -1 : 0, rightRoom >= need ? 1 : 0].filter(Boolean);
  const side = sides.length ? sides[Math.floor(Math.random() * sides.length)] : leftRoom > rightRoom ? -1 : 1;
  const target = Math.max(left, Math.min(right, body.position.x + side * distance));
  const doors = currentDoors.filter(door => ['elevator', 'room', 'stairs'].includes(door.type));
  const clear = x => doors.every(door => x <= door.x - 38 || x >= door.x + door.width + 38);
  if (clear(target)) return target;
  // 닫힌 문 뒤에 완전히 숨겨지는 위치 대신 문틀 옆 빈 벽에 선다.
  const gaps = doors.flatMap(door => [door.x - 38, door.x + door.width + 38])
    .filter(x => x >= left && x <= right && Math.abs(x - body.position.x) > 100 && clear(x));
  return gaps.sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0] ?? target;
}

function startZeroCharge() {
  // 추격이 시작되면 켜져 있던(켜는 중이던) 플래시는 꺼진다.
  cancelPhoneLightDelay();
  if (phoneLightOn) { phoneLightOn = false; phoneAwayTime = usingPhone ? 0 : 360; playGameSound('phone'); }
  refreshPhone();
  endHallucinationSighting();
  zeroEventPhase = 'charging';
  zeroEventTimer = zeroEventLightTime = zeroEventStepTimer = 0;
  zeroEventGhostX = hallucinationSpawnX(zeroEventGhostStartGap);
  zeroEventTravel = 0;
  zeroEventSide = Math.sign(zeroEventGhostX - body.position.x) || 1;
  beginHallucinationSighting('charge', zeroEventSide, Math.abs(zeroEventGhostX - body.position.x));
  const side = zeroEventSide < 0 ? '왼쪽' : '오른쪽';
  flashPrompt.textContent = side + '에서 발소리 · ' + side + '을 비추세요 (F)';
  playGameSound('step', { x: zeroEventGhostX });
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
  hallucinationDevouredElement.pause();
}
devouredVideo.addEventListener('ended', hideDevouredVideo);
devouredVideo.addEventListener('error', hideDevouredVideo);
function playDevouredVideo() {
  devouredVideo.currentTime = 0;
  devouredVideo.muted = gameVolume <= 0; // 영상에 소리가 들어 있으니 게임 음량을 따른다
  devouredVideo.volume = Math.max(0, Math.min(1, gameVolume));
  devouredVideo.hidden = false;
  devouredVideo.play().catch(hideDevouredVideo);
}

function triggerDevoured() {
  cancelPhoneLightDelay();
  zeroEventForced = false;
  zeroEventPhase = 'idle';
  zeroEventTimer = 0;
  hallucinationCaught = true;
  endHallucinationSighting();
  phoneLightOn = false;
  refreshPhone();
  playDevouredVideo();
  releaseInput();
  Body.setVelocity(body, { x: 0, y: 0 });
  hint.hidden = interactionOutline.hidden = true;
  hallucinationBlocked = [...document.body.children].filter(element => element !== hallucinationCapturePanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of hallucinationBlocked) element.inert = true;
  hallucinationCapturePanel.hidden = false;
  hallucinationCapturePanel.querySelector('.game-over-load').focus();
}

function releaseHallucinationCapture() {
  hideDevouredVideo();
  hallucinationCaught = false;
  hallucinationCapturePanel.hidden = true;
  for (const element of hallucinationBlocked) element.inert = false;
  hallucinationBlocked = [];
  // 재시도는 회복 수단이 아니다. 다음 돌진까지의 대기 시간만 다시 준다.
  zeroEventPhase = 'idle';
  zeroEventTimer = 0;
  zeroEventEvasions = 0;
  refreshSanity();
  animate(0);
  stage.focus();
}

function updateZeroEvent(elapsed, fsmPaused) {
  // B2 삭제 배틀(문 막기·삭제 진행) 동안에는 환각 추격이 일어나지 않고, 진행 중이던 것도 끝낸다.
  if (b2Ending.phase === 'running') {
    if (zeroEventPhase !== 'idle') { zeroEventPhase = 'idle'; zeroEventTimer = 0; zeroEventForced = false; endHallucinationSighting(); }
    return;
  }
  if (hallucinationCaught || fsmPaused) return;
  if (zeroEventForced && zeroEventPhase !== 'charging') zeroEventForced = false;
  if (zeroEventForced && sanity > zeroEventForcedFrom) { zeroEventForced = false; zeroEventPhase = 'idle'; zeroEventTimer = 0; endHallucinationSighting(); } // 정신력이 오르면 진행 중인 추격을 중지한다
  if (sanity > 0 && !zeroEventForced) {
    if (zeroEventPhase !== 'idle') { zeroEventPhase = 'idle'; zeroEventTimer = 0; endHallucinationSighting(); }
    return;
  }
  if (zeroEventPhase === 'idle') { zeroEventPhase = 'waiting'; zeroEventTimer = 0; }
  if (zeroEventPhase === 'waiting') {
    // 플래시를 쓸 수 없는 동안(배터리 0%·충전 중)은 돌진까지의 시간을 처음부터 다시 센다: 피할 수단 없이 삼켜지지 않게.
    if (phoneBattery <= 0 || phoneDock) { zeroEventTimer = 0; return; }
    zeroEventTimer += elapsed;
    const waitFor = zeroEventEvasions > 0 ? zeroEventRetryWaitMs : zeroEventChargeWaitMs;
    if (zeroEventTimer >= waitFor) startZeroCharge();
    return;
  }
  if (zeroEventPhase === 'charging') {
    // 충전하거나 배터리가 떨어진 동안에는 방어할 수 없는 공격을 남기지 않는다.
    if (phoneBattery <= 0 || phoneDock) { resolveZeroEvasion(); return; }
    const side = Math.sign(zeroEventGhostX - body.position.x) || zeroEventSide;
    if (side !== zeroEventSide) {
      zeroEventSide = side;
      zeroEventLightTime = 0;
      const direction = side < 0 ? '왼쪽' : '오른쪽';
      flashPrompt.textContent = direction + '에서 발소리 · ' + direction + '을 비추세요 (F)';
    }
    zeroEventTimer += elapsed;
    const beamX = parseFloat(world.style.getPropertyValue('--beam-x'));
    const beamY = parseFloat(world.style.getPropertyValue('--beam-y'));
    const ahead = (zeroEventGhostX - beamX) * facing;
    const verticalGap = Math.max(floorY - 168 - beamY, beamY - (floorY - 15), 0);
    const onScreen = zeroEventGhostX > cameraX && zeroEventGhostX < cameraX + viewWidth; // 화면 밖에 있는 환각은 빛이 닿은 것으로 치지 않는다
    const inBeam = phoneLightOn && onScreen && ahead > 0 && verticalGap <= ahead * Math.tan(24 * Math.PI / 180);
    zeroEventLightTime = inBeam ? zeroEventLightTime + elapsed : 0;
    if (inBeam) emitGhostLightParticles(elapsed);
    if (zeroEventLightTime >= zeroEventLightHoldMs) { resolveZeroEvasion(); return; }
    zeroEventStepTimer += elapsed;
    if (zeroEventStepTimer >= 650) {
      zeroEventStepTimer %= 650;
      playGameSound('step', { x: zeroEventGhostX });
    }
    if (zeroEventTimer <= zeroEventWarningMs) return;
    const gap = body.position.x - zeroEventGhostX;
    const movingMs = Math.min(elapsed, zeroEventTimer - zeroEventWarningMs);
    const stepPx = Math.min(Math.abs(gap), hallucinationStartDistance / zeroEventCrawlMs * Math.exp((zeroEventTimer - zeroEventWarningMs) / zeroEventAccelMs) * movingMs);
    zeroEventGhostX += Math.sign(gap) * stepPx;
    zeroEventTravel += stepPx;
    if (Math.abs(body.position.x - zeroEventGhostX) <= zeroEventReachGap) triggerDevoured();
  }
}

// ---- 15% 미만: 가끔 멀리서 보이는, 공격하지 않는 환각 ----

function updateAmbientSighting(elapsed, fsmPaused) {
  // 휴대폰·조사창 등으로 멈춘 동안에는 쿨타임을 그대로 두고(재생 중이던 형상은 clearHallucinationEvents가 지운다), 밝은 층에서는 나오지 않는다.
  if (fsmPaused || sanityExposure() === 'bright') return;
  if (hallucinationMode || sanity >= 15 || sanity <= 0) { ambientTimer = 0; return; }
  if (ambientSeenScene === hallucinationSceneKey()) return;
  ambientTimer += elapsed;
  if (ambientTimer < ambientNextIn) return;
  startAmbientSighting();
}

function startAmbientSighting() {
  hallucinationAnchorX = hallucinationSpawnX(420);
  // 가구 가장자리에 서 있게 해 다가갈 때 몸 일부가 자연스럽게 가려진다.
  const props = [...dynamicScene.querySelectorAll('.floor-prop')].filter(element => getComputedStyle(element).display !== 'none');
  const edge = props.map(element => parseFloat(element.style.left) + 18).find(x =>
    Math.abs(x - hallucinationAnchorX) < 120 && Math.abs(x - body.position.x) > 150 &&
    x > cameraX + 64 && x < Math.min(worldWidth - 96, cameraX + viewWidth - 64) &&
    currentDoors.every(door => !['elevator', 'room', 'stairs'].includes(door.type) || x <= door.x - 38 || x >= door.x + door.width + 38));
  if (room === 'dynamic' && edge !== undefined) hallucinationAnchorX = edge;
  hallucinationSide = Math.sign(hallucinationAnchorX - body.position.x) || 1;
  beginHallucinationSighting('ambient', hallucinationSide, Math.abs(hallucinationAnchorX - body.position.x));
  ambientSeenScene = hallucinationSceneKey();
}

// 콘솔 창 버튼용. 컷씬·전환·포획·창이 열려 있는 동안은 정신력 진행처럼 실행하지 않는다.
function hallucinationEventBlocked() {
  return !gameStarted || mainMenuActive || openingActive || blackoutSceneActive || storySceneActive || cctvSceneActive || b2CaptureActive || solarRestoreActive || playerCaught || hallucinationCaught ||
    transitioning || selectingFloor || usingComputer || usingKeypad || usingControl || usingPhone || usingPowerPanel || usingInspection || !wirePanel.hidden || !logPanel.hidden;
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
  playHallucinationSound(mode === 'ambient' ? .5 : 1, mode !== 'charge');
  hallucinationScene = hallucinationSceneKey();
  hallucinationSide = side;
  hallucinationStartDistance = distance;
  hallucinationLife = 0;
  ambientLightFade = 0;
  flashPrompt.hidden = mode !== 'charge';
}

function endHallucinationSighting() {
  hallucinationMode = null;
  ambientTimer = 0;
  ambientNextIn = randomBetween(ambientSightingIntervalRange);
  for (const dot of hallucinations.querySelectorAll(":scope > i")) dot.remove(); // 숨겨진 사이 멈춘 입자가 다음 추격에 다시 보이지 않게 지운다
  hallucinations.hidden = hallucinationEffects.hidden = true;
  delete document.body.dataset.hallucinating;
  hallucinationShadow.hidden = true;
  flashPrompt.hidden = true;
}

function updateHallucinationSighting(elapsed, fsmPaused) {
  if (!hallucinationMode || fsmPaused || hallucinationMode === 'charge') return;
  hallucinationLife += elapsed;
  // 플래시가 형상에 닿으면(화면 안) 0.4초에 걸쳐 서서히 사라진다. 한 번 닿으면 빛이 벗어나도 끝까지 사라진다.
  const beamX = parseFloat(world.style.getPropertyValue('--beam-x'));
  const beamY = parseFloat(world.style.getPropertyValue('--beam-y'));
  const ahead = (hallucinationAnchorX - beamX) * facing;
  const verticalGap = Math.max(floorY - 168 - beamY, beamY - (floorY - 15), 0);
  const lit = phoneLightOn && hallucinationAnchorX > cameraX && hallucinationAnchorX < cameraX + viewWidth &&
    ahead > 0 && verticalGap <= ahead * Math.tan(24 * Math.PI / 180);
  if (lit || ambientLightFade > 0) ambientLightFade += elapsed;
  if (ambientLightFade >= ambientLightFadeMs) { endHallucinationSighting(); return; }
  if (hallucinationLife >= ambientSightingLifeMs || Math.abs(body.position.x - hallucinationAnchorX) < 90) endHallucinationSighting();
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

// ---- 눈 깜빡임 연출과, 20% 미만에서 수호를 둘러보는 붉은 눈 ----

// 붉은 눈(20% 미만): 깜빡일 때마다 수호 양옆과 머리 위를 감싸는 벽에 1~2개씩 늘어나고, wallEyeMaxCount개가 차면 더 생기지 않는다.
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

let darkFaceForced = false; // 콘솔의 점프스케어 버튼으로 낸 얼굴: 체력·쿨타임과 상관없이 2초 동안 보이지만, 불이 꺼진 어둠 속이 아니면 나오지 않는다

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
  if (darkFaceForced && sanityExposure() !== 'dark') { darkFace.hidden = true; darkFaceForced = false; return; }
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

// 정신력 0%의 눈 연출: 깜빡일 때마다 30% 확률로 눈 그림 넷 중 하나가 화면 전체를 0.1초 덮는다(깜빡임 화면 대신).
const eyeFlash = document.getElementById('eye-flash');
const eyeFlashImage = eyeFlash.querySelector('img');
const eyeFlashSources = [1, 2, 3, 4].map(n => `assets/ui/hallucination/eye-flash-${n}.jpg`);
const eyeFlashChance = .3;
const eyeFlashMs = 100;
let eyeFlashTimer = 0;
for (const src of eyeFlashSources) new Image().src = src; // 미리 받아 둬서 0.1초 안에 바로 뜬다

function showEyeFlash() {
  eyeFlashImage.src = eyeFlashSources[Math.floor(Math.random() * eyeFlashSources.length)];
  eyeFlash.dataset.active = 'true';
  eyeFlashTimer = eyeFlashMs;
}

function debugTriggerEyeFlash() {
  if (hallucinationEventBlocked()) return false;
  showEyeFlash();
  return true;
}

function debugTriggerJumpscare() {
  if (sanityExposure() !== 'dark') return false;
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
  if (eyeFlashTimer > 0) {
    eyeFlashTimer -= elapsed;
    if (eyeFlashTimer <= 0) eyeFlash.dataset.active = 'false';
  }
  if (fsmPaused || fearTier < 2) { blinkTimer = 0; return; }
  if (!Number.isFinite(blinkNextIn) || blinkNextIn === Infinity) blinkNextIn = randomBetween(blinkIntervalRangeByTier[fearTier] || blinkIntervalRangeByTier[2]);
  blinkTimer += elapsed;
  if (blinkTimer < blinkNextIn) return;
  blinkTimer = 0;
  blinkNextIn = randomBetween(blinkIntervalRangeByTier[fearTier] || blinkIntervalRangeByTier[2]);
  // 정신력 0%에서는 깜빡임 화면 대신 30% 확률로 눈 그림이 잠깐 화면을 덮는다.
  if (sanity <= 0) { if (Math.random() < eyeFlashChance) showEyeFlash(); }
  else { blinkFlash.dataset.active = 'true'; blinkFlashTimer = 180; }
  if (fearTier >= 4) spawnRedEyes();
}

function updateSanity(elapsed) {
  // 컷씬·장면 전환·포획과 문서를 읽는 동안은 공포 진행을 멈춘다.
  const paused = storySceneActive || b2CaptureActive || solarRestoreActive || openingActive || blackoutSceneActive || cctvSceneActive || playerCaught || hallucinationCaught || transitioning ||
    usingComputer || usingKeypad || usingControl || usingPowerPanel || usingInspection || !wirePanel.hidden || !logPanel.hidden;
  const fsmPaused = paused || selectingFloor || usingPhone;
  // 휴대폰을 연 것만으로는 진행 중인 추격 환각을 지우지 않는다(추격은 휴대폰을 연 채로도 이어진다).
  const chaseHalt = paused || selectingFloor;
  if ((zeroEventPhase === 'charging' ? chaseHalt : fsmPaused) &&(hallucinationMode || !darkFace.hidden || blinkFlashTimer > 0 || eyeFlashTimer > 0 || redEyeShards.childElementCount)) clearHallucinationEvents();
  const exposure = sanityExposure();
  // B2 엔딩 중에는 R-01에게 쫓겨도 줄지 않는다: 정신력은 로봇 속도(45% 규칙, b2-ending.js)를 정하는 데 쓰인다.
  const chasing = (guardPatrol.mode === 'chase' || roamer.mode === 'chase') && !bossFightActive && b2Ending.phase !== 'running';
  if (!paused) {
    // 정신 불안 임무: 첫 컷씬을 본 뒤 항불안제를 쓰기 전까지는 어디서든 천천히 줄어든다(추격 중에는 추격 감소량 적용).
    const anxiety = collectedItems.has('story-anxiety-seen') && !collectedItems.has('f16-antianxiety-used') && !collectedItems.has('b2-antianxiety-used');
    // 항불안제를 먹은 뒤 antianxietyCalmMs 동안은 무엇에도 닳지 않는다. 어둠 속 플래시는 감소를 막지 못하고 절반으로 줄인다.
    const previousCalm = antianxietyCalm;
    antianxietyCalm = Math.max(0, antianxietyCalm - elapsed);
    if (previousCalm > 0 && antianxietyCalm === 0) sayLine('진정 효과가 끝났다. 어둠 속에서는 다시 정신력이 줄어든다.');
    const darkDrain = sanityDarkDrainPerSecond * (solarEnabled ? 1 : sanityPreSolarDrainFactor);
    const rate = antianxietyCalm > 0 ? 0 : chasing ? -sanityChaseDrainPerSecond : anxiety ? -sanityAnxietyDrainPerSecond :
      exposure === 'dark' ? -darkDrain : exposure === 'flashlight' ? -darkDrain * sanityFlashlightDrainFactor : 0;
    // 쫓기는 동안의 감소는 10%에서 멈춘다(이미 10% 아래면 쫓겨서는 더 줄지 않는다).
    const lowest = chasing ? Math.min(sanity, sanityChaseFloor) : 0;
    sanity = Math.max(lowest, Math.min(100, sanity + rate * elapsed / 1000));
  }
  const tier = sanityTierOf(sanity);
  if (tier !== fearTier) { fearTier = tier; document.body.dataset.fearTier = String(fearTier); }
  const deskSrc = `assets/objects/floor17/workstation${fearTier >= 3 ? '-fear' : ''}.png`;
  if (officeDeskImage.getAttribute('src') !== deskSrc) officeDeskImage.src = deskSrc;
  fearOverlayRed.style.opacity = String(Math.max(0, Math.min(1, (30 - sanity) / 10)) * (fearTier >= 1 ? .7 : 0));
  if (fearTier < 4 && redEyes.children.length) { redEyes.replaceChildren(); redEyeShards.replaceChildren(); }
  document.body.dataset.weary = String(fearTier >= 3);
  updateComputerFear(fearTier >= 4);
  updateBlink(elapsed, fsmPaused);
  updateDarkFace(elapsed, fsmPaused);
  updateZeroEvent(elapsed, chaseHalt);
  updateAmbientSighting(elapsed, fsmPaused);
  updateHallucinationSighting(elapsed, fsmPaused);
  refreshSanity();
}

function renderHallucination() {
  if (hallucinationMode && (hallucinationScene !== hallucinationSceneKey() || selectingFloor)) clearHallucinationEvents();
  if (!hallucinationMode) return;
  hallucinations.hidden = hallucinationShadow.hidden = hallucinationEffects.hidden = false;
  hallucinationEffects.dataset.mode = hallucinationMode;
  document.body.dataset.hallucinating = 'true';
  hallucinations.dataset.mode = hallucinationMode;
  flashPrompt.hidden = hallucinationMode !== 'charge';
  const charging = hallucinationMode === 'charge';
  const life = charging ? zeroEventTimer : hallucinationLife;
  const x = charging ? zeroEventGhostX : hallucinationAnchorX;
  const fadeOut = charging ? 1 : Math.min(1, (ambientSightingLifeMs - life) / 600) * (1 - ambientLightFade / ambientLightFadeMs);
  // 추격 환각의 선명도: 수호가 보는 쪽에 있으면 거의 곧바로 비교적 선명하고, 등 뒤에 있으면 처음엔 거의 흐릿하다가 가까워질수록 뚜렷해진다.
  let visibility = 1, fadeInMs = zeroEventGhostFadeInMs;
  if (charging) {
    const closeness = Math.max(0, Math.min(1, 1 - Math.abs(body.position.x - x) / (hallucinationStartDistance || zeroEventGhostStartGap)));
    const inView = Math.sign(x - body.position.x) === facing;
    visibility = inView ? .65 + .35 * closeness : .08 + .92 * Math.pow(closeness, 1.4);
    if (inView) fadeInMs = 120;
    hallucinationShadow.style.setProperty('--ghost-blur', ((1 - visibility) * 3).toFixed(2) + 'px');
  }
  hallucinationShadow.style.opacity = String(Math.max(0, Math.min(1, life / fadeInMs) * fadeOut * visibility));
  hallucinationShadow.style.left = (x - 96) + 'px';
  hallucinationShadow.style.top = (floorY - 178) + 'px';
  hallucinationShadow.style.transform = 'scaleX(' + (charging ? Math.sign(body.position.x - x) || 1 : -hallucinationSide) + ')';
  const walking = charging && life > zeroEventWarningMs;
  hallucinationShadow.dataset.walking = String(walking);
  // 추격(돌진)은 걷고 달리는 형상(ghost-chase.png), 멀리 보이는 형상은 수호의 그림자 형태다.
  hallucinationShadow.dataset.form = charging ? 'ghost' : 'shadow';
  if (charging) {
    // 추격 환각: 똑바로 서 있다가(정지) 점점 몸을 숙이며 달려온다. 그림은 왼쪽을 보고 있어서 수호가 오른쪽에 있으면 뒤집는다.
    const ghostWidth = 380, ghostHeight = ghostWidth * 330 / 300; // 칸 300×330, 발이 칸 아래에서 4px 위
    const moving = Math.max(0, life - zeroEventWarningMs);
    // 정지 중에는 서 있는 자세(chase 0번), 처음 달려올 때는 chase 1~9번을 순서대로, 그다음부터는 run 0~9번을 반복한다.
    // 걸음은 시간이 아니라 걸어온 거리에 맞춘다: 천천히 올 때는 느리게, 빨라질수록 빨리 바뀌어 발이 미끄러져 보이지 않는다.
    const transitionPx = 9 * ghostPoseStepPx;
    const travel = zeroEventTravel;
    // 지금 칸과 다음 칸 둘을 겹쳐 사이를 섞는다(blend 0~1): 칸이 툭툭 바뀌지 않고 부드럽게 이어진다.
    let pose, frame, poseNext, frameNext, blend = 0;
    if (moving === 0) { pose = poseNext = 'chase'; frame = frameNext = 0; }
    else if (travel < transitionPx) {
      const u = travel / ghostPoseStepPx; frame = 1 + Math.floor(u); blend = u - Math.floor(u); pose = 'chase';
      if (frame < 9) { poseNext = 'chase'; frameNext = frame + 1; } else { poseNext = 'run'; frameNext = 0; }
    } else {
      const v = (travel - transitionPx) / ghostRunStepPx; frame = Math.floor(v) % 10; blend = v - Math.floor(v); pose = poseNext = 'run'; frameNext = (frame + 1) % 10;
    }
    hallucinationShadow.dataset.pose = pose;
    hallucinationShadow.dataset.poseNext = poseNext;
    hallucinationShadow.style.setProperty('--frame', String(frame));
    hallucinationShadow.style.setProperty('--frame-next', String(frameNext));
    hallucinationShadow.style.setProperty('--blend', blend.toFixed(3));
    const flip = -(Math.sign(body.position.x - x) || 1); // 그림은 왼쪽을 본다: 수호가 오른쪽이면 -1로 뒤집는다
    hallucinationShadow.style.transform = 'scaleX(' + flip + ')';
    const headX = ghostWidth * 105 / 300; // 시트에서 머리가 있는 자리(칸 왼쪽에서 105px)가 환각의 위치 x에 오도록 맞춘다
    Object.assign(hallucinationShadow.style, { width: ghostWidth + 'px', height: ghostHeight + 'px',
      left: (x - (flip === 1 ? headX : ghostWidth - headX)) + 'px', top: (floorY - ghostHeight * 326 / 330) + 'px' });
  } else {
    Object.assign(hallucinationShadow.style, { width: '192px', height: '192px', left: (x - 96) + 'px', top: (floorY - 178) + 'px' });
  }
  hallucinationShadow.style.setProperty('--stride', walking ? (-Math.floor((life - zeroEventWarningMs) / 160) % 8 * 192) + 'px' : '0px');
}

refreshSanity();

// 층 배경 그림 속 모니터. 키는 'assets/background/' 아래 그림 이름(확장자 제외), 값은 [그림 가로, 세로, 종류, 화면들]이다.
// 종류 'glass'는 복도 유리벽 너머로 보이는 모니터(화질을 더 낮춰 흐릿하게), 'room'은 방 안에서 보이는 모니터. 모니터를 모두 확인한 그림만 올렸다.
// 화면은 [x0, y0, x1, y1]이고 그림 픽셀 좌표다. 그림을 장면에 놓을 때(scene-builder.js) 그 자리에 .fear-screen을 얹는다.
// 다섯째 값 [x, 폭]: 출구 문 칸(cutaway_kit.door_bay, 방 설정 exitBay)을 끼우기 전 그림의 x에 그 폭의 칸이 들어갔다. 화면 좌표는 칸을 끼우기 전
// 그림 기준이고, 그 x 오른쪽 화면은 칸 폭만큼 밀린다. 그림 가로는 칸을 넣은 뒤의 값이다.
const BACKGROUND_MONITORS = {
  'floor03/floor03-cs-interior': [2168, 475, 'room', [[73, 325, 127, 365], [325, 325, 379, 365], [475, 325, 529, 365], [595, 325, 649, 365],
    [688, 325, 742, 365], [781, 325, 835, 365], [874, 325, 928, 365], [967, 325, 1021, 365], [1060, 325, 1114, 365], [1153, 325, 1207, 365],
    [1246, 325, 1300, 365], [1339, 325, 1393, 365], [1459, 325, 1513, 365]], [858, 322]],
  'floor03/floor03-studio-interior': [1840, 475, 'room', [[1078, 310, 1136, 364]]],
  'floor04/floor04-lab-interior': [2998, 475, 'room', [[227, 318, 277, 359], [279, 318, 329, 359], [331, 318, 381, 358], [585, 318, 635, 359],
    [637, 318, 687, 359], [689, 318, 739, 358], [929, 318, 979, 358], [981, 318, 1031, 359], [1033, 318, 1083, 359], [1301, 318, 1351, 359],
    [1353, 318, 1403, 359], [1405, 318, 1455, 358], [1645, 318, 1695, 358], [1697, 318, 1747, 359], [1749, 318, 1799, 359],
    [393, 340, 423, 371], [751, 340, 781, 371], [887, 340, 917, 371], [1467, 340, 1497, 371], [1603, 340, 1633, 371]], [30, 322]],
  'floor05/floor05-security-interior': [2168, 475, 'room', [[510, 322, 566, 367], [566, 322, 622, 367]], [30, 322]],
  'floor10/floor10-office-interior': [3000, 475, 'room', [[456, 326, 506, 367], [600, 325, 651, 367], [820, 326, 870, 367], [964, 325, 1015, 367],
    [1177, 325, 1228, 367], [1322, 326, 1372, 367], [1548, 326, 1598, 367], [1692, 325, 1743, 367], [1905, 325, 1956, 367],
    [2050, 326, 2100, 367], [2272, 325, 2322, 367], [2410, 325, 2461, 367]], [30, 322]],
  'floor10/floor10-executive-interior': [2144, 475, 'room', [[319, 290, 365, 326]], [30, 322]],
};

function addBackgroundMonitors(image, src) {
  const entry = BACKGROUND_MONITORS[src.replace(/^assets\/background\/|\.png$/g, '')];
  if (!entry) return;
  const [naturalWidth, naturalHeight, kind, rects, [bayX, bay] = [Infinity, 0]] = entry;
  const left = parseFloat(image.style.left) || 0, top = parseFloat(image.style.top) || 0;
  const sx = parseFloat(image.style.width) / naturalWidth, sy = parseFloat(image.style.height) / naturalHeight;
  for (const [rx0, y0, rx1, y1] of rects) {
    const x0 = rx0 >= bayX ? rx0 + bay : rx0, x1 = x0 + rx1 - rx0;
    const screen = fearScreenElement([0, 0, 1, 1]);
    if (kind === 'glass') screen.classList.add('glass');
    Object.assign(screen.style, { left: `${left + x0 * sx}px`, top: `${top + y0 * sy}px`, width: `${(x1 - x0) * sx}px`, height: `${(y1 - y0) * sy}px` });
    image.after(screen);
  }
}

// 컷씬 시작 시 휴대폰과 진행 중인 기척을 정리한다.
function clearEventsForCutscene() {
  closePhone();
  if (phoneLightOn) { phoneLightOn = false; refreshPhone(); }
  clearHallucinationEvents();
}

// 조사·컷씬·탑승·장면 전환은 진행 중인 형상을 끝낸다.
function clearHallucinationEvents() {
  endHallucinationSighting();
  zeroEventPhase = 'idle'; zeroEventTimer = 0; zeroEventForced = false;
  zeroEventLightTime = zeroEventStepTimer = 0;
  darkFace.hidden = true; darkFaceForced = false; darkFaceTimer = darkFaceLife = 0;
  blinkFlash.dataset.active = 'false'; blinkFlashTimer = 0;
  eyeFlash.dataset.active = 'false'; eyeFlashTimer = 0;
  redEyeShards.replaceChildren();
}

// 플래시가 닿는 동안 유령 표면(빛과 맞닿는 수호 쪽 가장자리)에서 하얀 입자가 위로 올라가며 사라진다.
const ghostPoseStepPx = 26; // 서 있다가 달리기로 넘어가는 9컷이 한 칸 바뀌는 데 걷는 거리(px)
const ghostRunStepPx = 40; // 달리기 한 칸이 바뀌는 데 걷는 거리(px)
let ghostParticleTimer = 0;
function emitGhostLightParticles(elapsed) {
  ghostParticleTimer += elapsed;
  while (ghostParticleTimer >= 28) {
    ghostParticleTimer -= 28;
    const dot = document.createElement('i');
    const size = 2 + Math.random() * 3;
    Object.assign(dot.style, { left: `${zeroEventGhostX - zeroEventSide * 40 + (Math.random() - .5) * 40}px`,
      top: `${floorY - 60 - Math.random() * 120}px`, width: `${size}px`, height: `${size}px`,
      animationDuration: `${.6 + Math.random() * .5}s` });
    dot.style.setProperty('--dx', `${(Math.random() - .5) * 30}px`);
    dot.style.setProperty('--dy', `${-(40 + Math.random() * 70)}px`);
    dot.addEventListener('animationend', () => dot.remove());
    hallucinations.append(dot);
  }
}
