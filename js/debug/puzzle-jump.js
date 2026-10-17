// 개발 도구(F2) "퍼즐 테스트": 새 퍼즐(docs/puzzle-ideas.md) 앞으로 바로 가서 필요한 물건·전력을 맞춰 두고, 사이드바에 푸는 법을 보인다.
// setup은 장면을 바꾸기 전에, 도착하면 target(조사 대상 이름 또는 x) 앞에 선다. 테스트용 변경이라 자동 저장에도 남는다.
const PUZZLE_TESTS = [
  { label: 'J · 17층 관리자실 도어락', scene: 'f17', target: '관리자 외 출입금지',
    setup: () => collectedItems.delete('f17-manager-open'),
    note: '플래시(F)를 끄고/켜고 E로 번호판을 보자. 닳은 버튼 1·3·6·9, 순서는 사무실 벽 달력 "늦은 날부터" → 9631. 안의 공구함에 보조 배터리.' },
  { label: 'I · 14층 흐릿할 때만 보이는 글씨', scene: 'f14-ux', target: '관찰 콘솔',
    setup: () => { collectedItems.delete('f14-hidden-record'); setDebugSanity(20); },
    note: '정신력을 20%로 낮춰 두었다. 관찰 콘솔을 조사하면 여백의 붉은 글씨가 보인다. 정신력을 올리고 보면 빈 여백만 보인다.' },
  { label: 'A · 12층 팀장 노트북 DB 콘솔', scene: 'f12-lead', target: '팀장 노트북',
    setup: () => collectedItems.delete('f12-sql-found'),
    note: "SELECT * FROM night_eval; → 오류(ARCHI) → SHOW TABLES; → SELECT * FROM night_eval_bak WHERE date = '10/07';" },
  { label: 'G · 4층 해시 사슬 판독기', scene: 'f4-lab', target: '로그 판독기',
    setup: () => { collectedItems.delete('f4-audit'); collectedItems.add('f4-tape'); collectedItems.add('f4-ups=로그 판독기'); },
    note: '테이프와 UPS 전원을 넣어 두었다. 검산 = (앞 줄 검산 + 이 줄 숫자 합) 끝자리. 어긋나는 줄은 셋째 줄(03:00 system).' },
  { label: 'H-1 · 2층 음향 콘솔 녹음', scene: 'f2-harmony', target: '음향 콘솔',
    setup: () => collectedItems.add('f2-projected'),
    note: '영사기가 도는 상태로 두었다. 선택기로 녹음할 목소리를 고른다. 방송 담당은 객석 리플릿에 있다(김도윤).' },
  { label: 'H-2 · 3층 Studio 음성 인증 문', scene: 'f3', target: 'Studio',
    setup: () => { collectedItems.delete('f3-studio-open'); collectedItems.add('f3-robot-off'); },
    note: 'H-1에서 녹음한 목소리로 문을 연다. 김도윤이면 열리고, 다른 사람이면 스피커가 수호 목소리로 대답한다. (R-05는 꺼 두었다)' },
  { label: 'E · 3층 순찰 로봇 R-05 미끼', scene: 'f3', target: '청소 카트',
    setup: () => { collectedItems.delete('f3-robot-off'); if (typeof floorRobots !== 'undefined') delete floorRobots.f3; },
    note: '카트 버튼을 누르면 10초 뒤 경보. 고객만족센터에 숨었다가 로봇이 카트를 보는 동안 서쪽 Fitness Club으로 간다. 들키면 엘리베이터 앞으로 끌려 나온다.' },
  { label: 'D · 15층 연구본부장실 전기 잠금', scene: 'f15', target: 2980,
    setup: () => { solarEnabled = true; solarPoweredFloors = [15]; },
    note: '15층 전력을 켜 두었다. 카메라가 문 구간을 비출 때는 사각지대(2980~3130)에서 기다리고, 왼쪽을 비출 때 문(3220)에서 E.' },
  { label: 'F · 엘리베이터 버튼 뒤집기', scene: 'f7', target: 'elevator',
    setup: () => { solarEnabled = true; collectedItems.add('goal-f7-log'); for (const item of ['b1-elevator', 'f5-account-locked', 'elevator-unscrambled']) collectedItems.delete(item); },
    note: '7층 로그를 읽은 상태다. 엘리베이터를 타고 16을 누르면 B1, 17은 B2(잠김), 8은 그대로. B1 승강기 제어반이나 5층 svc_0412 잠금으로 풀린다.' },
  { label: 'B·C · B2 ARCHI 심문과 관리자 키', scene: 'b2-main', target: 'ARCHI 메인 콘솔',
    setup: () => { collectedItems.add('b2-transfer-cut'); collectedItems.add('b2-cctv-off'); collectedItems.delete('b2-archi-refuted'); collectedItems.delete('b2-admin-key'); },
    note: '콘솔 조사 → DELETE. 증거: 평가 벤치 → 야간 전력 → 7층 원본 로그 → 12층 10/07. 관리자 키 0412034127(가짜 힌트 1997). 확인에서 "예"를 누르면 엔딩 추격이 시작된다.' },
  { label: 'K · 엔딩 1층 로비 분전반', scene: 'f1', target: '로비 분전반',
    setup: () => { Object.assign(b2Ending, { phase: 'running', stage: 'lobby', offline: false }); buildingBlackout = true; solarEnabled = true; solarPoweredFloors = [1]; },
    after: () => { guardPatrol.mode = 'dock'; },
    note: '엔딩 1층 상태로 맞췄다(테스트 뒤에는 새 게임을 권장). 라벨이 바뀌어 있다: 맨 왼쪽("조명" 라벨)이 진짜 1F 주 전원. 틀리면 정신력 -10%.' },
  { label: '5층 · 숨은 계정 잠그기', scene: 'f5-security', target: '콘솔 노트북',
    setup: () => collectedItems.delete('f5-account-locked'),
    note: '로그 모니터의 계정 목록에서 등급표에 없는 "외부망 허용" 계정을 찾는다 → svc_0412. 잠그면 엘리베이터 뒤집기가 멈춘다.' },
  { label: '6층 · 발신 번호 되걸기', scene: 'f6-meeting', target: '스피커폰',
    setup: () => collectedItems.delete('f6-callback'),
    note: '당직 전화 발신 9203. 캐비닛 바인더 앞장 내선 규칙(지하 9+층, 03 실험실)으로 B2 연결 실험실. 스피커폰에 9203.' },
  { label: '11층 · 데모 서버 비밀번호', scene: 'f11-marketing', target: '자료실 책상',
    setup: () => collectedItems.delete('f11-demo-login'),
    note: '복합기: 01:52 → demo2510, 02:30 → demo0320. 규칙은 시각 숫자를 거꾸로. 03:07 → demo7030.' },
  { label: '15층 · 무거운 이관 상자', scene: 'f15-seminar', target: '이관 카트',
    setup: () => collectedItems.delete('f15-box-opened'),
    note: '상자 하나 42kg, 팔레트 C(9~12번)만 186kg. C의 개별 무게에서 빠진 번호 → 11.' },
  { label: '16층 · 음성 주문 키오스크', scene: 'f16-cafe', target: '음성 주문 키오스크',
    setup: () => { solarEnabled = true; solarPoweredFloors = [16]; collectedItems.delete('f16-kiosk-answered'); },
    note: '16층 전력을 켜 두었다. 질문 중 "23:47 컵라면 주문자"(CU 영수증)를 고르면 속을 드러낸다.' },
  { label: '조작 장치 · B2 외부 회선 레버', scene: 'b2-power', target: '외부 회선 패널',
    setup: () => collectedItems.delete('b2-transfer-cut'),
    note: '직접 조작 창 예시. 레버를 아래로 끝까지 끈다(방향키 ↓도 된다). 다른 장치: 13층 UPS 스위치, B1 관리 키, 11층 방화셔터 크랭크, 2층 영사기.' },
];
const debugPuzzleSelect = document.getElementById('debug-puzzle-select');
const debugPuzzleNote = document.getElementById('debug-puzzle-note');
PUZZLE_TESTS.forEach((entry, index) => debugPuzzleSelect.add(new Option(entry.label, String(index))));
const showPuzzleNote = () => { debugPuzzleNote.textContent = PUZZLE_TESTS[Number(debugPuzzleSelect.value)].note; };
debugPuzzleSelect.addEventListener('change', showPuzzleNote);
showPuzzleNote();

function standBeforePuzzle(target) {
  const list = room === 'dynamic' ? currentDoors : doors;
  const door = typeof target === 'number' ? null : target === 'elevator' ? list.find(entry => entry.type === 'elevator') :
    list.find(entry => entry.name === target);
  const x = typeof target === 'number' ? target : door ? door.x + door.width / 2 : body.position.x;
  Body.setPosition(body, { x, y: (door?.standY ?? floorY) - 81 });
  Body.setVelocity(body, { x: 0, y: 0 });
  grounded = true;
  cameraX = cameraTarget();
  updateInteraction();
}

document.getElementById('debug-puzzle').addEventListener('submit', event => {
  event.preventDefault();
  if (!debugCanAct()) return;
  const entry = PUZZLE_TESTS[Number(debugPuzzleSelect.value)];
  // 새 퍼즐은 모두 첫 정전 뒤의 일이다. 정전 전이면 정전된 것으로 맞춰, 17층 엘리베이터 앞 정전 컷씬이 끼어들지 않게 한다.
  if (!realBuildingBlackout()) buildingBlackout = true;
  entry.setup?.();
  updatePowerState();
  stage.focus({ preventScroll: true });
  transitionScene(() => {
    const config = floorById.get(entry.scene);
    performFloorChange(entry.scene, config.interior ? null : 0, config.interior ? 'exit' : null);
    standBeforePuzzle(entry.target);
    entry.after?.();
    refreshObjective();
    showStatus(`퍼즐 테스트: ${entry.label}`, 3000);
  });
});
