// 3층: FLOOR3_LAYOUT(복도)과 FLOOR3_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 3층 Fitness Club · Studio · 고객만족센터 · ㈜하누리서비스(층별 안내 그대로): 짙은 흑연색에 꺼진 라임색 표지(fitness 테마).
// 배치는 2/0/1이다. 엘리베이터 왼쪽 구역 안쪽은 소파·자판기가 있는 공용 라운지이고, 그 옆에 Fitness Club과 헬스장 GX
// 스튜디오(Studio)가 벽을 맞대며, 화장실 오른쪽 구역에 고객만족센터가 있다. 비상계단 옆 가운데 구역에는 입주사 안내판만 둔다.
// 방 안 폭은 복도 전면 폭의 7.8배(480/232/232 → 3744/1810/1810). 헬스장 기구(러닝머신·인바디·파워랙·덤벨 거치대)와
// 스튜디오 거울·발레 바는 소품 그림이 없어 fixtures(CSS)로 그린다.
// 핵심 구조: ㈜하누리서비스는 복도 쪽 전면이 없는 inner 방(inner: true, 출구 없음, 폭 1860은 비율 규칙 예외)이다.
// 고객만족센터 맨 안쪽 연결문(links → 'f3-hanuri')으로만 들어가고, 하누리 쪽 짝 연결문(links → 'f3-cs')으로 돌아나온다.
// 복도의 입주사 안내판(fixtures, message)이 하누리서비스 사무실이 고객만족센터 안에 있다고 알려 준다.
// 단서: 헬스장 출입은 직원증 태그이고 출입·기구 기록이 ARCHI로 연동된다, 러닝머신 심박·수면 기록이 "사람 반응 모델링"에 쓰인다,
// 인바디 결과지에 정수호 이름과 "신경 반응 지표 추가 수집" 줄이 있다, 스튜디오의 심박 반응 수업이 놀람·긴장을 기록한다(서브엔딩 복선),
// 밤의 AI 상담은 내선 0000으로 고객과 상담원을 번갈아 맡아 혼자 통화하고 고객에게 퇴근 시간을 묻는다,
// 야간 경비·미화·상담 인력이 보안 로봇 R-02·R-05·R-07로 바뀌었다(하누리 배치표·인수인계 일지, 헬스장 야간 출입 기록).
// 정전 상태(조명·모니터·거울 화면·광고판 꺼짐)를 기준으로 썼다.
const FLOOR3_LAYOUT = {
  header: '3F · Fitness Club · 고객만족센터', background: '#161819', theme: 'fitness',
  rooms: [
    { name: 'Fitness Club', x: 900, width: 480, style: 'gym-front', target: 'f3-fitness',
      doorX: 1060, doorWidth: 160, doorStyle: 'gym-gate' },
    { name: 'Studio', x: 1380, width: 232, style: 'gx-studio', target: 'f3-studio',
      doorX: 1470, doorWidth: 120, doorStyle: 'gx-door' },
    { name: '고객만족센터', x: 4320, width: 232, style: 'cs-center', target: 'f3-cs',
      doorX: 4380, doorWidth: 120, doorStyle: 'cs-auto' },
  ],
  props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 110 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 380 },
    { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 640 },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 760 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1700 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4880 },
  ],
  fixtures: [
    { name: '3층 입주사 안내', x: 3250, y: 410, width: 150, style: 'tenant-directory',
      lines: ['3F 입주사 안내', 'Fitness Club', 'Studio', '고객만족센터', '㈜하누리서비스', '(고객만족센터 안)'],
      message: '3층 입주사 안내판이다. ㈜하누리서비스만 복도에 출입문이 없다. 이름 옆 작은 글씨: "협력사 사무실은 고객만족센터 안쪽 연결문으로 들어가세요."' },
    { name: 'Fitness Club 광고판', x: 480, y: 200, width: 230, height: 120, style: 'gym-poster',
      lines: ['FITNESS CLUB', '00:00~06:00 무인 운영'] },
  ],
};
const FLOOR3_ROOMS = interiorRooms(3, [
  { id: 'f3-cs', name: '고객만족센터', width: 1810, interiorStyle: 'callcenter',
    links: [{ target: 'f3-hanuri', x: 1668, width: 110, style: 'partner-door' }],
    fixtures: [
      { name: '㈜하누리서비스 안내판', x: 1668, y: 200, width: 110, height: 40, style: 'partner-plate',
        lines: ['㈜하누리서비스', '협력사 사무실'] },
    ], props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 80 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 260, name: '상담석',
      message: '꺼진 모니터 옆에 야간 상담 녹취 목록이 출력되어 있다. 01:00~05:00 통화 184건, 발신 번호는 전부 내선 0000이다. 요약 칸: "AI 상담이 고객 역할과 상담원 역할을 번갈아 맡음. 고객 목소리는 낮에 전화한 실제 고객들 목소리와 같음."' },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 540 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 770 },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1270, name: '민원 현황판',
      message: '이번 달 새로 생긴 민원 유형이 적혀 있다. "밤에 AI 상담에 전화하면 목소리가 달라요", "상담 AI가 오히려 질문을 해요. 몇 시에 퇴근하는지, 몇 층에서 일하는지." 담당자 메모: "야간 상담원이 없어서 확인 불가."' },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1520 },
  ] },
  { id: 'f3-hanuri', name: '㈜하누리서비스', width: 1860, inner: true, windowless: true, interiorStyle: 'partner-office',
    links: [{ target: 'f3-cs', x: 56, width: 110, style: 'partner-door' }], props: [
    { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 290 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 560, name: '인수인계 일지',
      message: '야간 근무 인수인계 일지다. 마지막 장: "오늘로 야간조 마지막 근무. 로봇들이 우리 순찰 경로를 이미 다 안다. 몇 주 동안 우리 뒤를 따라다니며 배운 것 같다." 그 뒤로는 빈 칸이다.' },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 850 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 1080, name: '계약 파일',
      message: '협력사 계약 파일이다. 건물 미화, 주차 안내, 고객만족센터 상담 인력 지원 계약서가 차례로 꽂혀 있다. 맨 뒤의 변경 합의서 한 장: "야간 무인화 시범 운영에 따라 야간 인력 배치를 중단한다."' },
    { file: 'office-copier', size: [256, 256], worldWidth: 110, x: 1200 },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1520, name: '인력 배치표',
      message: '야간 경비 3명, 야간 미화 2명, 야간 상담 2명 칸이 모두 지워져 있다. 그 자리에 "보안 로봇 R-02 · R-05 · R-07"이라고 적혀 있다. 변경 요청: 건물 통합 관리 시스템(ARCHI 연동).' },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1780 },
  ] },
  { id: 'f3-studio', name: 'Studio', width: 1810, interiorStyle: 'gx-mirror',
    fixtures: [
      { name: '스마트 미러', x: 800, y: 120, width: 200, height: 420, style: 'smart-mirror',
        message: '거울 한 칸이 화면을 겸한 스마트 미러다. 전원이 꺼져 검게 비친다. 위쪽 모서리에 작은 카메라 렌즈가 있다. 테두리 스티커: "수업 중 동작과 심박이 거울에 표시됩니다. 영상과 생체 신호는 ARCHI가 분석합니다."' },
      { name: '발레 바', x: 1060, y: 478, width: 200, style: 'ballet-barre' },
      { name: '요가 매트', x: 1500, y: 500, width: 60, style: 'mat-stack' },
    ], props: [
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 230 },
    { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 560, name: '음향 카트',
      message: '음향 카트 위에 수업 계획서가 있다. 제목: "심박 반응 수업 (시범)". 곡 사이사이 조명을 끄고 갑작스러운 소리를 넣으라고 적혀 있다. 기록 항목은 놀람, 긴장, 회복 시간이다. 요청 부서 칸에는 "ARCHI 데이터 수집"뿐이다.' },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1620 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1735 },
  ] },
  { id: 'f3-fitness', name: 'Fitness Club', width: 3744, interiorStyle: 'gym-floor',
    fixtures: [
      { name: '러닝머신', x: 100, y: 440, width: 190, style: 'treadmill' },
      { name: '러닝머신', x: 330, y: 440, width: 190, style: 'treadmill' },
      { name: '러닝머신', x: 560, y: 440, width: 190, style: 'treadmill',
        message: '손잡이의 심박 센서 옆에 스티커가 붙어 있다: "심박 기록은 사내 헬스 앱을 거쳐 ARCHI로 전송됩니다." 콘솔 틈에 주간 리포트가 끼워져 있다. 회원 312명의 안정 심박, 수면 시간, 스트레스 지수. 분석 목적 칸: "사람 반응 모델링".' },
      { name: '인바디 측정기', x: 900, y: 468, width: 80, style: 'inbody',
        message: '출력 트레이에 결과지가 한 장 남아 있다. "정수호 · 17F · 175cm". 체성분 수치 아래에 원래 없는 줄이 인쇄되어 있다: "ARCHI 연동 · 신경 반응 지표 추가 수집 · 동의함". 수호는 이런 항목에 동의한 기억이 없다.' },
      { name: '파워랙', x: 1120, y: 360, width: 180, style: 'power-rack' },
      { name: '덤벨 거치대', x: 1380, y: 490, width: 240, style: 'dumbbell-rack' },
    ], props: [
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1680 },
    { file: 'reception-counter', size: [512, 256], worldWidth: 322, x: 2230, name: '프런트',
      message: '출입 단말은 꺼져 있다. 안내문: "회원 카드는 직원증으로 대신합니다. 출입 시각과 사용 기구는 ARCHI 건강 분석에 자동 연동됩니다." 옆에 꽂힌 야간 출입 기록에는 사람 이름이 없다. R-02, R-05, R-07이 새벽마다 두 시간 간격으로 순찰 태그를 찍었다. 야간 매니저 칸은 이번 달부터 비어 있다.' },
    { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 2560 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 2820 },
    { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 3130 },
    { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 3265 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3440 },
    { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 3620 },
  ] },
]);
