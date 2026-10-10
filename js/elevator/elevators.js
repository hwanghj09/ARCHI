// 엘리베이터 운행: 3대의 전역 상태, 층 표시등, 호출과 도착 처리.
// 3개의 엘리베이터는 건물 전체를 관통하는 하나의 물리적인 실체다: 상태는 층(scene)과
// 무관하게 전역으로 유지되고, 각 층은 그 상태를 보여주는 문 DOM만 따로 그린다.
const elevatorCars = [
  { name: '1번 엘리베이터', floor: 1, travelling: false, elapsed: 0, destination: null, rider: false, open: false, pendingDestId: null },
  { name: '2번 엘리베이터', floor: 1, travelling: false, elapsed: 0, destination: null, rider: false, open: false, pendingDestId: null },
  { name: '3번 엘리베이터', floor: 1, travelling: false, elapsed: 0, destination: null, rider: false, open: false, pendingDestId: null },
];

const elevatorPowerMessage = '전력이 없어 엘리베이터가 멈췄다. 옥상에서 태양광 비상 전력 레버를 내려야 한다.';
function elevatorHasPower() {
  return !buildingBlackout || solarEnabled;
}

function addElevatorPanels(door) {
  door.element.classList.add('elevator');
  const panels = document.createElement('div');
  panels.className = 'elevator-panels';
  door.element.append(panels);
  const glow = document.createElement('div');
  glow.className = 'elevator-glow';
  door.element.append(glow);
  // 열린 문으로 새는 객실 조명: 어둠 막(z 5) 위에 그려 어두운 곳에서도 문 주변을 밝힌다. 열림·전력은 setDoorOpen과 updateFloorIndicator가 맞춘다.
  const spreadW = door.width * 2.6;
  const top = door.y - door.width * 0.25;
  door.light = document.createElement('div');
  door.light.className = 'elevator-light';
  door.light.dataset.open = door.element.dataset.open;
  Object.assign(door.light.style, {
    left: `${door.x + door.width / 2 - spreadW / 2}px`, top: `${top}px`, width: `${spreadW}px`, height: `${floorY - top}px`,
  });
  door.element.before(door.light); // 문(열리면 어둠 막 위로 올라옴)보다 아래에 둬서 빛이 문 밖으로만 번지게 한다.
}

function updateFloorIndicator(door) {
  const car = elevatorCars[door.carIndex];
  const label = floorShortLabel(car.floor);
  const powered = elevatorHasPower();
  door.indicator.dataset.powered = String(powered);
  door.element.dataset.lit = String(powered);
  if (door.light) door.light.dataset.powered = String(powered);
  door.indicator.textContent = `${car.travelling && powered ? (car.destination > car.floor ? '↑ ' : '↓ ') : ''}${label}`;
  door.indicator.setAttribute('aria-label', `${door.name} ${label}${!powered ? ' 전력 없음' : car.travelling ? ' 이동 중' : ''}`);
}

// 열린 엘리베이터가 어둠 막(#darkness)에 내는 구멍: 문이 열리고 전력이 있으면 그 둘레의 어둠이 걷혀 주변 배경이 보인다.
// 값은 차량별 CSS 변수(--e0x … --e2k)로 넘기고, 모양은 index.html의 #darkness mask가 그린다. 켜지고 꺼질 때는 부드럽게 변한다.
const elevatorGlowAmount = [0, 0, 0];
const darknessLayer = document.getElementById('darkness');
function updateElevatorGlow(index, door) {
  const lit = !!door && door.element.dataset.open === 'true' && elevatorHasPower() && door.element.offsetParent !== null;
  elevatorGlowAmount[index] += ((lit ? 1 : 0) - elevatorGlowAmount[index]) * 0.06;
  if (elevatorGlowAmount[index] < 0.005) elevatorGlowAmount[index] = 0;
  const style = darknessLayer.style;
  style.setProperty(`--e${index}k`, elevatorGlowAmount[index].toFixed(3));
  if (!door) return;
  const height = door.height ?? floorY - door.y;
  style.setProperty(`--e${index}x`, `${door.x + door.width / 2}px`);
  style.setProperty(`--e${index}y`, `${door.y + height * 0.5}px`);
  style.setProperty(`--e${index}w`, `${door.width * 2.4}px`);
  style.setProperty(`--e${index}h`, `${height * 0.95}px`);
}

function refreshSceneElevatorDoors() {
  elevatorCars.forEach((car, index) => {
    const door = currentDoors.find(candidate => candidate.type === 'elevator' && candidate.carIndex === index);
    if (door) {
      setDoorOpen(door, car.open && car.floor === currentSceneFloor);
      updateFloorIndicator(door);
    }
    updateElevatorGlow(index, door);
  });
}

function updateElevators() {
  for (const car of elevatorCars) {
    // 전력 차단 시 호출·탑승 운행 모두 같은 위치와 경과 시간에서 멈춘다. 복구하면 이어서 운행한다.
    if (!elevatorHasPower() || !car.travelling) continue;
    car.elapsed += step;
    if (car.elapsed < elevatorFloorTime) continue;
    car.elapsed -= elevatorFloorTime;
    car.floor += Math.sign(car.destination - car.floor);
    if (car.floor === 0) car.floor += Math.sign(car.destination);
    if (car.floor === car.destination) {
      car.travelling = false;
      car.open = true;
      if (car.rider) {
        playGameSound('elevator-arrive');
        selectedFloor = null;
        setCabinDoor(true);
        cabinStatus.textContent = `${floorShortLabel(car.floor)} 도착 · 문이 열립니다.`;
      } else if (car.floor === currentSceneFloor) {
        const door = currentDoors.find(candidate => candidate.type === 'elevator' && elevatorCars[candidate.carIndex] === car);
        if (door && !selectingFloor) {
          playGameSound('elevator-arrive', { x: door.x + door.width / 2 });
          playGameSound('elevator-door', { x: door.x + door.width / 2 });
        }
        showStatus(`${car.name}가 ${car.floor}층에 도착했습니다.`);
      }
    }
  }
  refreshSceneElevatorDoors();
}
