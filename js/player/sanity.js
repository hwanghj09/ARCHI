// 빛 노출은 실제 암전 마스크의 상태를 따른다. 휴대폰은 어둠을 없애지 않고 정신력 감소만 막는다.
const sanityHud = document.getElementById('sanity-hud');
const sanityValue = document.getElementById('sanity-value');
const sanityMeter = document.getElementById('sanity-meter');
const sanityFill = document.getElementById('sanity-fill');
const sanityState = document.getElementById('sanity-state');
const hallucinations = document.getElementById('hallucinations');
const hallucinationShadow = document.getElementById('hallucination-shadow');
let hallucinationTime = 0;

function sanityExposure() {
  // 1인칭 엘리베이터 안에는 플레이어의 손전등 빛이 표시되지 않는다.
  if (selectingFloor) return buildingBlackout ? 'dark' : 'bright';
  const dark = world.dataset.localLight !== 'true' && (world.dataset.blackout === 'true' ||
    (currentSceneFloor === 17 && world.dataset.lights === 'off') ||
    (room === 'dynamic' && world.dataset.dark === 'true'));
  return !dark ? 'bright' : phoneLightOn && phoneBattery > 0 ? 'flashlight' : 'dark';
}

function refreshSanity() {
  const percent = Math.ceil(sanity);
  const state = sanity === 0 ? 'hallucinating' : sanity <= 25 ? 'low' : 'normal';
  if (sanityValue.value !== `${percent}%`) sanityValue.value = `${percent}%`;
  if (sanityMeter.getAttribute('aria-valuenow') !== String(percent)) sanityMeter.setAttribute('aria-valuenow', String(percent));
  sanityFill.style.width = `${percent}%`;
  sanityHud.dataset.state = state;
  const label = state === 'hallucinating' ? '환각' : state === 'low' ? '불안' : '안정';
  if (sanityState.textContent !== label) sanityState.textContent = label;
}

function updateSanity(elapsed) {
  // 컷씬·장면 전환·포획과 문서를 읽는 동안은 공포 진행을 멈춘다.
  const paused = openingActive || blackoutSceneActive || playerCaught || transitioning ||
    usingComputer || usingKeypad || usingPhone || usingPowerPanel || usingInspection;
  const exposure = sanityExposure();
  const before = sanity;
  if (!paused) {
    const rate = exposure === 'dark' ? -sanityDrainPerSecond : exposure === 'bright' ? sanityRecoveryPerSecond : 0;
    sanity = Math.max(0, Math.min(100, sanity + rate * elapsed / 1000));
    if (before > 0 && sanity === 0) showStatus('정신력이 모두 소진됐다. 어둠 속에서 보이지 않아야 할 사람이 보인다… 밝은 곳을 찾아야 한다.', 6000);
  }
  const active = !paused && exposure === 'dark' && sanity === 0;
  hallucinationTime = active ? (hallucinations.hidden ? 0 : hallucinationTime + elapsed) : 0;
  hallucinations.hidden = !active;
  // 9초마다 1.8초씩 나타난다. 환각은 물리 몸체·상호작용·포획을 만들지 않는다.
  hallucinationShadow.hidden = !active || hallucinationTime % 9000 >= 1800;
  refreshSanity();
}

function renderHallucination() {
  if (hallucinations.hidden || hallucinationShadow.hidden) return;
  const cycle = Math.floor(hallucinationTime / 9000);
  const direction = (cycle % 2 ? -1 : 1) * facing;
  const width = selectingFloor ? Math.min(260, stage.clientHeight * .4) : Math.min(224 * scale, stage.clientWidth * .4);
  const drift = hallucinationTime % 9000 / 1800;
  let targetX = selectingFloor ? stage.clientWidth * .28 :
    (body.position.x - cameraX + direction * (220 + drift * 40)) * scale;
  if (!selectingFloor && stage.clientWidth < 600) {
    targetX = (body.position.x - cameraX) * scale < stage.clientWidth / 2 ? stage.clientWidth - width / 2 - 12 : width / 2 + 12;
  }
  const left = Math.max(12, Math.min(stage.clientWidth - width - 12, targetX - width / 2));
  const top = selectingFloor ? stage.clientHeight * .3 : floorY * scale - 238 * width / 256;
  Object.assign(hallucinationShadow.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${width}px`,
    opacity: String(.45 * Math.sin(Math.PI * Math.min(.95, drift + .12))), transform: `scaleX(${direction})` });
}

refreshSanity();
