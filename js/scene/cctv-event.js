// B1 방재 관제실 첫 입장 컷씬. 수호가 꺼진 모니터 벽 앞으로 저절로 걸어가(평소 걸음) 멈추면, 아홉 칸이 한꺼번에 지지직거리며
// 켜지는데 비치는 것은 잡음뿐이다(data-live="true", data-signal="on"). 카메라가 CCTV 한가운데로 확 빨려 들어가는 동안 귀를 찢는
// "삐——"가 울리다가, 뚝 끊기는 순간 충격음과 함께 브라운관 TV처럼 화면들이 칸마다 새빨갛게 질리며 가로 실선으로 납작해져 꺼지고
// (data-signal="collapse") 새빨간 빛이 화면 전체에 번쩍인다. 카메라는 확대된 그대로 지진처럼 흔들리며 화면 전체가 잠깐 어두워지고,
// 흔들림이 잦아든 뒤에야 천천히 물러난다. 그때부터 관제실에는 소름 끼치는 배경음(cctv-bgm, audio.js)이 깔린다. CCTV를 직접 보기
// 전까지 벽은 아홉 칸 모두 잡음이고, 벽을 조사해 CCTV를 켜면 칸마다 잡음 사이로 수호를 감시하던 화면이 드러난다(openFullImage).
// 정전 컷씬처럼 고정 시간 간격 시계를 쓰므로 숨은 탭에서는 멈춘다. 끝나거나 건너뛰거나 장면을 바꾸면 벽의 liveBy 물건을
// 챙겨 다시 재생하지 않는다.
// 같은 연출 틀(레터박스·자막·건너뛰기·입력 잠금)로 두 번째 컷씬인 소등(cctvSceneMode 'lights')도 돌린다: CCTV 화면을 처음 닫으면
// 수호가 "그동안 날 지켜본 거야?" 하고 중얼거린 뒤 불이 탁 나갔다가 붉은 비상등이 깜빡이며 켜지고, "불이 왜 꺼지는 거지?". 그 뒤로 이 방은 붉고 어두운 비상등 조명이다(alarmBy).
// 퍼즐은 나중에 얹는다.
const cctvScene = document.getElementById('cctv-scene');
const cctvCaption = document.getElementById('cctv-caption');
const cctvDim = document.getElementById('cctv-dim');
const cctvRoomId = 'b1-control';
const cctvLiveItem = 'b1-cctv-live';
// 첫 컷씬의 시각(ms). 걷는 시간은 거리에 따라 달라서(초당 200px), 화면이 켜지는 시각(cctvScreensAt)부터는 그 뒤로 센다:
// 켜짐(on, 1.2초) → +1200 "삐——"와 함께 빨려 들어감(plunge, 2.2초) → +3400 확대된 채로 화면이 꺼지며 쾅, 흔들림(lost, 1.2초)
// → +4600 천천히 물러남(settle, 2초) → 끝.
const cctvWalkSpeed = 200;
const cctvIntroSteps = { plunge: 1200, lost: 3400, settle: 4600, end: 6600 };
// 단계별 카메라 확대 배율과 따라붙는 빠르기. 벽으로 다가가다가 CCTV 한가운데로 빨려 들어가고, 꺼지는 순간에는 확대된 채로 흔들리며,
// 흔들림이 잦아든 뒤에야 천천히 물러난다.
const cctvZooms = { enter: [1, .03], walk: [1.08, .02], look: [1.16, .04], on: [1.2, .04], plunge: [2.1, .05], lost: [2.1, .09],
  settle: [1.2, .035] };
let cctvElapsed = 0;
let cctvStartX = 0;
let cctvStandX = 0;
let cctvScreensAt = 0;
let cctvStepDistance = 0;
let cctvWall = null;
let cctvBlocked = [];
// 전체 화면 CCTV를 처음 본 모니터 벽. 그 화면을 닫으면 소등 컷씬을 시작한다.
let cctvRevealWall = null;
let cctvSceneMode = 'intro';
// 처음 CCTV를 켜 본 전체 화면이 열려 있는 동안 참(cctvDreadPlaying).
let cctvFirstViewOpen = false;
// 소등 컷씬: CCTV를 닫으면 먼저 수호가 "그동안 날 지켜본 거야?" 하고 중얼거린다(watch) → 벽이 지직거리고(glitch, 0.7초) →
// 원래 조명이 탁 나가 1.6초 동안 캄캄하다(out) → 붉은 비상등이 형광등처럼 몇 번 깜빡이다 켜지고(back), "불이 왜 꺼지는 거지?".
// 어둠은 서서히 오가지 않고 한순간에 들어오고 한순간에 걷힌다.
const cctvLightsLength = 8600;
// 비상등이 들어오기 시작한 때부터 불이 꺼졌다 켜졌다 바뀌는 시각(ms): 켜짐 → 70 꺼짐 → 190 켜짐 → 240 꺼짐 → 440 켜짐 → 530 꺼짐 → 610 켜짐.
const cctvLightsFlicker = [70, 190, 240, 440, 530, 610];
const cctvLightsGlitchAt = 3000;
const cctvLightsOutAt = 3700;
const cctvLightsBackAt = 5300;
// 불이 나가는 순간 첫 대사는 지운다('').
const cctvLightsLines = [[400, '…뭐지. 그동안 계속 날 지켜보고 있었던 거야?'], [cctvLightsOutAt, ''], [6000, '뭐야… 불이 왜 꺼지는 거지?']];
// 첫 대사를 띄운 채 지직거리기 직전과 끝에서 멈추고 클릭하면 이어간다(scene-gate.js). 첫 컷씬(intro)에는 대사가 없어 멈추지 않는다.
const cctvLightsGate = createSceneGate(cctvScene, [cctvLightsGlitchAt, cctvLightsLength]);
// 소등 뒤 정신력이 한 번에 깎이는 양. 깎였는지는 cctvLightsOutItem으로 기억한다.
const cctvLightsSanityLoss = 35;
const cctvLightsSanityFloor = 30; // 소등으로는 이 아래로 떨어지지 않는다
const cctvLightsOutItem = 'b1-lights-out';

function shouldStartCctvScene() {
  return room === 'dynamic' && dynamicFloorId === cctvRoomId && !collectedItems.has(cctvLiveItem) && !cctvSceneActive &&
    !transitioning && !mainMenuActive && !restoringProgress && !selectingFloor && !usingComputer && !usingKeypad && !usingControl &&
    !usingPhone && !usingPowerPanel && !usingInspection;
}

// 방에 들어서는 순간(장면 전환이 밝아지기 전)부터 컷씬 화면으로 둔다: HUD가 잠깐 보였다 사라지지 않게 한다(floor-change.js).
function prepareCctvScene(destId) {
  if (destId === cctvRoomId && !collectedItems.has(cctvLiveItem)) world.dataset.cctvScene = 'enter';
  else if (!cctvSceneActive) delete world.dataset.cctvScene;
}

function cctvScenePhase(time) {
  if (time < 400) return 'enter';
  if (time < cctvScreensAt - 400) return 'walk';
  if (time < cctvScreensAt) return 'look';
  const since = time - cctvScreensAt;
  return since < cctvIntroSteps.plunge ? 'on' : since < cctvIntroSteps.lost ? 'plunge' : since < cctvIntroSteps.settle ? 'lost' : 'settle';
}

// 관제실의 소름 끼치는 배경음은 화면이 꺼지는 쾅부터 깔리고, 컷씬을 본 뒤로는 이 방에 있는 동안 계속된다.
function cctvBgmPlaying() {
  if (room !== 'dynamic' || dynamicFloorId !== cctvRoomId) return false;
  // 소등 컷씬에서는 불이 나가 있는 동안만 끊기고, 비상등이 돌아오면 다시 흐른다.
  if (cctvSceneActive && cctvSceneMode === 'lights') return cctvElapsed < cctvLightsOutAt || cctvElapsed >= cctvLightsBackAt;
  return cctvSceneActive ? cctvElapsed >= cctvScreensAt + cctvIntroSteps.lost : collectedItems.has(cctvLiveItem);
}

function startCctvScene() {
  cctvWall = currentDoors.find(door => door.liveBy === cctvLiveItem) || null;
  if (!cctvWall || cctvSceneActive) return;
  cctvSceneActive = true;
  clearEventsForCutscene();
  cctvSceneMode = 'intro';
  cctvElapsed = 0;
  cctvStepDistance = 0;
  cctvStartX = body.position.x;
  // 벽 한가운데에서 들어온 쪽으로 80px 앞에 선다. 평소 걸음으로 걸어가고, 멈춘 뒤 0.4초 올려다보면 화면이 켜진다.
  const center = cctvWall.x + cctvWall.width / 2;
  const side = cctvStartX < center ? -1 : 1;
  cctvStandX = center + 80 * side;
  cctvScreensAt = 400 + Math.abs(cctvStandX - cctvStartX) / cctvWalkSpeed * 1000 + 400;
  // 카메라는 CCTV 한가운데(가운데 칸)를 중심으로 확대한다.
  cameraFocus.x = center;
  cameraFocus.y = cctvWall.y + cctvWall.height / 2;
  openCctvOverlay();
  updateCctvScene(0);
}

// 두 컷씬이 함께 쓰는 연출 화면: 레터박스·자막·건너뛰기를 띄우고 나머지 화면의 입력을 막는다.
function openCctvOverlay() {
  cctvScene.hidden = false;
  cctvScene.dataset.mode = cctvSceneMode;
  cctvCaption.textContent = '';
  cctvBlocked = [...document.body.children].filter(el => el !== cctvScene && el.tagName !== 'SCRIPT' && !el.inert);
  for (const el of cctvBlocked) el.inert = true;
  releaseInput();
  Body.setVelocity(body, { x: 0, y: 0 });
  interactionTime = 0;
  hint.hidden = interactionOutline.hidden = true;
  document.getElementById('cctv-skip').focus({ preventScroll: true });
}

function updateCctvScene(elapsed) {
  if (cctvSceneMode === 'lights') {
    const before = cctvElapsed;
    cctvElapsed = cctvLightsGate.advance(cctvElapsed, elapsed);
    return updateCctvLights(cctvElapsed - before);
  }
  cctvElapsed += elapsed;
  const time = cctvElapsed;
  if (time >= cctvScreensAt + cctvIntroSteps.end) return finishCctvScene();
  const phase = cctvScenePhase(time);
  const direction = cctvStandX >= cctvStartX ? 1 : -1;
  if (world.dataset.cctvScene !== phase) {
    world.dataset.cctvScene = phase;
    // 아홉 칸이 한꺼번에 지지직 켜진다. 잡음은 켜져 있는 동안 밝다(data-signal="on").
    if (phase === 'on') {
      playGameSound('cctv-on');
      playGameSound('cctv-static');
      Object.assign(cctvWall.element.dataset, { live: 'true', signal: 'on' });
    }
    if (phase === 'plunge') playGameSound('cctv-beep');
    // "삐——"가 뚝 끊기며 쾅 소리와 함께 화면들이 새빨간 가로 실선으로 꺼진다. 그 뒤 잡음은 어두워진 채 남는다.
    if (phase === 'lost') {
      stopGameSound('cctv-beep');
      playGameSound('switch');
      playGameSound('cctv-hit');
      cctvWall.element.dataset.signal = 'collapse';
    }
    if (phase === 'settle') delete cctvWall.element.dataset.signal;
  }
  // 차오르는 웅웅거림(5.2초)은 걷기 시작할 때 틀어 화면이 꺼질 무렵 잦아든다.
  if (time >= 400 && time - elapsed < 400) playGameSound('cctv-rise');
  let x = cctvStandX;
  if (phase === 'enter') x = cctvStartX;
  else if (phase === 'walk') x = cctvStartX + direction * Math.min(Math.abs(cctvStandX - cctvStartX), (time - 400) * cctvWalkSpeed / 1000);
  const moved = Math.abs(x - body.position.x);
  if (phase === 'walk') {
    cctvStepDistance += moved;
    if (cctvStepDistance >= 92) {
      cctvStepDistance %= 92;
      playGameSound('step', { x });
    }
  }
  facing = direction;
  Body.setPosition(body, { x, y: floorY - 81 });
  grounded = true;
  animate(phase === 'walk' ? moved : 0, false, elapsed);
  if (phase !== 'walk') showCutscenePose(phase === 'lost' ? 'startled' :
    phase === 'settle' ? 'look-back' : phase === 'enter' ? 'alert' : 'look-up');
  // 카메라: 처음에는 수호를 따라가다가 벽 가운데로 옮겨 가며 확대한다. 화면이 꺼지는 순간(lost) 확대된 채로 가장 세게 흔들리고
  // 1.1초에 걸쳐 잦아든 뒤, 흔들림 없이 천천히 물러난다(settle).
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const target = phase === 'enter' ? cameraTarget() : Math.max(0, Math.min(worldWidth - viewWidth, cameraFocus.x - viewWidth / 2));
  cameraX += (target - cameraX) * (phase === 'enter' ? .13 : .05);
  const [zoom, ease] = reducedMotion ? [1, 1] : cctvZooms[phase];
  cameraZoom += (zoom - cameraZoom) * ease;
  const lost = time - cctvScreensAt - cctvIntroSteps.lost;
  const shake = reducedMotion || phase !== 'lost' ? 0 : 22 * Math.max(0, 1 - lost / 1100) ** 1.5;
  cameraShake.x = shake * Math.sin(time * .13) * Math.sin(time * .041 + 1);
  cameraShake.y = shake * .8 * Math.sin(time * .097 + 2);
  // 꺼지는 순간 새빨간 빛이 번쩍이고, 이어서 흔들리는 동안 화면 전체가 고르게 조금 어두워졌다가 탁 걷힌다(흔들림은 보이게).
  const flicker = !reducedMotion && lost > 540 && lost < 1000 && Math.sin(lost * .07) > .7 ? .1 : 0;
  if (phase !== 'lost') updateCctvDim(0);
  else if (lost < 450) updateCctvDim(.55 * (1 - lost / 450), 'red');
  else updateCctvDim(lost < 1050 ? .55 - flicker : 0);
}

// 화면 전체를 고르게 덮는 어둠(#cctv-dim)의 짙기(0~1). tint가 'red'면 검정 대신 붉은 빛이다.
function updateCctvDim(amount, tint = '') {
  cctvDim.style.opacity = String(amount);
  cctvDim.dataset.tint = tint;
}

function startCctvLights(wall) {
  if (cctvSceneActive || !wall?.element.isConnected) return;
  cctvSceneActive = true;
  clearEventsForCutscene();
  cctvSceneMode = 'lights';
  cctvElapsed = 0;
  cctvLightsGate.reset();
  cctvWall = wall;
  cameraFocus.x = wall.x + wall.width / 2;
  cameraFocus.y = wall.y + wall.height / 2;
  // 닫자마자 지지직거리지 않는다. 벽에는 방금 본 그림이 조용히 켜져 있다.
  wall.element.dataset.live = 'all';
  openCctvOverlay();
  updateCctvScene(0);
}

function cctvLightsPhase(time) {
  return time < cctvLightsGlitchAt ? 'watch' : time < cctvLightsOutAt ? 'glitch' : time < cctvLightsBackAt ? 'out' : 'back';
}

function updateCctvLights(elapsed) {
  const time = cctvElapsed;
  if (time >= cctvLightsLength) return finishCctvScene();
  const phase = cctvLightsPhase(time);
  if (world.dataset.cctvScene !== phase) {
    world.dataset.cctvScene = phase;
    if (phase === 'glitch') {
      cctvWall.element.dataset.glitch = 'true';
      playGameSound('cctv-static');
    }
    // 캄캄한 동안 붉은 비상등을 미리 켜 두어, 밝아질 때 그 빛 아래로 드러나게 한다.
    if (phase === 'out') {
      delete cctvWall.element.dataset.glitch;
      playGameSound('blackout');
      refreshRoomAlarm(floorById.get(dynamicFloorId));
    }
    if (phase === 'back') commitCctvLightsOut();
  }
  if (time >= cctvLightsOutAt + 800 && time - elapsed < cctvLightsOutAt + 800) playGameSound('heartbeat');
  cctvCaption.textContent = cctvLightsLines.filter(([at]) => time >= at).at(-1)?.[1] ?? '';
  // 수호는 벽 앞에 선 채다. 카메라는 그를 따라가며 벽 쪽으로 살짝 다가가고, 불이 나가는 순간 짧게 흔들린다.
  facing = cctvWall.x + cctvWall.width / 2 >= body.position.x ? 1 : -1;
  Body.setVelocity(body, { x: 0, y: 0 });
  grounded = true;
  animate(0, false, elapsed);
  showCutscenePose(phase === 'watch' ? 'look-up' : phase === 'glitch' ? 'alert' :
    phase === 'out' ? 'startled' : 'look-back');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  cameraX += (cameraTarget() - cameraX) * .13;
  cameraZoom += ((reducedMotion ? 1 : phase === 'back' ? 1.04 : 1.1) - cameraZoom) * .03;
  const out = time - cctvLightsOutAt;
  const shake = reducedMotion || phase !== 'out' ? 0 : 7 * Math.max(0, 1 - out / 350);
  cameraShake.x = shake * Math.sin(time * .13);
  cameraShake.y = shake * .7 * Math.sin(time * .097 + 2);
  // 불이 나가면 모니터 벽까지 꺼져 화면 전체가 캄캄하다. 비상등은 몇 번 깜빡이다 켜지고, 불이 들어올 때마다 딸깍 소리가 난다.
  // 움직임 줄이기 설정에서는 깜빡이지 않고 한 번에 켜진다.
  const back = time - cctvLightsBackAt;
  const flickerOff = phase === 'back' && !reducedMotion && cctvLightsFlicker.filter(at => back >= at).length % 2 === 1;
  if (phase === 'back' && [0, ...cctvLightsFlicker.filter((at, index) => index % 2 === 1)].some(at => back >= at && back - elapsed < at)) {
    playGameSound('switch');
  }
  updateCctvDim(phase === 'out' || flickerOff ? 1 : 0);
}

// 소등 결과를 한 번만 남긴다(건너뛰어도 같다): 붉은 비상등 조명이 남고, 지하(B1·B2)의 전등이 모두 꺼지고, 정신력이 한 번에 깎인다.
function commitCctvLightsOut() {
  refreshRoomAlarm(floorById.get(dynamicFloorId));
  if (collectedItems.has(cctvLightsOutItem)) return;
  collectedItems.add(cctvLightsOutItem);
  updatePowerState(); // 지하(B1·B2)의 전등이 모두 꺼진다(power.js)
  // 30% 이상이면 30% 밑으로는 떨어뜨리지 않고, 이미 30% 미만이면 그대로 둔다.
  if (sanity >= cctvLightsSanityFloor) sanity = Math.max(cctvLightsSanityFloor, sanity - cctvLightsSanityLoss);
  refreshSanity();
}

function finishCctvScene() {
  if (!cctvSceneActive) return;
  // 건너뛰거나 장면을 바꿔도 한 번 본 것으로 친다.
  cctvSceneActive = false;
  cctvLightsGate.reset();
  const lights = cctvSceneMode === 'lights';
  if (lights) {
    if (cctvWall?.element.isConnected) delete cctvWall.element.dataset.glitch;
    if (room === 'dynamic' && dynamicFloorId === cctvRoomId) commitCctvLightsOut();
  } else {
    // "삐——"가 남아 있으면(건너뛰기) 함께 끊는다. CCTV를 보기 전까지 벽은 아홉 칸 모두 어두운 잡음이다.
    collectedItems.add(cctvLiveItem);
    stopGameSound('cctv-beep');
    if (cctvWall?.element.isConnected) {
      cctvWall.element.dataset.live = 'true';
      delete cctvWall.element.dataset.signal;
    }
  }
  cctvCaption.textContent = '';
  cctvWall = null;
  cctvScene.hidden = true;
  cctvDim.style.opacity = '0';
  delete world.dataset.cctvScene;
  cameraShake.x = cameraShake.y = 0;
  for (const el of cctvBlocked) el.inert = false;
  cctvBlocked = [];
  Body.setVelocity(body, { x: 0, y: 0 });
  grounded = true;
  releaseInput();
  updateInteraction();
  stage.focus({ preventScroll: true });
}

// 설비 그림(fullImage)을 화면 전체에 띄운다. 조사창의 닫기·키 처리를 그대로 쓰고, 조사 문구는 그림 아래에 붙인다.
function openFullImage(door, message) {
  const figure = writingNode('figure', 'full-image');
  // 그림과 잡음을 같은 3:2 틀(.full-image-frame)에 겹쳐, 잡음이 그림 속 화면 칸에 정확히 맞게 한다.
  const stage = writingNode('div', 'full-image-stage');
  const frame = writingNode('div', 'full-image-frame');
  const image = new Image();
  image.src = door.fullImage;
  image.alt = door.imageAlt || '';
  image.draggable = false;
  // CCTV 모니터 벽(seenBy가 있는 설비)을 처음 켜면 칸마다 잡음이 덮고 있다가 지지직거리며 걷혀, 수호를 감시하던 화면이 드러난다
  // (.full-image-static, cctv-event.css).
  const first = Boolean(door.seenBy) && !collectedItems.has(door.seenBy);
  frame.append(image, ...(first ? [writingNode('span', 'full-image-static')] : []));
  stage.append(frame);
  figure.append(stage, writingNode('figcaption', 'full-image-caption', message));
  openItemPanel(door.name, message, 'full-image', figure);
  if (!first) return;
  playGameSound('cctv-static');
  // 한 번 본 뒤로는 관제실 벽에도 그 그림 전체가 켜진 채로 남는다. 전체 화면을 닫고 돌아오면 소등 컷씬이 시작된다(revealCctvWall).
  collectedItems.add(door.seenBy);
  cctvRevealWall = door;
  cctvFirstViewOpen = true;
}

// 처음 CCTV를 켜 보는 동안에는 관제실 배경음 대신 기괴하고 음산한 배경음(cctv-dread, audio.js)이 흐른다.
function cctvDreadPlaying() {
  return cctvFirstViewOpen && usingInspection;
}

// 전체 화면을 닫으면 closeInspection이 부른다. 벽이 지직거리며 그림 한 장 전체로 바뀌고 소등 컷씬이 시작된다.
function revealCctvWall() {
  const wall = cctvRevealWall;
  cctvRevealWall = null;
  cctvFirstViewOpen = false;
  startCctvLights(wall);
}

// 붉은 조명(#room-alarm): 방 설정의 alarmBy 물건을 챙긴 뒤로는 그 방에 붉고 어두운 조명을 덮는다. 배경 그림은 그대로 두고 화면 위에
// 곱하기로 방 전체에 고르게 비치며, 이따금 꺼졌다 켜진다.
function refreshRoomAlarm(config) {
  world.dataset.alarm = String(room === 'dynamic' && Boolean(config?.alarmBy) && collectedItems.has(config.alarmBy));
}

document.getElementById('cctv-skip').addEventListener('click', finishCctvScene);
