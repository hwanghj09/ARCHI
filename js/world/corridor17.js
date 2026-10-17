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
setPowerBackground(extension.querySelector('img'), 'assets/background/floor17/service-corridor-finished.png');
for (const entry of FLOOR17.rooms) {
  const door = addRoomDoor({ name: entry.name, type: 'room', hint: `E · ${entry.name} 들어가기`,
    target: entry.target, arrivalKey: 'exit', key: `room:${entry.target}`, locked: entry.locked, message: entry.message,
    code: entry.code, codeMessage: entry.codeMessage, unlockedBy: entry.unlockedBy,
    x: entry.doorX, y: entry.doorY ?? FLOOR17.roomDoorY, width: entry.doorWidth, style: 'art-door', outline: entry.doorOutline }, extension);
  const sign = document.createElement('span');
  sign.className = 'floor-room-sign';
  sign.textContent = entry.name;
  door.element.append(sign);
  doors.push(door);
}
doors.push({ name: '소화전', type: 'inspect', x: 4023, y: 248, width: 145,
  element: document.getElementById('floor17-hydrant'), container: 'hydrant',
  message: '소화전 안에 호스와 관창이 정리되어 있다. 아래 선반에 작은 열쇠와 접힌 관리실 메모가 있다.' });

// 배경에 그려진 CCTV 아래 게시판의 위치에 조사 영역만 겹친다.
const noticeboard = document.createElement('div');
noticeboard.id = 'floor17-noticeboard';
noticeboard.setAttribute('role', 'img');
noticeboard.setAttribute('aria-label', 'CCTV 아래 게시판');
Object.assign(noticeboard.style, { position: 'absolute', left: '1644px', top: '284px', width: '140px', height: '164px', pointerEvents: 'none' });
world.insertBefore(noticeboard, sprite);
doors.push({ name: 'CCTV 아래 게시판', type: 'inspect', x: 1644, y: 284, width: 140, element: noticeboard,
  outline: [1580, 273, 135, 159],
  surface: 'corkboard',
  message: 'CCTV 아래 게시판에 여러 포스트잇이 붙어 있다. 회의실 예약, 분실물, 소등 안내 사이에 관리 메모가 보인다. "태양광 비상 전력 · 승인번호 1997 · 네 자리 입력 후 레버 작동".',
  caption: '회의와 당직 메모 사이에 낡은 관리 메모가 섞여 있다.',
  writing: [
    { as: 'note', color: 'yellow', title: '회의실 예약', text: '내일 오전 10시\n회의 끝나면 의자 정리!' },
    { as: 'note', color: 'pink', title: '분실물', text: '검은 우산 찾습니다.\n찾으면 관리실에 맡겨 주세요.' },
    { as: 'note', color: 'blue', title: '퇴근 전 확인', text: '모니터 OFF\n마지막 사람은 소등' },
    { as: 'note', color: 'yellow', title: '관리 메모', text: '태양광 비상 전력\n승인번호 1997\n네 자리 입력 후 레버 작동' },
    { as: 'note', color: 'green', title: '당직 인수인계', text: '옥상 출입 후\n문 꼭 닫아 주세요.' },
    { as: 'note', color: 'pink', title: '공용 냉장고', text: '금요일에 정리합니다.\n개인 음식에 이름을 써 주세요.' },
  ],
});

const background = document.getElementById('background');
// 기존 39개 타일과 동일한 아틀라스를 사용해 전원 변경 시 그림을 한 번에 교체한다.
const corridorBackground = new Image(3328, 768);
setPowerBackground(corridorBackground, 'assets/background/floor17/floor17-finished.png');
corridorBackground.alt = '';
corridorBackground.draggable = false;
Object.assign(corridorBackground.style, { left: '0px', top: '0px', width: '3328px', height: '760px' });
background.append(corridorBackground);
addLuminousSigns(corridorBackground, 'assets/background/floor17/floor17-finished.png');
