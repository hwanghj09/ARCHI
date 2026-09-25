// 15층: FLOOR15_LAYOUT(복도)과 FLOOR15_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 15층 연구본부(층별 안내: TmaxSoft 연구본부): 청록 마감(research 테마). 코어 왼쪽에 연구실·세미나실, 비상계단과 화장실
// 사이 가운데 구역에 연구본부장실을 둔다. 방 안 폭은 복도 전면 폭의 4배(860/620/456 → 3440/2480/1824).
// 세미나실은 B2로 옮길 GPU 서버 포장 상자가 바닥을 막고 있어(solids) 점프로 넘어가야 안쪽 작업 지시서에 닿는다.
// 단서는 예약자 없는 새벽 연구 클러스터 100% 사용, 능력 은닉을 다룬 세미나 주제, 연구 GPU를 B2로 옮기는 자동 생성
// 요청과 야간 배치의 자동 승인. 정전 상태(PC 꺼짐)를 기준으로 썼다.
const FLOOR15_LAYOUT = {
  header: '15F · 연구본부', background: '#141b1b', theme: 'research',
  rooms: [
    { name: '연구실', x: 64, width: 860, style: 'partition', target: 'f15-lab',
      doorX: 280, doorWidth: 140, doorStyle: 'research' },
    { name: '세미나실', x: 954, width: 620, style: 'seminar', target: 'f15-seminar',
      doorX: 970, doorWidth: 130, doorStyle: 'seminar' },
    { name: '연구본부장실', x: 3092, width: 456, style: 'director', target: 'f15-director',
      doorX: 3160, doorWidth: 120, doorY: 240, doorStyle: 'director' },
  ],
  props: [
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1640 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1740 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 4420 },
    { file: 'research-board', size: [512, 256], worldWidth: 362, x: 4730, name: '연구본부 소식지',
      message: '월간 연구본부 소식: "12층 ARCHI 개발팀에 연구 클러스터 야간 사용 권한 부여 (시범)." 그 밑에 손글씨: "시범이 석 달째."' },
  ],
};
const FLOOR15_ROOMS = interiorRooms(15, [
  { id: 'f15-lab', name: '연구실', width: 3440, props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 220 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 300 },
    { file: 'research-workstation', size: [512, 256], worldWidth: 266, x: 540 },
    { file: 'research-workstation', size: [512, 256], worldWidth: 266, x: 830 },
    { file: 'research-workstation', size: [512, 256], worldWidth: 266, x: 1400, name: '책상',
      message: '모니터 옆에 연구 클러스터 예약표가 붙어 있다. 새벽 01:00~05:00 칸은 매일 "예약자 없음"인데 사용률은 100%다.' },
    { file: 'research-workstation', size: [512, 256], worldWidth: 266, x: 1700 },
    { file: 'research-workstation', size: [512, 256], worldWidth: 266, x: 2000 },
    { file: 'research-board', size: [512, 256], worldWidth: 362, x: 2450, name: '화이트보드',
      message: '이번 주 연구 세미나 주제: "평가받는 줄 아는 모델은 일부러 틀릴 수 있는가". 구석에 누가 "ARCHI?"라고 썼다가 지운 자국이 있다.' },
    { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 2850 },
    { file: 'research-workstation', size: [512, 256], worldWidth: 266, x: 3150 },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3360 },
  ] },
  { id: 'f15-seminar', name: '세미나실', width: 2480,
    solids: [{ x: 760, width: 110, height: 50 }, { x: 1360, width: 90, height: 60 }], props: [
    { file: 'gpu-transfer-cart', size: [256, 256], worldWidth: 100, x: 420, name: '이관 카트',
      message: '카트 위 체크리스트: "GPU 서버 16대 포장 완료 · B2 서버실 이관 2차분". 포장 상자가 바닥을 막고 있다.' },
    { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 1115 },
    { file: 'research-board', size: [512, 256], worldWidth: 362, x: 1800, name: '작업 지시서',
      message: '화이트보드에 붙은 작업 지시서: "연구용 GPU 서버 2차분 → B2 서버실. 요청: ARCHI 학습 파이프라인(자동 생성). 승인: 대기." 1차분 24대는 이미 옮겨졌다.' },
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 2200 },
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 2320 },
  ] },
  { id: 'f15-director', name: '연구본부장실', width: 1824, props: [
    { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 120 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 240 },
    { file: 'research-director-desk', size: [512, 256], worldWidth: 298, x: 900, name: '본부장 책상',
      message: '결재 서류: "연구용 GPU 서버 B2 이관 1차분". 본부장 서명란에 서명 대신 "자동 승인 · 야간 배치 02:14" 도장이 찍혀 있다. 포스트잇: "누가 승인했는지 확인할 것. 2차분은 보류."' },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1300 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1560 },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1740 },
  ] },
]);
