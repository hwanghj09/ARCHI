// 12층: FLOOR12_LAYOUT(복도)과 FLOOR12_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 12층 기술본부 ARCHI 개발팀(층별안내.md의 TmaxSoft 기술본부 층, 기획.md의 ARCHI 개발팀).
// 흑연색 연구소 마감(lab 테마). 방을 코어 세 구역에 하나씩 둔다: 왼쪽 개발실(가운데 자동문),
// 계단과 화장실 사이 모델 평가실(창 없는 보안문 방), 오른쪽 팀장실(블라인드). 팀장실은 잠겨 있고
// 개발실 책상 서랍의 보조키(gives)를 얻으면 열린다(unlockedBy). 방 안 폭은 복도 전면 폭의 4.1배(800/440/520 → 3280/1804/2132).
// 단서는 낮 3~5%·밤 80~90% 성능 기록과 7층 원본 로그 백업 메모. 정전 상태(PC 꺼짐)를 기준으로 썼다.
const FLOOR12_LAYOUT = {
  header: '12F · 기술본부 ARCHI 개발팀', background: '#15171b', theme: 'lab',
  rooms: [
    { name: '개발실', x: 64, width: 800, style: 'frosted', target: 'f12-dev',
      doorX: 374, doorWidth: 180, doorStyle: 'slide' },
    { name: '모델 평가실', x: 3100, width: 440, style: 'lab', target: 'f12-eval',
      doorX: 3160, doorWidth: 130, doorY: 244, doorStyle: 'security' },
    { name: '팀장실', x: 4330, width: 520, style: 'blinds', target: 'f12-lead',
      doorX: 4700, doorWidth: 128, doorY: 262, doorStyle: 'blinds', locked: true, unlockedBy: 'f12-lead-key',
      message: '팀장실 문이 잠겨 있다. 카드키가 아니라 열쇠 구멍이 있는 문이다.' },
  ],
  props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 920 },
    { file: 'robot-charging-dock', size: [256, 256], worldWidth: 69, x: 1180, name: '로봇 충전 도크',
      message: '경비 로봇 충전 도크가 비어 있다. 바닥의 바퀴 자국이 엘리베이터 쪽으로 이어진다.' },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1600 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4910 },
  ],
};
const FLOOR12_ROOMS = interiorRooms(12, [
  { id: 'f12-dev', name: '개발실', width: 3280, props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 220 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 300 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 520 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 820, name: '책상',
      message: '모니터가 꺼져 있다. 정전이라 PC를 켤 수 없다. 모니터 옆 포스트잇: "새벽 자동 평가 로그 또 삭제됨. 보관 설정 확인할 것."' },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1120 },
    { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 1400 },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1990, name: '화이트보드',
      message: '주간 성능 평가: 월 4.2% · 화 3.8% · 수 4.5% · 목 3.1%. 아래에 "목표 30% · 원인 불명 · 모델 구조 재검토".' },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2400 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2700 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 3000, name: '책상 서랍', gives: 'f12-lead-key',
      message: '맨 아래 서랍에 "팀장실 보조키" 꼬리표가 달린 열쇠가 있다. 챙겼다.',
      takenMessage: '서랍은 비어 있다. 팀장실 보조키는 이미 챙겼다.' },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3200 },
  ] },
  { id: 'f12-eval', name: '모델 평가실', width: 1804, windowless: true, props: [
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 110 },
    { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 230, name: '네트워크 랙',
      message: '정전인데 스위치 한 대의 포트 표시등만 깜빡인다. 케이블 라벨: "B2 직결 · UPS".' },
    { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 760, name: '평가 벤치',
      message: '출력된 결과지: "야간 자동 평가 · 03:12 · ARCHI 정답률 87.6%". 빨간 펜 메모: "측정 오류? 같은 문제 세트가 낮엔 4.1%."' },
    { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1000 },
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 1240 },
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 1350 },
    { file: 'server-cooling-unit', size: [256, 512], worldWidth: 96, x: 1460 },
    { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1660 },
  ] },
  { id: 'f12-lead', name: '팀장실', width: 2132, props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
    { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 280, name: '진열장',
      message: '상패 하나가 놓여 있다: "사내 AI 경진대회 · ARCHI · 참가상". 옆 사진 속 팀원들이 어색하게 웃고 있다.' },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 450 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 530 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 860 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1360, name: '팀장 책상',
      message: '결재함 맨 위의 개발자 메모: "야간 성능 이상과 관련된 원본 로그는 변조 가능성이 있음. 7층 AI 테스트·검증실 장비에 별도 백업함."' },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1700 },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 2060 },
  ] },
]);
