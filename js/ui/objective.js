// 목표 창: 메뉴·가방 버튼 아래에 지금 할 일을 보여 준다. 진행도는 따로 저장하지 않고 이미 저장되는 상태
// (collectedItems, 정전·태양광 전력)에서 매번 계산한다. 위에서부터 처음으로 조건이 맞는 목표가 지금 목표다.
const objectivePanel = document.getElementById('objective');
const objectiveTitle = document.getElementById('objective-title');
const objectiveText = document.getElementById('objective-text');

// 읽으면 진행도가 넘어가는 이야기 소품(층 번호 + 소품 이름 → collectedItems에 남길 플래그).
const OBJECTIVE_READS = {
  '12|팀장 책상': 'goal-f12-memo', // 읽은 기록만 남긴다. 12층 진행은 모델 평가실 퍼즐(f12-evaluation-solved)로 넘어간다.
  '5|서가 꼭대기': 'goal-f5-note', // 5층 연구 노트: 8층 재현 기록과 함께 ARCHI-MAIN 터미널 접속의 조건(terminal.js)
  '-2|ARCHI 메인 콘솔': 'goal-b2-console',
  '1|층별 안내판': 'goal-f1-directory',
  '1|정문': 'f1-door-checked', // 퇴근하려다 문이 안 열리는 것을 확인했다(story-scene.js 혼잣말 → 안내 데스크)
};

// 1층 추격 뒤 편의점 위치를 모르면 안내판을 본다. PC 시설 안내를 읽었거나 다른 층에 있는 이전 저장이면 생략한다.
const needsF1Directory = () => collectedItems.has('story-anxiety-seen') && !collectedItems.has('goal-f1-directory') && !collectedItems.has('goal-facilities-read') &&
  !collectedItems.has('story-robot-seen') && currentSceneFloor === 1;

const OBJECTIVES = [
  // 13층 보안 자료실(vault-puzzle.js): 갇힌 동안의 목표. 백업 장치는 7층 다음 필수 목표(아래 '외부 연결 통로 찾기')이고 먼저 챙겨도 된다.
  { when: () => dynamicFloorId === 'f13-secure' && collectedItems.has(VAULT_SHUTTER) && floorHasLighting(13), title: '셔터에 갇혔다',
    text: '전력이 살아 있는 한 셔터는 꿈쩍도 하지 않는다. 다른 방법이 있을 텐데.' },
  { when: () => dynamicFloorId === 'f13-secure' && collectedItems.has(VAULT_SHUTTER), title: '어둠 속 탈출',
    text: '어둠이 내려앉았다. 이제는 셔터를 직접 움직일 수 있지 않을까?' },
  // 16층 VU 반입문은 안에서 열리지 않는다(floor-16.js): 항불안제를 챙긴 뒤 셔터를 올려야 나간다.
  { when: () => room === 'dynamic' && dynamicFloorId === 'f16-cu' && collectedItems.has('f16-antianxiety') && !collectedItems.has('f16-cu'),
    title: '편의점 나가기', text: '들어온 문으로는 나갈 수 없다. 다른 출구는 없을까?' },
  // B2 DELETE 뒤 엔딩(b2-ending.js): 단계마다 다음 할 일을 알려 준다.
  { when: () => b2Ending.phase === 'running' && b2Ending.offline, title: 'ARCHI 삭제 완료', text: 'ARCHI가 꺼졌다. 문 너머가 조용해졌다.' },
  { when: () => b2Ending.phase === 'running' && b2Ending.barricaded, title: '삭제 배틀', text: 'ARCHI가 삭제를 거부한다. 문이 버티는 동안 끝낼 수 있을까?' },
  { when: () => b2Ending.phase === 'running', title: '문 막기', text: '경비 로봇들이 깨어났다. 장비 운반 상자를 출입문까지 밀어 막자!' },
  { when: () => collectedItems.has('goal-b2-console'), title: 'ARCHI 멈추기', text: '외부 전송은 끊었다. 메인 콘솔의 DELETE로 지금 여기서 끝내야 한다.' },
  // 메인 콘솔이 "외부 연결 중"으로 잠긴 것을 본 뒤(b2-ending.js offerArchiDelete)에는 외부 회선 패널을, 끊은 뒤에는 콘솔을 가리킨다.
  { when: () => collectedItems.has('b2-console-locked') && !collectedItems.has('b2-transfer-cut'), title: '외부 회선 끊기',
    text: '외부 연결 중이라 DELETE가 잠겨 있다. 전력·냉각실에서 외부 전송 회선을 차단하자.' },
  { when: () => collectedItems.has('b2-console-locked') && collectedItems.has('b2-transfer-cut'), title: '메인 콘솔 확인',
    text: '외부 전송 회선을 끊었다. 메인 서버실 콘솔을 다시 확인하자.' },
  // 12층 필수 퍼즐(log-puzzle.js)과 ARCHI-MAIN 터미널(terminal.js)을 차례로 풀어야 다음 목표로 넘어간다.
  { when: () => collectedItems.has('f7-external-connection-solved') && collectedItems.has('b1-elevator'), title: 'B2 서버실 조사하기', text: '길이 열렸다. 승강기를 타고 B2 서버실로 내려가자.' },
  { when: () => collectedItems.has('f7-external-connection-solved') && !collectedItems.has('f13-backup-device'), title: '외부 연결 통로 찾기',
    text: 'ARCHI의 신호는 어디를 거쳐 밖으로 나가는 걸까? 보안 자료실에서 외부 통로를 찾아보자.' },
  // 13층 백업 장치를 컴퓨터(13층 상황실·1층 안내 데스크 PC)에 꽂아 깨진 리허설 영상을 봐야(f17-usb-played, usb-video.js) 2층에 갈 이유가 생긴다.
  { when: () => collectedItems.has('f7-external-connection-solved') && !collectedItems.has('f17-usb-played') && !collectedItems.has('f2-projected'),
    title: '장치 확인하기', text: '13층에서 챙긴 USB를 확인하자. 이 층 기술지원 상황실의 원격지원 PC나 1층 안내 데스크 PC의 외부 저장 장치로 열 수 있다.' },
  // 녹화 NAS의 디스크(f2-reel)를 챙긴 뒤에는 Harmony Hall 영사기와 직원 휴게실 리모컨(f2-remote)을 가리킨다(floor-02.js).
  { when: () => collectedItems.has('f7-external-connection-solved') && collectedItems.has('f2-reel') && !collectedItems.has('f2-remote') && !collectedItems.has('f2-projected'),
    title: '원본 재생하기', text: 'Harmony Hall 천장의 배터리 영사기로 원본을 틀어 보자. 영사기를 내릴 리모컨은 직원 휴게실에 있을지도 모른다.' },
  { when: () => collectedItems.has('f7-external-connection-solved') && collectedItems.has('f2-reel') && !collectedItems.has('f2-projected'),
    title: '원본 재생하기', text: '디스크와 리모컨을 챙겼다. Harmony Hall의 배터리 영사기로 원본을 틀어 보자.' },
  { when: () => collectedItems.has('f7-external-connection-solved') && collectedItems.has('f17-usb-played') && !collectedItems.has('f2-projected'), title: '2층 조사하기',
    text: '영상 속 새벽 3시 리허설에서 내 목소리가 나왔다. 원본이 04:00에 지워지기 전에 2층 서버실 녹화 NAS를 찾자.' },
  // 승강기 제어반은 관제실 CCTV 모니터 벽(소등 컷씬)을 본 뒤에야 돌릴 수 있다(floor-b1.js).
  { when: () => collectedItems.has('f7-external-connection-solved') && collectedItems.has('f13-backup-device') && collectedItems.has('f2-projected') &&
      currentSceneFloor === -1 && !collectedItems.has('b1-lights-out') && !collectedItems.has('b1-elevator'), title: '관제실 CCTV',
    text: '모니터 벽이 무엇을 찍고 있었는지 먼저 확인해 보자.' },
  { when: () => collectedItems.has('f7-external-connection-solved') && collectedItems.has('b2-restricted-seen'), title: 'B2 운행 제한 해제', text: '승강기가 B2로 내려가지 않는다. B1 방재 관제실에서 운행을 관리할 텐데.' },
  { when: () => collectedItems.has('f7-external-connection-solved'), title: '지하에서 무슨 일이?', text: '모든 기록이 지하를 가리킨다. 승강기를 타고 B2로 내려가 보자.' },
  { when: () => collectedItems.has('f12-evaluation-solved') && !collectedItems.has('goal-f5-note'), title: '데이터 수집',
    text: 'ARCHI가 기록을 지운 이유는 뭘까? 5층 연구개발실을 조사해보자.' },
  { when: () => collectedItems.has('f12-evaluation-solved') && !collectedItems.has('f8-repro-record'), title: '기록 재현',
    text: '이런 현상이 처음이 아닌 것 같다. 8층 QA 시험실에서 기록을 재현해보자.' },
  // 5층·8층 기록 뒤: 게임 밖 ARCHI 소개 페이지(archi.html)에서 SSH 정보를 찾아 컴퓨터 터미널로 접속한다(terminal.js).
  { when: () => collectedItems.has('f12-evaluation-solved'), title: 'ARCHI의 흔적',
    text: '오늘 밤 기록은 B2 ARCHI-MAIN에만 있다. 1층 로비 ARCHI 포스터의 QR을 휴대폰으로 찍어 ARCHI가 들른 소개 페이지를 확인하고, 안내 데스크 PC 터미널로 서버에 접속하자.' },
  { when: () => collectedItems.has('f12-network-isolated') && !logRecordsReady() && !collectedItems.has('f12-paper-backup'), title: '종이 백업 찾기', text: '화면 속 기록은 믿을 수 없다. 모델 평가실 평가 벤치에 출력해 둔 기록이 있을지도.' },
  { when: () => collectedItems.has('f12-network-isolated'), title: '이상한 밤 찾기', text: '기록은 지켜 냈다. 야간 로그 단말기의 터미널에서 로그 파일을 찾아 그날 밤 무슨 일이 있었는지 확인하자.' },
  { when: () => logDeleting(), title: '로그 삭제를 막아라', text: '누군가 기록을 지우고 있다! 연결을 끊어야 한다.' },
  // 게이트 컷씬(story-badge-seen)이 사원증 위치를 알려 주므로 바로 16층 카페를 가리킨다.
  { when: () => collectedItems.has('story-badge-seen') && !collectedItems.has('f16-badge'), title: '출입증 쌔비기',
    text: '팀장은 16층 카페에 사원증을 자주 두고 간다. 카페에 가 보자.' },
  { when: () => collectedItems.has('story-robot-seen'), title: '나갈 방법 찾기', text: '정문은 SYSTEM이 내 이름으로 막아 두었다. 12층 ARCHI 개발팀을 조사해 보자.' },
  { when: needsF1Directory, title: '편의점은 몇 층?', text: '항불안제를 사러 편의점에 가야 한다. 엘리베이터 옆 층별 안내판을 확인하자.' },
  { when: () => collectedItems.has('story-anxiety-seen') && !collectedItems.has('story-robot-seen') && collectedItems.has('f16-antianxiety') && !collectedItems.has('f16-antianxiety-used'),
    title: '정신 불안', text: '항불안제를 복용하자.' },
  { when: () => collectedItems.has('story-anxiety-seen') && !collectedItems.has('story-robot-seen'), title: '정신 불안', text: '머리가 어지럽다. 마음을 진정시킬 무언가가 필요하다. 편의점으로 가보자.' },
  { when: () => solarEnabled && !collectedItems.has('f17-emergency-linked') && !floorHasLighting(17),
    title: '17층 전등 켜기', text: '전력은 돌아왔지만 17층은 아직 어둡다.' },
  { when: () => solarEnabled && !collectedItems.has('f17-emergency-linked') && !collectedItems.has('f17-manager-memo') && !collectedItems.has('f17-manager-unlocked'),
    title: '관리실 비밀번호 찾기', text: '관리실은 잠겨 있다. 누군가 비밀번호를 적어 두지 않았을까?' },
  { when: () => solarEnabled && !collectedItems.has('f17-emergency-linked') && !collectedItems.has('f17-manager-unlocked'),
    title: '관리실 열기', text: '이제 관리실에 들어갈 수 있을 것 같다.' },
  { when: () => solarEnabled && !collectedItems.has('f17-emergency-linked'),
    title: '승강기 비상 회선 연결', text: '승강기에도 전력을 보내야 한다.' },
  // 1층에서 퇴근이 막히는 흐름(floor-01.js): 정문 확인 → 안내 데스크 앱 → 1층 전력. 제목을 '퇴근하기'로 두어 승강기는 1층만 눌린다(cabin.js).
  { when: () => collectedItems.has('f17-emergency-linked') && !collectedItems.has('f1-reached'), title: '퇴근하기', text: '승강기가 다시 움직인다. 아래로 내려가자.' },
  { when: () => collectedItems.has('f17-emergency-linked') && !collectedItems.has('f1-chase-ended') && phoneDock && phoneDock.floor !== currentSceneFloor,
    title: '퇴근하기', text: '휴대폰을 다른 층 충전기에 두고 왔다. 휴대폰 표시에서 위치를 확인하고 승강기를 타고 돌아가 챙기자.' },
  // 승강기는 1층만 눌리니, 1층에서 휴대폰이 꺼지면 안내 데스크 콘센트(floor-01.js)를 알려 준다.
  { when: () => collectedItems.has('f1-reached') && !collectedItems.has('f1-chase-ended') && !floorHasLighting(1) && phoneBattery <= 0 && !phoneDock,
    title: '퇴근하기', text: '휴대폰이 꺼졌다. 안내 데스크 왼쪽 콘센트에서 충전하자.' },
  { when: () => collectedItems.has('f17-emergency-linked') && !collectedItems.has('f1-chase-ended') && !collectedItems.has('solar-app-installed') && !collectedItems.has('f1-door-checked'),
    title: '퇴근하기', text: '드디어 1층이다. 정문으로 나가자.' },
  { when: () => collectedItems.has('f17-emergency-linked') && !collectedItems.has('f1-chase-ended') && collectedItems.has('solar-app-downloaded') && !collectedItems.has('solar-app-installed'),
    title: '퇴근하기', text: '앱을 받았다. 안내 데스크 PC의 파일 전송에서 휴대폰을 USB로 연결해 설치하자.' },
  { when: () => collectedItems.has('f17-emergency-linked') && !collectedItems.has('f1-chase-ended') && !collectedItems.has('solar-app-installed'),
    title: '퇴근하기', text: '정문에 전기가 없다. 안내 데스크에 로비 전원을 켤 방법이 있을지도.' },
  { when: () => collectedItems.has('f17-emergency-linked') && !collectedItems.has('f1-chase-ended') && !floorHasLighting(1),
    title: '퇴근하기', text: '휴대폰 전력 앱으로 1층에 전력을 보내자.' },
  { when: () => collectedItems.has('f17-emergency-linked'), title: '퇴근하기', text: '로비에 불이 들어왔다. 정문으로 가자.' },
  { when: () => collectedItems.has('rooftop-unlocked'), title: '비상 전력 켜기', text: '옥상 문이 열렸다. 옥상에서 건물에 전력을 되돌릴 방법을 찾아보자.' },
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
  // 컷씬이 곧 시작되거나 진행 중이면 컷씬이 끝난 뒤에 목표를 바꾼다.
  if (mainMenuActive || openingActive || blackoutSceneActive || storySceneActive || storyScenePending()) return;
  // 1층에 한 번 내려오면 다시 다른 층에 가도 '정문으로 나가자'가 유지되도록 남겨 둔다(자동 저장에 함께 남는다).
  if (currentSceneFloor === 1) collectedItems.add('f1-reached');
  const objective = OBJECTIVES.find(entry => entry.when());
  if (objective === currentObjective) { objectiveSaveSkip = false; return; }
  const changed = currentObjective !== null;
  currentObjective = objective;
  typeObjective(objective.title, objective.text);
  // 목표가 새로 바뀌면 가장 오래된 저장 칸에 자동으로 저장한다(처음 그릴 때·불러온 직후는 제외, save.js).
  if (changed && !objectiveSaveSkip) saveObjectiveSlot();
  objectiveSaveSkip = false;
  // 처음 그릴 때가 아니라 진행 중에 바뀌었을 때만 잠깐 강조한다.
  if (!changed) return;
  objectivePanel.classList.remove('updated');
  void objectivePanel.offsetWidth;
  objectivePanel.classList.add('updated');
}
