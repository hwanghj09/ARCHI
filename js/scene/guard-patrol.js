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
// 돈다. 엘리베이터에서 내리면 왼쪽으로 걸어가며 그쪽 방을 차례로 들르고(전등이 켜진 층만, toVisit) 왼쪽 끝까지 간 뒤,
// 오른쪽으로 돌아서 같은 식으로 오른쪽 끝까지 보고 엘리베이터로 간다(endsLeft: 아직 안 간 복도 끝, 앞이 지금 방향).
// 꺼진 층에서는 방에 들르지 않고 복도 양쪽 끝만 본다. 다음 층은 켜진 층을 3배 더 자주 고른다.
// 정전 뒤에만 움직이고 B2 엔딩 중에는 멈춘다. 수호와 다른 장면에 있는 동안에는 머무는 시간(stay)만 줄다가
// 다 되면 바로 다음 장면으로 옮긴다. 같은 장면이면 나갈 문(엘리베이터)까지 걸어가서 나간다.
// 층을 옮길 때는 진짜 엘리베이터(elevatorCars)를 쓴다: 비어 있는 칸을 불러 문이 열리면 타고(trip 'call' → 'board'),
// 문이 완전히 닫힌 뒤 운행하고('close' → 'ride'), 도착해 문이 완전히 열리면 내린다('exit'). 승강기 전력이 없으면 이 층을 계속 돈다.
const roamerFloors = [-1, ...Array.from({ length: 15 }, (_, index) => index + 2)];
// hall: 수호와 같은 복도에서 다음 목적지로 걷기 전에 머무는 시간, look: 복도 끝에서 둘러보는 시간.
// 수호가 없는 복도에서는 다음 목적지까지 걸어갈 시간만큼 머문다(roamerTravel).
const roamerStay = { hall: 1000, look: 1400, room: 10000, ride: 6000 };
const roamerSpeed = { patrol: 140, chase: 220 }; // 추격은 R-01(270)보다 느리다. 걷기 200·달리기 340
// 수호가 문으로 나오자마자 붙잡히지 않게, 수호가 들어온 문 앞에서 이만큼은 떨어져 있는다(전방 센서보다 멀다).
const roamerSafeDistance = 800;
const roamerInitialState = { where: 'f9', next: 'elevator', lastFloor: null, stay: 60000, car: null, trip: null, toVisit: [], endsLeft: [], x: 0, facing: -1, wait: 0, elapsed: 0,
  mode: 'patrol', lostTime: 0, captureTime: 0, door: null, image: null, chaseOriginX: null, spottedX: null, firstEncounter: false, follow: false };
// 쫓기던 수호가 방 문(복도 ↔ 방)으로 빠져나가면 R-03은 이만큼 뒤에 같은 문으로 따라 들어와 계속 쫓는다(follow).
const roamerFollowDelay = 1500;
const roamer = { name: 'R-03', ...roamerInitialState, selfPowered: true,
  followToElevator: true, chaseSpeed: () => roamerSpeed.chase,
  sensor: 480 }; // 화면 절반(640px)보다 짧아, 감지되기 전에 화면에서 먼저 보인다
// R-03은 엘리베이터 앞에서도 쫓아오고, 칸에 탄 수호를 따라 문을 억지로 연다(cabin-pry.js).
// 환풍구(층 설정 fixtures의 hideSpot): 앞에 앉아서 E를 누르면 엘리베이터처럼 화면을 전환해 안에 숨는다. 숨은 동안 수호는
// 그려지지 않고 덕트 안에서 밖을 내다보는 화면(#vent-view)이 덮이며, 로봇은 계속 움직이지만 보지도 붙잡지도 못한다. E로 나온다.
// 구멍 너머는 엘리베이터 칸의 문틈처럼 맞은편 벽을 보인다: 지금 장면의 배경 그림(복도 한 장, 방은 천장·바닥·벽 여러 겹),
// 그 위에 칠한 실내 벽(painted-wall)·외부 창을 복제한다. 문·엘리베이터·소품은 빼고, 칠한 벽은 문 개구부까지 채운다
// (유리 전면·기둥은 원래 그림 그대로).
// 어느 부분을 보일지는 환풍구의 viewX(월드 x, 없으면 환풍구 자리)이고, 로봇은 환풍구와의 거리만큼 그 위에 옮겨 그린다.
let hidingInVent = false;
let ventSpot = null;
const ventView = document.getElementById('vent-view');
const ventOutside = document.getElementById('vent-outside');
const ventWorld = document.getElementById('vent-world');
const ventRobot = document.getElementById('vent-robot');
const playerHidden = () => hidingInVent;
function setVentHiding(value, spot = null) {
  hidingInVent = value;
  ventSpot = spot;
  ventView.hidden = !value;
  sprite.style.visibility = value ? 'hidden' : '';
  hint.hidden = interactionOutline.hidden = true;
  document.getElementById('vent-view-text').textContent = value ? `환풍구 안에 숨어 있다 · ${bindingLabel('interact')} 나가기` : '';
  if (!value) { ventWorld.replaceChildren(); return; }
  const walls = dynamicScene.querySelectorAll(':scope > .floor-background, :scope > .floor-art-crop, :scope > .painted-wall, :scope > .exterior-window');
  ventWorld.replaceChildren(...[...walls].map(element => element.cloneNode(true)));
  const painted = ventWorld.querySelector('.painted-wall');
  if (painted) painted.style.clipPath = paintedWallClip(floorById.get(dynamicFloorId), []);
  Object.assign(ventWorld.style, { width: `${worldWidth}px`, background: dynamicScene.style.background });
  ventOutside.style.filter = floorHasLighting(currentSceneFloor) ? '' : 'brightness(.3)'; // 불 꺼진 층은 어둡게
  updateVentView();
}
const enterVent = spot => transitionScene(() => setVentHiding(true, spot));
const leaveVent = () => transitionScene(() => setVentHiding(false));

function updateVentView() {
  if (!hidingInVent) return;
  const { width, height } = ventOutside.getBoundingClientRect();
  // 복제한 벽은 월드 좌표(바닥 y 570) 그대로다. 복도 바로 앞에 웅크린 시점이라 층 높이 전체가 아니라
  // 바닥 쪽 380px만 구멍에 채우고(층 전체의 2배 확대), 바닥선을 구멍 높이의 80%에 둔다.
  const zoom = height / 380;
  const center = ventSpot.x + ventSpot.width / 2;
  const viewX = ventSpot.viewX ?? center;
  const offset = width / 2 - viewX * zoom;
  const top = height * .8 - floorY * zoom;
  ventWorld.style.transform = `translate(${offset}px, ${top}px) scale(${zoom})`;
  // 가장 가까운 로봇 하나를 환풍구와의 거리만큼 옮겨 같은 모습(프레임·방향)으로 그린다.
  const robot = [guardPatrol, roamer, ...b2Robots].filter(entry => entry.door)
    .sort((a, b) => Math.abs(a.x - center) - Math.abs(b.x - center))[0];
  ventRobot.hidden = !robot;
  if (!robot) return;
  // 로봇만 배경의 2배로 키운다(구멍 바로 앞을 지나가는 느낌). 위치는 배경 배율 그대로, 바퀴는 바닥선에 붙인다.
  const robotZoom = zoom * 2;
  const x = offset + (viewX + robot.x - center) * zoom - 80 * robotZoom;
  const y = top + floorY * zoom - 237 * .625 * robotZoom;
  ventRobot.style.transform = `translate(${x}px, ${y}px) scale(${robotZoom})`;
  const [from, to] = [robot.door.element.firstElementChild, ventRobot.firstElementChild];
  to.style.cssText = from.style.cssText;
  const [image, copy] = [robot.image, to.firstElementChild];
  if (copy.getAttribute('src') !== image.getAttribute('src')) copy.src = image.getAttribute('src');
  copy.style.cssText = image.style.cssText;
}
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
  stopVentPry(); // 환풍구 덮개를 뜯다가 들키면 그만둔다(vent-pry.js)
  cancelPhoneLightDelay();
  closePhone();
  playGameSound('robot-grab', { x: robot.x });
  playerCaught = true; caughtBy = robot;
  robot.mode = 'grab'; robot.captureTime = 0;
  robot.facing = body.position.x >= robot.x ? 1 : -1;
  // Keep the held body inside the 32px walls without shortening the arm reach.
  const margin = 32 + (body.bounds.max.x - body.bounds.min.x) / 2;
  const heldX = Math.max(margin, Math.min(worldWidth - margin, robot.x + robot.facing * 104));
  robot.x = heldX - robot.facing * 104;
  facing = -robot.facing;
  phoneLightOn = false;
  refreshPhone();
  releaseInput();
  Body.setVelocity(body, { x: 0, y: 0 });
  hint.hidden = interactionOutline.hidden = true;
  guardBlocked = [...document.body.children].filter(element => element !== guardCapturePanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of guardBlocked) element.inert = true;
}

// 붙잡힌 뒤 같은 자리에서 다시 시작하는 단계는 화면에서 없앴다(불러오기만 남는다). 테스트·내부에서만 부른다.
function retryGuardCapture() {
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
}

// 경비 로봇 스프라이트를 지금 장면에 붙인다(R-03, B2 엔딩 로봇).
function mountRobot(robot, className, patrol) {
  robot.soundDistance = 0;
  const element = document.createElement('div');
  element.className = `fixture guard-bot ${className}`;
  element.setAttribute('aria-hidden', 'true');
  const sprite = document.createElement('div');
  sprite.className = 'guard-robot-sprite';
  const image = new Image();
  image.src = 'assets/objects/guard-robot/guard-humanoid-v2-idle.png';
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
  const link = config.links?.find(entry => entry.target === toward);
  if (link) return link.x + (link.width ?? 120) / 2;
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

// 같은 층 방끼리의 연결문(links)도 R-03이 지나간다. 이쪽에서 잠긴 연결문(16층 편의점→주방 반입문)과
// 13층 보안 자료실 연결문의 전자 잠금·셔터(vault-puzzle.js vaultLinkLocked)는 수호와 똑같이 막힌다.
function roamerLinkOpen(config, link) {
  return !link.locked && floorById.get(link.target)?.floor === config.floor && !vaultLinkLocked(link.target);
}

const roamerHasExit = config => floorById.get(config.parent).rooms.some(entry => entry.target === config.id);

// 지금 그 길로 갈 수 있는지. 갈 곳을 정한 뒤 셔터가 내려가면 다시 고른다.
function roamerCanGo(sceneId, next) {
  const config = floorById.get(sceneId);
  const link = config.links?.find(entry => entry.target === next);
  return link ? roamerLinkOpen(config, link) : next === 'elevator' || roamerEnds.includes(next) || !config.interior || roamerHasExit(config);
}

const roamerEnds = ['left', 'right'];
// 복도 끝 x(순찰 구간 끝, mountRoamer와 같다). 복도는 폭이 모두 corridorWidth다.
const roamerEndX = end => end === 'left' ? 80 : corridorWidth - 80;

// 복도에서 다음 목적지(방 문·복도 끝·엘리베이터)의 x.
function roamerTargetX(sceneId, next) {
  return roamerEnds.includes(next) ? roamerEndX(next) : next === 'elevator' ? roamerElevatorX(roamer.car ?? 0, sceneId) : sceneDoorX(sceneId, next);
}

// 수호가 없는 복도에서 다음 목적지까지 걸어가는 시간만큼 머문다.
const roamerTravel = (sceneId, next) => Math.abs(roamerTargetX(sceneId, next) - roamer.x) / roamerSpeed.patrol * 1000;

// 이 층에서 한 바퀴 돌 때 들를 방: 복도에 딸린 방 전부(연결문으로만 들어가는 방 포함). 잠기는 방(exitLock)은 뺀다.
function roamerFloorRooms(config) {
  if (!roamerFloorLit(config.floor)) return [];
  return [...floorById.values()].filter(entry => entry.interior && entry.parent === config.id && !entry.exitLock).map(entry => entry.id);
}

// 한 바퀴를 새로 시작한다: 왼쪽 끝, 오른쪽 끝 순서로 복도를 훑으며 방을 모두 들른다.
function startRoamerRound(config) {
  Object.assign(roamer, { toVisit: roamerFloorRooms(config), endsLeft: [...roamerEnds] });
}

// 방은 아직 안 들른 옆방이 연결문 너머에 있으면 그리로, 아니면 복도로 나간다. 복도 출구가 없는 방(보안 자료실)은
// 들어온 연결문으로 되돌아 나간다. 나갈 길이 모두 막혔으면 null(이 방에 더 머문다).
// 복도는 지금 향하는 끝(endsLeft[0]) 쪽에 아직 안 들른 방이 있으면 가장 가까운 그 방으로, 없으면 그 끝으로 간다.
// 양쪽 끝을 다 봤으면 남은 방(가까운 순), 그것도 없으면 엘리베이터로 간다.
function pickRoamerNext(config, from = null) {
  if (config.interior) {
    const open = (config.links ?? []).filter(link => roamerLinkOpen(config, link));
    const unvisited = open.find(link => roamer.toVisit.includes(link.target));
    if (unvisited) return unvisited.target;
    if (roamerHasExit(config)) return config.parent;
    return (open.find(link => link.target === from) ?? open[0])?.target ?? null;
  }
  const end = roamer.endsLeft[0];
  const direction = end === 'left' ? -1 : 1;
  const offset = entry => sceneDoorX(config.id, entry.target) - roamer.x;
  const rooms = config.rooms.filter(entry => roamer.toVisit.includes(entry.target) && (!end || offset(entry) * direction >= 0))
    .sort((a, b) => Math.abs(offset(a)) - Math.abs(offset(b)));
  return rooms[0]?.target ?? end ?? 'elevator';
}

// 다음 목적지를 정하고 그 장면에 머물 시간을 정한다.
function setRoamerNext(config, from = null) {
  roamer.next = pickRoamerNext(config, from);
  if (config.interior) roamer.stay = roamerStay.room;
  else roamer.stay = config.id === roamerHere() || roamer.next === null ? roamerStay.hall : roamerTravel(config.id, roamer.next);
}

// 복도 끝에 닿았다(수호와 같은 장면이면 걸어서, 아니면 걸어갈 시간이 지나서): 잠깐 둘러보고 다음 목적지로.
function roamerToEnd() {
  const x = roamerEndX(roamer.next);
  if (roamer.door && roamer.x !== x) {
    if (roamer.mode === 'patrol') Object.assign(roamer, { mode: 'return', chaseOriginX: x, wait: 0 });
    return;
  }
  if (roamer.door && roamer.mode !== 'patrol') return;
  roamer.x = x;
  roamer.endsLeft = roamer.endsLeft.filter(end => end !== roamer.next);
  setRoamerNext(floorById.get(roamer.where));
  if (roamer.door) roamer.stay = roamerStay.look;
}

// sceneId 장면에서 other 장면으로 이어진 문(지금 장면에 그려져 있을 때만).
function roamerDoor(sceneId, other) {
  if (sceneId !== roamerHere() || other === 'elevator') return null;
  const config = floorById.get(sceneId);
  const key = !config.interior ? `room:${other}` : other === config.parent ? 'exit' : `link:${other}`;
  return currentDoors.find(entry => entry.key === key) ?? null;
}

function openRoamerDoor(door) {
  if (!door) return;
  door.element.dataset.open = 'true';
  setTimeout(() => { if (door.element.isConnected) door.element.dataset.open = 'false'; }, 900);
}

function roamerEnter(sceneId, from) {
  const config = floorById.get(sceneId);
  const follow = roamer.follow;
  Object.assign(roamer, { where: sceneId, mode: 'patrol', wait: 0, lostTime: 0, follow: false });
  roamer.x = from === 'elevator' ? roamerElevatorX() : sceneDoorX(sceneId, from);
  if (from === 'elevator') startRoamerRound(config);
  roamer.toVisit = roamer.toVisit.filter(id => id !== sceneId);
  setRoamerNext(config, from);
  // 수호가 있는 층에 엘리베이터로 오면 도착음을 거리와 상관없이 들려준다(그 층의 방 안에서도). 로봇이 왔다는 신호다.
  if (from === 'elevator' && room === 'dynamic' && currentSceneFloor === config.floor) playGameSound('elevator-arrive');
  if (sceneId !== roamerHere()) return;
  mountRoamer();
  roamer.facing = roamer.x < worldWidth / 2 ? 1 : -1;
  openRoamerDoor(roamerDoor(sceneId, from));
  if (from !== 'elevator') playGameSound('door', { x: roamer.x });
  if (follow) Object.assign(roamer, { mode: 'chase', chaseOriginX: roamer.x, spottedX: body.position.x });
}

// 쫓던 R-03은 문 하나로 이어진 장면(복도·방·연결문 너머 방, 잠기는 방 포함)이면 어디든 따라 들어간다.
// 엘리베이터·계단으로 옮긴 경우만 놓친다. 지금 장면(currentDoors)에 R-03이 있던 장면으로 가는 방 문이 있는지로 본다.
function roamerCanFollow(sceneId) {
  return sceneId !== null && sceneId !== roamer.where &&
    currentDoors.some(door => door.type === 'room' && door.target === roamer.where);
}

function roamerLeave() {
  const { where, next } = roamer;
  if (roamer.door) {
    // 문을 열고 나간다. 예전엔 문 앞에서 스프라이트만 지워져 갑자기 사라진 것처럼 보였다.
    openRoamerDoor(roamerDoor(where, next));
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
    startRoamerRound(config);
    setRoamerNext(config);
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
    else if (!roamerCanGo(roamer.where, roamer.next)) {
      // 갈 길이 막혔다(셔터가 내려갔다): 머무는 시간을 기다리지 않고 바로 다른 곳으로 순찰하러 간다.
      // 나갈 길이 모두 막혔으면(null) 매 프레임 다시 보다가 열리는 즉시 나간다. 수호를 따라가던 중이었으면 추격도 끝난다.
      roamer.follow = false;
      roamer.next = pickRoamerNext(floorById.get(roamer.where));
      if (roamer.next !== null) roamer.stay = 0;
    }
    else if ((roamer.stay -= delta) > 0) { /* 아직 이 장면에 머문다 */ }
    else if (roamer.next === 'elevator') roamerToElevator();
    else if (roamerEnds.includes(roamer.next)) roamerToEnd();
    else {
      const exitX = sceneDoorX(roamer.where, roamer.next);
      // 수호가 있는 장면으로 들어올 문 바로 앞에 수호가 서 있으면 조금 뒤에 들어온다.
      if (!roamer.door && !roamer.follow && roamerNearSuho(roamer.next, sceneDoorX(roamer.next, roamer.where))) roamer.stay = 2000;
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
  // 다만 쫓기던 수호가 방 문으로 나갔으면 roamerFollowDelay 뒤에 같은 문으로 따라 들어온다.
  const chasing = roamer.where && (roamer.follow || (roamer.mode === 'chase' && roamer.door));
  roamer.door = roamer.image = null;
  roamer.mode = 'patrol'; roamer.lostTime = 0; roamer.follow = false;
  if (chasing && roamerCanFollow(roamerHere())) {
    Object.assign(roamer, { next: roamerHere(), stay: roamerFollowDelay, follow: true, trip: null, car: null });
  } else if (roamer.where && roamer.where === roamerHere()) {
    // 복도에서 걸어갈 시간을 기다리던 중이면 이제 직접 걸어간다.
    if (!floorById.get(roamer.where).interior && roamer.next !== 'elevator') roamer.stay = Math.min(roamer.stay, roamerStay.hall);
    keepRoamerClear(); mountRoamer();
  }
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
  image.src = 'assets/objects/guard-robot/guard-humanoid-v2-idle.png';
  image.alt = ''; image.draggable = false;
  window.append(image);
  guardPatrol.door.element.replaceChildren(window);
  guardPatrol.image = image;
  updateGuardPatrol(0);
}

// 1층 R-01은 정비 패널에 0914를 넣으면(f1-robot-log) 꺼진다: 전력이 들어와도, B2 엔딩의 1층에서도 멈춰 있다. B2 로봇은 해당 없다.
// R-01은 비상 UPS가 아니라 로비 조명 전력(휴대폰 전력 앱으로 1층 공급)이 들어와야 기동한다(floor-01.js 정비 기록).
function guardPatrolPowered(robot) {
  return world.dataset.powered === 'true' &&
    !(robot === guardPatrol && (collectedItems.has('f1-robot-log') || !floorHasLighting(1)));
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
    Body.setPosition(body, { x: robot.x + robot.facing * 104, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true;
    if (robot.captureTime >= 1100 && (robot.onCaught ? robot.mode === 'grab' : guardCapturePanel.hidden)) {
      robot.mode = 'caught';
      if (robot.onCaught) robot.onCaught();
      else {
        guardCapturePanel.hidden = false;
        guardCapturePanel.querySelector('.game-over-load').focus();
      }
    }
  } else if (delta > 0) {
    const dx = body.position.x - robot.x;
    // 밀 수 있는 상자(16층 인라면 박스) 위의 수호에게는 손이 닿지 않는다: 감지하지 않고, 쫓던 중이면 놓친 것으로 친다.
    // 예전엔 상자 밑에 붙어 서서 끝까지 기다려, 내려오는 순간 붙잡혔다.
    // 환풍구에 숨은 수호도 같은 식으로 보이지 않는다(playerHidden).
    const sameLevel = Math.abs(body.bounds.max.y - floorY) < 180 && !playerOnPushable() && !playerHidden();
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
          if (sameLevel && grounded && Math.abs(body.bounds.max.y - floorY) < 3 && Math.abs(body.position.x - robot.x) <= 84) catchPlayer(robot);
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
  const attack = powered && !['patrol', 'dock', 'return'].includes(robot.mode);
  const grabbing = powered && ['grab', 'caught'].includes(robot.mode);
  const running = powered && robot.mode === 'chase';
  const idle = !grabbing && (!powered || robot.mode === 'dock' || robot.wait > 0);
  const frames = grabbing ? 4 : idle ? 1 : 8;
  const frame = grabbing ? Math.min(3, Math.floor(robot.captureTime / 275)) :
    idle ? 0 : Math.floor(robot.elapsed / (running ? 90 : 120)) % 8;
  // 걷기·달리기 시트 모두 0번과 4번 컷에서 앞발이 땅에 닿는다. 그 컷으로 넘어갈 때마다 발소리를 낸다.
  if (!grabbing && !idle && robot.stepFrame !== undefined && frame !== robot.stepFrame && frame % 4 === 0) playGameSound('robot-step', { x: robot.x });
  robot.stepFrame = frame;
  const { door } = robot;
  door.x = robot.x - door.width / 2;
  door.y = floorY - 198;
  door.outline = [robot.x - 70, floorY - 198, 140, 198];
  Object.assign(door.element.style, { left: `${robot.x - 112}px`, top: `${floorY - 244 * .875}px`, width: '224px', height: '224px' });
  door.element.dataset.patrol = !powered ? 'off' : attack ? robot.mode : robot.mode === 'dock' ? 'scan' : robot.wait > 0 ? 'scan' : 'move';
  door.element.dataset.frame = String(frame);
  Object.assign(door.element.firstElementChild.style, {
    transform: `scaleX(${grabbing ? -robot.facing : robot.facing})`,
    width: grabbing ? '336px' : '224px', left: grabbing ? '-56px' : '0px',
    transformOrigin: grabbing ? '168px center' : '112px center'
  });
  const src = `assets/objects/guard-robot/guard-humanoid-v2-${grabbing ? 'grab' : idle ? 'idle' : running ? 'run' : 'walk'}.png`;
  if (robot.image.getAttribute('src') !== src) robot.image.src = src;
  robot.image.style.width = `${frames * 100}%`;
  robot.image.style.transform = `translateX(${-frame * 100 / frames}%)`;
  // The nearby target remains the same object while its outline follows the moving sprite.
  if (outlinedDoor === door) outlinedDoor = null;
}
