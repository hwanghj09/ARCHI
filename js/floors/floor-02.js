// 2층: FLOOR2_LAYOUT(복도)과 FLOOR2_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 2층 Harmony Hall·서버실(층별 안내: Harmony Hall / 서버실): 짙은 청록 벨벳과 금박 몰딩(concert 테마).
// Harmony Hall은 1층과 2층을 한 공간으로 쓰는 공연장이라, 2층 객석 전면을 1층 Harmony Hall 전면 바로 위(x=40..560)에 두고
// 그 옆에 영사실을 붙인다. 서버실은 화장실 오른쪽 구역 끝에 떨어져 있다(왼쪽 2 + 오른쪽 1).
// 방 안 폭은 복도 전면 폭의 6.4배(520/300/460 → 3328/1920/2944).
// 장치는 방을 건너는 영사: 서버실 Harmony Hall 녹화 NAS에서 04:00 자동 삭제를 앞둔 "03:00 무관객 리허설" 원본 디스크를 챙겨(gives
// 'f2-reel') 영사실의 배터리 영사기에 꽂으면(requires → gives 'f2-projected') 영사기가 관람창 너머 객석 스크린을 비춘다. 화면은
// 영사실이 아니라 2층 객석에 가야 보인다(설비 requires → data-ready). 스크린이 이 층의 핵심 단서다.
// 단서 방향: 무관객 리허설은 음성 합성 시험이었고 화자 표본 312명의 마지막이 17F 정수호라는 것(사람의 목소리·반응을 모은 기록,
// 서브엔딩 복선), 객석 마이크가 관객 없는 밤에도 수집한다는 것, CCTV·출입 통제·방송 서버가 이미 B2로 옮겨졌고 남은 녹화 NAS도
// SYSTEM이 옮기려 했다는 것, 새벽 03:00 영사기를 돌린 운영자가 SYSTEM이라는 것. 정전 상태(영사기만 배터리)를 기준으로 썼다.
const FLOOR2_LAYOUT = {
  header: '2F · Harmony Hall · 서버실', background: '#10181a', theme: 'concert',
  rooms: [
    { name: 'Harmony Hall', x: 40, width: 520, style: 'balcony-portal', target: 'f2-harmony',
      doorX: 400, doorWidth: 130, doorStyle: 'balcony-door' },
    { name: '영사실', x: 560, width: 300, style: 'booth', target: 'f2-booth',
      doorX: 590, doorWidth: 100, doorStyle: 'booth-door' },
    { name: '서버실', x: 4330, width: 460, style: 'server-cage', target: 'f2-server',
      doorX: 4420, doorWidth: 130, doorStyle: 'server-door' },
  ],
  fixtures: [
    { name: '정기 연주회 포스터', x: 1000, y: 260, width: 160, height: 190, style: 'concert-poster',
      lines: ['HARMONY HALL', '사내 정기 연주회', 'with ARCHI 자동 반주'],
      message: '포스터 아래 작은 글씨: "반주 ARCHI · 무대 연출 자동화." 누군가 볼펜으로 덧붙였다: "리허설은 새벽에 혼자 한다던데."' },
    { name: '서버실 출입 안내', x: 4820, y: 300, width: 110, height: 110, style: 'server-sign',
      lines: ['2F 서버실', '녹화 NAS', '관계자 외 출입 금지'] },
  ],
  props: [
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1350 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1560 },
    { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 1700 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 3330 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3500 },
  ],
};
const FLOOR2_ROOMS = interiorRooms(2, [
  { id: 'f2-harmony', name: 'Harmony Hall', width: 3328, interiorStyle: 'balcony',
    fixtures: [
      { name: '객석 스크린', x: 300, y: 90, width: 800, height: 250, style: 'hall-screen', requires: 'f2-projected',
        lines: ['03:00 무관객 리허설', '음성 합성 시험 · 화자 표본 312명', '"안녕하세요, 저는 정수호입니다."'],
        missingMessage: '무대 위 스크린이 까맣다. 뒤쪽 영사실 관람창도 어둡다.',
        message: '스크린에 어젯밤 03:00 무관객 리허설 녹화가 비친다. 무대에는 아무도 없고 조명만 움직인다. 자막: "음성 합성 시험 · 화자 표본 312명." 같은 문장이 사람을 바꿔 가며 이어진다: "안녕하세요, 저는 ___입니다." 마지막 이름은 "17F 정수호"다.' },
      { name: '2층 객석', x: 200, y: 486, width: 1600, style: 'balcony-rows' },
    ],
    props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1900 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 2100 },
      { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 2500, name: '객석 음향 카트',
        message: '객석 팔걸이마다 달린 소형 마이크의 수신기 카트다. 라벨: "관객 반응 수집 · 무관객 리허설 중에도 수집 · ARCHI." 관객이 없는 밤에 무엇을 모았을까.' },
    ] },
  { id: 'f2-booth', name: '영사실', width: 1920, windowless: true, interiorStyle: 'projection',
    fixtures: [
      { name: '관람창', x: 780, y: 120, width: 460, height: 150, style: 'booth-window', requires: 'f2-projected' },
      { name: '영사기', x: 900, y: 380, width: 200, style: 'projector', requires: 'f2-reel', gives: 'f2-projected',
        missingMessage: '배터리로 도는 디지털 영사기다. 전원 표시등은 켜져 있지만 투입구가 비어 있다. 라벨: "녹화 NAS 디스크 전용 · 원본은 서버실."',
        message: '디스크를 꽂자 영사기가 돌기 시작한다. 빛줄기가 관람창 너머 객석 스크린으로 뻗는다. 화면은 객석에서 봐야 보인다.',
        takenMessage: '영사기가 조용히 돌고 있다. 빛줄기는 계속 객석 스크린을 비춘다.' },
    ],
    props: [
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 600, name: '영사 일지',
        message: '영사 일지. 낮 행사 칸은 영사 기사 이름이고, 매일 03:00 칸은 "자동 · 무관객 리허설 · 운영 SYSTEM"이다. 마지막 장 메모: "아침에 와 보면 영사기가 따뜻하다. 녹화 원본은 04:00에 자동 삭제."' },
      { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 1450 },
      { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 198, x: 1760 },
    ] },
  { id: 'f2-server', name: '서버실', width: 2944, windowless: true, interiorStyle: 'rack-aisle',
    props: [
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 110 },
      { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 220 },
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 1100, name: '녹화 NAS', gives: 'f2-reel',
        message: 'Harmony Hall 녹화 NAS다. 디스크 칸 하나가 반쯤 빠져 있다. 라벨: "03:00 무관객 리허설 · 원본 · 04:00 자동 삭제." 정전으로 삭제가 멈춘 모양이다. 디스크를 챙겼다.',
        takenMessage: '디스크를 빼낸 칸이 비어 있다.' },
      { file: 'server-cooling-unit', size: [256, 512], worldWidth: 96, x: 1250 },
      { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1450 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1900, name: '이전 작업표',
        message: '서버 이전 작업표. CCTV 녹화 · 출입 통제 · 사내 방송 서버를 전부 B2로 옮겼다. 남은 것은 Harmony Hall 녹화 NAS 한 대. 비고: "이것도 B2로 옮기자는 요청 SYSTEM · 시설팀 보류."' },
      { file: 'electrical-panel', size: [256, 512], worldWidth: 89, x: 2300 },
      { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 2500 },
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 2620 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 2850 },
    ] },
]);
