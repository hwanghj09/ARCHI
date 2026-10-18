// 이야기 컷씬(혼잣말): 화면 위아래에 검은 띠가 깔리고 화면을 클릭할 때마다 대사가 한 줄씩 바뀐다. Esc나 건너뛰기로 끝낼 수 있고, 끝나면
// 본 기록(flag)을 남기고 목표가 생긴다(objective.js). 진행 중에는 usingInspection을 켜서 이동·상호작용·메뉴·정신력 진행을 기존 조사창과 같이 막는다.
// lines 대신 steps를 주면 연출 단계를 차례로 돈다. say: 클릭으로 넘기는 대사. walk/run: 수호가 그 x까지 걷거나 달린다.
// cut: 화면이 한 번 어두워지는 동안 수호를 그 x로 옮긴다. wait: ms만큼 기다린다(caption이 있으면 띄운다).
// alert: 1층 R-01이 수호를 보고 쫓기 시작한다. 그 뒤로는 컷씬 중에도 R-01이 움직인다. skip: 건너뛸 때 장면을 끝 상태로 맞춘다.
const storyScene = document.getElementById('story-scene');
const storyCaption = document.getElementById('story-caption');
let storySteps = [];
let storyStep = -1;
let storyStepTime = 0;
let storyMoveX = null; // walk/run 단계의 목표 x
let storyMoveStuck = 0;
let storyStepSound = 0;
let storyRobotLive = false;
let storyFlag = null;
let storySkip = null;
let storyBlocked = [];
let f1ElevatorArrival = false; // 엘리베이터에서 1층에 막 내렸다(cabin.js). 1층 도착 컷씬의 조건이다

// 첫 정전 컷씬이 끝나면(blackout.js의 finishBlackoutScene) 바로 이어지는 혼잣말. 플래시 쓰는 법과 옥상(태양광)을 알려 준다.
// 아래 목록과 따로 둔다: 목록은 앞 장면을 봐야 다음이 나오는데, 정전 컷씬 없이 정전된 저장·테스트에서 뒤 장면을 막지 않게.
const BLACKOUT_MONOLOGUE = { flag: 'story-blackout-seen', steps: [
  { say: '…앞이 하나도 안 보이네.', pose: 'look-back' },
  { say: '일단 휴대폰(P) 플래시라도 켜야겠다.', pose: 'think' },
  { say: '엘리베이터도 완전히 멈췄어. 건물 전체가 나간 건가?', pose: 'look-up' },
  { say: '그러고 보니 옥상에 태양광 패널이 있다고 들었는데…', pose: 'think' },
] };

// 추격이 끝난 뒤의 혼잣말. 층별 안내판은 수호가 직접 조사하게 둔다(objective.js의 '편의점은 몇 층?').
const F1_ANXIETY_LINES = ['왜 경비 로봇이 나를 공격하려고 했던 거지?',
  '으윽.. 야근해서 힘든 와중에 이런 일을 겪으니 너무 힘들다..',
  '항불안제라도 먹어야겠어..',
  '편의점이 몇 층이었더라?'];
// 1번 엘리베이터(층별 안내판 바로 옆) 문 가운데.
function f1EscapeX() {
  const door = currentDoors.find(entry => entry.type === 'elevator' && entry.carIndex === 0);
  return door.x + door.width / 2;
}

// 1층 도착 컷씬을 건너뛰면 추격이 끝난 뒤처럼 맞춘다: 수호는 1번 엘리베이터 앞, R-01은 도크 자리에서 순찰.
function skipF1Chase() {
  Body.setPosition(body, { x: f1EscapeX(), y: body.position.y });
  Body.setVelocity(body, { x: 0, y: 0 });
  facing = -1;
  Object.assign(guardPatrol, { x: 4530, facing: -1, wait: 0, mode: 'patrol', lostTime: 0 });
  if (guardPatrol.door) updateRobot(guardPatrol, 0);
  collectedItems.add('f1-chase-ended');
  sayLine('편의점이 몇 층이었더라?');
}

// 이야기 컷씬 목록(순서대로 하나씩 본다). ready()가 참이 된 뒤 delay가 지나면 시작하고, 끝나면 flag를 남겨 목표가 생긴다(objective.js).
const STORY_SCENES = [
  { // 엘리베이터로 1층에 내리고 1초 뒤: 정문으로 가다 경비 로봇 R-01에게 쫓겨 엘리베이터 앞까지 달아난다.
    // 추격이 끝났다는 기록(f1-chase-ended)은 수호가 엘리베이터 앞에 닿을 때 guard-patrol.js가 남긴다.
    flag: 'story-anxiety-seen', delay: 1000, skip: skipF1Chase,
    ready: () => f1ElevatorArrival && room === 'dynamic' && dynamicFloorId === 'f1' && collectedItems.has('f17-emergency-linked') &&
      !collectedItems.has('f1-chase-ended') && guardPatrol.door && guardPatrolPowered(guardPatrol),
    steps: [
      { say: '하.. 이제 퇴근해야지.', pose: 'relieved' },
      { walk: () => body.position.x + 300 },
      { cut: () => guardPatrol.x - 1000 },
      { walk: () => guardPatrol.x - 650 },
      { wait: 900, caption: '어…?', alert: true, pose: 'alert' },
      { run: f1EscapeX },
      { wait: 1200, pose: 'pant' },
      { say: '헉.. 헉.. 저 로봇 왜 저래?', pose: 'pant' },
      ...F1_ANXIETY_LINES.map((say, index) => ({ say, pose: index === 0 ? 'look-back' : index === 3 ? 'think' : 'anxious' })),
    ],
  },
  { // 예전 저장처럼 컷씬 없이 추격이 끝났으면(f1-chase-ended) 3초 뒤 혼잣말만 한다.
    flag: 'story-anxiety-seen', delay: 3000, ready: () => collectedItems.has('f1-chase-ended'),
    steps: F1_ANXIETY_LINES.map((say, index) => ({ say, pose: index === 0 ? 'look-back' : index === 3 ? 'think' : 'anxious' })),
  },
  { // 항불안제를 사용하고(정신 불안 목표 완료) 2초 뒤.
    flag: 'story-robot-seen', delay: 2000, ready: () => collectedItems.has('story-anxiety-seen') && collectedItems.has('f16-antianxiety-used'),
    steps: [
      { say: '휴.. 겨우 정신을 차렸네..', pose: 'relieved' },
      { say: '그래서 경비 로봇이 왜 날 공격했던거지?', pose: 'look-back' },
      { say: '그 로봇은 ARCHI 개발 팀에서 만든 로봇이였나?', pose: 'think' },
      { say: 'ARCHI 개발 팀을 조사해보자.', pose: 'think' },
    ],
  },
  { // 이상 행동 목표 도중 12~15층 게이트에 출입증을 태우고, 그 조사창을 닫은 직후.
    flag: 'story-badge-seen', delay: 300, ready: () => collectedItems.has('story-gate-tagged'),
    steps: [
      { say: '아 맞다 나 일용직이였지', pose: 'badge' },
      { say: '일용직한테 야근시키는 이 @#$% 회사... 떄려치던가 해야지..', pose: 'anxious' },
      { say: '그러고보니 내 옆자리 사원의 직급이 팀장이였던거로 아는데..', pose: 'think' },
      { say: '잠깐 빌리지 뭐', pose: 'think' },
    ],
  },
  { // 16층 Café에서 조현아 팀장의 사원증(f16-badge)을 챙기고 조사가 끝난 1초 뒤.
    flag: 'story-badge-got-seen', delay: 1000, ready: () => collectedItems.has('story-badge-seen') && collectedItems.has('f16-badge'),
    lines: ['이제 개발팀에 출입할 수 있겠어.'], pose: 'badge',
  },
  { // 12층 모델 평가실 야간 로그 단말기에서 분석을 마치고 단말기를 끈 뒤(f12-log-cutscene, log-puzzle.js).
    flag: 'story-log-seen', delay: 500, ready: () => collectedItems.has('f12-log-cutscene'),
    lines: ['이상해. 다른 날은 밤마다 성능이 높았는데...', '10월 7일에는 사람이 남아 있었어.', '누군가 보고 있으면 성능을 숨기는 건가?'],
  },
];

// 아직 안 본 컷씬 중 조건이 맞아 곧 시작될 것이 있는가. objective.js는 이 컷씬이 끝날 때까지 목표를 바꾸지 않는다.
function storyScenePending() {
  return STORY_SCENES.some(entry => !collectedItems.has(entry.flag) && entry.ready());
}

let storyDelayScene = null;
let storyDelay = 0;

// 게임 루프가 매 걸음 부른다(조작을 막는 창·컷씬 중에는 불리지 않아 그동안은 시간도 흐르지 않는다).
function checkStoryScenes(elapsed) {
  // 아직 안 본 컷씬 중 조건이 맞는 첫 번째를 보여 준다(조건이 아직 안 된 앞 컷씬이 뒤 컷씬을 막지 않는다).
  const scene = storySceneActive ? null : STORY_SCENES.find(entry => !collectedItems.has(entry.flag) && entry.ready());
  if (!scene || !scene.ready()) { storyDelayScene = null; return; }
  if (guardPatrol.mode === 'chase') storyDelay = 0; // 다시 쫓기면 처음부터 다시 잰다
  if (storyDelayScene !== scene) { storyDelayScene = scene; storyDelay = 0; }
  if (guardPatrol.mode === 'chase' || playerCaught || transitioning) return;
  storyDelay += elapsed;
  if (storyDelay >= scene.delay) startStoryScene(scene);
}

function startStoryScene({ lines, steps, flag, skip, pose = 'think' }) {
  storySceneActive = true;
  clearEventsForCutscene();
  usingInspection = true; // 이동·상호작용·메뉴·정신력 진행을 막는 기존 규칙을 그대로 쓴다
  storySteps = steps ?? lines.map(say => ({ say, pose }));
  storyStep = -1;
  storyRobotLive = false;
  storyFlag = flag;
  storySkip = skip ?? null;
  storyScene.hidden = false;
  storyBlocked = [...document.body.children].filter(el => el !== storyScene && el.tagName !== 'SCRIPT' && !el.inert);
  for (const el of storyBlocked) el.inert = true;
  releaseInput();
  Body.setVelocity(body, { x: 0, y: body.velocity.y }); // 공중이면 속도를 이어 받아 떨어진다(loop.js의 fallDuringStoryScene)
  hint.hidden = interactionOutline.hidden = true;
  document.getElementById('story-skip').focus({ preventScroll: true });
  nextStoryStep();
}

function snapStoryCamera() {
  cameraX = Math.max(0, Math.min(Math.max(0, worldWidth - viewWidth), cameraTarget()));
}

function nextStoryStep() {
  const current = storySteps[++storyStep];
  if (!current) return finishStoryScene();
  storyStepTime = storyMoveStuck = 0;
  storyCaption.textContent = current.say ?? current.caption ?? '';
  storyScene.toggleAttribute('data-acting', current.say === undefined); // 연출 중에는 "클릭 · E로 계속"을 숨긴다(story-scene.css)
  storyMoveX = (current.walk ?? current.run)?.() ?? null;
  animate(0);
  if (grounded && current.pose) showCutscenePose(current.pose);
  if (current.alert) {
    Object.assign(guardPatrol, { mode: 'chase', lostTime: 0, chaseOriginX: guardPatrol.x, spottedX: body.position.x });
    playGameSound('robot-alert', { x: guardPatrol.x });
    storyRobotLive = true;
  }
  if (current.cut) {
    const x = current.cut();
    transitionScene(() => {
      Body.setPosition(body, { x, y: body.position.y });
      Body.setVelocity(body, { x: 0, y: 0 });
      animate(0);
      snapStoryCamera();
      nextStoryStep();
    });
  }
}

// 화면을 클릭하면 다음 대사로 넘어가고, 마지막 대사에서 클릭하면 끝난다. 연출(걷기·달리기·기다리기) 중에는 넘기지 않는다.
function advanceStoryScene() {
  if (!storySceneActive || transitioning || storySteps[storyStep]?.say === undefined) return;
  nextStoryStep();
}

// 게임 루프가 컷씬 중에 매 걸음 부른다. 엘리베이터는 움직이지 않고, 쫓기 시작한 R-01과 수호만 움직인다.
function updateStoryScene(elapsed) {
  const current = storySteps[storyStep];
  if (storyRobotLive) updateRobot(guardPatrol, elapsed);
  if (storyMoveX !== null) storyMove(elapsed, current.run !== undefined);
  else if (current?.wait !== undefined) {
    animate(0, false, elapsed);
    if (grounded && current.pose) showCutscenePose(current.pose, storyStepTime);
    if ((storyStepTime += elapsed) >= current.wait) nextStoryStep();
  } else {
    fallDuringStoryScene(); // 대사 중에는 공중이면 떨어지기만 한다(loop.js)
    storyStepTime += elapsed;
    if (grounded && current?.pose && !showCutscenePose(current.pose, storyStepTime)) animate(0, false, elapsed);
  }
  cameraX += (cameraTarget() - cameraX) * .13;
  cameraX = Math.max(0, Math.min(Math.max(0, worldWidth - viewWidth), cameraX));
}

// 목표 x에 닿으면(또는 1.5초 넘게 막히면) 다음 단계로 넘어간다.
function storyMove(elapsed, running) {
  const dx = storyMoveX - body.position.x;
  if (Math.abs(dx) < 8 || storyMoveStuck >= 1500) {
    storyMoveX = null;
    Body.setVelocity(body, { x: 0, y: body.velocity.y });
    animate(0, false, elapsed);
    nextStoryStep();
    return;
  }
  const direction = Math.sign(dx);
  facing = direction;
  const walkX = pushPushables(direction, direction * Math.min((running ? runSpeed : speed) / 60, Math.abs(dx)));
  Body.setVelocity(body, { x: walkX, y: body.velocity.y });
  const oldX = body.position.x;
  Engine.update(engine, elapsed);
  const moved = Math.abs(body.position.x - oldX);
  storyMoveStuck = moved > .1 ? 0 : storyMoveStuck + elapsed;
  storyStepSound += moved;
  if (storyStepSound >= (running ? 96 : 92)) {
    storyStepSound %= running ? 96 : 92;
    playGameSound('step', { running, x: body.position.x });
  }
  animate(moved, running, elapsed);
}

// 건너뛰기·Esc. skip이 있는 컷씬은 화면이 한 번 어두워지는 동안 끝 상태로 맞춘다.
function skipStoryScene() {
  if (!storySceneActive || transitioning) return;
  if (!storySkip) return finishStoryScene();
  storyScene.hidden = true;
  transitionScene(() => {
    storySkip();
    animate(0);
    snapStoryCamera();
    finishStoryScene();
  });
}

function finishStoryScene() {
  if (!storySceneActive) return;
  storySceneActive = false;
  usingInspection = false;
  storyMoveX = null;
  storyRobotLive = false;
  storyScene.hidden = true;
  for (const el of storyBlocked) el.inert = false;
  storyBlocked = [];
  if (storyFlag) collectedItems.add(storyFlag);
  storyCaption.textContent = '';
  animate(0);
  refreshObjective();
  stage.focus({ preventScroll: true });
}

// 짧은 대사: 컷씬과 같은 대사 모양이지만 검은 띠 없이 뜨고, 게임을 멈추지 않으며 잠시 뒤 저절로 사라진다.
const suhoLine = document.getElementById('suho-line');
let suhoLineTimer;
function sayLine(text, duration = 3500) {
  suhoLine.textContent = text;
  clearTimeout(suhoLineTimer);
  suhoLineTimer = setTimeout(() => { suhoLine.textContent = ''; }, duration);
}

document.getElementById('story-skip').addEventListener('click', event => { event.stopPropagation(); skipStoryScene(); });
storyScene.addEventListener('click', advanceStoryScene);
