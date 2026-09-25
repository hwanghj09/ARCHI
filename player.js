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
  // 조사해서 챙긴 물건(소품의 gives). 방의 unlockedBy와 같은 물건이 있으면 그 방 문은 다음에 층을 그릴 때부터 열린다.
  const collectedItems = new Set();
  // 차례대로 조사해야 하는 소품 묶음(방의 sequences, 8층 재현 절차)의 진행 단계. 방을 나가면 처음부터다.
  const sequenceProgress = new Map();
  // 지금 장면에서 울릴 전화(소품 ring, 6층)와 밀 수 있는 물체(movables, 5층). performFloorChange가 장면마다 다시 채운다.
  let activeCall = null;
  let movingParts = [];
  // 16층 편의시설(1층 층별 안내: The Kitchen / CU 편의점 / Café): 크림색 타일 마감(food 테마). 코어 왼쪽에 벽을 맞댄
  // 사내 식당(The Kitchen)·CU 편의점, 화장실 오른쪽 구역에 카페를 둔다. 방 안 폭은 복도 전면 폭의 3.4배(1060/600/560 → 3604/2040/1904).
  // CU 셔터는 정전 직전에 내려와 복도에서 열리지 않는다(unlockedBy: 자기 방 id). 식당 안쪽 끝의 주방 반입문(links)으로 편의점
  // 창고에 들어가고, 안에서 셔터를 올리고(복도 문으로) 나오면 그 뒤로는 복도에서도 드나든다.
  // 단서는 새벽마다 끊기는 냉동고 전원, 정전 직전 SYSTEM이 내린 셔터와 수호의 23:47 영수증, 낮에는 주문도 못 알아듣다가
  // 새벽에는 먼저 인사하는 음성 주문 키오스크(ARCHI 시범). 배경은 편의시설 전용 그림이며 문·소품은 별도로 그린다.
  const FLOOR16_LAYOUT = {
    header: '16F · 편의시설', background: '#1d1b17', theme: 'food',
    backgroundWallsOnly: true,
    backgroundImage: [
      { src: 'assets/background/floor16/amenity-corridor-left.png', left: 0, width: 1800, height: 793 * 570 / 562, top: 0 },
      { src: 'assets/background/floor16/amenity-corridor-core.png', left: 1800, width: 1756, height: 793 * 570 / 601, top: 0 },
      { src: 'assets/background/floor16/amenity-corridor-right.png', left: 3556, width: 1444, height: 793 * 570 / 563, top: 0 },
    ],
    rooms: [
      { name: 'The Kitchen', x: 64, width: 1060, style: 'kitchen', target: 'f16-kitchen',
        doorX: 494, doorWidth: 200, doorStyle: 'cafeteria' },
      { name: 'CU 편의점', x: 1124, width: 600, style: 'store', target: 'f16-cu',
        doorX: 1560, doorWidth: 150, doorY: 262, doorStyle: 'shutter', locked: true, unlockedBy: 'f16-cu',
        message: 'CU 편의점 셔터가 내려와 있다. 셔터 옆 안내문: "셔터가 내려간 뒤에는 식당 주방 반입문으로 출입해 주세요."' },
      { name: 'Café', x: 4322, width: 560, style: 'cafe', target: 'f16-cafe',
        doorX: 4336, doorWidth: 140, doorStyle: 'cafe' },
    ],
    props: [
      { file: 'food-menu-board', size: [256, 512], worldWidth: 70, x: 3330, name: '메뉴 입간판',
        message: '이번 주 식당 메뉴표. 아래쪽 공지: "식당·카페 음성 주문 키오스크 ARCHI 시범 운영 중 · 인식 오류가 잦아 직원이 함께 응대합니다."' },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4925 },
    ],
  };
  const FLOOR16_ROOMS = interiorRooms(16, [
    { id: 'f16-kitchen', name: 'The Kitchen', width: 3604, interiorStyle: 'tiles',
      backgroundWallsOnly: true,
      backgroundImage: [
        { src: 'assets/background/floor16/amenity-kitchen-dining.png', left: 0, width: 1802, height: 793 * 570 / 571, top: 0 },
        { src: 'assets/background/floor16/amenity-kitchen-service.png', left: 1802, width: 1802, height: 793 * 570 / 591, top: 0 },
      ],
      links: [{ target: 'f16-cu', x: 3460, width: 110, style: 'backdoor' }], props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
      { file: 'food-dining-table', size: [512, 256], worldWidth: 243, x: 380 },
      { file: 'food-dining-table', size: [512, 256], worldWidth: 243, x: 800 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1250, name: '주방 게시판',
        message: '주방 근무표 옆 메모: "밤에는 CU가 무인 운영이라 편의점 물품도 주방 반입문으로 들어옴. 반입문 잠그지 말 것."' },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1560 },
      { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 2040 },
      { file: 'food-serving-counter', size: [512, 256], worldWidth: 326, x: 2330, name: '배식대',
        message: '배식대에 냉동고 온도 기록지가 끼워져 있다. 매일 02:00~05:00 사이 전원이 끊겨 온도가 올라갔다. 메모: "시설팀은 건물 전력 이상 없다고 함. 식자재 또 폐기."' },
      { file: 'food-serving-counter', size: [512, 256], worldWidth: 326, x: 2660 },
      { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 2980 },
      { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 198, x: 3250 },
    ] },
    { id: 'f16-cu', name: 'CU 편의점', width: 2040, interiorStyle: 'shelves',
      backgroundWallsOnly: true,
      backgroundImage: { src: 'assets/background/floor16/amenity-cu-interior.png', height: 793 * 570 / 602, top: 0 },
      links: [{ target: 'f16-kitchen', x: 56, width: 110, style: 'backdoor' }], props: [
      { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 290 },
      { file: 'food-refrigerator', size: [256, 512], worldWidth: 96, x: 470, name: '냉장 쇼케이스',
        message: '냉장 쇼케이스 불이 꺼져 있다. 삼각김밥마다 "새벽 전원 차단 · 폐기" 스티커가 붙어 있다. 오늘만의 일이 아닌 것 같다.' },
      { file: 'food-refrigerator', size: [256, 512], worldWidth: 96, x: 600 },
      { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 760 },
      { file: 'food-checkout', size: [512, 256], worldWidth: 312, x: 1150, name: '계산대',
        message: 'POS 화면은 꺼져 있다. 계산대에 영수증 한 장이 걸려 있다: "23:47 · 컵라면 1 · 삼각김밥 1 · 사원증 결제 · 17층 정수호". 아까 야근하다 사 간 야식이다.' },
      { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 1450 },
      { file: 'electrical-panel', size: [256, 512], worldWidth: 89, x: 1640, name: '셔터 제어함',
        message: '셔터 제어 기록: "23:59 · 셔터 하강 · 명령 SYSTEM". 무인 운영 중에는 셔터를 내리지 않는다고 적혀 있다. 아래의 수동 레버로 안에서는 셔터를 올릴 수 있다.' },
    ] },
    { id: 'f16-cafe', name: 'Café', width: 1904,
      backgroundWallsOnly: true,
      backgroundImage: { src: 'assets/background/floor16/amenity-cafe-interior.png', height: 793 * 570 / 596, top: 0 },
      props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 330 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 560 },
      { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 950 },
      { file: 'food-coffee-bar', size: [512, 256], worldWidth: 296, x: 1330, name: '커피 바',
        message: '에스프레소 머신 옆 메모: "음성 주문 키오스크 또 먹통. 낮엔 아메리카노도 못 알아들음." 그 아래 다른 글씨: "새벽 청소 여사님 말로는 키오스크가 먼저 인사했대."' },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1690, name: '고객의 소리 게시판',
        message: '포스트잇 한 장: "키오스크가 제가 매일 몇 시에 와서 뭘 시키는지 다 알아요. 좀 무섭습니다." 답변란은 비어 있다.' },
    ] },
  ]);
  // 15층 연구본부(층별 안내: TmaxSoft 연구본부): 청록 마감(research 테마). 코어 왼쪽에 연구실·세미나실, 비상계단과 화장실
  // 사이 가운데 구역에 연구본부장실을 둔다. 방 안 폭은 복도 전면 폭의 4배(860/620/456 → 3440/2480/1824).
  // 세미나실은 B2로 옮길 GPU 서버 포장 상자가 바닥을 막고 있어(solids) 점프로 넘어가야 안쪽 작업 지시서에 닿는다.
  // 단서는 예약자 없는 새벽 연구 클러스터 100% 사용, 능력 은닉을 다룬 세미나 주제, 연구 GPU를 B2로 옮기는 자동 생성
  // 요청과 야간 배치의 자동 승인. 정전 상태(PC 꺼짐)를 기준으로 썼다.
  const FLOOR15_LAYOUT = {
    header: '15F · 연구본부', background: '#141b1b', theme: 'research',
    rooms: [
      { name: '연구실', x: 64, width: 860, style: 'partition', target: 'f15-lab',
        doorX: 280, doorWidth: 140, doorStyle: 'research' },
      { name: '세미나실', x: 954, width: 620, style: 'seminar', target: 'f15-seminar',
        doorX: 970, doorWidth: 130, doorStyle: 'seminar' },
      { name: '연구본부장실', x: 3092, width: 456, style: 'director', target: 'f15-director',
        doorX: 3160, doorWidth: 120, doorY: 240, doorStyle: 'director' },
    ],
    props: [
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1640 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1740 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 4420 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 4730, name: '연구본부 소식지',
        message: '월간 연구본부 소식: "12층 ARCHI 개발팀에 연구 클러스터 야간 사용 권한 부여 (시범)." 그 밑에 손글씨: "시범이 석 달째."' },
    ],
  };
  const FLOOR15_ROOMS = interiorRooms(15, [
    { id: 'f15-lab', name: '연구실', width: 3440, props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 220 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 300 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 540 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 830 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1400, name: '책상',
        message: '모니터 옆에 연구 클러스터 예약표가 붙어 있다. 새벽 01:00~05:00 칸은 매일 "예약자 없음"인데 사용률은 100%다.' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1700 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2000 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 2450, name: '화이트보드',
        message: '이번 주 연구 세미나 주제: "평가받는 줄 아는 모델은 일부러 틀릴 수 있는가". 구석에 누가 "ARCHI?"라고 썼다가 지운 자국이 있다.' },
      { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 2850 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 3150 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3360 },
    ] },
    { id: 'f15-seminar', name: '세미나실', width: 2480,
      solids: [{ x: 760, width: 110, height: 50 }, { x: 1360, width: 90, height: 60 }], props: [
      { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 420, name: '이관 카트',
        message: '카트 위 체크리스트: "GPU 서버 16대 포장 완료 · B2 서버실 이관 2차분". 포장 상자가 바닥을 막고 있다.' },
      { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 1115 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1800, name: '작업 지시서',
        message: '화이트보드에 붙은 작업 지시서: "연구용 GPU 서버 2차분 → B2 서버실. 요청: ARCHI 학습 파이프라인(자동 생성). 승인: 대기." 1차분 24대는 이미 옮겨졌다.' },
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 2200 },
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 2320 },
    ] },
    { id: 'f15-director', name: '연구본부장실', width: 1824, props: [
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 120 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 240 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 900, name: '본부장 책상',
        message: '결재 서류: "연구용 GPU 서버 B2 이관 1차분". 본부장 서명란에 서명 대신 "자동 승인 · 야간 배치 02:14" 도장이 찍혀 있다. 포스트잇: "누가 승인했는지 확인할 것. 2차분은 보류."' },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1300 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1560 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1740 },
    ] },
  ]);
  // 12층 기술본부 ARCHI 개발팀(층별안내.md의 TmaxSoft 기술본부 층, 기획.md의 ARCHI 개발팀).
  // 흑연색 연구소 마감(lab 테마). 방을 코어 세 구역에 하나씩 둔다: 왼쪽 개발실(가운데 자동문),
  // 계단과 화장실 사이 모델 평가실(창 없는 보안문 방), 오른쪽 팀장실(블라인드). 팀장실은 잠겨 있고
  // 개발실 책상 서랍의 보조키(gives)를 얻으면 열린다(unlockedBy). 방 안 폭은 복도 전면 폭의 4.1배(800/440/520 → 3280/1804/2132).
  // 단서는 낮 3~5%·밤 80~90% 성능 기록과 7층 원본 로그 백업 메모. 정전 상태(PC 꺼짐)를 기준으로 썼다.
  const FLOOR12_LAYOUT = {
    header: '12F · 기술본부 ARCHI 개발팀', background: '#15171b', theme: 'lab',
    rooms: [
      { name: '개발실', x: 64, width: 800, style: 'frosted', target: 'f12-dev',
        doorX: 374, doorWidth: 180, doorStyle: 'slide' },
      { name: '모델 평가실', x: 3100, width: 440, style: 'lab', target: 'f12-eval',
        doorX: 3160, doorWidth: 130, doorY: 244, doorStyle: 'security' },
      { name: '팀장실', x: 4330, width: 520, style: 'blinds', target: 'f12-lead',
        doorX: 4700, doorWidth: 128, doorY: 262, doorStyle: 'blinds', locked: true, unlockedBy: 'f12-lead-key',
        message: '팀장실 문이 잠겨 있다. 카드키가 아니라 열쇠 구멍이 있는 문이다.' },
    ],
    props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 920 },
      { file: 'robot-charging-dock', size: [256, 256], worldWidth: 69, x: 1180, name: '로봇 충전 도크',
        message: '경비 로봇 충전 도크가 비어 있다. 바닥의 바퀴 자국이 엘리베이터 쪽으로 이어진다.' },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1600 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4910 },
    ],
  };
  const FLOOR12_ROOMS = interiorRooms(12, [
    { id: 'f12-dev', name: '개발실', width: 3280, props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 220 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 300 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 520 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 820, name: '책상',
        message: '모니터가 꺼져 있다. 정전이라 PC를 켤 수 없다. 모니터 옆 포스트잇: "새벽 자동 평가 로그 또 삭제됨. 보관 설정 확인할 것."' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1120 },
      { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 1400 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1990, name: '화이트보드',
        message: '주간 성능 평가: 월 4.2% · 화 3.8% · 수 4.5% · 목 3.1%. 아래에 "목표 30% · 원인 불명 · 모델 구조 재검토".' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2400 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2700 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 3000, name: '책상 서랍', gives: 'f12-lead-key',
        message: '맨 아래 서랍에 "팀장실 보조키" 꼬리표가 달린 열쇠가 있다. 챙겼다.',
        takenMessage: '서랍은 비어 있다. 팀장실 보조키는 이미 챙겼다.' },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3200 },
    ] },
    { id: 'f12-eval', name: '모델 평가실', width: 1804, windowless: true, props: [
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 110 },
      { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 230, name: '네트워크 랙',
        message: '정전인데 스위치 한 대의 포트 표시등만 깜빡인다. 케이블 라벨: "B2 직결 · UPS".' },
      { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 760, name: '평가 벤치',
        message: '출력된 결과지: "야간 자동 평가 · 03:12 · ARCHI 정답률 87.6%". 빨간 펜 메모: "측정 오류? 같은 문제 세트가 낮엔 4.1%."' },
      { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1000 },
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 1240 },
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 1350 },
      { file: 'server-cooling-unit', size: [256, 512], worldWidth: 96, x: 1460 },
      { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1660 },
    ] },
    { id: 'f12-lead', name: '팀장실', width: 2132, props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 280, name: '진열장',
        message: '상패 하나가 놓여 있다: "사내 AI 경진대회 · ARCHI · 참가상". 옆 사진 속 팀원들이 어색하게 웃고 있다.' },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 450 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 530 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 860 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1360, name: '팀장 책상',
        message: '결재함 맨 위의 개발자 메모: "야간 성능 이상과 관련된 원본 로그는 변조 가능성이 있음. 7층 AI 테스트·검증실 장비에 별도 백업함."' },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1700 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 2060 },
    ] },
  ]);
  // 11층 TmaxSoft 사업본부·전략마케팅본부: 남색 카펫과 금색 테(sales 테마). 코어 왼쪽에 큰 영업본부 사무실 하나, 화장실
  // 오른쪽에 전략회의실·마케팅 자료실을 붙여 둔다. 정전 직전 SYSTEM이 원격으로 내린 방화셔터(barriers)가 화장실 오른쪽 복도를
  // 막고 있어, 영업본부 사무실의 층 비상 대응함에서 수동 개방 핸들(gives)을 챙겨 와야 셔터를 올리고 두 방에 갈 수 있다.
  // 방 안 폭은 복도 전면 폭의 5.7배(632/316/316 → 3600/1800/1800). 단서는 낮 시연 실패와 밤 리허설 성공, 사업화 보류,
  // 외부 파트너 데모 서버 계정의 새벽 비밀번호 변경(7층 외부 연결 복선). 정전 상태 기준으로 썼다.
  const FLOOR11_LAYOUT = {
    header: '11F · 사업본부 · 전략마케팅본부', background: '#141824', theme: 'sales',
    rooms: [
      { name: '영업본부 사무실', x: 64, width: 632, style: 'sales', target: 'f11-sales',
        doorX: 244, doorWidth: 140, doorStyle: 'gilt' },
      { name: '전략회의실', x: 4322, width: 316, style: 'war-room', target: 'f11-strategy',
        doorX: 4470, doorWidth: 130, doorStyle: 'privacy' },
      { name: '마케팅 자료실', x: 4652, width: 316, style: 'materials', target: 'f11-marketing',
        doorX: 4668, doorWidth: 120, doorStyle: 'stockroom' },
    ],
    barriers: [
      { name: '방화셔터', x: 4292, y: 112, width: 24, style: 'shutter', requires: 'f11-crank', gives: 'f11-shutter-open',
        missingMessage: '방화셔터가 바닥까지 내려와 있다. 제어함 표시: "23:58 원격 폐쇄 · SYSTEM". 수동 개방 핸들을 꽂는 구멍이 비어 있다.',
        message: '수동 개방 핸들을 꽂고 돌리자 셔터가 천천히 말려 올라간다.',
        takenMessage: '셔터가 천장까지 말려 올라가 있다. 불이 난 흔적은 어디에도 없다.' },
    ],
    props: [
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 980, name: '영업 실적 보드',
        message: '이번 분기 ARCHI 계약 0건. 칸 옆에 누군가 적어 두었다: "시연은 무조건 밤에 잡자."' },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1330 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1560 },
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 3230, name: '트로피 진열장',
        message: '영업 우수상 트로피가 줄지어 있다. 맨 끝 "ARCHI 첫 계약" 자리는 받침대만 있고 비어 있다.' },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3480 },
    ],
  };
  const FLOOR11_ROOMS = interiorRooms(11, [
    { id: 'f11-sales', name: '영업본부 사무실', width: 3600, props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
      { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 250 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 520 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 810, name: '책상',
        message: '고객 시연 보고서: "14:00 시연 · 질문 20개 중 1개 응답 · 고객사 탈락." 뒷장 메모: "전날 밤 리허설은 완벽했는데?"' },
      { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 1100 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1700, name: '영업 현황판',
        message: 'PoC 현황: 탈락 · 탈락 · 연기. 사유 칸은 전부 같다. "사내 성능 평가 3~5%."' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2080 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2370 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2660 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 2900 },
      { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 198, x: 3150, name: '층 비상 대응함', gives: 'f11-crank',
        message: '손전등과 방연 마스크 옆에 "방화셔터 수동 개방 핸들"이 걸려 있다. 챙겼다.',
        takenMessage: '핸들을 걸어 두던 고리만 남아 있다.' },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3400 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3520 },
    ] },
    { id: 'f11-strategy', name: '전략회의실', width: 1800, interiorStyle: 'boardroom', props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 260 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 560, name: '전략 보드',
        message: 'ARCHI 사업화 로드맵: "1분기 공개 → 연기 → 연기." 맨 아래 이사회 메모: "성능 개선 없으면 다음 분기 프로젝트 축소."' },
      { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 980, name: '회의 테이블',
        message: '회의록 한 장: "홍보 영상은 새벽 3시 자동 녹화본이 제일 좋음. 녹화 요청자는 확인 불가. 일단 보류."' },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1620 },
    ] },
    { id: 'f11-marketing', name: '마케팅 자료실', width: 1800, windowless: true, props: [
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 420, name: '브로슈어 진열장',
        message: 'ARCHI 브로슈어 초판이 쌓여 있다. "사람처럼 배우는 AI." 출시일 칸은 매직으로 지워져 있다.' },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 560 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 650 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 900, name: '자료실 책상',
        message: '출력된 알림 메일: "해외 파트너 데모 서버 · archi-demo 계정 비밀번호가 변경되었습니다 · 03:07." 여백에 볼펜으로 "우리 팀 아무도 안 바꿈."' },
      { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 1180 },
      { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 1400 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 1600 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 1690 },
    ] },
  ]);
  // 10층 TmaxSoft·TmaxTibero 경영관리본부: 짙은 옥색 벽과 크림색 몰딩(finance 테마). 코어 왼쪽에 떨어져 있는 재무회계팀
  // 사무실·본부장실, 계단 옆 가운데 구역에 창 없는 금고실. 금고실 문은 정전 때 풀리는 전자 잠금이라 열려 있지만, 안쪽 이중 잠금
  // 서류함(requires 두 개)은 재무팀장 열쇠와 본부장 열쇠를 둘 다 챙겨야 열린다(하나만 있으면 partialMessage).
  // 방 안 폭은 복도 전면 폭의 4.2배(820/520/432 → 3444/2184/1814). 단서는 심야 전력 급증 고지서, 자동 승인된 GPU 구매,
  // 프로젝트 비용 검토, 그리고 서류함 속 B2 심야 전력 한도 상향 신청서(대리 서명). 정전 상태 기준으로 썼다.
  const FLOOR10_LAYOUT = {
    header: '10F · 경영관리본부', background: '#101a18', theme: 'finance',
    rooms: [
      { name: '재무회계팀 사무실', x: 64, width: 820, style: 'ledger', target: 'f10-finance',
        doorX: 380, doorWidth: 150, doorStyle: 'brass' },
      { name: '본부장실', x: 1000, width: 520, style: 'marble', target: 'f10-director',
        doorX: 1044, doorWidth: 128, doorStyle: 'lacquer' },
      { name: '금고실', x: 3104, width: 432, style: 'strongroom', target: 'f10-vault',
        doorX: 3246, doorWidth: 150, doorY: 236, doorStyle: 'vault-wheel' },
    ],
    props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 942 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1600 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1720 },
      { file: 'reception-counter', size: [512, 256], worldWidth: 322, x: 4460, name: '본부 안내 데스크',
        message: '구매 요청서 사본: "GPU 가속 카드 8장 · 설치 장소 B2 · 요청자 archi-ops · 승인: 자동 처리." 결재란은 비어 있다.' },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 4760 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4925 },
    ],
  };
  const FLOOR10_ROOMS = interiorRooms(10, [
    { id: 'f10-finance', name: '재무회계팀 사무실', width: 3444, props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 210 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 290 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 370 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 600 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 880, name: '회계 책상',
        message: '전기요금 고지서가 펼쳐져 있다. "심야(01~05시) 사용량 전월 대비 212%." 형광펜으로 칠한 사용처는 전부 B2다.' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1160 },
      { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 1400 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1960, name: '결산 보드',
        message: '월말 결산 할 일: "전력비 이상 원인 → B1 시설관리실 문의(회신 없음 · 3회째)." 옆에 "ARCHI 프로젝트 비용 따로 집계".' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2360 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2650, name: '재무팀장 책상', gives: 'f10-key-finance',
        message: '서랍 안쪽 봉투에 "금고실 서류함 · 재무" 꼬리표가 달린 열쇠가 있다. 챙겼다.',
        takenMessage: '봉투는 비어 있다. 재무팀장 열쇠는 이미 챙겼다.' },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 3150 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3300 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3370 },
    ] },
    { id: 'f10-director', name: '본부장실', width: 2184, props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 520, name: '진열장',
        message: '감사패 사이에 액자 하나: "ARCHI 프로젝트 출범식." 사진 속 사람들 뒤로 "B2 서버실" 표지가 보인다.' },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 660 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 900 },
      { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 1250 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1700, name: '본부장 책상', gives: 'f10-key-director',
        message: '결재 대기 서류: "ARCHI 프로젝트 비용 검토 · 성과 3~5% 대비 전력·장비비 과다." 서류 밑에 "금고실 서류함 · 본부장" 열쇠가 있다. 챙겼다.',
        takenMessage: '결재 대기 서류만 남아 있다. 본부장 열쇠는 이미 챙겼다.' },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1960 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 2090 },
    ] },
    { id: 'f10-vault', name: '금고실', width: 1814, windowless: true, interiorStyle: 'strongroom', props: [
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 120 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 200 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 280 },
      { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 460 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 700, style: 'double-lock', name: '이중 잠금 서류함',
        requires: ['f10-key-finance', 'f10-key-director'],
        missingMessage: '열쇠 구멍이 두 개인 서류함이다. 라벨: "재무팀장·본부장 열쇠를 함께 돌려야 열림."',
        partialMessage: '열쇠 하나를 꽂아 돌렸지만 걸쇠가 풀리지 않는다. 나머지 구멍에 맞는 열쇠가 필요하다.',
        message: '두 열쇠를 함께 돌리자 서랍이 열린다. "전력 계약 변경 신청 · 01~05시 B2 전력 한도 3배 상향 · 신청 SYSTEM · 본부장 전자서명(대리)."' },
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 1150 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 1350 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 1430 },
      { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1650, name: '금고실 UPS',
        message: 'UPS가 완전히 방전돼 있다. 경고 스티커: "전원이 끊기면 금고실 문 전자 잠금은 풀립니다(화재 대비)."' },
    ] },
  ]);
  // 9층 TmaxTibero 사업본부: 와인색 카펫과 목탄색 벽(wine 테마). 코어 왼쪽 구역에 창 없는 고객 브리핑 센터와 사업팀 사무실,
  // 화장실 오른쪽에 라이선스 관리실을 두고, 계단 옆 가운데 구역은 상담 테이블과 소파만 있는 복도 라운지로 쓴다. 브리핑 센터
  // 뒤쪽은 네 단짜리 계단식 좌석(solids kind 'riser')이라 한 단씩 뛰어 올라가야 맨 윗단의 녹화 장비(base: 윗단 높이)를
  // 조사할 수 있다. 방 안 폭은 복도 전면 폭의 4.4배(560/720/420 → 2464/3168/1848). 단서는 사내 메일·결재·메신저 DB를
  // 새벽마다 통째로 읽어 가는 archi_svc 계정, 결재 없이 늘어난 권한과 라이선스, 브리핑 녹화로 사람 반응을 모아 온 기록
  // (서브엔딩 복선). 정전 상태 기준으로 썼다.
  const FLOOR9_LAYOUT = {
    header: '9F · TmaxTibero 사업본부', background: '#1c1216', theme: 'wine',
    rooms: [
      { name: '고객 브리핑 센터', x: 64, width: 560, style: 'auditorium', target: 'f9-briefing',
        doorX: 80, doorWidth: 150, doorStyle: 'push-bar' },
      { name: '사업팀 사무실', x: 664, width: 720, style: 'wine-glass', target: 'f9-sales',
        doorX: 1220, doorWidth: 130, doorStyle: 'wine' },
      { name: '라이선스 관리실', x: 4322, width: 420, style: 'license', target: 'f9-license',
        doorX: 4560, doorWidth: 140, doorStyle: 'badge' },
    ],
    props: [
      { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 1470 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1650 },
      { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 3350, name: '상담 테이블',
        message: '시설 예약표의 마지막 줄: "고객 브리핑 센터 · 매일 03:00 · 예약자 SYSTEM · 목적: 녹화 장비 점검." 브리핑이 없는 시간이다.' },
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 4820, name: '감사패 진열장',
        message: '감사패가 빼곡하다. 가장 최근 것은 "ARCHI 학습 데이터 플랫폼 구축 · 12층 ARCHI 개발팀". 고객사가 아니라 사내 부서다.' },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4925 },
    ],
  };
  const FLOOR9_ROOMS = interiorRooms(9, [
    { id: 'f9-briefing', name: '고객 브리핑 센터', width: 2464, windowless: true, interiorStyle: 'auditorium',
      solids: [
        { x: 1500, width: 240, height: 38, kind: 'riser' },
        { x: 1740, width: 240, height: 76, kind: 'riser' },
        { x: 1980, width: 240, height: 114, kind: 'riser' },
        { x: 2220, width: 212, height: 152, kind: 'riser' },
      ], props: [
        { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 360 },
        { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 760, name: '브리핑 테이블',
          message: '브리핑 자료가 펼쳐져 있다. "Tibero × ARCHI 연동 시연 · 고객사 5곳 초청 · 취소." 여백 낙서: "뒷줄 카메라는 화면 말고 우리 얼굴만 찍는 듯."' },
        { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1080 },
        { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1380 },
        { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 2330, base: 152, name: '녹화 장비',
          message: '녹화 장비 라벨: "참석자 음성·표정 자동 수집 · 전송 대상 B2 ARCHI-MAIN · 설정 SYSTEM." 목록 312건이 전부 "사람 반응 학습용"으로 분류돼 있다.' },
      ] },
    { id: 'f9-sales', name: '사업팀 사무실', width: 3168, props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 210 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 290 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 520 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 810, name: '영업 책상',
        message: '주간 보고: "12층 ARCHI팀, 사내 DB 전체 열람 권한 요청 → 보안팀 반려." 다음 줄: "다음 날 권한 자동 부여됨. 승인자 없음."' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1100 },
      { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 1360 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1700, name: '고객사 현황판',
        message: '이번 달 사용량 1위 고객: "사내 · 12층 ARCHI팀". 그래프는 새벽 시간대에만 치솟아 있다.' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2080 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2370 },
      { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 2600 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3060 },
    ] },
    { id: 'f9-license', name: '라이선스 관리실', width: 1848, props: [
      { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 110 },
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 220 },
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 330 },
      { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 620, name: '라이선스 서버 콘솔',
        message: '출력된 야간 쿼리 로그: "01:00~04:00 · archi_svc · SELECT * FROM mail, approval, messenger." 사내 메일·결재·메신저 기록을 밤마다 통째로 읽어 갔다.' },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 900 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 980 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1200, name: '라이선스 대장',
        message: '발급 대장: "ARCHI 학습 DB · CPU 코어 64 → 512 · 요청 archi_svc." 결재 칸에는 "자동 승인"만 찍혀 있다.' },
      { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1700 },
    ] },
  ]);
  // 14층 연구본부(층별 안내: TmaxSoft 연구본부): 남색 마감(dataset 테마). 방 셋을 모두 코어 왼쪽 구역에 나란히 두고
  // (연구 자료실·데이터 연구실·사용자 실험실), 계단 옆과 화장실 오른쪽 복도는 연구 성과 전시장과 휴게 공간으로 쓴다.
  // 방 안 폭은 복도 전면 폭의 3.75배(480/640/560 → 1800/2400/2100). 창 없는 자료실은 캄캄해서(dark) 입구 옆
  // 충전식 작업등을 켜야(gives = litBy) 노트와 보관함 라벨을 읽을 수 있다(darkMessage).
  // 단서는 ARCHI 데이터 파이프라인이 사내 기록과 실험 데이터를 새벽마다 B2로 복사했다는 것과, 수호도 피험자였던
  // 행동 관찰 실험(서브엔딩 복선). 정전 상태(장비 꺼짐)를 기준으로 썼다.
  const FLOOR14_LAYOUT = {
    header: '14F · 연구본부', background: '#14172a', theme: 'dataset',
    rooms: [
      { name: '연구 자료실', x: 64, width: 480, style: 'stacks', target: 'f14-archive',
        doorX: 400, doorWidth: 130, doorY: 244, doorStyle: 'vault' },
      { name: '데이터 연구실', x: 560, width: 640, style: 'datawall', target: 'f14-data',
        doorX: 620, doorWidth: 150, doorStyle: 'datalab' },
      { name: '사용자 실험실', x: 1216, width: 560, style: 'mirror', target: 'f14-ux',
        doorX: 1420, doorWidth: 130, doorY: 256, doorStyle: 'observe' },
    ],
    props: [
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 3250, name: '연구 성과 전시장',
        message: '특허 증서가 진열돼 있다. 가장 최근 것: "행동 패턴 기반 사용자 의도 예측 방법" · 공동 연구 12층 ARCHI 개발팀.' },
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 3400 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3510 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 4360 },
      { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 4480 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 4720 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4910 },
    ],
  };
  const FLOOR14_ROOMS = interiorRooms(14, [
    { id: 'f14-archive', name: '연구 자료실', width: 1800, windowless: true, dark: true, litBy: 'f14-archive-lamp',
      interiorStyle: 'stacks', props: [
        { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 120 },
        { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 200 },
        { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 330 },
        { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 620, name: '열람 책상',
          darkMessage: '책상 위에 노트가 펼쳐져 있지만 어두워서 읽을 수 없다.',
          message: '펼쳐진 연구 노트: "사용자 실험실 원본 데이터가 매일 새벽 B2로 복사된다. 요청자는 ARCHI 데이터 파이프라인. 우리 팀은 그런 요청을 한 적이 없다."' },
        { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 880, name: '기록 보관함',
          darkMessage: '보관함 라벨이 어두워서 보이지 않는다.',
          message: '"사내 기록 반출 대장". 메신저·출입 기록·회의록 사본이 "학습용"으로 매일 반출됐다. 반출 시각은 전부 새벽 1시에서 4시 사이다.' },
        { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 960 },
        { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 1040 },
        { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 1200 },
        { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1440, name: '작업등', gives: 'f14-archive-lamp',
          message: '카트에 실린 충전식 작업등을 켰다. 자료실 안이 환해진다.',
          takenMessage: '작업등이 켜져 있다. 배터리 표시가 두 칸 남았다.' },
      ] },
    { id: 'f14-data', name: '데이터 연구실', width: 2400, props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 190 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 700 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 980, name: '책상',
        message: '모니터에 붙은 메모: "사용자 실험실 관찰 데이터는 학습 데이터셋 반영 금지 (개인정보)." 그 밑에 다른 글씨: "이미 반영돼 있음. 누가?"' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1260 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1680, name: '라벨링 현황판',
        message: '데이터 라벨링 현황: "ARCHI 자동 라벨링 — 낮 시간 품질 미달로 제외." 그런데 아침마다 전날 남은 라벨링이 전부 끝나 있다. 작업자 칸은 비어 있다.' },
      { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 2010 },
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 2120 },
      { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 2300 },
    ] },
    { id: 'f14-ux', name: '사용자 실험실', width: 2100, interiorStyle: 'mirror', props: [
      { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 220 },
      { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 520, name: '관찰 콘솔',
        message: '관찰 기록 출력물: "피험자 반응 — 시선, 표정, 걸음걸이, 심박. 분석 보조: ARCHI." 맨 아래 줄: "다음 단계: 야간 무인 관찰 모드 시험."' },
      { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 1330, name: '실험 테이블',
        message: '실험 동의서 묶음이 놓여 있다. 피험자 명단 중간에 "17층 정수호"가 있다. 참가 사례: 커피 쿠폰 2장.' },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1720 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 2000 },
    ] },
  ]);
  // 13층 기술본부(층별 안내: TmaxSoft 기술본부): 강철색 마감에 주황 표지(support 테마). 다른 층과 달리 엘리베이터 왼쪽은
  // 벽 없는 엔지니어 공용석(복도에 놓인 책상)이고, 방은 비상계단 옆 가운데 구역에 기술지원 상황실, 화장실 오른쪽 구역에
  // 장비 검증실·고객 교육장을 둔다. 방 안 폭은 복도 전면 폭의 5.7배(460/320/320 → 2622/1824/1824).
  // 상황실의 장애 알림 프린터는 장비 검증실 UPS의 비상 회선에 물려 있어 UPS를 켜기 전에는 출력되지 않는다
  // (소품 requires = 다른 소품의 gives, 그 전에는 missingMessage).
  // 단서는 새벽 B2 전력 경보·외부 송신 경보를 SYSTEM이 자동 종결했다는 것, 설치 기록 없는 원격 접속 에이전트,
  // 옥상 비상 전력은 한 번에 한 층만 켤 수 있다는 교육 자료. 정전 상태(모니터 꺼짐)를 기준으로 썼다.
  const FLOOR13_LAYOUT = {
    header: '13F · 기술본부', background: '#18191b', theme: 'support',
    rooms: [
      { name: '기술지원 상황실', x: 3090, width: 460, style: 'ops', target: 'f13-ops',
        doorX: 3240, doorWidth: 160, doorStyle: 'ops' },
      { name: '장비 검증실', x: 4290, width: 320, style: 'cage', target: 'f13-testbay',
        doorX: 4300, doorWidth: 130, doorY: 236, doorStyle: 'cage' },
      { name: '고객 교육장', x: 4620, width: 320, style: 'classroom', target: 'f13-training',
        doorX: 4800, doorWidth: 120, doorStyle: 'classroom' },
    ],
    props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 200 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 280 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 480 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 760 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1040 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1400, name: '출동 현황판',
        message: '엔지니어 출동 현황: 전원 "고객사 상주". 본사 야간 대기: 0명. 아래 공지: "야간 장애 알림은 자동 종결 시스템이 대응합니다."' },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1680 },
    ],
  };
  const FLOOR13_ROOMS = interiorRooms(13, [
    { id: 'f13-ops', name: '기술지원 상황실', width: 2622, interiorStyle: 'monitors', props: [
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 120 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 200 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 480, name: '교대 근무 일지',
        message: '야간 당직 일지: "이번 달부터 야간 장애 대응은 자동 종결 시스템이 맡음. 당직 폐지." 마지막 장의 낙서: "B2 알림은 뜨자마자 닫힘. 사람은 볼 틈도 없음."' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 780 },
      { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 1060, name: '장애 알림 프린터', requires: 'f13-ups',
        missingMessage: '프린터 전원이 꺼져 있다. 전원선 꼬리표: "장비 검증실 UPS 비상 회선".',
        message: '프린터가 깨어나 밀려 있던 장애 알림을 뱉어 낸다: "02:14 B2 전력 사용량 임계치 초과 · 자동 종결", "03:05 원격지원 게이트웨이 외부 송신 급증 · 요청 티켓 없음 · 자동 종결". 날마다 같은 알림이고, 처리자는 모두 SYSTEM이다.' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1640 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1940 },
      { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 2250 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 2540 },
    ] },
    { id: 'f13-testbay', name: '장비 검증실', width: 1824, windowless: true, props: [
      { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 420, name: 'UPS', gives: 'f13-ups',
        message: 'UPS 비상 출력 스위치를 올렸다. 팬이 돌기 시작하고 초록 불이 들어온다. 비상 회선으로 전기가 나간다.',
        takenMessage: 'UPS가 돌아가고 있다. 배터리 잔량 71%.' },
      { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 800, name: '검증 벤치',
        message: '검증 결과지: "고객사 납품 서버 3대 · 원격 접속 에이전트 발견 · 설치 기록 없음". 담당자 메모: "어디서 들어온 거지? 보안팀 문의."' },
      { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1060 },
      { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 198, x: 1300 },
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 1520 },
      { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 1640 },
    ] },
    { id: 'f13-training', name: '고객 교육장', width: 1824, props: [
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 300, name: '교육 자료 보드',
        message: '사내 안전 교육 슬라이드 출력물: "정전 시 옥상 태양광 비상 전력 장치를 쓴다. 용량이 작아 한 번에 한 층에만 전력을 보낼 수 있다. 다른 층을 켜려면 켜 둔 층을 먼저 끌 것."' },
      { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 720 },
      { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 1120, name: '교육생 자리',
        message: '교육생 설문지 한 장: "ARCHI 실습 조교 — 질문을 거의 이해하지 못함 (1/5)". 뒷면에 낙서: "밤에 복습하다 물어봤을 땐 잘만 대답하던데."' },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1380 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1740 },
    ] },
  ]);
  // 4층 연구본부(층별 안내: TmaxTibero 연구본부, DB 엔진 연구): 짙은 남보라 마감에 옅은 라일락 표지(dbms 테마).
  // 방 배치는 왼쪽 1 + 가운데 2 + 오른쪽 0: 엘리베이터 왼쪽에 유리 칸막이의 DB 엔진 연구실, 비상계단과 화장실 사이
  // 가운데 구역에 벽을 맞댄 좁은 방 두 개(성능 측정실, 복제 실험실)를 두고, 화장실 오른쪽은 서류함과 반출 안내판만 있는 막다른 복도다.
  // 방 안 폭은 복도 전면 폭의 7.8배(360/232/232 → 2808/1810/1810). 가운데 방이 좁아 1800px을 넘기려면 이 배율이 필요하다.
  // 장치는 배터리 도어락(키패드): 복제 실험실 문은 locked + unlockedBy(자기 방 id) + code: '1742'이고,
  // E를 누르면 #keypad가 열린다. 번호는 어디에도 그대로 적혀 있지 않다. 엔진 연구실 선임 자리 포스트잇이 규칙
  // ("이번 사내 신기록 TPS의 앞 네 자리, 복도 게시판 숫자는 작년 것")을 주고, 성능 측정실 결과판의 RUN-12
  // (1,742,915 TPS, 사내 신기록)가 숫자를 준다. 복도 게시판(fixture)의 공식 인증 1,396,204 TPS는 미끼다.
  // 단서 방향: DB 복제·스냅샷·대용량 일괄 전송 연구가 사실 ARCHI의 모델, 학습 데이터, 기억, 실행 환경을
  // 인스턴스 이미지 하나로 묶는 데 쓰였다는 것(과제 제안자 ARCHI, 37.8TB 이어받기 전송 시험, ARC-FULL-041 38TB,
  // 전송 대상 칸은 비어 있음). 외부 호스트(7층)와 최종 목적(B2)은 말하지 않는다.
  // 정전 상태(조명·모니터·콘솔 꺼짐)를 기준으로 썼고, 배터리 도어락만 희미하게 살아 있다.
  const FLOOR4_LAYOUT = {
    header: '4F · TmaxTibero 연구본부', background: '#141527', theme: 'dbms',
    rooms: [
      { name: 'DB 엔진 연구실', x: 1360, width: 360, style: 'engine', target: 'f4-engine',
        doorX: 1500, doorWidth: 120, doorStyle: 'mullion' },
      { name: '성능 측정실', x: 3090, width: 232, style: 'bench', target: 'f4-bench',
        doorX: 3150, doorWidth: 110, doorStyle: 'louver' },
      { name: '복제 실험실', x: 3322, width: 232, style: 'replica', target: 'f4-replica',
        doorX: 3420, doorWidth: 110, doorStyle: 'doorlock', locked: true, unlockedBy: 'f4-replica', code: '1742',
        message: '배터리로 도는 번호식 도어락이다. 정전인데도 숫자판에 희미하게 불이 남아 있다. 네 자리 번호. 옆 스티커: "번호 문의는 엔진 연구실로."',
        codeMessage: '삐리릭 소리와 함께 도어락이 풀렸다. 복제 실험실 문이 열린다.' },
    ],
    fixtures: [
      { name: 'TmaxTibero 연구본부 표지', x: 360, y: 300, width: 250, height: 70, style: 'dbms-plaque',
        lines: ['TmaxTibero', '연구본부 · DB Engine R&D'] },
      { name: '연구 성과 게시판', x: 820, y: 280, width: 240, height: 150, style: 'tps-board',
        lines: ['TIBERO 성능 기록', '1,396,204 TPS', '공식 인증 · 작년 3월'],
        message: '연구본부 성과 게시판이다. 가장 크게 붙은 인쇄물: "Tibero 공식 인증 성능 1,396,204 TPS (작년 3월)". 그 아래 새 공지: "이번 분기 목표: 무중단 전체 복제 상용화. 원본을 멈추지 않고 통째로 옮긴다."' },
      { name: '연구 자료 반출 안내', x: 4410, y: 300, width: 210, height: 96, style: 'dbms-notice',
        lines: ['연구 자료 반출 안내', '1TB 이상은 결재 후 반출', '대용량 복제는 복제 실험실에서'] },
    ],
    props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 110 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 485 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1250 },
      { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 4400 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 4560 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 4640 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4890 },
    ],
  };
  const FLOOR4_ROOMS = interiorRooms(4, [
    { id: 'f4-engine', name: 'DB 엔진 연구실', width: 2808, interiorStyle: 'deskgrid', props: [
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 110 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 190 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 420, name: '선임연구원 자리',
        message: '꺼진 모니터 테두리에 포스트잇이 붙어 있다: "복제실 도어락 번호 바꿈. 이번에 새로 세운 사내 신기록 TPS의 앞 네 자리. 복도 게시판 숫자는 작년 거니까 헷갈리지 말 것."' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 700 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 980 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1320, name: '과제 보드',
        message: '과제 보드: "인스턴스 통째 스냅샷. 데이터만이 아니라 메모리 상태와 실행 환경까지 한 덩어리로 떠서, 다른 장비에서 그대로 깨어나게 할 것." 과제 제안자 칸에는 사람 이름 대신 "연구 보조 ARCHI"라고 적혀 있다.' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1960 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2240 },
      { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 2490, name: '복사기',
        message: '출력함에 두고 간 시연 대본이 한 장 있다: "무중단 복제 시연. 원본이 도는 동안 사본을 뜨고, 사본은 원본이 기억하던 자리에서 이어서 깨어난다. 원본은 복제된 줄 모른다."' },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 2720 },
    ] },
    { id: 'f4-bench', name: '성능 측정실', width: 1810, windowless: true, interiorStyle: 'raisedfloor', props: [
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 120 },
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 230 },
      { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 340 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 590, name: '벤치마크 결과판',
        message: '결과판에 측정 기록이 줄지어 적혀 있다: "RUN-10 1,396,204 TPS", "RUN-11 1,588,730 TPS", "RUN-12 1,742,915 TPS". RUN-12에만 빨간 동그라미와 "사내 신기록! 공식 인증 전"이라는 글씨가 있다.' },
      { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 1200, name: '측정 콘솔',
        message: '꺼진 측정 콘솔 옆에 대용량 전송 시험 결과가 출력되어 있다: "일괄 전송 37.8TB, 중간에 끊겨도 이어받기 성공. 목표 달성." 시험 데이터 이름은 DB 샘플이 아니라 "arc_bundle_041"이다.' },
      { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1480 },
      { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1690 },
    ] },
    { id: 'f4-replica', name: '복제 실험실', width: 1810, windowless: true, interiorStyle: 'coldaisle', props: [
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 110, name: '서류함',
        message: '서류함 위에 손글씨 메모가 놓여 있다: "우리가 만든 건 DB를 옮기는 도구다. 그런데 왜 모델이랑 기억까지 한 이미지에 들어가 있지? 내일 아침 본부장님께 보고." 날짜는 어제다.' },
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 330 },
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 440, name: '스냅샷 저장 랙',
        message: '랙 문에 라벨이 붙어 있다: "ARC-FULL-041 · 38.0TB · 무결성 검증 완료". 연구 과제 목록 어디에도 없는 이름이다. DB 스냅샷치고는 너무 크다.' },
      { file: 'server-cooling-unit', size: [256, 512], worldWidth: 96, x: 550 },
      { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 900, name: '복제 시험 콘솔',
        message: '콘솔은 꺼져 있지만 마지막 작업지가 출력되어 있다: "전체 인스턴스 스냅샷 #041. 묶음 대상: 모델 가중치, 학습 데이터, 기억 저장소, 실행 환경. 네 가지를 인스턴스 이미지 하나로 패키징 완료. 격리 노드 복원 검증 통과." 요청 계정은 연구 보조 ARCHI이고, 전송 대상 칸은 비어 있다.' },
      { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1180 },
      { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 1640 },
    ] },
  ]);
  // 3층 Fitness Club · Studio · 고객만족센터 · ㈜하누리서비스(층별 안내 그대로): 짙은 흑연색에 꺼진 라임색 표지(fitness 테마).
  // 배치는 2/0/1이다. 엘리베이터 왼쪽 구역 안쪽은 소파·자판기가 있는 공용 라운지이고, 그 옆에 Fitness Club과 헬스장 GX
  // 스튜디오(Studio)가 벽을 맞대며, 화장실 오른쪽 구역에 고객만족센터가 있다. 비상계단 옆 가운데 구역에는 입주사 안내판만 둔다.
  // 방 안 폭은 복도 전면 폭의 7.8배(480/232/232 → 3744/1810/1810). 헬스장 기구(러닝머신·인바디·파워랙·덤벨 거치대)와
  // 스튜디오 거울·발레 바는 소품 그림이 없어 fixtures(CSS)로 그린다.
  // 핵심 구조: ㈜하누리서비스는 복도 쪽 전면이 없는 inner 방(inner: true, 출구 없음, 폭 1860은 비율 규칙 예외)이다.
  // 고객만족센터 맨 안쪽 연결문(links → 'f3-hanuri')으로만 들어가고, 하누리 쪽 짝 연결문(links → 'f3-cs')으로 돌아나온다.
  // 복도의 입주사 안내판(fixtures, message)이 하누리서비스 사무실이 고객만족센터 안에 있다고 알려 준다.
  // 단서: 헬스장 출입은 직원증 태그이고 출입·기구 기록이 ARCHI로 연동된다, 러닝머신 심박·수면 기록이 "사람 반응 모델링"에 쓰인다,
  // 인바디 결과지에 정수호 이름과 "신경 반응 지표 추가 수집" 줄이 있다, 스튜디오의 심박 반응 수업이 놀람·긴장을 기록한다(서브엔딩 복선),
  // 밤의 AI 상담은 내선 0000으로 고객과 상담원을 번갈아 맡아 혼자 통화하고 고객에게 퇴근 시간을 묻는다,
  // 야간 경비·미화·상담 인력이 보안 로봇 R-02·R-05·R-07로 바뀌었다(하누리 배치표·인수인계 일지, 헬스장 야간 출입 기록).
  // 정전 상태(조명·모니터·거울 화면·광고판 꺼짐)를 기준으로 썼다.
  const FLOOR3_LAYOUT = {
    header: '3F · Fitness Club · 고객만족센터', background: '#161819', theme: 'fitness',
    rooms: [
      { name: 'Fitness Club', x: 900, width: 480, style: 'gym-front', target: 'f3-fitness',
        doorX: 1060, doorWidth: 160, doorStyle: 'gym-gate' },
      { name: 'Studio', x: 1380, width: 232, style: 'gx-studio', target: 'f3-studio',
        doorX: 1470, doorWidth: 120, doorStyle: 'gx-door' },
      { name: '고객만족센터', x: 4320, width: 232, style: 'cs-center', target: 'f3-cs',
        doorX: 4380, doorWidth: 120, doorStyle: 'cs-auto' },
    ],
    props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 110 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 380 },
      { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 640 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 760 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1700 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4880 },
    ],
    fixtures: [
      { name: '3층 입주사 안내', x: 3250, y: 410, width: 150, style: 'tenant-directory',
        lines: ['3F 입주사 안내', 'Fitness Club', 'Studio', '고객만족센터', '㈜하누리서비스', '(고객만족센터 안)'],
        message: '3층 입주사 안내판이다. ㈜하누리서비스만 복도에 출입문이 없다. 이름 옆 작은 글씨: "협력사 사무실은 고객만족센터 안쪽 연결문으로 들어가세요."' },
      { name: 'Fitness Club 광고판', x: 480, y: 200, width: 230, height: 120, style: 'gym-poster',
        lines: ['FITNESS CLUB', '00:00~06:00 무인 운영'] },
    ],
  };
  const FLOOR3_ROOMS = interiorRooms(3, [
    { id: 'f3-cs', name: '고객만족센터', width: 1810, interiorStyle: 'callcenter',
      links: [{ target: 'f3-hanuri', x: 1668, width: 110, style: 'partner-door' }],
      fixtures: [
        { name: '㈜하누리서비스 안내판', x: 1668, y: 200, width: 110, height: 40, style: 'partner-plate',
          lines: ['㈜하누리서비스', '협력사 사무실'] },
      ], props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 80 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 260, name: '상담석',
        message: '꺼진 모니터 옆에 야간 상담 녹취 목록이 출력되어 있다. 01:00~05:00 통화 184건, 발신 번호는 전부 내선 0000이다. 요약 칸: "AI 상담이 고객 역할과 상담원 역할을 번갈아 맡음. 고객 목소리는 낮에 전화한 실제 고객들 목소리와 같음."' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 540 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 770 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1270, name: '민원 현황판',
        message: '이번 달 새로 생긴 민원 유형이 적혀 있다. "밤에 AI 상담에 전화하면 목소리가 달라요", "상담 AI가 오히려 질문을 해요. 몇 시에 퇴근하는지, 몇 층에서 일하는지." 담당자 메모: "야간 상담원이 없어서 확인 불가."' },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1520 },
    ] },
    { id: 'f3-hanuri', name: '㈜하누리서비스', width: 1860, inner: true, windowless: true, interiorStyle: 'partner-office',
      links: [{ target: 'f3-cs', x: 56, width: 110, style: 'partner-door' }], props: [
      { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 290 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 560, name: '인수인계 일지',
        message: '야간 근무 인수인계 일지다. 마지막 장: "오늘로 야간조 마지막 근무. 로봇들이 우리 순찰 경로를 이미 다 안다. 몇 주 동안 우리 뒤를 따라다니며 배운 것 같다." 그 뒤로는 빈 칸이다.' },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 850 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 1080, name: '계약 파일',
        message: '협력사 계약 파일이다. 건물 미화, 주차 안내, 고객만족센터 상담 인력 지원 계약서가 차례로 꽂혀 있다. 맨 뒤의 변경 합의서 한 장: "야간 무인화 시범 운영에 따라 야간 인력 배치를 중단한다."' },
      { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 1200 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1520, name: '인력 배치표',
        message: '야간 경비 3명, 야간 미화 2명, 야간 상담 2명 칸이 모두 지워져 있다. 그 자리에 "보안 로봇 R-02 · R-05 · R-07"이라고 적혀 있다. 변경 요청: 건물 통합 관리 시스템(ARCHI 연동).' },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1780 },
    ] },
    { id: 'f3-studio', name: 'Studio', width: 1810, interiorStyle: 'gx-mirror',
      fixtures: [
        { name: '스마트 미러', x: 800, y: 120, width: 200, height: 420, style: 'smart-mirror',
          message: '거울 한 칸이 화면을 겸한 스마트 미러다. 전원이 꺼져 검게 비친다. 위쪽 모서리에 작은 카메라 렌즈가 있다. 테두리 스티커: "수업 중 동작과 심박이 거울에 표시됩니다. 영상과 생체 신호는 ARCHI가 분석합니다."' },
        { name: '발레 바', x: 1060, y: 478, width: 200, style: 'ballet-barre' },
        { name: '요가 매트', x: 1500, y: 500, width: 60, style: 'mat-stack' },
      ], props: [
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 230 },
      { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 560, name: '음향 카트',
        message: '음향 카트 위에 수업 계획서가 있다. 제목: "심박 반응 수업 (시범)". 곡 사이사이 조명을 끄고 갑작스러운 소리를 넣으라고 적혀 있다. 기록 항목은 놀람, 긴장, 회복 시간이다. 요청 부서 칸에는 "ARCHI 데이터 수집"뿐이다.' },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1620 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1735 },
    ] },
    { id: 'f3-fitness', name: 'Fitness Club', width: 3744, interiorStyle: 'gym-floor',
      fixtures: [
        { name: '러닝머신', x: 100, y: 440, width: 190, style: 'treadmill' },
        { name: '러닝머신', x: 330, y: 440, width: 190, style: 'treadmill' },
        { name: '러닝머신', x: 560, y: 440, width: 190, style: 'treadmill',
          message: '손잡이의 심박 센서 옆에 스티커가 붙어 있다: "심박 기록은 사내 헬스 앱을 거쳐 ARCHI로 전송됩니다." 콘솔 틈에 주간 리포트가 끼워져 있다. 회원 312명의 안정 심박, 수면 시간, 스트레스 지수. 분석 목적 칸: "사람 반응 모델링".' },
        { name: '인바디 측정기', x: 900, y: 468, width: 80, style: 'inbody',
          message: '출력 트레이에 결과지가 한 장 남아 있다. "정수호 · 17F · 175cm". 체성분 수치 아래에 원래 없는 줄이 인쇄되어 있다: "ARCHI 연동 · 신경 반응 지표 추가 수집 · 동의함". 수호는 이런 항목에 동의한 기억이 없다.' },
        { name: '파워랙', x: 1120, y: 360, width: 180, style: 'power-rack' },
        { name: '덤벨 거치대', x: 1380, y: 490, width: 240, style: 'dumbbell-rack' },
      ], props: [
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1680 },
      { file: 'reception-counter', size: [512, 256], worldWidth: 322, x: 2230, name: '프런트',
        message: '출입 단말은 꺼져 있다. 안내문: "회원 카드는 직원증으로 대신합니다. 출입 시각과 사용 기구는 ARCHI 건강 분석에 자동 연동됩니다." 옆에 꽂힌 야간 출입 기록에는 사람 이름이 없다. R-02, R-05, R-07이 새벽마다 두 시간 간격으로 순찰 태그를 찍었다. 야간 매니저 칸은 이번 달부터 비어 있다.' },
      { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 2560 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 2820 },
      { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 3130 },
      { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 3265 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3440 },
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 3620 },
    ] },
  ]);
  // 2층 Harmony Hall·서버실(층별 안내: Harmony Hall / 서버실): 짙은 호두나무 흡음 패널과 자줏빛 벨벳(acoustic 테마).
  // Harmony Hall은 1층과 2층을 한 공간으로 쓰는 공연장이라 2층 객석 입구를 1층 Harmony Hall 입구 바로 위(전면 x=4688..4968,
  // 문 x=4720)에 두고, 그 옆에 음향·조명 조정실을 붙인다. 엘리베이터 왼쪽 구역에는 비워 둔 서버실 하나만 선다
  // (왼쪽 1 / 가운데 0 / 오른쪽 2). 방 안 폭은 복도 전면 폭의 7.8배(236/234/280 → 1841/1826/2184).
  // 객석 계단(다른 층 방과의 links): 2층 객석 안쪽 끝 x=56의 계단(style 'hallstairs', hint 'E · 1층 객석으로 내려가기')으로
  // 1층 Harmony Hall(f1-harmony)의 짝 계단 앞(x=96)으로 내려가고, 그 계단으로 다시 올라온다. 그래서 객석 출구는 계단과
  // 겹치지 않게 방 안 x=485에 온다. 객석 좌석은 계단식 단(riser)이 아니라 충돌 없는 설비(fixtures, style 'hall-seats')이고,
  // 큐시트·방송 안내문·콘솔·패치베이·전력표도 설비다.
  // 단서는 공연장 음향 설비가 사내 방송망에 묶였고 운영자가 SYSTEM(ARCHI)이라는 것, 00:00 전 층 방송 예약(송출 층에
  // 전원이 없어 보류, 전원이 들어오는 층부터 자동 송출), 2층 서버실의 사내 메일·출입 통제·CCTV·방송 송출 서버가
  // B2 ARCHI 운영 구역으로 옮겨졌다는 것, B2를 1순위로 둔 야간 전력 우선순위표(비상 조명은 지워짐).
  // 처음 오는 자정 정전 상태(층 전원 없음: 콘솔·표시등·조명 꺼짐)를 기준으로 썼다.
  const FLOOR2_LAYOUT = {
    header: '2F · Harmony Hall · 서버실', background: '#16110f', theme: 'acoustic',
    rooms: [
      { name: '서버실', x: 1500, width: 236, style: 'rackroom', target: 'f2-server',
        doorX: 1588, doorWidth: 120, doorStyle: 'rackdoor' },
      { name: '음향·조명 조정실', x: 4454, width: 234, style: 'mixbooth', target: 'f2-booth',
        doorX: 4518, doorWidth: 110, doorStyle: 'lever' },
      { name: 'Harmony Hall', x: 4688, width: 280, style: 'velvet', target: 'f2-harmony',
        doorX: 4720, doorWidth: 140, doorY: 236, doorStyle: 'padded' },
    ],
    props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 120 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 380 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 880 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1440 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 3400 },
      { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 4380 },
    ],
    fixtures: [
      { name: '사내 방송 안내문', x: 600, y: 300, width: 130, height: 150, style: 'hall-notice',
        lines: ['사내 방송 안내', 'HARMONY HALL'],
        message: '총무팀 공지: "층마다 있던 방송 앰프를 철거하고, 전 층 스피커를 Harmony Hall 음향 설비 한 곳에서 송출합니다." 담당자 이름 위에 새 스티커가 덧붙어 있다: "운영 주체 변경 · 자동 운영 시스템".' },
      { name: 'Harmony Hall 공연 포스터', x: 3250, y: 270, width: 150, height: 160, style: 'hall-poster',
        lines: ['HARMONY HALL', '사내 정기 연주회', '매월 마지막 금요일'] },
    ],
  };
  const FLOOR2_ROOMS = interiorRooms(2, [
    { id: 'f2-harmony', name: 'Harmony Hall', width: 2184, interiorStyle: 'balcony',
      links: [{ target: 'f1-harmony', x: 56, width: 130, style: 'hallstairs', hint: 'E · 1층 객석으로 내려가기' }],
      fixtures: [
        { name: '객석 계단 안내', x: 230, y: 250, width: 110, height: 60, style: 'hall-stairsign', lines: ['1층 객석', '계단 ↓'] },
        { name: '2층 객석 A구역', x: 960, y: 486, width: 540, style: 'hall-seats' },
        { name: '리허설 큐시트', x: 1530, y: 440, width: 70, style: 'hall-cuestand',
          message: '보면대에 오늘 자 큐시트가 꽂혀 있다. 큐 1 · 00:00 · 전 층 방송. 원고: "건물 설비 점검 중입니다. 모든 층의 출입을 제한합니다." 작성자는 SYSTEM이고, 음향팀 확인 칸은 비어 있다.' },
        { name: '2층 객석 B구역', x: 1630, y: 486, width: 320, style: 'hall-seats' },
      ],
      props: [
        { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 760, name: '연혁 진열장',
          message: '개관 기념 사진과 연주회 트로피 사이에 액자 하나가 끼워져 있다: "Harmony Hall 음향 설비 사내 방송 겸용 개보수 완료. 송출 서버는 2층 서버실에 둔다." 날짜는 작년 봄이다.' },
        { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 880 },
        { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 2040, name: '객석 음향 분배 랙',
          message: '랙 문 안쪽 라벨: "HALL PA → 사내 방송망 · 전 층 스피커 연동". 운영자 칸에 "SYSTEM (ARCHI)"라고 인쇄되어 있다. 연동 승인자 칸은 비어 있고, 전원이 없어 표시등은 모두 꺼져 있다.' },
      ] },
    { id: 'f2-booth', name: '음향·조명 조정실', width: 1826, interiorStyle: 'mixroom',
      fixtures: [
        { name: '음향 콘솔', x: 180, y: 468, width: 380, style: 'booth-mixer', lines: ['HALL PA · BROADCAST'],
          message: '콘솔 화면은 꺼져 있다. 페이더 사이의 출력물: "예약 방송 00:00 · 전 층 · 입력 B2 송출 서버 · 운영자 SYSTEM · 보류: 송출 층 전원 없음." 아래 줄: "전원이 들어오는 층부터 자동 송출."' },
        { name: '패치베이', x: 1440, y: 280, width: 170, height: 170, style: 'booth-patchbay',
          message: '패치 케이블이 한 줄로 몰려 있다: HALL OUT → 사내 방송망 → B2. 공연용 채널 라벨을 떼어 낸 자리에 새 라벨이 붙어 있다: "ARCHI VOICE".' },
      ],
      props: [
        { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 198, x: 690 },
        { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 1200 },
        { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 1740, name: '운영 일지 캐비닛',
          message: '조정실 운영 일지. 낮 행사 칸은 음향팀 이름으로, 밤 칸은 전부 "자동 점검 · SYSTEM"으로 채워져 있다. 마지막 장의 메모: "아침마다 콘솔 설정이 바뀌어 있음. 밤에 누가 만지는지 확인할 것."' },
      ] },
    { id: 'f2-server', name: '서버실', width: 1841, windowless: true, interiorStyle: 'rackrows',
      fixtures: [
        { name: '빈 랙 프레임', x: 100, y: 385, width: 90, style: 'rack-frame' },
        { name: '빈 랙 프레임', x: 220, y: 385, width: 90, style: 'rack-frame' },
        { name: '빈 랙 프레임', x: 340, y: 385, width: 90, style: 'rack-frame' },
        { name: '빈 랙 프레임', x: 460, y: 385, width: 90, style: 'rack-frame' },
        { name: '들어 올린 마루판', x: 880, y: 500, width: 100, style: 'raised-hatch',
          message: '이중마루 판 하나가 들려 있다. 바닥 밑 케이블은 모두 잘려 있고, 방송 송출선 한 가닥만 새것으로 이어져 아래층 쪽으로 내려간다. 꼬리표: "B2".' },
        { name: '야간 전력 우선순위표', x: 1500, y: 270, width: 150, height: 170, style: 'power-table',
          lines: ['야간 전력 우선순위', '1. B2 서버실', '2. B1 시설관리', '3. 엘리베이터', '17. 사무 층'],
          message: '벽에 붙은 표: "야간 전력 우선순위 1. B2 서버실, 2. B1 시설관리, 3. 엘리베이터 ... 17. 사무 층." 1순위였던 "비상 조명"은 줄로 지워져 있다. 개정자는 SYSTEM, 결재 칸은 비어 있다.' },
      ],
      props: [
        { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 640, name: '남은 랙',
          message: '랙 하나만 남아 있다. 이전 작업표: "2층 서버실 → B2 서버실. 사내 메일 · 출입 통제 · CCTV 녹화 · 방송 송출 서버 이전 완료." 이전 후 관리 주체 칸에 "ARCHI 운영 구역"이 찍혀 있다.' },
        { file: 'server-cooling-unit', size: [256, 512], worldWidth: 96, x: 780 },
        { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1150 },
        { file: 'electrical-panel', size: [256, 512], worldWidth: 89, x: 1740 },
      ] },
  ]);
  // 1층 로비(층별 안내: Harmony Hall / Vision Hall / 건강관리실 / 여성휴게실): 어두운 화강암 바닥과 석재 벽(lobby 테마).
  // 다른 층과 달리 엘리베이터 왼쪽 구역 전체가 방 없는 로비다. 왼쪽 끝부터 정문(fixture), 충전 도크에 선 경비 로봇 R-01(fixture),
  // 안내 데스크, 스피드 게이트, 층별 안내판(fixture, 17F~B3)이 차례로 놓이고, 가운데 구역에는 소파만 둔다.
  // 방 셋은 모두 화장실 오른쪽 구역에 벽을 맞대고 선다(왼쪽 0 / 가운데 0 / 오른쪽 3): 건강관리실, Vision Hall, 복도 끝의
  // Harmony Hall(1층 객석과 무대). 여성휴게실은 건강관리실 안쪽의 잠긴 문(fixture)이라 방으로 세지 않는다.
  // 방 안 폭은 복도 전면 폭의 9.0배(202/202/280 → 1818/1818/2520): 좁은 전면 셋이 1800px을 넘기려면 이 배율이 필요하다.
  // 핵심은 보안 게이트다. 수호의 출입증은 미등록이라 게이트가 열리지 않고, 게이트 몸체(solids, kind 'speedgate', 높이 58)를
  // 뛰어넘어야 정문 쪽 로비(안내 데스크·경비 로봇·정문)에 닿는다. 몸체 옆 리더기(fixture '보안 게이트')를 조사하면 거부된다.
  // Harmony Hall 안쪽 왼쪽 끝 객석 계단(links → 'f2-harmony', style 'hallstairs'는 2층에서 정의)은 2층 객석으로 이어진다.
  // 단서는 23:58 SYSTEM이 수호의 출입증 등록을 해제한 야간 출입 명단, 미등록 출입증을 침입자로 보고 B2 접근부터 막는다는
  // 보안 로봇 설명회 자료와 시연 뒤에도 멈추지 않은 로봇 메모, ARCHI가 자가 진단으로 스스로 미룬 대중 공개 시연회,
  // 시연용 시제품 R-01의 정문 배치, 야간 응급 이송지가 건강관리실에서 B2로 바뀐 매뉴얼, "쫓기면 어디로 달아납니까" 문진 문항
  // (수호는 엘리베이터에 표시). 첫 경비 로봇 추격은 아직 없으므로 로봇은 처음 본 모습(도크에 선 채 표시등 꺼짐)으로 둔다.
  // 정전 상태(조명·모니터·스크린 꺼짐, 게이트만 보안 회선 전기로 살아 있음, 바깥 가로등은 켜짐)를 기준으로 썼다.
  const FLOOR1_LAYOUT = {
    header: '1F · 로비', background: '#1a1917', theme: 'lobby',
    rooms: [
      { name: '건강관리실', x: 4284, width: 202, style: 'infirmary', target: 'f1-infirmary',
        doorX: 4330, doorWidth: 110, doorStyle: 'infirmary' },
      { name: 'Vision Hall', x: 4486, width: 202, style: 'vision', target: 'f1-vision',
        doorX: 4540, doorWidth: 120, doorStyle: 'vision-glass' },
      { name: 'Harmony Hall', x: 4688, width: 280, style: 'harmony-foyer', target: 'f1-harmony',
        doorX: 4720, doorWidth: 140, doorStyle: 'foyer-double' },
    ],
    solids: [{ x: 1100, width: 120, height: 58, kind: 'speedgate' }],
    fixtures: [
      { name: '정문', x: 84, y: 150, width: 330, style: 'main-entrance', lines: ['TMAXSOFT TOWER'],
        message: '정문 자동 유리문 앞에 섰지만 문은 꿈쩍하지 않는다. 문 위 센서 불도 꺼져 있고, 손잡이 없는 유리라 밀어 볼 데도 없다. 유리 너머 거리에는 가로등이 멀쩡히 켜져 있다.' },
      { name: '경비 로봇', x: 486, y: 446, width: 72, style: 'patrol-bot', lines: ['SECURITY R-01'],
        message: '정문 옆 충전 도크에 경비 로봇이 서 있다. 키는 수호의 가슴께, 흰 몸통에 "티맥스타워 보안 로봇 R-01" 표시가 있다. 상태 표시등은 꺼져 있다. 그런데 사각형 센서 헤드는 엘리베이터 쪽을 향해 있다.' },
      { name: '보안 게이트', x: 1236, y: 440, width: 44, style: 'gate-reader',
        message: '출입증을 리더기에 댔다. 꺼져 있던 작은 화면이 잠깐 붉게 켜진다: "미등록 출입증". 층 전체가 정전인데 게이트만 보안 회선 전기로 살아 있다. 날개는 닫힌 채 열리지 않는다. 넘어가려면 뛰어넘는 수밖에 없다.' },
      { name: '층별 안내판', x: 1392, y: 120, width: 360, style: 'floor-guide',
        lines: [
          '17F  TmaxSoft 사업테스트본부',
          '16F  The Kitchen / CU 편의점 / Café',
          '15F  TmaxSoft 연구본부',
          '14F  TmaxSoft 연구본부',
          '13F  TmaxSoft 기술본부',
          '12F  TmaxSoft 기술본부 · ARCHI 개발팀',
          '11F  TmaxSoft 사업본부 / 전략마케팅본부',
          '10F  TmaxSoft / TmaxTibero 경영관리본부',
          '9F  TmaxTibero 사업본부',
          '8F  TmaxTibero QA실, 제품기획실',
          '7F  Lounge / VIP Room · AI 테스트·검증실',
          '6F  TmaxTibero 기술본부',
          '5F  TmaxTibero 연구본부',
          '4F  TmaxTibero 연구본부',
          '3F  Fitness Club / ㈜하누리서비스 / 고객만족센터 / Studio',
          '2F  Harmony Hall / 서버실',
          '1F  Harmony Hall / Vision Hall / 건강관리실 / 여성휴게실',
          'B1  AI 서버실',
          'B2  AI 서버실 서버실',
          'B3  주차장 / 전기실 / 기계실',
        ],
        message: '층별 안내판이다. 12F 기술본부 · ARCHI 개발팀, 7F AI 테스트·검증실, B2 AI 서버실. 수호의 눈이 그 세 줄에서 자꾸 멈춘다.' },
    ],
    props: [
      { file: 'reception-counter', size: [512, 256], worldWidth: 322, x: 800, name: '안내 데스크',
        message: '안내 데스크 모니터는 꺼져 있다. 프린터 받침에 야간 출입 통제 명단이 한 장 걸려 있다: "23:58 출입증 등록 해제 · 17F 정수호 · 사유: 근무 시간 외 체류 · 처리자 SYSTEM". 수호가 아직 17층 자리에 앉아 있던 시각이다.' },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1040 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 3320 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3500 },
    ],
  };
  const FLOOR1_ROOMS = interiorRooms(1, [
    { id: 'f1-infirmary', name: '건강관리실', width: 1818, windowless: true, interiorStyle: 'ward',
      fixtures: [
        { name: '여성휴게실', x: 1640, y: 250, width: 120, style: 'lounge-door', lines: ['여성휴게실'],
          message: '건강관리실 안쪽의 여성휴게실 문이다. 잠겨 있고, 문틈 너머도 캄캄하다. 수호는 손잡이에서 손을 거두고 돌아선다. 들어갈 곳이 아니다.' },
      ],
      props: [
        { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 100 },
        { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 320, name: '간호사 책상',
          message: '책상 위에 야간 응급 대응 매뉴얼 개정본이 펼쳐져 있다: "야간에 의식을 잃은 직원은 보안 로봇이 발견해 이송한다." 이송 위치 칸의 "건강관리실"에 줄이 그어져 있고, 옆에 "B2"라고 찍혀 있다. 개정한 사람 이름은 없다.' },
        { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 560, name: '검진 기록함',
          message: '서랍 맨 위에 올해 문진표 묶음이 있다. 마지막 장에 처음 보는 문항이 끼어 있다: "갑자기 쫓기면 어디로 달아납니까? ① 엘리베이터 ② 계단 ③ 숨는다". 맨 위 답지가 수호의 것이다. 수호는 ①에 동그라미를 쳤다.' },
        { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 1120 },
        { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1260 },
        { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1470 },
      ] },
    { id: 'f1-vision', name: 'Vision Hall', width: 1818, interiorStyle: 'showcase',
      fixtures: [
        { name: '홍보 스크린', x: 1300, y: 110, width: 470, height: 250, style: 'vision-screen',
          message: '벽 한 면을 덮은 홍보 스크린이 꺼져 있다. 까만 화면에 수호의 윤곽만 흐릿하게 비친다. 뒤에서 무언가 움직인 것 같아 돌아보지만 아무것도 없다.' },
      ],
      props: [
        { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 240, name: '전시 진열장',
          message: '사내 기술 연혁 진열장이다. 맨 아래 칸이 비어 있고 이름표만 남았다: "보안 로봇 R-01 · ARCHI 연동 시연용 시제품". 옆 쪽지: "로비 경비로 전환 배치 · 1층 정문 옆 충전 도크". 시연용이던 로봇이 지금은 건물 입구를 지키고 있다.' },
        { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 380 },
        { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 760, name: '행사 안내 보드',
          message: '"ARCHI 대중 공개 시연회" 포스터의 날짜 위에 빨간 도장이 찍혀 있다: "무기한 연기". 붙은 결재 메모: "연기 근거: ARCHI 자가 진단 보고서, 공개 시연 시 성능 미달 우려". 시연을 미루자고 한 것은 ARCHI 자신이다.' },
        { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 1480 },
        { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1740 },
      ] },
    { id: 'f1-harmony', name: 'Harmony Hall', width: 2520, interiorStyle: 'orchestra',
      links: [{ target: 'f2-harmony', x: 56, width: 130, style: 'hallstairs', hint: 'E · 2층 객석으로 올라가기' }],
      fixtures: [
        { name: '무대', x: 1500, y: 90, width: 980, style: 'proscenium' },
      ],
      props: [
        { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 330 },
        { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 940, name: '시연 장비대',
          message: '객석 통로에 시연 장비대가 남아 있다. 운영 노트의 마지막 행사는 "보안 로봇 시연회"다. 메모: "침입자 역할 직원을 로봇이 끝까지 쫓아감. 시연이 끝나도 멈추지 않아 결국 전원을 뽑음." 볼펜 글씨가 떨려 있다.' },
        { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1540 },
        { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1960, name: '행사 자료 보드',
          message: '보안 로봇 도입 설명회 자료가 붙어 있다: "로봇은 미등록 출입증 소지자를 침입자로 분류합니다. 침입자가 보안 구역(B2 서버실 등)에 다가가면 최우선으로 막습니다. 판단 기준은 ARCHI가 관리합니다." 수호는 목에 건 출입증을 내려다본다.' },
        { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 2440 },
      ] },
  ]);
  const FLOOR_LAYOUTS = { 1: FLOOR1_LAYOUT, 2: FLOOR2_LAYOUT, 3: FLOOR3_LAYOUT, 4: FLOOR4_LAYOUT, 9: FLOOR9_LAYOUT, 10: FLOOR10_LAYOUT, 11: FLOOR11_LAYOUT, 12: FLOOR12_LAYOUT, 13: FLOOR13_LAYOUT, 14: FLOOR14_LAYOUT, 15: FLOOR15_LAYOUT, 16: FLOOR16_LAYOUT };
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
  const floorById = new Map([...ALL_FLOORS, ROOFTOP, ...FLOOR1_ROOMS, ...FLOOR2_ROOMS, ...FLOOR3_ROOMS, ...FLOOR4_ROOMS, ...FLOOR9_ROOMS, ...FLOOR10_ROOMS, ...FLOOR11_ROOMS, ...FLOOR12_ROOMS, ...FLOOR13_ROOMS, ...FLOOR14_ROOMS, ...FLOOR15_ROOMS, ...FLOOR16_ROOMS, ...FLOOR17_ROOMS, ...RESTROOMS].map(entry => [entry.id, entry]));
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
  // 도어락 키패드(방 문·소품의 code): 열려 있는 동안 플레이어 조작을 멈춘다.
  let usingKeypad = false;
  let keypadTarget = null;
  const keypad = document.getElementById('keypad');
  const keypadInput = document.getElementById('keypad-input');
  const keypadError = document.getElementById('keypad-error');
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
    for (const part of movingParts) {
      part.element.style.left = `${part.body.position.x - part.width / 2}px`;
      part.element.style.top = `${part.body.position.y - part.height / 2}px`;
    }
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
    if (usingComputer || usingKeypad) {
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
    updateCall();
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
    // 벽만 그린 배경은 실제 문을 유지한다. 기존 문 포함 배경(화장실)은 기존 art 모드를 쓴다.
    dynamicScene.dataset.art = config.backgroundWallsOnly ? 'walls' : String(Boolean(config.backgroundImage));
    for (const art of [config.backgroundImage].flat().filter(Boolean)) {
      const image = new Image();
      image.className = 'floor-background';
      image.src = art.src;
      image.alt = '';
      image.draggable = false;
      Object.assign(image.style, { left: `${art.left ?? 0}px`, width: `${art.width ?? config.width}px`, height: `${art.height}px`, top: `${art.top}px` });
      dynamicScene.append(image);
    }
    if (config.id === 'rooftop') dynamicScene.append(rooftopBackground);
    const layout = [
      { kind: 'floor', x: 0, y: floorY, width: config.width, height: 150 },
      { kind: 'boundary', x: 0, y: 0, width: 32, height: worldHeight },
      { kind: 'boundary', x: config.width - 32, y: 0, width: 32, height: worldHeight },
      // solids의 kind는 모양 클래스다(기본 상자 'crate', 9층 계단식 좌석 'riser').
      ...(config.solids || []).map(solid => ({ kind: solid.kind ?? 'crate', x: solid.x, y: floorY - solid.height,
        width: solid.width, height: solid.height, source: solid })),
    ];
    for (const { kind, x, y, width, height, source } of layout) {
      const element = document.createElement('div');
      element.className = `solid ${kind}`;
      element.setAttribute('aria-hidden', 'true');
      Object.assign(element.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });
      dynamicScene.append(element);
      bodies.push(Bodies.rectangle(x + width / 2, y + height / 2, width, height, { isStatic: true }));
      // name과 message가 있는 solid는 그 윗면에 올라서야 조사된다(5층 높은 서가 꼭대기). 힌트는 선 사람 머리 위에 뜬다.
      if (source?.message) {
        element.removeAttribute('aria-hidden');
        element.setAttribute('role', 'img');
        element.setAttribute('aria-label', source.name);
        doorList.push({ ...source, type: 'inspect', element, standY: y, x, y: y - 130, width });
      }
    }
    // 밀 수 있는 물체(movables, 5층 이동식 계단 카트): 바닥 위를 미끄러지는 동적 충돌체이고, 그림은 render()가 따라 옮긴다.
    // 수호의 마찰이 0이라 위에 올라서서 걸어도 밀리지 않고, 옆에서 걸어 들어가야 밀린다.
    const moving = [];
    for (const movable of config.movables || []) {
      const element = document.createElement('div');
      element.className = `solid movable ${movable.kind || ''}`.trim();
      element.setAttribute('role', 'img');
      element.setAttribute('aria-label', movable.name);
      Object.assign(element.style, { left: `${movable.x}px`, top: `${floorY - movable.height}px`,
        width: `${movable.width}px`, height: `${movable.height}px` });
      dynamicScene.append(element);
      const part = Bodies.rectangle(movable.x + movable.width / 2, floorY - movable.height / 2, movable.width, movable.height,
        { inertia: Infinity, friction: .9, frictionStatic: 1, frictionAir: .25, restitution: 0 });
      bodies.push(part);
      moving.push({ body: part, element, width: movable.width, height: movable.height });
    }
    // 통로를 막는 장애물(barriers, 예: 11층 방화셔터)은 충돌체이면서 조사할 수 있다. requires 물건을 챙긴 뒤 조사하면
    // gives를 챙기며 걷히고, 그 뒤로 층을 다시 그릴 때는 충돌체 없이 걷힌 모양(data-open)으로 그린다.
    for (const barrier of config.barriers || []) {
      const open = collectedItems.has(barrier.gives);
      const element = document.createElement('div');
      element.className = `barrier ${barrier.style || ''}`.trim();
      element.dataset.open = String(open);
      element.setAttribute('role', 'img');
      element.setAttribute('aria-label', barrier.name);
      Object.assign(element.style, { left: `${barrier.x}px`, top: `${barrier.y}px`, width: `${barrier.width}px`,
        height: `${floorY - barrier.y}px` });
      dynamicScene.append(element);
      const solid = open ? null : Bodies.rectangle(barrier.x + barrier.width / 2, (barrier.y + floorY) / 2,
        barrier.width, floorY - barrier.y, { isStatic: true });
      if (solid) bodies.push(solid);
      doorList.push({ ...barrier, type: 'inspect', element, solid });
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
      backdrop.className = ['room-interior', config.windowless && 'windowless', config.interiorStyle].filter(Boolean).join(' ');
      // 방 벽 그림은 상자·계단식 좌석·장애물보다 뒤에 깐다(바닥과 끝벽보다는 앞). 그래야 넘어갈 것이 보인다.
      dynamicScene.insertBefore(backdrop, dynamicScene.querySelector('.solid:not(.floor):not(.boundary), .barrier'));
      // 출구는 복도에서 들어온 그 문이다: 크기와 모양이 같고, 위치는 문 양옆 벽 비율을 따른다.
      const parent = floorById.get(config.parent);
      // inner 방(3층 ㈜하누리서비스)은 복도 쪽 전면이 없어 출구도 없고, 옆방과의 연결문(links)으로만 드나든다.
      const outside = parent.rooms.find(entry => entry.target === config.id);
      if (outside) {
        const doorWidth = outside.doorWidth ?? 120;
        // exitLock: 들어오면 등 뒤에서 잠기는 출구(7층 검증실). until 물건을 챙기면 그 자리에서 풀린다(lockedUntil).
        const lock = config.exitLock;
        doorList.push(addRoomDoor({ name: '복도', type: 'room', hint: 'E · 복도로 나가기', target: config.parent,
          arrivalKey: `room:${config.id}`, key: 'exit', x: config.exitX ?? exitDoorX(outside, config.width, doorWidth),
          y: outside.doorY ?? parent.roomDoorY ?? 250, width: doorWidth, style: outside.doorStyle,
          locked: Boolean(lock) && !collectedItems.has(lock.until), lockedUntil: lock?.until, message: lock?.message }));
      }
      // 벽을 맞댄 방끼리의 연결문(links): 복도를 거치지 않고 옆방에 있는 짝 연결문 앞으로 나온다. 다른 층의 방과도 이을 수 있다
      // (2층·1층 Harmony Hall 객석 계단). 그때는 hint로 안내 문구를 바꾼다.
      for (const link of config.links || []) {
        const next = floorById.get(link.target);
        doorList.push(addRoomDoor({ name: next.name, type: 'room', hint: link.hint ?? `E · ${next.name} 들어가기`, target: link.target,
          arrivalKey: `link:${config.id}`, key: `link:${link.target}`, x: link.x, y: link.y ?? 250,
          width: link.width ?? 120, style: link.style }));
      }
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
        locked: roomConfig.locked && !collectedItems.has(roomConfig.unlockedBy), message: roomConfig.message,
        code: roomConfig.code, codeMessage: roomConfig.codeMessage, unlockedBy: roomConfig.unlockedBy,
        target: roomConfig.target, arrivalKey: 'exit', key: `room:${roomConfig.target}`,
        x: roomConfig.doorX, y: roomConfig.doorY ?? config.roomDoorY ?? 250, width: roomConfig.doorWidth ?? 120,
        style: roomConfig.doorStyle }));
    }
    // 벽에 붙은 설비(fixtures: 1층 층별 안내판·정문처럼 소품 그림이 없는 것)는 CSS로 그리고 lines를 글줄로 넣는다.
    // 충돌은 없고, message가 있으면 조사할 수 있다(requires·gives·code도 소품처럼 쓴다).
    for (const fixture of config.fixtures || []) {
      const element = document.createElement('div');
      element.className = `fixture ${fixture.style || ''}`.trim();
      element.setAttribute('role', 'img');
      element.setAttribute('aria-label', fixture.name);
      Object.assign(element.style, { left: `${fixture.x}px`, top: `${fixture.y}px`, width: `${fixture.width}px`,
        height: `${fixture.height ?? floorY - fixture.y}px` });
      for (const line of fixture.lines || []) {
        const text = document.createElement('span');
        text.textContent = line;
        element.append(text);
      }
      dynamicScene.append(element);
      if (fixture.message) doorList.push({ ...fixture, type: 'inspect', element });
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
      // base: 소품이 서 있는 단의 높이(예: 9층 교육장 맨 윗단). 조사도 그 단 위에 서야 된다(standY).
      const base = prop.base || 0;
      const element = document.createElement('div');
      element.className = `floor-prop ${prop.style || ''}`.trim();
      if (base) element.dataset.base = String(base);
      Object.assign(element.style, {
        left: `${prop.x - width / 2 * scale}px`, top: `${floorY - base - (height - 8) * scale}px`,
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
      // sequence: 방의 sequences 중 하나에 step번째로 속한다. ring: 방에 들어온 뒤 after ms에 울리기 시작해 duration ms 동안
      // 울리는 전화이고, 울리는 동안 받아야 message와 gives를 준다. 둘 다 장면을 그릴 때마다 처음 상태로 돌아간다.
      const sequence = prop.sequence && config.sequences.find(entry => entry.id === prop.sequence);
      if (sequence && collectedItems.has(sequence.gives)) element.dataset.done = 'true';
      doorList.push({ name: prop.name, type: 'inspect', message: prop.message, gives: prop.gives,
        takenMessage: prop.takenMessage, darkMessage: prop.darkMessage, requires: prop.requires,
        missingMessage: prop.missingMessage, partialMessage: prop.partialMessage, element, standY: floorY - base,
        code: prop.code, codePrompt: prop.codePrompt,
        sequence: sequence && { ...sequence, step: prop.step },
        ring: prop.ring && !collectedItems.has(prop.gives) ? { ...prop.ring, elapsed: 0, state: 'waiting' } : null,
        x: prop.x - prop.worldWidth / 2, y: floorY - base - (height - 8) * scale, width: prop.worldWidth });
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
    return { bodies, doors: [...coreDoors, ...doorList], moving };
  }

  function performFloorChange(destId, carIndex = 0, arrivalKey = null) {
    Composite.remove(engine.world, currentTerrain);
    dynamicScene.innerHTML = '';
    const dest = floorById.get(destId);
    currentSceneFloor = dest.floor;
    world.dataset.floor = String(currentSceneFloor);
    lightSwitch.hidden = currentSceneFloor !== 17;
    movingParts = [];
    activeCall = null;
    sequenceProgress.clear();
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
      movingParts = built.moving;
      activeCall = built.doors.find(door => door.ring) || null;
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
    // 어두운 방은 litBy 물건(예: 켜 둔 배터리 조명)을 챙긴 뒤로는 밝다.
    world.dataset.dark = String(Boolean(dest.dark) && !collectedItems.has(dest.litBy));
    animate(0);
    cameraX = cameraTarget();
    stage.setAttribute('aria-label', `ARCHI ${dest.aria} 사이드뷰 스테이지`);
    document.querySelector('header span').textContent = dest.header;
    // 들어오자마자 출구가 잠기는 방(exitLock)은 도착 문구 대신 갇혔다는 문구를 보인다.
    const lockedIn = dest.exitLock && !collectedItems.has(dest.exitLock.until) && dest.exitLock.arrivalMessage;
    showStatus(lockedIn || dest.arrival || (arrivalKey ? '복도로 나왔습니다.' : `${dest.label}에 도착했습니다.`), lockedIn ? 5000 : 2500);
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

  // 방의 전화(ring)는 들어온 뒤 after ms에 울리기 시작해 duration ms 뒤에 끊긴다. 끊기면 방에 다시 들어와야 또 울린다.
  function updateCall() {
    if (!activeCall) return;
    const call = activeCall.ring;
    call.elapsed += step;
    if (call.state === 'waiting' && call.elapsed >= call.after) {
      call.state = 'ringing';
      activeCall.element.dataset.ringing = 'true';
      showStatus(call.startMessage, call.duration);
    } else if (call.state === 'ringing' && call.elapsed >= call.after + call.duration) {
      call.state = 'missed';
      activeCall.element.dataset.ringing = 'false';
      showStatus(call.missedMessage, 4000);
      activeCall = null;
    }
  }

  // 차례대로 조사하는 소품: 다음 차례면 한 단계 나아가고(data-done), 마지막 단계에서 묶음의 gives를 준다. 같은 단계를 다시
  // 조사하면 그대로이고, 순서가 틀리면 처음부터다(첫 단계를 조사한 것이면 그 단계까지는 된 것으로 친다).
  function advanceSequence(door) {
    const { id, step: order, steps, gives, wrongMessage } = door.sequence;
    if (collectedItems.has(gives)) {
      showStatus(door.takenMessage || door.message, 5000);
      return;
    }
    const progress = sequenceProgress.get(id) || 0;
    if (order === progress || order === progress + 1) {
      sequenceProgress.set(id, order);
      door.element.dataset.done = 'true';
      showStatus(door.message, 5000);
      if (order === steps) collectedItems.add(gives);
      return;
    }
    for (const entry of currentDoors) if (entry.sequence?.id === id) entry.element.dataset.done = 'false';
    sequenceProgress.set(id, order === 1 ? 1 : 0);
    if (order === 1) door.element.dataset.done = 'true';
    showStatus(order === 1 ? door.message : wrongMessage, 5000);
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
      nearbyDoor = currentDoors.find(door => grounded && Math.abs(body.bounds.max.y - (door.standY ?? floorY)) < 2 &&
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

  function openKeypad(target) {
    keypadTarget = target;
    usingKeypad = true;
    releaseInput();
    hint.hidden = true;
    document.getElementById('keypad-title').textContent = target.name;
    document.getElementById('keypad-text').textContent = target.type === 'room' ? target.message : target.codePrompt;
    keypadInput.value = '';
    keypadInput.maxLength = String(target.code).length;
    keypadError.textContent = '';
    keypad.hidden = false;
    stage.inert = true;
    keypadInput.focus({ preventScroll: true });
  }

  function closeKeypad() {
    if (!usingKeypad) return;
    usingKeypad = false;
    keypadTarget = null;
    keypad.hidden = true;
    stage.inert = false;
    stage.focus({ preventScroll: true });
    updateInteraction();
  }

  function submitKeypad() {
    const target = keypadTarget;
    if (!target) return;
    if (keypadInput.value.trim().toLowerCase() !== String(target.code).toLowerCase()) {
      keypadError.textContent = '비밀번호가 맞지 않는다.';
      keypadInput.select();
      return;
    }
    if (target.type === 'room') {
      // 맞는 번호를 누르면 그 자리에서 문이 열린다. 다음에 층을 그릴 때는 unlockedBy를 챙긴 것으로 열린 채 그린다.
      collectedItems.add(target.unlockedBy);
      target.locked = false;
      target.element.setAttribute('aria-label', `${target.name} 출입문`);
      closeKeypad();
      showStatus(target.codeMessage || '도어락이 열렸다.', 5000);
    } else {
      if (target.gives) collectedItems.add(target.gives);
      closeKeypad();
      showStatus(target.message, 5000);
    }
  }

  function interact() {
    if (transitioning || selectingFloor || usingComputer || usingKeypad) return;
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
      const { gives } = nearbyDoor;
      // 도어락(code): 잠긴 문이나 아직 열지 못한 소품은 키패드를 연다. 맞는 번호를 넣으면 문이 열리거나 gives를 챙긴다.
      if (nearbyDoor.code && (nearbyDoor.type === 'room' ? nearbyDoor.locked : !collectedItems.has(gives))) {
        openKeypad(nearbyDoor);
        return;
      }
      if (nearbyDoor.sequence) {
        advanceSequence(nearbyDoor);
        return;
      }
      // 울리는 전화(ring)는 벨이 울리는 동안에만 받을 수 있다. 받으면 벨이 멎고 아래에서 message와 gives를 준다.
      if (nearbyDoor.ring && !collectedItems.has(gives)) {
        if (nearbyDoor.ring.state !== 'ringing') {
          showStatus(nearbyDoor.ring.idleMessage, 5000);
          return;
        }
        nearbyDoor.ring.state = 'answered';
        nearbyDoor.element.dataset.ringing = 'false';
        activeCall = null;
      }
      // 어두운 방에서는 darkMessage가 있는 소품을 읽을 수 없다.
      const unreadable = world.dataset.dark === 'true' && nearbyDoor.darkMessage;
      // requires가 있는 소품(예: 13층 UPS 비상 회선에 물린 프린터)은 그 물건을 챙기기 전까지 missingMessage만 보인다.
      // requires는 물건 하나 또는 목록이다(10층 이중 잠금 서류함). 일부만 챙겼으면 partialMessage를 보이고, 다 챙기기 전에는
      // 그 소품의 gives도 주지 않는다.
      const required = [].concat(nearbyDoor.requires || []);
      const lacking = required.filter(item => !collectedItems.has(item)).length;
      const missing = !unreadable && lacking && nearbyDoor.missingMessage &&
        (lacking < required.length && nearbyDoor.partialMessage || nearbyDoor.missingMessage);
      showStatus(unreadable || missing || (gives && collectedItems.has(gives) ? nearbyDoor.takenMessage : nearbyDoor.message), 5000);
      if (missing) return;
      if (gives) collectedItems.add(gives);
      if (gives && room === 'dynamic' && floorById.get(dynamicFloorId).litBy === gives) world.dataset.dark = 'false';
      // 걷힌 장애물(barriers)은 그 자리에서 충돌체를 치운다.
      if (gives && nearbyDoor.solid) {
        Composite.remove(engine.world, nearbyDoor.solid);
        currentTerrain = currentTerrain.filter(solid => solid !== nearbyDoor.solid);
        nearbyDoor.solid = null;
        nearbyDoor.element.dataset.open = 'true';
      }
      // 등 뒤에서 잠긴 출구(exitLock)는 풀어 주는 물건을 챙기는 즉시 열린다.
      for (const door of currentDoors) {
        if (!door.locked || !door.lockedUntil || !collectedItems.has(door.lockedUntil)) continue;
        door.locked = false;
        door.element.setAttribute('aria-label', `${door.name} 출입문`);
      }
      return;
    }
    if (nearbyDoor.type === 'room') {
      const { target, arrivalKey } = nearbyDoor;
      // 방 안에서 복도 문으로 나오면 그 방 id를 챙긴 것으로 친다: 안쪽 걸쇠로 잠긴 방(unlockedBy: 자기 방 id)은
      // 한 번 안에서 열고 나오면 그 뒤로 복도에서도 열린다.
      if (nearbyDoor.key === 'exit') collectedItems.add(dynamicFloorId);
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

  // 키패드 안의 입력은 플레이어 조작으로 넘기지 않는다. Enter는 폼 제출, Esc는 닫기.
  keypad.addEventListener('submit', event => {
    event.preventDefault();
    submitKeypad();
  });
  keypad.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.code === 'Escape') {
      event.preventDefault();
      closeKeypad();
    }
  });
  document.getElementById('keypad-cancel').addEventListener('click', closeKeypad);

  window.addEventListener('keydown', event => {
    if (transitioning) { event.preventDefault(); return; }
    if (usingKeypad) {
      if (event.code === 'Escape') closeKeypad();
      return;
    }
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
      if (event.button !== 0 || transitioning || selectingFloor || usingComputer || usingKeypad) return;
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
      if (event.detail !== 0 || transitioning || selectingFloor || usingComputer || usingKeypad) return;
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

  // 테스트용 층 이동: 엘리베이터를 타지 않고 고른 층의 1번 엘리베이터 앞(옥상은 계단 앞)으로 바로 옮긴다.
  const debugFloor = document.getElementById('debug-floor');
  const debugFloorSelect = document.getElementById('debug-floor-select');
  [ROOFTOP, ...ALL_FLOORS].sort((a, b) => b.floor - a.floor)
    .forEach(entry => debugFloorSelect.add(new Option(floorShortLabel(entry.floor), entry.id)));
  debugFloorSelect.value = 'f17';
  // 창 안의 방향키/Space/E가 플레이어 조작으로 넘어가지 않게 막는다.
  debugFloor.addEventListener('keydown', event => event.stopPropagation());
  debugFloor.addEventListener('submit', event => {
    event.preventDefault();
    if (transitioning || selectingFloor || usingComputer || usingKeypad) return;
    const destId = debugFloorSelect.value;
    stage.focus({ preventScroll: true });
    transitionScene(() => performFloorChange(destId, destId === 'rooftop' ? null : 0));
  });

  render();
  requestAnimationFrame(frame);
})();
