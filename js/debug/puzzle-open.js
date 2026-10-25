// 시연용 퍼즐 열기: 고른 퍼즐 직전 상태(puzzle-skip.js의 PUZZLE_STEPS 단계 + items)로 바꾸고 그 장소로 옮긴 뒤,
// door가 있으면 그 앞에 서서 E를 누른 것처럼 퍼즐 화면을 연다. 푸는 건 발표자가 직접 한다.
// 장치를 조작하는 퍼즐이 아니면(박스 밀기·잠입 등) 그 방 입구에 세워 두기만 한다. key: 개발 UI 없이 바로 여는 단축키.
const PUZZLE_OPENERS = [
  { label: 'RF 태양광 승인번호 (1997)', step: 2, at: 'rooftop', open: () => { openPowerPanel(); powerLever.click(); } },
  { label: 'RF 태양광 전선 연결', step: 2, at: 'rooftop', open: openRoofWirePanel },
  { label: '17F 청소 카트 (메모 찾기)', step: 3, at: 'f17', door: '청소 카트' },
  { label: '17F 관리실 비밀번호 (1706)', step: 3, items: ['f17-manager-memo'], at: 'f17', door: '관리자 외 출입금지' },
  { label: '17F 비상 전력 분배반 (승강기 회선)', key: 'F3', step: 3, items: ['f17-manager-memo', 'f17-manager-unlocked', 'f17-circuit-guide-read'],
    at: 'f17-manager', door: '비상 전력 분배반' },
  { label: '1F 태양광 앱 설치 (안내 데스크 PC)', step: 4, items: ['f1-reached', 'f1-door-checked', 'story-f1-door-seen'], at: 'f1', door: '안내 데스크' },
  { label: '16F 편의점 우회 (주방 뒷문 · 셔터)', step: 6, at: 'f16-kitchen' },
  { label: '16F 라면 박스 밀기', step: 6, at: 'f16-cu' },
  { label: '1F R-01 정비 패널 (0914)', step: 7, at: 'f1', door: '경비 로봇' },
  { label: '12F 개발실 서랍 (카드키 찾기)', step: 9, at: 'f12-dev', door: '맨 왼쪽 서랍' },
  { label: '12F 로그 삭제 막기 (LAN 케이블)', key: 'F5', step: 9, items: ['f12-eval-keycard', 'f12-eval-door-opened'], at: 'f12-eval', door: '야간 로그 단말기' },
  { label: '12F 로그 파일 찾기 (터미널)', step: 10, items: ['f12-eval-keycard', 'f12-eval-door-opened'], at: 'f12-eval', door: '야간 로그 단말기' },
  { label: '14F 연구 자료실 (암실)', step: 10, at: 'f14-archive' },
  { label: '5F 이동식 발판', step: 11, at: 'f5-rnd' },
  { label: '8F 재현 순서 (시험 단말부터)', step: 12, at: 'f8-qa', door: '시험 단말' },
  { label: '7F 검증실 (갇히는 방)', step: 13, at: 'f7', door: '검증실' },
  { label: '1F ARCHI 포스터 (QR)', key: 'F4', step: 13, at: 'f1', door: 'ARCHI 포스터' },
  { label: '1F ARCHI-MAIN SSH 터미널', step: 13, at: 'f1', door: '안내 데스크', then: () => openComputerApp('terminal') },
  { label: '13F 보안 자료실 (전원 딜레마)', step: 14, at: 'f13-testbay', door: door => door.key === 'link:f13-secure' },
  { label: '13F 백업 USB 영상 (원격지원 PC)', step: 15, items: ['f13-ups'], at: 'f13-ops', door: '원격지원 PC' },
  { label: '2F 배터리 영사기 (디스크 + 리모컨)', step: 16, items: ['f2-reel', 'f2-remote'], at: 'f2-harmony', door: '배터리 영사기' },
  { label: 'B2 복도 카메라 잠입', step: 18, at: 'b2' },
  { label: 'B2 메인 콘솔 DELETE · 문 막기 · 삭제 배틀', step: 19, at: 'b2-main', door: 'ARCHI 메인 콘솔' },
];

const debugOpenSelect = document.getElementById('debug-open-select');
PUZZLE_OPENERS.forEach((entry, index) => debugOpenSelect.add(new Option(entry.key ? `[${entry.key}] ${entry.label}` : entry.label, index)));

function afterTransition(run) {
  if (transitioning) requestAnimationFrame(() => afterTransition(run));
  else run();
}

function openPuzzle(entry) {
  const floor = floorById.get(entry.at)?.floor;
  // 1층은 조명이 들어오면 R-01이 깨어나므로 단계가 정한 전력 그대로 둔다.
  restoreBeforeStep(entry.step, entry.items, floor !== 1 ? floor : null);
  // 앞 단계의 혼잣말 컷씬이 퍼즐 화면을 덮지 않게 이미 본 것으로 친다.
  for (const scene of STORY_SCENES) if (scene.ready()) collectedItems.add(scene.flag);
  transitionScene(() => debugGoTo(entry.at));
  afterTransition(() => {
    if (entry.door) {
      const match = typeof entry.door === 'function' ? entry.door : door => door.name === entry.door;
      const door = [guardPatrol.door, ...currentDoors].find(door => door && match(door));
      Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 });
      grounded = true;
      cameraX = cameraTarget();
      interact();
    }
    entry.open?.();
    if (entry.then) afterTransition(entry.then);
  });
}

document.getElementById('debug-open').addEventListener('submit', event => {
  event.preventDefault();
  if (!debugCanAct()) return;
  stage.focus({ preventScroll: true });
  openPuzzle(PUZZLE_OPENERS[Number(debugOpenSelect.value)]);
});
window.addEventListener('keydown', event => {
  const entry = PUZZLE_OPENERS.find(opener => opener.key === event.code);
  if (!entry || document.querySelector('#menu-key-list [aria-pressed="true"]')) return;
  event.preventDefault(); event.stopImmediatePropagation();
  if (!event.repeat && debugCanAct()) openPuzzle(entry);
}, true);
