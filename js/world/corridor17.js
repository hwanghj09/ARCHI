// 17층 복도(고정 장면): 엘리베이터·비상계단 문, 확장 구역 방 문, 소화전, 배경 타일.
const doors = [
  ...BUILDING_CORE.elevators.map((car, carIndex) => ({ name: elevatorCars[carIndex].name, type: 'elevator', carIndex,
    x: car.x, y: BUILDING_CORE.elevatorY, width: car.width })),
  { name: '비상계단', type: 'stairs', ...BUILDING_CORE.stairs },
];
for (const door of doors) {
  door.element = document.createElement('div');
  door.element.className = 'door';
  door.element.dataset.open = 'false';
  door.element.setAttribute('role', 'img');
  door.element.setAttribute('aria-label', `${door.name} 문 닫힘`);
  Object.assign(door.element.style, {
    left: `${door.x}px`, top: `${door.y}px`, width: `${door.width}px`, height: `${floorY - door.y}px`,
  });
  const image = new Image();
  image.src = `assets/objects/floor17/${door.type}.png`;
  image.alt = '';
  image.draggable = false;
  door.element.append(image);
  world.insertBefore(door.element, sprite);
  if (door.type === 'elevator') {
    addElevatorPanels(door);
    door.indicator = document.createElement('div');
    door.indicator.className = 'elevator-indicator';
    door.indicator.style.left = `${door.x + door.width / 2}px`;
    door.indicator.style.top = `${door.y - 32}px`;
    world.insertBefore(door.indicator, sprite);
    updateFloorIndicator(door);
  }
}

const extension = document.getElementById('floor17-extension');
setPowerBackground(extension.querySelector('img'), 'assets/background/floor17/service-corridor.png');
for (const entry of FLOOR17.rooms) {
  const door = addRoomDoor({ name: entry.name, type: 'room', hint: `E · ${entry.name} 들어가기`,
    target: entry.target, arrivalKey: 'exit', key: `room:${entry.target}`, locked: entry.locked, message: entry.message,
    x: entry.doorX, y: entry.doorY ?? FLOOR17.roomDoorY, width: entry.doorWidth, style: 'art-door', outline: entry.doorOutline }, extension);
  const sign = document.createElement('span');
  sign.className = 'floor-room-sign';
  sign.textContent = entry.name;
  door.element.append(sign);
  doors.push(door);
}
doors.push({ name: '소화전', type: 'inspect', x: 4023, y: 248, width: 145,
  element: document.getElementById('floor17-hydrant'), container: 'hydrant',
  message: '소화전 안에 호스와 관창이 정리되어 있다. 호스 아래에 작은 열쇠가 숨겨져 있다.' });

for (const fixture of FLOOR17.fixtures) {
  const element = document.createElement('div');
  element.className = 'fixture phone-charger';
  element.dataset.fixed = 'true';
  element.setAttribute('role', 'img');
  element.setAttribute('aria-label', fixture.name);
  Object.assign(element.style, { left: `${fixture.x}px`, top: `${fixture.y}px`, width: `${fixture.width}px`, height: `${fixture.height}px` });
  for (const line of fixture.lines) {
    const label = document.createElement('span');
    label.textContent = line;
    element.append(label);
  }
  world.insertBefore(element, sprite);
  doors.push({ ...fixture, type: 'inspect', element });
}

const background = document.getElementById('background');
// 기존 39개 타일과 동일한 아틀라스를 사용해 전원 변경 시 그림을 한 번에 교체한다.
const corridorBackground = new Image(3328, 768);
setPowerBackground(corridorBackground, 'assets/background/floor17/floor17.png');
corridorBackground.alt = '';
corridorBackground.draggable = false;
Object.assign(corridorBackground.style, { left: '0px', top: '0px', width: '3328px', height: '768px' });
background.append(corridorBackground);
