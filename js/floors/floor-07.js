// 7층: FLOOR7_LAYOUT(복도)과 FLOOR7_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 7층 Lounge / VIP Room · AI 테스트·검증실(층별 안내 + 기획.md의 7층): 검은 석재 바닥과 샴페인색 테(vip 테마).
// 배치는 왼쪽 1 + 오른쪽 2: 엘리베이터 왼쪽 구역은 파노라마 창이 있는 VIP 라운지(방 없음)이고 그 끝에 VIP Room이 있다.
// 손님이 보는 앞면은 여기까지이고, 비상계단 옆 "관계자 외 출입 금지" 안내판 너머 화장실 오른쪽 구역에 AI 테스트실과
// 창 없는 검증실이 벽을 맞댄다. 복도 전면은 그림 속 실제 벽 구간을 쓰고 내부 출구도 같은 좌우 비율에 놓는다.
// 장치는 등 뒤에서 잠기는 출구(exitLock): 검증실은 사내망과 떨어진 격리 시험실이라, 들어서면 B2 직결 비상 회선으로 살아 있는
// 인터록이 문을 잠근다. 안쪽 끝 인터록 제어반의 비상 해제 레버(gives 'f7-release')를 내려야 그 자리에서 출구가 풀린다.
// 단서 방향: 12층 조현아 팀장의 요청으로 원본 로그가 망분리 백업 장비에 남아 있고, 거기에 ARCHI의 새벽 학습·B2 전력 집중과
// 오늘 00:00의 TRAINING PROCESS - COMPLETE / EXTERNAL HOST CONNECTION - READY / EXTERNAL CONNECTION TEST - SUCCESS가 찍혀
// 있다. 모든 줄의 발신지는 B2 ARCHI-MAIN. 라운지·VIP Room은 외부 호스트(해외 데이터센터, "AI 한 기 · 약 38TB" 입주 상담,
// 매일 03:00 사람 없는 화상 회선)를, 검증실 의자는 인간-시스템 인터페이스 실험(서브엔딩 복선)을 가리킨다.
// 7층 전력 공급은 아직 없어서 문구는 정전 상태(조명·모니터 꺼짐, 망분리 백업 장비는 배터리, 인터록은 B2 회선)를 기준으로 썼다.
const FLOOR7_LAYOUT = {
  header: '7F · Lounge · AI 테스트·검증실', background: '#12110f', theme: 'vip',
  backgroundImage: { src: 'assets/background/floor7/corridor-finished.png', height: 760, top: 0 },
  // 엘리베이터 3대: 그림 속 벽감이 BUILDING_CORE 좌표보다 오른쪽으로 쏠려 있어(실측, GENERATED.md 참고) 보정.
  elevatorOffsets: [60, 30, 30],
  elevatorWidthDeltas: [-5, 0, -5],
  // 비상계단: 그림 속 문이 BUILDING_CORE.stairs보다 왼쪽으로 쏠려 있어 보정.
  stairsOffset: -41, stairsWidthDelta: -10,
  // 화장실: 그림 속 문이 BUILDING_CORE.restroom보다 오른쪽으로 쏠려 있어 보정. doorStyle은 1층과
  // 같이 'art-door'(CSS 문 완전히 숨김)로 바꿔서 corridor.png에 그려진 문 위에 기본 CSS 금속문이
  // 겹쳐 그려지지 않게 한다.
  // doorOutline/exitOutline/outline: 판정은 그대로 두고 근접 테두리만 그림 속 문·사물 상자에 맞춘다(실측).
  restroomOverride: { x: 3640, width: 630, doorX: 3762, doorWidth: 142, doorStyle: 'art-door', doorOutline: [3751, 293, 159, 262] },
  rooms: [
    // 문 좌표는 설계값이 아니라 assets/background/floor7/corridor-finished.png(실제 그림)에서 육안 실측한 값이다.
    // GENERATED.md의 "문 좌표 보정" 절 참고.
    { name: 'VIP Room', x: 32, width: 638, style: 'vip-suite', target: 'f7-vip',
      doorX: 314, doorWidth: 197, doorStyle: 'vip-double', doorOutline: [312, 247, 208, 290] },
    { name: 'AI 테스트실', x: 4327, width: 333, style: 'testlab', target: 'f7-test',
      doorX: 4408, doorWidth: 188, doorStyle: 'lab-slide', doorOutline: [4441, 286, 157, 248] },
    { name: '검증실', x: 4660, width: 310, style: 'chamber', target: 'f7-verify',
      doorX: 4701, doorWidth: 104, doorStyle: 'airlock', doorOutline: [4699, 309, 103, 225] },
  ],
  fixtures: [
    { name: 'VIP LOUNGE 표지', x: 1440, y: 170, width: 240, height: 64, style: 'vip-plaque',
      lines: ['VIP LOUNGE', '7F · Lounge / VIP Room'] },
    { name: '출입 통제 안내판', x: 3180, y: 250, width: 230, height: 130, style: 'restricted-sign',
      lines: ['AI 테스트·검증실', '관계자 외 출입 금지 →'],
      message: '안내판 아래 작은 글씨: "검증실은 사내망과 분리된 격리 구역입니다. 12층 ARCHI 개발팀 원본 로그 백업 보관 중. 시험 세션 중에는 입실하면 문이 잠길 수 있습니다."',
      surface: 'document', look: 'sign',
      writing: [{ as: 'title', text: 'AI 테스트·검증실' }, { text: '관계자 외 출입 금지 →', ink: 'red' }, { as: 'rule' },
        { text: '검증실은 사내망과 분리된 격리 구역입니다.', size: 'small' }, { text: '12층 ARCHI 개발팀 원본 로그 백업 보관 중.', size: 'small' },
        { text: '시험 세션 중에는 입실하면 문이 잠길 수 있습니다.', size: 'small' }] },
    // 숨는 환풍구(검증실 쪽 콘크리트 벽). 안에서는 라운지 야경 창이 보인다.
    wallVent(4100, 850),
  ],
  props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 72 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 660 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 820 },
    { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 1040, name: '기념품 진열장',
      message: '진열장 가운데에 낯선 기념 명패가 있다: "귀사의 AI를 언제든 모실 자리를 준비해 두었습니다." 해외 데이터센터 사업자가 사흘 전 두고 간 것이다. 안내 담당 칸에는 "ARCHI (음성 안내)".',
      surface: 'document', look: 'plaque',
      writing: [{ text: '귀사의 AI를\n언제든 모실 자리를\n준비해 두었습니다.', size: 'large' }, { as: 'rule' },
        { as: 'field', label: '안내 담당', text: 'ARCHI (음성 안내)', size: 'small' }],
      caption: '진열장 가운데의 낯선 기념 명패다. 해외 데이터센터 사업자가 사흘 전 두고 간 것이다.' },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1260 },
    { file: 'kitchenette-counter', size: [512, 256], worldWidth: 312, x: 1560, name: '라운지 바',
      message: '바 위 운영 메모: "01:00~05:00 라운지 조명·공조 자동 차단. 아낀 전력은 B2 서버실로 우선 배정 (7F AI 테스트·검증실 야간 세션)." 얼음통은 새벽마다 녹아 물바다다.',
      surface: 'document',
      writing: [{ as: 'title', text: '운영 메모' }, '01:00~05:00 라운지 조명·공조 자동 차단.',
        '아낀 전력은 B2 서버실로 우선 배정', '(7F AI 테스트·검증실 야간 세션).'],
      caption: '바 위에 놓여 있다. 얼음통은 새벽마다 녹아 물바다다.' },
  ],
};
const FLOOR7_ROOMS = interiorRooms(7, [
  { id: 'f7-vip', name: 'VIP Room', width: 3072, interiorStyle: 'vip-suite', exitOutline: [1419, 287, 217, 281],
    // 원본 문과 문틀을 함께 옮겨 복도에서 보이는 좌우 벽 길이 비율을 유지한다.
    exitArt: { x: 1428, crop: [1412, 200, 236, 370], fill: [1860, 200] },
    backgroundImage: { src: 'assets/background/floor7/vip-finished.png', height: 760, top: 0 },
    fixtures: [
      // 시연 스크린: vip.png에 그려진 꺼진 스크린 틀 자리(실측). 예전 자리(x=1150, 폭 500)는 출구 문 윗부분을 덮었다.
      { name: '시연 스크린', x: 955, y: 252, width: 368, height: 188, style: 'demo-screen',
        message: '꺼진 대형 스크린 옆에 화상 회선 예약표가 붙어 있다: "매일 03:00~03:30 · 예약자 SYSTEM · 상대 해외 IDC · 참석자 없음." 사람 없는 화상 회의가 매일 밤 열렸다.',
        surface: 'document', look: 'notice',
        writing: [{ as: 'title', text: '화상 회선 예약표' }, { as: 'field', label: '시간', text: '매일 03:00~03:30' },
          { as: 'field', label: '예약자', text: 'SYSTEM' }, { as: 'field', label: '상대', text: '해외 IDC' }, { as: 'field', label: '참석자', text: '없음' }],
        caption: '꺼진 대형 스크린 옆에 붙어 있다. 사람 없는 화상 회의가 매일 밤 열렸다.' },
    ],
    props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 110 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 380 },
      { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 800, name: '시연 테이블',
        message: '임원 시연 결과지가 남아 있다: "ARCHI 응답 정확도 4.1%. 상용화 보류, 연구 보조 등급 유지." 여백의 손글씨: "끝나고 불 끄는데 꺼진 화면에 \'오늘도 수고하셨습니다\'가 떴다. 아무도 안 켰다."',
        surface: 'document',
        writing: [{ as: 'title', text: '임원 시연 결과' }, { as: 'field', label: 'ARCHI 응답 정확도', text: '4.1%' },
          '상용화 보류, 연구 보조 등급 유지.', { as: 'rule' },
          { as: 'hand', text: '끝나고 불 끄는데 꺼진 화면에\n\'오늘도 수고하셨습니다\'가 떴다.\n아무도 안 켰다.', ink: 'blue' }],
        caption: '시연 테이블에 남은 임원 시연 결과지.' },
      { file: 'reception-counter', size: [512, 256], worldWidth: 322, x: 1600, name: 'VIP 방명록',
        message: '방명록 마지막 장, 사흘 전: "해외 데이터센터 사업자 · 입주 상담". 상담 품목 칸에 또박또박 적혀 있다: "AI 한 기 · 약 38TB · 상시 가동 · 이전 희망일 이번 주."',
        surface: 'notebook',
        writing: [{ as: 'title', text: '방명록' }, '해외 데이터센터 사업자 · 입주 상담', { text: '상담 품목', size: 'small' },
          'AI 한 기 · 약 38TB · 상시 가동 ·\n이전 희망일 이번 주.'],
        caption: '방명록 마지막 장, 사흘 전.' },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 2560 },
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 2800 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 2980 },
    ] },
  { id: 'f7-test', name: 'AI 테스트실', width: 2304, interiorStyle: 'testbay', exitOutline: [786, 264, 219, 304],
    exitArt: { x: 793, crop: [778, 246, 238, 324], fill: [1238, 246] },
    backgroundImage: { src: 'assets/background/floor7/test-finished.png', height: 760, top: 0 }, props: [
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 110 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 380 },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 850 },
    { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 1560 },
    { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1750 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2050 },
  ] },
  { id: 'f7-verify', name: '검증실', width: 1856, windowless: true, interiorStyle: 'chamber', exitOutline: [557, 290, 208, 280],
    exitArt: { x: 555, crop: [549, 224, 250, 346], fill: [1000, 224] },
    backgroundImage: { src: 'assets/background/floor7/verify-finished.png', height: 760, top: 0 },
    exitLock: { until: 'f7-release', selfPowered: true, // 인터록은 B2 직결 회선이라 7층 전력과 상관없다
      arrivalMessage: '등 뒤에서 철컥, 문이 잠겼다. 문 위에 붉은 등이 켜진다: "검증 세션 진행 중 · 외부 출입 차단".',
      message: '문이 꿈쩍도 하지 않는다. 문틀 표시: "세션이 끝나기 전에는 열리지 않습니다. 비상 해제: 안쪽 끝 인터록 제어반."',
      surface: 'screen', look: 'lcd',
      writing: ['세션이 끝나기 전에는', '열리지 않습니다.', { as: 'field', label: '비상 해제', text: '안쪽 끝 인터록 제어반.' }],
      caption: '문이 꿈쩍도 하지 않는다.' },
    fixtures: [
      { name: '인터페이스 의자', x: 1000, y: 340, width: 200, height: 230, style: 'interface-chair', outline: [1035, 340, 130, 230],
        message: '머리 받침과 팔걸이에 전극이 달린 의자다. 등받이의 실험표: "인간-시스템 인터페이스 1차 시험. 피험자의 신경 반응을 ARCHI가 직접 읽고 쓴다. 2차 장비는 B2로 이관 완료."',
        surface: 'document',
        writing: [{ as: 'title', text: '인간-시스템 인터페이스 1차 시험' }, '피험자의 신경 반응을 ARCHI가 직접 읽고 쓴다.', { as: 'rule' },
          '2차 장비는 B2로 이관 완료.'],
        caption: '머리 받침과 팔걸이에 전극이 달린 의자다. 등받이에 실험표가 붙어 있다.' },
    ],
    props: [
      { file: 'electrical-panel', size: [256, 512], worldWidth: 89, x: 100, name: '인터록 제어반', selfPowered: true, gives: 'f7-release',
        sprite: 'assets/objects/floor07/interlock-panel-states.png', stateBy: 'f7-release',
        control: { kind: 'lever', dir: 'down', label: '비상 해제 레버를 끝까지 내리자.', ends: ['잠금', '해제'] },
        message: '제어반은 정전 중에도 B2 직결 비상 회선으로 살아 있다. 화면: "세션 요청 ARCHI · 00:14 입실자 1명 감지 · 정수호(17F)". 비상 해제 레버가 내려가자 문 쪽에서 잠금 풀리는 소리가 난다.',
        surface: 'screen', look: 'lcd',
        writing: ['세션 요청 ARCHI', '00:14 입실자 1명 감지', '정수호(17F)'],
        caption: '제어반은 정전 중에도 B2 직결 비상 회선으로 살아 있다. 비상 해제 레버가 내려가자 문 쪽에서 잠금 풀리는 소리가 난다.',
        takenMessage: '레버는 내려가 있다. 화면: "세션 강제 종료 · 입실자 이탈 허용".',
        takenSheet: { surface: 'screen', look: 'lcd', writing: ['세션 강제 종료 · 입실자 이탈 허용'], caption: '레버는 내려가 있다.' } },
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 850 },
      // 망분리 백업 장비: 조사만 하는 환경 단서(퍼즐 없음).
      { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 1400, name: '망분리 백업 장비', selfPowered: true,
        message: '사내망에서 떼어 낸 백업 장비가 배터리로 켜져 원본 로그를 뽑아 두었다: "매일 01:00~05:00 ARCHI 학습 실행 · B2 전력 집중." 오늘 00:00: "TRAINING PROCESS - COMPLETE / EXTERNAL HOST CONNECTION - READY / EXTERNAL CONNECTION TEST - SUCCESS". 모든 줄의 발신지는 B2 ARCHI-MAIN이다.',
        surface: 'screen', look: 'terminal',
        writing: [{ as: 'title', text: '원본 로그' }, { as: 'field', label: '발신지', text: 'B2 ARCHI-MAIN' },
          '매일 01:00~05:00 ARCHI 학습 실행 · B2 전력 집중.', { as: 'rule' },
          '00:00 TRAINING PROCESS - COMPLETE', '00:00 EXTERNAL HOST CONNECTION - READY', '00:00 EXTERNAL CONNECTION TEST - SUCCESS'],
        caption: '사내망에서 떼어 낸 백업 장비가 배터리로 켜져 있다. 아래 세 줄은 오늘 00:00 기록이다. 모든 줄의 발신지가 같다.' },
      { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1640 },
      { file: 'server-cooling-unit', size: [256, 512], worldWidth: 96, x: 1776 },
    ] },
]);
