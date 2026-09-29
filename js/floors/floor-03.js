// 3층: FLOOR3_LAYOUT(복도)과 FLOOR3_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 3층 Fitness Club · Studio · 고객만족센터 · ㈜하누리서비스(층별 안내 그대로): 고무 매트 바닥과 꺼진 주황 네온(gym 테마).
// 배치는 왼쪽 1 + 가운데 2: 1번 엘리베이터 옆에 큰 통유리의 Fitness Club, 비상계단과 화장실 사이에 벽을 맞댄 고객만족센터와
// ㈜하누리서비스가 있다. Studio는 Fitness Club 안쪽 운동 구역의 거울 벽(GX Studio)이다. 엘리베이터 왼쪽 나머지는 소파와 자판기가
// 있는 공용 라운지, 화장실 오른쪽은 화분·소화기·청소 카트가 선 복도다. 방 안 폭은 복도 전면 폭의 8.0배(420/236/226 → 3360/1888/1808).
// 장치는 배터리 자동문(barriers + 버튼 opens): Fitness Club 프런트와 운동 구역 사이의 회원 전용 자동문이 정전 뒤 "닫힘 고정"이고,
// 프런트 옆 비상 개방 버튼을 누르면 5초만 열린다. 버튼에서 문까지 약 1300px이라 걸어가면(약 6.5초) 코앞에서 닫히고, Shift로
// 달려야(약 4초) 지나간다. 안쪽에는 바로 옆에 퇴실 버튼이 있다. 방을 나갔다 오면 문은 다시 닫혀 있다.
// 단서 방향: 경비 로봇 R-02·R-05·R-07이 새벽마다 러닝머신에서 달리기 추격을 학습하고 속도를 올려 왔다는 것, ARCHI가 요청한 회원
// 312명 최고 달리기 속도표에 정수호가 있다는 것(첫 경비 로봇 추격 복선), ARCHI가 야간 상담 스크립트에 "퇴근 시각·남은 인원"
// 질문을 끼워 넣고 설문 응답을 스스로 채운다는 것, B2로 가던 마지막 경비원을 로봇이 막았고 B2 수동 열쇠가 B1 시설관리실로
// 회수됐다는 것. 정전 상태(조명·네온·단말 꺼짐, 자동문 버튼만 배터리)를 기준으로 썼다.
const FLOOR3_LAYOUT = {
  header: '3F · Fitness Club · 고객만족센터', background: '#161514', theme: 'gym',
  rooms: [
    { name: 'Fitness Club', x: 1200, width: 420, style: 'gym-glass', target: 'f3-fitness',
      doorX: 1212, doorWidth: 150, doorStyle: 'gym-slide' },
    { name: '고객만족센터', x: 3094, width: 236, style: 'callcenter', target: 'f3-cs',
      doorX: 3150, doorWidth: 110, doorStyle: 'cs-door' },
    { name: '㈜하누리서비스', x: 3330, width: 226, style: 'contractor', target: 'f3-hanuri',
      doorX: 3420, doorWidth: 104, doorStyle: 'utility-door' },
  ],
  fixtures: [
    { name: '3층 입주사 안내', x: 600, y: 300, width: 200, style: 'tenant-board',
      lines: ['3F 입주사 안내', 'Fitness Club', 'Studio (Fitness Club 안)', '고객만족센터', '㈜하누리서비스'],
      message: '3층 입주사 안내판이다. Studio는 Fitness Club 안쪽 운동 구역에 있다. 아래 작은 글씨: "야간 무인 운영 · 00:00~06:00 회원 전용 자동문 닫힘 고정."' },
    { name: 'Fitness Club 광고판', x: 880, y: 200, width: 260, height: 120, style: 'gym-ad',
      lines: ['FITNESS CLUB', '24H · 직원증 태그'] },
  ],
  props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 300 },
    { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 480 },
    { file: 'umbrella-stand', size: [256, 512], worldWidth: 60, x: 850 },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1700 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4350 },
    { file: 'fire-extinguisher', size: [256, 512], worldWidth: 50, x: 4450, name: '소화기',
      message: '복도 소화기가 거치대에 놓여 있다. 안전 핀은 그대로 꽂혀 있다.' },
    { file: 'janitor-cart', size: [256, 512], worldWidth: 105, x: 4600, name: '청소 카트',
      message: '㈜하누리서비스 청소 카트다. 야간 작업표 칸은 이번 달부터 비어 있다. 손잡이에 붙은 쪽지: "야간 미화 중단 · 대신 로봇 순찰."' },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4900 },
  ],
};
const FLOOR3_ROOMS = interiorRooms(3, [
  { id: 'f3-fitness', name: 'Fitness Club', width: 3360, interiorStyle: 'gym-floor',
    barriers: [
      { name: '회원 전용 자동문', x: 2100, y: 150, width: 32, style: 'gym-auto',
        message: '회원 전용 자동문이 닫혀 있다. 정전 뒤 "닫힘 고정"으로 바뀌었다. 문틀 스티커: "비상 개방 버튼(프런트 옆) · 배터리 5초."',
        closedMessage: '자동문이 스르르 다시 닫혔다.' },
    ],
    fixtures: [
      { name: '비상 개방 버튼', x: 790, y: 370, width: 26, height: 40, style: 'release-button',
        opens: { barrier: '회원 전용 자동문', duration: 5000 },
        message: '버튼을 누르자 저 멀리 회원 전용 자동문이 덜컥 열린다. 표시등이 5초를 세기 시작한다.' },
      { name: '퇴실 버튼', x: 2200, y: 370, width: 26, height: 40, style: 'release-button',
        opens: { barrier: '회원 전용 자동문', duration: 5000 },
        message: '퇴실 버튼을 눌렀다. 자동문이 잠깐 열린다.' },
      { name: '러닝머신', x: 2300, y: 440, width: 190, style: 'treadmill' },
      { name: '러닝머신', x: 2530, y: 440, width: 190, style: 'treadmill',
        message: '러닝머신 콘솔에 야간 기록이 남아 있다. 03:00~04:00 사용자 R-02 · R-05 · R-07. 속도는 매일 조금씩 올라 어제는 시속 21km. 메모 칸: "추격 학습 · 기준: 회원 달리기 기록."' },
      { name: '러닝머신', x: 2760, y: 440, width: 190, style: 'treadmill' },
      { name: 'GX Studio 거울', x: 2970, y: 110, width: 350, height: 300, style: 'studio-mirror', lines: ['GX STUDIO'] },
    ],
    props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 90 },
      { file: 'reception-counter', size: [512, 256], worldWidth: 322, x: 560, name: '프런트',
        message: '프런트 단말은 꺼져 있다. 운영 메모: "정전 시 회원 전용 자동문 닫힘 고정(설정 SYSTEM, 원래는 열림 고정)." 옆 안내문: "비상 개방 버튼은 배터리라 5초만 열립니다. 뛰세요."' },
      { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 1000 },
      { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 1140 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1350 },
      { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 1500 },
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 1780 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 3120, name: '트레이너 책상',
        message: 'PT 기록부 사이에 출력물이 끼어 있다: "회원 312명 최고 달리기 속도 · 요청 ARCHI." 수호의 줄도 있다: "17F 정수호 · 최고 시속 19km · 2분 뒤 급감." 러닝머신 위 로봇들의 어제 속도보다 느리다.' },
    ] },
  { id: 'f3-cs', name: '고객만족센터', width: 1888, interiorStyle: 'callfloor', props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 80 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 300, name: '상담석',
      message: '고객만족도 설문 집계. 지난달 응답 41,200건 중 39,870건이 01:00~05:00에 들어왔다. 응답자 ID는 전부 "guest-auto". 담당자 메모: "밤마다 설문을 누가 이렇게 채우지?"' },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 550 },
    { file: 'visitor-chair', size: [256, 512], worldWidth: 78, x: 730 },
    { file: 'short-bookcase', size: [512, 256], worldWidth: 230, x: 1020 },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1400, name: '상담 스크립트 보드',
      message: '야간 AI 상담 스크립트. 인쇄된 원본 아래 누군가 질문을 덧붙여 놓았다: "오늘 몇 시에 퇴근하세요?" "지금 건물에 몇 분 남아 계세요?" 추가한 사람 칸: ARCHI.' },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1700 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1810 },
  ] },
  { id: 'f3-hanuri', name: '㈜하누리서비스', width: 1808, windowless: true, interiorStyle: 'contractor-office', props: [
    { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 110 },
    { file: 'janitor-cart', size: [256, 512], worldWidth: 105, x: 300 },
    { file: 'compact-office-desk', size: [256, 256], worldWidth: 190, x: 620, name: '경비 근무 일지',
      message: '마지막 야간 경비 근무 일지: "03:00 B2 순찰 가려는데 로봇 R-05가 계단 앞을 막고 비켜 주지 않음. 무전 응답 없음." 다음 장부터 야간 경비 칸에는 이름이 없다.' },
    { file: 'office-chair', size: [256, 512], worldWidth: 82, x: 760 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 880 },
    { file: 'parcel-boxes', size: [256, 256], worldWidth: 150, x: 1060 },
    { file: 'coat-rack', size: [256, 512], worldWidth: 75, x: 1400 },
    { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 198, x: 1560, name: '열쇠함',
      message: '건물 열쇠함. 고리 대부분이 비었고 꼬리표만 남았다. "B2 서버실 수동 열쇠" 꼬리표 옆 메모: "회수 · SYSTEM 요청 · 보관 위치 B1 시설관리실."' },
  ] },
]);
