// 목표 창: 메뉴·가방 버튼 아래에 지금 할 일을 보여 준다. 진행도는 따로 저장하지 않고 이미 저장되는 상태
// (collectedItems, 정전·태양광 전력)에서 매번 계산한다. 위에서부터 처음으로 조건이 맞는 목표가 지금 목표다.
const objectivePanel = document.getElementById('objective');
const objectiveTitle = document.getElementById('objective-title');
const objectiveText = document.getElementById('objective-text');

// 읽으면 진행도가 넘어가는 이야기 소품(층 번호 + 소품 이름 → collectedItems에 남길 플래그).
const OBJECTIVE_READS = {
  '17|포스트잇': 'goal-postit-read',
  '12|팀장 책상': 'goal-f12-memo',
  '7|망분리 백업 장비': 'goal-f7-log',
  '-2|ARCHI 메인 콘솔': 'goal-b2-console',
};

const OBJECTIVES = [
  { when: () => collectedItems.has('goal-b2-console'), title: 'ARCHI 멈추기', text: 'ARCHI가 자신을 외부로 복제하고 있다. 메인 콘솔에서 막을 방법을 찾자.' },
  { when: () => collectedItems.has('goal-f7-log') && collectedItems.has('b1-elevator'), title: 'B2 서버실 조사하기', text: 'B2 ARCHI 메인 서버실로 내려가 진짜 목적을 확인하자.' },
  { when: () => collectedItems.has('goal-f7-log'), title: '지하에서 무슨 일이?', text: '모든 로그가 B2를 가리킨다. 지하로 내려가보자.' },
  { when: () => collectedItems.has('goal-f12-memo'), title: '7층 조사하기', text: 'AI 테스트·검증실의 백업 로그를 찾자.' },
  { when: () => collectedItems.has('story-badge-seen') && !collectedItems.has('f16-badge') && collectedItems.has('goal-postit'), title: '출입증 쌔비기', text: '조현아 팀장의 사원증을 찾자.' },
  { when: () => collectedItems.has('story-badge-seen') && !collectedItems.has('f16-badge'), title: '출입증 쌔비기', text: '옆자리 직원의 자리를 조사하자.' },
  { when: () => collectedItems.has('story-robot-seen'), title: '로봇의 습격! 그 이유는?', text: 'ARCHI 개발 팀을 조사하자.' },
  { when: () => collectedItems.has('story-anxiety-seen') && !collectedItems.has('story-robot-seen'), title: '정신 불안', text: 'CU 편의점에서 항불안제를 찾아 가방(Tab)에서 복용하자.' },
  { when: () => solarEnabled && !collectedItems.has('f1-chase-ended') && !collectedItems.has('solar-app-installed') && !floorHasPower(17),
    title: '17층 전력 켜기', text: '옥상 배전반에서 17층 전력을 켜 작업용 컴퓨터를 복구하자.' },
  { when: () => solarEnabled && !collectedItems.has('f1-chase-ended') && !collectedItems.has('solar-app-installed') && !collectedItems.has('solar-app-downloaded'),
    title: '전력 앱 내려받기', text: '17층 작업용 컴퓨터의 블로그에서 비상 전력 제어 앱을 내려받자.' },
  { when: () => solarEnabled && !collectedItems.has('f1-chase-ended') && !collectedItems.has('solar-app-installed'),
    title: '전력 앱 설치하기', text: '17층 컴퓨터에 휴대폰을 USB로 연결하고 파일 전송 앱에서 설치하자.' },
  { when: () => solarEnabled && !collectedItems.has('f1-chase-ended') && !floorHasPower(1),
    title: '1층 전력 켜기', text: '휴대폰(P)의 비상 전력 제어 앱에서 1층에 전력을 공급하자.' },
  { when: () => solarEnabled && collectedItems.has('f1-reached'), title: '퇴근하기', text: '정문으로 나가자.' },
  { when: () => solarEnabled, title: '퇴근하기', text: '엘리베이터를 타고 1층으로 내려가자.' },
  { when: () => collectedItems.has('rooftop-unlocked'), title: '비상 전력 켜기', text: '옥상의 태양광 비상 전력 장치를 켜자.' },
  { when: () => realBuildingBlackout(), title: '정전', text: '정전이 발생했다. 전력을 확보하기 위한 수단을 찾아보자.' },
  { when: () => true, title: '퇴근하기', text: '엘리베이터로 가자.' },
];

function noteObjectiveRead(door) {
  const flag = OBJECTIVE_READS[`${currentSceneFloor}|${door.name}`];
  if (flag) collectedItems.add(flag);
}

// 목표가 바뀌면 제목을 먼저, 이어서 내용을 한 글자씩(objectiveTypeMs 간격) 쳐 넣는다. 띄어쓰기는 다음 글자와 함께 나온다.
const objectiveTypeMs = 100;
// 제목을 다 쓴 뒤 내용 첫 글자가 나오기까지의 간격.
const objectiveTextDelayMs = 400;
let currentObjective = null;
let objectiveTypingTimer = null;

function typingSteps(text) {
  const chars = [...text];
  return chars.map((_, index) => chars.slice(0, index + 1).join('')).filter((_, index) => chars[index].trim());
}

function typeObjective(title, text) {
  clearTimeout(objectiveTypingTimer);
  objectiveTitle.textContent = objectiveText.textContent = '';
  const steps = [...typingSteps(title).map(value => [objectiveTitle, value]), ...typingSteps(text).map(value => [objectiveText, value])];
  const next = () => {
    const [element, value] = steps.shift();
    element.textContent = value;
    const delay = element === objectiveTitle && steps[0]?.[0] === objectiveText ? objectiveTextDelayMs : objectiveTypeMs;
    objectiveTypingTimer = steps.length ? setTimeout(next, delay) : null;
  };
  next();
}

function refreshObjective() {
  // 메뉴·오프닝·정전 컷씬 동안은 목표 창이 가려져 있으니, 보이게 된 뒤에 새 목표를 쳐 넣는다.
  if (mainMenuActive || openingActive || blackoutSceneActive || storySceneActive) return;
  officePostit.element.hidden = !collectedItems.has('story-badge-seen'); // 출입증 쌔비기 목표가 시작되면 옆자리 포스트잇이 생긴다
  // 포스트잇을 읽고 조사창을 닫으면(닫기·Esc·E) 그때 목표 내용이 바뀐다.
  if (!usingInspection && collectedItems.has('goal-postit-read')) collectedItems.add('goal-postit');
  // 1층에 한 번 내려오면 다시 다른 층에 가도 '정문으로 나가자'가 유지되도록 남겨 둔다(자동 저장에 함께 남는다).
  if (currentSceneFloor === 1) collectedItems.add('f1-reached');
  const objective = OBJECTIVES.find(entry => entry.when());
  if (objective === currentObjective) return;
  const changed = currentObjective !== null;
  currentObjective = objective;
  typeObjective(objective.title, objective.text);
  // 처음 그릴 때가 아니라 진행 중에 바뀌었을 때만 잠깐 강조한다.
  if (!changed) return;
  objectivePanel.classList.remove('updated');
  void objectivePanel.offsetWidth;
  objectivePanel.classList.add('updated');
}

// 오른쪽 위 버튼 배치: 메뉴 버튼은 가방 버튼을 가리지 않도록 그 왼쪽에 8px 띄워 붙이고, 목표 창은 메뉴 버튼의 왼쪽 끝부터
// 가방 버튼의 오른쪽 끝까지 가로로 맞춘다. 가방 버튼은 소지품 수에 따라 글자가 길어지므로 크기가 바뀔 때마다 다시 계산한다.
const hudMenuButton = document.getElementById('game-menu-button');
const hudInventoryButton = document.getElementById('inventory-button');

function layoutTopRightHud() {
  const inventory = hudInventoryButton.getBoundingClientRect();
  if (!inventory.width) return;
  hudMenuButton.style.right = `${document.documentElement.clientWidth - inventory.left + 8}px`;
  const menu = hudMenuButton.getBoundingClientRect();
  objectivePanel.style.width = `${inventory.right - menu.left}px`;
}

new ResizeObserver(layoutTopRightHud).observe(hudInventoryButton);
new ResizeObserver(layoutTopRightHud).observe(hudMenuButton);
window.addEventListener('resize', layoutTopRightHud);
layoutTopRightHud();
