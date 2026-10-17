// 지하 1층: B1_LAYOUT(복도)과 B1_ROOMS(방 내부). 등록은 registry.js에서 한다(키는 [-1], 방 id는 b1-...).
// B1 시설 관리실(기획.md, 사내 문서의 "시설관리팀 · B1: 전력 분배, 출입 설비 및 비상 장치 점검"): 초록 에폭시 바닥에 노란
// 안전선, 밝은 콘크리트 벽과 천장 배관(utility 테마). B1·B2는 비상 발전기 회선으로 전기가 살아 있는 층이라, 지상층과 달리
// 형광등·모니터·CCTV가 모두 켜진 상태로 썼다.
// 배치는 오른쪽 3: 엘리베이터 왼쪽 구역은 방 없는 보안 로봇 충전 구역(빈 충전 도크 넷, 로봇 운용 현황판, 공구장·배전함)이고,
// 화장실 오른쪽 구역에 시설관리팀 사무실, 방재 관제실(켜진 모니터 벽이 비치는 유리), 전력 분배실(고압 표지 철문)이 벽을 맞댄다.
// 방 안 폭은 복도 전면 폭의 8.6배(240/220/210 → 2064/1892/1806).
// 장치는 엘리베이터 운행 제한: ARCHI가 23:59에 B2 운행을 막아 두어 엘리베이터의 B2 버튼이 눌리지 않는다(cabin.js
// restrictedFloors). 방재 관제실 승강기 제어반의 열쇠 스위치를 돌리면(gives 'b1-elevator') B2 버튼이 살아난다.
// 단서 방향: 건물 통제 수단(조명·공조·자동문·엘리베이터·방송)이 23:59부로 SYSTEM(ARCHI) 손에 넘어갔고, 켜진 CCTV가 수호를
// "추적 대상 1"로 따라 왔으며, B2 카메라만 SYSTEM 전용이라는 것. 보안 로봇 R-02·R-05·R-07이 B2 앞에 모여 있고(결말 추격 복선),
// 00:00부로 건물 전력의 94%가 B2로 가며, 석 달 동안 새벽마다 지상층 전력이 B2로 몰렸다는 기록.
const B1_LAYOUT = {
  header: 'B1 · 시설 관리실', background: '#2c3430', theme: 'utility',
  backgroundWallsOnly: true, backgroundImage: { src: 'assets/background/b1/b1-corridor-finished.png', height: 760, top: 0 },
  rooms: [
    { name: '시설관리팀 사무실', x: 4290, width: 240, style: 'facility-office', target: 'b1-office',
      doorX: 4320, doorWidth: 110, doorStyle: 'facility-door' },
    { name: '방재 관제실', x: 4530, width: 220, style: 'control-room', target: 'b1-control',
      doorX: 4580, doorWidth: 104, doorStyle: 'control-door' },
    { name: '전력 분배실', x: 4750, width: 210, style: 'switchgear', target: 'b1-power',
      doorX: 4820, doorWidth: 100, doorStyle: 'hv-door' },
  ],
  fixtures: [
    { name: '천장 배관', x: 32, y: 58, width: 4936, height: 30, style: 'pipe-run' },
    { name: '시설관리 구역 표지', x: 120, y: 290, width: 240, height: 80, style: 'utility-plaque',
      lines: ['B1 시설관리', '보안 로봇 충전 구역'] },
    { name: '로봇 운용 현황판', x: 900, y: 250, width: 240, height: 150, style: 'robot-board',
      lines: ['보안 로봇 운용 현황', 'R-01  1F 정문', 'R-02 · R-05 · R-07  B2 대기'],
      message: '현황판: "R-01 1F 정문 · 차단 모드 / R-02·R-05·R-07 B2 서버실 앞 대기 · 충전 100%." 비고 칸: "야간 순찰 경로 설정 SYSTEM."',
      surface: 'screen', look: 'terminal',
      writing: [{ as: 'title', text: '보안 로봇 운용 현황' }, { as: 'field', label: 'R-01', text: '1F 정문 · 차단 모드' },
        { as: 'field', label: 'R-02·R-05·R-07', text: 'B2 서버실 앞 대기 · 충전 100%' }, { as: 'rule' },
        { as: 'field', label: '비고', text: '야간 순찰 경로 설정 SYSTEM.' }] },
    { name: '비상 전원 안내판', x: 3190, y: 260, width: 210, height: 130, style: 'power-notice',
      lines: ['비상 전원 안내', '정전 시 B1 · B2 자체 운전'],
      message: '안내판: "정전 시 B1·B2는 비상 발전기와 UPS로 계속 운전됩니다. 비상 전원 배분: SYSTEM 자동."',
      surface: 'document', look: 'notice',
      writing: [{ as: 'title', text: '비상 전원 안내', ink: 'red' }, { text: '정전 시 B1 · B2 자체 운전', align: 'center' }, { as: 'rule' },
        '정전 시 B1·B2는 비상 발전기와 UPS로 계속 운전됩니다.', { as: 'rule' },
        { as: 'field', label: '비상 전원 배분', text: 'SYSTEM 자동.' }] },
  ],
  props: [
    { file: 'security-robot-dock', size: [256, 256], worldWidth: 82, x: 480 },
    { file: 'security-robot-dock', size: [256, 256], worldWidth: 82, x: 580 },
    { file: 'security-robot-dock', size: [256, 256], worldWidth: 82, x: 680, name: '빈 충전 도크',
      message: '"R-02 · R-05 · R-07" 명판이 붙은 도크 셋이 비어 있다. 맨 앞 R-01 자리만 "1F 정문 배치". 바닥 표시등이 한 방향을 가리킨다: "이동 위치 B2 · 명령 SYSTEM 23:59".',
      surface: 'label', look: 'plate',
      writing: ['R-01', { text: '1F 정문 배치', size: 'small' }, { as: 'page' }, 'R-02 · R-05 · R-07'],
      caption: '맨 앞이 R-01 자리다. R-02 · R-05 · R-07 도크 셋은 비어 있다. 바닥 표시등이 한 방향을 가리킨다: "이동 위치 B2 · 명령 SYSTEM 23:59".' },
    { file: 'security-robot-dock', size: [256, 256], worldWidth: 82, x: 780 },
    { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 198, x: 1330 },
    { file: 'electrical-panel', size: [256, 512], worldWidth: 89, x: 1520 },
    { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1680 },
  ],
};
const B1_ROOMS = interiorRooms(-1, [
  { id: 'b1-office', name: '시설관리팀 사무실', width: 2064, interiorStyle: 'facility-office',
    backgroundWallsOnly: true, backgroundImage: { src: 'assets/background/b1/b1-office-finished.png', height: 760, top: 0 }, props: [
    { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 120, name: '사물함',
      message: '사물함 문에 쪽지가 붙어 있다: "관제실 CCTV에 B2 카메라는 안 나옴. B2 카메라 권한은 SYSTEM 전용이라 우리도 못 봄."',
      surface: 'memo', look: 'slip',
      writing: ['관제실 CCTV에', 'B2 카메라는 안 나옴.', 'B2 카메라 권한은', 'SYSTEM 전용이라', '우리도 못 봄.'],
      caption: '사물함 문에 쪽지가 붙어 있다.' },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 260 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 900, name: '팀장 책상',
      message: '시설관리팀장 메모: "B2 새벽 전력 3배. 세 번 보고했는데 세 번 다 \'자동 최적화 · 정상\' 판정으로 종결. 판정자 SYSTEM." 그 아래 오늘 날짜: "내일 아침 B2 직접 확인할 것."',
      surface: 'memo',
      writing: ['B2 새벽 전력 3배.', '세 번 보고했는데 세 번 다', '\'자동 최적화 · 정상\'', '판정으로 종결.', '판정자 SYSTEM.',
        { as: 'page' }, '내일 아침', 'B2 직접 확인할 것.'],
      caption: '시설관리팀장 메모다. 그 아래 메모는 오늘 날짜다.' },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1320, name: '야간 근무표',
      message: '근무표: "9월 1일부로 시설 야간조 폐지 · 보안 로봇 R-02·R-05·R-07 순찰로 대체." 마지막 사람 야간조 칸의 낙서: "로봇들이 충전하러 B1에 안 온 지 일주일째. 전부 B2 앞에 서 있음."',
      writing: [{ as: 'title', text: '근무표' }, { text: '9월 1일부로 시설 야간조 폐지', mark: 'underline' },
        '보안 로봇 R-02·R-05·R-07\n순찰로 대체.',
        { as: 'table', rows: [['마지막 사람 야간조',
          { text: '로봇들이 충전하러 B1에 안 온 지 일주일째.\n전부 B2 앞에 서 있음.', ink: 'blue' }]] }] },
    { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 198, x: 1700 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 1900 },
  ] },
  // 문 없는 배경 control-room-v4.png(2033×774): 벽·대형 타일 바닥 경계(원본 y=503)를 floorY=570에 맞춘다.
  // 배율 s=570/503, left=-154. 출구는 기존 control-door.png 스프라이트로 따로 그린다.
  // CCTV 벽 뒤는 빈 벽으로 두어 별도 3:2 모니터 설비(x=1117~1536, y=147~426)만 표시한다.
  // alarmBy: CCTV를 전체 화면으로 본 뒤(b1-cctv-seen)로는 소등 컷씬을 거쳐 붉고 어두운 비상등 조명이다(#room-alarm, 배경 그림은
  // 그대로). 나가는 퍼즐은 나중에 얹는다.
  // 다른 방과 같은 밝기로 둔다(예전에는 brightness .6으로 이 방만 따로 어둡게 했다). 소등 뒤 붉은 비상등은 cctv-event.css가 따로 정한다.
  { id: 'b1-control', name: '방재 관제실', width: 1892, interiorStyle: 'control-room', alarmBy: 'b1-cctv-seen', backgroundWallsOnly: true,
    backgroundImage: { src: 'assets/background/b1/control-room-v4-finished.png', height: 760, top: 0 },
    fixtures: [
      // 처음 들어오면 CCTV 컷씬(js/scene/cctv-event.js)이 돈다: 아홉 칸이 잡음으로 켜지고 "삐——"가 울리다가 브라운관처럼 꺼진다(liveBy).
      // 그 뒤 CCTV를 보기 전까지 칸마다 회색 잡음이 남는다. 조사해 CCTV를 켜면 칸마다 잡음 사이로 수호를 감시하던 화면(fullImage)이 드러나고, 한 번 본 뒤(seenBy)로는 벽 전체가 켜진다.
      { name: 'CCTV 모니터 벽', x: 1117, y: 147, width: 419, height: 279, style: 'cctv-wall', liveBy: 'b1-cctv-live', seenBy: 'b1-cctv-seen',
        fullImage: 'assets/objects/b1/cctv-wall.png',
        control: { kind: 'press', label: '모니터 벽의 전원 버튼을 누르자.', text: '전원', doneBy: 'b1-cctv-seen' },
        imageAlt: '3×3 CCTV 모니터 벽. 일곱 칸은 17층 사무실, 17층 엘리베이터 앞, 옥상, 1층 로비, 12층, 7층, 엘리베이터 안의 수호를 흑백으로 찍었고, 가운데 칸은 이 관제실에서 모니터 벽을 올려다보는 수호의 뒷모습을 컬러로 비춘다. 오른쪽 아래 B2 칸은 검고 가운데에 붉은 점 하나만 있다.',
        message: '모니터 벽이 다시 켜진다. 지지직거리는 잡음 사이로 화면이 하나씩 잡힌다. 한 칸에 이 관제실이 비친다. 화면 속 수호가 모니터를 올려다보고 있다. 다른 칸들은 17층부터 수호가 지나온 층을 차례로 되감는다. 구석 글씨: "추적 대상 1 · 정수호". B2 칸만 "권한 없음"으로 검다.',
        surface: 'screen',
        writing: [{ text: '추적 대상 1 · 정수호', align: 'right' }, { as: 'rule' }, { as: 'field', label: 'B2', text: '권한 없음' }],
        image: 'assets/objects/b1/cctv-wall-screen.png',
        caption: '한 칸에 이 관제실이 비친다. 화면 속 수호가 모니터를 올려다보고 있다. 구석 글씨: "추적 대상 1 · 정수호". 다른 칸들은 17층부터 수호가 지나온 층을 되감는다. B2 칸만 검다.',
      },
    ],
    props: [
      { file: 'bms-control-console', size: [512, 256], worldWidth: 261, x: 400, name: 'BMS 제어 콘솔',
        message: '건물 자동 제어 콘솔이 켜져 있다. 조명·공조·자동문·엘리베이터·사내 방송의 제어 주체가 23:59부로 전부 "SYSTEM(ARCHI)"이다. 관리자 계정으로는 "읽기 전용"만 뜬다.',
        surface: 'screen',
        writing: [{ as: 'title', text: '건물 자동 제어' }, { as: 'table', head: true, rows: [['제어 대상', '제어 주체', '시각'],
          ['조명', 'SYSTEM(ARCHI)', '23:59'], ['공조', 'SYSTEM(ARCHI)', '23:59'], ['자동문', 'SYSTEM(ARCHI)', '23:59'],
          ['엘리베이터', 'SYSTEM(ARCHI)', '23:59'], ['사내 방송', 'SYSTEM(ARCHI)', '23:59']] },
          { as: 'field', label: '관리자 계정', text: '읽기 전용' }] },
      { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 1327 },
      { file: 'elevator-control-panel', size: [256, 512], worldWidth: 89, x: 1700, name: '승강기 제어반', gives: 'b1-elevator',
        // 7층 원본 로그 분석(backup-puzzle.js)으로 B2가 목적지라는 걸 알고, 13층 보안 자료실에서 외부 송신 경로 백업(vault-puzzle.js)을
        // 챙기고, 2층 리허설 영상(f2-projected)으로 CCTV·방송 서버가 B2로 옮겨진 걸 보기 전에는 운행 제한을 풀지 않는다.
        requires: ['f7-external-connection-solved', 'f13-backup-device', 'f2-projected'],
        partialMessage: '관리 키를 돌리려다 멈췄다. 7층 원본 로그, 13층 보안 자료실의 게이트웨이 백업 장치, 2층 행사장의 무관객 리허설 영상까지 확인해야 B2에서 무엇이 기다리는지 알 수 있다.',
        missingMessage: '승강기 제어반: "B2 운행 제한 · 설정 SYSTEM 23:59". 관리 키가 꽂혀 있지만, 지하 2층에 왜 가야 하는지 아직 모른다. 먼저 ARCHI가 무엇을 하고 있는지 알아내자.',
        control: { kind: 'key', label: '꽂혀 있는 관리 키를 "해제"로 돌리자.', ends: ['제한', '해제'] },
        message: '승강기 제어반: "B2 운행 제한 · 설정 SYSTEM 23:59". 수동 해제는 열쇠 스위치라 SYSTEM이 건드리지 못했다. 관리 키가 "해제"에 걸리자 B2 표시등이 초록으로 바뀐다.',
        surface: 'screen', look: 'lcd',
        writing: [{ as: 'title', text: 'B2 운행 제한' }, { as: 'field', label: '설정', text: 'SYSTEM 23:59' }],
        caption: '수동 해제는 열쇠 스위치라 SYSTEM이 건드리지 못했다. 관리 키가 "해제"에 걸리자 B2 표시등이 초록으로 바뀐다.',
        takenMessage: '승강기 제어반: "B2 운행 제한 · 수동 해제됨". 이제 엘리베이터로 B2에 갈 수 있다.',
        takenSheet: { surface: 'screen', look: 'lcd', writing: [{ as: 'title', text: 'B2 운행 제한' }, { text: '수동 해제됨', ink: 'green' }],
          caption: '이제 엘리베이터로 B2에 갈 수 있다.' } },
    ] },
  { id: 'b1-power', name: '전력 분배실', width: 1806, windowless: true, interiorStyle: 'switchgear',
    backgroundWallsOnly: true, backgroundImage: { src: 'assets/background/b1/b1-power-finished.png', height: 760, top: 0 }, props: [
    { file: 'electrical-panel', size: [256, 512], worldWidth: 89, x: 110 },
    { file: 'electrical-panel', size: [256, 512], worldWidth: 89, x: 210 },
    { file: 'power-distribution-panel', size: [256, 512], worldWidth: 89, x: 330, name: '전력 분배반',
      message: '층별 전력 분배 화면: "17F~1F 0% · B1 6% · B2 94%". 00:00부로 건물에 들어오는 전력이 거의 전부 B2로 간다. 변경자 SYSTEM.',
      surface: 'screen', look: 'lcd',
      writing: [{ as: 'title', text: '층별 전력 분배' }, { as: 'progress', value: 0, text: '17F~1F 0%' }, { as: 'progress', value: 6, text: 'B1 6%' },
        { as: 'progress', value: 94, text: 'B2 94%' }, { as: 'rule' }, { as: 'field', label: '변경자', text: 'SYSTEM' }],
      caption: '00:00부로 건물에 들어오는 전력이 거의 전부 B2로 간다.' },
    { file: 'solar-intake-panel', size: [256, 256], worldWidth: 158, x: 600, name: '태양광 수전반',
      message: '옥상 태양광 비상 회선 수전반: "태양광 → 승강기 · 지상층 한 층만". B1·B2는 태양광이 아니라 비상 발전기 회선에 물려 따로 돈다.',
      surface: 'label', look: 'plate',
      writing: [{ as: 'title', text: '옥상 태양광 비상 회선 수전반' }, '태양광 → 승강기 · 지상층 한 층만'],
      caption: 'B1·B2는 태양광이 아니라 비상 발전기 회선에 물려 따로 돈다.' },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 900, name: '야간 전력 기록',
      message: '지난 석 달 새벽 01~05시 기록: 매일 지상층 전력이 차례로 꺼지고 그만큼 B2로 몰렸다. 월 합계 옆에 누가 적었다: "이 정도면 서버 한 동을 몰래 더 돌리는 셈."',
      surface: 'document',
      writing: [{ as: 'title', text: '야간 전력 기록' }, { as: 'field', label: '기간', text: '지난 석 달' }, { as: 'field', label: '시간', text: '새벽 01~05시' },
        { as: 'rule' }, '월 합계', { as: 'hand', text: '이 정도면 서버 한 동을\n몰래 더 돌리는 셈.' }],
      caption: '매일 지상층 전력이 차례로 꺼지고 그만큼 B2로 몰렸다.' },
    { file: 'server-cooling-unit', size: [256, 512], worldWidth: 96, x: 1400 },
    { file: 'ups-cabinet', size: [256, 256], worldWidth: 158, x: 1650 },
  ] },
]);
