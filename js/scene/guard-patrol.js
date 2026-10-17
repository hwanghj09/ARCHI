// R-01 keeps its position when the player leaves the lobby. Patrol uses the game's paused clock.
// mode 'dock': 아직 플레이어를 한 번도 감지하지 못한 초기 상태 — 도크에 가만히 서 있고 순찰하지 않는다.
// 플레이어가 가까이 와서 처음 감지되면 그제서야 추적하고, 그 뒤로는(추적이 끝나면) 'patrol'로 넘어가
// 평소처럼 구간을 오간다. mode 'return': 엘리베이터 쪽으로 놓친 뒤 감지했던 자리(chaseOriginX)로 걸어 돌아가는
// 중 — 무적 상태는 아니라서 걷는 도중에도 평소처럼 다시 감지되면 'chase'로 돌아간다.
// spottedX는 감지 순간 수호가 서 있던 자리다.
const guardPatrol = { x: 4530, facing: -1, wait: 0, elapsed: 0, mode: 'dock',
  lostTime: 0, captureTime: 0, door: null, image: null, chaseOriginX: null, spottedX: null };
// 같은 규칙으로 움직이는 다른 로봇(B2 엔딩 추격, b2-ending.js)은 b2Robots에 둔다. 로봇 옵션:
// pursuit — 놓쳐도 포기하지 않는다. followToElevator — 엘리베이터 앞에서도 멈추지 않는다. sight — 감지 거리(아래).
// chaseSpeed — 추격 속도(px/s)를 돌려주는 함수(없으면 270).
// onCaught — 붙잡는 연출이 끝나면 '다시 시도' 창 대신 부른다. 옵션이 없는 R-01은 예전과 똑같이 움직인다.
const guardCapturePanel = document.getElementById('guard-capture');
let guardBlocked = [];
let b2Robots = [];
let caughtBy = null; // 지금 수호를 붙잡고 있는 로봇

function releaseGuardCapture() {
  const robot = caughtBy ?? guardPatrol;
  playerCaught = false; caughtBy = null;
  robot.mode = robot.pursuit ? 'chase' : 'patrol';
  robot.lostTime = robot.captureTime = 0;
  guardCapturePanel.hidden = true;
  for (const element of guardBlocked) element.inert = false;
  guardBlocked = [];
  animate(0);
}

function catchPlayer(robot = guardPatrol) {
  closePhone();
  playGameSound('robot-grab', { x: robot.x });
  playerCaught = true; caughtBy = robot;
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
  updateRobot(guardPatrol, delta);
  // 문 앞에서 멈춰 선(hold) 로봇은 그리기만 한다.
  for (const robot of b2Robots) updateRobot(robot, robot.hold > 0 ? 0 : delta);
}

function updateRobot(robot, delta) {
  if (!robot.door) return;
  const { left, right, speed, pause } = robot.door.patrol;
  const powered = world.dataset.powered === 'true';
  if (!powered) {
    if (playerCaught) { releaseGuardCapture(); stage.focus(); }
    // 아직 한 번도 감지되지 않은 'dock' 상태는 전력이 끊겨도 그대로 둔다 — 안 그러면 처음 전력이 들어오는
    // 순간 플레이어를 보기도 전에 바로 순찰을 시작해 버린다.
    if (robot.mode !== 'dock') robot.mode = 'patrol';
    robot.lostTime = 0;
  } else if (playerCaught && caughtBy && caughtBy !== robot) {
    // 다른 로봇이 붙잡는 동안 나머지는 제자리에 선다.
  } else if (playerCaught) {
    robot.captureTime += delta;
    Body.setPosition(body, { x: robot.x + robot.facing * 82, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true;
    if (robot.captureTime >= 1100 && (robot.onCaught ? robot.mode === 'grab' : guardCapturePanel.hidden)) {
      robot.mode = 'caught';
      if (robot.onCaught) robot.onCaught();
      else {
        guardCapturePanel.hidden = false;
        document.getElementById('guard-retry').focus();
      }
    }
  } else if (delta > 0) {
    const dx = body.position.x - robot.x;
    const sameLevel = Math.abs(body.bounds.max.y - floorY) < 180;
    // 전방 센서(720px)만 순찰 구간 밖(비상계단 왼쪽, left 미만)을 가리지 않는다 — 그 구역은 로봇이
    // 애초에 돌지 않는 곳이라, 저 멀리서 서성이는 수호를 센서 사거리만으로 감지해서 쫓아오는 것은
    // 담당 구역 밖 추격이라 부당하다. 바로 옆 근접 감지(130px)는 구간과 무관하게 그대로 둔다 —
    // 추격을 놓치고 patrol로 돌아가는 로봇이 아직 구간 밖에 있는 채로 수호가 바로 옆에 다가와도
    // 눈앞의 수호를 못 알아보면 그게 더 이상하다.
    // sight(B2 엔딩의 1층 R-01): 순찰 구간과 상관없이 바라보는 쪽 sight px 안의 수호를 본다.
    const inBeat = robot.sight || body.position.x >= left;
    // 엘리베이터 앞은 로봇의 경계 구역 밖이다. 바짝 붙어 쫓아오던 로봇이 'return'으로 바뀐 바로 다음 프레임에
    // 130px 근접 감지로 수호를 다시 보고, 그 자리에서 추격을 새로 시작해 끝까지 따라오던 버그가 있었다 —
    // 그래서 이 구역 안의 수호는 새로 감지하지 않는다(followToElevator 로봇은 예외).
    const atElevator = !robot.followToElevator && currentDoors.some(otherDoor => otherDoor.type === 'elevator' &&
      Math.abs(body.position.x - (otherDoor.x + otherDoor.width / 2)) < otherDoor.width / 2 + 60);
    const seesPlayer = sameLevel && !atElevator && (Math.abs(dx) < 130 || (inBeat && dx * robot.facing > 0 && Math.abs(dx) < (robot.sight ?? 720)));
    // 'return'(복귀 이동 중)도 patrol/dock과 똑같이 감지된다 — 복귀 중이라고 무적은 아니다.
    if ((robot.mode === 'patrol' || robot.mode === 'dock' || robot.mode === 'return') && seesPlayer) {
      robot.mode = 'chase'; robot.lostTime = 0; robot.chaseOriginX = robot.x; robot.spottedX = body.position.x;
      playGameSound('robot-alert', { x: robot.x });
      showStatus('경비 로봇이 수호를 감지했다. 거리를 벌려야 한다.', 2400);
    }
    if (robot.mode === 'chase') {
      // 엘리베이터 근처는 로봇의 경계 구역 밖이다 — 쫓기다가 수호가 거기 도착하면 쫓던 걸 그만두고 감지했던
      // 자리로 돌아간다('return'). 구역 안에서는 애초에 감지되지 않으므로(위 atElevator), 거리 조건 없이
      // 도착하는 즉시 탈출로 인정한다 — 엘리베이터 바로 옆에서 감지돼 200px을 못 달아났다는 이유로
      // 엘리베이터 앞에서 붙잡히던 문제도 함께 막는다.
      if (atElevator) {
        // 순간이동으로 자리를 되돌리지 않는다 — 'return' 모드로 넘어가 감지했던 자리까지 순찰 속도로
        // 직접 걸어서 돌아가고(아래 return 처리), 도착하면 그제서야 patrol로 돌아간다.
        robot.mode = 'return'; robot.wait = 0; robot.lostTime = 0;
        collectedItems.add('f1-chase-ended'); // 추격이 끝났다: 3초 뒤 혼잣말 컷씬(story-scene.js)
        showStatus('엘리베이터 쪽으로 피하자 경비 로봇이 감지했던 자리로 돌아가기 시작했다.', 2400);
      } else {
        robot.lostTime = robot.pursuit || (sameLevel && Math.abs(dx) < 600) ? 0 : robot.lostTime + delta;
        if (robot.lostTime >= 1800) {
          robot.mode = 'patrol'; robot.wait = 0;
          collectedItems.add('f1-chase-ended');
        }
        else {
          robot.facing = dx >= 0 ? 1 : -1;
          const distance = Math.min(Math.abs(dx), (robot.chaseSpeed?.() ?? 270) * delta / 1000);
          robot.x = Math.max(80, Math.min(worldWidth - 80, robot.x + robot.facing * distance));
          robot.elapsed += delta;
          if (grounded && Math.abs(body.bounds.max.y - floorY) < 3 && Math.abs(body.position.x - robot.x) <= 84) catchPlayer(robot);
        }
      }
    }
  }
  if (powered && !playerCaught && robot.mode === 'return') {
    // 순간이동하지 않고 순찰 속도로 감지했던 자리까지 걸어 돌아간다. 목적지는 순찰 구간 안으로 묶어서
    // 쫓아온 길만 되짚고 벽이나 구간 밖으로 나가지 않는다. 돌아가는 중에도 평소와 같은 조건으로
    // 다시 감지될 수 있고(위 if), 그러면 이 블록에 닿기 전에 이미 'chase'로 바뀌어 있다. 끝까지
    // 돌아가면 그 자리에서 한 번 둘러본 뒤 순찰을 이어 간다.
    const home = Math.max(left, Math.min(right, robot.chaseOriginX ?? robot.x));
    if (robot.x !== home) robot.facing = home > robot.x ? 1 : -1;
    const stride = speed * delta / 1000;
    robot.x = Math.abs(home - robot.x) <= stride ? home : robot.x + robot.facing * stride;
    robot.elapsed += delta;
    if (robot.x === home) { robot.mode = 'patrol'; robot.wait = pause; }
  } else if (powered && !playerCaught && robot.mode === 'patrol') {
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
  // 돌아가는 중('return')은 붙잡기 시트가 아니라 순찰 시트의 바퀴 프레임으로 걷는다.
  const attack = powered && !['patrol', 'dock', 'return'].includes(robot.mode);
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
