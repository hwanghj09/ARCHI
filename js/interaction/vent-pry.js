// 환풍구 덮개 뜯기: 환풍구(층 fixtures의 hideSpot)는 처음에 나사로 박힌 루버 덮개가 닫혀 있다(vent-closed.png).
// 빠루(f17-crowbar, 17층 관리자실 공구 사물함)를 가진 채 E를 누르면, 수호가 환풍구 오른쪽에 웅크려 빠루를 덮개 오른쪽 아래
// 모서리에 끼운다(vent-prying.png). 데드 바이 데이라이트 발전기 스킬체크처럼 원 위를 빨간 바늘이 12시부터 시계 방향으로 돌고,
// 흰 칸에 바늘이 있을 때 스페이스·Enter(E, 모바일은 버튼)를 누르면 성공이다. 바늘이 아주 빨라서
// (한 바퀴 0.7초, 칸은 약 0.1초) 순전히 반응속도로 맞춰야 한다. 칸 앞쪽 끝 노란 '완벽' 칸을 맞추면 한 번에, 흰 칸이면 두 번
// 성공해야(연속이 아니어도 된다) 빠루가 젖혀지며 덮개가 떨어져 바닥에 나뒹굴고(vent-cover-removed.png) 구멍이 열린다
// (vent-open.png, 그 뒤로 숨을 수 있다). 칸 밖에서 누르거나 누르지 않고 칸을 지나치면 실패이고, 잠깐 뒤 새 칸으로 다시 한다. Esc나 이동 키로 그만둔다. 뜯는 동안에도 로봇은 돌아다니고, 숨은 게 아니라서
// 들키면 붙잡힌다. 연 환풍구는 collectedItems의 ventOpenKey로 저장된다.
const ventPryTurnMs = 700; // 바늘이 한 바퀴 도는 시간
const ventPryZone = 50; // 성공 칸 각도(약 97ms)
const ventPryGreat = 12; // 그중 바늘이 먼저 닿는 앞쪽 '완벽' 칸 각도(노란색): 맞추면 한 번에 열린다
const ventPryNeed = 2; // 열리는 데 필요한 점수: 흰 칸 1점, 완벽 칸 2점. 실패해도 모은 점수는 그대로다.
const ventPry = { door: null, crowbar: null, score: 0, angle: 0, zone: [0, 0], wait: 0, shake: 0 };
const ventPryGauge = document.getElementById('vent-pry-gauge');
const ventPryStatus = document.getElementById('vent-pry-status');
const ventOpenKey = (sceneId, vent) => `vent-open:${sceneId}@${vent.x}`;
const ventIsOpen = vent => collectedItems.has(ventOpenKey(dynamicFloorId, vent));
const ventPrying = () => ventPry.door !== null;

// 장면을 지을 때(scene-builder.js) 환풍구 그림을 상태에 맞춘다. 이미 연 환풍구는 떨어진 덮개도 바닥에 둔다.
// pryFrom: 'left'(층 설정)면 수호가 왼쪽에서 뜯고 덮개는 오른쪽으로 떨어진다: 그림·빠루·덮개를 모두 좌우로 뒤집는다.
// 기본은 오른쪽에서 뜯고 덮개가 왼쪽으로 떨어진다. 한쪽에 문이 붙어 있어 덮개가 문 앞으로 떨어질 때 쓴다.
function dressVent(door) {
  const open = ventIsOpen(door);
  door.element.dataset.vent = open ? 'open' : 'closed';
  door.element.dataset.side = door.pryFrom === 'left' ? 'left' : 'right';
  if (open) dropVentCover(door, false);
}

function dropVentCover(door, animated) {
  const cover = document.createElement('div');
  cover.className = 'vent-cover-fallen';
  cover.setAttribute('aria-hidden', 'true');
  // 수호가 뜯는 쪽 반대편 바닥에 기대 눕는다(그림 아래 끝을 바닥선 570에 맞춘다).
  const left = door.pryFrom === 'left' ? door.x + door.width - 20 : door.x - door.width + 20;
  Object.assign(cover.style, { left: `${left}px`, top: `${floorY - door.height + 4}px` });
  cover.dataset.side = door.element.dataset.side;
  if (animated) cover.dataset.falling = 'true';
  door.element.after(cover);
}

function startVentPry(door) {
  Object.assign(ventPry, { door, score: 0, shake: 0 });
  releaseInput();
  setCrouching(true, true);
  // 환풍구 옆(기본 오른쪽)에 웅크려 환풍구를 본다: 빠루 끝이 덮개의 그쪽 아래 모서리에 닿는다.
  const fromLeft = door.pryFrom === 'left';
  Body.setPosition(body, { x: fromLeft ? door.x - 34 : door.x + door.width + 34, y: body.position.y });
  Body.setVelocity(body, { x: 0, y: 0 });
  facing = fromLeft ? 1 : -1;
  door.element.dataset.vent = 'prying';
  // 빠루는 수호 손에 들려 있으니 수호보다 앞에 그린다(환풍구 안에 넣으면 떨리는 덮개와 함께 수호 뒤로 숨는다).
  const crowbar = document.createElement('div');
  crowbar.className = 'vent-crowbar';
  crowbar.setAttribute('aria-hidden', 'true');
  crowbar.dataset.side = door.element.dataset.side;
  Object.assign(crowbar.style, { left: `${door.x + (fromLeft ? 13 : 119)}px`, top: `${door.y + 88}px` });
  door.element.after(crowbar);
  ventPry.crowbar = crowbar;
  hint.hidden = interactionOutline.hidden = true;
  ventPryGauge.hidden = false;
  ventPryStatus.textContent = '바늘이 흰 칸을 지나는 순간을 노려라';
  playGameSound('lever', { x: door.x });
  nextVentCheck(700);
  stage.focus({ preventScroll: true }); // 버튼에 초점이 있으면 Enter·스페이스가 그 버튼을 눌러 버린다
}

// 다음 스킬체크: pause만큼 쉰 뒤 바늘이 12시에서 출발한다. 칸은 바늘이 1/3 바퀴쯤 돈 뒤(110°~300°)에 온다.
function nextVentCheck(pause) {
  const start = 110 + Math.random() * 190;
  Object.assign(ventPry, { angle: 0, zone: [start, start + ventPryZone], wait: pause });
  const arc = (from, to) => {
    const point = angle => `${50 + 40 * Math.sin(angle * Math.PI / 180)} ${50 - 40 * Math.cos(angle * Math.PI / 180)}`;
    return `M ${point(from)} A 40 40 0 0 1 ${point(to)}`;
  };
  document.getElementById('vent-pry-zone').setAttribute('d', arc(start, start + ventPryZone));
  document.getElementById('vent-pry-great').setAttribute('d', arc(start, start + ventPryGreat));
  refreshVentPry();
}

// 스페이스·Enter·E·버튼. 쉬는 동안(바늘이 아직 출발 전)은 무시한다.
function pushVentPry() {
  if (!ventPrying() || ventPry.wait > 0) return;
  const { angle, zone: [from, to] } = ventPry;
  if (angle < from || angle > to) { ventCheckMiss(); return; }
  const great = angle <= from + ventPryGreat;
  ventPry.score += great ? 2 : 1;
  ventPry.shake = 200;
  playGameSound('lever', { x: ventPry.door.x });
  if (ventPry.score >= ventPryNeed) { finishVentPry(); return; }
  ventPryStatus.textContent = '덮개가 조금 들렸다! 한 번 더';
  nextVentCheck(450 + Math.random() * 350);
}

function ventCheckMiss() {
  ventPry.shake = 360;
  playGameSound('deny', { x: ventPry.door.x });
  ventPryStatus.textContent = '빗나갔다! 덮개가 꿈쩍도 않는다';
  nextVentCheck(900);
}

// 그만두면 덮개는 다시 닫힌 그림으로 돌아간다(연속 기록은 남지 않는다).
function stopVentPry(opened = false) {
  const { door } = ventPry;
  if (!door) return;
  ventPry.door = null;
  ventPryGauge.hidden = true;
  delete sprite.dataset.pryPush;
  ventPry.crowbar?.remove();
  ventPry.crowbar = null;
  delete door.element.dataset.shake;
  door.element.dataset.vent = opened ? 'open' : 'closed';
}

function finishVentPry() {
  const { door } = ventPry;
  collectedItems.add(ventOpenKey(dynamicFloorId, door));
  stopVentPry(true);
  dropVentCover(door, true);
  playGameSound('door-metal', { x: door.x });
  openInspection('환풍구', '덮개가 우그러지며 떨어져 나갔다. 안쪽은 앉으면 겨우 들어갈 만한 덕트다. 숨을 수 있겠다.');
}

// loop.js가 뜯는 동안 매 프레임 부른다(붙잡히면 catchPlayer가 그만두게 한다).
function updateVentPry(delta) {
  if (!ventPrying()) return;
  ventPry.shake = Math.max(0, ventPry.shake - delta);
  if (ventPry.wait > 0) {
    ventPry.wait -= delta;
    if (ventPry.wait <= 0) playGameSound('ui'); // 바늘이 출발한다는 신호음
  } else {
    ventPry.angle += 360 * delta / ventPryTurnMs;
    if (ventPry.angle > ventPry.zone[1]) { ventCheckMiss(); return; } // 누르지 않고 칸을 지나쳤다
  }
  refreshVentPry();
}

function refreshVentPry() {
  const { door, shake, angle, wait } = ventPry;
  ventPryGauge.dataset.waiting = String(wait > 0);
  document.getElementById('vent-pry-needle').setAttribute('transform', `rotate(${angle} 50 50)`);
  // 빠루는 덮개 모서리에 끼워 둔 채 힘을 주며 들썩이고, 실패 직후에는 덮개와 함께 떨린다.
  ventPry.crowbar.style.setProperty('--pry', (.1 + .4 * ventPry.score + (shake > 0 ? .25 : 0)).toFixed(3));
  if (shake > 0) door.element.dataset.shake = String(Math.floor(shake / 40) % 2);
  else delete door.element.dataset.shake;
  sprite.dataset.pryPush = String(shake > 120); // 직후 수호가 빠루에 체중을 싣는다(guard-patrol.css)
}

document.getElementById('vent-pry-push').addEventListener('click', pushVentPry);
