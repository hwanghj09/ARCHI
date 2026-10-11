// B2 마지막 엔딩(추격전) 최소 버전. 메인 서버실 콘솔의 DELETE → 경고 [예]를 누르기 직전에 체크포인트를 따로 저장하고
// 삭제를 시작한다: 화면 위 진행 바(35초, 100%가 돼도 아직 아무 일 없음), 붉은 비상등(#room-alarm), 경보음, 비상계단 잠김 문구.
// 충전 도크의 경비 로봇 R-02·R-05·R-07이 차례로 깨어나 수호를 쫓는다(guard-patrol.js의 updateRobot, 속도는 R-01 추격과 같은 270px/s).
// 로봇은 수호와 다른 장면(복도/방)에 있으면 보이지 않는 채로 그 장면의 문까지 걸어가 문을 열고 들어온다.
// 잡히면 R-01과 같은 붙잡기 연출 뒤 베드엔딩 창, 엘리베이터 칸에 들어가면 임시 해피엔딩 창. 삭제가 시작된 뒤로는 자동 저장을 멈춘다.
const b2CheckpointKey = 'archi.checkpoint.b2';
const b2DeleteDuration = 35000;
const b2DockX = [4790, 4850, 4910]; // 충전 도크(대기 중인 경비 로봇 fixture)의 세 자리
const b2DoorHold = 700; // 문을 열고 들어온 로봇이 잠깐 멈춰 서는 시간
const b2Ending = { phase: 'idle', elapsed: 0, alarm: 0 }; // phase: idle → running → over
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
  if (b2Ending.phase !== 'running') return;
  b2Ending.elapsed = Math.min(b2DeleteDuration, b2Ending.elapsed + delta);
  refreshB2Bar();
  b2Ending.alarm += delta;
  if (b2Ending.alarm >= 2000) { b2Ending.alarm -= 2000; playGameSound('elevator-alarm'); }
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
    if (robot.mode !== 'chase' || robot.where === here || !here) continue;
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

function refreshB2Bar() {
  const percent = Math.floor(b2Ending.elapsed / b2DeleteDuration * 100);
  b2DeletePercent.value = `${percent}%`;
  b2DeleteFill.style.width = `${percent}%`;
}

// 엔딩 창이 뜨면 로봇은 그 자리에 멈춘다(hold가 줄지 않는다).
function endB2Ending() {
  b2Ending.phase = 'over';
  b2DeleteBar.hidden = true;
  for (const robot of b2Robots) robot.hold = Infinity;
}

// 붙잡기 연출(1.1초)이 끝나면 guard-patrol.js가 부른다. catchPlayer가 막아 둔 화면에서 이 창만 다시 쓸 수 있게 한다.
function showB2BadEnding() {
  endB2Ending();
  b2BadEnding.inert = false;
  b2BadEnding.hidden = false;
  document.getElementById('b2-checkpoint').focus();
}

// 엘리베이터 칸에 들어가는 순간(cabin.js) 칸 화면 대신 띄운다.
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
  Object.assign(b2Ending, { phase: 'idle', elapsed: 0, alarm: 0 });
  b2Robots = [];
  caughtBy = null;
  b2DeleteBar.hidden = b2BadEnding.hidden = b2Escape.hidden = true;
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
