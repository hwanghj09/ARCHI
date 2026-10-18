// 실제 플레이어와 월드는 옥상에 둔 채 17층의 기존 복도 그림·문만 비춘다.
const solarRestoreScene = document.getElementById('solar-restore-scene');
const solarRestoreView = document.getElementById('solar-restore-view');
const solarRestoreCamera = document.getElementById('solar-restore-camera');
const solarRestoreCaption = document.getElementById('solar-restore-caption');
const solarRestoreFlickers = [1100, 1180, 1370, 1460, 1690, 1790, 2060, 2160, 2450];
let solarRestoreElapsed = 0;
let solarRestoreReady = false;
let solarRestoreBlocked = [];

function startSolarRestoreScene() {
  if (solarRestoreActive || mainMenuActive || restoringProgress) return;
  if (usingPowerPanel) closePowerPanel();
  clearEventsForCutscene();
  releaseInput();
  Body.setVelocity(body, { x: 0, y: body.velocity.y });
  solarRestoreActive = true;
  solarRestoreElapsed = 0;
  solarRestoreReady = false;
  solarRestoreScene.hidden = false;
  solarRestoreScene.style.opacity = '0';
  solarRestoreScene.dataset.light = 'off';
  solarRestoreScene.dataset.phase = 'depart';
  solarRestoreCaption.textContent = '태양광 전력을 연결하는 중…';
  const fixtures = document.getElementById('solar-restore-fixtures');
  fixtures.replaceChildren(...doors.filter(door => door.type === 'elevator' || door.type === 'stairs').map(door => {
    const clone = door.element.cloneNode(true);
    clone.removeAttribute('id');
    for (const element of clone.querySelectorAll('[id]')) element.removeAttribute('id');
    clone.dataset.open = 'false';
    return clone;
  }));
  solarRestoreBlocked = [...document.body.children].filter(element => element !== solarRestoreScene && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of solarRestoreBlocked) element.inert = true;
  document.getElementById('solar-restore-skip').focus({ preventScroll: true });
  Promise.all([...solarRestoreScene.querySelectorAll('img')].map(image => image.decode())).then(() => {
    if (solarRestoreActive) solarRestoreReady = true;
  }).catch(() => finishSolarRestoreScene());
}

function updateSolarRestoreScene(elapsed) {
  if (!solarRestoreReady) return;
  solarRestoreElapsed += elapsed;
  const time = solarRestoreElapsed;
  if (time >= 4700) return finishSolarRestoreScene();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phase = time < 400 ? 'depart' : time < 1100 ? 'dark' : time < 2700 ? 'flicker' : time < 4000 ? 'lit' : 'return';
  solarRestoreScene.dataset.phase = phase;
  solarRestoreScene.style.opacity = String(time < 400 ? time / 400 : time > 4300 ? (4700 - time) / 400 : 1);
  solarRestoreView.style.opacity = String(Math.max(0, Math.min(1, (time - 400) / 400, (4300 - time) / 300)));
  const on = time >= 2700 || (!reduced && solarRestoreFlickers.filter(at => time >= at).length % 2 === 1);
  const light = on ? 'on' : 'off';
  if (solarRestoreScene.dataset.light !== light) {
    solarRestoreScene.dataset.light = light;
    playGameSound('switch');
  }
  solarRestoreCaption.textContent = time >= 2700 ? '17층에 불이 들어왔다.' : '태양광 전력을 연결하는 중…';
  const scale = Math.max(innerHeight / 760, innerWidth / 1600);
  const center = 2255 + (reduced ? 0 : 30 * (1 - Math.min(1, time / 4000)));
  solarRestoreCamera.style.transform = `translate(${-center * scale}px, ${-380 * scale}px) scale(${scale})`;
}

function resetSolarRestoreScene() {
  solarRestoreActive = solarRestoreReady = false;
  solarRestoreScene.hidden = true;
  document.getElementById('solar-restore-fixtures').replaceChildren();
  for (const element of solarRestoreBlocked) element.inert = false;
  solarRestoreBlocked = [];
}

function finishSolarRestoreScene() {
  if (!solarRestoreActive) return;
  resetSolarRestoreScene();
  collectedItems.add('story-solar-17-seen');
  world.dataset.lights = 'on';
  document.getElementById('floor17-lights').checked = true;
  updatePowerState();
  refreshObjective();
  saveProgress();
  stage.focus({ preventScroll: true });
}

document.getElementById('solar-restore-skip').addEventListener('click', finishSolarRestoreScene);
