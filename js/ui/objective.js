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
    text: '전력이 들어와 있는 동안 셔터는 열리지 않는다. 시설 점검 기록에서 수동 개방 방법을 찾자.' },
  { when: () => dynamicFloorId === 'f13-secure' && collectedItems.has(VAULT_SHUTTER), title: '어둠 속 탈출',
    text: '맨 안쪽의 수동 개방 크랭크를 돌려 셔터를 올리자. 다시 전력을 켜면 배치도를 볼 수 있다.' },
  { when: () => ['f13-testbay', 'f13-secure'].includes(dynamicFloorId) && room === 'dynamic' && !collectedItems.has('f13-backup-device'),
    title: '백업 장치 가져오기', text: '보안 자료실에서 백업 장치를 가져오자. 전자 잠금은 13층에 휴대폰으로 전력을 넣어야 풀린다.' },
  // 16층 CU 반입문은 안에서 열리지 않는다(floor-16.js): 항불안제를 챙긴 뒤 셔터를 올려야 나간다.
  { when: () => room === 'dynamic' && dynamicFloorId === 'f16-cu' && collectedItems.has('f16-antianxiety') && !collectedItems.has('f16-cu'),
    title: '편의점 나가기', text: '반입문은 안에서 열리지 않는다. 셔터 제어함의 수동 레버로 셔터를 올리고 나가자.' },
  // B2 DELETE 뒤 엔딩 추격(b2-ending.js): 단계마다 다음 할 일을 알려 준다.
  { when: () => b2Ending.phase === 'running' && b2Ending.offline, title: '탈출하기', text: 'ARCHI가 꺼졌다. 1층 정문으로 나가자.' },
  { when: () => b2Ending.phase === 'running' && b2Ending.stage === 'lobby', title: '1층 전력 끊기', text: '휴대폰(P)의 비상 전력 제어 앱에서 1층 전력을 끊어 ARCHI를 멈추자.' },
  { when: () => b2Ending.phase === 'running', title: '도망치기', text: '경비 로봇들이 깨어났다. 엘리베이터를 타고 1층으로 올라가자.' },
  { when: () => collectedItems.has('goal-b2-console'), title: 'ARCHI 멈추기', text: 'ARCHI가 자신을 외부로 복제하고 있다. 메인 콘솔에서 DELETE를 실행하자.' },
  // 12층·7층 필수 퍼즐(log-puzzle.js, backup-puzzle.js)을 차례로 풀어야 다음 목표로 넘어간다.
  { when: () => collectedItems.has('f7-external-connection-solved') && collectedItems.has('b1-elevator'), title: 'B2 서버실 조사하기', text: 'B2 ARCHI 메인 서버실로 내려가 진짜 목적을 확인하자.' },
  { when: () => collectedItems.has('f7-external-connection-solved') && !collectedItems.has('f13-backup-device'), title: '외부 연결 통로 찾기',
    text: 'ARCHI의 외부 송신은 13층 원격지원 게이트웨이를 거친다. 장비 검증실 안쪽 보안 자료실에서 백업 장치를 가져오자.' },
  { when: () => collectedItems.has('f7-external-connection-solved') && !collectedItems.has('f2-projected'), title: '2층 조사하기',
    text: '2층 Harmony Hall의 03:00 무관객 리허설을 확인하자. 서버실의 원본 디스크와 휴게실의 영사기 리모컨이 필요하다.' },
  { when: () => collectedItems.has('f7-external-connection-solved') && collectedItems.has('b2-restricted-seen'), title: 'B2 운행 제한 해제', text: 'B1 시설관리실에서 B2 승강기 운행 제한을 해제하세요.' },
  { when: () => collectedItems.has('f7-external-connection-solved'), title: '지하에서 무슨 일이?', text: '모든 기록이 B2를 가리킨다. 지하 서버실을 조사하자.' },
  { when: () => collectedItems.has('f7-training-time-solved'), title: '오늘만 다른 기록', text: '백업 장비의 [오늘] 탭에서 평소 밤과 다른 기록을 찾자.' },
  { when: () => collectedItems.has('f12-evaluation-solved') && !collectedItems.has('goal-f5-note'), title: '5층 조사하기',
    text: 'ARCHI는 왜 낮에만 실력을 숨길까? 5층 연구개발실 맨 안쪽 서가 꼭대기를 확인하자.' },
  { when: () => collectedItems.has('f12-evaluation-solved') && !collectedItems.has('f8-repro-record'), title: '8층 조사하기',
    text: '8층 QA 시험실 재현 벤치에서 원본 재현 기록을 뽑자. 조건을 맞추는 순서는 공용 제품 회의실에 있다.' },
  { when: () => collectedItems.has('f12-evaluation-solved'), title: '7층 조사하기', text: '7층 AI 테스트·검증실에서 원본 백업 로그를 확인하세요.' },
  { when: () => collectedItems.has('f12-network-isolated') && !logRecordsReady() && !collectedItems.has('f12-paper-backup'), title: '종이 백업 찾기', text: '모델 평가실 평가 벤치에서 출력해 둔 야간 기록을 찾자.' },
  { when: () => collectedItems.has('f12-network-isolated'), title: '이상한 밤 찾기', text: '야간 로그 단말기에서 기록을 분석하자.' },
  { when: () => logDeleting(), title: '로그 삭제를 막아라', text: '네트워크 랙의 B2 직결 LAN 케이블을 뽑자.' },
  { when: () => collectedItems.has('story-badge-seen') && !collectedItems.has('f16-badge') && collectedItems.has('goal-postit'), title: '출입증 쌔비기', text: '조현아 팀장의 사원증을 찾자.' },
  { when: () => collectedItems.has('story-badge-seen') && !collectedItems.has('f16-badge'), title: '출입증 쌔비기', text: '옆자리 직원의 자리를 조사하자.' },
  { when: () => collectedItems.has('story-robot-seen') && !collectedItems.has('f1-robot-log'), title: '로봇의 습격! 그 이유는?',
    text: '1층 경비 로봇의 정비 패널에서 마지막 기록을 확인하자. 1층 전력을 끊으면 로봇이 멈춘다.' },
  { when: () => collectedItems.has('story-robot-seen'), title: '로봇의 습격! 그 이유는?', text: 'ARCHI 개발 팀을 조사하자.' },
  { when: () => collectedItems.has('story-anxiety-seen') && !collectedItems.has('story-robot-seen'), title: '정신 불안', text: 'CU 편의점에서 항불안제를 찾아 가방(Tab)에서 복용하자.' },
  { when: () => solarEnabled && !collectedItems.has('f17-emergency-linked') && !floorHasLighting(17),
    title: '17층 전등 켜기', text: '옥상 태양광 배전반에서 17층 조명을 켜자. 승강기는 별도 비상 회선이 필요하다.' },
  { when: () => solarEnabled && !collectedItems.has('f17-emergency-linked') && !collectedItems.has('f17-manager-memo'),
    title: '관리실 비밀번호 찾기', text: '17층 소화전의 열쇠 옆에 있는 관리실 비상 출입 메모를 읽자.' },
  { when: () => solarEnabled && !collectedItems.has('f17-emergency-linked') && !collectedItems.has('f17-manager-unlocked'),
    title: '관리실 열기', text: '소화전 메모의 비밀번호로 관리자 외 출입금지실 문을 열자.' },
  { when: () => solarEnabled && !collectedItems.has('f17-emergency-linked') && !collectedItems.has('f17-circuit-guide-read'),
    title: '회로 안내도 확인', text: '작은 관리실 책상에서 전력 공급 단자와 승강기 단자를 확인하자.' },
  { when: () => solarEnabled && !collectedItems.has('f17-emergency-linked'),
    title: '승강기 비상 회선 연결', text: '관리실 분배반에서 안내도의 번호대로 네 가닥을 연결하자.' },
  { when: () => collectedItems.has('f17-emergency-linked') && !collectedItems.has('f1-chase-ended') && !collectedItems.has('solar-app-installed') && !collectedItems.has('solar-app-downloaded'),
    title: '전력 앱 내려받기', text: '17층 작업용 컴퓨터의 블로그에서 비상 전력 제어 앱을 내려받자.' },
  { when: () => collectedItems.has('f17-emergency-linked') && !collectedItems.has('f1-chase-ended') && !collectedItems.has('solar-app-installed'),
    title: '전력 앱 설치하기', text: '17층 컴퓨터에 휴대폰을 USB로 연결하고 파일 전송 앱에서 설치하자.' },
  { when: () => collectedItems.has('f17-emergency-linked') && !collectedItems.has('f1-chase-ended') && !floorHasLighting(1),
    title: '1층 전력 켜기', text: '휴대폰(P)의 비상 전력 제어 앱에서 1층에 전력을 공급하자.' },
  { when: () => collectedItems.has('f17-emergency-linked') && collectedItems.has('f1-reached'), title: '퇴근하기', text: '정문으로 나가자.' },
  { when: () => collectedItems.has('f17-emergency-linked'), title: '퇴근하기', text: '엘리베이터를 타고 1층으로 내려가자.' },
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
