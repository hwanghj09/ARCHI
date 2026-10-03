// R-01 keeps its position when the player leaves the lobby. Patrol uses the game's paused clock.
const guardPatrol = { x: 4530, facing: -1, wait: 0, elapsed: 0, mode: 'patrol', alertTime: 0,
  lostTime: 0, captureTime: 0, door: null, image: null };
const guardCapturePanel = document.getElementById('guard-capture');
let guardBlocked = [];

function releaseGuardCapture() {
  playerCaught = false;
  guardPatrol.mode = 'patrol';
  guardPatrol.alertTime = guardPatrol.lostTime = guardPatrol.captureTime = 0;
  guardCapturePanel.hidden = true;
  for (const element of guardBlocked) element.inert = false;
  guardBlocked = [];
  animate(0);
}

function catchPlayer() {
  const robot = guardPatrol;
  playerCaught = true;
  robot.mode = 'grab'; robot.captureTime = 0;
  robot.facing = body.position.x >= robot.x ? 1 : -1;
  facing = -robot.facing;
  phoneHeld = phoneLightOn = false;
  refreshPhone();
  releaseInput();
  Body.setVelocity(body, { x: 0, y: 0 });
  hint.hidden = interactionOutline.hidden = true;
  guardBlocked = [...document.body.children].filter(element => element !== guardCapturePanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of guardBlocked) element.inert = true;
}

document.getElementById('guard-retry').addEventListener('click', () => {
  if (!playerCaught) return;
  releaseGuardCapture();
  Object.assign(guardPatrol, { x: 4530, facing: -1, wait: 0, elapsed: 0 });
  performFloorChange('f1');
  releaseInput(); stage.focus();
  showStatus('로비 엘리베이터 앞에서 다시 시작합니다. 수집한 단서는 유지됩니다.');
});

function mountGuardPatrol() {
  guardPatrol.door = room === 'dynamic' && dynamicFloorId === 'f1' ?
    currentDoors.find(door => door.style === 'guard-bot') : null;
  guardPatrol.image = null;
  if (!guardPatrol.door) return;
  const dock = new Image();
  dock.className = 'robot-dock-patch';
  dock.src = 'assets/objects/guard-robot/empty-dock.png';
  dock.alt = ''; dock.draggable = false;
  dynamicScene.insertBefore(dock, guardPatrol.door.element);
  const window = document.createElement('div');
  window.className = 'guard-robot-sprite';
  const image = new Image();
  image.src = 'assets/objects/guard-robot/guard-patrol.png';
  image.alt = ''; image.draggable = false;
  window.append(image);
  guardPatrol.door.element.replaceChildren(window);
  guardPatrol.image = image;
  updateGuardPatrol(0);
}

function updateGuardPatrol(delta) {
  const robot = guardPatrol;
  if (!robot.door) return;
  const { left, right, speed, pause } = robot.door.patrol;
  const powered = world.dataset.powered === 'true';
  if (!powered) {
    if (playerCaught) { releaseGuardCapture(); stage.focus(); }
    robot.mode = 'patrol'; robot.alertTime = robot.lostTime = 0;
  } else if (playerCaught) {
    robot.captureTime += delta;
    Body.setPosition(body, { x: robot.x + robot.facing * 82, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true;
    if (robot.captureTime >= 900 && guardCapturePanel.hidden) {
      robot.mode = 'caught';
      guardCapturePanel.hidden = false;
      document.getElementById('guard-retry').focus();
    }
  } else if (delta > 0) {
    const dx = body.position.x - robot.x;
    const sameLevel = Math.abs(body.bounds.max.y - floorY) < 180;
    const seesPlayer = sameLevel && (Math.abs(dx) < 65 || (dx * robot.facing > 0 && Math.abs(dx) < 360));
    if (robot.mode === 'patrol' && seesPlayer) {
      robot.mode = 'alert'; robot.alertTime = 0;
      showStatus('경비 로봇이 수호를 감지했다. 거리를 벌려야 한다.', 2400);
    }
    if (robot.mode === 'alert') {
      robot.alertTime += delta;
      if (robot.alertTime >= 450) robot.mode = 'chase';
    }
    if (robot.mode === 'chase') {
      robot.lostTime = sameLevel && Math.abs(dx) < 600 ? 0 : robot.lostTime + delta;
      if (robot.lostTime >= 1800) { robot.mode = 'patrol'; robot.wait = 0; }
      else {
        robot.facing = dx >= 0 ? 1 : -1;
        const distance = Math.min(Math.abs(dx), 270 * delta / 1000);
        robot.x = Math.max(80, Math.min(worldWidth - 80, robot.x + robot.facing * distance));
        robot.elapsed += delta;
        if (grounded && Math.abs(body.bounds.max.y - floorY) < 3 && Math.abs(body.position.x - robot.x) <= 84) catchPlayer();
      }
    }
  }
  if (powered && !playerCaught && robot.mode === 'patrol') {
    if (robot.wait > 0) {
      robot.wait = Math.max(0, robot.wait - delta);
      if (robot.wait === 0) robot.facing *= -1;
    } else {
      if (robot.x < left) robot.facing = 1;
      else if (robot.x > right) robot.facing = -1;
      const target = robot.facing < 0 ? left : right;
      robot.x += robot.facing * Math.min(Math.abs(target - robot.x), speed * delta / 1000);
      robot.elapsed += delta;
      if (robot.x === left || robot.x === right) robot.wait = pause;
    }
  }
  const attack = powered && robot.mode !== 'patrol';
  const frame = !powered ? 7 : robot.mode === 'alert' ? 0 : robot.mode === 'chase' ? 1 :
    playerCaught ? (robot.captureTime < 220 ? 2 : robot.captureTime < 440 ? 3 : robot.captureTime < 660 ? 4 : 5) :
    robot.wait > 0 ? 4 + Math.min(2, Math.floor((pause - robot.wait) / (pause / 3))) : Math.floor(robot.elapsed / 120) % 4;
  const { door } = robot;
  door.x = robot.x - door.width / 2;
  door.y = floorY - 124;
  door.outline = [robot.x - 39, floorY - 124, 78, 124];
  Object.assign(door.element.style, { left: `${robot.x - 80}px`, top: `${floorY - 237 * .625}px`, width: '160px', height: '160px' });
  door.element.dataset.patrol = !powered ? 'off' : attack ? robot.mode : robot.wait > 0 ? 'scan' : 'move';
  door.element.dataset.frame = String(frame);
  door.element.firstElementChild.style.transform = `scaleX(${robot.facing})`;
  door.element.firstElementChild.style.width = attack ? '240px' : '160px';
  const src = `assets/objects/guard-robot/${attack ? 'guard-capture' : 'guard-patrol'}.png`;
  if (robot.image.getAttribute('src') !== src) robot.image.src = src;
  robot.image.style.width = attack ? '600%' : '800%';
  robot.image.style.transform = `translateX(${-frame * 100 / (attack ? 6 : 8)}%)`;
  // The nearby target remains the same object while its outline follows the moving sprite.
  if (outlinedDoor === door) outlinedDoor = null;
}
