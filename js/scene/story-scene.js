// 이야기 컷씬(혼잣말): 화면 위아래에 검은 띠가 깔리고 화면을 클릭할 때마다 대사가 한 줄씩 바뀐다. Esc나 건너뛰기로 끝낼 수 있고, 끝나면
// 본 기록(flag)을 남기고 목표가 생긴다(objective.js). 진행 중에는 usingInspection을 켜서 이동·상호작용·메뉴·정신력 진행을 기존 조사창과 같이 막는다.
const storyScene = document.getElementById('story-scene');
const storyCaption = document.getElementById('story-caption');
let storyLines = [];
let storyFlag = null;
let storyLineShown = -1;
let storyBlocked = [];
let storyWalkTo = null; // 대사가 끝나면 걸어가서 조사할 대상 이름(walkTo)
let storyWalkX = null; // 걸어가는 중이면 목표 x
let storyWalkStuck = 0;
let storyInspectPending = false; // 건너뛰어 대상 앞으로 옮긴 뒤, 화면이 다 밝아지면 조사한다

// 첫 정전 컷씬이 끝나면(blackout.js의 finishBlackoutScene) 바로 이어지는 혼잣말. 플래시 쓰는 법과 옥상(태양광)을 알려 준다.
// 아래 목록과 따로 둔다: 목록은 앞 장면을 봐야 다음이 나오는데, 정전 컷씬 없이 정전된 저장·테스트에서 뒤 장면을 막지 않게.
const BLACKOUT_MONOLOGUE = { flag: 'story-blackout-seen',
  lines: ['…앞이 하나도 안 보이네.',
    '일단 휴대폰 플래시(F)라도 켜야겠다.',
    '엘리베이터도 완전히 멈췄어. 건물 전체가 나간 건가?',
    '그러고 보니 옥상에 태양광 패널이 있다고 들었는데…'] };

// 이야기 컷씬 목록(순서대로 하나씩 본다). ready()가 참이 된 뒤 delay가 지나면 시작하고, 끝나면 flag를 남겨 목표가 생긴다(objective.js).
const STORY_SCENES = [
  { // 1층 경비 로봇의 추격이 끝나고 3초 뒤. 추격이 끝났다는 기록(f1-chase-ended)은 guard-patrol.js가 남긴다.
    // 대사를 다 넘기면 수호가 층별 안내판 앞까지 걸어가 조사하고, 그 조사창이 뜨면 컷씬이 끝난다(walkTo).
    flag: 'story-anxiety-seen', delay: 3000, ready: () => collectedItems.has('f1-chase-ended'), walkTo: '층별 안내판',
    lines: ['왜 경비 로봇이 나를 공격하려고 했던 거지?',
      '으윽.. 야근해서 힘든 와중에 이런 일을 겪으니 너무 힘들다..',
      '우리 사내 편의점에서 항불안제를 팔았던가?',
      '편의점이 몇 층이었더라?'],
  },
  { // 항불안제를 사용하고(정신 불안 목표 완료) 2초 뒤.
    flag: 'story-robot-seen', delay: 2000, ready: () => collectedItems.has('story-anxiety-seen') && collectedItems.has('f16-antianxiety-used'),
    lines: ['휴.. 겨우 정신을 차렸네..',
      '그래서 경비 로봇이 왜 날 공격했던거지?',
      '그 로봇은 ARCHI 개발 팀에서 만든 로봇이었나?',
      'ARCHI 개발 팀을 조사해보자.'],
  },
  { // 이상 행동 목표 도중 12~15층 게이트에 출입증을 태우고, 그 조사창을 닫은 직후.
    flag: 'story-badge-seen', delay: 300, ready: () => collectedItems.has('story-gate-tagged'),
    lines: ['아 맞다 나 일용직이었지',
      '일용직한테 야근시키는 이 @#$% 회사... 때려치든가 해야지..',
      '그러고보니 내 옆자리 사원의 직급이 팀장이었던 걸로 아는데..',
      '잠깐 빌리지 뭐'],
  },
  { // 16층 Café에서 조현아 팀장의 사원증(f16-badge)을 챙기고 조사가 끝난 1초 뒤.
    flag: 'story-badge-got-seen', delay: 1000, ready: () => collectedItems.has('story-badge-seen') && collectedItems.has('f16-badge'),
    lines: ['이제 개발팀에 출입할 수 있겠어.'],
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
  if (storyInspectPending) { storyInspectPending = false; interact(); return; }
  // 아직 안 본 컷씬 중 조건이 맞는 첫 번째를 보여 준다(조건이 아직 안 된 앞 컷씬이 뒤 컷씬을 막지 않는다).
  const scene = storySceneActive ? null : STORY_SCENES.find(entry => !collectedItems.has(entry.flag) && entry.ready());
  if (!scene || !scene.ready()) { storyDelayScene = null; return; }
  if (guardPatrol.mode === 'chase') storyDelay = 0; // 다시 쫓기면 처음부터 다시 잰다
  if (storyDelayScene !== scene) { storyDelayScene = scene; storyDelay = 0; }
  if (guardPatrol.mode === 'chase' || playerCaught || transitioning) return;
  storyDelay += elapsed;
  if (storyDelay >= scene.delay) startStoryScene(scene);
}

function showStoryLine(index) {
  storyLineShown = index;
  storyCaption.textContent = storyLines[index];
}

function startStoryScene({ lines, flag, walkTo }) {
  storySceneActive = true;
  clearEventsForCutscene();
  storyWalkTo = walkTo ?? null;
  storyWalkX = null;
  usingInspection = true; // 이동·상호작용·메뉴·정신력 진행을 막는 기존 규칙을 그대로 쓴다
  storyLines = lines;
  storyFlag = flag;
  storyScene.hidden = false;
  storyBlocked = [...document.body.children].filter(el => el !== storyScene && el.tagName !== 'SCRIPT' && !el.inert);
  for (const el of storyBlocked) el.inert = true;
  releaseInput();
  Body.setVelocity(body, { x: 0, y: body.velocity.y }); // 공중이면 속도를 이어 받아 떨어진다(loop.js의 fallDuringStoryScene)
  hint.hidden = interactionOutline.hidden = true;
  document.getElementById('story-skip').focus({ preventScroll: true });
  showStoryLine(0);
}

// 화면을 클릭하면 다음 대사로 넘어가고, 마지막 대사에서 클릭하면 끝난다.
function advanceStoryScene() {
  if (!storySceneActive || transitioning) return;
  if (storyWalkX !== null) return; // 걸어가는 동안에는 클릭으로 넘기지 않는다
  if (storyLineShown + 1 >= storyLines.length) return storyWalkTo ? startStoryWalk() : finishStoryScene();
  showStoryLine(storyLineShown + 1);
}

// walkTo: 대사를 다 넘기면 대사창을 내리고 수호가 대상 앞까지 걷는다. 대상이 이 층에 없으면 그냥 끝낸다.
function startStoryWalk() {
  const target = currentDoors.find(door => door.name === storyWalkTo);
  if (!target) return finishStoryScene();
  storyWalkX = target.x + target.width / 2;
  storyWalkStuck = 0;
  storyCaption.textContent = '';
}

// 게임 루프가 컷씬 중에 매 걸음 부른다. 로봇·엘리베이터는 움직이지 않고 수호만 걷는다.
// 도착하면(또는 1.5초 넘게 막히면) 컷씬을 끝내고 그 자리에서 조사(E)한다.
function updateStoryWalk(elapsed) {
  if (storyWalkX === null) { fallDuringStoryScene(); return; } // 대사 중에는 공중이면 떨어지기만 한다(loop.js)
  const dx = storyWalkX - body.position.x;
  if (Math.abs(dx) < 8 || storyWalkStuck >= 1500) {
    storyWalkX = null;
    Body.setVelocity(body, { x: 0, y: body.velocity.y });
    animate(0, false, elapsed);
    finishStoryScene();
    interact();
    return;
  }
  const direction = Math.sign(dx);
  facing = direction;
  const walkX = pushPushables(direction, direction * Math.min(speed / 60, Math.abs(dx)));
  Body.setVelocity(body, { x: walkX, y: body.velocity.y });
  const oldX = body.position.x;
  Engine.update(engine, elapsed);
  const moved = Math.abs(body.position.x - oldX);
  storyWalkStuck = moved > .1 ? 0 : storyWalkStuck + elapsed;
  animate(moved, false, elapsed);
  cameraX += (cameraTarget() - cameraX) * .13;
  cameraX = Math.max(0, Math.min(Math.max(0, worldWidth - viewWidth), cameraX));
}

// 건너뛰기·Esc. walkTo 컷씬이면 화면이 한 번 어두워지는 동안 수호를 대상 앞으로 옮기고, 밝아지면 조사창이 열린 상태가 된다.
function skipStoryScene() {
  if (!storySceneActive || transitioning) return;
  const target = storyWalkTo && currentDoors.find(door => door.name === storyWalkTo);
  if (!target) return finishStoryScene();
  storyWalkX = null;
  storyScene.hidden = true;
  transitionScene(() => {
    Body.setPosition(body, { x: target.x + target.width / 2, y: body.position.y });
    Body.setVelocity(body, { x: 0, y: 0 });
    facing = 1;
    animate(0);
    cameraX = Math.max(0, Math.min(Math.max(0, worldWidth - viewWidth), cameraTarget()));
    finishStoryScene();
    storyInspectPending = true;
  });
}

function finishStoryScene() {
  if (!storySceneActive) return;
  storySceneActive = false;
  usingInspection = false;
  storyWalkTo = storyWalkX = null;
  storyScene.hidden = true;
  for (const el of storyBlocked) el.inert = false;
  storyBlocked = [];
  if (storyFlag) collectedItems.add(storyFlag);
  storyCaption.textContent = '';
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
