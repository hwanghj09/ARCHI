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
  let room = 'corridor';
  let returnX = 644;
  const worldHeight = 720;
  const floorY = 570;
  const elevatorFloorTime = 1200;
  const currentFloor = 17;
  const hint = document.getElementById('interaction-hint');
  const status = document.getElementById('interaction-status');
  const roomTransition = document.getElementById('room-transition');
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
  const doors = [
    { name: '1번 엘리베이터', type: 'elevator', x: 1818, y: 220, width: 218 },
    { name: '2번 엘리베이터', type: 'elevator', x: 2148, y: 220, width: 214 },
    { name: '3번 엘리베이터', type: 'elevator', x: 2444, y: 220, width: 216 },
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
      door.floor = 1;
      door.travelling = false;
      door.elapsed = 0;
      door.indicator = document.createElement('div');
      door.indicator.className = 'elevator-indicator';
      door.indicator.style.left = `${door.x + door.width / 2}px`;
      door.indicator.style.top = `${door.y - 32}px`;
      world.insertBefore(door.indicator, sprite);
      updateFloorIndicator(door);
    }
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
  let walkDistance = 0;
  let walkReady = false;
  let facing = 1;
  let grounded = false;
  let jumpQueued = false;
  let interactionTime = 0;
  let transitioning = false;
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

  function setDoorOpen(door, open) {
    door.element.dataset.open = String(open);
    door.element.setAttribute('aria-label', `${door.name} 문 ${open ? '열림' : '닫힘'}`);
  }

  function updateFloorIndicator(door) {
    door.indicator.textContent = `${door.travelling ? '↑ ' : ''}${String(door.floor).padStart(2, '0')}F`;
    door.indicator.setAttribute('aria-label', `${door.name} ${door.floor}층${door.travelling ? ' 상승 중' : ''}`);
  }

  function updateElevators() {
    for (const door of doors) {
      if (!door.travelling) continue;
      door.elapsed += step;
      if (door.elapsed < elevatorFloorTime) continue;
      door.elapsed -= elevatorFloorTime;
      door.floor++;
      if (door.floor === currentFloor) {
        door.travelling = false;
        setDoorOpen(door, true);
        showStatus(`${door.name}가 ${currentFloor}층에 도착했습니다.`);
      }
      updateFloorIndicator(door);
    }
  }

  function updateInteraction() {
    const activeDoors = room === 'corridor' ? [...doors, ...officeDoors.filter(door => door.room === room)] :
      officeDoors.filter(door => door.room === room);
    nearbyDoor = activeDoors.find(door => grounded && Math.abs(body.bounds.max.y - floorY) < 2 &&
      Math.abs(body.position.x - door.x - door.width / 2) < door.width / 2 + 28) || null;
    for (const door of [...doors, ...officeDoors]) door.element.classList.toggle('near', door === nearbyDoor);
    hint.hidden = !nearbyDoor;
    if (nearbyDoor) {
      hint.style.left = `${nearbyDoor.x + nearbyDoor.width / 2}px`;
      hint.style.top = `${nearbyDoor.y - (nearbyDoor.type === 'elevator' ? 72 : 42)}px`;
      hint.textContent = nearbyDoor.type === 'office' ? (room === 'corridor' ? 'E · 사무실 들어가기' : 'E · 복도로 나가기') :
        nearbyDoor.travelling ? '올라오는 중…' :
        nearbyDoor.element.dataset.open === 'true' ? 'E · 닫기' :
        nearbyDoor.type === 'elevator' && nearbyDoor.floor < currentFloor ? 'E · 호출' : 'E · 열기';
    }
  }

  function interact() {
    updateInteraction();
    if (!nearbyDoor || nearbyDoor.travelling) return;
    if (nearbyDoor.type === 'office') {
      changeRoom();
      return;
    }
    interactionTime = 420;
    facing = body.position.x <= nearbyDoor.x + nearbyDoor.width / 2 ? 1 : -1;
    animate(0);
    if (nearbyDoor.type === 'elevator' && nearbyDoor.floor < currentFloor) {
      nearbyDoor.travelling = true;
      updateFloorIndicator(nearbyDoor);
      showStatus(`${nearbyDoor.name}를 호출했습니다.`);
    } else {
      const open = nearbyDoor.element.dataset.open !== 'true';
      setDoorOpen(nearbyDoor, open);
      showStatus(`${nearbyDoor.name} 문을 ${open ? '열었습니다' : '닫았습니다'}.`);
    }
    updateInteraction();
  }

  window.addEventListener('keydown', event => {
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
      if (event.button !== 0 || transitioning) return;
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
      if (event.detail !== 0 || transitioning) return;
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
