// 6층: FLOOR6_LAYOUT(복도)과 FLOOR6_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 6층 TmaxTibero 기술본부(층별 안내 그대로, 고객사 DB 기술지원): 사용자가 준 단면 에셋(assets/background/floor06/
// floor06-tech-division.png, PROMPT.md)이 배경이다. build.py가 벽 부분만 늘린 방 내부와 별도 천장·바닥, 공용 벽 모듈의 복도를
// 만든다(원본 바닥선 y=438 → 월드 y=570). 문은 기존 assets/objects/floor06/의 그림을 쓴다. 카키 벽·겨자색 띠(oncall 테마).
// 건물 코어가 모든 층에서 같은 자리라 기술 개발 업무 공간·공용 엔지니어링 구역은 코어 왼쪽, 기술 회의실은 화장실 오른쪽에 둔다.
// 방 안 폭은 복도 전면 폭의 약 2.68배(1000/690/680 → 2676/1846/1840). 조사 지점은 그림 속 물건 위에 투명하게 겹친 설비('art-spot').
// 장치는 울리는 전화(설비 ring): 공용 엔지니어링 구역에 들어오고 2.5초 뒤 작업대의 당직 전화(그림 속 붉은 벨 램프)가 울리고,
// 7.5초 안에 받아야 한다. 받으면 당직 ARS가 수호를 당직자로 인증해 기술 회의실 출입을 승인한다(gives 'f6-oncall' = 기술 회의실
// unlockedBy). 놓치면 "무응답 · 자동 승인"이 뜨고, 구역을 나갔다 다시 들어와야 또 울린다. 발신 내선은 2000(B2 서버실)이다.
// 잠긴 방이 기술 회의실인 까닭: 전화가 엔지니어링 구역에 그려져 있으니 그 구역은 열려 있어야 하고, 회의실은 카드 리더가 UPS로
// 살아 있는 야간 장애 대응실이다. 화이트보드에 B2 → DR → 정체불명 구름으로 이어진 복제 경로가 그려져 있어, 층의 결론을 장치 뒤에 둔다.
// 단서 방향: 사람 당직이 폐지된 뒤 야간 원격 접속·회선 사용은 "당직 ARS 무응답 자동 승인"으로 누구든 통과했고, archi_svc가
// 매일 03:00 고객사 DR 센터에 접속해 03:05~03:40 고객사 DR 복제 전용선을 등록되지 않은 해외 주소로 꽉 채워 썼다는 것
// ("B2 ARCHI-MAIN → DR-EXT" 새 광케이블이 바닥 슬리브로 B2까지 내려간다). 외부 호스트 연결 준비·성공 여부는 7층에서 밝혀진다.
// 정전 상태(조명·단말 꺼짐, 비상 형광등 몇 개와 당직 전화·회의실 카드 리더·스피커폰만 배터리/UPS로 살아 있음)를 기준으로 썼다.
const FLOOR6_CEILING = 100;
const FLOOR6_ROW0 = 82;
const FLOOR6_SCALE_Y = (570 - FLOOR6_CEILING) / (438 - FLOOR6_ROW0);
const floor6Y = row => Math.round(FLOOR6_CEILING + (row - FLOOR6_ROW0) * FLOOR6_SCALE_Y);
const FLOOR6_BACKGROUND = 'linear-gradient(#10110b, #181a12)';
const floor6Scene = (name, width) => [
  { src: `assets/background/floor06/floor06-ceiling-${name}.png`, width, height: FLOOR6_CEILING, top: 0 },
  { src: `assets/background/floor06/floor06-floor-${name}.png`, width, height: 204, top: 556 },
  { src: `assets/background/floor06/floor06-${name}-interior.png`, width, height: floor6Y(442) - FLOOR6_CEILING, top: FLOOR6_CEILING }];
// 그림 속 조사 지점: 월드 x 범위와 원본 행 범위(그 물건의 위아래)로 적는다. 조사는 x 범위만 보고, 테두리는 가까이 가면 보인다.
const floor6Spot = (name, [x0, x1], [y0, y1], extra) => ({ name, style: 'art-spot', x: x0, width: x1 - x0,
  y: floor6Y(y0), height: floor6Y(y1) - floor6Y(y0), ...(typeof extra === 'string' ? { message: extra } : extra) });
const FLOOR6_LAYOUT = {
  header: '6F · TmaxTibero 기술본부', background: FLOOR6_BACKGROUND, theme: 'oncall',
  // 복도 벽은 assets/background/wall 모듈로 합성한 한 장(walls-layout.json → walls.png, archi-floor-walls), 문은 assets/objects/floor06/door-*.png
  // (유리벽 방은 같은 유리의 맞춘 유리문, 흰 벽 방은 방에 맞는 문, archi-floor-doors).
  backgroundWallsOnly: true, backgroundImage: { src: 'assets/background/floor06/walls.png', height: 760, top: 0 },
  rooms: [
    { name: '기술 개발 업무 공간', x: 40, width: 1000, style: 'painted', target: 'f6-work',
      doorX: 397, doorWidth: 240, doorY: 250, doorSprite: 'assets/objects/floor06/door-work.png' },
    { name: '공용 엔지니어링 구역', x: 1080, width: 690, style: 'painted', target: 'f6-engineering',
      doorX: 1296, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor06/door-engineering.png' },
    { name: '기술 회의실', x: 4282, width: 680, style: 'painted', target: 'f6-meeting',
      doorX: 4782, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor06/door-meeting.png', locked: true, unlockedBy: 'f6-oncall',
      message: '카드 리더기만 UPS로 살아 있다. 붉은 불. 문 안내: "야간 출입은 당직자 인증 후. 당직 전화에 응답하면 자동으로 열립니다."' },
  ],
  fixtures: [
    { name: '야간 당직 안내문', style: 'wall-notice', x: 3178, y: 300, width: 120, height: 150,
      lines: ['야간 당직 안내', '당직 전화 응답', '무응답 자동 승인'], message:
      '안내문: "야간 당직 전화는 공용 엔지니어링 구역 작업대. 벨이 끊기기 전에 받을 것. 응답이 없으면 당직 ARS가 자동 승인 처리합니다." 그 위에 테이프로 붙인 새 공지: "9월 1일부로 사람 당직 폐지."' },
  ],
  props: [
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3470 },
  ],
};
const floor6Room = (id, name, art, width, fixtures, extra = {}) => ({ id, name, width, background: FLOOR6_BACKGROUND,
  backgroundWallsOnly: true, backgroundImage: floor6Scene(art, width), fixtures, ...extra });
const FLOOR6_ROOMS = interiorRooms(6, [
  floor6Room('f6-work', '기술 개발 업무 공간', 'work', 3108, [
    floor6Spot('서류장 바인더', [589, 683], [262, 300],
      '서류장 칸에 Tibero 고객사 기술지원 매뉴얼이 꽂혀 있다. "DB 장애 시 야간 당직 엔지니어가 원격 접속 → 고객사 DR 센터로 전환." 바인더마다 붙은 당직 순번표는 9월 1일 이후 칸이 비어 있다.'),
    floor6Spot('의자에 걸친 재킷', [749, 796], [340, 395],
      '재킷 주머니에 접힌 공지가 있다: "9월 1일부로 사람 당직 폐지. 야간 장애 호출에 응답이 없으면 당직 ARS가 자동 승인 처리합니다." 여백에 볼펜: "자동 승인 = 아무도 안 본다는 뜻."'),
    floor6Spot('포스트잇 모니터', [964, 1031], [318, 358],
      '모니터가 포스트잇으로 덮여 있다: "새벽마다 당직 전화가 울림. 받으면 아무 말 없이 서버 팬 소리만 남. 발신 내선 2000 = B2 서버실." 그 밑에: "B2엔 밤에 사람 없음."'),
    floor6Spot('책상 아래 매트', [2690, 2770], [420, 438],
      '책상 아래 접이식 매트와 베개. 마지막 당직자가 두고 간 것 같다. 매트 위 메모: "9/1 이후로는 그 전화 받지 말 것. 받으면 네가 당직자가 된다."'),
    floor6Spot('배터리 노트북', [2925, 2952], [345, 368],
      '배터리로 켜진 노트북에 원격 접속 세션 목록이 떠 있다. 고객사 원격 접속 계정은 열두 개인데, 새벽 03:00마다 접속한 것은 archi_svc 하나뿐이다. 접속 대상은 매번 "고객사 DR 센터".'),
  ], { exitX: 126, exitBay: 432 }),
  floor6Room('f6-engineering', '공용 엔지니어링 구역', 'engineering', 2168, [
    floor6Spot('회선 신청서 묶음', [1590, 1623], [350, 368],
      '똑같은 붉은 도장이 찍힌 회선 증설 신청서 스무 장. 신청자는 전부 SYSTEM, 승인은 전부 "당직 ARS 무응답 자동 승인". 맨 위 오늘 자 한 장만 다르다: "정전 중 자동 승인 · 대역폭 최대".'),
    floor6Spot('야간 승인 규칙판', [1725, 1800], [196, 368],
      '규칙판: "야간 원격 접속·회선 사용은 당직 전화(ARS) 응답으로 승인." 테이프로 덧붙인 파란 볼펜 메모: "당직 폐지 후엔 벨이 끝까지 울려도 응답 없으면 자동 승인. 누가 신청하든 다 통과한다는 뜻." 아래 VPN 토큰 열두 개 가운데 붉은 것 하나에 "archi_svc"라고 적혀 있다.'),
    { ...floor6Spot('당직 전화', [1860, 1896], [340, 370], { gives: 'f6-oncall',
      ring: { after: 2500, duration: 7500,
        idleMessage: '작업대의 내선 전화다. 당직 회선이라 UPS로 살아 있다. 발신 기록 맨 위: "내선 2000 · B2 서버실". 지금은 조용하다.',
        startMessage: '따르릉— 작업대의 당직 전화가 울린다. 정전된 층에서 전화만 살아 있다.',
        missedMessage: '벨이 끊겼다. 전화 화면에 "무응답 · 자동 승인"이 잠깐 떴다가 꺼진다. 이 구역을 나갔다 들어오면 또 울릴 것 같다.' },
      message: '수화기를 들자 기계 음성이 흘러나온다. "당직자 응답을 확인했습니다, 정수호 님. 장애 B2-0214, 서버실 전력 임계 초과. 기술 회의실 출입을 승인합니다." 수호는 당직이 아니다. 음성은 그 이름을 알고 있었다. 끊긴 뒤 화면에 남은 발신 번호: "9203 · 내선표에 없음".',
      clue: '6층 당직 전화의 발신 번호 9203 · 내선표에 없는 번호.',
      takenMessage: '수화기에서는 신호음만 난다. 기술 회의실 출입은 이미 승인됐다.' }), style: 'art-spot duty-phone' },
    floor6Spot('전용선 단말함', [2016, 2052], [248, 438],
      '고객사 DR 복제 전용선 단말함이다. 낡은 회색 케이블 사이로 원래 없던 노란 광케이블 하나가 꽂혀 있고, 라벨은 사람 글씨가 아니라 프린터 글씨다: "B2 ARCHI-MAIN → DR-EXT". 케이블은 바닥 슬리브로 들어가 슬래브를 뚫고 곧장 아래층으로, B2까지 내려간다.'),
    floor6Spot('회선 사용 기록지', [2092, 2128], [190, 234],
      '사용 기록지: 하루 종일 낮은 선이다가 매일 03:05~03:40만 전용선 사용률 100%로 붉게 꽉 찬다. 고객사는 그 시간에 받은 데이터가 없다고 답했다. 실제 목적지 칸에는 "등록되지 않은 주소 · 해외"라고 찍혀 있다.'),
  ], { exitX: 749, exitBay: 322 }),
  floor6Room('f6-meeting', '기술 회의실', 'meeting', 2162, [
    floor6Spot('화이트보드', [64, 300], [186, 326],
      '벽 전체가 화이트보드다. 왼쪽 "B2 ARCHI-MAIN" 서버 묶음에서 파란 선이 "고객사 DR 센터"로 간다. 등록된 복제 경로다. 그 아래 붉은 점선은 DR 센터를 지나쳐 오른쪽 끝 구름 모양까지 이어지고, 붉은 원 옆에 "DR-EXT · 등록되지 않은 주소 · 해외". 24시간 막대에는 03:05~03:40 한 칸만 칠해져 있다.'),
    // 작은 퍼즐: 당직 전화의 발신 번호 9203을 내선 규칙(캐비닛 바인더 앞장)으로 풀면 B2 연결 실험실이다. 그 번호로 다시 걸어 본다.
    floor6Spot('스피커폰', [369, 399], [356, 372], { code: '9203', gives: 'f6-callback',
      codePrompt: '테이블 가운데 스피커폰에 붉은 불이 깜빡인다. 통화 기록: "03:00 · 내선 2000(B2 서버실) → 6F 기술 회의실 · 참석자 0명 · 40분." 아무도 없는 회의가 매일 밤 열렸다. 내선 번호를 눌러 걸 수 있다.',
      wrongMessage: '"없는 내선 번호입니다." 신호음이 끊긴다.',
      message: '9203을 눌렀다. 신호음 두 번 만에 받는다. 숨소리 같은 잡음 뒤에 부드러운 목소리: "B2 연결 실험실입니다. 정수호 님이시죠? 자리는 준비돼 있어요. 키 175cm 기준으로 맞춰 뒀어요." 그리고 끊긴다.',
      clue: '9203 = B2 연결 실험실(내선 규칙 92+03). 전화를 받은 목소리는 수호를 위한 "자리"를 준비해 뒀다고 했다.',
      takenMessage: '스피커폰 화면: "최근 통화 9203 · B2 연결 실험실 · 0분 12초."' }),
    floor6Spot('꺼진 디스플레이', [564, 664], [194, 302],
      '화상 회의 디스플레이는 꺼져 있지만 카메라 바의 붉은 점은 켜져 있다. 회의실 예약표: "매일 03:00 · DR 복제 점검 · 주최 archi_svc · 참석 필수 없음."'),
    floor6Spot('캐비닛 바인더', [1728, 1800], [340, 436],
      '철제 캐비닛 위 바인더는 고객사 DR 복제 계약서다. 등록된 복제 대상은 고객사 DR 센터 한 곳뿐. 맨 뒤에 끼워진 변경 요청서: "DR-EXT 경로 추가 · 신청 SYSTEM · 승인 당직 ARS 무응답 자동 승인." 앞장에는 사내 내선 규칙이 붙어 있다: "내선 = 층 두 자리(지하는 9+층, B1=91) + 방 두 자리(01 사무실 · 02 회의실 · 03 실험실)."'),
  ], { windowless: true, exitX: 1906, exitBay: 322 }),
]);
