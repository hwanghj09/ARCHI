// 1층: FLOOR1_LAYOUT(복도)과 FLOOR1_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 1층 로비(층별 안내: Harmony Hall / Vision Hall / 건강관리실 / 여성휴게실): 밝은 트래버틴 바닥과 황동 테(atrium 테마).
// 정문은 동쪽 끝(화장실 오른쪽 구역)의 회전문이고, 그 앞에 정전으로 날개가 풀린 스피드 게이트와 충전 도크의 경비 로봇 R-01이 선다.
// 방 셋은 모두 엘리베이터 왼쪽 서쪽 날개에 벽을 맞대고 선다(왼쪽 3): Harmony Hall 1층 객석, Vision Hall, 건강관리실.
// 1번 엘리베이터 앞에 층별 안내판(17F~B2), 비상계단 옆 가운데 구역에 안내 데스크가 있다. 여성휴게실은 건강관리실 안쪽의 잠긴 문이다.
// 복도 전면은 그림 속 칸막이 범위에 맞춘다. 내부 문은 그 전면의 문 좌우 벽 비율을 따른다.
// 장치는 경비 로봇 정비 패널의 네 자리 번호(설비 fixture의 code): 패널 스티커는 "정비 코드 = 제작일(월일)"이라 Vision Hall 진열장의
// 제작일(11월 7일, 1107)을 넣게 만들지만 옛 번호다. 건강관리실 점검표가 로비 배치(9월 14일) 때 배치일로 바꿨다고 알려 주어 0914가
// 맞다. 열면 23:58 SYSTEM이 로봇을 "차단" 모드로 바꾸고 차단 대상을 17F 정수호, 최우선 방어 구역을 B2로 둔 기록(gives
// 'f1-robot-log')이 나온다. 전력 공급 시 R-01이 로비를 순찰하며, 전력을 끊으면 그 자리에서 멈춘다. 이 코드를 넣으면 R-01은 꺼져 전력이 들어와도(B2 엔딩의 1층 포함) 움직이지 않는다.
// 단서: 15~12층 사원증 인증, 층별 안내판(12F·7F·B2), 야간 응급 이송지가 B2의
// 인체 신호 연결 장비로 바뀐 매뉴얼(서브엔딩 복선), 새벽마다 옛 진열 자리를 찾아오는 R-01, 낮에는 박자를 놓치고 새벽 무관객
// 리허설에서는 완벽한 ARCHI 자동 반주(2층 영사실 녹화와 이어짐). 정전 상태(조명·모니터 꺼짐, 로봇 정비 패널만 도크 배터리)를 기준으로 썼다.
const FLOOR1_LAYOUT = {
  header: '1F · 로비', background: '#1d1b17', theme: 'atrium',
  backgroundImage: { src: 'assets/background/floor1/corridor-unified-finished.png', height: 760, top: 0 },
  // 엘리베이터 3대: 그림 속 벽감이 BUILDING_CORE 좌표보다 오른쪽으로/좁게 쏠려 있어(실측) 보정.
  elevatorOffsets: [130, 74, 51],
  elevatorWidthDeltas: [-21, -16, -16],
  elevatorYDeltas: [0, 0, 0], elevatorHeightDeltas: [-10, -10, -10],
  // 비상계단: 그림 속 문이 BUILDING_CORE.stairs보다 왼쪽으로/훨씬 좁게 나와서 보정.
  stairsOffset: -11, stairsWidthDelta: -35, stairsHeightDelta: -20,
  // 화장실: 그림 속 문이 BUILDING_CORE.restroom보다 오른쪽으로 쏠려 있어 보정. doorStyle은 17층
  // 확장구역 문처럼 'art-door'(CSS 문 완전히 숨김)로 바꿔서, corridor.png에 이미 그려진 문 위에
  // 기본 CSS 금속문(.metal)이 겹쳐 그려지지 않게 한다.
  // doorOutline(방 문)·outline(설비): 판정은 그대로 두고 근접 테두리만 corridor.png 속 문·사물 상자에 맞춘다(실측).
  restroomOverride: { x: 3630, width: 615, doorX: 3733, doorWidth: 158, doorStyle: 'art-door', doorOutline: [3727, 292, 171, 266] },
  rooms: [
    // 문 좌표는 설계값이 아니라 assets/background/floor1/corridor-finished.png(실제 그림)에서 육안 실측한 값이다.
    // GENERATED.md의 "문 좌표 보정" 절 참고.
    { name: 'Harmony Hall', x: 156, width: 452, style: 'hall-portal', target: 'f1-harmony',
      doorX: 223, doorWidth: 225, doorStyle: 'hall-double', doorOutline: [204, 261, 237, 296] },
    { name: 'Vision Hall', x: 608, width: 332, style: 'gallery', target: 'f1-vision',
      doorX: 650, doorWidth: 143, doorStyle: 'pivot-glass', doorOutline: [617, 261, 178, 296] },
    { name: '건강관리실', x: 940, width: 262, style: 'clinic', target: 'f1-clinic',
      doorX: 1023, doorWidth: 99, doorStyle: 'clinic-door', doorOutline: [1030, 302, 106, 254] },
  ],
  fixtures: [
    // 실측: corridor.png에 이미 금장 테두리 벽감이 그려져 있다(바깥 x≈1320~1646, y≈225~509, 안쪽
    // x≈1323~1644, y≈229~505, 안쪽 높이 약 276px). CSS 테두리/배경은 art 모드에서 지우고 그 위에 글자만
    // 얹는다. 좌표는 벽감 안쪽에 맞췄다. 층 전부는 안쪽 높이(약 276px)에 안 들어가서, 덜 중요한 층은 "···"로
    // 묶어 15줄로 줄였다(단서로 이어지는 12F·7F·B2 세 줄과 위아래 끝 층은 그대로 유지). 게임의 맨 아래층은
    // B2라서 B3 줄은 뺐다. B1은 게임 속 층(floor-b1.js)과 사내 문서 ADM-006에 맞춰 "시설 관리실"로 적는다
    // (층별안내.md 원본은 AI 서버실). 강조 줄 CSS(index.html의 nth-child)는 이 배열의 줄 번호(5/9/15번째)에 맞춘다.
    { name: '층별 안내판', x: 1323, y: 229, width: 321, height: 276, style: 'directory-board', photo: true,
      lines: [
        '17F  TmaxSoft 사업테스트본부',
        '16F  The Kitchen / CU 편의점 / Café',
        '···',
        '13F  TmaxSoft 기술본부',
        '12F  TmaxSoft 기술본부 · ARCHI 개발팀',
        '11F  TmaxSoft 사업본부 / 전략마케팅본부',
        '···',
        '8F  TmaxTibero QA실, 제품기획실',
        '7F  Lounge / VIP Room · AI 테스트·검증실',
        '6F  TmaxTibero 기술본부',
        '···',
        '2F  Harmony Hall / 서버실',
        '1F  Harmony Hall / Vision Hall / 건강관리실 / 여성휴게실',
        'B1  시설 관리실',
        'B2  AI 서버실',
      ],
      message: '층별 안내판이다. 12F 기술본부 · ARCHI 개발팀, 7F AI 테스트·검증실, B2 AI 서버실.',
      surface: 'document', look: 'sign',
      writing: [{ as: 'title', text: '층별 안내' },
        { text: '17F  TmaxSoft 사업테스트본부\n16F  The Kitchen / CU 편의점 / Café\n15F  TmaxSoft 연구본부\n14F  TmaxSoft 연구본부\n' +
          '13F  TmaxSoft 기술본부', size: 'small' },
        { text: '12F  TmaxSoft 기술본부 · ARCHI 개발팀', size: 'small' },
        { text: '11F  TmaxSoft 사업본부 / 전략마케팅본부\n10F  TmaxSoft / TmaxTibero 경영관리본부\n9F  TmaxTibero 사업본부\n' +
          '8F  TmaxTibero QA실, 제품기획실', size: 'small' },
        { as: 'page' }, { text: '7F  Lounge / VIP Room · AI 테스트·검증실', size: 'small' },
        { text: '6F  TmaxTibero 기술본부\n5F  TmaxTibero 연구본부\n4F  TmaxTibero 연구본부\n' +
          '3F  Fitness Club / ㈜하누리서비스 / 고객만족센터 / Studio\n2F  Harmony Hall / 서버실\n' +
          '1F  Harmony Hall / Vision Hall / 건강관리실 / 여성휴게실\nB1  시설 관리실', size: 'small' },
        { text: 'B2  AI 서버실', size: 'small' }],
    },
    { name: '스피드 게이트', x: 4300, y: 470, width: 100, style: 'speed-gates', outline: [4316, 464, 179, 93],
      control: { kind: 'card', label: '출입증을 리더기에 대자.' },
      message: '작은 화면이 붉게 깜빡인다: "미등록 출입증." 그래도 날개는 정전 때 저절로 풀리는 방식이라 손으로 밀면 그냥 열린다.',
      surface: 'screen', look: 'lcd', writing: [{ text: '미등록 출입증.', ink: 'red', size: 'large', align: 'center' }],
      caption: '작은 화면이 깜빡인다. 그래도 날개는 정전 때 저절로 풀리는 방식이라 손으로 밀면 그냥 열린다.' },
    // 배경에 그려진 로봇은 빈 도크 패치로 가리고, 이동 스프라이트와 조사 범위를 함께 갱신한다.
    // 순찰 서쪽 경계(3040)는 비상계단(BUILDING_CORE.stairs, 보정 후 2895~3040) 동쪽 끝 — 로비 동쪽
    // 구역(스피드 게이트·정문)만 돌고 비상계단을 넘어 엘리베이터·방 쪽으로는 가지 않는다.
    { name: '경비 로봇', x: 4495, y: 440, width: 70, style: 'guard-bot', lines: ['R-01'], outline: [4531, 406, 55, 151], selfPowered: true, // 정비 패널은 보조 배터리
      patrol: { left: 3040, right: 4540, speed: 80, pause: 1400 },
      code: '0914', gives: 'f1-robot-log',
      codePrompt: '보조 배터리로 정비 패널이 희미하게 켜져 있다. 네 자리 번호. 패널 스티커: "정비 코드 = 제작일(월일)."',
      message: '정비 패널이 열린다. 마지막 기록: "23:58 모드 변경 · 순찰 → 차단 · 명령 SYSTEM. 차단 대상: 미등록 출입증 1명(17F 정수호). 최우선 방어 구역: B2 서버실. 대기 중 · 로비 전력이 돌아오면 기동."',
      surface: 'screen', look: 'lcd',
      writing: [{ as: 'title', text: '마지막 기록' }, '23:58 모드 변경 · 순찰 → 차단', { as: 'field', label: '명령', text: 'SYSTEM' },
        { as: 'field', label: '차단 대상', text: '미등록 출입증 1명(17F 정수호)' }, { as: 'field', label: '최우선 방어 구역', text: 'B2 서버실' },
        { as: 'rule' }, '대기 중 · 로비 전력이 돌아오면 기동.'],
      caption: '정비 패널이 열린다.',
      takenMessage: '정비 패널은 다시 꺼져 있다. 방금 읽은 줄이 떠오른다. 차단 대상 17F 정수호. 사각형 센서 헤드 아래 작은 카메라가 보인다.' },
    { name: '정문', x: 4610, y: 140, width: 320, style: 'revolving-door', lines: ['TMAXSOFT TOWER'], outline: [4618, 138, 352, 418], selfPowered: true, // 표시창은 배터리
      message: '회전문도 옆 자동문도 멈춰 있다. 유리 너머 거리의 가로등은 멀쩡히 켜져 있다. 문틀 위 작은 표시창만 배터리로 깜빡인다: "출입 통제 중 · SYSTEM."',
      surface: 'screen', look: 'lcd', writing: [{ text: '출입 통제 중 · SYSTEM.', size: 'large', align: 'center' }],
      caption: '회전문도 옆 자동문도 멈춰 있다. 유리 너머 거리의 가로등은 멀쩡히 켜져 있다. 문틀 위 작은 표시창만 배터리로 깜빡인다.' },
  ],
  props: [
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 240, x: 4080 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1300 },
    { file: 'reception-counter', size: [512, 256], worldWidth: 322, x: 3310 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3515 },
  ],
};
const FLOOR1_ROOMS = interiorRooms(1, [
  { id: 'f1-harmony', name: 'Harmony Hall', width: 3224, interiorStyle: 'stalls', exitOutline: [1220, 257, 265, 311],
    // 배경의 기존 문 그림을 문 좌우 공간 비율에 맞춰 함께 옮긴다. 빈 자리에는 같은 홀의 벽을 쓴다.
    exitArt: { x: 1215, crop: [1107, 130, 500, 440], fill: [600, 130] },
    backgroundImage: { src: 'assets/background/floor1/harmony-finished.png', height: 760, top: 0 },
    fixtures: [
      { name: '1층 객석', x: 120, y: 470, width: 650, style: 'stall-rows' },
      { name: '자동 연주 피아노', x: 2300, y: 430, width: 220, style: 'grand-piano',
        message: '자동 연주 피아노다. 보면대 스티커: "ARCHI 자동 반주 시범 · 제어 B2." 연주 기록: 낮 정기 연주회 박자 이탈 41회. 새벽 03:00 무관객 리허설 이탈 0회. 기록 맨 끝에 한 줄이 더 있다: "박수 · 3분 12초."',
        surface: 'document',
        writing: [{ as: 'title', text: '연주 기록' },
          { as: 'table', rows: [['낮 정기 연주회', '박자 이탈 41회'], ['새벽 03:00 무관객 리허설', '이탈 0회']] }, { as: 'rule' }, '박수 · 3분 12초.'],
        caption: '자동 연주 피아노다. 보면대 스티커: "ARCHI 자동 반주 시범 · 제어 B2." 기록 맨 끝에 한 줄이 더 있다.' },
    ],
    props: [
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 1540 },
      { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1960, name: '대관 일정표',
        message: '대관 일정표 맨 아래 줄: "매일 03:00~04:00 · 대관 SYSTEM · 무관객 리허설." 시설팀 메모: "새벽에 홀 문이 안에서 잠겨 있음. 2층 영사실 녹화도 같은 시간."',
        writing: [{ as: 'title', text: '대관 일정표' },
          { as: 'table', head: true, rows: [['일시', '신청', '내용'], ['\u00a0', '', ''], ['\u00a0', '', ''],
            ['매일 03:00~04:00', '대관 SYSTEM', '무관객 리허설']] },
          { as: 'note', title: '시설팀 메모', text: '새벽에 홀 문이\n안에서 잠겨 있음.\n2층 영사실 녹화도\n같은 시간.' }] },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3150 },
    ] },
  { id: 'f1-vision', name: 'Vision Hall', width: 2356, interiorStyle: 'exhibit', exitOutline: [226, 307, 135, 261],
    exitArt: { x: 205, crop: [45, 264, 368, 306], fill: [1230, 264] },
    backgroundImage: { src: 'assets/background/floor1/vision-finished.png', height: 760, top: 0 },
    fixtures: [
      { name: '기술 연혁 벽', x: 1680, y: 130, width: 520, height: 190, style: 'history-wall',
        lines: ['TMAXSOFT 기술 연혁', '1997 · 2003 · 2008 · 2015 · 2021', '올해 · ARCHI 사내 공개'] },
    ],
    props: [
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 110 },
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 850, name: '로봇 진열장',
        message: '맨 아래 칸이 비어 있고 명판만 남았다: "보안 로봇 R-01 · ARCHI 연동 시연용 시제품 · 제작 11월 7일." 옆 쪽지: "로비 경비로 전환 배치."',
        surface: 'label', look: 'plate', writing: ['보안 로봇 R-01', 'ARCHI 연동 시연용 시제품', '제작 11월 7일',
          { as: 'note', text: '로비 경비로 전환 배치.' }],
        caption: '맨 아래 칸이 비어 있고 명판만 남았다. 쪽지는 명판 옆에 붙어 있다.' },
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 1010 },
      { file: 'reception-counter', size: [512, 256], worldWidth: 322, x: 1400, name: '방명록대',
        message: '방명록 마지막 장. 낮 방문객 이름 아래, 새벽 03:14에 적힌 한 줄: "다시 왔습니다 · R-01." 사람 손글씨가 아니라 자로 잰 듯 반듯하다. 진열장 빈 칸 앞 바닥에는 바퀴 자국이 원을 그리고 있다.',
        surface: 'notebook',
        writing: [{ as: 'title', text: '방명록' }, { text: '03:14', size: 'small', tilt: 0 }, { text: '다시 왔습니다 · R-01.', tilt: 0 }],
        caption: '사람 손글씨가 아니라 자로 잰 듯 반듯하다. 진열장 빈 칸 앞 바닥에는 바퀴 자국이 원을 그리고 있다.' },
      { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 2280 },
    ] },
  { id: 'f1-clinic', name: '건강관리실', width: 1860, windowless: true, interiorStyle: 'ward', exitOutline: [852, 277, 155, 291],
    exitArt: { x: 865, crop: [824, 210, 214, 360], fill: [1230, 210] },
    backgroundImage: { src: 'assets/background/floor1/clinic-finished.png', height: 760, top: 0 },
    fixtures: [
      { name: '여성휴게실', x: 1570, y: 280, width: 145, height: 290, style: 'art-spot',
        message: '건강관리실 안쪽의 여성휴게실 문이다. 잠겨 있고 문틈도 캄캄하다. 수호는 손잡이에서 손을 거두고 돌아선다.' },
    ],
    props: [
      { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 200 },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 560, name: '간호사 책상',
        message: '야간 응급 대응 매뉴얼 개정본: "야간에 의식을 잃은 직원은 보안 로봇이 발견해 이송한다." 이송 위치의 "건강관리실"에 줄이 그어지고 "B2 · 인체 신호 연결 장비"라고 찍혀 있다. 개정한 사람 이름은 없다.',
        surface: 'document',
        writing: [{ as: 'title', text: '야간 응급 대응 매뉴얼 개정본' }, '야간에 의식을 잃은 직원은 보안 로봇이 발견해 이송한다.', { as: 'rule' },
          { text: '이송 위치', size: 'small' }, { as: 'strike', text: '건강관리실' }, { as: 'stamp', text: 'B2 · 인체 신호 연결 장비' }],
        caption: '개정한 사람 이름은 없다.' },
      { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 800, name: '장비 점검함',
        message: '보안 로봇 R-01 응급 이송 기능 점검표. "9월 14일 로비 배치 완료." 비고란 볼펜 글씨: "배치하면서 정비 코드를 배치일(월일 네 자리)로 바꿈. 로봇에 붙은 스티커는 예전 것."',
        surface: 'document',
        writing: [{ as: 'title', text: '보안 로봇 R-01 응급 이송 기능 점검표' }, '9월 14일 로비 배치 완료.', { as: 'rule' }, { text: '비고', size: 'small' },
          { as: 'hand', text: '배치하면서 정비 코드를\n배치일(월일 네 자리)로 바꿈.', ink: 'blue' },
          { as: 'hand', text: '로봇에 붙은 스티커는 예전 것.', ink: 'blue' }] },
      { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 1135 },
      { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1230 },
      { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 1360 },
    ] },
]);
