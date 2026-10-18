// 타격 뒤에는 실제 월드의 수호·로봇을 움직인다. 암전 중 이동은 생략하고 의식이 돌아오는 순간만 보여 준다.
const b2CaptureScene = document.getElementById('b2-capture-scene');
const b2CaptureView = document.getElementById('b2-capture-view');
const b2CaptureEyelids = document.getElementById('b2-capture-eyelids');
const b2CaptureSkip = document.getElementById('b2-capture-skip');
const unconsciousSheet = document.getElementById('unconscious-sheet');
const dragSheet = document.getElementById('drag-sheet');
const b2CaptureArt = {
  attack: 'assets/ending/b2-capture/robot-strike.png',
  player: 'assets/player/jeong-suho-unconscious.png',
  drag: 'assets/player/jeong-suho-drag-four.png',
  robot: 'assets/objects/guard-robot/guard-transport.png',
};
const b2CaptureShots = [
  { at: 0, phase: 'strike', frame: 0, sound: 'robot-servo' },
  { at: 850, phase: 'strike', frame: 1, sound: 'robot-servo' },
  { at: 1550, phase: 'strike', frame: 2, sound: 'robot-grab' },
  { at: 1750, phase: 'strike', frame: 3, sound: 'cctv-hit' },
  { at: 2150, phase: 'black', room: 'origin', sound: 'heartbeat' },
  { at: 4800, phase: 'drag', route: 'origin', duration: 1400, sound: 'robot-step' },
  { at: 6200, phase: 'black', room: 'b2' },
  { at: 8000, phase: 'drag', route: 'corridor', duration: 1200, sound: 'robot-servo' },
  { at: 9200, phase: 'black', sound: 'heartbeat' },
  { at: 11100, phase: 'drag', route: 'door', duration: 1500, sound: 'robot-step' },
  { at: 12600, phase: 'black', room: 'b2-link', sound: 'door' },
  { at: 14600, phase: 'drag', route: 'lab', duration: 1300, sound: 'robot-step' },
  { at: 15900, phase: 'black' },
  { at: 17400, phase: 'black', sound: 'robot-servo' },
  { at: 18800, phase: 'black', sound: 'shutter' },
  { at: 20100, phase: 'connect', duration: 2200, sound: 'robot-servo' },
  { at: 22300, phase: 'black', sound: 'cctv-beep' },
  { at: 24400, phase: 'connected', duration: 2000, sound: 'cctv-on' },
  { at: 26400, phase: 'black' },
  { at: 27400, phase: 'end' },
];
let b2CaptureActive = false;
let b2CaptureElapsed = 0;
let b2CaptureShot = -1;
let b2CaptureInLab = false;
let b2CaptureBlocked = [];
let b2CaptureOrigin = null;
let b2TransportRobot = null;
let b2ConnectionCable = null;

function preloadB2CaptureArt() {
  for (const src of Object.values(b2CaptureArt)) { const image = new Image(); image.src = src; }
}

function blockB2CaptureInput() {
  for (const element of b2CaptureBlocked) element.inert = false;
  b2CaptureBlocked = [...document.body.children].filter(element => element !== b2CaptureScene && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of b2CaptureBlocked) element.inert = true;
  b2CaptureScene.inert = false;
}

function startB2CaptureScene() {
  if (b2CaptureActive || !b2CaptureScene.hidden) return;
  b2CaptureActive = true;
  b2CaptureElapsed = 0;
  b2CaptureShot = -1;
  b2CaptureInLab = false;
  b2CaptureOrigin = { scene: dynamicFloorId, x: body.position.x };
  b2CaptureScene.removeAttribute('aria-hidden');
  b2CaptureScene.hidden = false;
  b2CaptureSkip.hidden = false;
  b2BadEnding.hidden = true;
  world.dataset.b2Capture = 'true';
  releaseInput();
  blockB2CaptureInput();
  b2CaptureSkip.focus({ preventScroll: true });
  updateB2CaptureScene(0);
}

function setB2CaptureRoom(id) {
  if (id !== dynamicFloorId) performFloorChange(id, null, floorById.get(id).interior ? 'exit' : null);
  playerCaught = true;
  caughtBy = null;
  b2CaptureInLab = id === 'b2-link';
  blockB2CaptureInput();
  if (!b2TransportRobot) {
    b2TransportRobot = document.createElement('div');
    b2TransportRobot.id = 'b2-transport-robot';
    b2TransportRobot.setAttribute('aria-hidden', 'true');
    const image = new Image(); image.src = b2CaptureArt.robot; image.alt = ''; image.draggable = false;
    b2TransportRobot.append(image);
    world.append(b2TransportRobot);
  }
}

function enterB2CaptureLab() { setB2CaptureRoom('b2-link'); }

function showB2Body(frame, x, lift = 0) {
  Body.setPosition(body, { x, y: floorY - 81 - lift });
  Body.setVelocity(body, { x: 0, y: 0 });
  grounded = true; facing = 1;
  sprite.dataset.state = 'unconscious'; sprite.dataset.frame = String(frame); sprite.dataset.phoneHeld = 'false';
  delete sprite.dataset.cutscenePose;
  unconsciousSheet.style.transform = `translateX(${-frame * 100 / 3}%)`;
}

function showB2TransportRobot(frame, x) {
  b2TransportRobot.style.left = `${x - 160}px`;
  b2TransportRobot.style.top = `${floorY - 237 * .625}px`;
  b2TransportRobot.firstElementChild.style.transform = `translateX(${-frame * 25}%)`;
}

function showB2Connection(amount) {
  if (!b2ConnectionCable) {
    b2ConnectionCable = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    b2ConnectionCable.id = 'b2-connection-cable';
    b2ConnectionCable.setAttribute('viewBox', `0 0 ${worldWidth} 720`);
    b2ConnectionCable.setAttribute('aria-hidden', 'true');
    b2ConnectionCable.innerHTML = '<path class="cable-jacket"/><path class="cable-core"/><circle class="connector" r="5"/>';
    world.append(b2ConnectionCable);
  }
  const x = 1045 - 58 * amount, y = 444 + 20 * amount;
  for (const path of b2ConnectionCable.querySelectorAll('path')) path.setAttribute('d', `M 1240 475 C 1170 427 1090 455 ${x} ${y}`);
  const connector = b2ConnectionCable.querySelector('circle');
  connector.setAttribute('cx', x); connector.setAttribute('cy', y);
  b2ConnectionCable.dataset.connected = String(amount >= 1);
}

function updateB2CaptureWorld(shot, age) {
  const progress = Math.min(1, age / shot.duration);
  if (shot.phase === 'drag') {
    const origin = Math.min(b2CaptureOrigin.x, worldWidth - 480);
    const routes = { origin: [origin, origin + 210],
      corridor: [2600, 2790], door: [4030, 4270], lab: [535, 760] };
    const [from, to] = routes[shot.route];
    showB2Body(0, from + (to - from) * progress);
    const frame = Math.floor(age / 150) % 4;
    sprite.dataset.state = 'dragged'; sprite.dataset.frame = String(frame);
    dragSheet.style.transform = `translateX(${-frame * 25}%)`;
    showB2TransportRobot(Math.floor(age / 180) % 2, body.position.x + 168);
    if (shot.route === 'door') {
      const door = currentDoors.find(entry => entry.target === 'b2-link');
      if (door) door.element.dataset.open = String(progress > .6);
    }
  } else {
    showB2Body(2, 930, 20);
    showB2TransportRobot(3, 1115);
    showB2Connection(shot.phase === 'connected' ? 1 : Math.min(1, age / 1500));
  }
  const center = body.position.x + 45;
  cameraZoom = Math.min(matchMedia('(prefers-reduced-motion: reduce)').matches ? 1.35 : 1.65, viewWidth / 410);
  cameraFocus.x = center; cameraFocus.y = floorY - 60;
  cameraX = Math.max(0, Math.min(worldWidth - viewWidth, center - viewWidth / 2));
  const shake = shot.phase === 'drag' && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 1.1 : 0;
  cameraShake.x = shake * Math.sin(age * .018); cameraShake.y = shake * Math.sin(age * .027);
}

function updateB2CaptureScene(delta) {
  if (!b2CaptureActive) return;
  b2CaptureElapsed += delta;
  while (b2CaptureShot + 1 < b2CaptureShots.length && b2CaptureElapsed >= b2CaptureShots[b2CaptureShot + 1].at) {
    const shot = b2CaptureShots[++b2CaptureShot];
    if (shot.phase === 'end') return finishB2CaptureScene();
    b2CaptureScene.dataset.phase = shot.phase;
    b2CaptureView.dataset.frame = String(shot.frame ?? 0);
    if (shot.room) setB2CaptureRoom(shot.room === 'origin' ? b2CaptureOrigin.scene : shot.room);
    if (shot.sound) playGameSound(shot.sound);
  }
  const shot = b2CaptureShots[b2CaptureShot], age = b2CaptureElapsed - shot.at;
  const open = shot.duration ? Math.min(1, age / 230, (shot.duration - age) / 300) : shot.phase === 'black' ? 0 : 1;
  b2CaptureEyelids.style.setProperty('--eye-open', String(Math.max(0, open)));
  if (shot.duration) updateB2CaptureWorld(shot, age);
}

function finishB2CaptureScene() {
  if (!b2CaptureActive) return;
  enterB2CaptureLab();
  showB2Body(2, 930, 20); showB2TransportRobot(3, 1115); showB2Connection(1);
  b2CaptureActive = false;
  b2CaptureScene.dataset.phase = 'complete';
  b2CaptureScene.inert = true;
  b2CaptureScene.setAttribute('aria-hidden', 'true');
  b2CaptureEyelids.style.setProperty('--eye-open', '0');
  b2CaptureSkip.hidden = true;
  b2BadEnding.inert = false; b2BadEnding.hidden = false;
  document.getElementById('b2-checkpoint').focus({ preventScroll: true });
}

function resetB2CaptureScene() {
  b2CaptureActive = false; b2CaptureElapsed = 0; b2CaptureShot = -1; b2CaptureInLab = false;
  b2CaptureScene.hidden = true; b2CaptureScene.inert = false; b2CaptureScene.removeAttribute('aria-hidden');
  for (const element of b2CaptureBlocked) element.inert = false;
  b2CaptureBlocked = [];
  b2TransportRobot?.remove(); b2TransportRobot = null;
  b2ConnectionCable?.remove(); b2ConnectionCable = null;
  delete world.dataset.b2Capture;
  cameraZoom = 1; cameraShake.x = cameraShake.y = 0;
}

b2CaptureSkip.addEventListener('click', finishB2CaptureScene);
