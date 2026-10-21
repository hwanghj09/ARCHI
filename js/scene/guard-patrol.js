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
// sensor — 전방 센서 거리(없으면 720px). sight와 달리 순찰 구간 밖은 보지 않는다.
// chaseSpeed — 추격 속도(px/s)를 돌려주는 함수(없으면 270).
// onCaught — 붙잡는 연출이 끝나면 '다시 시도' 창 대신 부른다. selfPowered — 층 전력과 상관없이 움직인다.
// 옵션이 없는 R-01은 예전과 똑같이 움직인다.
// 순찰 로봇 R-03(roamer): 1층(R-01 담당)·17층·B2를 뺀 층을 엘리베이터로 옮겨 다닌다. 자체 배터리라 층 전력과 상관없이
// 돈다. 전등이 켜진 층에서는 복도와 방 두 곳을 둘러보고, 꺼진 층에서는 복도만 돈다. 다음 층은 켜진 층을 3배 더 자주 고른다.
// 정전 뒤에만 움직이고 B2 엔딩 중에는 멈춘다. 수호와 다른 장면에 있는 동안에는 머무는 시간(stay)만 줄다가
// 다 되면 바로 다음 장면으로 옮긴다. 같은 장면이면 나갈 문(엘리베이터)까지 걸어가서 나간다.
// 층을 옮길 때는 진짜 엘리베이터(elevatorCars)를 쓴다: 비어 있는 칸을 불러 문이 열리면 타고(trip 'call' → 'board'),
// 문이 완전히 닫힌 뒤 운행하고('close' → 'ride'), 도착해 문이 완전히 열리면 내린다('exit'). 승강기 전력이 없으면 이 층을 계속 돈다.
const roamerFloors = [-1, ...Array.from({ length: 15 }, (_, index) => index + 2)];
const roamerStay = { corridor: 30000, room: 15000, ride: 6000 };
const roamerSpeed = { patrol: 70, chase: 220 }; // R-01(순찰 80, 추격 270)보다 느리다. 걷기 200·달리기 340
// 수호가 문으로 나오자마자 붙잡히지 않게, 수호가 들어온 문 앞에서 이만큼은 떨어져 있는다(전방 센서보다 멀다).
const roamerSafeDistance = 800;
const roamer = { name: 'R-03', where: 'f9', next: 'elevator', lastFloor: null, stay: 60000, car: null, trip: null, roomsLeft: 0, x: 0, facing: -1, wait: 0, elapsed: 0,
  mode: 'patrol', lostTime: 0, captureTime: 0, door: null, image: null, chaseOriginX: null, spottedX: null, firstEncounter: false, selfPowered: true,
  followToElevator: true, chaseSpeed: () => roamerSpeed.chase,
  sensor: 480 }; // 화면 절반(640px)보다 짧아, 감지되기 전에 화면에서 먼저 보인다
// R-03은 엘리베이터 앞에서도 쫓아오고, 칸에 탄 수호를 따라 문을 억지로 연다(cabin-pry.js).
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
  // R-03에게 잡히면 그 층 엘리베이터 앞에서 다시 하고 R-03은 다른 층으로 보낸다. 1층 R-01은 로비에서 다시 한다.
  const byRoamer = caughtBy === roamer;
  const sceneId = floorId(currentSceneFloor);
  releaseGuardCapture();
  Object.assign(guardPatrol, { x: 4530, facing: -1, wait: 0, elapsed: 0 });
  if (byRoamer) {
    roamer.lastFloor = sceneId; roamer.trip = roamer.car = null;
    roamerEnter(pickRoamerFloor(), 'elevator');
  }
  performFloorChange(byRoamer ? sceneId : 'f1');
  releaseInput(); stage.focus();
});

// 경비 로봇 스프라이트를 지금 장면에 붙인다(R-03, B2 엔딩 로봇).
function mountRobot(robot, className, patrol) {
  robot.soundDistance = 0;
  const element = document.createElement('div');
  element.className = `fixture guard-bot ${className}`;
  element.setAttribute('aria-hidden', 'true');
  const sprite = document.createElement('div');
  sprite.className = 'guard-robot-sprite';
  const image = new Image();
  image.src = 'assets/objects/guard-robot/guard-patrol.png';
  image.alt = ''; image.draggable = false;
  sprite.append(image);
  element.append(sprite);
  dynamicScene.append(element);
  robot.door = { element, width: 78, patrol };
  robot.image = image;
  updateRobot(robot, 0);
}

// sceneId 장면에서 toward 장면으로 가는 문의 가운데 x. 방 안의 출구 위치는 scene-builder.js와 같은 식으로 구한다.
function sceneDoorX(sceneId, toward) {
  const config = floorById.get(sceneId);
  const corridor = config.interior ? floorById.get(config.parent) : config;
  const outside = corridor.rooms.find(entry => entry.target === (config.interior ? sceneId : toward));
  if (!config.interior) return outside.doorX + (outside.doorWidth ?? 120) / 2;
  const width = config.exitWidth ?? outside.doorWidth ?? 120;
  return (config.exitX ?? exitDoorX(outside, config.width, width)) + width / 2;
}

const roamerHere = () => room === 'dynamic' ? dynamicFloorId : null;
// index번 엘리베이터 문 가운데 x(그 층 그림에 맞춘 elevatorOffsets 포함, scene-builder.js와 같다).
function roamerElevatorX(index = roamer.car ?? 0, sceneId = roamer.where) {
  const car = BUILDING_CORE.elevators[index];
  return car.x + (floorById.get(sceneId)?.elevatorOffsets?.[index] ?? 0) + car.width / 2;
}
// B1은 방재 관제실 소등(cctv-event.js) 뒤로 전등이 꺼진다.
const roamerFloorLit = floor => floorHasLighting(floor) && !(floor < 0 && collectedItems.has('b1-lights-out') && !allPowerOverride);

function pickRoamerFloor() {
  const options = roamerFloors.filter(floor => floorId(floor) !== roamer.lastFloor);
  const weights = options.map(floor => roamerFloorLit(floor) ? 3 : 1);
  let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  return floorId(options.find((floor, index) => (roll -= weights[index]) < 0) ?? options.at(-1));
}

// 방은 복도로 나가고, 복도는 아직 둘러볼 방이 남았으면 그 방으로, 아니면 엘리베이터로 나간다.
function pickRoamerNext(config) {
  if (config.interior) return config.parent;
  const rooms = config.rooms.filter(entry => floorById.has(entry.target) && !floorById.get(entry.target).exitLock);
  if (roamer.roomsLeft <= 0 || !rooms.length) return 'elevator';
  roamer.roomsLeft--;
  return rooms[Math.floor(Math.random() * rooms.length)].target;
}

function roamerEnter(sceneId, from) {
  const config = floorById.get(sceneId);
  Object.assign(roamer, { where: sceneId, mode: 'patrol', wait: 0, lostTime: 0 });
  roamer.x = from === 'elevator' ? roamerElevatorX() : sceneDoorX(sceneId, from);
  if (from === 'elevator') roamer.roomsLeft = roamerFloorLit(config.floor) ? 2 : 0;
  roamer.stay = from === 'elevator' ? roamerStay.corridor : roamerStay.room;
  roamer.next = pickRoamerNext(config);
  // 수호가 있는 층에 엘리베이터로 오면 도착음을 거리와 상관없이 들려준다(그 층의 방 안에서도). 로봇이 왔다는 신호다.
  if (from === 'elevator' && room === 'dynamic' && currentSceneFloor === config.floor) playGameSound('elevator-arrive');
  if (sceneId !== roamerHere()) return;
  mountRoamer();
  roamer.facing = roamer.x < worldWidth / 2 ? 1 : -1;
  const door = from === 'elevator' ? null : currentDoors.find(entry => entry.key === (config.interior ? 'exit' : `room:${from}`));
  if (door) {
    door.element.dataset.open = 'true';
    setTimeout(() => { if (door.element.isConnected) door.element.dataset.open = 'false'; }, 900);
  }
  if (from !== 'elevator') playGameSound('door', { x: roamer.x });
}

function roamerLeave() {
  const { where, next } = roamer;
  if (roamer.door) {
    roamer.door.element.remove();
    roamer.door = roamer.image = null;
    playGameSound('door', { x: roamer.x });
  }
  roamerEnter(next, where);
}

// 탈 칸: 아무도 안 탔고 운행 중이 아닌 칸 중 이 층에 서 있는 칸, 없으면 가장 가까운 칸.
// 수호가 부른 칸(playerCall)과 문이 열려 있는 칸은 고르지 않는다: 수호 앞에 막 도착한 칸을 가져가 닫고 다른 층으로 보내던 문제.
function pickRoamerCar(floor) {
  const idle = elevatorCars.map((car, index) => ({ car, index }))
    .filter(({ car }) => !car.rider && !car.travelling && !car.open && !car.playerCall);
  idle.sort((a, b) => Math.abs(a.car.floor - floor) - Math.abs(b.car.floor - floor));
  return idle[0]?.index ?? null;
}

function sendRoamerCar(car) {
  roamer.lastFloor = floorId(car.floor);
  Object.assign(car, { travelling: false, destination: floorById.get(pickRoamerFloor()).floor, elapsed: 0, open: false });
  Object.assign(roamer.trip, { phase: 'close', time: elevatorDoorMs });
  if (roamerHere() === floorId(car.floor)) playGameSound('elevator-door', { x: roamerElevatorX(roamer.car, floorId(car.floor)) });
}

// 복도에서 머무는 시간이 끝났다: 칸을 골라 그 문 앞까지 걸어가서 부른다.
function roamerToElevator() {
  const config = floorById.get(roamer.where);
  if (!elevatorHasPower()) { // 승강기가 멈춰 있으면 이 층을 한 바퀴 더 돈다
    roamer.roomsLeft = roamerFloorLit(config.floor) ? 2 : 0;
    roamer.next = pickRoamerNext(config);
    roamer.stay = roamerStay.corridor;
    return;
  }
  roamer.car ??= pickRoamerCar(config.floor);
  if (roamer.car === null) { roamer.stay = 1000; return; } // 빈 칸이 없으면 조금 뒤에 다시 고른다
  const x = roamerElevatorX();
  if (roamer.door && roamer.x !== x) {
    if (roamer.mode === 'patrol') { roamer.mode = 'return'; roamer.chaseOriginX = x; }
    return;
  }
  const car = elevatorCars[roamer.car];
  // 걸어오는 사이 수호가 그 칸을 불렀거나 다른 층에서 문이 열려 있으면 미리 골라 둔 칸을 포기하고 다시 고른다.
  if (car.rider || car.playerCall || (car.open && car.floor !== config.floor) ||
      (car.travelling && car.destination !== config.floor)) { roamer.car = null; return; }
  roamer.trip = { phase: 'call', time: 0 };
  if (car.floor !== config.floor && !car.travelling) Object.assign(car, { travelling: true, destination: config.floor, elapsed: 0, open: false });
}

function updateRoamerTrip(delta) {
  const car = elevatorCars[roamer.car];
  const { trip } = roamer;
  const here = roamer.where === roamerHere();
  // 타기 전 수호가 부른 칸은 양보한다. 이미 탔다면 호출 층까지 간 뒤 문 열림 시간을 보장한다.
  if (roamer.where !== null && (roamer.mode === 'chase' || car.rider || car.playerCall)) { roamer.trip = roamer.car = null; return; }
  if (!elevatorHasPower() || car.rider) return;
  if (trip.phase === 'call') {
    if (car.travelling || car.floor !== floorById.get(roamer.where).floor) return;
    if (!car.open && here) playGameSound('elevator-door', { x: roamer.x });
    car.open = true;
    elevatorOpenTime[roamer.car] = 0;
    Object.assign(trip, { phase: 'board', time: elevatorDoorMs });
  } else if (trip.phase === 'board') {
    trip.time -= delta;
    if (trip.time > 0) return;
    if (roamer.door) { roamer.door.element.remove(); roamer.door = roamer.image = null; }
    roamer.where = null;
    sendRoamerCar(car);
  } else if (trip.phase === 'close') {
    if (car.open) {
      if (car.playerCall) return;
      sendRoamerCar(car);
      return;
    }
    trip.time -= delta;
    if (trip.time > 0) return;
    car.travelling = true;
    trip.phase = 'ride';
  } else if (trip.phase === 'ride' && !car.travelling) {
    Object.assign(trip, { phase: 'exit', time: elevatorDoorMs });
  } else if (trip.phase === 'exit') {
    if (car.playerCall) return;
    if (car.travelling) { trip.phase = 'ride'; return; }
    if (!car.open) {
      car.open = true;
      trip.time = elevatorDoorMs;
      elevatorOpenTime[roamer.car] = 0;
      if (roamerHere() === floorId(car.floor)) playGameSound('elevator-door', { x: roamerElevatorX(roamer.car, floorId(car.floor)) });
      return;
    }
    trip.time -= delta;
    if (trip.time > 0) return;
    // 도착했다(문은 updateElevators가 연다). 내릴 수 없는 층이거나 수호가 바로 문 앞에 있으면 다른 층으로 간다.
    const sceneId = floorId(car.floor);
    if (!roamerFloors.includes(car.floor) || roamerNearSuho(sceneId, roamerElevatorX(roamer.car, sceneId))) return sendRoamerCar(car);
    roamer.trip = null;
    roamerEnter(sceneId, 'elevator');
    roamer.car = null;
  }
}

function mountRoamer() {
  mountRobot(roamer, 'roaming-guard-bot', { left: 80, right: worldWidth - 80, speed: roamerSpeed.patrol, pause: 1400 });
}

function updateRoamer(delta) {
  const active = buildingBlackout && typeof b2Ending !== 'undefined' && b2Ending.phase === 'idle' && !bossFightActive;
  if (active && !playerCaught && delta > 0) { // delta 0은 그리기만(장면 교체 중에는 수호 위치가 아직 옛 장면이다)
    if (roamer.trip) updateRoamerTrip(delta);
    else if ((roamer.stay -= delta) > 0) { /* 아직 이 장면에 머문다 */ }
    else if (roamer.next === 'elevator') roamerToElevator();
    else {
      const exitX = sceneDoorX(roamer.where, roamer.next);
      // 수호가 있는 장면으로 들어올 문 바로 앞에 수호가 서 있으면 조금 뒤에 들어온다.
      if (!roamer.door && roamerNearSuho(roamer.next, sceneDoorX(roamer.next, roamer.where))) roamer.stay = 2000;
      else if (!roamer.door || (roamer.mode === 'patrol' && roamer.x === exitX)) roamerLeave();
      else if (roamer.mode === 'patrol') { roamer.mode = 'return'; roamer.chaseOriginX = exitX; }
    }
  }
  if (roamer.door) updateRobot(roamer, active ? delta : 0);
}

const roamerNearSuho = (sceneId, x) => sceneId === roamerHere() && Math.abs(x - body.position.x) < roamerSafeDistance;

// 수호가 들어온 문 앞에 R-03이 있으면 roamerSafeDistance만큼 떨어뜨리고 수호 반대쪽을 보게 한다.
// 나갈 문이 바로 그 문이면 되돌아와 붙잡을 수 있으니 조금 더 머물게 한다.
function keepRoamerClear() {
  if (Math.abs(roamer.x - body.position.x) >= roamerSafeDistance) return;
  const side = roamer.x >= body.position.x ? 1 : -1;
  let x = body.position.x + side * roamerSafeDistance;
  if (x < 80 || x > worldWidth - 80) x = body.position.x - side * roamerSafeDistance;
  roamer.x = Math.max(80, Math.min(worldWidth - 80, x));
  roamer.facing = roamer.x >= body.position.x ? 1 : -1;
  roamer.wait = 0;
  roamer.stay = Math.max(roamer.stay, 8000);
  if (roamer.trip?.phase !== 'ride') roamer.trip = roamer.car = null; // 엘리베이터를 기다리던 중이면 그만둔다
}

function mountGuardPatrol() {
  guardPatrol.soundDistance = 0;
  // 장면을 옮기면 R-03은 쫓던 것을 그만두고, 같은 장면에 있으면 다시 그린다.
  roamer.door = roamer.image = null;
  roamer.mode = 'patrol'; roamer.lostTime = 0;
  if (roamer.where && roamer.where === roamerHere()) { keepRoamerClear(); mountRoamer(); }
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

// 1층 R-01은 정비 패널에 0914를 넣으면(f1-robot-log) 꺼진다: 전력이 들어와도, B2 엔딩의 1층에서도 멈춰 있다. B2 로봇은 해당 없다.
function guardPatrolPowered(robot) {
  return world.dataset.powered === 'true' && !(robot === guardPatrol && collectedItems.has('f1-robot-log'));
}

function updateGuardPatrol(delta) {
  updateRobot(guardPatrol, delta);
  // 문 앞에서 멈춰 선(hold) 로봇은 그리기만 한다.
  for (const robot of b2Robots) updateRobot(robot, robot.hold > 0 ? 0 : delta);
  updateRoamer(delta);
}

function updateRobot(robot, delta) {
  if (!robot.door) return;
  const oldX = robot.x;
  const { left, right, speed, pause } = robot.door.patrol;
  const powered = robot.selfPowered || guardPatrolPowered(robot);
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
    // 전방 센서(720px, sensor)만 순찰 구간 밖(비상계단 왼쪽, left 미만)을 가리지 않는다 — 그 구역은 로봇이
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
    // 후방 센서(320px)는 1층 R-01에만 있고, 전방 센서처럼 순찰 구간 밖의 수호는 보지 않는다.
    const sensorRange = dx * robot.facing > 0 ? (robot.sight ?? robot.sensor ?? 720) : robot === guardPatrol ? 320 : 0;
    const seesPlayer = sameLevel && !atElevator && (Math.abs(dx) < 130 || (inBeat && Math.abs(dx) < sensorRange));
    // 'return'(복귀 이동 중)도 patrol/dock과 똑같이 감지된다 — 복귀 중이라고 무적은 아니다.
    if ((robot.mode === 'patrol' || robot.mode === 'dock' || robot.mode === 'return') && seesPlayer) {
      robot.mode = 'chase'; robot.lostTime = 0; robot.chaseOriginX = robot.x; robot.spottedX = body.position.x;
      playGameSound('robot-alert', { x: robot.x });
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
        if (robot === guardPatrol) collectedItems.add('f1-chase-ended'); // 추격이 끝났다(1층 도착 컷씬도 여기서 끝난다, story-scene.js)
      } else {
        robot.lostTime = robot.pursuit || (sameLevel && Math.abs(dx) < 600) ? 0 : robot.lostTime + delta;
        if (robot.lostTime >= 1800) {
          robot.mode = 'patrol'; robot.wait = 0;
          if (robot === guardPatrol) collectedItems.add('f1-chase-ended');
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
  if (delta > 0) updateRobotMovementSound(robot, powered && !playerCaught ? Math.abs(robot.x - oldX) : 0);
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
