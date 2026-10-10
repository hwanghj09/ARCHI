// 이야기 컷씬(혼잣말): 화면 위아래에 검은 띠가 깔리고 대사가 STORY_LINE_MS마다 한 줄씩 바뀐다. Esc나 건너뛰기로 끝낼 수 있고, 끝나면
// 본 기록(flag)을 남기고 목표가 생긴다(objective.js). 진행 중에는 usingInspection을 켜서 이동·상호작용·메뉴·정신력 진행을 기존 조사창과 같이 막는다.
const storyScene = document.getElementById('story-scene');
const storyCaption = document.getElementById('story-caption');
const STORY_LINE_MS = 3000;
let storyLines = [];
let storyFlag = null;
let storyElapsed = 0;
let storyLineShown = -1;
let storyBlocked = [];

// 이야기 컷씬 목록(순서대로 하나씩 본다). ready()가 참이 된 뒤 delay가 지나면 시작하고, 끝나면 flag를 남겨 목표가 생긴다(objective.js).
const STORY_SCENES = [
  { // 1층 경비 로봇의 추격이 끝나고 3초 뒤. 추격이 끝났다는 기록(f1-chase-ended)은 guard-patrol.js가 남긴다.
    flag: 'story-anxiety-seen', delay: 3000, ready: () => collectedItems.has('f1-chase-ended'),
    lines: ['왜 경비 로봇이 나를 공격하려고 했던 거지?',
      '으윽.. 야근해서 힘든 와중에 이런 일을 겪으니 너무 힘들다..',
      '16층 편의점에 가서 항상 복용하던 항불안제를 찾아야겠어..'],
  },
  { // 항불안제를 사용하고(정신 불안 목표 완료) 4초 뒤.
    flag: 'story-robot-seen', delay: 4000, ready: () => collectedItems.has('story-anxiety-seen') && collectedItems.has('f16-antianxiety-used'),
    lines: ['휴.. 겨우 정신을 차렸네..',
      '그래서 경비 로봇이 왜 날 공격했던거지?',
      '그 로봇은 ARCHI 개발 팀에서 만든 로봇이였나?',
      '12층 ARCHI 개발 팀을 조사해보자.'],
  },
];

let storyDelayScene = null;
let storyDelay = 0;

// 게임 루프가 매 걸음 부른다(조작을 막는 창·컷씬 중에는 불리지 않아 그동안은 시간도 흐르지 않는다).
function checkStoryScenes(elapsed) {
  const scene = storySceneActive ? null : STORY_SCENES.find(entry => !collectedItems.has(entry.flag));
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

function startStoryScene({ lines, flag }) {
  storySceneActive = true;
  usingInspection = true; // 이동·상호작용·메뉴·정신력 진행을 막는 기존 규칙을 그대로 쓴다
  storyLines = lines;
  storyFlag = flag;
  storyElapsed = 0;
  storyScene.hidden = false;
  storyBlocked = [...document.body.children].filter(el => el !== storyScene && el.tagName !== 'SCRIPT' && !el.inert);
  for (const el of storyBlocked) el.inert = true;
  releaseInput();
  Body.setVelocity(body, { x: 0, y: 0 });
  hint.hidden = interactionOutline.hidden = true;
  document.getElementById('story-skip').focus({ preventScroll: true });
  showStoryLine(0);
}

// 게임 루프(고정 간격)가 부른다. 마지막 대사까지 보여 준 뒤 STORY_LINE_MS가 더 지나면 끝난다.
function updateStoryScene(elapsed) {
  storyElapsed += elapsed;
  const index = Math.floor(storyElapsed / STORY_LINE_MS);
  if (index >= storyLines.length) return finishStoryScene();
  if (index !== storyLineShown) showStoryLine(index);
}

function finishStoryScene() {
  if (!storySceneActive) return;
  storySceneActive = false;
  usingInspection = false;
  storyScene.hidden = true;
  for (const el of storyBlocked) el.inert = false;
  storyBlocked = [];
  if (storyFlag) collectedItems.add(storyFlag);
  storyCaption.textContent = '';
  refreshObjective();
  stage.focus({ preventScroll: true });
}

document.getElementById('story-skip').addEventListener('click', finishStoryScene);
