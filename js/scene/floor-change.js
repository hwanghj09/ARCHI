// 장면 교체: 17층 사무실과 복도 사이, 그리고 다른 층·방·옥상으로 이동.
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

function performFloorChange(destId, carIndex = 0, arrivalKey = null) {
  Composite.remove(engine.world, currentTerrain);
  dynamicScene.innerHTML = '';
  const dest = floorById.get(destId);
  currentSceneFloor = dest.floor;
  world.dataset.floor = String(currentSceneFloor);
  // 옥상 발전기(js/interaction/generator.js)로 켜 둔 층에 들어올 때만 전체적으로 밝아 보인다.
  world.dataset.powered = String(currentSceneFloor === poweredFloor);
  lightSwitch.hidden = currentSceneFloor !== 17;
  movingParts = [];
  activeCameras = [];
  activeCall = null;
  sequenceProgress.clear();
  timedBarriers.length = 0;
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
    activeCameras = built.cameras;
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
