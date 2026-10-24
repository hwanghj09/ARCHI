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

// 첫 정전 컷씬이 끝나면(blackout.js의 finishBlackoutScene) 바로 이어지는 혼잣말. 플래시 쓰는 법과 옥상(태양광)을 알려 준다.
// 아래 목록과 따로 둔다: 목록은 앞 장면을 봐야 다음이 나오는데, 정전 컷씬 없이 정전된 저장·테스트에서 뒤 장면을 막지 않게.
const BLACKOUT_MONOLOGUE = { flag: 'story-blackout-seen', steps: [
  { say: '…앞이 하나도 안 보이네.', pose: 'look-back' },
  { say: '일단 휴대폰 플래시(F)라도 켜야겠다.', pose: 'think' },
  { say: '엘리베이터도 완전히 멈췄어. 건물 전체가 나간 건가?', pose: 'look-up' },
  { say: '그러고 보니 옥상에 태양광 패널이 있다고 들었는데…', pose: 'think' },
] };

// 추격이 끝난 뒤의 혼잣말. 층별 안내판은 수호가 직접 조사하게 둔다(objective.js의 '편의점은 몇 층?').
const F1_ANXIETY_LINES = ['정문엔 내 이름이 떠 있고, 나만 나갈 수 없게 되어 있어..',
  '으윽.. 야근해서 힘든 와중에 이런 일을 겪으니 너무 힘들다..',
  '항불안제라도 먹어야겠어..',
  '편의점이 몇 층이었더라?'];
// 1번 엘리베이터(층별 안내판 바로 옆) 문 가운데.
function f1EscapeX() {
  const door = currentDoors.find(entry => entry.type === 'elevator' && entry.carIndex === 0);
  return door.x + door.width / 2;
}

// 1층 도착 컷씬을 건너뛰면 추격이 끝난 뒤처럼 맞춘다: 수호는 1번 엘리베이터 앞, R-01은 도크 자리에서 순찰.
// 처음 쫓기는 컷씬에서 정신력이 한 번만 깎인다(로봇이 수호를 알아보는 순간, 건너뛰면 건너뛸 때).
let f1SanityHit = false;
function hitF1Sanity() {
  if (f1SanityHit) return;
  f1SanityHit = true;
  sanity = Math.min(sanity, f1EncounterSanity);
  refreshSanity();
}

function skipF1Chase() {
  hitF1Sanity();
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
  { // 어두운 1층에서 정문이 안 열리는 것을 확인한 뒤(f1-door-checked, objective.js): 나갈 길이 막혔다는 걸 깨닫고 안내 데스크를 떠올린다.
    flag: 'story-f1-door-seen', delay: 300,
    ready: () => collectedItems.has('f1-door-checked') && !collectedItems.has('f1-chase-ended') && !collectedItems.has('solar-app-installed'),
    steps: [
      { say: '전기가 없으니 자동문도 안 열리네..', pose: 'look-up' },
      { say: '비상계단도 잠겨 있었지. 휴대폰은.. 바깥 신호가 하나도 안 잡혀.', pose: 'anxious' },
      { say: '안내 데스크에 로비 전원을 켜는 방법이 적혀 있을지도 몰라.', pose: 'think' },
    ],
  },
  { // 정비 코드를 먼저 풀었으면 추격 없이 정문 차단을 확인하고 다음 이야기로 이어진다.
    flag: 'f1-chase-ended', delay: 1000,
    ready: () => room === 'dynamic' && dynamicFloorId === 'f1' && collectedItems.has('f17-emergency-linked') &&
      collectedItems.has('f1-robot-log') && floorHasLighting(1),
    lines: ['불은 들어왔는데.. 정문 화면에 "출입 차단 · 17F 정수호 · 명령 SYSTEM"?',
      '로봇은 정비 코드로 멈췄지만, 정문은 여전히 막혀 있어. 왜 내 이름이 떠 있는 거지?'],
  },
  { // 1층에 전력이 들어오고 1초 뒤(휴대폰 전력 앱): 정문 화면에 내 이름이 뜨고, 같은 전력으로 깨어난 R-01에게 쫓겨 엘리베이터 앞까지 달아난다.
    // 추격이 끝났다는 기록(f1-chase-ended)은 수호가 엘리베이터 앞에 닿을 때 guard-patrol.js가 남긴다.
    flag: 'story-anxiety-seen', delay: 1000, skip: skipF1Chase,
    ready: () => room === 'dynamic' && dynamicFloorId === 'f1' && collectedItems.has('f17-emergency-linked') &&
      !collectedItems.has('f1-chase-ended') && guardPatrol.door && guardPatrolPowered(guardPatrol),
    steps: [
      { say: '됐다, 불이 들어왔어. 이제 문만 열리면..', pose: 'relieved' },
      { cut: () => guardPatrol.x - 1000 },
      { walk: () => guardPatrol.x - 650 },
      { say: '정문 화면에.. "출입 차단 · 17F 정수호 · 명령 SYSTEM"?', pose: 'look-up' },
      { say: '왜 내 이름이 저기 떠 있는 거야?', pose: 'anxious' },
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
      { say: '그래서 정문은 왜 내 이름으로 막혀 있던 거지?', pose: 'look-back' },
      { say: '정문에 내 이름을 띄우고 로봇까지 세워 놨어.', pose: 'think' },
      { say: '그냥 고장이 아니라... 내가 정문으로 못 나가게 막은 거야.', pose: 'anxious' },
      { say: '경비 로봇은 건물 시스템이 명령을 내린다고 들었는데.', pose: 'think' },
      { say: '정문 화면엔 내 이름까지 떠 있었어. 오늘 밤 나를 건물 밖으로 못 나가게 해 둔 거야...', pose: 'anxious' },
      { say: '그 시스템을 만든 ARCHI 개발 팀을 조사해보자. 원인을 알면 멈출 방법도 있을 거야.', pose: 'think' },
    ],
  },
  { // 나갈 방법 찾기 목표 도중 12~15층 게이트에 출입증을 태우고, 그 조사창을 닫은 직후.
    flag: 'story-badge-seen', delay: 300, ready: () => collectedItems.has('story-gate-tagged'),
    steps: [
      { say: '아 맞다 나 일용직이었지', pose: 'badge' },
      { say: '일용직한테 야근시키는 이 @#$% 회사... 때려치든가 해야지..', pose: 'anxious' },
      { say: '그러고보니 옆자리 조현아 팀장, 16층 카페에 사원증을 맨날 두고 오던데..', pose: 'think' },
      { say: '잠깐 빌리지 뭐', pose: 'think' },
    ],
  },
  { // 거부당하기 전에 16층 사원증을 먼저 챙겨 와 게이트를 연 경우(story-gate-early, interaction.js). 위 컷씬과 같은 기록을 남긴다.
    flag: 'story-badge-seen', delay: 300, ready: () => collectedItems.has('story-gate-early'),
    steps: [
      { say: '일용직 출입증으론 안 열렸을 텐데..', pose: 'badge' },
      { say: '카페에서 조현아 팀장 사원증을 챙겨 두길 잘했다.', pose: 'relieved' },
    ],
  },
  { // 16층 Café에서 조현아 팀장의 사원증(f16-badge)을 챙기고 조사가 끝난 1초 뒤.
    flag: 'story-badge-got-seen', delay: 1000, ready: () => collectedItems.has('story-badge-seen') && collectedItems.has('f16-badge'),
    lines: ['이제 개발팀에 출입할 수 있겠어.'], pose: 'badge',
  },
  { // 12층 모델 평가실 야간 로그 단말기에서 분석을 마치고 단말기를 끈 뒤(f12-log-cutscene, log-puzzle.js).
    flag: 'story-log-seen', delay: 500, ready: () => collectedItems.has('f12-log-cutscene'),
    lines: ['이상해. 다른 날은 밤마다 성능이 높았는데...', '10월 7일에는 사람이 남아 있었어.', '누군가 보고 있으면 성능을 숨기는 건가?',
      '데이터 연구 본부라면 이런 패턴을 먼저 봤을지도 몰라.'],
  },
  { // 목표 '데이터 수집'이 끝나고(5층 연구 노트를 조사해 goal-f5-note를 얻고) 1초 뒤. 이 컷씬이 끝나면 '기록 재현'이 시작된다.
    flag: 'story-data-seen', delay: 1000, ready: () => collectedItems.has('story-log-seen') && collectedItems.has('goal-f5-note') && !collectedItems.has('f8-repro-record'),
    lines: ['ARCHI가 의도적으로 기록을 지운게 처음이 아니라고..?', '도대체 어떤 의도가 있는걸까..', '기록을 지운 당일 기록을 QA 실에서 재현해볼 수 있을거야.'],
  },
  // 아래는 층을 옮기기 직전의 혼잣말: 다음 층에 왜 가는지(무엇을 기대하는지)를 수호가 먼저 말한다. 다음 단계를 이미 끝냈으면 건너뛴다.
  { // 8층 재현 벤치를 마친 1초 뒤 → 7층 검증실.
    flag: 'story-repro-seen', delay: 1000, ready: () => collectedItems.has('f8-repro-record') && !collectedItems.has('f7-training-time-solved'),
    lines: ['사람도 없고 카메라도 꺼진 새벽 3시... 그때만 결함이 사라졌어.', '그 시간에 ARCHI는 전력을 어디서 끌어다 쓴 거지?',
      '7층 검증실의 망분리 백업 장비라면 지워지지 않은 기록이 남아 있을 거야.'],
  },
  { // 터미널로 ARCHI-MAIN의 외부 연결 기록을 확인하고(terminal.js) 컴퓨터를 나온 1초 뒤 → 13층 보안 자료실.
    flag: 'story-external-seen', delay: 1000, ready: () => collectedItems.has('f7-external-connection-solved') && !collectedItems.has('f13-backup-device'),
    lines: ['오늘 밤 처음으로 외부 서버에 연결했다고..?', '망분리된 건물에서 밖으로 나가려면 어딘가 통로가 있어야 해.',
      '13층 기술지원 보안 자료실에 원격지원 장비 백업이 있을 거야.'],
  },
  { // 13층 백업 장치를 챙겨 보안 자료실을 빠져나온 1초 뒤 → 같은 층 상황실 원격지원 PC(또는 1층 안내 데스크 PC).
    flag: 'story-device-seen', delay: 1000,
    ready: () => collectedItems.has('f13-backup-device') && !collectedItems.has('f17-usb-played') && !(room === 'dynamic' && dynamicFloorId === 'f13-secure'),
    lines: ['라벨에 "2F 03:00 리허설 사본"이라고 적혀 있었지..', '상황실 원격지원 PC는 장비 검증실 UPS에 물려 있었어. 거기서 열어 보자.'],
  },
  { // 2층 Harmony Hall에서 원본 리허설을 본 1초 뒤 → 지하.
    flag: 'story-rehearsal-seen', delay: 1000, ready: () => collectedItems.has('f2-projected') && !collectedItems.has('b1-elevator'),
    lines: ['312명 목소리 가운데 마지막이 나였어.', 'ARCHI가 내 목소리로 뭘 하려는 거지?', '모든 기록이 지하를 가리켜. 내려가 보자.'],
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
  f1SanityHit = false;
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
    hitF1Sanity();
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
