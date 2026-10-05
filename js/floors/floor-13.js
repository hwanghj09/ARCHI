// 13층: FLOOR13_LAYOUT(복도)과 FLOOR13_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 13층 기술본부(층별 안내: TmaxSoft 기술본부): 강철색 마감에 주황 표지(support 테마). 다른 층과 달리 엘리베이터 왼쪽은
// 벽 없는 엔지니어 공용석(복도에 놓인 책상)이고, 방은 비상계단 옆 가운데 구역에 기술지원 상황실, 화장실 오른쪽 구역에
// 장비 검증실·고객 교육장을 둔다. 방 안 폭은 복도 전면 폭의 5.7배(460/320/320 → 2622/1824/1824).
// 상황실의 장애 알림 프린터는 장비 검증실 UPS의 비상 회선에 물려 있어 UPS를 켜기 전에는 출력되지 않는다
// (소품 requires = 다른 소품의 gives, 그 전에는 missingMessage).
// 단서는 새벽 B2 전력 경보·외부 송신 경보를 SYSTEM이 자동 종결했다는 것, 설치 기록 없는 원격 접속 에이전트,
// 옥상 비상 전력은 한 번에 한 층만 켤 수 있다는 교육 자료. 정전 상태(모니터 꺼짐)를 기준으로 썼다.
const FLOOR13_LAYOUT = {
  header: '13F · 기술본부', background: '#18191b', theme: 'support',
  rooms: [
    { name: '기술지원 상황실', x: 3090, width: 460, style: 'ops', target: 'f13-ops',
      doorX: 3240, doorWidth: 160, doorStyle: 'ops' },
    { name: '장비 검증실', x: 4290, width: 320, style: 'cage', target: 'f13-testbay',
      doorX: 4300, doorWidth: 130, doorY: 236, doorStyle: 'cage' },
    { name: '고객 교육장', x: 4620, width: 320, style: 'classroom', target: 'f13-training',
      doorX: 4800, doorWidth: 120, doorStyle: 'classroom' },
  ],
  props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 200 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 280 },
    { file: 'support-workstation', size: [512, 256], worldWidth: 270, x: 480 },
    { file: 'support-workstation', size: [512, 256], worldWidth: 270, x: 760 },
    { file: 'support-workstation', size: [512, 256], worldWidth: 270, x: 1040 },
    { file: 'dispatch-board', size: [512, 256], worldWidth: 350, x: 1400, name: '출동 현황판',
      message: '엔지니어 출동 현황: 전원 "고객사 상주". 본사 야간 대기: 0명. 아래 공지: "야간 장애 알림은 자동 종결 시스템이 대응합니다."',
      writing: [{ as: 'title', text: '엔지니어 출동 현황' }, { as: 'table', rows: [['전원', '고객사 상주'], ['본사 야간 대기', '0명']] },
        { as: 'paper', title: '공지', text: '야간 장애 알림은\n자동 종결 시스템이 대응합니다.', place: 'main' }] },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1680 },
  ],
};
const FLOOR13_ROOMS = interiorRooms(13, [
  { id: 'f13-ops', name: '기술지원 상황실', width: 2622, interiorStyle: 'monitors', props: [
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 120 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 200 },
    { file: 'support-workstation', size: [512, 256], worldWidth: 270, x: 480, name: '교대 근무 일지',
      message: '야간 당직 일지: "이번 달부터 야간 장애 대응은 자동 종결 시스템이 맡음. 당직 폐지." 마지막 장의 낙서: "B2 알림은 뜨자마자 닫힘. 사람은 볼 틈도 없음."',
      surface: 'notebook',
      writing: [{ as: 'title', text: '야간 당직 일지' }, '이번 달부터 야간 장애 대응은', '자동 종결 시스템이 맡음.', '당직 폐지.',
        { as: 'page' }, { text: 'B2 알림은 뜨자마자 닫힘.', ink: 'blue' }, { text: '사람은 볼 틈도 없음.', ink: 'blue' }] },
    { file: 'support-workstation', size: [512, 256], worldWidth: 270, x: 780 },
    { file: 'incident-printer', size: [256, 256], worldWidth: 117, x: 1060, name: '장애 알림 프린터', requires: 'f13-ups',
      clue: '02:14 B2 전력 임계치 초과, 03:05 원격지원 게이트웨이 외부 송신 급증. 둘 다 사람 확인 없이 SYSTEM이 자동 종결했다.',
      sprite: 'assets/objects/floor13/incident-printer-states.png', stateBy: 'f13-ups',
      animation: { src: 'assets/objects/floor13/printer-feed.png', frames: 4 },
      missingMessage: '프린터 전원이 꺼져 있다. 전원선 꼬리표: "장비 검증실 UPS 비상 회선".',
      missingSheet: { surface: 'label', look: 'tag', writing: ['장비 검증실 UPS', '비상 회선'], caption: '프린터 전원이 꺼져 있다. 전원선에 꼬리표가 달려 있다.' },
      message: '프린터가 깨어나 밀려 있던 장애 알림을 뱉어 낸다: "02:14 B2 전력 사용량 임계치 초과 · 자동 종결", "03:05 원격지원 게이트웨이 외부 송신 급증 · 요청 티켓 없음 · 자동 종결". 날마다 같은 알림이고, 처리자는 모두 SYSTEM이다.',
      surface: 'document',
      writing: [{ as: 'title', text: '장애 알림' }, '02:14  B2 전력 사용량 임계치 초과', '       → 자동 종결        처리자 SYSTEM',
        { as: 'rule' }, '03:05  원격지원 게이트웨이 외부 송신 급증', '       요청 티켓 없음', '       → 자동 종결        처리자 SYSTEM'],
      caption: '프린터가 깨어나 밀려 있던 장애 알림을 뱉어 낸다. 날마다 같은 알림이다.' },
    { file: 'support-workstation', size: [512, 256], worldWidth: 270, x: 1640 },
    { file: 'support-workstation', size: [512, 256], worldWidth: 270, x: 1940 },
    { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 2250 },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 2540 },
  ] },
  { id: 'f13-testbay', name: '장비 검증실', width: 1824, windowless: true, props: [
    { file: 'testbay-ups', size: [256, 256], worldWidth: 107, x: 420, name: 'UPS', gives: 'f13-ups',
      sprite: 'assets/objects/floor13/testbay-ups-states.png', stateBy: 'f13-ups',
      message: 'UPS 비상 출력 스위치를 올렸다. 팬이 돌기 시작하고 초록 불이 들어온다. 비상 회선으로 전기가 나간다.',
      takenMessage: 'UPS가 돌아가고 있다. 배터리 잔량 71%.' },
    { file: 'server-validation-bench', size: [512, 256], worldWidth: 260, x: 800, name: '검증 벤치',
      message: '검증 결과지: "고객사 납품 서버 3대 · 원격 접속 에이전트 발견 · 설치 기록 없음". 담당자 메모: "어디서 들어온 거지? 보안팀 문의."',
      surface: 'document',
      writing: [{ as: 'title', text: '검증 결과지' }, '고객사 납품 서버 3대', '원격 접속 에이전트 발견', '설치 기록 없음', { as: 'rule' },
        { as: 'hand', text: '어디서 들어온 거지? 보안팀 문의.', ink: 'blue' }],
      caption: '아래 메모는 담당자가 남겼다.' },
    { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1060 },
    { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 198, x: 1300 },
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 1520 },
    { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 1640 },
  ] },
  { id: 'f13-training', name: '고객 교육장', width: 1824, props: [
    { file: 'training-slide-board', size: [512, 256], worldWidth: 350, x: 300, name: '교육 자료 보드',
      message: '사내 안전 교육 슬라이드 출력물: "정전 시 옥상 태양광 비상 전력 장치를 쓴다. 용량이 작아 한 번에 한 층에만 전력을 보낼 수 있다. 다른 층을 선택하면 켜 둔 층의 전력은 자동으로 끊긴다."',
      // 그림처럼 슬라이드 세 장(배터리 · 태양광 패널과 층, 한 층만 주황 · 스위치)을 나란히 붙였다.
      writing: [
        { as: 'paper', title: '정전 시 대응  1/3', text: '(배터리 그림)\n옥상 태양광 비상 전력 장치를 쓴다.\n용량이 작다.' },
        { as: 'paper', title: '정전 시 대응  2/3', text: '(태양광 패널과 층 그림. 한 층만 주황색)\n한 번에 한 층에만\n전력을 보낼 수 있다.' },
        { as: 'paper', title: '정전 시 대응  3/3', text: '(스위치 그림)\n다른 층을 선택하면\n켜 둔 층의 전력은 자동으로 끊긴다.' }],
      caption: '사내 안전 교육 슬라이드 출력물 세 장.' },
    { file: 'training-workstation', size: [512, 256], worldWidth: 300, x: 720 },
    { file: 'training-workstation', size: [512, 256], worldWidth: 300, x: 1120, name: '교육생 자리',
      message: '교육생 설문지 한 장: "ARCHI 실습 조교 — 질문을 거의 이해하지 못함 (1/5)". 뒷면에 낙서: "밤에 복습하다 물어봤을 땐 잘만 대답하던데."',
      surface: 'document',
      writing: [{ as: 'title', text: '교육 만족도 설문' }, 'ARCHI 실습 조교', '질문을 거의 이해하지 못함   (1/5)',
        { as: 'page' }, { as: 'hand', text: '밤에 복습하다 물어봤을 땐\n잘만 대답하던데.' }],
      caption: '교육생 설문지 한 장과 그 뒷면.' },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1380 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1740 },
  ] },
]);
