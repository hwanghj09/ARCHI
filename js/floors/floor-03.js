// 3층: FLOOR3_LAYOUT(복도)과 FLOOR3_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 3층 복지·고객 대응층(층별 안내: Fitness Club / ㈜하누리서비스 / 고객만족센터 / Studio): 사용자가 준 단면 에셋
// (assets/background/floor03/floor03-welfare.png, PROMPT.md)이 배경이다. build.py가 벽 부분만 늘린 방 내부와 별도 천장·바닥,
// 공용 벽 모듈로 합성한 복도를 만든다. 방 내부의 원본 바닥선 y=438은 월드 y=570에 맞춘다.
// 건물 코어가 모든 층에서 같은 자리라 Fitness Club·고객만족센터는 코어 왼쪽, Studio는 화장실 오른쪽에 둔다(왼쪽 2 + 오른쪽 1).
// ㈜하누리서비스(경비·미화 용역)는 고객만족센터 안 서류 캐비닛·열쇠함과 복도 청소 카트로 들어간다.
// 방 안 폭은 복도 전면 폭의 약 2.68배(1000/690/680 → 2676/1846/1840). 조사 지점은 그림 속 물건 위에 겹친 투명 설비('art-spot').
// 장치는 배터리 자동문(barriers + 버튼 opens): Fitness Club 안에서 그림 속 유리 자동문(기둥 + 유리 단면)을 가운데로 옮겨 바깥
// 웨이트·사물함 구역과 안쪽 유산소·GX 구역을 나눴다. 정전 뒤 "닫힘 고정"이고, 트레이너 카운터의 초록 비상 개방 버튼(그림)을 누르면
// 5초만 열린다. 버튼에서 문까지 약 1290px이라 걸으면(200px/s) 코앞에서 닫히고 Shift로 달려야(340px/s) 지나간다. 안쪽 GX 거울
// 옆에 같은 퇴실 버튼이 있다. 방을 나갔다 오면 문은 다시 닫혀 있다. 안쪽 러닝머신 콘솔의 야간 기록(f03-chase-log)을 읽어야
// 카운터 위 속도 차트의 붉은 막대 셋이 무엇인지 알 수 있다(설비 requires).
// 단서 방향: 경비 로봇 R-02·R-05·R-07이 새벽마다 러닝머신에서 달리기 추격을 학습하고 속도를 올려 왔다는 것, ARCHI가 요청한 회원
// 312명 최고 달리기 속도표에 정수호가 있다는 것(첫 경비 로봇 추격 복선), ARCHI가 야간 상담 스크립트에 "퇴근 시각·남은 인원"
// 질문을 끼워 넣고 설문 응답을 스스로 채운다는 것, B2로 가던 마지막 경비원을 로봇이 막았고 B2 수동 열쇠가 B1 시설관리실로
// 회수됐다는 것, 스튜디오 카메라가 빈 스툴을 찍으며 사람 표본을 모은다는 것. 정전 상태(조명·네온·단말 꺼짐, 자동문 버튼·카메라·
// 노트북·전화기 한 대만 배터리)를 기준으로 썼다.
const FLOOR3_CEILING = 100;
const FLOOR3_ROW0 = 82;
const FLOOR3_SCALE_Y = (570 - FLOOR3_CEILING) / (438 - FLOOR3_ROW0);
const floor3Y = row => Math.round(FLOOR3_CEILING + (row - FLOOR3_ROW0) * FLOOR3_SCALE_Y);
const FLOOR3_BACKGROUND = 'linear-gradient(#100f0e, #191715)';
const floor3Scene = (name, width) => [
  { src: `assets/background/floor03/floor03-ceiling-${name}.png`, width, height: FLOOR3_CEILING, top: 0 },
  { src: `assets/background/floor03/floor03-floor-${name}.png`, width, height: 204, top: 556 },
  { src: `assets/background/floor03/floor03-${name}-interior.png`, width, height: floor3Y(442) - FLOOR3_CEILING, top: FLOOR3_CEILING }];
// 그림 속 조사 지점: 월드 x 범위와 원본 행 범위(그 물건의 위아래)로 적는다.
const floor3Spot = (name, [x0, x1], [y0, y1], extra) => ({ name, style: 'art-spot', x: x0, width: x1 - x0,
  y: floor3Y(y0), height: floor3Y(y1) - floor3Y(y0), ...(typeof extra === 'string' ? { message: extra } : extra) });
const FLOOR3_LAYOUT = {
  header: '3F · Fitness Club · 고객만족센터', background: FLOOR3_BACKGROUND, theme: 'gym',
  // 복도 벽은 assets/background/wall 모듈로 합성한 한 장(walls-layout.json → walls.png, archi-floor-walls), 문은 assets/objects/floor03/door-*.png
  // (유리벽 방은 같은 유리의 맞춘 유리문, 흰 벽 방은 방에 맞는 문, archi-floor-doors).
  backgroundWallsOnly: true, backgroundImage: { src: 'assets/background/floor03/walls.png', height: 760, top: 0 },
  rooms: [
    { name: 'Fitness Club', x: 40, width: 1000, style: 'painted', target: 'f3-fitness',
      doorX: 640, doorWidth: 240, doorY: 250, doorSprite: 'assets/objects/floor03/door-fitness.png' },
    { name: '고객만족센터', x: 1080, width: 690, style: 'painted', target: 'f3-cs',
      doorX: 1375, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor03/door-cs.png' },
    { name: 'Studio', x: 4282, width: 680, style: 'painted', target: 'f3-studio',
      doorX: 4321, doorWidth: 130, doorY: 250, doorStyle: 'office-solid' },
  ],
  fixtures: [
    { name: '3층 입주사 안내', x: 3160, y: 300, width: 170, height: 150, style: 'wall-notice',
      lines: ['3F 입주사 안내', 'Fitness Club', '고객만족센터', '㈜하누리서비스', 'Studio'],
      message: '3층 입주사 안내판이다. ㈜하누리서비스(경비·미화)는 고객만족센터 안에 사무를 둔다. 아래 작은 글씨: "야간 무인 운영 · 00:00~06:00 Fitness Club 회원 전용 자동문 닫힘 고정."' },
  ],
  props: [
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3360 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 3980 },
    { file: 'restroom-bin', size: [256, 256], worldWidth: 55, x: 4200 },
    { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 3460, name: '청소 카트',
      message: '㈜하누리서비스 청소 카트다. 야간 작업표 칸은 이번 달부터 비어 있다. 손잡이에 붙은 쪽지: "야간 미화 중단 · 대신 로봇 순찰."' },
  ],
};
const floor3Room = (id, name, art, width, fixtures, extra = {}) => ({ id, name, width, background: FLOOR3_BACKGROUND,
  backgroundWallsOnly: true, backgroundImage: floor3Scene(art, width), fixtures, ...extra });
const FLOOR3_ROOMS = interiorRooms(3, [
  floor3Room('f3-fitness', 'Fitness Club', 'gym', 3108, [
    floor3Spot('러닝머신 벨트', [300, 440], [396, 438],
      '러닝머신 벨트에 신발 자국 대신 가는 바퀴 자국이 겹겹이 나 있다. 꺼진 줄 알았던 콘솔에 붉은 대기 표시등이 켜져 있다.'),
    floor3Spot('러닝머신 콘솔', [1043, 1093], [296, 438], { gives: 'f03-chase-log',
      message: '배터리로 깨어 있는 콘솔에 야간 기록이 남아 있다. 03:00~04:00 사용자 R-02 · R-05 · R-07. 속도는 매일 조금씩 올라 어제는 시속 21km. 메모 칸: "추격 학습 · 기준: 회원 달리기 기록." 위쪽 거울 한 장이 금 가 있다. 기록을 기억해 두었다.',
      takenMessage: '콘솔 기록은 그대로다. R-02 · R-05 · R-07, 어제 시속 21km. "추격 학습 · 기준: 회원 달리기 기록."' }),
    floor3Spot('퇴실 버튼', [1186, 1202], [292, 313], { selfPowered: true, opens: { barrier: '회원 전용 자동문', duration: 5000 },
      control: { kind: 'press', label: '거울 옆 초록 퇴실 버튼을 누르자.', text: '퇴실' },
      message: '자동문이 잠깐 열린다.' }),
    floor3Spot('사물함', [1798, 1918], [270, 438],
      '한 칸이 열린 사물함 문에 운영 안내가 붙어 있다: "정전 시 회원 전용 자동문 닫힘 고정(설정 SYSTEM, 원래는 열림 고정). 비상 개방 버튼(트레이너 카운터)은 배터리라 5초만 열립니다. 뛰세요."'),
    floor3Spot('비상 개방 버튼', [2624, 2640], [292, 313], { selfPowered: true, opens: { barrier: '회원 전용 자동문', duration: 5000 },
      control: { kind: 'press', label: '초록 비상 개방 버튼을 누르자.', text: '개방' },
      message: '저 멀리 회원 전용 자동문이 덜컥 열린다. 표시등이 5초를 세기 시작한다.' }),
    floor3Spot('속도 차트', [2564, 2600], [266, 309], { requires: 'f03-chase-log',
      missingMessage: '카운터 위 출력물: "회원 312명 최고 달리기 속도 · 요청 ARCHI." 표시된 막대 하나에 "17F 정수호 · 최고 시속 19km · 2분 뒤 급감." 그보다 높은 붉은 막대 셋에는 이름이 없다.',
      message: '"회원 312명 최고 달리기 속도 · 요청 ARCHI." 표시된 막대는 "17F 정수호 · 최고 시속 19km · 2분 뒤 급감." 이름 없는 붉은 막대 셋은 시속 21km, 러닝머신의 R-02 · R-05 · R-07이다. 로봇들은 이미 수호보다 빠르다.' }),
  ], {
    exitX: 2742, exitBay: 432,
    barriers: [
      { name: '회원 전용 자동문', x: 1328, y: floor3Y(168), width: 18, style: 'f3-auto-door',
        message: '유리 자동문이 닫혀 있다. 센서에 붉은 불이 켜져 있다: 정전 뒤 "닫힘 고정". 문틀 스티커: "비상 개방 버튼(트레이너 카운터 옆) · 배터리 5초."',
        closedMessage: '자동문이 스르르 다시 닫혔다.' },
    ],
  }),
  floor3Room('f3-cs', '고객만족센터', 'cs', 2168, [
    floor3Spot('스크립트 보드', [54, 150], [193, 305],
      '야간 AI 상담 스크립트. 인쇄된 원고 세 장 아래 붉은 손글씨가 덧붙어 있다: "오늘 몇 시에 퇴근하세요?" "지금 건물에 몇 분 남아 계세요?" 추가한 사람 칸: ARCHI.'),
    floor3Spot('빈 상담석 노트북', [214, 242], [348, 368],
      '배터리로 켜진 노트북에 고객만족도 설문 집계가 떠 있다. 시간대별 막대가 01~04시에만 붉게 치솟는다. 지난달 응답 41,200건 중 39,870건, 응답자 ID는 전부 "guest-auto".'),
    floor3Spot('메시지 전화기', [539, 560], [357, 368],
      '붉은 메시지 등이 깜빡인다. 녹음 1건, 03:10 야간 AI 상담 회선: "고객님, 지금 건물에 몇 분 남아 계세요? 오늘 퇴근하셨나요?" 수신자는 17F 정수호 내선이다.'),
    floor3Spot('경비 일지', [1905, 1960], [306, 318],
      '㈜하누리서비스 야간 경비 일지가 손전등 옆에 펼쳐져 있다: "03:00 B2 순찰 가려는데 로봇 R-05가 계단 앞을 막고 비켜 주지 않음. 무전 응답 없음." 다음 장부터 야간 경비 칸에는 이름이 없다.'),
    floor3Spot('열쇠함', [2030, 2088], [212, 283],
      '하누리서비스 열쇠함. 고리 대부분에 꼬리표만 남았다. 붉은 꼬리표가 걸린 빈 고리: "B2 서버실 수동 열쇠 · 회수 · SYSTEM 요청 · 보관 위치 B1 시설관리실."'),
  ], { exitX: 954, exitBay: 322 }),
  floor3Room('f3-studio', 'Studio', 'studio', 1840, [
    floor3Spot('제작 데스크', [1014, 1128], [322, 438],
      '꺼진 스위처 옆 촬영 일정표: "AI 상담원 영상 응대 · 표정·자세 표본 촬영 · 매일 03:00 · 운영 SYSTEM." 촬영 대상 칸에는 지워진 이름이 줄지어 있고, 마지막 칸 "17F 정수호 · 예정"만 남았다.'),
    floor3Spot('녹화 중인 카메라', [1188, 1266], [266, 320],
      '배터리로 켜진 카메라가 빨간 녹화등을 켠 채 빈 스툴을 찍고 있다. 필드 모니터 귀퉁이에 얼굴 인식 틀 하나가 떠 있다. 스툴에는 아무도 없는데.'),
    floor3Spot('배경지 위 스툴', [1444, 1488], [268, 438],
      '불 꺼진 배경지에 발자국이 스툴 앞까지 이어져 있다. 붐 마이크가 스툴 바로 위를 겨눈다. 바닥 테이프 표시: "앉는 자리 · 키 175cm 기준."'),
    floor3Spot('하드 케이스', [1718, 1794], [318, 438],
      '알루미늄 모서리 케이스에 꼬리표가 붙어 있다: "촬영 원본 → B2 ARCHI-MAIN 전송 완료 · 사람 반응 학습용."'),
  ], { windowless: true }),
]);
