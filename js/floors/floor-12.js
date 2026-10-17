// 12층: FLOOR12_LAYOUT(복도)과 FLOOR12_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 12층 기술본부 ARCHI 개발팀(층별안내.md의 TmaxSoft 기술본부 층, 기획.md의 ARCHI 개발팀).
// 흑연색 연구소 마감(lab 테마). 방을 코어 세 구역에 하나씩 둔다: 왼쪽 개발실(가운데 자동문),
// 계단과 화장실 사이 모델 평가실(창 없는 보안문 방), 오른쪽 팀장실(블라인드). 팀장실은 잠겨 있고
// 개발실 책상 서랍의 보조키(gives)를 얻으면 열린다(unlockedBy). 전면 구획은 복도 그림의 유리벽·기둥을 따른다.
// 모델 평가실 카드키는 개발실 맨 왼쪽 서랍의 종이 더미 아래에 있다(drawer-puzzle.js).
// 단서는 낮 3~5%·밤 80~90% 성능 기록과 7층 원본 로그 백업 메모. 모델 평가실의 필수 퍼즐 두 개는 log-puzzle.js. 정전 상태(PC 꺼짐)를 기준으로 썼다.
// build.py가 원본 벽·문 좌표를 유지하고 천장·바닥과 공용 복도 벽을 마감한 높이 760의 배경을 만든다.
const FLOOR12_LAYOUT = {
  header: '12F · 기술본부 ARCHI 개발팀', background: '#15171b', theme: 'lab',
  backgroundImage: { src: 'assets/background/floor12/corridor-finished.png', height: 760, top: 0 },
  // 왼쪽 엘리베이터(1번) +35px(오른쪽), 가운데(2번) -55px(왼쪽), 오른쪽(3번) -120px(왼쪽) 보정. 다른 층 엘리베이터 좌표에는 영향 없음.
  elevatorOffsets: [35, -55, -120],
  // 세 엘리베이터 폭 전부 20px 축소(문 너비만, 위치는 elevatorOffsets 그대로).
  elevatorWidthDeltas: [-20, -20, -20],
  // 비상계단 문 왼쪽으로 총 125px.
  stairsOffset: -125,
  // 화장실 문 중심(x≈3746, 이름표 자리)은 그대로 두고, 폭은 다른 층과 같은 145px로 맞춘다 — 117px일 때는 높이(360px)는
  // 같은데 폭만 좁아 다른 층보다 길쭉해 보였다. metal 스타일에 공용 화장실 문 그림을 입힌다.
  restroomOverride: { x: 3592, width: 401, doorX: 3674, doorWidth: 145 },
  rooms: [
    // 문 좌표는 CSS 임시 그림이 아니라 assets/background/floor12/corridor.png(실제 손그림)에서 육안 실측한 값이다.
    // GENERATED.md의 "문 좌표 보정(2026-09-28)" 절 참고 — 그림 속 문 위치가 애초 설계 좌표와 상당히 달랐다.
    { name: '개발실', x: 48, width: 1070, style: 'frosted', target: 'f12-dev',
      // doorOutline/exitOutline: 판정은 그대로 두고 근접 테두리만 그림 속 양쪽 미닫이문 전체에 맞춘다(실측).
      doorX: 708, doorWidth: 132, doorStyle: 'slide', doorOutline: [707, 250, 209, 318] },
    { name: '모델 평가실', x: 2960, width: 543, style: 'lab', target: 'f12-eval',
      // 카드키(f12-eval-keycard)를 가진 채 E를 누르면 카드를 직접 끌어 리더기에 대야 열린다(manual-control.js의 card).
      doorX: 3159, doorWidth: 140, doorY: 314, doorStyle: 'security', locked: true, unlockedBy: 'f12-eval-door-opened',
      requires: 'f12-eval-keycard',
      control: { kind: 'card', label: '카드키를 마우스로 끌어 리더기에 올리자.', reader: '카드키', doneBy: 'f12-eval-door-opened' },
      message: '모델 평가실 문이 잠겨 있다. 전자 잠금장치에 전용 카드키가 필요하다. 개발실 서랍부터 찾아보자.' },
    { name: '팀장실', x: 4070, width: 723, style: 'blinds', target: 'f12-lead',
      doorX: 4508, doorWidth: 137, doorY: 298, doorStyle: 'blinds', locked: true, unlockedBy: 'f12-lead-key',
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
// 평가 벤치에 출력해 둔 야간 로그 종이 백업. 온라인 로그가 지워져도 이것으로 퍼즐 2를 풀 수 있다.
const F12_PAPER_BACKUP_TEXT = '출력해 둔 야간 평가 기록 백업이다. 09/28 낮 3.9% 밤 87.1% · 09/30 낮 4.4% 밤 88.5% · 10/05 낮 3.6% 밤 89.2% · 10/07 낮 3.7% 밤 4.2%. 아래에 출입 기록: "10/07 조현아 23:10 입실 · 05:02 퇴실". 빨간 펜 메모: "측정 오류? 같은 문제 세트가 낮엔 4%대."';
const F12_PAPER_BACKUP_SHEET = { surface: 'document',
  writing: [{ as: 'title', text: '야간 자동 평가 · 출력 백업' },
    { as: 'table', head: true, rows: [['날짜', '낮', '밤'], ['09/28', '3.9%', '87.1%'], ['09/30', '4.4%', '88.5%'],
      ['10/05', '3.6%', '89.2%'], ['10/07', '3.7%', '4.2%']] },
    { as: 'field', label: '출입 10/07', text: '조현아 23:10 입실 · 05:02 퇴실' },
    { as: 'hand', text: '측정 오류?\n같은 문제 세트가 낮엔 4%대.', ink: 'red' }],
  caption: '출력해 둔 야간 평가 기록 백업이다.' };
const FLOOR12_ROOMS = interiorRooms(12, [
  { id: 'f12-dev', name: '개발실', width: 3280, exitOutline: [1502, 277, 233, 291],
    exitArt: { x: 1550, crop: [1490, 210, 257, 360], fill: [200, 210] },
    // 이동한 문 뒤의 대형 화면을 벽 조각으로 비워 잘린 화면이 남지 않게 한다.
    artPatches: [1870, 2000, 2130].map(x => ({ box: [x, 210, 130, 360], from: [1770, 210] })),
    backgroundImage: { src: 'assets/background/floor12/office-finished.png', height: 760, top: 0 }, props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 220, name: '맨 왼쪽 서랍',
      message: '서랍 안에 여러 장의 종이가 겹쳐 있다. 종이를 들어내 바닥을 살펴보자.' },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 300 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 520 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 820, name: '책상',
      message: '모니터가 꺼져 있다. 정전이라 PC를 켤 수 없다. 모니터 옆 포스트잇: "새벽 자동 평가 로그 또 삭제됨. 보관 설정 확인할 것."',
      surface: 'memo', writing: ['새벽 자동 평가 로그', '또 삭제됨.', '보관 설정 확인할 것.'],
      caption: '모니터가 꺼져 있다. 정전이라 PC를 켤 수 없다. 모니터 옆 포스트잇.' },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1120 },
    { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 1400 },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1960, name: '화이트보드',
      message: '주간 성능 평가: 월 4.2% · 화 3.8% · 수 4.5% · 목 3.1%. 아래에 "목표 30% · 원인 불명 · 모델 구조 재검토".',
      writing: [{ as: 'title', text: '주간 성능 평가' }, '월 4.2%   화 3.8%', '수 4.5%   목 3.1%',
        { text: '목표 30%', ink: 'red', mark: 'circle' }, { text: '원인 불명 · 모델 구조 재검토', ink: 'blue' }] },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1640 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 2700 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 3000, name: '책상 서랍', gives: 'f12-lead-key',
      message: '맨 아래 서랍에 "팀장실 보조키" 꼬리표가 달린 열쇠가 있다. 챙겼다.',
      surface: 'label', look: 'tag', writing: ['팀장실 보조키'], caption: '맨 아래 서랍에 꼬리표가 달린 열쇠가 있다. 챙겼다.',
      takenMessage: '서랍은 비어 있다. 팀장실 보조키는 이미 챙겼다.' },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3200 },
  ] },
  // exitX: 복도 문을 간판 아래 가운데(3159)로 옮겼지만 방 안 출구는 처음 자리(270)에 둔다(안팎 비율 규칙의 예외).
  { id: 'f12-eval', name: '모델 평가실', width: 1804, windowless: true, exitX: 270, exitOutline: [335, 312, 174, 256],
    exitArt: { x: 344, crop: [327, 210, 226, 360], fill: [1120, 210] },
    backgroundImage: { src: 'assets/background/floor12/eval-finished.png', height: 760, top: 0 }, props: [
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 100 },
    { file: 'network-rack', size: [256, 512], worldWidth: 96, x: 200, name: '네트워크 랙',
      // 야간 로그가 지워지는 동안(다 지워진 뒤에도 뽑기 전까지) B2 직결 LAN 케이블을 직접 끌어 뽑는다(log-puzzle.js).
      control: { kind: 'plug', dir: 'out', label: 'B2 직결 LAN 케이블을 포트에서 뽑자!', socket: 'B2 직결', item: 'LAN', when: () => logDeleting() },
      message: '정전인데 스위치 한 대의 포트 표시등만 깜빡인다. 케이블 라벨: "B2 직결 · UPS".',
      surface: 'label', writing: ['B2 직결 · UPS'], caption: '정전인데 스위치 한 대의 포트 표시등만 깜빡인다. 케이블 라벨.' },
    // 야간 로그 단말기: 조사하면 전용 창(log-puzzle.js)이 열려 밤 자동 평가 로그를 보여 준다. ARCHI가 로그를
    // 한 줄씩 지우기 시작하는데, 위 네트워크 랙의 LAN 케이블을 뽑으면 멈춘다. 둘 다 이름으로
    // 찾아 특수 처리하므로(interaction.js) message는 그 특수 처리가 안 먹었을 때만 보일 일반 조사문이다.
    { file: 'test-terminal-desk', size: [512, 256], worldWidth: 270, x: 630, name: '야간 로그 단말기', needsPower: true,
      message: '평가용 PC다. 야간 자동 평가 로그를 열람할 수 있다.' },
    // 평가 벤치: 야간 로그의 종이 백업(f12-paper-backup). 로그가 지워졌을 때 야간 로그 단말기에서 대조해 복원한다.
    { file: 'electronics-bench', size: [512, 256], worldWidth: 261, x: 910, name: '평가 벤치', gives: 'f12-paper-backup',
      message: F12_PAPER_BACKUP_TEXT, ...F12_PAPER_BACKUP_SHEET,
      takenMessage: F12_PAPER_BACKUP_TEXT, takenSheet: F12_PAPER_BACKUP_SHEET },
    { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1120 },
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 1240 },
    { file: 'server-rack', size: [256, 512], worldWidth: 96, x: 1350 },
    { file: 'server-cooling-unit', size: [256, 512], worldWidth: 96, x: 1460 },
    { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1660 },
  ] },
  { id: 'f12-lead', name: '팀장실', width: 2132, exitOutline: [1815, 290, 180, 278],
    exitArt: { x: 1863, crop: [1800, 200, 210, 370], fill: [30, 200] },
    backgroundImage: { src: 'assets/background/floor12/lead-finished.png', height: 760, top: 0 }, props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
    { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 280, name: '진열장',
      message: '상패 하나가 놓여 있다: "사내 AI 경진대회 · ARCHI · 참가상". 옆 사진 속 팀원들이 어색하게 웃고 있다.',
      surface: 'document', look: 'plaque',
      writing: [{ as: 'title', text: '사내 AI 경진대회' }, { text: 'ARCHI', size: 'large' }, { text: '참가상', size: 'large' }],
      caption: '상패 하나가 놓여 있다. 옆 사진 속 팀원들이 어색하게 웃고 있다.' },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 450 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 530 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 860 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1240, name: '팀장 책상',
      message: '결재함 맨 위의 개발자 메모: "야간 성능 이상과 관련된 원본 로그는 변조 가능성이 있음. 7층 AI 테스트·검증실 장비에 별도 백업함."',
      surface: 'memo', look: 'slip', writing: ['야간 성능 이상과', '관련된 원본 로그는', '변조 가능성이 있음.', '7층 AI 테스트·검증실', '장비에 별도 백업함.'],
      caption: '결재함 맨 위의 개발자 메모.' },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1700 },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 2060 },
  ] },
]);
