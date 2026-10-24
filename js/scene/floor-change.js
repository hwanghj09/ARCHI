// 장면 교체: 17층 사무실과 복도 사이, 그리고 다른 층·방·옥상으로 이동.
function performRoomChange() {
  setCrouching(false, true);
  if (blackoutSceneActive) finishBlackoutScene();
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
  document.querySelector('header span').textContent = entering ? '17F · 사무실' : '17F · 복도';
  rerollFearScreens(); // 사무실 ↔ 복도를 오갈 때마다 모니터 화면을 다시 뽑는다(sanity.js)
  updateInteraction();
  render();
}

function performFloorChange(destId, carIndex = 0, arrivalKey = null) {
  setCrouching(false, true);
  if (blackoutSceneActive) finishBlackoutScene();
  if (cctvSceneActive) finishCctvScene();
  cameraZoom = 1;
  if (playerCaught) releaseGuardCapture();
  if (hidingInVent) setVentHiding(false);
  stopVentPry();
  if (guardPatrol.mode !== 'dock') guardPatrol.mode = 'patrol';
  guardPatrol.lostTime = 0;
  guardPatrol.door = null;
  guardPatrol.image = null;
  Composite.remove(engine.world, currentTerrain);
  dynamicScene.innerHTML = '';
  const dest = floorById.get(destId);
  currentSceneFloor = dest.floor;
  world.dataset.floor = String(currentSceneFloor);
  updatePowerState();
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
  // 복도 출구가 없는 안쪽 방(13층 보안 자료실)은 'exit'로 불려도(저장 복원 등) 연결문 앞에 선다.
  const arrivalDoor = currentDoors.find(door => arrivalKey ? door.key === arrivalKey :
    carIndex === null ? door.type === 'stairs' : door.carIndex === carIndex) || currentDoors.find(door => door.key?.startsWith('link:'));
  Body.setPosition(body, { x: arrivalDoor.x + 40, y: floorY - 81 });
  Engine.clear(engine);
  world.style.width = `${worldWidth}px`;
  Body.setVelocity(body, { x: 0, y: 0 });
  grounded = true;
  interactionTime = 420;
  facing = dest.interior && arrivalDoor.x < worldWidth / 2 ? 1 : -1;
  // 어두운 방은 litBy 물건(예: 켜 둔 배터리 조명)을 챙긴 뒤로는 밝다.
  world.dataset.dark = String(Boolean(dest.dark) && !collectedItems.has(dest.litBy));
  // alarmBy 물건을 챙긴 방(B1 방재 관제실: CCTV를 본 뒤)은 붉고 어두운 조명이다(cctv-event.js).
  refreshRoomAlarm(dest);
  prepareCctvScene(destId);
  // brightness: 그 방만 어둡게(1보다 작게) 보이는 배율(B1 방재 관제실). 메뉴의 화면 밝기에 곱한다(main-menu.css의 #world).
  world.style.setProperty('--room-brightness', String(dest.brightness ?? 1));
  animate(0);
  cameraX = cameraTarget();
  stage.setAttribute('aria-label', `ARCHI ${dest.aria} 사이드뷰 스테이지`);
  document.querySelector('header span').textContent = dest.header;
  refreshSceneElevatorDoors();
  mountGuardPatrol();
  mountB2Robots();
  refreshPhone();
  rerollFearScreens(); // 장소를 옮길 때마다 모니터 화면을 다시 뽑는다(sanity.js)
  updateInteraction();
  render();
}
