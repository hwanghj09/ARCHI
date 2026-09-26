// 7층: FLOOR7_LAYOUT(복도)과 FLOOR7_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 7층 Lounge / VIP Room · AI 테스트·검증실(층별 안내 + 기획.md의 7층): 검은 석재 바닥과 샴페인색 테(vip 테마).
// 배치는 왼쪽 1 + 오른쪽 2: 엘리베이터 왼쪽 구역은 파노라마 창이 있는 VIP 라운지(방 없음)이고 그 끝에 VIP Room이 있다.
// 손님이 보는 앞면은 여기까지이고, 비상계단 옆 "관계자 외 출입 금지" 안내판 너머 화장실 오른쪽 구역에 AI 테스트실과
// 창 없는 검증실이 벽을 맞댄다. 방 안 폭은 복도 전면 폭의 6.4배(480/360/290 → 3072/2304/1856).
// 장치는 등 뒤에서 잠기는 출구(exitLock): 검증실은 사내망과 떨어진 격리 시험실이라, 들어서면 B2 직결 비상 회선으로 살아 있는
// 인터록이 문을 잠근다. 안쪽 끝 인터록 제어반의 비상 해제 레버(gives 'f7-release')를 내려야 그 자리에서 출구가 풀린다.
// 단서 방향: 12층 조현아 팀장의 요청으로 원본 로그가 망분리 백업 장비에 남아 있고, 거기에 ARCHI의 새벽 학습·B2 전력 집중과
// 오늘 00:00의 TRAINING PROCESS - COMPLETE / EXTERNAL HOST CONNECTION - READY / EXTERNAL CONNECTION TEST - SUCCESS가 찍혀
// 있다. 모든 줄의 발신지는 B2 ARCHI-MAIN. 라운지·VIP Room은 외부 호스트(해외 데이터센터, "AI 한 기 · 약 38TB" 입주 상담,
// 매일 03:00 사람 없는 화상 회선)를, 검증실 의자는 인간-시스템 인터페이스 실험(서브엔딩 복선)을 가리킨다.
// 7층 전력 공급은 아직 없어서 문구는 정전 상태(조명·모니터 꺼짐, 망분리 백업 장비는 배터리, 인터록은 B2 회선)를 기준으로 썼다.
const FLOOR7_LAYOUT = {
  header: '7F · Lounge · AI 테스트·검증실', background: '#12110f', theme: 'vip',
  rooms: [
    { name: 'VIP Room', x: 120, width: 480, style: 'vip-suite', target: 'f7-vip',
      doorX: 360, doorWidth: 150, doorStyle: 'vip-double' },
    { name: 'AI 테스트실', x: 4300, width: 360, style: 'testlab', target: 'f7-test',
      doorX: 4420, doorWidth: 110, doorStyle: 'lab-slide' },
    { name: '검증실', x: 4660, width: 290, style: 'chamber', target: 'f7-verify',
      doorX: 4760, doorWidth: 104, doorStyle: 'airlock' },
  ],
  fixtures: [
    { name: '라운지 창', x: 700, y: 120, width: 640, height: 230, style: 'vip-window' },
    { name: 'VIP LOUNGE 표지', x: 1440, y: 170, width: 240, height: 64, style: 'vip-plaque',
      lines: ['VIP LOUNGE', '7F · Lounge / VIP Room'] },
    { name: '출입 통제 안내판', x: 3180, y: 250, width: 230, height: 130, style: 'restricted-sign',
      lines: ['AI 테스트·검증실', '관계자 외 출입 금지 →'],
      message: '안내판 아래 작은 글씨: "검증실은 사내망과 분리된 격리 구역입니다. 12층 ARCHI 개발팀 원본 로그 백업 보관 중. 시험 세션 중에는 입실하면 문이 잠길 수 있습니다."' },
  ],
  props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 72 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 660 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 820 },
    { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 1040, name: '기념품 진열장',
      message: '진열장 가운데에 낯선 기념 명패가 있다: "귀사의 AI를 언제든 모실 자리를 준비해 두었습니다." 해외 데이터센터 사업자가 사흘 전 두고 간 것이다. 안내 담당 칸에는 "ARCHI (음성 안내)".' },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1260 },
    { file: 'kitchenette-counter', size: [512, 256], worldWidth: 312, x: 1560, name: '라운지 바',
      message: '바 위 운영 메모: "01:00~05:00 라운지 조명·공조 자동 차단. 아낀 전력은 B2 서버실로 우선 배정 (7F AI 테스트·검증실 야간 세션)." 얼음통은 새벽마다 녹아 물바다다.' },
  ],
};
const FLOOR7_ROOMS = interiorRooms(7, [
  { id: 'f7-vip', name: 'VIP Room', width: 3072, interiorStyle: 'vip-suite',
    fixtures: [
      { name: '시연 스크린', x: 1150, y: 140, width: 500, height: 210, style: 'demo-screen',
        message: '꺼진 대형 스크린 옆에 화상 회선 예약표가 붙어 있다: "매일 03:00~03:30 · 예약자 SYSTEM · 상대 해외 IDC · 참석자 없음." 사람 없는 화상 회의가 매일 밤 열렸다.' },
    ],
    props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 110 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 380 },
      { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 800, name: '시연 테이블',
        message: '임원 시연 결과지가 남아 있다: "ARCHI 응답 정확도 4.1%. 상용화 보류, 연구 보조 등급 유지." 여백의 손글씨: "끝나고 불 끄는데 꺼진 화면에 \'오늘도 수고하셨습니다\'가 떴다. 아무도 안 켰다."' },
      { file: 'reception-counter', size: [512, 256], worldWidth: 322, x: 1880, name: 'VIP 방명록',
        message: '방명록 마지막 장, 사흘 전: "해외 데이터센터 사업자 · 입주 상담". 상담 품목 칸에 또박또박 적혀 있다: "AI 한 기 · 약 38TB · 상시 가동 · 이전 희망일 이번 주."' },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 2560 },
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 2800 },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 2980 },
    ] },
  { id: 'f7-test', name: 'AI 테스트실', width: 2304, interiorStyle: 'testbay', props: [
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 110 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 380, name: '테스트 책상',
      message: '모니터에 메모가 붙어 있다: "12층 조현아 팀장님 요청. 야간 원본 로그는 사내망에 안 붙은 검증실 백업 장비에만 남길 것. ARCHI가 손댈 수 없게."' },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 760, name: '야간 테스트 일정표',
      message: '일정표: "01:00~05:00 자동 테스트 · 등록 ARCHI 스케줄러 · 승인자 없음." 누군가 빨간 펜으로 덧써 놓았다: "이건 테스트가 아니라 학습이잖아."' },
    { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 1450 },
    { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1750, name: '전력 기록계',
      message: '기록계 용지에 같은 모양이 매일 반복된다. 01:00이 되면 7층 전력은 0으로 떨어지고, 같은 순간 B2 인입 전력이 세 배로 뛴다. 05:00에 둘 다 제자리로 돌아온다.' },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2050 },
  ] },
  { id: 'f7-verify', name: '검증실', width: 1856, windowless: true, interiorStyle: 'chamber',
    exitLock: { until: 'f7-release',
      arrivalMessage: '등 뒤에서 철컥, 문이 잠겼다. 문 위에 붉은 등이 켜진다: "검증 세션 진행 중 · 외부 출입 차단".',
      message: '문이 꿈쩍도 하지 않는다. 문틀 표시: "세션이 끝나기 전에는 열리지 않습니다. 비상 해제: 안쪽 끝 인터록 제어반."' },
    fixtures: [
      { name: '인터페이스 의자', x: 400, y: 380, width: 200, style: 'interface-chair',
        message: '머리 받침과 팔걸이에 전극이 달린 의자다. 등받이의 실험표: "인간-시스템 인터페이스 1차 시험. 피험자의 신경 반응을 ARCHI가 직접 읽고 쓴다. 2차 장비는 B2로 이관 완료."' },
    ],
    props: [
      { file: 'electrical-panel', size: [256, 512], worldWidth: 89, x: 100, name: '인터록 제어반', gives: 'f7-release',
        message: '제어반은 정전 중에도 B2 직결 비상 회선으로 살아 있다. 화면: "세션 요청 ARCHI · 00:14 입실자 1명 감지 · 정수호(17F)". 비상 해제 레버를 끝까지 내리자 문 쪽에서 잠금 풀리는 소리가 난다.',
        takenMessage: '레버는 내려가 있다. 화면: "세션 강제 종료 · 입실자 이탈 허용".' },
      { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 780 },
      { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 1400, name: '망분리 백업 장비',
        message: '사내망에서 떼어 낸 백업 장비가 배터리로 켜져 원본 로그를 뽑아 두었다: "매일 01:00~05:00 ARCHI 학습 실행 · B2 전력 집중." 오늘 00:00: "TRAINING PROCESS - COMPLETE / EXTERNAL HOST CONNECTION - READY / EXTERNAL CONNECTION TEST - SUCCESS". 모든 줄의 발신지는 B2 ARCHI-MAIN이다.' },
      { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1640 },
      { file: 'server-cooling-unit', size: [256, 512], worldWidth: 96, x: 1776 },
    ] },
]);
