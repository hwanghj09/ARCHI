// R-01 keeps its position when the player leaves the lobby. Patrol uses the game's paused clock.
// mode 'dock': 아직 플레이어를 한 번도 감지하지 못한 초기 상태 — 도크에 가만히 서 있고 순찰하지 않는다.
// 플레이어가 가까이 와서 처음 감지되면 그제서야 추적하고, 그 뒤로는(추적이 끝나면) 'patrol'로 넘어가
// 평소처럼 구간을 오간다.
const guardPatrol = { x: 4530, facing: -1, wait: 0, elapsed: 0, mode: 'dock',
  lostTime: 0, captureTime: 0, door: null, image: null, chaseOriginX: null, firstEncounter: true };
const guardCapturePanel = document.getElementById('guard-capture');
let guardBlocked = [];

function releaseGuardCapture() {
  playerCaught = false;
  guardPatrol.mode = 'patrol';
  guardPatrol.lostTime = guardPatrol.captureTime = 0;
  guardCapturePanel.hidden = true;
  for (const element of guardBlocked) element.inert = false;
  guardBlocked = [];
  animate(0);
}

function catchPlayer() {
  playGameSound('robot-grab', { x: guardPatrol.x });
  const robot = guardPatrol;
  playerCaught = true;
  robot.mode = 'grab'; robot.captureTime = 0;
  robot.facing = body.position.x >= robot.x ? 1 : -1;
  // Keep the held body inside the 32px walls without shortening the arm reach.
  const margin = 32 + (body.bounds.max.x - body.bounds.min.x) / 2;
  const heldX = Math.max(margin, Math.min(worldWidth - margin, robot.x + robot.facing * 82));
  robot.x = heldX - robot.facing * 82;
  facing = -robot.facing;
  phoneLightOn = false;
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
    // 아직 한 번도 감지되지 않은 'dock' 상태는 전력이 끊겨도 그대로 둔다 — 안 그러면 처음 전력이 들어오는
    // 순간 플레이어를 보기도 전에 바로 순찰을 시작해 버린다.
    if (robot.mode !== 'dock') robot.mode = 'patrol';
    robot.lostTime = 0;
  } else if (playerCaught) {
    robot.captureTime += delta;
    Body.setPosition(body, { x: robot.x + robot.facing * 82, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true;
    if (robot.captureTime >= 1100 && guardCapturePanel.hidden) {
      robot.mode = 'caught';
      guardCapturePanel.hidden = false;
      document.getElementById('guard-retry').focus();
    }
  } else if (delta > 0) {
    const dx = body.position.x - robot.x;
    const sameLevel = Math.abs(body.bounds.max.y - floorY) < 180;
    const seesPlayer = sameLevel && (Math.abs(dx) < 65 || (dx * robot.facing > 0 && Math.abs(dx) < 360));
    if ((robot.mode === 'patrol' || robot.mode === 'dock') && seesPlayer) {
      robot.mode = 'chase'; robot.lostTime = 0; robot.chaseOriginX = robot.x;
      playGameSound('robot-alert', { x: robot.x });
      showStatus('경비 로봇이 수호를 감지했다. 거리를 벌려야 한다.', 2400);
    }
    if (robot.mode === 'chase') {
      // 엘리베이터 근처는 로봇의 경계 구역 밖이다 — 쫓기다가 거기 도착하면 쫓던 걸 그만두고 감지했던
      // 자리로 돌아간다. 로봇의 순찰 구간이 엘리베이터 앞을 지나가므로, 감지되자마자(아직 도망치지도
      // 않았는데) 그 자리가 우연히 엘리베이터 근처라서 바로 취소되는 걸 막으려고 실제로 감지 지점에서
      // 꽤 멀어졌을 때만(200px) 이 탈출을 인정한다.
      const fledFar = Math.abs(body.position.x - robot.chaseOriginX) > 200;
      const nearElevator = fledFar && currentDoors.some(otherDoor => otherDoor.type === 'elevator' &&
        Math.abs(body.position.x - (otherDoor.x + otherDoor.width / 2)) < otherDoor.width / 2 + 60);
      if (nearElevator) {
        robot.mode = 'patrol'; robot.wait = 0; robot.lostTime = 0;
        if (robot.chaseOriginX !== null) robot.x = robot.chaseOriginX;
        showStatus('엘리베이터 쪽으로 피하자 경비 로봇이 감지했던 자리로 돌아갔다.', 2400);
        if (robot.firstEncounter) {
          robot.firstEncounter = false;
          setTimeout(() => showStatus('직원증을 소지하고있지만 로봇은 멈추지 않았다 — 이건 단순 정전이 아니다.', 4200), 2400);
          setTimeout(() => showStatus('1번 엘리베이터 앞 층별 안내판을 다시 봐야겠다.', 4000), 2400 + 4200);
        }
      } else {
        robot.lostTime = sameLevel && Math.abs(dx) < 600 ? 0 : robot.lostTime + delta;
        if (robot.lostTime >= 1800) {
          robot.mode = 'patrol'; robot.wait = 0;
          if (robot.firstEncounter) {
            robot.firstEncounter = false;
            showStatus('직원증을 소지하고있지만 로봇은 멈추지 않았다 — 이건 단순 정전이 아니다.', 4200);
            setTimeout(() => showStatus('1번 엘리베이터 앞 층별 안내판을 다시 봐야겠다.', 4000), 4200);
          }
        }
        else {
          robot.facing = dx >= 0 ? 1 : -1;
          const distance = Math.min(Math.abs(dx), 270 * delta / 1000);
          robot.x = Math.max(80, Math.min(worldWidth - 80, robot.x + robot.facing * distance));
          robot.elapsed += delta;
          if (grounded && Math.abs(body.bounds.max.y - floorY) < 3 && Math.abs(body.position.x - robot.x) <= 84) catchPlayer();
        }
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
  const attack = powered && robot.mode !== 'patrol' && robot.mode !== 'dock';
  const frame = !powered ? 7 : robot.mode === 'chase' ? Math.floor(robot.elapsed / 120) % 2 :
    playerCaught ? 2 + Math.min(5, Math.floor(robot.captureTime / 160)) :
    robot.mode === 'dock' ? 4 :
    robot.wait > 0 ? 4 + Math.min(2, Math.floor((pause - robot.wait) / (pause / 3))) : Math.floor(robot.elapsed / 120) % 4;
  const { door } = robot;
  door.x = robot.x - door.width / 2;
  door.y = floorY - 124;
  door.outline = [robot.x - 39, floorY - 124, 78, 124];
  Object.assign(door.element.style, { left: `${robot.x - 80}px`, top: `${floorY - 237 * .625}px`, width: '160px', height: '160px' });
  door.element.dataset.patrol = !powered ? 'off' : attack ? robot.mode : robot.mode === 'dock' ? 'scan' : robot.wait > 0 ? 'scan' : 'move';
  door.element.dataset.frame = String(frame);
  door.element.firstElementChild.style.transform = `scaleX(${robot.facing})`;
  door.element.firstElementChild.style.width = attack ? '240px' : '160px';
  const src = `assets/objects/guard-robot/${attack ? 'guard-capture' : 'guard-patrol'}.png`;
  if (robot.image.getAttribute('src') !== src) robot.image.src = src;
  robot.image.style.width = '800%';
  robot.image.style.transform = `translateX(${-frame * 100 / 8}%)`;
  // The nearby target remains the same object while its outline follows the moving sprite.
  if (outlinedDoor === door) outlinedDoor = null;
}
