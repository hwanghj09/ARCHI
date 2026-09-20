(() => {
  const { Engine, Bodies, Body, Composite } = Matter;
  const stage = document.getElementById('stage');
  const world = document.getElementById('world');
  const sprite = document.getElementById('player');
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
  const corridorWidth = 3200;
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
    if (transitioning || selectingFloor || currentSceneFloor !== 17) {
      lights.checked = world.dataset.lights === 'on';
      return;
    }
    world.dataset.lights = lights.checked ? 'on' : 'off';
    document.getElementById('floor17-light-state').value = lights.checked ? '조명 켜짐' : '조명 꺼짐';
  });
  // The generated office floor starts at source y=504; align it with the physics floor.
  Object.assign(officeBackground.style, {
    width: `${officeWidth}px`, height: `${724 * officeWidth / 2172}px`,
    left: '0px', top: `${floorY - 504 * officeWidth / 2172}px`,
  });
  const officeDoors = [
    { name: '사무실', room: 'corridor', x: 580, y: 236, width: 128 },
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
      addElevatorPanels(door);
      door.indicator = document.createElement('div');
      door.indicator.className = 'elevator-indicator';
      door.indicator.style.left = `${door.x + door.width / 2}px`;
      door.indicator.style.top = `${door.y - 32}px`;
      world.insertBefore(door.indicator, sprite);
      updateFloorIndicator(door);
    }
  }
  // Additional floors share an empty layout until their content is authored.
  const FLOOR17 = { id: 'f17', floor: 17, short: '17F', label: '17층 · 복도', header: '17F · 00:00', aria: '17층 복도' };
  const FLOORS = [-2, -1, ...Array.from({ length: 16 }, (_, index) => index + 1)].map(floor => {
    const short = floor < 0 ? `B${-floor}` : `${floor}F`;
    const label = floor < 0 ? `지하 ${-floor}층` : `${floor}층`;
    return { id: floor < 0 ? `b${-floor}` : `f${floor}`, floor, short, label,
      header: `${short} · 빈 층`, aria: label, width: 2400, background: '#252b2a', elevatorBank: 1000 };
  });
  const ALL_FLOORS = [FLOOR17, ...FLOORS];
  const ROOFTOP = { id: 'rooftop', floor: 18, label: '옥상', header: 'RF · 옥상', aria: '옥상', width: 2400, background: '#11191d' };
  const floorById = new Map([...ALL_FLOORS, ROOFTOP].map(entry => [entry.id, entry]));
  const rooftopBackground = new Image();
  rooftopBackground.src = 'assets/background/rooftop/rooftop.png';
  rooftopBackground.alt = '';
  rooftopBackground.draggable = false;
  Object.assign(rooftopBackground.style, {
    position: 'absolute', width: '2400px', height: `${724 * 2400 / 2172}px`,
    top: `${floorY - 504 * 2400 / 2172}px`, left: '0px', imageRendering: 'pixelated',
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
    for (let col = 0; col < Math.ceil(corridorWidth / 256); col++) {
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
  const body = Bodies.rectangle(640, floorY - 81, 40, 162, {
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
  let walkReady = false;
  let facing = 1;
  let grounded = false;
  let jumpQueued = false;
  let interactionTime = 0;
  let transitioning = false;
  let sceneTransition = null;
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

  function animate(distance, sprinting = false) {
    const running = grounded && sprinting && distance > .1 && runSheet.naturalWidth === 256 * runFrames && runSheet.naturalHeight === 256;
    const walking = grounded && walkReady && distance > .1 && !running;
    walkDistance = walking ? (walkDistance + distance) % (frameDistance * walkFrames) : 0;
    runDistance = running ? (runDistance + distance) % (runFrameDistance * runFrames) : 0;
    const state = !grounded ? (body.velocity.y < 0 ? 'jump' : 'fall') :
      interactionTime > 0 ? 'interact' : running ? 'run' : walking ? 'walk' : 'idle';
    const index = state === 'fall' ? 1 : state === 'interact' ? Number(interactionTime <= 240) :
      running ? Math.floor(runDistance / runFrameDistance) : walking ? Math.floor(walkDistance / frameDistance) : 0;
    sprite.dataset.state = state;
    sprite.dataset.frame = index;
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
    animate(Math.abs(body.position.x - oldX), sprinting);
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
    stage.inert = selectingFloor;
    cabin.inert = false;
    const previousFocus = cabin.contains(transition.focus) ? cabinReturnFocus : transition.focus;
    const focus = selectingFloor ? cabin : previousFocus?.isConnected && previousFocus !== document.body ? previousFocus : stage;
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
    if (config.id === 'rooftop') dynamicScene.append(rooftopBackground);
    const layout = [
      { kind: 'floor', x: 0, y: floorY, width: config.width, height: 150 },
      { kind: 'boundary', x: 0, y: 0, width: 32, height: worldHeight },
      { kind: 'boundary', x: config.width - 32, y: 0, width: 32, height: worldHeight },
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
    const sceneDoors = config.id === 'rooftop' ?
      [{ name: '17층 계단', type: 'stairs', x: 160, y: 232, width: 180 }] :
      elevatorCars.map((car, carIndex) => ({ name: car.name, type: 'elevator', carIndex,
        x: config.elevatorBank + carIndex * 260, y: 220, width: 200 }));
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
      doorList.push(door);
    });
    return { bodies, doors: doorList };
  }

  function performFloorChange(destId, carIndex = 0) {
    Composite.remove(engine.world, currentTerrain);
    dynamicScene.innerHTML = '';
    const dest = floorById.get(destId);
    currentSceneFloor = dest.floor;
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
      const built = buildDynamicScene(dest);
      currentTerrain = built.bodies;
      currentDoors = built.doors;
      Composite.add(engine.world, currentTerrain);
    }
    const arrivalDoor = currentDoors.find(door => carIndex === null ? door.type === 'stairs' : door.carIndex === carIndex);
    Body.setPosition(body, { x: arrivalDoor.x + 40, y: floorY - 81 });
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
    if (transitioning || selectingFloor) return;
    updateInteraction();
    if (!nearbyDoor) return;
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
