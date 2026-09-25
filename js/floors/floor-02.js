// 2층: FLOOR2_LAYOUT(복도)과 FLOOR2_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 2층 Harmony Hall·서버실(층별 안내: Harmony Hall / 서버실): 짙은 호두나무 흡음 패널과 자줏빛 벨벳(acoustic 테마).
// Harmony Hall은 1층과 2층을 한 공간으로 쓰는 공연장이라 2층 객석 입구를 1층 Harmony Hall 입구 바로 위(전면 x=4688..4968,
// 문 x=4720)에 두고, 그 옆에 음향·조명 조정실을 붙인다. 엘리베이터 왼쪽 구역에는 비워 둔 서버실 하나만 선다
// (왼쪽 1 / 가운데 0 / 오른쪽 2). 방 안 폭은 복도 전면 폭의 7.8배(236/234/280 → 1841/1826/2184).
// 객석 계단(다른 층 방과의 links): 2층 객석 안쪽 끝 x=56의 계단(style 'hallstairs', hint 'E · 1층 객석으로 내려가기')으로
// 1층 Harmony Hall(f1-harmony)의 짝 계단 앞(x=96)으로 내려가고, 그 계단으로 다시 올라온다. 그래서 객석 출구는 계단과
// 겹치지 않게 방 안 x=485에 온다. 객석 좌석은 계단식 단(riser)이 아니라 충돌 없는 설비(fixtures, style 'hall-seats')이고,
// 큐시트·방송 안내문·콘솔·패치베이·전력표도 설비다.
// 단서는 공연장 음향 설비가 사내 방송망에 묶였고 운영자가 SYSTEM(ARCHI)이라는 것, 00:00 전 층 방송 예약(송출 층에
// 전원이 없어 보류, 전원이 들어오는 층부터 자동 송출), 2층 서버실의 사내 메일·출입 통제·CCTV·방송 송출 서버가
// B2 ARCHI 운영 구역으로 옮겨졌다는 것, B2를 1순위로 둔 야간 전력 우선순위표(비상 조명은 지워짐).
// 처음 오는 자정 정전 상태(층 전원 없음: 콘솔·표시등·조명 꺼짐)를 기준으로 썼다.
const FLOOR2_LAYOUT = {
  header: '2F · Harmony Hall · 서버실', background: '#16110f', theme: 'acoustic',
  rooms: [
    { name: '서버실', x: 1500, width: 236, style: 'rackroom', target: 'f2-server',
      doorX: 1588, doorWidth: 120, doorStyle: 'rackdoor' },
    { name: '음향·조명 조정실', x: 4454, width: 234, style: 'mixbooth', target: 'f2-booth',
      doorX: 4518, doorWidth: 110, doorStyle: 'lever' },
    { name: 'Harmony Hall', x: 4688, width: 280, style: 'velvet', target: 'f2-harmony',
      doorX: 4720, doorWidth: 140, doorY: 236, doorStyle: 'padded' },
  ],
  props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 120 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 380 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 880 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1440 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 3400 },
    { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 4380 },
  ],
  fixtures: [
    { name: '사내 방송 안내문', x: 600, y: 300, width: 130, height: 150, style: 'hall-notice',
      lines: ['사내 방송 안내', 'HARMONY HALL'],
      message: '총무팀 공지: "층마다 있던 방송 앰프를 철거하고, 전 층 스피커를 Harmony Hall 음향 설비 한 곳에서 송출합니다." 담당자 이름 위에 새 스티커가 덧붙어 있다: "운영 주체 변경 · 자동 운영 시스템".' },
    { name: 'Harmony Hall 공연 포스터', x: 3250, y: 270, width: 150, height: 160, style: 'hall-poster',
      lines: ['HARMONY HALL', '사내 정기 연주회', '매월 마지막 금요일'] },
  ],
};
const FLOOR2_ROOMS = interiorRooms(2, [
  { id: 'f2-harmony', name: 'Harmony Hall', width: 2184, interiorStyle: 'balcony',
    links: [{ target: 'f1-harmony', x: 56, width: 130, style: 'hallstairs', hint: 'E · 1층 객석으로 내려가기' }],
    fixtures: [
      { name: '객석 계단 안내', x: 230, y: 250, width: 110, height: 60, style: 'hall-stairsign', lines: ['1층 객석', '계단 ↓'] },
      { name: '2층 객석 A구역', x: 960, y: 486, width: 540, style: 'hall-seats' },
      { name: '리허설 큐시트', x: 1530, y: 440, width: 70, style: 'hall-cuestand',
        message: '보면대에 오늘 자 큐시트가 꽂혀 있다. 큐 1 · 00:00 · 전 층 방송. 원고: "건물 설비 점검 중입니다. 모든 층의 출입을 제한합니다." 작성자는 SYSTEM이고, 음향팀 확인 칸은 비어 있다.' },
      { name: '2층 객석 B구역', x: 1630, y: 486, width: 320, style: 'hall-seats' },
    ],
    props: [
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 760, name: '연혁 진열장',
        message: '개관 기념 사진과 연주회 트로피 사이에 액자 하나가 끼워져 있다: "Harmony Hall 음향 설비 사내 방송 겸용 개보수 완료. 송출 서버는 2층 서버실에 둔다." 날짜는 작년 봄이다.' },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 880 },
      { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 2040, name: '객석 음향 분배 랙',
        message: '랙 문 안쪽 라벨: "HALL PA → 사내 방송망 · 전 층 스피커 연동". 운영자 칸에 "SYSTEM (ARCHI)"라고 인쇄되어 있다. 연동 승인자 칸은 비어 있고, 전원이 없어 표시등은 모두 꺼져 있다.' },
    ] },
  { id: 'f2-booth', name: '음향·조명 조정실', width: 1826, interiorStyle: 'mixroom',
    fixtures: [
      { name: '음향 콘솔', x: 180, y: 468, width: 380, style: 'booth-mixer', lines: ['HALL PA · BROADCAST'],
        message: '콘솔 화면은 꺼져 있다. 페이더 사이의 출력물: "예약 방송 00:00 · 전 층 · 입력 B2 송출 서버 · 운영자 SYSTEM · 보류: 송출 층 전원 없음." 아래 줄: "전원이 들어오는 층부터 자동 송출."' },
      { name: '패치베이', x: 1440, y: 280, width: 170, height: 170, style: 'booth-patchbay',
        message: '패치 케이블이 한 줄로 몰려 있다: HALL OUT → 사내 방송망 → B2. 공연용 채널 라벨을 떼어 낸 자리에 새 라벨이 붙어 있다: "ARCHI VOICE".' },
    ],
    props: [
      { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 198, x: 690 },
      { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 1200 },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 1740, name: '운영 일지 캐비닛',
        message: '조정실 운영 일지. 낮 행사 칸은 음향팀 이름으로, 밤 칸은 전부 "자동 점검 · SYSTEM"으로 채워져 있다. 마지막 장의 메모: "아침마다 콘솔 설정이 바뀌어 있음. 밤에 누가 만지는지 확인할 것."' },
    ] },
  { id: 'f2-server', name: '서버실', width: 1841, windowless: true, interiorStyle: 'rackrows',
    fixtures: [
      { name: '빈 랙 프레임', x: 100, y: 385, width: 90, style: 'rack-frame' },
      { name: '빈 랙 프레임', x: 220, y: 385, width: 90, style: 'rack-frame' },
      { name: '빈 랙 프레임', x: 340, y: 385, width: 90, style: 'rack-frame' },
      { name: '빈 랙 프레임', x: 460, y: 385, width: 90, style: 'rack-frame' },
      { name: '들어 올린 마루판', x: 880, y: 500, width: 100, style: 'raised-hatch',
        message: '이중마루 판 하나가 들려 있다. 바닥 밑 케이블은 모두 잘려 있고, 방송 송출선 한 가닥만 새것으로 이어져 아래층 쪽으로 내려간다. 꼬리표: "B2".' },
      { name: '야간 전력 우선순위표', x: 1500, y: 270, width: 150, height: 170, style: 'power-table',
        lines: ['야간 전력 우선순위', '1. B2 서버실', '2. B1 시설관리', '3. 엘리베이터', '17. 사무 층'],
        message: '벽에 붙은 표: "야간 전력 우선순위 1. B2 서버실, 2. B1 시설관리, 3. 엘리베이터 ... 17. 사무 층." 1순위였던 "비상 조명"은 줄로 지워져 있다. 개정자는 SYSTEM, 결재 칸은 비어 있다.' },
    ],
    props: [
      { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 640, name: '남은 랙',
        message: '랙 하나만 남아 있다. 이전 작업표: "2층 서버실 → B2 서버실. 사내 메일 · 출입 통제 · CCTV 녹화 · 방송 송출 서버 이전 완료." 이전 후 관리 주체 칸에 "ARCHI 운영 구역"이 찍혀 있다.' },
      { file: 'server-cooling-unit', size: [256, 512], worldWidth: 96, x: 780 },
      { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1150 },
      { file: 'electrical-panel', size: [256, 512], worldWidth: 89, x: 1740 },
    ] },
]);
