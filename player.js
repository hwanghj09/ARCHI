(() => {
  const { Engine, Bodies, Body, Composite } = Matter;
  const stage = document.getElementById('stage');
  const world = document.getElementById('world');
  const sprite = document.getElementById('player');
  const walkSheet = document.getElementById('walk-sheet');
  const jumpSheet = document.getElementById('jump-sheet');
  const interactSheet = document.getElementById('interact-sheet');
  const buttons = [...document.querySelectorAll('nav button')];
  const keys = new Set();
  const pointers = new Map();
  const movementKeys = { KeyA: -1, ArrowLeft: -1, KeyD: 1, ArrowRight: 1 };
  const jumpKeys = new Set(['Space', 'KeyW', 'ArrowUp']);
  let worldWidth = 3200;
  const officeWidth = 2400;
  let room = 'corridor'; // 'corridor' | 'office' (17층) | 'dynamic' (다른 층)
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
  const floorSelect = document.getElementById('floor-select');
  const officeBackground = document.getElementById('office-background');
  // The generated office floor starts at source y=504; align it with the physics floor.
  Object.assign(officeBackground.style, {
    width: `${officeWidth}px`, height: `${724 * officeWidth / 2172}px`,
    left: '0px', top: `${floorY - 504 * officeWidth / 2172}px`,
  });
  const officeDoors = [
    { name: '사무실', room: 'corridor', x: 580, y: 236, width: 128 },
    { name: '사무실', room: 'corridor', x: 1224, y: 236, width: 128 },
    { name: '복도', room: 'office', x: 68, y: 250, width: 144 },
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
    { name: '1번 엘리베이터', type: 'elevator', carIndex: 0, x: 1818, y: 220, width: 218 },
    { name: '2번 엘리베이터', type: 'elevator', carIndex: 1, x: 2148, y: 220, width: 214 },
    { name: '3번 엘리베이터', type: 'elevator', carIndex: 2, x: 2444, y: 220, width: 216 },
    { name: '비상계단', type: 'stairs', x: 2906, y: 232, width: 180 },
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
      door.indicator = document.createElement('div');
      door.indicator.className = 'elevator-indicator';
      door.indicator.style.left = `${door.x + door.width / 2}px`;
      door.indicator.style.top = `${door.y - 32}px`;
      world.insertBefore(door.indicator, sprite);
      updateFloorIndicator(door);
    }
  }
  // 다른 층들: 실제 배경 아트가 없어 색상/소품 배치만으로 층마다 다른 구조를 준다.
  // elevatorBank는 그 층의 3개 엘리베이터 중 첫 번째 문의 x좌표(이후 260px 간격)다.
  const FLOOR17 = { id: 'f17', floor: 17, short: '17F', label: '17층 · 복도', header: '17F · 00:00', aria: '17층 복도' };
  const FLOORS = [
    { id: 'roof', floor: 18, short: 'RF', label: '옥상 · 비상 전력', header: 'RF · 비상 전력', aria: '옥상', width: 2000,
      background: 'linear-gradient(#2c3d55, #16202f)', elevatorBank: 850,
      obstacles: [{ kind: 'hvac', x: 450, y: floorY - 50, width: 96, height: 50 }],
      panel: { name: '태양광 비상 전력 제어 장치', x: 140, y: 260, width: 120 } },
    { id: 'f12', floor: 12, short: '12F', label: '12층 · ARCHI 개발팀', header: '12F · ARCHI 개발팀', aria: '12층 ARCHI 개발팀', width: 3000,
      background: '#1a2230', elevatorBank: 1700,
      obstacles: [
        { kind: 'desk', x: 600, y: floorY - 60, width: 110, height: 60 },
        { kind: 'desk', x: 950, y: floorY - 60, width: 110, height: 60 },
        { kind: 'cabinet', x: 1300, y: floorY - 88, width: 100, height: 88 },
      ] },
    { id: 'f7', floor: 7, short: '7F', label: '7층 · AI 테스트/검증실', header: '7F · AI 테스트실', aria: '7층 AI 테스트 검증실', width: 2800,
      background: '#132420', elevatorBank: 1500,
      obstacles: [
        { kind: 'rig', x: 650, y: floorY - 70, width: 110, height: 70 },
        { kind: 'rig', x: 1000, y: floorY - 70, width: 110, height: 70 },
      ] },
    { id: 'f1', floor: 1, short: '1F', label: '1층 · 로비', header: '1F · 로비', aria: '1층 로비', width: 3400,
      background: '#23262b', elevatorBank: 2100,
      obstacles: [{ kind: 'crate', x: 1400, y: floorY - 56, width: 112, height: 56 }] },
    { id: 'b1', floor: -1, short: 'B1', label: 'B1 · 시설관리실', header: 'B1 · 시설관리실', aria: 'B1 시설관리실', width: 2400,
      background: '#1c1712', elevatorBank: 1050,
      obstacles: [
        { kind: 'crate', x: 260, y: floorY - 56, width: 112, height: 56 },
        { kind: 'cabinet', x: 560, y: floorY - 88, width: 112, height: 88 },
        { kind: 'crate', x: 820, y: floorY - 56, width: 112, height: 56 },
      ] },
    { id: 'b2', floor: -2, short: 'B2', label: 'B2 · 서버실', header: 'B2 · 서버실', aria: 'B2 서버실', width: 2600,
      background: '#0a121a', elevatorBank: 1300,
      obstacles: [
        { kind: 'server-rack', x: 550, y: floorY - 90, width: 90, height: 90 },
        { kind: 'server-rack', x: 850, y: floorY - 90, width: 90, height: 90 },
        { kind: 'server-rack', x: 1100, y: floorY - 90, width: 90, height: 90 },
      ] },
  ];
  const ALL_FLOORS = [FLOOR17, ...FLOORS];
  const floorById = new Map(ALL_FLOORS.map(entry => [entry.id, entry]));

  function floorShortLabel(floorValue) {
    if (floorValue === -1) return 'B1';
    if (floorValue === -2) return 'B2';
    if (floorValue === 18) return 'RF';
    return `${String(floorValue).padStart(2, '0')}F`;
  }

  let nearbyDoor = null;
  let statusTimer;
  const speed = 200;
  const walkFrames = 6;
  const frameDistance = 184 / walkFrames;
  const step = 1000 / 60;
  world.style.width = `${worldWidth}px`;
  world.style.height = `${worldHeight}px`;
  const background = document.getElementById('background');
  for (let row = 0; row < Math.ceil(worldHeight / 256); row++) {
    for (let col = 0; col < Math.ceil(worldWidth / 256); col++) {
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
    { kind: 'floor', x: 0, y: floorY, width: worldWidth, height: 150 },
    { kind: 'boundary', x: 0, y: 0, width: 32, height: worldHeight },
    { kind: 'boundary', x: worldWidth - 32, y: 0, width: 32, height: worldHeight },
    { kind: 'crate', x: 980, y: floorY - 56, width: 112, height: 56 },
    { kind: 'cabinet', x: 1930, y: floorY - 88, width: 112, height: 88 },
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
  const body = Bodies.rectangle(220, floorY - 81, 40, 162, {
    inertia: Infinity, friction: 0, frictionStatic: 0, frictionAir: 0, restitution: 0,
  });
  Composite.add(engine.world, [...solids, body]);
  const officeSolids = [
    Bodies.rectangle(officeWidth / 2, floorY + 75, officeWidth, 150, { isStatic: true }),
    Bodies.rectangle(16, worldHeight / 2, 32, worldHeight, { isStatic: true }),
    Bodies.rectangle(officeWidth - 16, worldHeight / 2, 32, worldHeight, { isStatic: true }),
  ];
  let currentTerrain = solids;
  let currentDoors = doors;
  let walkDistance = 0;
  let walkReady = false;
  let facing = 1;
  let grounded = false;
  let jumpQueued = false;
  let interactionTime = 0;
  let transitioning = false;
  let selectingFloor = false;
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

  function animate(distance) {
    const walking = grounded && walkReady && distance > .1;
    walkDistance = walking ? (walkDistance + distance) % (frameDistance * walkFrames) : 0;
    const state = !grounded ? (body.velocity.y < 0 ? 'jump' : 'fall') :
      interactionTime > 0 ? 'interact' : walking ? 'walk' : 'idle';
    const index = state === 'fall' ? 1 : state === 'interact' ? Number(interactionTime <= 240) :
      walking ? Math.floor(walkDistance / frameDistance) : 0;
    sprite.dataset.state = state;
    sprite.dataset.frame = index;
    if (state === 'walk') walkSheet.style.transform = `translateX(${-index * 100 / walkFrames}%)`;
    if (state === 'jump' || state === 'fall') jumpSheet.style.transform = `translateX(${-index * 50}%)`;
    if (state === 'interact') interactSheet.style.transform = `translateX(${-index * 50}%)`;
  }

  function cameraTarget() {
    return Math.max(0, Math.min(worldWidth - viewWidth, body.position.x - viewWidth * .42));
  }

  function render() {
    // The image has transparent padding: its soles sit 178px below the sprite top.
    sprite.style.transform = `translate(${body.position.x - 96}px, ${body.bounds.max.y - 178}px) scaleX(${facing})`;
    world.style.transform = `translate(${-cameraX * scale}px, ${stage.clientHeight - worldHeight * scale}px) scale(${scale})`;
  }

  function update() {
    const directions = [...keys].map(key => movementKeys[key]).concat([...pointers.values()]);
    if (pulseTime > 0) directions.push(pulseDirection);
    pulseTime = Math.max(0, pulseTime - step);
    const direction = Number(directions.includes(1)) - Number(directions.includes(-1));
    interactionTime = direction || jumpQueued ? 0 : Math.max(0, interactionTime - step);
    if (direction) facing = direction;
    Body.setVelocity(body, { x: direction * speed / 60, y: jumpQueued && grounded ? -10.8 : body.velocity.y });
    jumpQueued = false;
    const oldX = body.position.x;
    Engine.update(engine, step);
    grounded = engine.pairs.list.some(pair => {
      if (!pair.isActive || (pair.bodyA !== body && pair.bodyB !== body)) return false;
      const normalY = pair.collision.normal.y * (pair.bodyA === body ? 1 : -1);
      return normalY < -.5;
    });
    animate(Math.abs(body.position.x - oldX));
    updateElevators();
    updateInteraction();
    cameraX += (cameraTarget() - cameraX) * .13;
    cameraX = Math.max(0, Math.min(Math.max(0, worldWidth - viewWidth), cameraX));
  }

  function showStatus(message) {
    status.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { status.textContent = ''; }, 2500);
  }

  function changeRoom() {
    if (transitioning) return;
    if (room === 'corridor' && (!officeBackground.complete || !officeBackground.naturalWidth)) {
      showStatus('사무실 배경을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    transitioning = true;
    releaseInput();
    roomTransition.addEventListener('transitionend', () => {
      performRoomChange();
      roomTransition.addEventListener('transitionend', () => { transitioning = false; }, { once: true });
      roomTransition.classList.remove('visible');
    }, { once: true });
    roomTransition.classList.add('visible');
  }

  function performRoomChange() {
    const entering = room === 'corridor';
    if (entering) returnX = body.position.x;
    for (const solid of entering ? solids : officeSolids) Composite.remove(engine.world, solid);
    Composite.add(engine.world, entering ? officeSolids : solids);
    Engine.clear(engine);
    room = entering ? 'office' : 'corridor';
    currentTerrain = entering ? officeSolids : solids;
    worldWidth = entering ? officeWidth : 3200;
    world.dataset.room = room;
    world.style.width = `${worldWidth}px`;
    Body.setPosition(body, { x: entering ? 160 : returnX, y: floorY - 81 });
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

  function buildDynamicScene(config) {
    const bodies = [];
    const doorList = [];
    const layout = [
      { kind: 'floor', x: 0, y: floorY, width: config.width, height: 150 },
      { kind: 'boundary', x: 0, y: 0, width: 32, height: worldHeight },
      { kind: 'boundary', x: config.width - 32, y: 0, width: 32, height: worldHeight },
      ...config.obstacles,
    ];
    for (const { kind, x, y, width, height } of layout) {
      const element = document.createElement('div');
      element.className = `solid ${kind}`;
      element.setAttribute('aria-hidden', 'true');
      Object.assign(element.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });
      dynamicScene.append(element);
      bodies.push(Bodies.rectangle(x + width / 2, y + height / 2, width, height, { isStatic: true }));
    }
    const bank = config.elevatorBank;
    [0, 1, 2].forEach(carIndex => {
      const car = elevatorCars[carIndex];
      const door = { name: car.name, type: 'elevator', carIndex, x: bank + carIndex * 260, y: 220, width: 200 };
      door.element = document.createElement('div');
      door.element.className = 'door';
      door.element.dataset.open = 'false';
      door.element.setAttribute('role', 'img');
      Object.assign(door.element.style, {
        left: `${door.x}px`, top: `${door.y}px`, width: `${door.width}px`, height: `${floorY - door.y}px`,
      });
      const image = new Image();
      image.src = 'assets/objects/floor17/elevator.png';
      image.alt = '';
      image.draggable = false;
      door.element.append(image);
      dynamicScene.append(door.element);
      door.indicator = document.createElement('div');
      door.indicator.className = 'elevator-indicator';
      door.indicator.style.left = `${door.x + door.width / 2}px`;
      door.indicator.style.top = `${door.y - 32}px`;
      dynamicScene.append(door.indicator);
      doorList.push(door);
    });
    const stairs = { name: '비상계단', type: 'stairs', x: bank + 780, y: 232, width: 170 };
    stairs.element = document.createElement('div');
    stairs.element.className = 'door';
    stairs.element.dataset.open = 'false';
    stairs.element.setAttribute('role', 'img');
    Object.assign(stairs.element.style, {
      left: `${stairs.x}px`, top: `${stairs.y}px`, width: `${stairs.width}px`, height: `${floorY - stairs.y}px`,
    });
    const stairsImage = new Image();
    stairsImage.src = 'assets/objects/floor17/stairs.png';
    stairsImage.alt = '';
    stairsImage.draggable = false;
    stairs.element.append(stairsImage);
    dynamicScene.append(stairs.element);
    doorList.push(stairs);
    if (config.panel) {
      const panel = { name: config.panel.name, type: 'panel', x: config.panel.x, y: config.panel.y, width: config.panel.width };
      panel.element = document.createElement('div');
      panel.element.className = 'panel';
      Object.assign(panel.element.style, {
        left: `${panel.x}px`, top: `${panel.y}px`, width: `${panel.width}px`, height: `${floorY - panel.y}px`,
      });
      dynamicScene.append(panel.element);
      doorList.push(panel);
    }
    return { bodies, doors: doorList, spawnX: bank + 130 };
  }

  function performFloorChange(destId) {
    Composite.remove(engine.world, currentTerrain);
    dynamicScene.innerHTML = '';
    const dest = floorById.get(destId);
    currentSceneFloor = dest.floor;
    if (destId === 'f17') {
      room = 'corridor';
      world.dataset.room = 'corridor';
      worldWidth = 3200;
      currentTerrain = solids;
      currentDoors = doors;
      Composite.add(engine.world, solids);
      Body.setPosition(body, { x: 1948, y: floorY - 81 });
    } else {
      room = 'dynamic';
      dynamicFloorId = destId;
      world.dataset.room = 'dynamic';
      worldWidth = dest.width;
      dynamicScene.style.background = dest.background;
      const built = buildDynamicScene(dest);
      currentTerrain = built.bodies;
      currentDoors = built.doors;
      Composite.add(engine.world, currentTerrain);
      Body.setPosition(body, { x: built.spawnX, y: floorY - 81 });
    }
    Engine.clear(engine);
    world.style.width = `${worldWidth}px`;
    Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true;
    interactionTime = 420;
    facing = -1;
    animate(0);
    cameraX = cameraTarget();
    stage.setAttribute('aria-label', `ARCHI ${dest.aria} 사이드뷰 스테이지`);
    document.querySelector('header span').textContent = dest.header;
    showStatus(`${dest.label}에 도착했습니다.`);
    refreshSceneElevatorDoors();
    updateInteraction();
    render();
  }

  function setDoorOpen(door, open) {
    door.element.dataset.open = String(open);
    door.element.setAttribute('aria-label', `${door.name} 문 ${open ? '열림' : '닫힘'}`);
  }

  function updateFloorIndicator(door) {
    const car = elevatorCars[door.carIndex];
    const label = floorShortLabel(car.floor);
    door.indicator.textContent = `${car.travelling ? '↑ ' : ''}${label}`;
    door.indicator.setAttribute('aria-label', `${door.name} ${label}${car.travelling ? ' 이동 중' : ''}`);
  }

  function refreshSceneElevatorDoors() {
    elevatorCars.forEach((car, index) => {
      const door = currentDoors.find(candidate => candidate.type === 'elevator' && candidate.carIndex === index);
      if (!door) return;
      setDoorOpen(door, !!car.open);
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
      if (car.floor === car.destination) {
        car.travelling = false;
        car.open = true;
        if (car.rider) {
          car.rider = false;
          const destId = car.pendingDestId;
          car.pendingDestId = null;
          performFloorChange(destId);
          roomTransition.classList.remove('visible');
          setTimeout(() => { transitioning = false; }, 350);
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
      officeDoors.filter(door => door.room === room);
    nearbyDoor = activeDoors.find(door => grounded && Math.abs(body.bounds.max.y - floorY) < 2 &&
      Math.abs(body.position.x - door.x - door.width / 2) < door.width / 2 + 28) || null;
    for (const door of [...doors, ...officeDoors]) door.element.classList.toggle('near', door === nearbyDoor);
    hint.hidden = !nearbyDoor;
    if (nearbyDoor) {
      hint.style.left = `${nearbyDoor.x + nearbyDoor.width / 2}px`;
      hint.style.top = `${nearbyDoor.y - (nearbyDoor.type === 'elevator' ? 72 : 42)}px`;
      hint.textContent = nearbyDoor.type === 'office' ? (room === 'corridor' ? 'E · 사무실 들어가기' : 'E · 복도로 나가기') : doorHintText(nearbyDoor);
    }
  }

  function doorHintText(door) {
    if (door.type === 'panel') return 'E · 조사';
    if (door.type === 'elevator') {
      const car = elevatorCars[door.carIndex];
      if (car.travelling) return car.rider ? '이동 중…' : '올라오는 중…';
      if (car.floor === currentSceneFloor) return 'E · 탑승';
      return 'E · 호출';
    }
    return door.element.dataset.open === 'true' ? 'E · 닫기' : 'E · 열기';
  }

  function interact() {
    updateInteraction();
    if (!nearbyDoor) return;
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
        openFloorSelect(nearbyDoor.carIndex);
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

  function openFloorSelect(carIndex) {
    selectingFloor = true;
    releaseInput();
    floorSelect.innerHTML = '';
    const title = document.createElement('p');
    title.textContent = '이동할 층을 선택하세요';
    floorSelect.append(title);
    for (const target of ALL_FLOORS) {
      if (target.floor === currentSceneFloor) continue;
      const optionButton = document.createElement('button');
      optionButton.type = 'button';
      optionButton.textContent = target.label;
      optionButton.addEventListener('click', () => boardElevator(carIndex, target.id));
      floorSelect.append(optionButton);
    }
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'cancel';
    cancel.textContent = '취소';
    cancel.addEventListener('click', closeFloorSelect);
    floorSelect.append(cancel);
    floorSelect.hidden = false;
  }

  function closeFloorSelect() {
    floorSelect.hidden = true;
    floorSelect.innerHTML = '';
    selectingFloor = false;
  }

  function boardElevator(carIndex, destId) {
    const car = elevatorCars[carIndex];
    const dest = floorById.get(destId);
    closeFloorSelect();
    transitioning = true;
    releaseInput();
    car.rider = true;
    car.pendingDestId = destId;
    car.destination = dest.floor;
    car.travelling = true;
    car.elapsed = 0;
    car.open = false;
    refreshSceneElevatorDoors();
    showStatus(`${car.name} 탑승. ${dest.label}(으)로 이동합니다.`);
    roomTransition.classList.add('visible');
  }

  window.addEventListener('keydown', event => {
    if (selectingFloor) {
      if (event.code === 'Escape') closeFloorSelect();
      return;
    }
    if (transitioning) return;
    if (event.target instanceof Element && event.target.closest('button') && event.code === 'Space') return;
    if (event.code === 'KeyE') {
      event.preventDefault();
      if (!event.repeat) interact();
      return;
    }
    if (!Object.hasOwn(movementKeys, event.code) && !jumpKeys.has(event.code)) return;
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
      if (event.button !== 0 || transitioning || selectingFloor) return;
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
      if (event.detail !== 0 || transitioning || selectingFloor) return;
      if (direction) {
        pulseDirection = direction;
        pulseTime = 150;
      } else pressAction(button);
    });
  });

  new ResizeObserver(() => {
    scale = Math.min(1, stage.clientHeight / worldHeight);
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
