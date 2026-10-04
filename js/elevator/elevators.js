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
}

function updateFloorIndicator(door) {
  const car = elevatorCars[door.carIndex];
  const label = floorShortLabel(car.floor);
  const powered = elevatorHasPower();
  door.indicator.textContent = `${car.travelling && powered ? (car.destination > car.floor ? '↑ ' : '↓ ') : ''}${label}`;
  door.indicator.setAttribute('aria-label', `${door.name} ${label}${!powered ? ' 전력 없음' : car.travelling ? ' 이동 중' : ''}`);
}

function refreshSceneElevatorDoors() {
  elevatorCars.forEach((car, index) => {
    const door = currentDoors.find(candidate => candidate.type === 'elevator' && candidate.carIndex === index);
    if (!door) return;
    setDoorOpen(door, car.open && car.floor === currentSceneFloor);
    updateFloorIndicator(door);
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
