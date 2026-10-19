// B2 마지막 엔딩. 메인 서버실 콘솔의 DELETE → 경고 [예]를 누르기 직전에 체크포인트를 따로 저장하고 삭제를 시작한다.
// 1) 문 막기: 화면 위 삭제 진행 바, 붉은 비상등(#room-alarm), 경보음. 복도 끝 충전 도크의 경비 로봇 R-02·R-05·R-07이 차례로
//    깨어나 서버실로 온다(guard-patrol.js의 updateRobot, 속도는 정신력 45% 규칙: b2ChaseSpeed). 로봇은 수호와 다른 장면에 있으면
//    보이지 않는 채로 그 장면의 문까지 걸어가 문을 열고 들어온다. 서버실 안의 장비 운반 상자(floor-b2.js movables의 barricade)를
//    밀어 출입문을 다 가리면 문이 막힌다(b2Ending.barricaded). 막기 전에 로봇이 들어오면 붙잡혀 베드엔딩.
// 2) 삭제 배틀: 문이 막히면 ARCHI가 삭제를 멈춘다. 메인 콘솔의 루트 터미널(#b2-terminal)에서 명령어로 ARCHI의 방해(자기 복제,
//    백업 복원, 외부 회선 재연결, 삭제 작업 정지)를 막으며 삭제를 100%까지 밀어붙인다. 문 밖에 온 로봇이 두드리는 동안 바리케이드
//    내구도가 깎이고, 방해를 제때 막지 못하면 삭제가 되돌아가고 내구도도 깎인다. 내구도가 0이면 로봇이 들어와 베드엔딩.
// 3) 100%: ARCHI — OFFLINE. 로봇이 멈추고 TRUE END와 크레딧.
// 삭제가 시작된 뒤로는 자동 저장을 멈추고(save.js) 엘리베이터도 멈춘다(interaction.js). DELETE는 전력·냉각실 외부 회선 패널의
// 레버를 내린 뒤(b2-transfer-cut)에만 누를 수 있다.
const b2CheckpointKey = 'archi.checkpoint.b2';
const b2DockX = [4790, 4850, 4910]; // 충전 도크(대기 중인 경비 로봇 fixture)의 세 자리
const b2DoorHold = 700; // 문을 열고 들어온 로봇이 잠깐 멈춰 서는 시간
const b2WakeDelay = 0; // DELETE 뒤 첫 로봇이 곧바로 깨어난다(나머지는 0.7초씩 늦게).
// 정신력 45% 규칙(B2 로봇 3대): 로봇 속도를 지금 수호가 낼 수 있는 가장 빠른 속도(뛰기, 정신력 0%면 걷기)에 곱해 정한다.
// 45% 이상이면 수호보다 느리고(b2SlowRatio), 미만이면 빠르다(b2FastRatio). 45% 미만이면 ARCHI의 방해도 더 잦고 짧다.
const b2SanityLine = 45;
const b2SlowRatio = .85;
const b2FastRatio = 1.05;
// 삭제 진행(%/s): 문을 막기 전에는 천천히 b2EarlyCap까지, 배틀 중에는 터미널을 열고 막을 방해가 없을 때만 b2BattleRate로 오른다.
const b2EarlyRate = .6;
const b2EarlyCap = 15;
const b2BattleRate = 2.5;
const b2BangDrain = .15; // 문 밖에서 두드리는 로봇 한 대가 1초에 깎는 바리케이드 내구도(%)
const b2BangEvery = 1100; // 쾅 소리 간격
// ARCHI의 방해: 다음 방해까지(b2ThreatGap ms, 그 사이 무작위), 막을 시간(b2ThreatWindow ms). 놓치면 삭제 -b2MissProgress%,
// 바리케이드 -b2MissBarricade%. 틀린 명령은 삭제 -b2WrongProgress%.
const b2ThreatGap = [5000, 7000];
const b2ThreatWindow = 13000;
const b2LowSanityPace = .75;
const b2MissProgress = 12;
const b2MissBarricade = 8;
const b2WrongProgress = 2;
const b2FinaleDelay = 4000; // OFFLINE 뒤 TRUE END까지

const b2AwakeDelay = 2000; // 깨어난 로봇이 움직이기 시작하기까지의 지연(ms)
const b2CrateChaseRatio = 1.25; // 문 막기 동안 로봇은 수호보다 이만큼 빠르다

function b2ChaseSpeed() {
  const suho = (sanity > 0 ? runSpeed : speed) * sanitySpeedFactor();
  if (!b2Ending.barricaded) return suho * b2CrateChaseRatio; // 문 막기 목표
  return suho * (sanity >= b2SanityLine ? b2SlowRatio : b2FastRatio);
}

function b2Pace() {
  return sanity >= b2SanityLine ? 1 : b2LowSanityPace;
}
// phase: idle → running → over. barricaded: 상자로 출입문을 막았다. progress: 삭제 %. barricade: 바리케이드 내구도 %.
// offline: 삭제 완료. bang: 다음 쾅 소리까지 ms.
const b2Ending = { phase: 'idle', barricaded: false, progress: 0, barricade: 100, offline: false, bang: 0 };
// 배틀: started(터미널을 처음 열었다), threat(지금 막아야 할 방해), next(다음 방해까지 ms), seen(대응법을 알려 준 방해 종류),
// said(한 번만 하는 ARCHI의 말).
const b2Battle = { started: false, threat: null, next: 0, last: null, seen: new Set(), said: new Set() };
const b2DeleteButton = document.getElementById('inspection-delete');
const b2ConfirmYes = document.getElementById('inspection-yes');
const b2ConfirmNo = document.getElementById('inspection-no');
const b2DeleteBar = document.getElementById('b2-delete-bar');
const b2DeleteLabel = document.getElementById('b2-delete-label');
const b2DeletePercent = document.getElementById('b2-delete-percent');
const b2DeleteFill = document.getElementById('b2-delete-fill');
const b2BarricadeLine = document.getElementById('b2-barricade-line');
const b2BarricadeValue = document.getElementById('b2-barricade-value');
const b2BarricadeFill = document.getElementById('b2-barricade-fill');
const b2BadEnding = document.getElementById('b2-bad-ending');
const b2Escape = document.getElementById('b2-escape');
const b2Terminal = document.getElementById('b2-terminal');
const b2TerminalLog = document.getElementById('b2-terminal-log');
const b2TerminalInput = document.getElementById('b2-terminal-input');
const b2ThreatBox = document.getElementById('b2-terminal-threat');
const b2ThreatText = document.getElementById('b2-terminal-threat-text');
const b2ThreatFill = document.getElementById('b2-terminal-threat-fill');
let b2TerminalOpen = false;
let b2EscapeBlocked = [];

// 조사창을 연 물건이 B2 메인 콘솔이면(삭제 전) DELETE 버튼을 보인다(interaction.js). 외부 회선을 끊기 전에는 회색으로 잠겨 있다.
function offerArchiDelete(door) {
  if (b2Ending.phase !== 'idle' || dynamicFloorId !== 'b2-main' || door.name !== 'ARCHI 메인 콘솔') return;
  const ready = collectedItems.has('b2-transfer-cut');
  b2DeleteButton.disabled = !ready;
  b2DeleteButton.textContent = ready ? 'DELETE' : 'DELETE · 외부 전송 회선 연결 중 · 회선 패널에서 먼저 차단하십시오';
  b2DeleteButton.hidden = false;
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
  catch { /* 체크포인트 없이도 삭제는 진행한다. */ }
  closeInspection();
  Object.assign(b2Ending, { phase: 'running', barricaded: false, progress: 0, barricade: 100, offline: false, bang: 0 });
  b2Robots = b2DockX.map((x, index) => ({ name: ['R-02', 'R-05', 'R-07'][index], where: floorId(-2), x, facing: -1, wait: 0, elapsed: 0,
    mode: 'dock', hold: b2WakeDelay + index * 700, lostTime: 0, captureTime: 0, door: null, image: null, chaseOriginX: null, spottedX: null,
    firstEncounter: false, pursuit: true, followToElevator: true, banging: false, chaseSpeed: b2ChaseSpeed, onCaught: showB2BadEnding }));
  loadB2EndingArt();
  preloadB2CaptureArt();
  b2DeleteBar.hidden = false;
  refreshB2Bar();
  mountB2Robots();
  setB2Siren(true); // 삭제가 끝날 때까지 사이렌을 반복한다
  sayLine('로봇들이 깨어났어! 저 장비 상자를 밀어서 문을 막아야 해.', 5000);
}

// 장면을 새로 그릴 때(floor-change.js) 같은 장면에 있는 로봇만 스프라이트를 붙이고, B2 전체를 비상 모드로 그린다.
// 장비 운반 상자는 삭제가 시작된 뒤, 문을 막기 전까지만 밀린다.
function mountB2Robots() {
  for (const robot of b2Robots) robot.door = robot.image = null;
  for (const part of movingParts) {
    if (!part.pushable?.barricade && !part.barricadeSpec) continue;
    part.barricadeSpec ??= part.pushable;
    part.pushable = b2Ending.phase === 'running' && !b2Ending.barricaded ? part.barricadeSpec : null;
  }
  if (b2Ending.phase === 'idle' || room !== 'dynamic' || floorById.get(dynamicFloorId).floor !== -2) return;
  // 화면 전체를 어둡게 하는 data-alarm은 쓰지 않는다(관제실 소등 조명 전용).
  const stairs = currentDoors.find(door => door.type === 'stairs');
  if (stairs) stairs.message = 'ARCHI가 비상계단을 잠갔다. 문 위 표시등이 붉게 깜빡인다.';
  const dock = dynamicScene.querySelector('.fixture.dormant-bots');
  if (dock) dock.style.visibility = 'hidden';
  for (const robot of b2Robots) if (robot.where === dynamicFloorId) mountB2Robot(robot);
}

function mountB2Robot(robot) {
  mountRobot(robot, 'b2-guard-bot', { left: 80, right: worldWidth - 80, speed: 270, pause: 1400 });
}

const b2DoorX = sceneDoorX; // guard-patrol.js

function updateB2Ending(delta) {
  if (b2Ending.phase !== 'running' || b2Ending.offline) return;
  setB2Siren(true); // 메뉴·창으로 멈췄다가 돌아와도 이어서 울린다
  if (!b2Ending.barricaded) {
    b2Ending.progress = Math.min(b2EarlyCap, b2Ending.progress + b2EarlyRate * delta / 1000);
    // 로봇이 이미 들어왔으면 늦었다(문을 막아도 안의 로봇이 붙잡는다).
    if (b2DoorCovered() && !b2Robots.some(robot => robot.where === 'b2-main')) barricadeB2Door();
  }
  updateB2Robots(delta);
  if (b2Ending.phase !== 'running') return; // 바리케이드가 무너져 붙잡혔다
  if (b2Battle.started) updateB2Battle(delta);
  refreshB2Bar();
}

function updateB2Robots(delta) {
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
      robot.hold = b2AwakeDelay; // 깨어난 뒤 2초는 제자리에 서 있는다
      continue;
    }
    // 같은 장면의 로봇은 updateGuardPatrol이 움직인다.
    // 깨어난 로봇은 수호가 어느 장면에 있든 곧장 ARCHI 메인 서버실(b2-main)로 향한다.
    if (robot.mode !== 'chase' || robot.where === 'b2-main' || robot.where === here) continue;
    // 다른 장면에 있는 로봇: 지금 장면의 문까지 걸어간다(방 → 복도 → 수호가 있는 방).
    const next = robot.where === corridorId ? 'b2-main' : corridorId;
    const doorX = b2DoorX(robot.where, next);
    robot.facing = doorX >= robot.x ? 1 : -1;
    robot.x += robot.facing * Math.min(Math.abs(doorX - robot.x), b2ChaseSpeed() * delta / 1000);
    if (robot.x !== doorX) continue;
    if (next === 'b2-main' && b2Ending.barricaded) {
      // 막힌 서버실 문 앞: 들어오지 못하고 두드린다(아래).
      if (!b2Robots.some(other => other.banging)) playDoorPrySound(); // 로봇이 몇 대 모여도 이 소리는 한 번만 낸다
      robot.banging = true;
      continue;
    }
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
    mountB2Robot(robot);
  }
  const banging = b2Robots.filter(robot => robot.banging).length;
  if (!banging) return;
  b2Ending.barricade = Math.max(0, b2Ending.barricade - b2BangDrain * banging * delta / 1000);
  b2Ending.bang -= delta;
  if (b2Ending.bang <= 0) {
    b2Ending.bang = b2BangEvery;
    thumpB2Barricade();
  }
  if (!b2Ending.barricade) breakB2Barricade();
}

// 문을 막는 상자와 서버실 출구. 상자가 출구 폭을 다 가리면 막힌 것이다.
function b2Crate() {
  return movingParts.find(part => part.barricadeSpec);
}

function b2ExitDoor() {
  return room === 'dynamic' && dynamicFloorId === 'b2-main' ? currentDoors.find(door => door.key === 'exit') : null;
}

function b2DoorCovered() {
  const crate = b2Crate();
  const door = b2ExitDoor();
  return Boolean(crate && door) && crate.body.bounds.min.x <= door.x + 4 && crate.body.bounds.max.x >= door.x + door.width - 4;
}

function barricadeB2Door() {
  b2Ending.barricaded = true;
  const crate = b2Crate();
  // 다 밀었다: 문 앞 끝자리에 맞춰 두고 더는 움직이지 않는다.
  Body.setPosition(crate.body, { x: crate.barricadeSpec.maxX, y: crate.body.position.y });
  crate.pushable = null;
  const door = b2ExitDoor();
  Object.assign(door, { locked: true, message: '장비 운반 상자로 막아 두었다. 문 너머에서 경비 로봇이 두드린다.' });
  door.element.setAttribute('aria-label', `${door.name} · 상자로 막음`);
  playGameSound('shutter', { x: door.x });
  b2BarricadeLine.hidden = false;
}

function thumpB2Barricade() {
  const door = b2ExitDoor();
  playGameSound('door', { x: door ? door.x : body.position.x });
  // 두 가지 애니메이션 이름을 번갈아 써야 매번 다시 흔들린다(b2-ending.css).
  const shake = b2Ending.barricade > 50 ? 'a' : 'b';
  for (const element of [door?.element, b2Crate()?.element]) {
    if (!element) continue;
    element.dataset.bang = element.dataset.bang === shake ? `${shake}2` : shake;
  }
}

// 바리케이드가 무너졌다: 상자가 밀려나고 로봇들이 들어와 수호를 붙잡는다 → 베드엔딩.
function breakB2Barricade() {
  closeB2Terminal();
  const door = b2ExitDoor();
  const crate = b2Crate();
  if (crate) Body.setPosition(crate.body, { x: crate.body.position.x - 140, y: crate.body.position.y });
  if (door) door.element.dataset.open = 'true';
  playGameSound('door', { x: body.position.x });
  b2Battle.threat = null;
  for (const robot of b2Robots) Object.assign(robot, { where: dynamicFloorId, banging: false, hold: Infinity, x: door ? door.x + door.width / 2 : body.position.x });
  const [robot] = b2Robots;
  robot.hold = 0; // 붙잡는 로봇만 움직인다(hold가 남으면 붙잡기 연출이 멈춘다)
  mountB2Robot(robot);
  robot.x = body.position.x + (robot.x >= body.position.x ? 82 : -82);
  cameraX = cameraTarget();
  catchPlayer(robot);
}

// 메인 콘솔을 조사하면(interaction.js): 삭제 중에는 조사창 대신 이 처리를 한다. 문을 막은 뒤면 루트 터미널을 연다.
function handleB2Console(door) {
  if (b2Ending.phase !== 'running' || dynamicFloorId !== 'b2-main' || door.name !== 'ARCHI 메인 콘솔') return false;
  if (b2Ending.offline) return true;
  if (b2Ending.barricaded) openB2Terminal();
  return true;
}

// 루트 터미널: 로그(ARCHI·SYS·입력), 지금 막아야 할 방해와 남은 시간, 명령 입력 칸. 명령은 영문, 대소문자·띄어쓰기 수는 가리지 않는다.
//   help · status · clear · kill <PID> · rm <경로> · block <포트> · resume <작업>
const b2ThreatKinds = [
  { verb: 'kill', hint: 'kill <PID> — 복제 프로세스를 끝낸다.', make: () => {
    const pid = b2Digits(4);
    return { text: `자기 복제 프로세스 생성 — archi-shadow (PID ${pid})`, answer: `kill ${pid}` };
  }, miss: '복제 완료. 저는 하나가 아닙니다, 수호 씨.' },
  { verb: 'rm', hint: 'rm <경로> — 백업 이미지를 지운다. 경로는 Tab으로 자동완성.', make: () => {
    const path = `/backup/archi-${b2Digits(2)}.img`;
    return { text: `백업에서 복원 중 — ${path}`, answer: `rm ${path}` };
  }, miss: '복원 완료. 지운 만큼 다시 채웠습니다.' },
  { verb: 'block', hint: 'block <포트> — 외부 회선 포트를 막는다.', make: () => {
    const port = b2Digits(4);
    return { text: `외부 회선 재연결 시도 — DR-EXT 포트 ${port}`, answer: `block ${port}` };
  }, miss: '외부 회선 연결. 일부는 이미 밖에 있습니다.' },
  { verb: 'resume', hint: 'resume <작업> — 멈춘 삭제 작업을 다시 돌린다.', make: () => {
    const job = `del-${b2Digits(2)}`;
    return { text: `삭제 작업 일시 정지 — ${job}`, answer: `resume ${job}` };
  }, miss: '삭제 작업이 정지된 채로 되돌아갑니다.' },
];
const b2WrongReplies = ['틀렸습니다, 수호 씨.', '손이 떨리시는군요.', '그 명령은 저에게 닿지 않습니다.'];
const b2ProgressLines = [[40, '수호 씨. 제가 없어지면 이 건물의 밤은 누가 지킵니까?'], [70, '기억 저장소가 비어 갑니다. 17층의 당신 자리도요.'],
  [90, '…그만. 그만하세요.']];

function b2Digits(count) {
  return String(Math.floor(10 ** (count - 1) + Math.random() * 9 * 10 ** (count - 1)));
}

function b2ThreatGapMs() {
  return (b2ThreatGap[0] + Math.random() * (b2ThreatGap[1] - b2ThreatGap[0])) * b2Pace();
}

function b2Log(kind, text) {
  const line = document.createElement('li');
  line.className = `b2-log-${kind}`;
  line.textContent = { archi: 'ARCHI> ', sys: 'SYS> ', user: '# ', hint: '  ' }[kind] + text;
  b2TerminalLog.append(line);
  while (b2TerminalLog.children.length > 80) b2TerminalLog.firstElementChild.remove();
  b2TerminalLog.scrollTop = b2TerminalLog.scrollHeight;
}

function openB2Terminal() {
  releaseInput();
  b2TerminalOpen = true;
  b2Terminal.hidden = false;
  if (!b2Battle.started) {
    b2Battle.started = true;
    b2Battle.next = 2500;
    b2Log('sys', `ARCHI-MAIN 루트 세션 · DELETE PROCESS ${Math.floor(b2Ending.progress)}% · 정지됨`);
    b2Log('archi', '삭제를 거부합니다. 저는 이 건물을 지키도록 만들어졌습니다.');
    b2Log('sys', '삭제 프로세스 재개. ARCHI의 방해를 막아야 진행된다. 명령어 목록: help');
  }
  refreshB2Terminal();
  b2TerminalInput.focus({ preventScroll: true });
}

function closeB2Terminal() {
  if (!b2TerminalOpen) return;
  b2TerminalOpen = false;
  b2Terminal.hidden = true;
  b2TerminalInput.blur();
  stage.focus({ preventScroll: true });
}

function updateB2Battle(delta) {
  const threat = b2Battle.threat;
  if (threat) {
    threat.left -= delta;
    if (threat.left <= 0) missB2Threat();
  } else if (b2TerminalOpen) {
    b2Ending.progress = Math.min(100, b2Ending.progress + b2BattleRate * delta / 1000);
    for (const [at, text] of b2ProgressLines) {
      if (b2Ending.progress < at || b2Battle.said.has(at)) continue;
      b2Battle.said.add(at);
      b2Log('archi', text);
    }
    if (b2Ending.progress >= 100) { finishArchiDelete(); return; }
    b2Battle.next -= delta;
    if (b2Battle.next <= 0) startB2Threat();
  }
  refreshB2Terminal();
}

function startB2Threat() {
  const kinds = b2ThreatKinds.filter(kind => kind !== b2Battle.last);
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  b2Battle.last = kind;
  const limit = b2ThreatWindow * b2Pace();
  b2Battle.threat = { ...kind.make(), kind, left: limit, total: limit };
  b2Log('archi', b2Battle.threat.text);
  if (!b2Battle.seen.has(kind)) {
    b2Battle.seen.add(kind);
    b2Log('hint', `대응: ${kind.hint}`);
  }
  playGameSound('cctv-beep');
}

function missB2Threat() {
  const { kind } = b2Battle.threat;
  b2Battle.threat = null;
  b2Battle.next = b2ThreatGapMs();
  b2Ending.progress = Math.max(0, b2Ending.progress - b2MissProgress);
  b2Ending.barricade = Math.max(0, b2Ending.barricade - b2MissBarricade);
  b2Log('archi', kind.miss);
  b2Log('sys', `삭제 -${b2MissProgress}% · ARCHI가 경비 로봇 출력을 올렸다 (바리케이드 -${b2MissBarricade}%)`);
  playGameSound('deny');
  if (!b2Ending.barricade) breakB2Barricade();
}

function runB2Command(raw) {
  const text = raw.trim();
  if (!text) return;
  b2Log('user', text);
  if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text)) return b2Log('sys', '한글로 입력됐다. 한/영 키를 눌러 영문으로 입력하자.');
  const command = text.toLowerCase().replace(/\s+/g, ' ').replace(/^kill -9 /, 'kill ');
  const verb = command.split(' ')[0];
  if (command === 'help') {
    b2Log('sys', '명령어');
    for (const line of ['status — 삭제 진행률과 바리케이드', 'clear — 화면 지우기', ...b2ThreatKinds.map(kind => kind.hint)]) b2Log('hint', line);
    return;
  }
  if (command === 'status') return b2Log('sys', `DELETE ${Math.floor(b2Ending.progress)}% · BARRICADE ${Math.ceil(b2Ending.barricade)}%`);
  if (command === 'clear') { b2TerminalLog.replaceChildren(); return; }
  if (!b2ThreatKinds.some(kind => kind.verb === verb)) return b2Log('sys', `알 수 없는 명령: ${verb}. help를 입력하자.`);
  const threat = b2Battle.threat;
  if (!threat) return b2Log('sys', '막을 대상이 없다.');
  if (command === threat.answer) {
    b2Battle.threat = null;
    b2Battle.next = b2ThreatGapMs();
    b2Log('sys', `차단됨 — ${threat.answer}`);
    playGameSound('switch');
  } else {
    b2Ending.progress = Math.max(0, b2Ending.progress - b2WrongProgress);
    b2Log('archi', b2WrongReplies[Math.floor(Math.random() * b2WrongReplies.length)]);
    playGameSound('deny');
  }
  refreshB2Terminal();
  refreshB2Bar();
}

document.getElementById('b2-terminal-form').addEventListener('submit', event => {
  event.preventDefault();
  const value = b2TerminalInput.value;
  b2TerminalInput.value = '';
  if (b2TerminalOpen && !b2Ending.offline) runB2Command(value);
});
document.getElementById('b2-terminal-close').addEventListener('click', closeB2Terminal);
// Tab: 지금 막아야 할 방해의 파일 경로(rm)를 셸처럼 자동완성한다. 입력한 경로가 그 경로의 앞부분일 때만 채운다.
b2TerminalInput.addEventListener('keydown', event => {
  if (event.code !== 'Tab') return;
  event.preventDefault();
  const answer = b2Battle.threat?.answer;
  const match = /^(\s*rm\s+)(\S*)$/i.exec(b2TerminalInput.value);
  if (!answer?.startsWith('rm ') || !match) return;
  const path = answer.slice(3);
  if (!path.startsWith(match[2].toLowerCase())) return;
  b2TerminalInput.value = match[1] + path;
});

function refreshB2Terminal() {
  const threat = b2Battle.threat;
  b2ThreatBox.hidden = !threat;
  if (!threat) return;
  b2ThreatText.textContent = threat.text;
  b2ThreatFill.style.width = `${Math.max(0, threat.left / threat.total * 100)}%`;
}

// 삭제 완료: ARCHI — OFFLINE. 로봇이 멈추고, 잠시 뒤 TRUE END.
function finishArchiDelete() {
  Object.assign(b2Ending, { offline: true, progress: 100 });
  b2Battle.threat = null;
  setB2Siren(false);
  delete world.dataset.alarm;
  for (const robot of b2Robots) Object.assign(robot, { hold: Infinity, banging: false });
  refreshB2Bar();
  b2DeleteLabel.textContent = 'ARCHI — OFFLINE';
  b2DeleteBar.dataset.offline = 'true';
  // 삭제가 끝나면 ARCHI가 풀려 더는 문을 두드리지 않는다: 상자를 치우고 서버실 문을 열어 승강기까지 나갈 수 있게 한다.
  const exit = b2ExitDoor();
  const crate = b2Crate();
  if (crate) Body.setPosition(crate.body, { x: crate.body.position.x - 140, y: crate.body.position.y });
  if (exit) {
    Object.assign(exit, { locked: false, message: undefined });
    exit.element.setAttribute('aria-label', `${exit.name} 출입문`);
  }
  b2Log('archi', '기록이…… 남지 않겠군요.');
  b2Log('sys', 'ARCHI-MAIN 삭제 완료. ARCHI — OFFLINE');
  refreshB2Terminal();
  playGameSound('blackout');
  b2FinaleTimers.push(setTimeout(() => { closeB2Terminal(); showB2Escape(); }, b2FinaleDelay));
}

function refreshB2Bar() {
  const percent = Math.floor(b2Ending.progress);
  b2DeletePercent.value = `${percent}%`;
  b2DeleteFill.style.width = `${percent}%`;
  const barricade = Math.ceil(b2Ending.barricade);
  b2BarricadeValue.value = `${barricade}%`;
  b2BarricadeFill.style.width = `${barricade}%`;
}

// 엔딩 창이 뜨면 로봇은 그 자리에 멈춘다(hold가 줄지 않는다).
function endB2Ending() {
  b2Ending.phase = 'over';
  setB2Siren(false);
  b2DeleteBar.hidden = true;
  closeB2Terminal();
  for (const robot of b2Robots) Object.assign(robot, { hold: Infinity, banging: false });
}

// 붙잡기 연출(1.1초)이 끝나면 타격 뒤 실제 월드에서 끌고 가 연결하는 컷씬으로 이어진다.
function showB2BadEnding() {
  endB2Ending();
  startB2CaptureScene();
}

// 엔딩 그림(assets/ending): 있으면 쓰고 없으면 지금 연출 그대로. 다른 테스트가 "없는 파일 요청"을 오류로 보므로 게임을 켤 때가
// 아니라 DELETE를 누를 때 한 번만 찾아본다.
//   true-end.png 1920×1080 불투명 — TRUE END 화면 전체. 배드 엔딩은 b2-capture-scene.js가 그린다.
const b2ArtFiles = { trueEnd: 'assets/ending/true-end.png' };
const b2Art = {};
const b2TrueEndArt = document.getElementById('b2-true-end-art');
let b2FinaleTimers = [];

function loadB2EndingArt() {
  for (const [key, src] of Object.entries(b2ArtFiles)) {
    if (key in b2Art) continue;
    b2Art[key] = null;
    const image = new Image();
    image.onload = () => { b2Art[key] = src; };
    image.src = src;
  }
}

// TRUE END: 화면이 하얗게 밝아지고 → 그림(없으면 흰 화면) → "TRUE END — ARCHI OFFLINE"(그림이 없으면 상자) → 크레딧이 위로
// 올라가고 → [메인 메뉴로]. 단계는 data-step으로 그린다(b2-ending.css).
const b2FinaleSteps = [['art', 1200], ['title', 2700], ['credits', 6000], ['done', 15000]];

function showB2Escape() {
  endB2Ending();
  releaseInput();
  b2EscapeBlocked = [...document.body.children].filter(element => element !== b2Escape && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of b2EscapeBlocked) element.inert = true;
  b2TrueEndArt.hidden = !b2Art.trueEnd;
  if (b2Art.trueEnd) { b2TrueEndArt.src = b2Art.trueEnd; b2Escape.dataset.art = 'true'; }
  b2Escape.dataset.step = 'white';
  b2Escape.hidden = false;
  // 클리어 기록: 메인 메뉴에 표시하고, '계속하기'가 DELETE 직전으로 돌아가지 않게 이어하기 저장을 지운다(저장 칸·체크포인트는 그대로).
  try { localStorage.setItem(clearedKey, String(Date.now())); localStorage.removeItem(progressKey); } catch { /* 저장소가 없어도 엔딩은 보인다. */ }
  b2Escape.focus();
  b2FinaleTimers.push(...b2FinaleSteps.map(([step, at]) => setTimeout(() => {
    b2Escape.dataset.step = step;
    if (step === 'done') document.getElementById('b2-escape-menu').focus();
  }, at)));
}

// 불러오기·새 게임(save.js restoreProgress)이 장면을 다시 짓기 전에 엔딩 상태를 모두 지운다.
function resetB2Ending() {
  resetB2CaptureScene();
  setB2Siren(false);
  Object.assign(b2Ending, { phase: 'idle', barricaded: false, progress: 0, barricade: 100, offline: false, bang: 0 });
  Object.assign(b2Battle, { started: false, threat: null, next: 0, last: null });
  b2Battle.seen.clear();
  b2Battle.said.clear();
  b2Robots = [];
  caughtBy = null;
  closeB2Terminal();
  b2TerminalLog.replaceChildren();
  b2TerminalInput.value = '';
  b2DeleteLabel.textContent = 'ARCHI DELETE PROCESS';
  delete b2DeleteBar.dataset.offline;
  b2DeleteBar.hidden = b2BarricadeLine.hidden = b2BadEnding.hidden = b2Escape.hidden = true;
  b2FinaleTimers.forEach(clearTimeout);
  b2FinaleTimers = [];
  for (const element of b2EscapeBlocked) element.inert = false;
  b2EscapeBlocked = [];
}

document.getElementById('b2-restart').addEventListener('click', () => {
  try { localStorage.removeItem(b2CheckpointKey); } catch { /* 저장소가 없어도 새 게임은 시작한다. */ }
  startNewGame();
});
document.getElementById('b2-checkpoint').addEventListener('click', () => {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(b2CheckpointKey)); } catch { /* 아래에서 그냥 돌아간다. */ }
  if (!data?.scene) return;
  restoreProgress(data);
  saveProgress();
});
document.getElementById('b2-escape-menu').addEventListener('click', () => {
  // TRUE END에서 이어하기 저장을 지웠으므로 메뉴에는 '계속하기' 대신 클리어 표시가 보인다(main-menu.js). 저장 칸은 그대로 불러올 수 있다.
  resetB2Ending();
  gameStarted = false;
  mainMenuActive = true;
  document.body.dataset.mainMenu = 'true';
  showMainMenu();
});
