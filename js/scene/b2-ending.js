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
const b2CrateChaseRatio = 1.05; // 문 막기 동안 로봇은 수호보다 이만큼 빠르다(달려서 밀면 여유 있게, 걸어서 밀면 아슬아슬하게 늦는다)

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
const b2Ending = { phase: 'idle', barricaded: false, progress: 0, barricade: 100, offline: false, bang: 0, phase2: false };
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
  if (!ready) collectedItems.add('b2-console-locked'); // 목표가 외부 회선 패널을 가리킨다(objective.js)
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
  Object.assign(b2Ending, { phase: 'running', barricaded: false, progress: 0, barricade: 100, offline: false, bang: 0, phase2: false });
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

function refreshB2TransferScreen() {
  const screen = dynamicScene.querySelector('.transfer-screen');
  if (!screen) return;
  const state = b2Ending.offline ? 'offline' : collectedItems.has('b2-transfer-cut') ? 'cut' : 'active';
  const status = state === 'offline' ? 'ARCHI OFFLINE' : state === 'cut' ? '전송 차단됨' : '61%';
  screen.dataset.transferState = state;
  screen.lastElementChild.textContent = status;
  screen.style.setProperty('--transfer-progress', state === 'active' ? '61%' : '0%');
  screen.setAttribute('aria-label', `외부 전송 현황 · ${status}`);
  const door = currentDoors.find(entry => entry.element === screen);
  if (!door) return;
  const original = floorById.get('b2-main').fixtures.find(fixture => fixture.style === 'transfer-screen');
  door.message = state === 'active' ? original.message : `${status}. ARC-FULL-041에서 DR-EXT로 향하는 외부 전송은 중단되어 있다.`;
  door.caption = state === 'active' ? original.caption : status;
  door.writing = state === 'active' ? original.writing : [...original.writing.slice(0, -1), { text: status, ink: state === 'offline' ? 'green' : 'red' }];
}

// 장면을 새로 그릴 때(floor-change.js) 같은 장면에 있는 로봇만 붙인다. 상자는 삭제 시작 뒤 문을 막기 전까지 밀린다.
function mountB2Robots() {
  refreshB2Phase2();
  refreshB2TransferScreen();
  for (const robot of b2Robots) robot.door = robot.image = null;
  for (const part of movingParts) {
    if (!part.pushable?.barricade && !part.barricadeSpec) continue;
    part.barricadeSpec ??= part.pushable;
    part.pushable = b2Ending.phase === 'running' && !b2Ending.barricaded ? part.barricadeSpec : null;
  }
  const dock = dynamicScene.querySelector('.fixture.dormant-bots');
  if (dock) dock.dataset.active = String(b2Ending.phase !== 'idle');
  if (b2Ending.phase === 'idle' || room !== 'dynamic' || floorById.get(dynamicFloorId).floor !== -2) return;
  // 화면 전체를 어둡게 하는 data-alarm은 쓰지 않는다(관제실 소등 조명 전용).
  const stairs = currentDoors.find(door => door.type === 'stairs');
  if (stairs) stairs.message = 'ARCHI가 비상계단을 잠갔다. 문 위 표시등이 붉게 깜빡인다.';
  for (const robot of b2Robots) if (robot.where === dynamicFloorId) mountB2Robot(robot);
}

// ---- 2페이즈: 삭제 진행이 60%가 되면 메인 서버실에 검붉은 조명이 들어와 방이 어두워지고, 방 맨 왼쪽에 괴물이 나타난다 ----
const b2Phase2At = 60;
const b2Phase2Light = document.createElement('div');
b2Phase2Light.id = 'b2-phase2-light';
b2Phase2Light.setAttribute('aria-hidden', 'true');
world.append(b2Phase2Light);

function startB2Phase2() {
  b2Ending.phase2 = true;
  playGameSound('blackout');
  b2Log('sys', 'ARCHI-MAIN 보조 개체 가동 · 서버실 조명이 비상 모드로 전환됐다');
  b2Log('archi', '삭제는 끝나지 않습니다. 제가 지키던 것이 문 안쪽에 있으니까요.');
  sayLine('불이 붉게 바뀌었어… 저건 뭐지?', 5000);
  Object.assign(b2Hook, { x: b2MonsterStartX, mode: 'wait', timer: b2HookGap[0], reach: 0 });
  refreshB2Phase2();
}

// 괴물은 문 앞에서 천천히 다가오며 쇠공을 던진다. 쏘는 순간 손을 뻗은 자세로 바뀌고, 쇠공은 사슬에 매달려 오른쪽으로
// 일정한 높이로 일직선으로 날아간다. 공이 커서 서 있으면 맞고, 웅크리면 공 아래로 피할 수 있는 높이로 지나간다.
// 쏘기 직전(예고)에는 터미널이 닫히니 그때 웅크려야 한다. 공이 수호에게 닿으면 붙잡힌다.
// 수호가 손이 닿는 거리까지 가까워지면 던지지 않고 쇠공을 크게 휘두른다(근접 공격, phase2-boss-melee.png 9컷).
const b2MonsterStartX = 220; // 문(x 135~491)의 가운데 앞
const b2MonsterSpeed = 30; // px/s
const b2MonsterWidth = { walk: 187, aim: 342 }; // 그림 폭(css의 #b2-monster·.b2-boss와 같다). 이 안에 수호가 들어오면 붙잡힌다
const b2HookAimMs = 800;
const b2HookFlySpeed = 2550; // px/s
const b2HookBackSpeed = 1100;
const b2HookGap = [5000, 7000]; // 다음 발사까지(ms)
// 쇠공: radius는 그림 반지름, hit는 판정 반지름. 공 중심이 수호 위치를 지나는 높이는 웅크린 머리 윗면(floorY - 96)보다 공 아래쪽이 clearance만큼 위가 되게 한다.
const b2BallSize = { radius: 90, hit: 86, clearance: 24 };
const b2HookRopeHeight = 24;
const b2HookHand = { x: 322, y: 73 }; // 손을 뻗은 그림(phase2-boss-aim.png)에서 손의 위치(괴물 왼쪽·위 기준)
const b2Hook = { x: b2MonsterStartX, mode: 'wait', timer: 0, reach: 0, elapsed: 0 };
// 서 있는 머리 윗면(floorY - 162)과 웅크린 머리 윗면(floorY - 96) 사이로 공 중심이 지나가는 높이(수호의 위치에서)
const b2BallAimY = () => floorY - 96 - b2BallSize.radius - b2BallSize.clearance;
// 근접 공격: 9컷을 b2MeleeMs 동안 재생한다. hands는 컷마다 손 위치(380×339 컷 기준), angles는 컷 경계마다 공이 손에서 뻗은 각도(도, 아래쪽이 +).
// 5번째 컷(25°)에서 공이 몸 높이까지 내려와 서 있든 웅크렸든 맞는다.
const b2MeleeMs = 1000;
const b2MeleeShift = -40; // 걷는 그림과 허리판 위치를 맞추려고 근접 그림을 왼쪽으로 옮긴 양
const b2MeleeChain = 230;
const b2MeleeReach = 160; // 손에서 이만큼 안에 수호가 들어오면 휘두른다. 휘두른 공이 4번째 컷에 닿을 때 아직 이 안이면 웅크려도 맞는다
const b2MeleeHands = [[95, 185], [334, 81], [311, 90], [315, 87], [336, 99], [311, 163], [286, 157], [291, 172], [232, 128]];
const b2MeleeAngles = [-150, -110, -60, -20, 25, 10, -50, -110, -150, -160];

function updateB2Monster(delta) {
  const monster = dynamicScene.querySelector('#b2-monster');
  if (!monster) return;
  const hook = dynamicScene.querySelector('#b2-hook');
  const rope = dynamicScene.querySelector('#b2-hook-rope');
  let melee = b2Hook.mode === 'melee';
  // 멈추지 않고 수호 쪽으로 걸어온다(예고·던지기·휘두르는 동안은 서 있다). 그림 전체 범위 안에 수호가 들어오면 붙잡힌다.
  const toPlayer = body.position.x - b2MonsterWidth.walk / 2 - b2Hook.x;
  if (b2Hook.mode === 'wait') b2Hook.x += Math.sign(toPlayer) * Math.min(Math.abs(toPlayer), b2MonsterSpeed * delta / 1000);
  const boxWidth = b2Hook.mode === 'aim' ? b2MonsterWidth.aim : b2MonsterWidth.walk;
  if (!playerCaught && body.bounds.max.x > b2Hook.x && body.bounds.min.x < b2Hook.x + boxWidth) {
    playGameSound('robot-grab', { x: body.position.x });
    showB2BadEnding();
    return;
  }
  // hand: 줄이 나가는 손, ball: 공 중심, spin: 공이 도는 각(rad). 공이 보이는 동안만 쓴다.
  let hand = { x: b2Hook.x + b2HookHand.x, y: floorY - 339 + b2HookHand.y };
  let ball = { x: hand.x, y: b2BallAimY(), spin: 0 };
  let frame = 0;
  // 수호가 손이 닿는 거리 안에 있으면 던지는 중이든 아니든 언제나 근접 공격(휘두르기)을 한다.
  if (b2Hook.mode !== 'melee' && b2InMeleeRange()) {
    Object.assign(b2Hook, { mode: 'melee', elapsed: 0, reach: 0 });
    melee = true;
    closeB2Terminal();
    playGameSound('cctv-beep');
    if (performance.now() - (b2Hook.said ?? -1e9) > 4000) sayLine('쇠공을 휘두른다! 웅크려!', 2200);
    b2Hook.said = performance.now();
  }
  if (b2Hook.mode === 'wait') {
    b2Hook.timer -= delta;
    if (b2Hook.timer <= 0) {
      Object.assign(b2Hook, { mode: 'aim', timer: b2HookAimMs });
      closeB2Terminal();
      playGameSound('cctv-beep');
      sayLine('쇠공이 날아온다! 웅크려!', 2200);
    }
  } else if (b2Hook.mode === 'aim') {
    b2Hook.timer -= delta;
    if (b2Hook.timer <= 0) {
      b2Hook.mode = 'fly'; b2Hook.reach = 0;
    }
  } else if (b2Hook.mode === 'fly') {
    b2Hook.reach += b2HookFlySpeed * delta / 1000;
    ball.x = hand.x + b2Hook.reach; // 공은 수호 쪽이 아니라 오른쪽으로 일직선(고정 높이)
    if (hitB2Ball(ball)) return;
    if (ball.x > body.position.x + 260) b2Hook.mode = 'back'; // 수호보다 오른쪽까지 날아간 뒤 돌아온다
  } else if (b2Hook.mode === 'back') {
    b2Hook.reach -= b2HookBackSpeed * delta / 1000;
    if (b2Hook.reach <= 0) {
      const [min, max] = b2HookGap;
      Object.assign(b2Hook, { mode: 'wait', reach: 0, timer: min + Math.random() * (max - min) });
    }
  } else if (melee) {
    b2Hook.elapsed += delta;
    const u = Math.min(b2Hook.elapsed / b2MeleeMs, .9999) * 9;
    frame = Math.floor(u);
    const angle = (b2MeleeAngles[frame] + (b2MeleeAngles[frame + 1] - b2MeleeAngles[frame]) * (u - frame)) * Math.PI / 180;
    hand = { x: b2Hook.x + b2MeleeShift + b2MeleeHands[frame][0], y: floorY - 339 + b2MeleeHands[frame][1] };
    ball = { x: hand.x + Math.cos(angle) * b2MeleeChain, y: hand.y + Math.sin(angle) * b2MeleeChain, spin: angle };
    if (hitB2Ball(ball)) return;
    if (u >= 4 && !playerCaught && b2InMeleeRange()) { // 공이 내려온 순간 아직 범위 안이면 웅크려도 맞는다
      playGameSound('robot-grab', { x: body.position.x });
      showB2BadEnding();
      return;
    }
    if (b2Hook.elapsed >= b2MeleeMs) Object.assign(b2Hook, { mode: 'wait', timer: Math.max(b2Hook.timer, 1500) });
  }
  monster.style.left = `${b2Hook.x}px`;
  monster.dataset.pose = b2Hook.mode === 'wait' ? 'walk' : b2Hook.mode === 'melee' ? 'melee' : 'aim';
  monster.dataset.aim = String(b2Hook.mode === 'aim');
  monster.dataset.walk = String(b2Hook.mode === 'wait'); // 던지는 동안에는 걷는 컷을 멈춘다
  monster.style.setProperty('--melee-frame', frame);
  const shown = b2Hook.mode === 'fly' || b2Hook.mode === 'back' || b2Hook.mode === 'melee';
  hook.hidden = rope.hidden = !shown;
  if (!shown) return;
  const { radius } = b2BallSize;
  // 공은 굴러가듯 돌고, 사슬은 손에서 공 중심까지 이어진다(공 뒤에 깔린다).
  let scale = 1;
  if (!melee) { // 던질 때·돌아올 때: 손 가까이에서는 공이 손으로 빨려 들어가듯 작아지며 손 높이로 모인다
    const k = Math.min(1, b2Hook.reach / 180);
    ball = { x: hand.x + b2Hook.reach, y: hand.y + (b2BallAimY() - hand.y) * k, spin: 0 };
    scale = .4 + .6 * k;
  }
  const spin = melee ? ball.spin : b2Hook.reach / (radius * 1.7);
  Object.assign(hook.style, { left: `${ball.x - radius}px`, top: `${ball.y - radius}px`, transform: `rotate(${spin}rad) scale(${scale})` });
  Object.assign(rope.style, { left: `${hand.x}px`, top: `${hand.y - b2HookRopeHeight / 2}px`, width: `${Math.hypot(ball.x - hand.x, ball.y - hand.y)}px`, transform: `rotate(${Math.atan2(ball.y - hand.y, ball.x - hand.x)}rad)` });
}

// 수호의 몸이 보스 손에서 앞쪽 b2MeleeReach 안에 있는가
function b2InMeleeRange() {
  return body.bounds.max.x > b2Hook.x && body.bounds.min.x < b2Hook.x + b2MeleeShift + b2MeleeHands[1][0] + b2MeleeReach;
}

// 공(원)이 수호의 몸(사각형)에 닿았으면 붙잡히고 true를 돌려준다.
function hitB2Ball(ball) {
  const { min, max } = body.bounds;
  const nearX = Math.max(min.x, Math.min(ball.x, max.x));
  const nearY = Math.max(min.y, Math.min(ball.y, max.y));
  if (playerCaught || Math.hypot(ball.x - nearX, ball.y - nearY) > b2BallSize.hit) return false;
  playGameSound('robot-grab', { x: body.position.x });
  showB2BadEnding();
  return true;
}

// 서버실 안에서만 검붉은 조명과 괴물이 보인다. 장면을 새로 그릴 때와 2페이즈가 시작될 때 부른다.
function refreshB2Phase2() {
  const inMain = Boolean(b2Ending.phase2) && b2Ending.phase === 'running' && !b2Ending.offline && room === 'dynamic' && dynamicFloorId === 'b2-main';
  world.dataset.b2Phase2 = String(inMain);
  let monster = dynamicScene.querySelector('#b2-monster');
  if (!inMain) { monster?.remove(); dynamicScene.querySelector('#b2-hook')?.remove(); dynamicScene.querySelector('#b2-hook-rope')?.remove(); return; }
  if (monster) return;
  monster = document.createElement('div');
  monster.id = 'b2-monster';
  monster.setAttribute('aria-hidden', 'true');
  const sprite = document.createElement('div');
  sprite.className = 'b2-boss';
  monster.append(sprite);
  Object.assign(monster.style, { left: `${b2Hook.x}px`, top: `${floorY - 339}px` }); // 맨 왼쪽 문 앞에서 시작해 다가온다
  const rope = document.createElement('div');
  rope.id = 'b2-hook-rope';
  const hook = new Image();
  hook.id = 'b2-hook';
  hook.src = 'assets/objects/b2/phase2-ball.png';
  hook.alt = '';
  hook.draggable = false;
  rope.hidden = hook.hidden = true;
  Object.assign(hook.style, { width: `${b2BallSize.radius * 2}px`, height: `${b2BallSize.radius * 2}px` });
  rope.style.height = `${b2HookRopeHeight}px`;
  dynamicScene.append(monster, rope, hook);
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
  if (b2Ending.phase2 && b2Ending.phase === 'running') updateB2Monster(delta);
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

// 문 막기 동안 상자 왼쪽(콘솔 쪽)에 있으면 상자 위에 달리며 밀라는 안내를 띄운다(interaction.js가 그린다). 걸어서 밀면 늦는다.
function b2CrateHint() {
  if (b2Ending.phase !== 'running' || b2Ending.barricaded || dynamicFloorId !== 'b2-main') return null;
  const crate = b2Crate();
  if (!crate) return null;
  const gap = crate.body.bounds.min.x - body.position.x;
  if (gap < -60 || gap > 700) return null;
  const run = keyLabel(keyBindings.run[0]);
  return { x: crate.body.position.x, y: crate.body.bounds.min.y - 42, text: `${run}를 누른 채 달리면서 밀어라!` };
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
  // 맨 왼쪽 문: 2페이즈 전에는 잠겨 있고, 2페이즈에는 열려 있다.
  if (door.name === '굳게 닫힌 문' && dynamicFloorId === 'b2-main') {
    openInspection(door.name, b2Ending.phase2 ? '문이 활짝 열려 있다. 안쪽의 어둠 속에서 무언가가 걸어 나온다.' : door.message);
    return true;
  }
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
    if (!b2Ending.phase2 && b2Ending.progress >= b2Phase2At) startB2Phase2();
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
  b2Ending.phase2 = false;
  refreshB2Phase2();
  refreshB2TransferScreen();
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

// TRUE END: 화면이 검게 어두워지고 → 그림(없으면 검은 화면) → 검은 바탕에 흰 글씨 "TRUE END — ARCHI OFFLINE" → 크레딧이 위로
// 올라가고 → [메인 메뉴로]. 단계는 data-step으로 그린다(b2-ending.css).
// 크레딧이 올라가는 시간(16초)은 b2-ending.css의 b2-credits 애니메이션과 맞춘다.
const b2FinaleSteps = [['art', 1200], ['title', 4200], ['credits', 7500], ['done', 23500]];
// 크레딧(#b2-credits)은 하나를 두 엔딩이 같이 쓴다: 보이는 엔딩 창으로 옮겨 붙인다(배드 엔딩은 b2-capture-scene.js).
const b2Credits = document.getElementById('b2-credits');

function showB2Escape() {
  endB2Ending();
  releaseInput();
  b2EscapeBlocked = [...document.body.children].filter(element => element !== b2Escape && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of b2EscapeBlocked) element.inert = true;
  b2TrueEndArt.hidden = !b2Art.trueEnd;
  if (b2Art.trueEnd) { b2TrueEndArt.src = b2Art.trueEnd; b2Escape.dataset.art = 'true'; }
  b2TrueEndArt.after(b2Credits);
  b2Escape.dataset.step = 'black';
  b2Escape.hidden = false;
  playGameSound('ending-true');
  // 클리어 기록: 메인 메뉴에 표시하고, '계속하기'가 DELETE 직전으로 돌아가지 않게 이어하기 저장을 지운다(저장 칸·체크포인트는 그대로).
  try { localStorage.setItem(clearedKey, String(Date.now())); localStorage.removeItem(progressKey); } catch { /* 저장소가 없어도 엔딩은 보인다. */ }
  b2Escape.focus();
  b2FinaleTimers.push(...b2FinaleSteps.map(([step, at]) => setTimeout(() => {
    b2Escape.dataset.step = step;
    if (step === 'done') document.getElementById('b2-escape-menu').focus();
  }, at)));
}

// 크레딧이 올라가는 동안 Esc나 클릭으로 건너뛰면 바로 [메인 메뉴로]가 뜬다. 크레딧 전(흰 화면·제목)에는 건너뛰지 않는다.
function skipB2Credits() {
  if (b2Escape.dataset.step !== 'credits') return;
  b2FinaleTimers.forEach(clearTimeout);
  b2FinaleTimers = [];
  b2Escape.dataset.skipped = 'true';
  b2Escape.dataset.step = 'done';
  document.getElementById('b2-escape-menu').focus();
}
b2Escape.addEventListener('click', skipB2Credits);
b2Escape.addEventListener('keydown', event => {
  if (event.code !== 'Escape' || b2Escape.dataset.step !== 'credits') return;
  event.preventDefault();
  event.stopPropagation();
  skipB2Credits();
});

// 불러오기·새 게임(save.js restoreProgress)이 장면을 다시 짓기 전에 엔딩 상태를 모두 지운다.
function resetB2Ending() {
  resetB2CaptureScene();
  setB2Siren(false);
  Object.assign(b2Ending, { phase: 'idle', barricaded: false, progress: 0, barricade: 100, offline: false, bang: 0, phase2: false });
  refreshB2Phase2();
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
  delete b2Escape.dataset.skipped;
  for (const element of b2EscapeBlocked) element.inert = false;
  b2EscapeBlocked = [];
  refreshB2TransferScreen();
}

document.getElementById('b2-restart').addEventListener('click', () => {
  try { localStorage.removeItem(b2CheckpointKey); } catch { /* 저장소가 없어도 새 게임은 시작한다. */ }
  startNewGame();
});
document.getElementById('b2-checkpoint').addEventListener('click', () => {
  const data = readProgress(b2CheckpointKey);
  if (!data) return;
  restoreProgress(data);
  saveProgress();
});
// TRUE END의 [메인 메뉴로]와 배드 엔딩의 [메인 메뉴]. 배드 엔딩에서는 DELETE 직전의 이어하기 저장이 남아 있어 '계속하기'로 돌아온다.
// ([불러오기]는 .game-over-load라 main-menu.js가 저장 칸 창을 연다.)
for (const id of ['b2-escape-menu', 'b2-bad-menu']) document.getElementById(id).addEventListener('click', () => {
  // TRUE END에서 이어하기 저장을 지웠으므로 메뉴에는 '계속하기' 대신 클리어 표시가 보인다(main-menu.js). 저장 칸은 그대로 불러올 수 있다.
  resetB2Ending();
  gameStarted = false;
  mainMenuActive = true;
  document.body.dataset.mainMenu = 'true';
  showMainMenu();
});

// 개발 콘솔 버튼: 삭제 진행을 곧바로 60%로 올려 2페이즈를 시작한다. 삭제 전이면 메인 서버실에서 삭제를 시작한 것으로 친다.
function debugB2Progress60() {
  if (b2Ending.phase === 'idle') {
    if (room !== 'dynamic' || dynamicFloorId !== 'b2-main') { sayLine('B2 ARCHI 메인 서버실 안에서 눌러야 한다.', 4000); return false; }
    startArchiDelete();
  }
  if (b2Ending.phase !== 'running' || b2Ending.offline) return false;
  b2Ending.progress = Math.max(b2Ending.progress, b2Phase2At);
  if (!b2Ending.phase2) startB2Phase2();
  refreshB2Bar();
  return true;
}
