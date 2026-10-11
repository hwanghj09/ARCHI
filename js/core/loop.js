// 게임 루프: 고정 시간 간격(step)으로 update를 돌리고 매 프레임 render한다.
let previousTime = null;
let accumulator = 0;
let soundStepDistance = 0;

function update() {
  updateGameAudio(step);
  if (mainMenuActive) return;
  updatePhoneCharging(step);
  updateSanity(step);
  if (openingActive) { updateOpening(step); return; }
  if (blackoutSceneActive) { updateBlackoutScene(step); return; }
  if (storySceneActive) { updateStoryScene(step); return; }
  if (cctvSceneActive) { updateCctvScene(step); return; }
  if (playerCaught) {
    updateGuardPatrol(step);
    animate(0, false, step);
    cameraX += (cameraTarget() - cameraX) * .13;
    return;
  }
  if (hallucinationCaught) {
    animate(0, false, step);
    cameraX += (cameraTarget() - cameraX) * .13;
    return;
  }
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
  if (usingComputer || usingKeypad || usingPowerPanel || usingInspection) {
    updateElevators();
    updatePhone(step);
    if (usingPhone || phoneAwayTime > 0) animate(0, false, step);
    return;
  }
  updatePhone(step);
  const directions = [...keys].map(key => movementKeys[key]).concat([...pointers.values()]);
  if (pulseTime > 0) directions.push(pulseDirection);
  pulseTime = Math.max(0, pulseTime - step);
  const direction = itemUseTime > 0 ? 0 : Number(directions.includes(1)) - Number(directions.includes(-1));
  if (itemUseTime > 0) jumpQueued = false;
  const sprinting = !phoneLightOn && [...runKeys].some(key => keys.has(key));
  interactionTime = direction || jumpQueued ? 0 : Math.max(0, interactionTime - step);
  if (direction) facing = direction;
  const paceFactor = sanitySpeedFactor();
  const walkX = pushPushables(direction, direction * (sprinting ? runSpeed : speed) * paceFactor / 60);
  Body.setVelocity(body, { x: walkX, y: jumpQueued && grounded ? -10.8 : body.velocity.y });
  jumpQueued = false;
  const oldX = body.position.x;
  const wasGrounded = grounded;
  const fallingSpeed = body.velocity.y;
  Engine.update(engine, step);
  grounded = engine.pairs.list.some(pair => {
    if (!pair.isActive || (pair.bodyA !== body && pair.bodyB !== body)) return false;
    const normalY = pair.collision.normal.y * (pair.bodyA === body ? 1 : -1);
    return normalY < -.5;
  });
  const moved = Math.abs(body.position.x - oldX);
  if (grounded && moved > .1) {
    soundStepDistance += moved;
    if (soundStepDistance >= (sprinting ? 96 : 92)) {
      soundStepDistance %= sprinting ? 96 : 92;
      playGameSound('step', { running: sprinting, x: body.position.x });
    }
  } else soundStepDistance = 0;
  if (!wasGrounded && grounded && fallingSpeed > 3) playGameSound('step', { landing: true, x: body.position.x });
  animate(moved, sprinting, step);
  updateGuardPatrol(step);
  checkStoryScenes(step);
  updateElevators();
  updateInteraction();
  updateCall();
  updateTimedBarriers();
  updateCameras();
  cameraX += (cameraTarget() - cameraX) * .13;
  cameraX = Math.max(0, Math.min(Math.max(0, worldWidth - viewWidth), cameraX));
  // 컷씬이 끝나면 확대를 천천히 푼다.
  cameraZoom = Math.abs(cameraZoom - 1) < .001 ? 1 : cameraZoom + (1 - cameraZoom) * .12;
}

function frame(time) {
  if (!document.hidden) {
    accumulator += previousTime === null ? 0 : Math.min(time - previousTime, 100);
    while (accumulator >= step) {
      update();
      accumulator -= step;
    }
    render();
    refreshObjective();
  }
  previousTime = document.hidden ? null : time;
  requestAnimationFrame(frame);
}

