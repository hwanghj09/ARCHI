// B2 마지막 엔딩(추격전) 최소 버전. 메인 서버실 콘솔의 DELETE → 경고 [예]를 누르기 직전에 체크포인트를 따로 저장하고
// 삭제를 시작한다: 화면 위 진행 바(35초, 100%가 돼도 아직 아무 일 없음), 붉은 비상등(#room-alarm), 경보음, 비상계단 잠김 문구.
// 충전 도크의 경비 로봇 R-02·R-05·R-07이 차례로 깨어나 수호를 쫓는다(guard-patrol.js의 updateRobot, 속도는 R-01 추격과 같은 270px/s).
// 로봇은 수호와 다른 장면(복도/방)에 있으면 보이지 않는 채로 그 장면의 문까지 걸어가 문을 열고 들어온다.
// 잡히면 R-01과 같은 붙잡기 연출 뒤 베드엔딩 창, 엘리베이터 문 장면(아래)을 넘겨 1층에 닿으면 임시 해피엔딩 창. 삭제가 시작된 뒤로는 자동 저장을 멈춘다.
const b2CheckpointKey = 'archi.checkpoint.b2';
const b2DeleteDuration = 35000;
const b2DockX = [4790, 4850, 4910]; // 충전 도크(대기 중인 경비 로봇 fixture)의 세 자리
const b2DoorHold = 700; // 문을 열고 들어온 로봇이 잠깐 멈춰 서는 시간
// phase: idle → running → over. stage: 'b2'(B2 추격·엘리베이터) → 'lobby'(1층, R-01). offline: 1층 전력을 끊어 ARCHI가 꺼졌다. jam: 휴대폰 전력 앱 방해 남은 ms.
const b2Ending = { phase: 'idle', stage: 'b2', elapsed: 0, alarm: 0, offline: false, jam: 0 };
const b2DeleteButton = document.getElementById('inspection-delete');
const b2ConfirmYes = document.getElementById('inspection-yes');
const b2ConfirmNo = document.getElementById('inspection-no');
const b2DeleteBar = document.getElementById('b2-delete-bar');
const b2DeletePercent = document.getElementById('b2-delete-percent');
const b2DeleteFill = document.getElementById('b2-delete-fill');
const b2BadEnding = document.getElementById('b2-bad-ending');
const b2Escape = document.getElementById('b2-escape');
let b2EscapeBlocked = [];

// 조사창을 연 물건이 B2 메인 콘솔이면(삭제 전) DELETE 버튼을 보인다(interaction.js).
function offerArchiDelete(door) {
  if (b2Ending.phase === 'idle' && dynamicFloorId === 'b2-main' && door.name === 'ARCHI 메인 콘솔') b2DeleteButton.hidden = false;
}

b2DeleteButton.addEventListener('click', () => {
  openInspection('DELETE ARCHI', '복구할 수 없습니다. 계속하시겠습니까?');
  finishInspectionText();
  b2ConfirmYes.hidden = b2ConfirmNo.hidden = false;
  inspectionClose.hidden = true;
  b2ConfirmNo.focus();
});
b2ConfirmNo.addEventListener('click', () => closeInspection());
b2ConfirmYes.addEventListener('click', startArchiDelete);

function startArchiDelete() {
  // 체크포인트: [예]를 누르기 직전 상태. 자동 저장 칸도 같은 상태로 맞춰 두고, 삭제가 시작되면 자동 저장을 멈춘다.
  saveProgress();
  try { localStorage.setItem(b2CheckpointKey, JSON.stringify(progressSnapshot())); }
  catch { showStatus('체크포인트를 저장하지 못했습니다.', 4000); }
  closeInspection();
  Object.assign(b2Ending, { phase: 'running', elapsed: 0, alarm: 0 });
  b2Robots = b2DockX.map((x, index) => ({ name: ['R-02', 'R-05', 'R-07'][index], where: floorId(-2), x, facing: -1, wait: 0, elapsed: 0,
    mode: 'dock', hold: index * 700, lostTime: 0, captureTime: 0, door: null, image: null, chaseOriginX: null, spottedX: null,
    firstEncounter: false, pursuit: true, followToElevator: true, onCaught: showB2BadEnding }));
  b2DeleteBar.hidden = false;
  refreshB2Bar();
  mountB2Robots();
  playGameSound('elevator-alarm');
  showStatus('DELETE ARCHI 실행. 경보가 울리고 복도 끝 충전 도크에서 로봇들이 깨어나는 소리가 난다.', 4000);
}

// 장면을 새로 그릴 때(floor-change.js) 같은 장면에 있는 로봇만 스프라이트를 붙이고, B2 전체를 비상 모드로 그린다.
function mountB2Robots() {
  for (const robot of b2Robots) robot.door = robot.image = null;
  if (b2Ending.phase === 'running') hideB2Cabin(); // 칸에서 나왔으면 문 장면 상태를 지운다
  if (b2Ending.phase === 'idle' || room !== 'dynamic' || floorById.get(dynamicFloorId).floor !== -2) return;
  world.dataset.alarm = 'true';
  const stairs = currentDoors.find(door => door.type === 'stairs');
  if (stairs) stairs.message = 'ARCHI가 비상계단을 잠갔다. 문 위 표시등이 붉게 깜빡인다.';
  const dock = dynamicScene.querySelector('.fixture.dormant-bots');
  if (dock) dock.style.visibility = 'hidden';
  for (const robot of b2Robots) if (robot.where === dynamicFloorId) mountB2Robot(robot);
}

function mountB2Robot(robot) {
  const element = document.createElement('div');
  element.className = 'fixture guard-bot b2-guard-bot';
  element.setAttribute('aria-hidden', 'true');
  const sprite = document.createElement('div');
  sprite.className = 'guard-robot-sprite';
  const image = new Image();
  image.src = 'assets/objects/guard-robot/guard-patrol.png';
  image.alt = ''; image.draggable = false;
  sprite.append(image);
  element.append(sprite);
  dynamicScene.append(element);
  robot.door = { element, width: 78, patrol: { left: 80, right: worldWidth - 80, speed: 270, pause: 1400 } };
  robot.image = image;
  updateRobot(robot, 0);
}

// sceneId 장면에서 toward 장면으로 가는 문의 가운데 x. 방 안의 출구 위치는 scene-builder.js와 같은 식으로 구한다.
function b2DoorX(sceneId, toward) {
  const corridor = floorById.get(floorId(-2));
  const outside = corridor.rooms.find(entry => entry.target === (sceneId === corridor.id ? toward : sceneId));
  if (sceneId === corridor.id) return outside.doorX + (outside.doorWidth ?? 120) / 2;
  const config = floorById.get(sceneId);
  const width = config.exitWidth ?? outside.doorWidth ?? 120;
  return (config.exitX ?? exitDoorX(outside, config.width, width)) + width / 2;
}

function updateB2Ending(delta) {
  if (b2Ending.phase !== 'running' || b2Ending.offline) return;
  // 1층 전력을 끊기 전까지 삭제는 99%에서 멈춰 있다.
  b2Ending.elapsed = Math.min(b2DeleteDuration * .99, b2Ending.elapsed + delta);
  refreshB2Bar();
  b2Ending.alarm += delta;
  if (b2Ending.alarm >= 2000) { b2Ending.alarm -= 2000; playGameSound('elevator-alarm'); }
  if (b2Ending.stage === 'lobby') { updateB2Lobby(delta); return; }
  const here = room === 'dynamic' ? dynamicFloorId : null;
  const corridorId = floorId(-2);
  for (const robot of b2Robots) {
    if (robot.hold > 0) {
      robot.hold = Math.max(0, robot.hold - delta);
      continue;
    }
    if (robot.mode === 'dock') {
      robot.mode = 'chase';
      playGameSound('robot-alert', { x: robot.x });
    }
    if (robot.mode !== 'chase' || !here) continue;
    if (robot.where === here) {
      // 수호가 엘리베이터 칸 안에 있으면(loop.js가 updateGuardPatrol을 부르지 않는다) 그 엘리베이터 문 옆까지 온다.
      const stop = b2CabinStopX(robot);
      if (stop === null || robot.x === stop) continue;
      robot.facing = stop >= robot.x ? 1 : -1;
      robot.x += robot.facing * Math.min(Math.abs(stop - robot.x), 270 * delta / 1000);
      if (robot.door) updateRobot(robot, 0);
      continue;
    }
    // 다른 장면에 있는 로봇: 지금 장면의 문까지 걸어간다(방 → 복도 → 수호가 있는 방).
    const next = robot.where === corridorId ? here : corridorId;
    const doorX = b2DoorX(robot.where, next);
    robot.facing = doorX >= robot.x ? 1 : -1;
    robot.x += robot.facing * Math.min(Math.abs(doorX - robot.x), 270 * delta / 1000);
    if (robot.x !== doorX) continue;
    const from = robot.where;
    robot.where = next;
    robot.x = next === corridorId ? b2DoorX(corridorId, from) : b2DoorX(next, corridorId);
    if (next !== here) continue;
    // 수호가 있는 장면으로 문을 열고 들어온다: 문 소리, 문이 잠깐 열린 그림, 잠깐 멈춰 섰다가 다시 쫓는다.
    robot.hold = b2DoorHold;
    robot.facing = body.position.x >= robot.x ? 1 : -1;
    const door = currentDoors.find(entry => entry.key === (next === corridorId ? `room:${from}` : 'exit'));
    if (door) {
      door.element.dataset.open = 'true';
      setTimeout(() => { if (door.element.isConnected) door.element.dataset.open = 'false'; }, 900);
    }
    playGameSound('door', { x: robot.x });
    showStatus(`문이 벌컥 열리고 경비 로봇 ${robot.name}이 들어온다!`, 2400);
    mountB2Robot(robot);
  }
}

// 엘리베이터 문 장면(추격 중 칸 안): 1층을 누르면 문이 닫히기 시작한다. 로봇이 문 옆에 와 있으면 문을 억지로 열고
// "문 닫기" 게이지가 뜬다. Enter·스페이스(모바일은 게이지의 버튼이나 칸의 닫힘 버튼)를 연타하면 차고, 로봇은 계속 깎는다. 다 차면
// 1층으로 올라가며 휴대폰에 ARCHI 메시지가 오고, 도착하면 1층 장면(enterB2Lobby). 로봇이 다 깎거나 제한 시간이 지나면 붙잡힌다.
// 로봇이 아직 안 왔으면 게이지 없이 그냥 닫힌다. 문이 열린 채 1층을 안 누르고 있으면 문 옆에 온 로봇이 잠시 뒤 끌어낸다.
const b2DoorPush = 0.07; // E 한 번에 차는 양
const b2DoorDrain = 0.2; // 로봇이 1초에 깎는 양
const b2DoorLimit = 5000; // 게이지 제한 시간
const b2DoorGrabDelay = 1500; // 문이 열린 채일 때 로봇이 끌어내기까지
const b2RideTime = 3000; // B2 → 1층
const b2Cabin = { state: 'idle', gauge: 0, time: 0, grab: 0, robot: null };
const b2DoorGauge = document.getElementById('b2-door-gauge');
const b2DoorFill = document.getElementById('b2-door-fill');
const b2CabinRobot = document.getElementById('b2-cabin-robot');
const b2PhoneMessage = document.getElementById('b2-phone-message');

function b2CabinDoor() {
  return selectingFloor && cabinCarIndex !== null ? currentDoors.find(door => door.type === 'elevator' && door.carIndex === cabinCarIndex) : null;
}

// 칸 안의 수호를 쫓는 로봇이 멈춰 설 자리: 엘리베이터 문 가운데에서 로봇이 오는 쪽으로 60px.
function b2CabinStopX(robot) {
  const door = b2CabinDoor();
  if (!door) return null;
  const center = door.x + door.width / 2;
  return center + (robot.x >= center ? 60 : -60);
}

function b2RobotAtCabinDoor() {
  return b2Robots.find(robot => robot.mode === 'chase' && !robot.hold && robot.where === dynamicFloorId && robot.x === b2CabinStopX(robot)) ?? null;
}

// cabin.js의 updateCabin이 매 프레임 먼저 부른다. true면 이번 프레임의 칸 동작을 대신 처리한 것이다.
function updateB2Cabin() {
  if (b2Ending.phase !== 'running' || cabinCarIndex === null) return false;
  const car = elevatorCars[cabinCarIndex];
  if (b2Cabin.state === 'ride') {
    b2Cabin.time += step;
    cabinDisplay.textContent = `↑${b2Cabin.time < b2RideTime / 2 ? 'B1' : '1'}`;
    if (b2Cabin.time >= b2RideTime && !transitioning) transitionScene(() => enterB2Lobby(car));
    return true;
  }
  if (b2Cabin.state === 'struggle') {
    b2Cabin.time += step;
    b2Cabin.gauge = Math.max(0, b2Cabin.gauge - b2DoorDrain * step / 1000);
    refreshB2DoorGauge();
    if (!b2Cabin.gauge || b2Cabin.time >= b2DoorLimit) catchInCabin(b2Cabin.robot);
    return true;
  }
  const robot = b2RobotAtCabinDoor();
  if (!robot) { b2Cabin.grab = 0; showB2CabinRobot(false); return false; }
  showB2CabinRobot(true);
  const phase = cabinScene.dataset.door;
  if (phase === 'closing' && selectedFloor !== null) {
    // 닫히던 만큼 게이지가 차 있는 채로 시작한다(빨리 누를수록 유리하다).
    Object.assign(b2Cabin, { state: 'struggle', gauge: Math.max(.15, 1 - cabinDoorAmount), time: 0, robot });
    cabinScene.dataset.door = 'struggle';
    cabinStatus.textContent = '경비 로봇이 문을 억지로 연다! Enter나 스페이스를 연타해 문을 닫아라.';
    playGameSound('robot-grab', { x: robot.x });
    b2DoorGauge.hidden = false;
    refreshB2DoorGauge();
    cabin.focus({ preventScroll: true }); // 버튼에 초점이 있으면 Enter·스페이스가 그 버튼을 눌러 버린다
    return true;
  }
  if (phase === 'open' && selectedFloor === null) {
    if (!b2Cabin.grab) cabinStatus.textContent = '경비 로봇이 문 앞에 왔다! 1층을 눌러!';
    b2Cabin.grab += step;
    if (b2Cabin.grab >= b2DoorGrabDelay) {
      catchInCabin(robot);
      return true;
    }
  }
  return false;
}

function pushB2Door() {
  if (b2Cabin.state !== 'struggle') return;
  b2Cabin.gauge = Math.min(1, b2Cabin.gauge + b2DoorPush);
  playGameSound('switch');
  refreshB2DoorGauge();
  if (b2Cabin.gauge >= 1) startB2Ride(elevatorCars[cabinCarIndex]);
}

function refreshB2DoorGauge() {
  b2DoorFill.style.width = `${Math.round(b2Cabin.gauge * 100)}%`;
  // 게이지가 찰수록 문이 닫힌다(로봇이 깎으면 다시 벌어진다).
  cabinDoorAmount = .55 * (1 - b2Cabin.gauge);
  cabinScene.style.setProperty('--door-open', cabinDoorAmount);
}

function showB2CabinRobot(show) {
  if (b2CabinRobot.hidden === !show) return;
  b2CabinRobot.hidden = !show;
}

function startB2Ride(car) {
  Object.assign(b2Cabin, { state: 'ride', time: 0 });
  b2DoorGauge.hidden = true;
  showB2CabinRobot(false);
  car.open = false;
  cabinDoorAmount = 0;
  cabinScene.style.setProperty('--door-open', '0');
  cabinScene.dataset.door = 'closed';
  refreshSceneElevatorDoors();
  playGameSound('elevator-door');
  cabinStatus.textContent = '1층으로 올라가는 중';
  b2PhoneMessage.hidden = false;
  playGameSound('phone');
}

// 실패: 칸에서 끌려 나와 엘리베이터 문 앞에서 붙잡힌다(R-01과 같은 붙잡기 연출 → 베드엔딩 창).
function catchInCabin(robot) {
  const door = b2CabinDoor();
  const car = elevatorCars[cabinCarIndex];
  Object.assign(car, { rider: false, open: true });
  hideB2Cabin();
  selectingFloor = false;
  selectedFloor = null;
  cabinCarIndex = null;
  cabin.hidden = true;
  stage.inert = false;
  refreshSceneElevatorDoors();
  const center = door.x + door.width / 2;
  Body.setPosition(body, { x: center, y: floorY - 81 });
  Body.setVelocity(body, { x: 0, y: 0 });
  grounded = true;
  robot.x = center + (robot.x >= center ? 82 : -82);
  cameraX = cameraTarget();
  catchPlayer(robot);
}

function hideB2Cabin() {
  Object.assign(b2Cabin, { state: 'idle', gauge: 0, time: 0, grab: 0, robot: null });
  b2DoorGauge.hidden = b2CabinRobot.hidden = b2PhoneMessage.hidden = true;
  if (cabinScene.dataset.door === 'struggle') cabinScene.dataset.door = 'open';
}

document.getElementById('b2-door-push').addEventListener('click', pushB2Door);
cabinClose.addEventListener('click', pushB2Door);

function refreshB2Bar() {
  const percent = Math.floor(b2Ending.elapsed / b2DeleteDuration * 100);
  b2DeletePercent.value = `${percent}%`;
  b2DeleteFill.style.width = `${percent}%`;
}

// 엔딩 창이 뜨면 로봇은 그 자리에 멈춘다(hold가 줄지 않는다).
function endB2Ending() {
  b2Ending.phase = 'over';
  b2DeleteBar.hidden = true;
  hideB2Cabin();
  for (const robot of b2Robots) robot.hold = Infinity;
}

// 붙잡기 연출(1.1초)이 끝나면 guard-patrol.js가 부른다. catchPlayer가 막아 둔 화면에서 이 창만 다시 쓸 수 있게 한다.
function showB2BadEnding() {
  endB2Ending();
  b2BadEnding.inert = false;
  b2BadEnding.hidden = false;
  document.getElementById('b2-checkpoint').focus();
}

// 1층 장면: 엘리베이터에서 내리면 ARCHI가 옥상 태양광 장치로 1층에 전력을 넣어 둔 상태다(1층 전력 상태와 상관없이).
// 정문 앞 도크의 R-01이 로비 끝까지 지켜보다(sight) 수호를 보면 끝까지 쫓는다. 휴대폰 '비상 전력 제어' 앱(power.js)에서
// 1층 전력을 끊으면 R-01이 멈추고 삭제가 100%가 되며 ARCHI — OFFLINE. 그 뒤 정문으로 나가면 TRUE END. 앱을 열 때마다
// ARCHI가 b2SolarJam ms 동안 방해해서 버튼이 눌리지 않는다. 끊기 전에 R-01에게 잡히면 베드엔딩.
const b2SolarJam = 3500;
const b2LobbyR01 = { pursuit: true, followToElevator: true, sight: 4800, onCaught: showB2BadEnding };

function enterB2Lobby(car) {
  arriveCabinAt(car, 1);
  Object.assign(car, { rider: false, open: true });
  hideB2Cabin();
  selectingFloor = false;
  cabin.hidden = true;
  stage.inert = false;
  releaseInput();
  b2Robots = []; // B2 로봇은 지하에 남는다
  b2Ending.stage = 'lobby';
  if (allPowerOverride) setAllFloorsPower(false); // 콘솔의 테스트용 전체 전력이 켜져 있으면 1층을 끌 수 없다
  collectedItems.add('solar-app-installed'); // 끝까지 앱 없이 왔어도 끌 수단은 있어야 한다
  solarEnabled = true;
  solarPoweredFloors = [1];
  performFloorChange('f1', cabinCarIndex);
  cabinCarIndex = null;
  Object.assign(guardPatrol, { x: 4530, facing: -1, wait: 0, elapsed: 0, mode: 'dock', lostTime: 0, captureTime: 0 }, b2LobbyR01);
  updatePowerState();
  showStatus('1층. 정문 앞에서 R-01이 이쪽을 보고 있다. 휴대폰(P)의 비상 전력 제어로 1층 전력을 끊어야 한다.', 5000);
}

function updateB2Lobby(delta) {
  if (b2Ending.jam > 0) {
    b2Ending.jam = Math.max(0, b2Ending.jam - delta);
    if (!b2Ending.jam) refreshSolarApp();
  }
  if (dynamicFloorId !== 'f1' || floorHasPower(1)) return;
  // 1층 전력이 끊겼다: R-01은 updateGuardPatrol의 전력 없음 처리로 그 자리에 멈춘다.
  b2Ending.offline = true;
  b2Ending.elapsed = b2DeleteDuration;
  refreshB2Bar();
  b2DeleteBar.querySelector('span').textContent = 'ARCHI — OFFLINE';
  b2DeleteBar.dataset.offline = 'true';
  for (const key of Object.keys(b2LobbyR01)) delete guardPatrol[key]; // 다시 전력이 들어와도 평소 R-01로 돌아간다
  playGameSound('blackout');
  showStatus('ARCHI — OFFLINE. R-01이 그 자리에 멈췄다. 정문으로 나가자.', 5000);
}

// 휴대폰 '비상 전력 제어' 앱을 열 때(phone.js) 1층 장면이면 ARCHI가 잠시 막는다.
function jamB2SolarApp() {
  if (b2Ending.phase !== 'running' || b2Ending.stage !== 'lobby' || b2Ending.offline) return;
  b2Ending.jam = b2SolarJam;
  refreshSolarApp();
}

function b2SolarJammed() {
  return b2Ending.jam > 0;
}

function b2DoorStruggling() {
  return b2Cabin.state === 'struggle';
}

// ARCHI가 꺼진 뒤 1층 정문을 조사하면(interaction.js) TRUE END.
function enterB2TrueEnd(door) {
  if (!b2Ending.offline || b2Ending.phase !== 'running' || dynamicFloorId !== 'f1' || door.name !== '정문') return false;
  playGameSound('door');
  showB2Escape();
  return true;
}

// TRUE END(임시) 창.
function showB2Escape() {
  endB2Ending();
  releaseInput();
  b2EscapeBlocked = [...document.body.children].filter(element => element !== b2Escape && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of b2EscapeBlocked) element.inert = true;
  b2Escape.hidden = false;
  document.getElementById('b2-escape-menu').focus();
}

// 불러오기·새 게임(save.js restoreProgress)이 장면을 다시 짓기 전에 엔딩 상태를 모두 지운다.
function resetB2Ending() {
  Object.assign(b2Ending, { phase: 'idle', stage: 'b2', elapsed: 0, alarm: 0, offline: false, jam: 0 });
  b2Robots = [];
  caughtBy = null;
  for (const key of Object.keys(b2LobbyR01)) delete guardPatrol[key];
  b2DeleteBar.querySelector('span').replaceChildren('ARCHI DELETE PROCESS ', b2DeletePercent);
  delete b2DeleteBar.dataset.offline;
  b2DeleteBar.hidden = b2BadEnding.hidden = b2Escape.hidden = true;
  hideB2Cabin();
  for (const element of b2EscapeBlocked) element.inert = false;
  b2EscapeBlocked = [];
}

document.getElementById('b2-restart').addEventListener('click', () => {
  try { localStorage.removeItem(b2CheckpointKey); } catch { /* 저장소가 없어도 새 게임은 시작한다. */ }
  startNewGame();
});
document.getElementById('b2-checkpoint').addEventListener('click', () => {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(b2CheckpointKey)); } catch { /* 아래에서 알린다. */ }
  if (!data?.scene) { showStatus('체크포인트를 불러오지 못했습니다. 처음부터 다시 시작해 주세요.', 5000); return; }
  restoreProgress(data);
  saveProgress();
  showStatus('DELETE를 누르기 직전으로 돌아왔습니다.', 3000);
});
document.getElementById('b2-escape-menu').addEventListener('click', () => {
  // 삭제 중에는 자동 저장을 멈췄으므로 저장 칸은 DELETE 직전 상태다. 메뉴의 '이어하기'는 그 저장에서 시작한다.
  resetB2Ending();
  gameStarted = false;
  mainMenuActive = true;
  document.body.dataset.mainMenu = 'true';
  showMainMenu();
});
