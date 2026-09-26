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
for (const entry of FLOOR17.rooms) {
  const door = addRoomDoor({ name: entry.name, type: 'room', hint: `E · ${entry.name} 들어가기`,
    target: entry.target, arrivalKey: 'exit', key: `room:${entry.target}`, locked: entry.locked, message: entry.message,
    x: entry.doorX, y: entry.doorY ?? FLOOR17.roomDoorY, width: entry.doorWidth, style: 'art-door' }, extension);
  const sign = document.createElement('span');
  sign.className = 'floor-room-sign';
  sign.textContent = entry.name;
  door.element.append(sign);
  doors.push(door);
}
doors.push({ name: '소화전', type: 'inspect', x: 4023, y: 248, width: 145,
  element: document.getElementById('floor17-hydrant'), message: '소화전 안에 호스와 관창이 정리되어 있다. 옆에는 소화기가 비치되어 있다.' });

const background = document.getElementById('background');
for (let row = 0; row < Math.ceil(worldHeight / 256); row++) {
  for (let col = 0; col < Math.ceil(3200 / 256); col++) {
    const tile = new Image(256, 256);
    tile.src = `assets/background/floor17/tiles/${row}-${col}.png`;
    tile.alt = '';
    tile.draggable = false;
    tile.style.left = `${col * 256}px`;
    tile.style.top = `${row * 256}px`;
    background.append(tile);
  }
}
