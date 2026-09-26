// 엘리베이터 운행: 3대의 전역 상태, 층 표시등, 호출과 도착 처리.
// 3개의 엘리베이터는 건물 전체를 관통하는 하나의 물리적인 실체다: 상태는 층(scene)과
// 무관하게 전역으로 유지되고, 각 층은 그 상태를 보여주는 문 DOM만 따로 그린다.
const elevatorCars = [
  { name: '1번 엘리베이터', floor: 1, travelling: false, elapsed: 0, destination: null, rider: false, open: false, pendingDestId: null },
  { name: '2번 엘리베이터', floor: 1, travelling: false, elapsed: 0, destination: null, rider: false, open: false, pendingDestId: null },
  { name: '3번 엘리베이터', floor: 1, travelling: false, elapsed: 0, destination: null, rider: false, open: false, pendingDestId: null },
];

function addElevatorPanels(door) {
  door.element.classList.add('elevator');
  const panels = document.createElement('div');
  panels.className = 'elevator-panels';
  door.element.append(panels);
}

function updateFloorIndicator(door) {
  const car = elevatorCars[door.carIndex];
  const label = floorShortLabel(car.floor);
  door.indicator.textContent = `${car.travelling ? (car.destination > car.floor ? '↑ ' : '↓ ') : ''}${label}`;
  door.indicator.setAttribute('aria-label', `${door.name} ${label}${car.travelling ? ' 이동 중' : ''}`);
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
    if (!car.travelling) continue;
    car.elapsed += step;
    if (car.elapsed < elevatorFloorTime) continue;
    car.elapsed -= elevatorFloorTime;
    car.floor += Math.sign(car.destination - car.floor);
    if (car.floor === 0) car.floor += Math.sign(car.destination);
    if (car.floor === car.destination) {
      car.travelling = false;
      car.open = true;
      if (car.rider) {
        selectedFloor = null;
        setCabinDoor(true);
        cabinStatus.textContent = `${floorShortLabel(car.floor)} 도착 · 문이 열립니다.`;
      } else if (car.floor === currentSceneFloor) {
        showStatus(`${car.name}가 ${car.floor}층에 도착했습니다.`);
      }
    }
  }
  refreshSceneElevatorDoors();
}
