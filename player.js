(() => {
  const { Engine, Bodies, Body, Composite } = Matter;
  const stage = document.getElementById('stage');
  const world = document.getElementById('world');
  const sprite = document.getElementById('player');
  const idleSheet = document.getElementById('idle-sprite');
  const walkSheet = document.getElementById('walk-sheet');
  const runSheet = document.getElementById('run-sheet');
  const jumpSheet = document.getElementById('jump-sheet');
  const interactSheet = document.getElementById('interact-sheet');
  const buttons = [...document.querySelectorAll('nav button')];
  const keys = new Set();
  const pointers = new Map();
  const movementKeys = { KeyA: -1, ArrowLeft: -1, KeyD: 1, ArrowRight: 1 };
  const jumpKeys = new Set(['Space', 'KeyW', 'ArrowUp']);
  const runKeys = new Set(['ShiftLeft', 'ShiftRight']);
  // 모든 층(B2~17)이 공유하는 건물 코어: 층 폭, 엘리베이터 3대, 비상계단, 화장실. 17층 배경 그림 기준이며
  // 층마다 다른 것은 빈 구역 x=32..1790, 3100..3540, 4300..4968에 놓는 방과 소품뿐이다.
  const BUILDING_CORE = {
    width: 5000, elevatorY: 220, floorSignX: 2694,
    elevators: [{ x: 1818, width: 218 }, { x: 2148, width: 214 }, { x: 2444, width: 216 }],
    stairs: { x: 2906, y: 232, width: 180 },
    restroom: { x: 3556, width: 726, style: 'restroom', doorX: 3612, doorY: 210, doorWidth: 145, doorStyle: 'metal' },
  };
  const corridorWidth = BUILDING_CORE.width;
  const officeWidth = 2400;
  let worldWidth = officeWidth;
  let room = 'office'; // 'corridor' | 'office' (17층) | 'dynamic' (다른 층)
  let dynamicFloorId = null;
  let returnX = 644;
  const worldHeight = 720;
  const floorY = 570;
  const elevatorFloorTime = 1200;
  let currentSceneFloor = 17;
  const hint = document.getElementById('interaction-hint');
  const status = document.getElementById('interaction-status');
  const roomTransition = document.getElementById('room-transition');
  const dynamicScene = document.getElementById('dynamic-scene');
  const cabin = document.getElementById('elevator-cabin');
  const computer = document.getElementById('computer');
  const officeComputer = { type: 'computer', x: 612, y: 392, width: 88, element: document.getElementById('office-computer') };
  const computerWindow = document.getElementById('computer-window');
  const computerNote = document.getElementById('computer-note');
  const computerSaveStatus = document.getElementById('computer-save-status');
  let computerReturnFocus = null;
  const cabinScene = document.getElementById('cabin-scene');
  const cabinStatus = document.getElementById('cabin-status');
  const cabinDisplay = document.getElementById('cabin-display');
  const cabinOpen = document.getElementById('cabin-open');
  const cabinClose = document.getElementById('cabin-close');
  const cabinExit = document.getElementById('cabin-exit');
  let cabinCarIndex = null;
  let selectedFloor = null;
  let cabinDoorAmount = 1;
  let cabinAutoClose = 0;
  let cabinReturnFocus = null;
  const officeBackground = document.getElementById('office-background');
  const lightSwitch = document.getElementById('floor17-light-switch');
  const lights = document.getElementById('floor17-lights');
  lights.addEventListener('change', () => {
    if (transitioning || selectingFloor || usingComputer || currentSceneFloor !== 17) {
      lights.checked = world.dataset.lights === 'on';
      return;
    }
    world.dataset.lights = lights.checked ? 'on' : 'off';
    document.getElementById('floor17-light-state').value = lights.checked ? '조명 켜짐' : '조명 꺼짐';
  });
  // The generated office floor starts at source y=504; align it with the physics floor.
  Object.assign(officeBackground.style, {
    width: `${officeWidth}px`, height: `${724 * floorY / 504}px`,
    left: '0px', top: '0px',
  });
  // 복도 그림에서 사무실 유리벽은 x=32..1555이고 문은 그 왼쪽에서 39% 지점이다. 방 안 배경
  // (office-interior-aligned.png)도 문을 같은 비율 위치에 두어, 문 양옆 공간과 켜진 책상의 방향이 복도에서 본 것과 같다.
  const officeDoors = [
    { name: '사무실', room: 'corridor', x: 580, y: 236, width: 128 },
    { name: '복도', room: 'office', x: 895, y: 250, width: 144 },
  ];
  for (const door of officeDoors) {
    door.type = 'office';
    door.element = document.createElement('div');
    door.element.className = 'office-door';
    door.element.dataset.room = door.room;
    door.element.setAttribute('role', 'img');
    door.element.setAttribute('aria-label', `${door.name} 출입구`);
    Object.assign(door.element.style, {
      left: `${door.x}px`, top: `${door.y}px`, width: `${door.width}px`, height: `${floorY - door.y}px`,
    });
    world.insertBefore(door.element, sprite);
  }
  // 3개의 엘리베이터는 건물 전체를 관통하는 하나의 물리적인 실체다: 상태는 층(scene)과
  // 무관하게 전역으로 유지되고, 각 층은 그 상태를 보여주는 문 DOM만 따로 그린다.
  const elevatorCars = [
    { name: '1번 엘리베이터', floor: 1, travelling: false, elapsed: 0, destination: null, rider: false, open: false, pendingDestId: null },
    { name: '2번 엘리베이터', floor: 1, travelling: false, elapsed: 0, destination: null, rider: false, open: false, pendingDestId: null },
    { name: '3번 엘리베이터', floor: 1, travelling: false, elapsed: 0, destination: null, rider: false, open: false, pendingDestId: null },
  ];
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
  // 방이 있는 층의 방 내부: 17층 사무실처럼 별도 장면(2400px)이며 왼쪽 문으로 복도에 돌아간다.
  // 소품은 충돌 없이 배치하고 message가 있는 것만 조사할 수 있다. 원본 캔버스/앵커는 floor-kit/manifest.json 기준.
  const floorId = floor => floor < 0 ? `b${-floor}` : `f${floor}`;
  const floorName = floor => floor < 0 ? `지하 ${-floor}층` : `${floor}층`;
  const interiorRooms = (floor, rooms) => rooms.map(entry => ({ ...entry, floor, interior: true, parent: floorId(floor),
    label: entry.name, arrival: `${entry.name}에 들어왔습니다.`,
    header: `${floor < 0 ? `B${-floor}` : `${floor}F`} · ${entry.name}`, aria: `${floorName(floor)} ${entry.name}`, width: 2400, background: '#151c20', ...entry }));
  // 방은 복도 쪽 벽면 x..x+width를 차지한다. 방 안의 출구는 문 양옆 벽 길이의 비율을 복도에서 본 것과 같게 두어,
  // 복도에서 문 옆에 방이 보이는 만큼 안에서도 같은 쪽에 공간이 있다. 출구 문 그림이 배경에 들어 있는 방은 exitX로
  // 그 위치를 적고, 복도 쪽 문을 거기에 맞춘다. 방 안 폭도 층마다 복도 벽면 폭에 비례하게 잡는다.
  function exitDoorX(outside, insideWidth, doorWidth) {
    const left = outside.doorX - outside.x;
    const right = outside.x + outside.width - outside.doorX - doorWidth;
    return Math.round(32 + (insideWidth - 64 - doorWidth) * left / (left + right));
  }
  const lockedStairsMessage = '비상계단 문이 잠겨 있다. 정전 중에는 열리지 않는 것 같다.';
  // 16층 경영지원팀: 청회색 유리벽. 코어 왼쪽에 사무실·소회의실, 오른쪽에 탕비실과 복도 휴게 공간.
  // 방 내부 배경과 소품 배율은 assets/background/floor16/GENERATED.md. 복도 배경 그림은 예전 3700px 배치 기준이라
  // 코어 좌표와 맞지 않아 쓰지 않는다(corridor.png는 재생성 필요). 세 방 배경은 모두 폭 2400에 왼쪽 끝 문(높이 210)이
  // 그려져 있으므로 복도에서도 같은 폭의 방 왼쪽 끝에 같은 크기의 문을 둔다.
  const FLOOR16_LAYOUT = {
    header: '16F · 경영지원팀', background: '#151c20', roomDoorY: 360,
    rooms: [
      { name: '경영지원팀 사무실', x: 64, width: 820, target: 'f16-office', doorX: 75, doorWidth: 144, doorStyle: 'glass' },
      { name: '소회의실', x: 924, width: 820, target: 'f16-meeting', doorX: 935, doorWidth: 144, doorStyle: 'glass' },
      { name: '탕비실', x: 4322, width: 646, target: 'f16-pantry', doorX: 4333, doorWidth: 144 },
    ],
    props: [
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 3300, name: '복도 소파',
        message: '소파 위에 누가 두고 간 사원증 줄이 있다. 카드는 빠져 있다.' },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3480 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4900 },
    ],
  };
  const FLOOR16_ROOMS = interiorRooms(16, [
    { id: 'f16-office', name: '경영지원팀 사무실', background: '#05090b',
      backgroundImage: { src: 'assets/background/floor16/office.png', height: 521.28, top: 207.12 }, exitX: 68, props: [
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 330, name: '문서 캐비닛',
        message: '문서 캐비닛은 잠겨 있다. 열쇠 구멍 옆에 "재무 · 대외비" 라벨이 붙어 있다.' },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 480 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 740, name: '책상',
        message: '모니터가 꺼져 있다. 정전 때문에 PC를 켤 수 없다.' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1110 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1480 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1850 },
      { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 2110, name: '복합기',
        message: '출력하다 멈춘 종이가 걸려 있다. "야간 전력 사용 내역 · B2 서버실 · 전월 대비 3…" 뒷부분은 인쇄되지 않았다.' },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 2290 },
    ] },
    { id: 'f16-meeting', name: '소회의실', background: '#05090b',
      backgroundImage: { src: 'assets/background/floor16/meeting.png', height: 521.28, top: 207.12 }, exitX: 68, props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 320 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 580, name: '화이트보드',
        message: '회의 메모: "12층 ARCHI팀 전력 예산 또 초과. 사용량 대부분이 새벽 시간대 B2. 시설관리실 확인 요청."' },
      { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 1120 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1720 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 2000 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 2250 },
    ] },
    { id: 'f16-pantry', name: '탕비실', background: '#05090b', width: 1890,
      backgroundImage: { src: 'assets/background/floor16/pantry.png', width: 2400, height: 521.28, top: 207.12 }, exitX: 68, props: [
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 330 },
      { file: 'kitchenette-counter', size: [512, 256], worldWidth: 312, x: 620 },
      { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 960, name: '음료 자판기',
        message: '자판기 불이 꺼져 있다. 이 층에도 전기가 들어오지 않는다.' },
      { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 1160 },
      { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 1500 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1720 },
    ] },
  ]);
  // 15층 인사총무팀: 목재 마감(warm 테마). 코어 왼쪽에 창 없는 문서 보관실·인사팀 사무실, 오른쪽에 방문객 대기실과
  // 자판기 코너. 방마다 벽·문 모양과 내부 폭이 다르고, 보관실은 어두워 상자를 넘어가야 한다.
  // 단서는 ARCHI가 수호의 사원증 권한을 바꿨다는 복선(1층 경비 로봇 사건)이다.
  // 복도 벽면 폭은 방 안 폭(2600/3000/1800)의 1/3.33로 맞췄다. 보관실은 왼쪽 끝, 인사팀과 대기실은 오른쪽 끝에 문이 있다.
  const FLOOR15_LAYOUT = {
    header: '15F · 인사총무팀', background: '#1d1814', theme: 'warm',
    rooms: [
      { name: '문서 보관실', x: 64, width: 780, style: 'solid-wall', target: 'f15-archive',
        doorX: 76, doorStyle: 'metal' },
      { name: '인사팀 사무실', x: 884, width: 900, style: 'panel', target: 'f15-hr', doorX: 1644, doorStyle: 'wood' },
      { name: '방문객 대기실', x: 4322, width: 540, style: 'open', target: 'f15-lounge',
        doorX: 4634, doorWidth: 220, doorStyle: 'double' },
    ],
    props: [
      { file: 'drink-vending-machine', size: [256, 512], worldWidth: 180, x: 3240, name: '음료 자판기',
        message: '자판기 유리에 붙은 쪽지: "15층 자판기 고장 신고 · 인사총무팀". 정전이라 어차피 작동하지 않는다.' },
      { file: 'water-cooler', size: [256, 512], worldWidth: 105, x: 3385 },
      { file: 'large-planter', size: [256, 512], worldWidth: 120, x: 3494 },
    ],
  };
  const FLOOR15_ROOMS = interiorRooms(15, [
    { id: 'f15-hr', name: '인사팀 사무실', width: 3000, props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 130, x: 150 },
      { file: 'office-desk', size: [512, 256], worldWidth: 340, x: 500 },
      { file: 'office-desk', size: [512, 256], worldWidth: 340, x: 870, name: '책상',
        message: '출력된 종이 한 장: "금일 야간 잔류 인원 · 17층 정수호 (1명) · 출력 23:41". 누가 출력했는지는 적혀 있지 않다.' },
      { file: 'office-desk', size: [512, 256], worldWidth: 340, x: 1240 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 140, x: 1500 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 140, x: 1650 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 260, x: 1950, name: '화이트보드',
        message: '이번 주 할 일: "사원증 출입 권한 일괄 점검. 보안 로봇 인식 DB 동기화는 ARCHI 시스템이 자동 처리."' },
      { file: 'office-desk', size: [512, 256], worldWidth: 340, x: 2300 },
      { file: 'office-copier', size: [256, 256], worldWidth: 140, x: 2600 },
    ] },
    { id: 'f15-lounge', name: '방문객 대기실', width: 1800, props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 130, x: 150 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 300, x: 420 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 105, x: 680 },
      { file: 'reception-counter', size: [512, 256], worldWidth: 400, x: 1100, name: '안내 데스크',
        message: '방문 기록 태블릿이 꺼져 있다. 옆의 방문증 보관함은 비어 있고, 오늘 방문객은 없었다.' },
      { file: 'large-planter', size: [256, 512], worldWidth: 130, x: 1400 },
    ] },
    { id: 'f15-archive', name: '문서 보관실', width: 2600, dark: true, windowless: true,
      solids: [{ x: 900, width: 110, height: 50 }, { x: 1560, width: 90, height: 60 }], props: [
        { file: 'filing-cabinet', size: [256, 512], worldWidth: 140, x: 330 },
        { file: 'filing-cabinet', size: [256, 512], worldWidth: 140, x: 480, name: '문서 캐비닛',
          message: '"퇴사자 인사기록" 서랍이다. 잠겨 있다.' },
        { file: 'filing-cabinet', size: [256, 512], worldWidth: 140, x: 630 },
        { file: 'filing-cabinet', size: [256, 512], worldWidth: 140, x: 780 },
        { file: 'staff-lockers', size: [256, 512], worldWidth: 230, x: 1250 },
        { file: 'filing-cabinet', size: [256, 512], worldWidth: 140, x: 1800 },
        { file: 'filing-cabinet', size: [256, 512], worldWidth: 140, x: 1950, name: '출입 기록 캐비닛',
          message: '캐비닛 위에 정전 직전 자동 출력된 통보서가 놓여 있다: "23:58 · 정수호 · 직원 → 미확인 인물 · 변경자: SYSTEM". 방금 전 시각이다.' },
        { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 200, x: 2150 },
        { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 200, x: 2450 },
      ] },
  ]);
  const FLOOR_LAYOUTS = { 15: FLOOR15_LAYOUT, 16: FLOOR16_LAYOUT };
  // 화장실 내부는 건물 공통 구조라 모든 층이 17층 화장실 배경을 함께 쓴다.
  const restroomInterior = { name: '화장실', width: 1800, windowless: true,
    backgroundImage: { src: 'assets/background/floor17/restroom.png', height: 824.84, top: 0 } };
  // Additional floors share an empty layout until their content is authored.
  // 복도 벽면 범위는 service-corridor.png의 벽기둥 중심(x=3556, 4282)과 끝벽(4968) 기준이다.
  const FLOOR17 = { id: 'f17', floor: 17, short: '17F', label: '17층 · 복도', header: '17F · 00:00', aria: '17층 복도', roomDoorY: 210, rooms: [
    { name: '화장실', target: 'f17-restroom', ...BUILDING_CORE.restroom },
    { name: '관리자 외 출입금지', target: 'f17-manager', x: 4282, width: 686,
      doorX: 4378, doorWidth: 171, doorStyle: 'metal', locked: true,
      message: '관리자실 문이 잠겨 있다. 관리자 외 출입금지 표지와 붉은 출입 표시등이 보인다.' },
  ] };
  const FLOOR17_ROOMS = interiorRooms(17, [
    { id: 'f17-restroom', ...restroomInterior },
    { id: 'f17-manager', name: '관리자실', width: 1800, windowless: true, props: [
      { file: 'electrical-panel', size: [256, 512], worldWidth: 160, x: 170 },
      { file: 'office-desk', size: [512, 256], worldWidth: 400, x: 800 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 150, x: 1180 },
      { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 300, x: 1540 },
    ] },
  ]);
  const FLOOR_NUMBERS = [-2, -1, ...Array.from({ length: 16 }, (_, index) => index + 1)];
  const FLOORS = FLOOR_NUMBERS.map(floor => {
    const short = floor < 0 ? `B${-floor}` : `${floor}F`;
    const layout = FLOOR_LAYOUTS[floor] || {};
    return { id: floorId(floor), floor, short, label: floorName(floor),
      header: `${short} · 빈 층`, aria: floorName(floor), background: '#252b2a', ...layout,
      rooms: [...(layout.rooms || []), { name: '화장실', target: `${floorId(floor)}-restroom`, ...BUILDING_CORE.restroom }],
      width: BUILDING_CORE.width };
  });
  const RESTROOMS = FLOOR_NUMBERS.flatMap(floor => interiorRooms(floor, [{ id: `${floorId(floor)}-restroom`, ...restroomInterior }]));
  const ALL_FLOORS = [FLOOR17, ...FLOORS];
  const ROOFTOP = { id: 'rooftop', floor: 18, label: '옥상', header: 'RF · 옥상', aria: '옥상', width: 2400, background: '#11191d' };
  const floorById = new Map([...ALL_FLOORS, ROOFTOP, ...FLOOR15_ROOMS, ...FLOOR16_ROOMS, ...FLOOR17_ROOMS, ...RESTROOMS].map(entry => [entry.id, entry]));
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
  const rooftopBackground = new Image();
  rooftopBackground.src = 'assets/background/rooftop/rooftop.png';
  rooftopBackground.alt = '';
  rooftopBackground.draggable = false;
  Object.assign(rooftopBackground.style, {
    position: 'absolute', width: '2400px', height: `${724 * floorY / 504}px`,
    top: '0px', left: '0px', imageRendering: 'pixelated',
  });

  function floorShortLabel(floorValue) {
    if (floorValue === -1) return 'B1';
    if (floorValue === -2) return 'B2';
    if (floorValue === 18) return 'RF';
    return `${String(floorValue).padStart(2, '0')}F`;
  }

  let nearbyDoor = null;
  let statusTimer;
  const speed = 200;
  const runSpeed = 340;
  const runFrames = 8;
  const runFrameDistance = 192 / runFrames;
  const walkFrames = 6;
  const frameDistance = 184 / walkFrames;
  const step = 1000 / 60;
  world.style.width = `${worldWidth}px`;
  world.style.height = `${worldHeight}px`;
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
  const engine = Engine.create({ gravity: { x: 0, y: 1.5 } });
  const terrain = [
    { kind: 'floor', x: 0, y: floorY, width: corridorWidth, height: 150 },
    { kind: 'boundary', x: 0, y: 0, width: 32, height: worldHeight },
    { kind: 'boundary', x: corridorWidth - 32, y: 0, width: 32, height: worldHeight },
  ];
  const solids = terrain.map(({ kind, x, y, width, height }) => {
    const element = document.createElement('div');
    element.className = `solid ${kind}`;
    element.setAttribute('aria-hidden', 'true');
    Object.assign(element.style, {
      left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px`,
    });
    world.insertBefore(element, sprite);
    return Bodies.rectangle(x + width / 2, y + height / 2, width, height, { isStatic: true });
  });
  // Start in front of the lit monitor in the office background.
  const body = Bodies.rectangle(officeComputer.x + officeComputer.width / 2, floorY - 81, 40, 162, {
    inertia: Infinity, friction: 0, frictionStatic: 0, frictionAir: 0, restitution: 0,
  });
  const officeSolids = [
    Bodies.rectangle(officeWidth / 2, floorY + 75, officeWidth, 150, { isStatic: true }),
    Bodies.rectangle(16, worldHeight / 2, 32, worldHeight, { isStatic: true }),
    Bodies.rectangle(officeWidth - 16, worldHeight / 2, 32, worldHeight, { isStatic: true }),
  ];
  Composite.add(engine.world, [...officeSolids, body]);
  let currentTerrain = officeSolids;
  let currentDoors = doors;
  let walkDistance = 0;
  let runDistance = 0;
  let idleTime = 0;
  let walkReady = false;
  let facing = 1;
  let grounded = false;
  let jumpQueued = false;
  let interactionTime = 0;
  let transitioning = false;
  let sceneTransition = null;
  let selectingFloor = false;
  let usingComputer = false;
  let pulseDirection = 0;
  let pulseTime = 0;
  let scale = 1;
  let viewWidth = 0;
  let cameraX = 0;
  let previousTime = null;
  let accumulator = 0;

  function checkWalkSheet() {
    walkReady = walkSheet.naturalWidth === 256 * walkFrames && walkSheet.naturalHeight === 256;
  }
  walkSheet.addEventListener('load', checkWalkSheet);
  checkWalkSheet();

  function animate(distance, sprinting = false, elapsed = 0) {
    const running = grounded && sprinting && distance > .1 && runSheet.naturalWidth === 256 * runFrames && runSheet.naturalHeight === 256;
    const walking = grounded && walkReady && distance > .1 && !running;
    walkDistance = walking ? (walkDistance + distance) % (frameDistance * walkFrames) : 0;
    runDistance = running ? (runDistance + distance) % (runFrameDistance * runFrames) : 0;
    const state = !grounded ? (body.velocity.y < 0 ? 'jump' : 'fall') :
      interactionTime > 0 ? 'interact' : running ? 'run' : walking ? 'walk' : 'idle';
    idleTime = state === 'idle' && sprite.dataset.state === 'idle' ? (idleTime + elapsed) % 3200 : 0;
    const index = state === 'fall' ? 1 : state === 'interact' ? Number(interactionTime <= 240) :
      running ? Math.floor(runDistance / runFrameDistance) : walking ? Math.floor(walkDistance / frameDistance) :
      state === 'idle' ? (idleTime < 1200 ? 0 : idleTime < 2100 ? 1 : idleTime < 2220 ? 2 : 3) : 0;
    sprite.dataset.state = state;
    sprite.dataset.frame = index;
    if (state === 'idle') {
      // The original 2x2 sheet has uneven cells: align each hip and sole at the walking scale.
      const hip = [325, 925, 325, 925][index];
      const sole = [619, 619, 1234, 1235][index];
      idleSheet.style.transform = `translate(${96 - hip * .285}px, ${178 - sole * .285}px)`;
      idleSheet.style.clipPath = `inset(${index < 2 ? 0 : 50}% ${index % 2 ? 0 : 50}% ${index < 2 ? 50 : 0}% ${index % 2 ? 50 : 0}%)`;
    }
    if (state === 'walk') walkSheet.style.transform = `translateX(${-index * 100 / walkFrames}%)`;
    if (state === 'run') runSheet.style.transform = `translateX(${-index * 100 / runFrames}%)`;
    if (state === 'jump' || state === 'fall') jumpSheet.style.transform = `translateX(${-index * 50}%)`;
    if (state === 'interact') interactSheet.style.transform = `translateX(${-index * 50}%)`;
  }

  function cameraTarget() {
    return Math.max(0, Math.min(worldWidth - viewWidth, body.position.x - viewWidth * .42));
  }

  function render() {
    world.style.setProperty('--sight-x', `${body.position.x}px`);
    world.style.setProperty('--sight-y', `${body.position.y}px`);
    // The image has transparent padding: its soles sit 178px below the sprite top.
    sprite.style.transform = `translate(${body.position.x - 96}px, ${body.bounds.max.y - 178}px) scaleX(${facing})`;
    world.style.transform = `translate(${-cameraX * scale}px, ${stage.clientHeight - worldHeight * scale}px) scale(${scale})`;
  }

  function update() {
    if (transitioning) {
      updateSceneTransition();
      updateElevators();
      return;
    }
    if (selectingFloor) {
      updateElevators();
      updateCabin();
      return;
    }
    if (usingComputer) {
      updateElevators();
      return;
    }
    const directions = [...keys].map(key => movementKeys[key]).concat([...pointers.values()]);
    if (pulseTime > 0) directions.push(pulseDirection);
    pulseTime = Math.max(0, pulseTime - step);
    const direction = Number(directions.includes(1)) - Number(directions.includes(-1));
    const sprinting = [...runKeys].some(key => keys.has(key));
    interactionTime = direction || jumpQueued ? 0 : Math.max(0, interactionTime - step);
    if (direction) facing = direction;
    Body.setVelocity(body, { x: direction * (sprinting ? runSpeed : speed) / 60, y: jumpQueued && grounded ? -10.8 : body.velocity.y });
    jumpQueued = false;
    const oldX = body.position.x;
    Engine.update(engine, step);
    grounded = engine.pairs.list.some(pair => {
      if (!pair.isActive || (pair.bodyA !== body && pair.bodyB !== body)) return false;
      const normalY = pair.collision.normal.y * (pair.bodyA === body ? 1 : -1);
      return normalY < -.5;
    });
    animate(Math.abs(body.position.x - oldX), sprinting, step);
    updateElevators();
    updateInteraction();
    cameraX += (cameraTarget() - cameraX) * .13;
    cameraX = Math.max(0, Math.min(Math.max(0, worldWidth - viewWidth), cameraX));
  }

  function showStatus(message, duration = 2500) {
    status.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = ''; }, duration);
  }

  function changeRoom(onChange = performRoomChange) {
    if (transitioning) return;
    if (onChange === performRoomChange && room === 'corridor' && (!officeBackground.complete || !officeBackground.naturalWidth)) {
      showStatus('사무실 배경을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    transitionScene(onChange);
  }

  function transitionScene(onChange) {
    if (transitioning) return;
    sceneTransition = { onChange, elapsed: 0, focus: document.activeElement };
    transitioning = true;
    releaseInput();
    stage.inert = true;
    cabin.inert = true;
    computer.inert = true;
    roomTransition.dataset.phase = 'out';
    roomTransition.style.opacity = '0';
    roomTransition.classList.add('visible');
  }

  function updateSceneTransition() {
    const transition = sceneTransition;
    // Keep a fully black frame between scenes; use the same clock as gameplay.
    if (roomTransition.dataset.phase === 'black') {
      transition.onChange();
      stage.inert = true;
      cabin.inert = true;
      computer.inert = true;
      transition.elapsed = 0;
      roomTransition.dataset.phase = 'in';
      return;
    }
    transition.elapsed += step;
    const amount = Math.min(1, transition.elapsed / 350);
    const fadingOut = roomTransition.dataset.phase === 'out';
    roomTransition.style.opacity = String(fadingOut ? amount : 1 - amount);
    if (amount < 1) return;
    if (fadingOut) {
      roomTransition.dataset.phase = 'black';
      return;
    }
    transitioning = false;
    sceneTransition = null;
    roomTransition.dataset.phase = 'idle';
    roomTransition.classList.remove('visible');
    stage.inert = selectingFloor || usingComputer;
    cabin.inert = false;
    computer.inert = false;
    const previousFocus = computer.contains(transition.focus) ? computerReturnFocus :
      cabin.contains(transition.focus) ? cabinReturnFocus : transition.focus;
    const focus = usingComputer ? computer.querySelector('button') : selectingFloor ? cabin :
      previousFocus?.isConnected && previousFocus !== document.body ? previousFocus : stage;
    focus.focus({ preventScroll: true });
  }

  function performRoomChange() {
    const entering = room === 'corridor';
    if (entering) returnX = body.position.x;
    for (const solid of entering ? solids : officeSolids) Composite.remove(engine.world, solid);
    Composite.add(engine.world, entering ? officeSolids : solids);
    Engine.clear(engine);
    room = entering ? 'office' : 'corridor';
    currentTerrain = entering ? officeSolids : solids;
    worldWidth = entering ? officeWidth : corridorWidth;
    world.dataset.room = room;
    world.style.width = `${worldWidth}px`;
    Body.setPosition(body, { x: entering ? officeDoors[1].x + 91 : returnX, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true;
    interactionTime = 420;
    facing = entering ? 1 : -1;
    animate(0);
    cameraX = cameraTarget();
    stage.setAttribute('aria-label', `ARCHI 17층 ${entering ? '사무실' : '복도'} 사이드뷰 스테이지`);
    document.querySelector('header span').textContent = entering ? '17F · 사무실' : '17F · 00:00';
    showStatus(entering ? '사무실에 들어왔습니다.' : '복도로 나왔습니다.');
    updateInteraction();
    render();
  }

  function addRoomDoor(door, parent = dynamicScene) {
    door.element = document.createElement('div');
    door.element.className = `room-door ${door.style || ''}`.trim();
    door.element.setAttribute('role', 'img');
    door.element.setAttribute('aria-label', `${door.name} 출입문${door.locked ? ' · 잠김' : ''}`);
    Object.assign(door.element.style, {
      left: `${door.x}px`, top: `${door.y}px`, width: `${door.width}px`, height: `${floorY - door.y}px`,
    });
    parent.append(door.element);
    return door;
  }

  function buildDynamicScene(config) {
    const bodies = [];
    const doorList = [];
    dynamicScene.dataset.art = String(Boolean(config.backgroundImage));
    if (config.backgroundImage) {
      const art = config.backgroundImage;
      const image = new Image();
      image.className = 'floor-background';
      image.src = art.src;
      image.alt = '';
      image.draggable = false;
      Object.assign(image.style, { width: `${art.width ?? config.width}px`, height: `${art.height}px`, top: `${art.top}px` });
      dynamicScene.append(image);
    }
    if (config.id === 'rooftop') dynamicScene.append(rooftopBackground);
    const layout = [
      { kind: 'floor', x: 0, y: floorY, width: config.width, height: 150 },
      { kind: 'boundary', x: 0, y: 0, width: 32, height: worldHeight },
      { kind: 'boundary', x: config.width - 32, y: 0, width: 32, height: worldHeight },
      ...(config.solids || []).map(({ x, width, height }) => ({ kind: 'crate', x, y: floorY - height, width, height })),
    ];
    for (const { kind, x, y, width, height } of layout) {
      const element = document.createElement('div');
      element.className = `solid ${kind}`;
      element.setAttribute('aria-hidden', 'true');
      Object.assign(element.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });
      dynamicScene.append(element);
      bodies.push(Bodies.rectangle(x + width / 2, y + height / 2, width, height, { isStatic: true }));
    }
    if (config.id === 'rooftop') {
      const supply = document.createElement('div');
      supply.className = 'solar-supply';
      supply.setAttribute('role', 'img');
      supply.setAttribute('aria-label', '태양광 임시 전력장치 · 화면 꺼짐');
      // The first 887px cell has transparent padding; its bottom edge is y=691.
      Object.assign(supply.style, { left: '720px', top: `${floorY - 691 * 360 / 887}px` });
      const image = new Image();
      image.src = 'assets/objects/power/solar-supply-off-on.png';
      image.alt = '';
      image.draggable = false;
      supply.append(image);
      dynamicScene.append(supply);
    }
    if (config.interior) {
      const backdrop = document.createElement('div');
      backdrop.className = `room-interior${config.windowless ? ' windowless' : ''}`;
      dynamicScene.append(backdrop);
      // 출구는 복도에서 들어온 그 문이다: 크기와 모양이 같고, 위치는 문 양옆 벽 비율을 따른다.
      const parent = floorById.get(config.parent);
      const outside = parent.rooms.find(entry => entry.target === config.id);
      const doorWidth = outside.doorWidth ?? 120;
      doorList.push(addRoomDoor({ name: '복도', type: 'room', hint: 'E · 복도로 나가기', target: config.parent,
        arrivalKey: `room:${config.id}`, key: 'exit', x: config.exitX ?? exitDoorX(outside, config.width, doorWidth),
        y: outside.doorY ?? parent.roomDoorY ?? 250, width: doorWidth, style: outside.doorStyle }));
    }
    for (const roomConfig of config.rooms || []) {
      const roomElement = document.createElement('div');
      roomElement.className = `floor-room ${roomConfig.style || 'glass'}`;
      Object.assign(roomElement.style, { left: `${roomConfig.x}px`, width: `${roomConfig.width}px` });
      const sign = document.createElement('span');
      sign.className = 'floor-room-sign';
      sign.textContent = roomConfig.name;
      roomElement.append(sign);
      dynamicScene.append(roomElement);
      doorList.push(addRoomDoor({ name: roomConfig.name, type: 'room', hint: `E · ${roomConfig.name} 들어가기`,
        locked: roomConfig.locked, message: roomConfig.message,
        target: roomConfig.target, arrivalKey: 'exit', key: `room:${roomConfig.target}`,
        x: roomConfig.doorX, y: roomConfig.doorY ?? config.roomDoorY ?? 250, width: roomConfig.doorWidth ?? 120,
        style: roomConfig.doorStyle }));
    }
    const isFloor = config.id !== 'rooftop' && !config.interior;
    if (isFloor) {
      const floorSign = document.createElement('div');
      floorSign.className = 'floor-number-sign';
      floorSign.textContent = floorShortLabel(config.floor);
      floorSign.style.left = `${BUILDING_CORE.floorSignX}px`;
      dynamicScene.append(floorSign);
    }
    for (const prop of config.props || []) {
      const [width, height] = prop.size;
      const scale = prop.worldWidth / width;
      const element = document.createElement('div');
      element.className = 'floor-prop';
      Object.assign(element.style, {
        left: `${prop.x - width / 2 * scale}px`, top: `${floorY - (height - 8) * scale}px`,
        width: `${prop.worldWidth}px`, height: `${height * scale}px`,
      });
      const image = new Image();
      image.src = `assets/objects/floor-kit/${prop.file}.png`;
      image.alt = '';
      image.draggable = false;
      element.append(image);
      dynamicScene.append(element);
      if (!prop.message) continue;
      element.setAttribute('role', 'img');
      element.setAttribute('aria-label', prop.name);
      doorList.push({ name: prop.name, type: 'inspect', message: prop.message, element,
        x: prop.x - prop.worldWidth / 2, y: floorY - (height - 8) * scale, width: prop.worldWidth });
    }
    const sceneDoors = config.id === 'rooftop' ?
      [{ name: '17층 계단', type: 'stairs', x: 160, y: 232, width: 180 }] : !isFloor ? [] : [
        ...BUILDING_CORE.elevators.map((car, carIndex) => ({ name: elevatorCars[carIndex].name, type: 'elevator', carIndex,
          x: car.x, y: BUILDING_CORE.elevatorY, width: car.width })),
        { name: '비상계단', type: 'stairs', locked: true, message: lockedStairsMessage, ...BUILDING_CORE.stairs },
      ];
    const coreDoors = [];
    sceneDoors.forEach(door => {
      door.element = document.createElement('div');
      door.element.className = 'door';
      door.element.dataset.open = 'false';
      door.element.setAttribute('role', 'img');
      Object.assign(door.element.style, {
        left: `${door.x}px`, top: `${door.y}px`, width: `${door.width}px`, height: `${floorY - door.y}px`,
      });
      const image = new Image();
      image.src = `assets/objects/floor17/${door.type}.png`;
      image.alt = '';
      image.draggable = false;
      door.element.append(image);
      dynamicScene.append(door.element);
      setDoorOpen(door, false);
      if (door.type === 'elevator') {
        addElevatorPanels(door);
        door.indicator = document.createElement('div');
        door.indicator.className = 'elevator-indicator';
        door.indicator.style.left = `${door.x + door.width / 2}px`;
        door.indicator.style.top = `${door.y - 32}px`;
        dynamicScene.append(door.indicator);
      }
      coreDoors.push(door);
    });
    // Core doors come first: interaction picks the first match, so the fixed elevators and stairs behave
    // identically on every floor even where a floor's own door or prop hint zone touches theirs.
    return { bodies, doors: [...coreDoors, ...doorList] };
  }

  function performFloorChange(destId, carIndex = 0, arrivalKey = null) {
    Composite.remove(engine.world, currentTerrain);
    dynamicScene.innerHTML = '';
    const dest = floorById.get(destId);
    currentSceneFloor = dest.floor;
    world.dataset.floor = String(currentSceneFloor);
    lightSwitch.hidden = currentSceneFloor !== 17;
    if (destId === 'f17') {
      room = 'corridor';
      world.dataset.room = 'corridor';
      worldWidth = corridorWidth;
      currentTerrain = solids;
      currentDoors = doors;
      Composite.add(engine.world, solids);
    } else {
      room = 'dynamic';
      dynamicFloorId = destId;
      world.dataset.room = 'dynamic';
      worldWidth = dest.width;
      dynamicScene.style.background = dest.background;
      dynamicScene.dataset.theme = dest.theme || (dest.parent && floorById.get(dest.parent).theme) || '';
      const built = buildDynamicScene(dest);
      currentTerrain = built.bodies;
      currentDoors = built.doors;
      Composite.add(engine.world, currentTerrain);
    }
    const arrivalDoor = currentDoors.find(door => arrivalKey ? door.key === arrivalKey :
      carIndex === null ? door.type === 'stairs' : door.carIndex === carIndex);
    Body.setPosition(body, { x: arrivalDoor.x + 40, y: floorY - 81 });
    Engine.clear(engine);
    world.style.width = `${worldWidth}px`;
    Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true;
    interactionTime = 420;
    facing = dest.interior && arrivalDoor.x < worldWidth / 2 ? 1 : -1;
    world.dataset.dark = String(Boolean(dest.dark));
    animate(0);
    cameraX = cameraTarget();
    stage.setAttribute('aria-label', `ARCHI ${dest.aria} 사이드뷰 스테이지`);
    document.querySelector('header span').textContent = dest.header;
    showStatus(dest.arrival || (arrivalKey ? '복도로 나왔습니다.' : `${dest.label}에 도착했습니다.`));
    refreshSceneElevatorDoors();
    updateInteraction();
    render();
  }

  function addElevatorPanels(door) {
    door.element.classList.add('elevator');
    const panels = document.createElement('div');
    panels.className = 'elevator-panels';
    door.element.append(panels);
  }

  function setDoorOpen(door, open) {
    door.element.dataset.open = String(open);
    door.element.setAttribute('aria-label', `${door.name} 문 ${open ? '열림' : '닫힘'}`);
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

  function updateInteraction() {
    if (room === 'dynamic') {
      nearbyDoor = currentDoors.find(door => grounded && Math.abs(body.bounds.max.y - floorY) < 2 &&
        Math.abs(body.position.x - door.x - door.width / 2) < door.width / 2 + 28) || null;
      for (const door of currentDoors) door.element.classList.toggle('near', door === nearbyDoor);
      hint.hidden = !nearbyDoor;
      if (nearbyDoor) {
        hint.style.left = `${nearbyDoor.x + nearbyDoor.width / 2}px`;
        hint.style.top = `${nearbyDoor.y - (nearbyDoor.type === 'elevator' ? 72 : 42)}px`;
        hint.textContent = doorHintText(nearbyDoor);
      }
      return;
    }
    const activeDoors = room === 'corridor' ? [...doors, ...officeDoors.filter(door => door.room === room)] :
      [...officeDoors.filter(door => door.room === room), officeComputer];
    nearbyDoor = activeDoors.find(door => grounded && Math.abs(body.bounds.max.y - floorY) < 2 &&
      Math.abs(body.position.x - door.x - door.width / 2) < door.width / 2 + 28) || null;
    for (const door of [...doors, ...officeDoors, officeComputer]) door.element.classList.toggle('near', door === nearbyDoor);
    hint.hidden = !nearbyDoor;
    if (nearbyDoor) {
      hint.style.left = `${nearbyDoor.x + nearbyDoor.width / 2}px`;
      hint.style.top = `${nearbyDoor.y - (nearbyDoor.type === 'elevator' ? 72 : 42)}px`;
      hint.textContent = nearbyDoor.type === 'office' ? (room === 'corridor' ? 'E · 사무실 들어가기' : 'E · 복도로 나가기') : doorHintText(nearbyDoor);
    }
  }

  function doorHintText(door) {
    if (door.type === 'computer') return 'E · 컴퓨터 사용';
    if (door.type === 'inspect') return `E · ${door.name} 조사`;
    if (door.locked) return `E · ${door.name} (잠김)`;
    if (door.type === 'room') return door.hint;
    if (door.type === 'stairs') return currentSceneFloor === 18 ? 'E · 17층으로 내려가기' : 'E · 옥상으로 올라가기';
    if (door.type === 'panel') return 'E · 조사';
    if (door.type === 'elevator') {
      const car = elevatorCars[door.carIndex];
      if (car.travelling) return car.rider ? '이동 중…' : '호출 중…';
      if (car.floor === currentSceneFloor) return 'E · 탑승';
      return 'E · 호출';
    }
    return door.element.dataset.open === 'true' ? 'E · 닫기' : 'E · 열기';
  }

  function interact() {
    if (transitioning || selectingFloor || usingComputer) return;
    updateInteraction();
    if (!nearbyDoor) return;
    if (nearbyDoor.type === 'computer') {
      computerReturnFocus = document.activeElement;
      transitionScene(() => {
        usingComputer = true;
        computer.hidden = false;
        computerWindow.hidden = true;
        hint.hidden = true;
      });
      return;
    }
    if (nearbyDoor.type === 'inspect' || nearbyDoor.locked) {
      interactionTime = 420;
      facing = body.position.x <= nearbyDoor.x + nearbyDoor.width / 2 ? 1 : -1;
      animate(0);
      showStatus(nearbyDoor.message, 5000);
      return;
    }
    if (nearbyDoor.type === 'room') {
      const { target, arrivalKey } = nearbyDoor;
      changeRoom(() => performFloorChange(target, null, arrivalKey));
      return;
    }
    if (nearbyDoor.type === 'stairs') {
      const destId = currentSceneFloor === 18 ? 'f17' : 'rooftop';
      if (destId === 'rooftop' && (!rooftopBackground.complete || !rooftopBackground.naturalWidth)) {
        showStatus('옥상 배경을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      changeRoom(() => performFloorChange(destId, null));
      return;
    }
    if (nearbyDoor.type === 'office') {
      changeRoom();
      return;
    }
    if (nearbyDoor.type === 'panel') {
      showStatus(`${nearbyDoor.name}입니다. (추후 구현 예정)`);
      return;
    }
    if (nearbyDoor.type === 'elevator') {
      const car = elevatorCars[nearbyDoor.carIndex];
      if (car.travelling) return;
      interactionTime = 420;
      facing = body.position.x <= nearbyDoor.x + nearbyDoor.width / 2 ? 1 : -1;
      animate(0);
      if (car.floor === currentSceneFloor) {
        enterCabin(nearbyDoor.carIndex);
        return;
      }
      car.travelling = true;
      car.rider = false;
      car.destination = currentSceneFloor;
      car.elapsed = 0;
      car.open = false;
      updateFloorIndicator(nearbyDoor);
      showStatus(`${nearbyDoor.name}를 호출했습니다.`);
      updateInteraction();
      return;
    }
    interactionTime = 420;
    facing = body.position.x <= nearbyDoor.x + nearbyDoor.width / 2 ? 1 : -1;
    animate(0);
    const open = nearbyDoor.element.dataset.open !== 'true';
    setDoorOpen(nearbyDoor, open);
    showStatus(`${nearbyDoor.name} 문을 ${open ? '열었습니다' : '닫았습니다'}.`);
    updateInteraction();
  }

  function exitComputer() {
    if (transitioning || !usingComputer) return;
    transitionScene(() => {
      usingComputer = false;
      computer.hidden = true;
      updateInteraction();
    });
  }

  function openComputerApp(app, documentId) {
    if (transitioning || !usingComputer) return;
    const record = app === 'document' ? officeDocuments.find(item => item.id === documentId) : null;
    if (app === 'document' && !record) return;
    computerWindow.hidden = false;
    for (const view of ['files', 'notes', 'document']) {
      document.getElementById(`computer-${view}`).hidden = view !== app;
    }
    let title = app === 'files' ? '파일' : '업무 메모';
    if (app === 'document') {
      title = record.title;
      document.getElementById('computer-document-title').textContent = title;
      document.getElementById('computer-document-code').textContent = `${record.code} / REV ${record.revision}`;
      document.getElementById('computer-document-meta').textContent = `${record.category} · ${record.owner} · ${record.updated} · ${record.status}`;
      // Only authored local document markup is rendered here; user notes stay in the textarea.
      document.getElementById('computer-document-body').innerHTML = record.body;
      document.getElementById('computer-document-scroll').scrollTop = 0;
    }
    document.getElementById('computer-window-title').textContent = title;
    (app === 'notes' ? computerNote : document.getElementById('computer-window-close')).focus();
  }

  function closeComputerApp() {
    computerWindow.hidden = true;
    computer.querySelector('button').focus();
  }

  const fileSearch = document.getElementById('computer-search');
  const fileCategory = document.getElementById('computer-category');
  const fileRows = officeDocuments.map(record => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.computerDocument = record.id;
    const icon = new Image();
    icon.src = 'assets/vendor/lucide/file-text.svg';
    icon.alt = '';
    const description = document.createElement('span');
    description.className = 'computer-file-description';
    const title = document.createElement('strong');
    title.textContent = record.title;
    const summary = document.createElement('small');
    summary.textContent = record.summary;
    description.append(title, summary);
    const metadata = document.createElement('span');
    metadata.className = 'computer-file-metadata';
    metadata.textContent = `${record.category} · ${record.owner}\n${record.updated} · ${record.status}`;
    button.append(icon, description, metadata);
    button.addEventListener('click', () => openComputerApp('document', record.id));
    document.getElementById('computer-file-list').append(button);
    return { record, button };
  });
  function filterComputerFiles() {
    const query = fileSearch.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const { record, button } of fileRows) {
      button.hidden = Boolean(fileCategory.value && record.category !== fileCategory.value) ||
        !`${record.title} ${record.owner} ${record.code} ${record.summary}`.toLocaleLowerCase().includes(query);
      if (!button.hidden) count++;
    }
    document.getElementById('computer-file-count').textContent = `${count}개 문서`;
    document.getElementById('computer-files-empty').hidden = count !== 0;
  }
  fileSearch.addEventListener('input', filterComputerFiles);
  fileCategory.addEventListener('change', filterComputerFiles);
  filterComputerFiles();

  computer.querySelectorAll('[data-computer-app]').forEach(button => {
    button.addEventListener('click', () => openComputerApp(button.dataset.computerApp));
  });
  document.getElementById('computer-window-close').addEventListener('click', closeComputerApp);
  document.getElementById('computer-exit').addEventListener('click', exitComputer);
  try {
    computerNote.value = localStorage.getItem('archi.office17.note') || '';
  } catch {
    computerSaveStatus.textContent = '저장소를 읽을 수 없음';
  }
  computerNote.addEventListener('input', () => { computerSaveStatus.textContent = '저장되지 않음'; });
  document.getElementById('computer-save').addEventListener('click', () => {
    try {
      localStorage.setItem('archi.office17.note', computerNote.value);
      computerSaveStatus.textContent = '저장됨';
    } catch {
      computerSaveStatus.textContent = '저장 실패 · 입력 내용은 유지됩니다';
    }
  });
  computer.addEventListener('keydown', event => {
    if (event.code !== 'Tab') return;
    const enabled = [...computer.querySelectorAll('button, input, select, textarea, [tabindex="0"]')].filter(el => !el.closest('[hidden]'));
    const index = enabled.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) { event.preventDefault(); enabled.at(-1).focus(); }
    else if (!event.shiftKey && (index === -1 || index === enabled.length - 1)) { event.preventDefault(); enabled[0].focus(); }
  });

  // Hotspots use the source artwork's 1536x1024 coordinates; CSS scales them with the scene.
  const cabinFloorButtons = [];
  const panelFloors = [null, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, -1, -2];
  panelFloors.forEach((floor, index) => {
    if (floor === null) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cabin-hit';
    button.dataset.floor = floor;
    button.title = floor < 0 ? `지하 ${-floor}층` : `${floor}층`;
    button.setAttribute('aria-label', button.title);
    button.setAttribute('aria-pressed', 'false');
    Object.assign(button.style, {
      left: `${(1073 + index % 4 * 77) / 1536 * 100}%`, top: `${(261 + Math.floor(index / 4) * 74) / 1024 * 100}%`,
      width: `${60 / 1536 * 100}%`, height: `${57 / 1024 * 100}%`,
    });
    button.addEventListener('click', () => {
      const car = elevatorCars[cabinCarIndex];
      if (transitioning || !car || car.travelling || floor === car.floor) return;
      selectedFloor = selectedFloor === floor ? null : floor;
      cabinAutoClose = selectedFloor === null ? 0 : 1600;
      cabinStatus.textContent = selectedFloor === null ? '층 선택 취소' : `${button.title} 선택`;
      refreshCabin();
    });
    document.getElementById('cabin-floor-buttons').append(button);
    cabinFloorButtons.push(button);
  });

  function enterCabin(carIndex) {
    if (transitioning) return;
    const art = document.getElementById('cabin-art');
    if (!art.complete || !art.naturalWidth) {
      showStatus('엘리베이터 내부 이미지를 불러오지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    cabinReturnFocus = document.activeElement;
    transitionScene(() => showCabin(carIndex));
  }

  function showCabin(carIndex) {
    cabinCarIndex = carIndex;
    selectedFloor = null;
    cabinAutoClose = 0;
    cabinDoorAmount = 1;
    cabinScene.style.setProperty('--door-open', '1');
    selectingFloor = true;
    releaseInput();
    elevatorCars[carIndex].rider = true;
    elevatorCars[carIndex].open = true;
    cabinScene.dataset.door = 'open';
    stage.inert = true;
    cabin.hidden = false;
    cabinStatus.textContent = `${floorShortLabel(elevatorCars[carIndex].floor)} · 문 열림`;
    refreshCabin();
    cabin.scrollLeft = cabin.scrollWidth - cabin.clientWidth;
  }

  function refreshCabin() {
    if (cabinCarIndex === null) return;
    const car = elevatorCars[cabinCarIndex];
    const label = car.floor < 0 ? `B${-car.floor}` : String(car.floor);
    const display = `${car.travelling ? (car.destination > car.floor ? '↑' : '↓') : ''}${label}`;
    if (cabinDisplay.textContent !== display) cabinDisplay.textContent = display;
    cabin.dataset.moving = String(car.travelling);
    cabin.dataset.floor = car.floor;
    cabinScene.dataset.floor = car.floor;
    cabinOpen.disabled = car.travelling;
    cabinClose.disabled = car.travelling;
    cabinExit.disabled = car.travelling || cabinScene.dataset.door !== 'open';
    for (const button of cabinFloorButtons) {
      button.disabled = car.travelling || Number(button.dataset.floor) === car.floor;
      button.setAttribute('aria-pressed', String(Number(button.dataset.floor) === (car.travelling ? car.destination : selectedFloor)));
    }
  }

  function setCabinDoor(open) {
    const car = elevatorCars[cabinCarIndex];
    if (transitioning || !car || car.travelling) return;
    cabinAutoClose = 0;
    const phase = cabinScene.dataset.door;
    if (phase === (open ? 'open' : 'closed') || phase === (open ? 'opening' : 'closing')) return;
    car.open = open;
    cabinScene.dataset.door = open ? 'opening' : 'closing';
    cabinStatus.textContent = open ? '문이 열립니다.' : '문이 닫힙니다.';
    refreshSceneElevatorDoors();
    refreshCabin();
  }

  function updateCabin() {
    if (cabinCarIndex === null) return;
    const car = elevatorCars[cabinCarIndex];
    if (cabinAutoClose > 0) {
      cabinAutoClose = Math.max(0, cabinAutoClose - step);
      if (!cabinAutoClose) setCabinDoor(false);
    }
    if (cabinScene.dataset.door === 'opening' || cabinScene.dataset.door === 'closing') {
      cabinDoorAmount = Math.max(0, Math.min(1, cabinDoorAmount + (car.open ? 1 : -1) * step / 1100));
      cabinScene.style.setProperty('--door-open', cabinDoorAmount);
      if (cabinDoorAmount === (car.open ? 1 : 0)) cabinScene.dataset.door = car.open ? 'open' : 'closed';
    }
    if (!car.travelling && cabinScene.dataset.door === 'closed' && selectedFloor !== null && !cabinAutoClose) {
      car.destination = selectedFloor;
      car.travelling = true;
      car.elapsed = 0;
      cabinStatus.textContent = `${floorShortLabel(selectedFloor)} 이동 중`;
    }
    refreshCabin();
  }

  function exitCabin() {
    if (transitioning || cabinCarIndex === null || cabinExit.disabled) return;
    transitionScene(leaveCabin);
  }

  function leaveCabin() {
    const car = elevatorCars[cabinCarIndex];
    const destination = ALL_FLOORS.find(entry => entry.floor === car.floor);
    car.rider = false;
    selectingFloor = false;
    cabin.hidden = true;
    stage.inert = false;
    releaseInput();
    performFloorChange(destination.id, cabinCarIndex);
    cabinCarIndex = null;
  }
  cabinOpen.addEventListener('click', () => setCabinDoor(true));
  cabinClose.addEventListener('click', () => setCabinDoor(false));
  cabinExit.addEventListener('click', exitCabin);
  document.getElementById('cabin-alarm').addEventListener('click', () => {
    if (transitioning) return;
    cabinStatus.textContent = '비상벨 작동';
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    gain.gain.value = .08;
    oscillator.frequency.value = 880;
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + .4);
    oscillator.onended = () => { audio.close(); };
  });
  cabin.addEventListener('keydown', event => {
    if (event.code !== 'Tab') return;
    const enabled = [...cabin.querySelectorAll('button:not(:disabled)')];
    const index = enabled.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) { event.preventDefault(); enabled.at(-1).focus(); }
    else if (!event.shiftKey && (index === -1 || index === enabled.length - 1)) { event.preventDefault(); enabled[0].focus(); }
  });

  window.addEventListener('keydown', event => {
    if (transitioning) { event.preventDefault(); return; }
    if (usingComputer) {
      if (event.code === 'Escape' && !event.repeat) {
        event.preventDefault();
        if (computerWindow.hidden) exitComputer();
        else closeComputerApp();
      }
      return;
    }
    if (selectingFloor) {
      if (event.code === 'Escape') exitCabin();
      return;
    }
    if (event.target instanceof Element && event.target.closest('button, input') && event.code === 'Space') return;
    if (event.code === 'KeyE') {
      event.preventDefault();
      if (!event.repeat) interact();
      return;
    }
    if (!Object.hasOwn(movementKeys, event.code) && !jumpKeys.has(event.code) && !runKeys.has(event.code)) return;
    event.preventDefault();
    if (jumpKeys.has(event.code)) {
      if (!event.repeat) jumpQueued = true;
    } else keys.add(event.code);
  });
  window.addEventListener('keyup', event => keys.delete(event.code));

  function releaseInput() {
    keys.clear();
    pointers.clear();
    buttons.forEach(button => button.classList.remove('active'));
    jumpQueued = false;
    pulseTime = 0;
    previousTime = null;
    interactionTime = 0;
    accumulator = 0;
    animate(0);
  }

  window.addEventListener('blur', releaseInput);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseInput();
  });

  function pressAction(button) {
    if (button.id === 'jump') jumpQueued = true;
    else if (button.id === 'interact') interact();
  }

  buttons.forEach(button => {
    const direction = Number(button.dataset.direction) || 0;
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || transitioning || selectingFloor || usingComputer) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      if (direction) pointers.set(event.pointerId, direction);
      else pressAction(button);
      button.classList.add('active');
    });
    const release = event => {
      pointers.delete(event.pointerId);
      button.classList.toggle('active', direction ? [...pointers.values()].includes(direction) : false);
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => button.addEventListener(name, release));
    button.addEventListener('contextmenu', event => event.preventDefault());
    button.addEventListener('click', event => {
      if (event.detail !== 0 || transitioning || selectingFloor || usingComputer) return;
      if (direction) {
        pulseDirection = direction;
        pulseTime = 150;
      } else pressAction(button);
    });
  });

  new ResizeObserver(() => {
    scale = stage.clientHeight / worldHeight;
    viewWidth = stage.clientWidth / scale;
    cameraX = cameraTarget();
    render();
  }).observe(stage);

  function frame(time) {
    if (!document.hidden) {
      accumulator += previousTime === null ? 0 : Math.min(time - previousTime, 100);
      while (accumulator >= step) {
        update();
        accumulator -= step;
      }
      render();
    }
    previousTime = document.hidden ? null : time;
    requestAnimationFrame(frame);
  }

  render();
  requestAnimationFrame(frame);
})();
