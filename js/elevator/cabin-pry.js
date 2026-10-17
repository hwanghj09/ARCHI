// 엘리베이터 문 강제 개방: 쫓던 순찰 로봇 R-03(guard-patrol.js)이 수호가 탄 칸의 문 옆까지 오면(칸이 그 층에 서 있을 때)
// 층 버튼을 눌러 문이 닫히던 참이면 문틈에 손을 넣어 억지로 연다(assets/ending/elevator-gap-robot.png). "문 닫기" 게이지가 뜨고
// Enter·스페이스(모바일은 게이지 버튼이나 칸의 닫힘 버튼)를 연타하면 차고, 로봇은 계속 깎는다. 다 차면 문이 닫히고 고른 층으로 간다.
// 다 깎이거나 제한 시간이 지나면 끌려 나와 붙잡힌다. 층을 안 누르고 문이 열린 채 있으면 문 옆에 온 로봇이 잠시 뒤 끌어낸다.
const cabinPryPush = 0.07; // 한 번 누를 때 차는 양
const cabinPryDrain = 0.2; // 로봇이 1초에 깎는 양
const cabinPryLimit = 5000; // 게이지 제한 시간
const cabinPryGrabDelay = 1500; // 문이 열린 채일 때 로봇이 끌어내기까지
const cabinPry = { state: 'idle', gauge: 0, time: 0, grab: 0 };
const cabinPryGauge = document.getElementById('cabin-pry-gauge');
const cabinPryFill = document.getElementById('cabin-pry-fill');
const cabinPryRobot = document.getElementById('cabin-pry-robot');

function cabinPryDoor() {
  return cabinCarIndex === null ? null : currentDoors.find(door => door.type === 'elevator' && door.carIndex === cabinCarIndex);
}

// 로봇이 멈춰 설 자리: 문 가운데에서 로봇이 오는 쪽으로 60px.
function cabinPryStopX() {
  const door = cabinPryDoor();
  if (!door) return null;
  const center = door.x + door.width / 2;
  return center + (roamer.x >= center ? 60 : -60);
}

function roamerChasingCabin() {
  const car = elevatorCars[cabinCarIndex];
  return Boolean(car) && roamer.mode === 'chase' && Boolean(roamer.door) && room === 'dynamic' && roamer.where === dynamicFloorId &&
    !car.travelling && car.floor === currentSceneFloor;
}

// 칸 안에서는 loop.js가 updateGuardPatrol 대신 이걸 부른다. 쫓던 R-03이 그 엘리베이터 문 옆까지 온다.
function updateRoamerCabin(delta) {
  const stop = cabinPryStopX();
  if (stop === null || !roamerChasingCabin() || roamer.x === stop) return;
  roamer.facing = stop >= roamer.x ? 1 : -1;
  const distance = Math.min(Math.abs(stop - roamer.x), roamer.chaseSpeed() * delta / 1000);
  roamer.x += roamer.facing * distance;
  updateRobotMovementSound(roamer, distance);
  updateRobot(roamer, 0);
}

// cabin.js의 updateCabin이 매 프레임 먼저 부른다. true면 이번 프레임의 칸 동작을 대신 처리한 것이다.
function updateCabinPry() {
  if (cabinPry.state === 'struggle') {
    cabinPry.time += step;
    cabinPry.gauge = Math.max(0, cabinPry.gauge - cabinPryDrain * step / 1000);
    refreshCabinPry();
    if (!cabinPry.gauge || cabinPry.time >= cabinPryLimit) catchInCabinPry();
    return true;
  }
  const atDoor = roamerChasingCabin() && roamer.x === cabinPryStopX();
  cabinPryRobot.hidden = !atDoor;
  if (!atDoor) { cabinPry.grab = 0; return false; }
  const phase = cabinScene.dataset.door;
  if (phase === 'closing' && selectedFloor !== null) {
    // 닫히던 만큼 게이지가 차 있는 채로 시작한다(빨리 누를수록 유리하다).
    Object.assign(cabinPry, { state: 'struggle', gauge: Math.max(.15, 1 - cabinDoorAmount), time: 0 });
    cabinScene.dataset.door = 'struggle';
    cabinStatus.textContent = '경비 로봇이 문을 억지로 연다! Enter나 스페이스를 연타해 문을 닫아라.';
    playDoorPrySound();
    cabinPryGauge.hidden = false;
    refreshCabinPry();
    cabin.focus({ preventScroll: true }); // 버튼에 초점이 있으면 Enter·스페이스가 그 버튼을 눌러 버린다
    return true;
  }
  if (phase === 'open' && selectedFloor === null) {
    if (!cabinPry.grab) cabinStatus.textContent = '경비 로봇이 문 앞에 왔다! 층 버튼을 눌러!';
    cabinPry.grab += step;
    if (cabinPry.grab >= cabinPryGrabDelay) { catchInCabinPry(); return true; }
  }
  return false;
}

function pushCabinPry() {
  if (cabinPry.state !== 'struggle') return;
  cabinPry.gauge = Math.min(1, cabinPry.gauge + cabinPryPush);
  playGameSound('switch');
  refreshCabinPry();
  if (cabinPry.gauge < 1) return;
  // 밀어냈다: 문이 닫히면 cabin.js가 고른 층으로 평소처럼 간다. 로봇은 그 층에 남는다.
  hideCabinPry();
  elevatorCars[cabinCarIndex].open = false;
  cabinDoorAmount = 0;
  cabinScene.style.setProperty('--door-open', '0');
  cabinScene.dataset.door = 'closed';
  refreshSceneElevatorDoors();
  playGameSound('elevator-door');
  cabinStatus.textContent = '문을 닫았다. 경비 로봇이 문틈에서 밀려났다.';
  roamer.mode = 'patrol';
}

function cabinPryStruggling() {
  return cabinPry.state === 'struggle';
}

function refreshCabinPry() {
  cabinPryFill.style.width = `${Math.round(cabinPry.gauge * 100)}%`;
  // 게이지가 찰수록 문이 닫힌다(로봇이 깎으면 다시 벌어진다).
  cabinDoorAmount = .55 * (1 - cabinPry.gauge);
  cabinScene.style.setProperty('--door-open', cabinDoorAmount);
}

function hideCabinPry() {
  Object.assign(cabinPry, { state: 'idle', gauge: 0, time: 0, grab: 0 });
  cabinPryGauge.hidden = cabinPryRobot.hidden = true;
  if (cabinScene.dataset.door === 'struggle') cabinScene.dataset.door = 'open';
}

// 실패: 칸에서 끌려 나와 엘리베이터 문 앞에서 붙잡힌다(R-01과 같은 붙잡기 연출 → '다시 시도' 창).
function catchInCabinPry() {
  const door = cabinPryDoor();
  Object.assign(elevatorCars[cabinCarIndex], { rider: false, open: true });
  hideCabinPry();
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
  roamer.x = center + (roamer.x >= center ? 82 : -82);
  cameraX = cameraTarget();
  catchPlayer(roamer);
}

document.getElementById('cabin-pry-push').addEventListener('click', pushCabinPry);
cabinClose.addEventListener('click', pushCabinPry);
