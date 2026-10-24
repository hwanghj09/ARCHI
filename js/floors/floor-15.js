// 15층: FLOOR15_LAYOUT(복도)과 FLOOR15_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 15층 연구본부(층별 안내: TmaxSoft 연구본부): 청록 마감(research 테마). 코어 왼쪽에 연구실·세미나실, 비상계단과 화장실
// 사이 가운데 구역에 연구본부장실을 둔다. 방 안 폭은 복도 전면 폭의 4배(860/620/456 → 3440/2480/1824).
// 세미나실의 장비 상자(solids)는 점프로 넘을 수 있다. 예약자 없는 새벽 클러스터 사용과 능력 은닉 관련 환경 자료만 남긴다.
// 이관·자동 결재 서브스토리는 제거하고 장비와 이동 장애물만 남긴다. 정전 상태(PC 꺼짐)를 기준으로 썼다.
// build.py가 공용 벽 모듈의 복도와 별도 천장·바닥·벽을 만든다. 문·소품과 GPU 상자의 충돌 크기·높이는 유지한다.
const floor15Scene = (name, width) => [
  { src: `assets/background/floor15/floor15-ceiling-${name}.png`, width, height: 100, top: 0 },
  { src: `assets/background/floor15/floor15-floor-${name}.png`, width, height: 204, top: 556 },
  { src: `assets/background/floor15/floor15-${name}-interior.png`, width, height: 475, top: 100 },
];
const FLOOR15_LAYOUT = {
  header: '15F · 연구본부', background: '#141b1b', theme: 'research',
  backgroundWallsOnly: true, backgroundImage: { src: 'assets/background/floor15/walls.png', height: 760, top: 0 },
  rooms: [
    { name: '연구실', x: 64, width: 860, style: 'partition', target: 'f15-lab',
      doorX: 280, doorWidth: 140, doorStyle: 'research' },
    { name: '세미나실', x: 954, width: 620, style: 'seminar', target: 'f15-seminar',
      doorX: 986, doorWidth: 130, doorStyle: 'office-lab' },
    { name: '연구본부장실', x: 3092, width: 456, style: 'director', target: 'f15-director',
      doorX: 3160, doorWidth: 120, doorY: 240, doorStyle: 'director' },
  ],
  fixtures: [
    // 숨는 환풍구(화장실 동쪽 흰 벽). 안에서는 연구본부장실 쪽 흰 벽과 기둥이 보인다.
    wallVent(3950, 3050),
  ],
  props: [
    { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 3420 },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1640 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1740 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 4420 },
    { file: 'research-news-board', size: [512, 256], worldWidth: 362, x: 4730, name: '연구본부 소식지' },
  ],
};
const FLOOR15_ROOMS = interiorRooms(15, [
  { id: 'f15-lab', name: '연구실', width: 3440,
    exteriorWindows: [400, 1440, 1800, 2800].map(x => ({ x, y: 142, width: 337, height: 226 })),
    backgroundWallsOnly: true, backgroundImage: floor15Scene('lab', 3440), props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 220 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 300 },
    { file: 'research-workstation', size: [512, 256], worldWidth: 266, x: 540 },
    { file: 'research-workstation', size: [512, 256], worldWidth: 266, x: 830 },
    { file: 'research-workstation', size: [512, 256], worldWidth: 266, x: 1400, name: '책상',
      message: '모니터 옆에 연구 클러스터 예약표가 붙어 있다. 새벽 01:00~05:00 칸은 매일 "예약자 없음"인데 사용률은 100%다.',
      surface: 'document',
      writing: [{ as: 'title', text: '연구 클러스터 예약표' }, '새벽 01:00~05:00', { as: 'field', label: '예약자', text: '예약자 없음' },
        { as: 'field', label: '사용률', text: '100%' }, { text: '(매일 같음)', size: 'small' }],
      caption: '모니터 옆에 연구 클러스터 예약표가 붙어 있다.' },
    { file: 'research-workstation', size: [512, 256], worldWidth: 266, x: 1700 },
    { file: 'research-workstation', size: [512, 256], worldWidth: 266, x: 2000 },
    { file: 'research-board', size: [512, 256], worldWidth: 362, x: 2450, name: '화이트보드',
      message: '이번 주 연구 세미나 주제: "평가받는 줄 아는 모델은 일부러 틀릴 수 있는가". 구석에 누가 "ARCHI?"라고 썼다가 지운 자국이 있다. 오른쪽 위 출력물: 새벽 연구 클러스터 사용률 100%.',
      writing: [{ as: 'title', text: '이번 주 연구 세미나 주제' }, '평가받는 줄 아는 모델은', '일부러 틀릴 수 있는가',
        { as: 'erased', text: '\nARCHI?' },
        { as: 'paper', title: '연구 클러스터 사용률', text: '새벽 01:00~05:00\n사용률 100%\n(예약자 없음)' },
        { as: 'paper', title: '세미나 자료', text: '평가 상황별\n모델 정답률 비교표' }],
      caption: '구석에 누가 "ARCHI?"라고 썼다가 지운 자국이 있다.' },
    { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 2850 },
    { file: 'research-workstation', size: [512, 256], worldWidth: 266, x: 3150 },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3360 },
  ] },
  { id: 'f15-seminar', name: '세미나실', width: 2480,
    exteriorWindows: [440, 800, 1160, 1520, 1880].map(x => ({ x, y: 142, width: 337, height: 226 })),
    backgroundWallsOnly: true, backgroundImage: floor15Scene('seminar', 2480),
    solids: [{ x: 760, width: 110, height: 50 }, { x: 1360, width: 90, height: 60 }], props: [
    { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 198, x: 590 },
    { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1520 },
    { file: 'gpu-transfer-cart', size: [256, 256], worldWidth: 100, x: 420, name: '이관 카트' },
    { file: 'meeting-table', size: [512, 256], worldWidth: 420, x: 1115 },
    { file: 'research-board', size: [512, 256], worldWidth: 362, x: 1800, name: '작업 지시서' },
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 2200 },
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 2320 },
  ] },
  { id: 'f15-director', name: '연구본부장실', width: 1824,
    exteriorWindows: [700, 1060, 1420].map(x => ({ x, y: 142, width: 337, height: 226, blinds: true })),
    backgroundWallsOnly: true, backgroundImage: floor15Scene('director', 1824), props: [
    { file: 'coat-rack', size: [256, 512], worldWidth: 80, x: 620 },
    { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 120 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 240 },
    { file: 'research-director-desk', size: [512, 256], worldWidth: 298, x: 900, name: '본부장 책상' },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1300 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1560 },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1740 },
  ] },
]);
