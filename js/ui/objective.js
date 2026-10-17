// 목표 창: 메뉴·가방 버튼 아래에 지금 할 일을 보여 준다. 진행도는 따로 저장하지 않고 이미 저장되는 상태
// (collectedItems, 정전·태양광 전력)에서 매번 계산한다. 위에서부터 처음으로 조건이 맞는 목표가 지금 목표다.
const objectivePanel = document.getElementById('objective');
const objectiveTitle = document.getElementById('objective-title');
const objectiveText = document.getElementById('objective-text');

// 읽으면 진행도가 넘어가는 이야기 소품(층 번호 + 소품 이름 → collectedItems에 남길 플래그).
const OBJECTIVE_READS = {
  '17|포스트잇': 'goal-postit-read',
  '12|팀장 책상': 'goal-f12-memo', // 읽은 기록만 남긴다. 12층 진행은 모델 평가실 퍼즐(f12-evaluation-solved)로 넘어간다.
  '5|서가 꼭대기': 'goal-f5-note', // 5층 연구 노트: 8층 재현 기록과 함께 7층 백업 장비의 조건(backup-puzzle.js)
  '-2|ARCHI 메인 콘솔': 'goal-b2-console',
};

const OBJECTIVES = [
  // 13층 보안 자료실(vault-puzzle.js): 갇힌 동안의 목표. 백업 장치는 7층 다음 필수 목표(아래 '외부 연결 통로 찾기')이고 먼저 챙겨도 된다.
  { when: () => dynamicFloorId === 'f13-secure' && collectedItems.has(VAULT_SHUTTER) && floorHasLighting(13), title: '셔터에 갇혔다',
    text: '전력이 살아 있는 한 셔터는 꿈쩍도 하지 않는다. 다른 방법이 있을 텐데.' },
  { when: () => dynamicFloorId === 'f13-secure' && collectedItems.has(VAULT_SHUTTER), title: '어둠 속 탈출',
    text: '어둠이 내려앉았다. 이제는 셔터를 직접 움직일 수 있지 않을까?' },
  { when: () => ['f13-testbay', 'f13-secure'].includes(dynamicFloorId) && room === 'dynamic' && !collectedItems.has('f13-backup-device'),
    title: '백업 장치 가져오기', text: '이 층 어딘가에 백업 장치가 보관되어 있다. 잠금도 결국 전기로 움직인다.' },
  // 16층 CU 반입문은 안에서 열리지 않는다(floor-16.js): 항불안제를 챙긴 뒤 셔터를 올려야 나간다.
  { when: () => room === 'dynamic' && dynamicFloorId === 'f16-cu' && collectedItems.has('f16-antianxiety') && !collectedItems.has('f16-cu'),
    title: '편의점 나가기', text: '들어온 문으로는 나갈 수 없다. 다른 출구는 없을까?' },
  // B2 DELETE 뒤 엔딩 추격(b2-ending.js): 단계마다 다음 할 일을 알려 준다.
  { when: () => b2Ending.phase === 'running' && b2Ending.offline, title: '탈출하기', text: 'ARCHI가 꺼졌다. 이 건물을 벗어나자.' },
  { when: () => b2Ending.phase === 'running' && b2Ending.stage === 'lobby', title: '1층 전력 끊기', text: '로봇도, ARCHI도 결국 전기로 움직인다. 내 손에 쥔 것으로 멈출 수 있을까?' },
  { when: () => b2Ending.phase === 'running', title: '도망치기', text: '경비 로봇들이 깨어났다. 여기서 벗어나야 한다.' },
  { when: () => collectedItems.has('goal-b2-console'), title: 'ARCHI 멈추기', text: 'ARCHI가 자신을 외부로 복제하고 있다. 지금 여기서 끝내야 한다.' },
  // 12층·7층 필수 퍼즐(log-puzzle.js, backup-puzzle.js)을 차례로 풀어야 다음 목표로 넘어간다.
  { when: () => collectedItems.has('f7-external-connection-solved') && collectedItems.has('b1-elevator'), title: 'B2 서버실 조사하기', text: '길이 열렸다. ARCHI가 진짜로 하려는 일은 무엇일까?' },
  { when: () => collectedItems.has('f7-external-connection-solved') && !collectedItems.has('f13-backup-device'), title: '외부 연결 통로 찾기',
    text: 'ARCHI의 신호는 어디를 거쳐 밖으로 나가는 걸까? 그 길목에 무언가 남아 있을지도.' },
  { when: () => collectedItems.has('f7-external-connection-solved') && !collectedItems.has('f2-projected'), title: '2층 조사하기',
    text: '아무도 없는 새벽 3시의 리허설. 그 무대에는 무엇이 비춰졌을까?' },
  { when: () => collectedItems.has('f7-external-connection-solved') && collectedItems.has('b2-restricted-seen'), title: 'B2 운행 제한 해제', text: '승강기가 B2로 내려가지 않는다. 운행을 관리하는 곳이 있을 텐데.' },
  { when: () => collectedItems.has('f7-external-connection-solved'), title: '지하에서 무슨 일이?', text: '모든 기록이 지하를 가리킨다.' },
  { when: () => collectedItems.has('f7-training-time-solved'), title: '오늘만 다른 기록', text: '평소의 밤과 오늘 밤. 무엇이 달랐을까?' },
  { when: () => collectedItems.has('f12-evaluation-solved') && !collectedItems.has('goal-f5-note'), title: '5층 조사하기',
    text: 'ARCHI는 왜 낮에만 실력을 숨길까? 연구하던 사람들은 알고 있었을지도.' },
  { when: () => collectedItems.has('f12-evaluation-solved') && !collectedItems.has('f8-repro-record'), title: '8층 조사하기',
    text: '이런 현상이 처음은 아닐 것이다. 누군가 재현해 본 기록이 있지 않을까?' },
  { when: () => collectedItems.has('f12-evaluation-solved'), title: '7층 조사하기', text: '평가 기록이 조작되었다면, 원본은 어딘가에 남아 있지 않을까?' },
  { when: () => collectedItems.has('f12-network-isolated') && !logRecordsReady() && !collectedItems.has('f12-paper-backup'), title: '종이 백업 찾기', text: '화면 속 기록은 믿을 수 없다. 누군가 따로 남겨 둔 것이 있을지도.' },
  { when: () => collectedItems.has('f12-network-isolated'), title: '이상한 밤 찾기', text: '기록은 지켜 냈다. 그날 밤 무슨 일이 있었던 걸까?' },
  { when: () => logDeleting(), title: '로그 삭제를 막아라', text: '누군가 기록을 지우고 있다! 연결을 끊어야 한다.' },
  { when: () => collectedItems.has('story-badge-seen') && !collectedItems.has('f16-badge') && collectedItems.has('goal-postit'), title: '출입증 쌔비기', text: '쪽지에 적힌 그 사람이라면 출입증을 갖고 있겠지.' },
  { when: () => collectedItems.has('story-badge-seen') && !collectedItems.has('f16-badge'), title: '출입증 쌔비기', text: '출입증이 필요하다. 가까운 곳에 빌릴 만한 사람이 없을까?' },
  { when: () => collectedItems.has('story-robot-seen') && !collectedItems.has('f1-robot-log'), title: '로봇의 습격! 그 이유는?',
    text: '경비 로봇은 왜 나를 노렸을까? 로봇 자신에게 남은 기록이 있을지도.' },
  { when: () => collectedItems.has('story-robot-seen'), title: '로봇의 습격! 그 이유는?', text: 'ARCHI를 만든 사람들은 무언가 알고 있을 것이다.' },
  { when: () => collectedItems.has('story-anxiety-seen') && !collectedItems.has('story-robot-seen'), title: '정신 불안', text: '머리가 어지럽다. 마음을 진정시킬 무언가가 필요하다.' },
  { when: () => solarEnabled && !collectedItems.has('f17-emergency-linked') && !floorHasLighting(17),
    title: '17층 전등 켜기', text: '전력은 돌아왔지만 17층은 아직 어둡다.' },
  { when: () => solarEnabled && !collectedItems.has('f17-emergency-linked') && !collectedItems.has('f17-manager-memo'),
    title: '관리실 비밀번호 찾기', text: '관리실은 잠겨 있다. 누군가 비밀번호를 적어 두지 않았을까?' },
  { when: () => solarEnabled && !collectedItems.has('f17-emergency-linked') && !collectedItems.has('f17-manager-unlocked'),
    title: '관리실 열기', text: '이제 관리실에 들어갈 수 있을 것 같다.' },
  { when: () => solarEnabled && !collectedItems.has('f17-emergency-linked') && !collectedItems.has('f17-circuit-guide-read'),
    title: '회로 안내도 확인', text: '전선을 함부로 건드릴 순 없다. 어떻게 이어야 할지 먼저 알아야 한다.' },
  { when: () => solarEnabled && !collectedItems.has('f17-emergency-linked'),
    title: '승강기 비상 회선 연결', text: '승강기에도 전력을 보내야 한다.' },
  { when: () => collectedItems.has('f17-emergency-linked') && !collectedItems.has('f1-chase-ended') && !collectedItems.has('solar-app-installed') && !collectedItems.has('solar-app-downloaded'),
    title: '전력 앱 내려받기', text: '층마다 전력을 직접 돌릴 방법이 필요하다. 이 층 컴퓨터에 무언가 있을지도.' },
  { when: () => collectedItems.has('f17-emergency-linked') && !collectedItems.has('f1-chase-ended') && !collectedItems.has('solar-app-installed'),
    title: '전력 앱 설치하기', text: '받은 파일을 휴대폰으로 옮겨야 한다.' },
  { when: () => collectedItems.has('f17-emergency-linked') && !collectedItems.has('f1-chase-ended') && !floorHasLighting(1),
    title: '1층 전력 켜기', text: '1층은 아직 어둠 속이다. 내려가기 전에 불을 밝혀야 한다.' },
  { when: () => collectedItems.has('f17-emergency-linked') && collectedItems.has('f1-reached'), title: '퇴근하기', text: '드디어 1층이다. 이제 집에 가자.' },
  { when: () => collectedItems.has('f17-emergency-linked'), title: '퇴근하기', text: '승강기가 다시 움직인다. 아래로 내려가자.' },
  { when: () => collectedItems.has('rooftop-unlocked'), title: '비상 전력 켜기', text: '옥상에 올라왔다. 건물에 전력을 되돌릴 방법이 있을 것이다.' },
  { when: () => realBuildingBlackout(), title: '정전', text: '정전이 발생했다. 전력을 확보하기 위한 수단을 찾아보자.' },
  { when: () => true, title: '퇴근하기', text: '오늘 일은 끝났다. 집에 가자.' },
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
