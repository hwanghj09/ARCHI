// 17층: 확장 구역의 방(FLOOR17)과 방 내부(FLOOR17_ROOMS). 복도 자체는 world/corridor17.js의 고정 장면이다.
// 복도 벽면 범위는 service-corridor.png의 벽기둥 중심(x=3556, 4282)과 끝벽(4968) 기준이다.
const CIRCUIT_GUIDE_MESSAGE = '태양광은 조명 전용이다. 승강기는 별도 비상 UPS로 공급한다. 공급 S 단자는 중계 릴레이 R을 거쳐 승강기 E 단자로 간다. 두 점검표를 함께 보고 경로를 추적하자. 네 가닥을 연결한 뒤 회로 검사를 통과해야 전력이 복구된다.';
const MANAGER_ROOM_CODE = '1706';
// 관리실 비상 출입 메모: 복도 청소 카트에 숨겨져 있고(corridor17.js), 챙기면 가방에서 다시 본다(inventory.js).
const MANAGER_MEMO_TEXT = `관리자 외 출입금지실 비밀번호: ${MANAGER_ROOM_CODE}. 태양광은 전등 전용. 승강기가 멈췄으면 관리실 책상의 회로 안내도를 보고 비상 전력 분배반의 회선을 연결할 것.`;
const MANAGER_MEMO_SHEET = { surface: 'memo', look: 'manager-access', writing: [
  { as: 'title', text: '관리실 비상 출입 메모' },
  '관리자 외 출입금지실',
  { as: 'hand', text: `비밀번호: ${MANAGER_ROOM_CODE}`, ink: 'red', bold: true },
  '태양광은 전등 전용.',
  '승강기 정지 시 관리실 책상의 회로 안내도를 보고 비상 전력 분배반의 회선을 연결할 것.',
] };
const EMERGENCY_CIRCUITS = [
  { color: 'red', source: 'S1', relay: 'R2', target: 'E3', label: '승강기 구동' },
  { color: 'yellow', source: 'S2', relay: 'R4', target: 'E1', label: '제어 장치' },
  { color: 'blue', source: 'S3', relay: 'R1', target: 'E4', label: '문 개폐' },
  { color: 'green', source: 'S4', relay: 'R3', target: 'E2', label: '안전 접지' },
];
const FLOOR17 = { id: 'f17', floor: 17, short: '17F', label: '17층 · 복도', header: '17F · 복도', aria: '17층 복도', roomDoorY: 210,
  rooms: [
  { name: '화장실', target: 'f17-restroom', ...BUILDING_CORE.restroom },
  { name: '관리자 외 출입금지', target: 'f17-manager', x: 4282, width: 686,
    doorX: 4378, doorWidth: 171, doorStyle: 'metal', locked: true,
    code: MANAGER_ROOM_CODE, unlockedBy: 'f17-manager-unlocked',
    codeMessage: '관리자실 도어락이 열렸다. 안쪽에서 비상 전력 회선을 확인하자.',
    message: '관리자실 문이 잠겨 있다. 4자리 번호를 입력해야 한다. 문 옆에 작은 글씨: "비상 출입 메모는 청소 카트에 보관."' },
] };
const FLOOR17_ROOMS = interiorRooms(17, [
  { id: 'f17-restroom', ...restroomInterior },
  { id: 'f17-manager', name: '관리자실', width: 1040, windowless: true, exitStyle: 'office-solid',
    backgroundWallsOnly: true, backgroundImage: { src: 'assets/background/floor17/floor17-manager-finished.png', height: 760, top: 0 }, props: [
    // 빠루(f17-crowbar): 환풍구 덮개를 뜯는 공구. 로봇이 없는 17층에서 초반에 챙겨 간다.
    { file: 'staff-lockers', size: [256, 512], worldWidth: 100, x: 90, name: '공구 사물함', gives: 'f17-crowbar',
      message: '사물함 안쪽 고리에 빠루가 걸려 있다. 손잡이에 붙은 테이프: "덕트 점검용 · 그릴 나사 다 녹슬었음." 챙겼다.',
      takenMessage: '빠루를 걸어 두던 고리만 남아 있다.' },
    { file: 'janitor-cart', size: [256, 512], worldWidth: 78, x: 968 },
    { file: 'electrical-panel', size: [480, 626], worldWidth: 122, x: 500, name: '비상 전력 분배반',
      sprite: 'assets/ui/floor17/emergency-panel-states.png', stateBy: 'f17-emergency-linked', powerCircuit: true,
      message: '비상 UPS는 살아 있지만 승강기 회선 네 가닥이 분리되어 있다. 책상의 회로 안내도로 공급 단자와 승강기 단자를 확인하자.' },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 800, name: '비상 전력 회로 안내도', gives: 'f17-circuit-guide-read',
      message: CIRCUIT_GUIDE_MESSAGE, takenMessage: CIRCUIT_GUIDE_MESSAGE, // 챙긴 뒤에도(gives) 같은 안내도를 몇 번이든 다시 볼 수 있다
      surface: 'document', caption: '17층 비상 전력 분배 · 단자 번호를 확인할 것',
      writing: [{ as: 'title', text: '비상 전력 회로 안내도' }, '태양광: 층별 전등만 공급. 승강기는 별도 비상 UPS 사용.',
        { as: 'table', head: true, rows: [['공급 단자', '중계 릴레이', '용도'], ...EMERGENCY_CIRCUITS.map(circuit => [circuit.source, circuit.relay, circuit.label])] },
        { as: 'page' }, // 두 점검표를 낱장 두 장으로 나눠 한 화면에 스크롤 없이 보이게 한다
        { as: 'table', head: true, rows: [['중계 릴레이', '승강기 단자'], ...[...EMERGENCY_CIRCUITS].sort((a, b) => a.relay.localeCompare(b.relay)).map(circuit => [circuit.relay, circuit.target])] },
        { as: 'hand', text: '색과 줄 순서는 일치하지 않음. S→R→E 경로를 추적할 것. 접지를 포함한 네 회선 연결 후 반드시 회로 검사. 오류 시 공급 단자를 눌러 연결 해제.', ink: 'red' },
        '비상 설비 버스: 승강기 · 작업용 컴퓨터 · 충전 콘센트. 층별 조명은 옥상 태양광으로 따로 제어.' ] },
  ] },
]);
