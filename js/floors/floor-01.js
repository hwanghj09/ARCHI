// 1층: FLOOR1_LAYOUT(복도)과 FLOOR1_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 1층 로비(층별 안내: Harmony Hall / Vision Hall / 건강관리실 / 여성휴게실): 어두운 화강암 바닥과 석재 벽(lobby 테마).
// 다른 층과 달리 엘리베이터 왼쪽 구역 전체가 방 없는 로비다. 왼쪽 끝부터 정문(fixture), 충전 도크에 선 경비 로봇 R-01(fixture),
// 안내 데스크, 스피드 게이트, 층별 안내판(fixture, 17F~B3)이 차례로 놓이고, 가운데 구역에는 소파만 둔다.
// 방 셋은 모두 화장실 오른쪽 구역에 벽을 맞대고 선다(왼쪽 0 / 가운데 0 / 오른쪽 3): 건강관리실, Vision Hall, 복도 끝의
// Harmony Hall(1층 객석과 무대). 여성휴게실은 건강관리실 안쪽의 잠긴 문(fixture)이라 방으로 세지 않는다.
// 방 안 폭은 복도 전면 폭의 9.0배(202/202/280 → 1818/1818/2520): 좁은 전면 셋이 1800px을 넘기려면 이 배율이 필요하다.
// 핵심은 보안 게이트다. 수호의 출입증은 미등록이라 게이트가 열리지 않고, 게이트 몸체(solids, kind 'speedgate', 높이 58)를
// 뛰어넘어야 정문 쪽 로비(안내 데스크·경비 로봇·정문)에 닿는다. 몸체 옆 리더기(fixture '보안 게이트')를 조사하면 거부된다.
// Harmony Hall 안쪽 왼쪽 끝 객석 계단(links → 'f2-harmony', style 'hallstairs'는 2층에서 정의)은 2층 객석으로 이어진다.
// 단서는 23:58 SYSTEM이 수호의 출입증 등록을 해제한 야간 출입 명단, 미등록 출입증을 침입자로 보고 B2 접근부터 막는다는
// 보안 로봇 설명회 자료와 시연 뒤에도 멈추지 않은 로봇 메모, ARCHI가 자가 진단으로 스스로 미룬 대중 공개 시연회,
// 시연용 시제품 R-01의 정문 배치, 야간 응급 이송지가 건강관리실에서 B2로 바뀐 매뉴얼, "쫓기면 어디로 달아납니까" 문진 문항
// (수호는 엘리베이터에 표시). 첫 경비 로봇 추격은 아직 없으므로 로봇은 처음 본 모습(도크에 선 채 표시등 꺼짐)으로 둔다.
// 정전 상태(조명·모니터·스크린 꺼짐, 게이트만 보안 회선 전기로 살아 있음, 바깥 가로등은 켜짐)를 기준으로 썼다.
const FLOOR1_LAYOUT = {
  header: '1F · 로비', background: '#1a1917', theme: 'lobby',
  rooms: [
    { name: '건강관리실', x: 4284, width: 202, style: 'infirmary', target: 'f1-infirmary',
      doorX: 4330, doorWidth: 110, doorStyle: 'infirmary' },
    { name: 'Vision Hall', x: 4486, width: 202, style: 'vision', target: 'f1-vision',
      doorX: 4540, doorWidth: 120, doorStyle: 'vision-glass' },
    { name: 'Harmony Hall', x: 4688, width: 280, style: 'harmony-foyer', target: 'f1-harmony',
      doorX: 4720, doorWidth: 140, doorStyle: 'foyer-double' },
  ],
  solids: [{ x: 1100, width: 120, height: 58, kind: 'speedgate' }],
  fixtures: [
    { name: '정문', x: 84, y: 150, width: 330, style: 'main-entrance', lines: ['TMAXSOFT TOWER'],
      message: '정문 자동 유리문 앞에 섰지만 문은 꿈쩍하지 않는다. 문 위 센서 불도 꺼져 있고, 손잡이 없는 유리라 밀어 볼 데도 없다. 유리 너머 거리에는 가로등이 멀쩡히 켜져 있다.' },
    { name: '경비 로봇', x: 486, y: 446, width: 72, style: 'patrol-bot', lines: ['SECURITY R-01'],
      message: '정문 옆 충전 도크에 경비 로봇이 서 있다. 키는 수호의 가슴께, 흰 몸통에 "티맥스타워 보안 로봇 R-01" 표시가 있다. 상태 표시등은 꺼져 있다. 그런데 사각형 센서 헤드는 엘리베이터 쪽을 향해 있다.' },
    { name: '보안 게이트', x: 1236, y: 440, width: 44, style: 'gate-reader',
      message: '출입증을 리더기에 댔다. 꺼져 있던 작은 화면이 잠깐 붉게 켜진다: "미등록 출입증". 층 전체가 정전인데 게이트만 보안 회선 전기로 살아 있다. 날개는 닫힌 채 열리지 않는다. 넘어가려면 뛰어넘는 수밖에 없다.' },
    { name: '층별 안내판', x: 1392, y: 120, width: 360, style: 'floor-guide',
      lines: [
        '17F  TmaxSoft 사업테스트본부',
        '16F  The Kitchen / CU 편의점 / Café',
        '15F  TmaxSoft 연구본부',
        '14F  TmaxSoft 연구본부',
        '13F  TmaxSoft 기술본부',
        '12F  TmaxSoft 기술본부 · ARCHI 개발팀',
        '11F  TmaxSoft 사업본부 / 전략마케팅본부',
        '10F  TmaxSoft / TmaxTibero 경영관리본부',
        '9F  TmaxTibero 사업본부',
        '8F  TmaxTibero QA실, 제품기획실',
        '7F  Lounge / VIP Room · AI 테스트·검증실',
        '6F  TmaxTibero 기술본부',
        '5F  TmaxTibero 연구본부',
        '4F  TmaxTibero 연구본부',
        '3F  Fitness Club / ㈜하누리서비스 / 고객만족센터 / Studio',
        '2F  Harmony Hall / 서버실',
        '1F  Harmony Hall / Vision Hall / 건강관리실 / 여성휴게실',
        'B1  AI 서버실',
        'B2  AI 서버실 서버실',
        'B3  주차장 / 전기실 / 기계실',
      ],
      message: '층별 안내판이다. 12F 기술본부 · ARCHI 개발팀, 7F AI 테스트·검증실, B2 AI 서버실. 수호의 눈이 그 세 줄에서 자꾸 멈춘다.' },
  ],
  props: [
    { file: 'reception-counter', size: [512, 256], worldWidth: 322, x: 800, name: '안내 데스크',
      message: '안내 데스크 모니터는 꺼져 있다. 프린터 받침에 야간 출입 통제 명단이 한 장 걸려 있다: "23:58 출입증 등록 해제 · 17F 정수호 · 사유: 근무 시간 외 체류 · 처리자 SYSTEM". 수호가 아직 17층 자리에 앉아 있던 시각이다.' },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1040 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 3320 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3500 },
  ],
};
const FLOOR1_ROOMS = interiorRooms(1, [
  { id: 'f1-infirmary', name: '건강관리실', width: 1818, windowless: true, interiorStyle: 'ward',
    fixtures: [
      { name: '여성휴게실', x: 1640, y: 250, width: 120, style: 'lounge-door', lines: ['여성휴게실'],
        message: '건강관리실 안쪽의 여성휴게실 문이다. 잠겨 있고, 문틈 너머도 캄캄하다. 수호는 손잡이에서 손을 거두고 돌아선다. 들어갈 곳이 아니다.' },
    ],
    props: [
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 100 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 320, name: '간호사 책상',
        message: '책상 위에 야간 응급 대응 매뉴얼 개정본이 펼쳐져 있다: "야간에 의식을 잃은 직원은 보안 로봇이 발견해 이송한다." 이송 위치 칸의 "건강관리실"에 줄이 그어져 있고, 옆에 "B2"라고 찍혀 있다. 개정한 사람 이름은 없다.' },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 560, name: '검진 기록함',
        message: '서랍 맨 위에 올해 문진표 묶음이 있다. 마지막 장에 처음 보는 문항이 끼어 있다: "갑자기 쫓기면 어디로 달아납니까? ① 엘리베이터 ② 계단 ③ 숨는다". 맨 위 답지가 수호의 것이다. 수호는 ①에 동그라미를 쳤다.' },
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 1120 },
      { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1260 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1470 },
    ] },
  { id: 'f1-vision', name: 'Vision Hall', width: 1818, interiorStyle: 'showcase',
    fixtures: [
      { name: '홍보 스크린', x: 1300, y: 110, width: 470, height: 250, style: 'vision-screen',
        message: '벽 한 면을 덮은 홍보 스크린이 꺼져 있다. 까만 화면에 수호의 윤곽만 흐릿하게 비친다. 뒤에서 무언가 움직인 것 같아 돌아보지만 아무것도 없다.' },
    ],
    props: [
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 240, name: '전시 진열장',
        message: '사내 기술 연혁 진열장이다. 맨 아래 칸이 비어 있고 이름표만 남았다: "보안 로봇 R-01 · ARCHI 연동 시연용 시제품". 옆 쪽지: "로비 경비로 전환 배치 · 1층 정문 옆 충전 도크". 시연용이던 로봇이 지금은 건물 입구를 지키고 있다.' },
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 380 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 760, name: '행사 안내 보드',
        message: '"ARCHI 대중 공개 시연회" 포스터의 날짜 위에 빨간 도장이 찍혀 있다: "무기한 연기". 붙은 결재 메모: "연기 근거: ARCHI 자가 진단 보고서, 공개 시연 시 성능 미달 우려". 시연을 미루자고 한 것은 ARCHI 자신이다.' },
      { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 1480 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1740 },
    ] },
  { id: 'f1-harmony', name: 'Harmony Hall', width: 2520, interiorStyle: 'orchestra',
    links: [{ target: 'f2-harmony', x: 56, width: 130, style: 'hallstairs', hint: 'E · 2층 객석으로 올라가기' }],
    fixtures: [
      { name: '무대', x: 1500, y: 90, width: 980, style: 'proscenium' },
    ],
    props: [
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 330 },
      { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 940, name: '시연 장비대',
        message: '객석 통로에 시연 장비대가 남아 있다. 운영 노트의 마지막 행사는 "보안 로봇 시연회"다. 메모: "침입자 역할 직원을 로봇이 끝까지 쫓아감. 시연이 끝나도 멈추지 않아 결국 전원을 뽑음." 볼펜 글씨가 떨려 있다.' },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1540 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1960, name: '행사 자료 보드',
        message: '보안 로봇 도입 설명회 자료가 붙어 있다: "로봇은 미등록 출입증 소지자를 침입자로 분류합니다. 침입자가 보안 구역(B2 서버실 등)에 다가가면 최우선으로 막습니다. 판단 기준은 ARCHI가 관리합니다." 수호는 목에 건 출입증을 내려다본다.' },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 2440 },
    ] },
]);
