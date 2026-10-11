// 17층 복도·사무실을 뺀 모든 장면(다른 층 복도, 방 내부, 옥상)을 층 데이터로 조립한다.
// 방은 복도 쪽 벽면 x..x+width를 차지한다. 방 안의 출구는 문 양옆 벽 길이의 비율을 복도에서 본 것과 같게 두어,
// 복도에서 문 옆에 방이 보이는 만큼 안에서도 같은 쪽에 공간이 있다. 출구 문 그림이 배경에 들어 있는 방은 exitX로
// 그 위치를 적고, 복도 쪽 문을 거기에 맞춘다. 방 안 폭도 층마다 복도 벽면 폭에 비례하게 잡는다.
function exitDoorX(outside, insideWidth, doorWidth) {
  const left = outside.doorX - outside.x;
  const right = outside.x + outside.width - outside.doorX - doorWidth;
  return Math.round(32 + (insideWidth - 64 - doorWidth) * left / (left + right));
}
const lockedStairsMessage = '비상계단 문이 잠겨 있다. 정전 중에는 열리지 않는 것 같다.';

function buildDynamicScene(config) {
  const bodies = [];
  const doorList = [];
  // 벽만 그린 배경은 실제 문을 유지한다. 기존 문 포함 배경(화장실)은 기존 art 모드를 쓴다.
  dynamicScene.dataset.art = config.backgroundWallsOnly ? 'walls' : String(Boolean(config.backgroundImage));
  for (const art of [config.backgroundImage].flat().filter(Boolean)) {
    const image = new Image();
    image.className = 'floor-background';
    setPowerBackground(image, art.src);
    image.alt = '';
    image.draggable = false;
    Object.assign(image.style, { left: `${art.left ?? 0}px`, width: `${art.width ?? config.width}px`, height: `${art.height}px`, top: `${art.top}px` });
    dynamicScene.append(image);
    addLuminousSigns(image, art.src);
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
      movable.pushable ? { isStatic: true } : { inertia: Infinity, friction: .9, frictionStatic: 1, frictionAir: .25, restitution: 0 });
    bodies.push(part);
    moving.push({ body: part, element, width: movable.width, height: movable.height, name: movable.name, pushable: movable.pushable });
  }
  // 통로를 막는 장애물(barriers, 예: 11층 방화셔터)은 충돌체이면서 조사할 수 있다. requires 물건을 챙긴 뒤 조사하면
  // gives를 챙기며 걷히고, 그 뒤로 층을 다시 그릴 때는 충돌체 없이 걷힌 모양(data-open)으로 그린다. sound가 있으면 걷힐 때
  // 사용음 대신 그 효과음을 낸다(방화셔터는 'shutter').
  for (const barrier of config.barriers || []) {
    const open = collectedItems.has(barrier.gives);
    const element = document.createElement('div');
    element.className = `barrier ${barrier.style || ''}`.trim();
    element.dataset.open = String(open);
    if (barrier.accessGate) {
      const glass = document.createElement('div');
      glass.className = 'access-glass';
      const reader = document.createElement('span');
      reader.className = 'access-reader';
      reader.textContent = `${config.short} · ID`;
      element.append(glass, reader);
    }
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', barrier.name);
    Object.assign(element.style, { left: `${barrier.x}px`, top: `${barrier.y}px`, width: `${barrier.width}px`,
      height: `${floorY - barrier.y}px` });
    if (barrier.sprite) {
      const image = new Image();
      image.src = barrier.sprite;
      image.alt = '';
      image.draggable = false;
      element.append(image);
      element.dataset.sprite = 'true';
    }
    dynamicScene.append(element);
    const solid = open ? null : Bodies.rectangle(barrier.x + barrier.width / 2, (barrier.y + floorY) / 2,
      barrier.width, floorY - barrier.y, { isStatic: true });
    if (solid) bodies.push(solid);
    doorList.push({ ...barrier, type: 'inspect', element, solid });
  }
  if (config.id === 'rooftop') {
    const supply = document.createElement('div');
    supply.className = 'solar-supply';
    supply.dataset.active = String(solarEnabled);
    supply.setAttribute('role', 'img');
    supply.setAttribute('aria-label', `태양광 임시 전력장치 · ${solarEnabled ? '전원 켜짐' : '전원 꺼짐'}`);
    // The first 887px cell has transparent padding; its bottom edge is y=691.
    Object.assign(supply.style, { left: '720px', top: `${floorY - 691 * 360 / 887}px` });
    const image = new Image();
    image.src = 'assets/objects/power/solar-supply-off-on.png';
    image.alt = '';
    image.draggable = false;
    supply.append(image);
    dynamicScene.append(supply);
    doorList.push({ name: '태양광 발전기', type: 'power', element: supply, x: 720, y: 250, width: 360,
      outline: spriteOutline(image.getAttribute('src'), 720, floorY - 691 * 360 / 887, 360, 360) });
  }
  if (config.interior) {
    const backdrop = document.createElement('div');
    backdrop.className = ['room-interior', config.windowless && 'windowless', config.interiorStyle].filter(Boolean).join(' ');
    // 방 벽 그림은 상자·계단식 좌석·장애물보다 뒤에 깐다(바닥과 끝벽보다는 앞). 그래야 넘어갈 것이 보인다.
    dynamicScene.insertBefore(backdrop, dynamicScene.querySelector('.solid:not(.floor):not(.boundary), .barrier'));
    // 출구는 복도 문 크기·모양·벽 비율을 따른다. 공통 내부 그림은 exitX/exitStyle로 그림에 맞춘다.
    const parent = floorById.get(config.parent);
    // inner 방(inner: true)은 복도 쪽 전면이 없어 출구도 없고, 옆방과의 연결문(links)으로만 드나든다.
    const outside = parent.rooms.find(entry => entry.target === config.id);
    if (outside) {
      const doorWidth = config.exitWidth ?? outside.doorWidth ?? 120;
      const exitX = config.exitX ?? exitDoorX(outside, config.width, doorWidth);
      const exitY = outside.doorY ?? parent.roomDoorY ?? 250;
      // 반복 가구 배경에는 실제 출입 공간이 없다. 지정한 방만 기존 벽 모듈로 문 주변을 비운다.
      if (config.exitWall) {
        const wall = document.createElement('div');
        wall.className = 'floor-exit-wall';
        const left = Math.max(32, exitX - 16);
        Object.assign(wall.style, { left: `${left}px`, top: `${exitY - 20}px`,
          width: `${Math.min(config.width - 32, exitX + doorWidth + 16) - left}px`,
          height: `${floorY - exitY + 20}px`, backgroundPosition: `0px ${20 - exitY}px` });
        dynamicScene.append(wall);
      }
      // exitLock: 들어오면 등 뒤에서 잠기는 출구(7층 검증실). until 물건을 챙기면 그 자리에서 풀린다(lockedUntil).
      // raiseMessage: 안에서만 여는 셔터(16층 CU)를 처음 올리고 나갈 때의 문구. 연출은 interaction.js가 한다.
      const lock = config.exitLock;
      doorList.push(addRoomDoor({ name: '복도', type: 'room', hint: 'E · 복도로 나가기', target: config.parent,
        arrivalKey: `room:${config.id}`, key: 'exit', x: exitX,
        y: exitY, width: doorWidth, style: config.exitStyle ?? outside.doorStyle, sprite: outside.doorSprite,
        unlocked: collectedItems.has(outside.unlockedBy), raiseMessage: outside.raiseMessage,
        locked: Boolean(lock) && !collectedItems.has(lock.until), lockedUntil: lock?.until, message: lock?.message,
        surface: lock?.surface, look: lock?.look, writing: lock?.writing, caption: lock?.caption, image: lock?.image,
        outline: config.exitOutline }));
    }
    // 벽을 맞댄 방끼리의 연결문(links, 16층 주방 반입문): 복도를 거치지 않고 옆방에 있는 짝 연결문 앞으로 나온다. 다른 층의 방과도
    // 이을 수 있고, 그때는 hint로 안내 문구를 바꾼다.
    for (const link of config.links || []) {
      const next = floorById.get(link.target);
      doorList.push(addRoomDoor({ name: next.name, type: 'room', hint: link.hint ?? `E · ${next.name} 들어가기`, target: link.target,
        arrivalKey: `link:${config.id}`, key: `link:${link.target}`, x: link.x, y: link.y ?? 250,
        width: link.width ?? 120, style: link.style, sprite: link.sprite, outline: link.outline }));
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
      surface: roomConfig.surface, look: roomConfig.look, writing: roomConfig.writing, caption: roomConfig.caption, image: roomConfig.image,
      unlocked: collectedItems.has(roomConfig.unlockedBy),
      code: roomConfig.code, codeMessage: roomConfig.codeMessage, unlockedBy: roomConfig.unlockedBy,
      target: roomConfig.target, arrivalKey: 'exit', key: `room:${roomConfig.target}`,
      x: roomConfig.doorX, y: roomConfig.doorY ?? config.roomDoorY ?? 250, width: roomConfig.doorWidth ?? 120,
      style: roomConfig.doorStyle, sprite: roomConfig.doorSprite, outline: roomConfig.doorOutline }));
  }
  // 벽에 붙은 설비(fixtures: 1층 층별 안내판·정문처럼 소품 그림이 없는 것)는 CSS로 그리고 lines를 글줄로 넣는다.
  // 충돌은 없고, message가 있으면 조사할 수 있다(requires·gives·code·opens도 소품처럼 쓴다). requires가 있는 설비는 그 물건을
  // 다 챙겼는지를 data-ready로 그린다(2층 객석 스크린: 영사실 영사기를 돌려야 화면이 비친다).
  for (const fixture of config.fixtures || []) {
    const element = document.createElement('div');
    element.className = `fixture ${fixture.style || ''}`.trim();
    if (fixture.requires) element.dataset.requires = [].concat(fixture.requires).join('|');
    if (fixture.hideWhenTaken && fixture.gives) element.dataset.hiddenBy = fixture.gives;
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', fixture.name);
    Object.assign(element.style, { left: `${fixture.x}px`, top: `${fixture.y}px`, width: `${fixture.width}px`,
      height: `${fixture.height ?? floorY - fixture.y}px` });
    for (const line of fixture.lines || []) {
      const text = document.createElement('span');
      text.textContent = line;
      element.append(text);
    }
    // 모니터 벽(B1 CCTV, cctv-event.css): liveBy 물건을 챙긴 뒤로는 칸마다 어두운 잡음이 흐르고(data-live), 전체 화면으로 한 번 본 뒤
    // (seenBy)로는 벽 전체가 켜져 있다(data-live="all").
    if (fixture.liveBy) element.dataset.live = collectedItems.has(fixture.seenBy) ? 'all' : String(collectedItems.has(fixture.liveBy));
    dynamicScene.append(element);
    if (!fixture.message) continue;
    // 그림에 그려진 장치(단면 에셋 층)도 소품처럼 sequence·ring·cycle을 쓸 수 있다(아래 소품 설명 참고).
    const sequence = fixture.sequence && config.sequences.find(entry => entry.id === fixture.sequence);
    if (sequence && collectedItems.has(sequence.gives)) element.dataset.done = 'true';
    if (fixture.cycle) element.dataset.state = String(cycleState(fixture.cycle));
    const fixtureDoor = { ...fixture, type: 'inspect', element, sequence: sequence && { ...sequence, step: fixture.step },
      ring: fixture.ring && !collectedItems.has(fixture.gives) ? { ...fixture.ring, elapsed: 0, state: 'waiting' } : null };
    // 패널 위 설명서는 겹치는 발전기보다 먼저 조사할 수 있어야 한다.
    if (config.id === 'rooftop' && fixture.style === 'power-notice') doorList.unshift(fixtureDoor);
    else doorList.push(fixtureDoor);
  }
  refreshReady();
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
    const left = prop.x - width / 2 * scale;
    const top = floorY - base - (height - 8) * scale;
    Object.assign(element.style, { left: `${left}px`, top: `${top}px`, width: `${prop.worldWidth}px`, height: `${height * scale}px` });
    const src = prop.sprite || `assets/objects/floor-kit/${prop.file}.png`;
    const image = new Image();
    image.src = src;
    image.alt = '';
    image.draggable = false;
    element.append(image);
    dynamicScene.append(element);
    if (prop.sprite) {
      element.style.overflow = 'hidden';
      image.style.width = `${(prop.frames || 2) * 100}%`;
      element.dataset.spriteFrames = prop.frames || 2;
      if (prop.stateBy) element.dataset.stateBy = prop.stateBy;
      if (prop.poweredSprite) element.dataset.poweredSprite = 'true';
      element.dataset.spriteFrame = prop.spriteFrame || 0;
    }
    if (!prop.message) continue;
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', prop.name);
    // sequence: 방의 sequences 중 하나에 step번째로 속한다. ring: 방에 들어온 뒤 after ms에 울리기 시작해 duration ms 동안
    // 울리는 전화이고, 울리는 동안 받아야 message와 gives를 준다. 둘 다 장면을 그릴 때마다 처음 상태로 돌아간다.
    const sequence = prop.sequence && config.sequences.find(entry => entry.id === prop.sequence);
    if (sequence && collectedItems.has(sequence.gives)) element.dataset.done = 'true';
    // cycle: 조사할 때마다 출력 칸이 바뀌는 선택기(4층 UPS). 지금 칸 번호를 data-state로 그린다.
    if (prop.cycle) element.dataset.state = String(cycleState(prop.cycle));
    doorList.push({ name: prop.name, type: 'inspect', message: prop.message, gives: prop.gives,
      takenMessage: prop.takenMessage, darkMessage: prop.darkMessage, requires: prop.requires,
      missingMessage: prop.missingMessage, partialMessage: prop.partialMessage, element, standY: floorY - base,
      code: prop.code, codePrompt: prop.codePrompt, cycle: prop.cycle, opens: prop.opens,
      animation: prop.animation, poweredSprite: prop.poweredSprite,
      surface: prop.surface || WRITING_SURFACE_BY_FILE[prop.file], look: prop.look, writing: prop.writing, caption: prop.caption,
      image: prop.image, missingSheet: prop.missingSheet, takenSheet: prop.takenSheet,
      sequence: sequence && { ...sequence, step: prop.step },
      ring: prop.ring && !collectedItems.has(prop.gives) ? { ...prop.ring, elapsed: 0, state: 'waiting' } : null,
      x: prop.x - prop.worldWidth / 2, y: top, width: prop.worldWidth,
      // 근접 테두리는 캔버스가 아니라 그림이 차지하는 상자를 감싼다(그림이 배경과 어긋나면 prop.outline으로 덮어쓴다).
      outline: prop.outline || spriteOutline(src, left, top, prop.worldWidth, height * scale) });
  }
  // 감시 카메라(cameras, B2 복도): 카메라와 시야를 그리고 지키는 방 문을 찾아 둔다. 돌아가기와 발각은 cctv.js가 맡는다.
  refreshReady();
  const cameras = buildCameras(config, doorList);
  // elevatorOffsets/elevatorWidthDeltas: 층 그림 속 엘리베이터 벽감이 BUILDING_CORE 좌표와 어긋날 때, 그 층만
  // 상호작용 가능한 엘리베이터(문·판정)의 위치·폭을 보정한다(다른 층의 BUILDING_CORE 좌표는 그대로 둔다).
  // elevatorYDeltas/elevatorHeightDeltas: 같은 목적으로 세로 위치·높이를 보정한다(음수 Y델타는 위로 올림,
  // 델타는 바닥선에 매인 기본 높이에 더해지므로 둘을 함께 주면 문 아래쪽(바닥에 닿는 자리)도 따라 움직인다).
  // hiddenElevators: 그 층에서만 특정 엘리베이터(carIndex)를 통째로 뺀다(임시 확인용).
  // stairsOffset/stairsWidthDelta/stairsYDelta/stairsHeightDelta: elevatorOffsets와 같은 목적으로,
  // 그 층 그림 속 비상계단 벽감이 BUILDING_CORE.stairs 좌표와 어긋날 때만 그 층의 판정 위치·크기를
  // 보정한다(다른 층은 그대로).
  const sceneDoors = config.id === 'rooftop' ?
    [{ name: '17층 계단', type: 'stairs', x: 160, y: 232, width: 180 }] : !isFloor ? [] : [
      ...BUILDING_CORE.elevators
        .map((car, carIndex) => ({ name: elevatorCars[carIndex].name, type: 'elevator', carIndex,
        x: car.x + (config.elevatorOffsets?.[carIndex] ?? 0),
        y: BUILDING_CORE.elevatorY + (config.elevatorYDeltas?.[carIndex] ?? 0),
        width: car.width + (config.elevatorWidthDeltas?.[carIndex] ?? 0),
        height: floorY - BUILDING_CORE.elevatorY + (config.elevatorHeightDeltas?.[carIndex] ?? 0) }))
        .filter(door => !(config.hiddenElevators || []).includes(door.carIndex)),
      { name: '비상계단', type: 'stairs', locked: true, message: lockedStairsMessage, ...BUILDING_CORE.stairs,
        x: BUILDING_CORE.stairs.x + (config.stairsOffset ?? 0), width: BUILDING_CORE.stairs.width + (config.stairsWidthDelta ?? 0),
        y: BUILDING_CORE.stairs.y + (config.stairsYDelta ?? 0),
        height: floorY - BUILDING_CORE.stairs.y + (config.stairsHeightDelta ?? 0) },
    ];
  const coreDoors = [];
  sceneDoors.forEach(door => {
    door.element = document.createElement('div');
    door.element.className = 'door';
    door.element.dataset.open = 'false';
    door.element.setAttribute('role', 'img');
    Object.assign(door.element.style, {
      left: `${door.x}px`, top: `${door.y}px`, width: `${door.width}px`, height: `${door.height ?? floorY - door.y}px`,
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
  return { bodies, doors: [...coreDoors, ...doorList], moving, cameras };
}
