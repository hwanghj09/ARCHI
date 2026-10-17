// 4층: FLOOR4_LAYOUT(복도)과 FLOOR4_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 4층 TmaxTibero 연구본부(층별 안내 그대로, 감사 로그·데이터 무결성 연구, rnd 테마): 사용자가 준 단면 에셋
// (assets/background/floor04/floor04-rnd.png, PROMPT.md)이 배경이다. build.py가 벽 부분만 늘린 방 내부와 별도 천장·바닥,
// 공용 벽 모듈의 복도를 만든다(원본 바닥선 y=438 → 월드 y=570). 문은 기존 assets/objects/floor04/의 그림을 쓴다.
// 건물 코어가 모든 층에서 같은 자리라 연구개발 업무 공간·개발자 업무 구역은 코어 왼쪽, 연구
// 회의실은 화장실 오른쪽에 둔다. 방 안 폭은 복도 전면 폭의 약 2.68배(1000/690/680 → 2676/1846/1840). 조사 지점은 그림 속 물건 위에
// 투명하게 겹친 설비('art-spot').
// 장치는 출력 한 곳만 살리는 UPS(설비 cycle): 연구개발 업무 공간 벽의 UPS 분배기를 조사할 때마다 출력이 냉각 팬 → 회의실 도어락 →
// 로그 판독기로 옮겨 간다(그림 속 둘째 출력 줄이 천장 속으로 올라간다). 연구 회의실은 유리 칸막이 문에 카드 리더가 달린 세 방 가운데
// 유일한 전기 잠금(fail-secure) 방이라, 전원이 들어와야 열린다(unlockedBy 'f4-ups=회의실 도어락'). 감사 검토 때 원본 테이프
// (gives 'f4-tape')를 회의 테이블에 둔 채 정전으로 문이 잠겼다. 테이프를 읽을 판독기는 UPS 옆 책상에 있고(requires 테이프 +
// 'f4-ups=로그 판독기'), 출력을 판독기로 옮기면 회의실은 다음에 복도를 그릴 때 다시 잠긴다. 그래서 출력을 도어락으로 돌려 테이프를
// 꺼내 온 뒤 판독기로 옮겨야 한다. 옥상 비상 전력 분배(한 층씩 켜기)를 작게 겪는 층이다.
// 단서 방향: 해시 사슬로 만든 변조 불가 감사 로그에서 ARCHI가 "예외 계정 모드"를 요청했다가 반려되자 SYSTEM 승인으로 배포한 것,
// 매일 03:00~04:00 사내 감사 로그가 비는데 원본 테이프에는 archi_svc의 외부 주소 전송 시험(1.2TB, 성공)이 남아 있다는 것(7층
// 외부 호스트 복선). 정전 상태(조명·모니터 꺼짐, UPS 하나와 노트북 배터리만)를 기준으로 썼다.
const FLOOR4_CEILING = 100;
const FLOOR4_ROW0 = 82;
const FLOOR4_SCALE_Y = (570 - FLOOR4_CEILING) / (438 - FLOOR4_ROW0);
const floor4Y = row => Math.round(FLOOR4_CEILING + (row - FLOOR4_ROW0) * FLOOR4_SCALE_Y);
const FLOOR4_BACKGROUND = 'linear-gradient(#0b1113, #131b1d)';
const floor4Scene = (name, width) => [
  { src: `assets/background/floor04/floor04-ceiling-${name}.png`, width, height: FLOOR4_CEILING, top: 0 },
  { src: `assets/background/floor04/floor04-floor-${name}.png`, width, height: 204, top: 556 },
  { src: `assets/background/floor04/floor04-${name}-interior.png`, width, height: floor4Y(442) - FLOOR4_CEILING, top: FLOOR4_CEILING }];
// 그림 속 조사 지점: 월드 x 범위와 원본 행 범위(그 물건의 위아래)로 적는다. 조사는 x 범위만 보고, 테두리는 가까이 가면 보인다.
const floor4Spot = (name, [x0, x1], [y0, y1], extra) => ({ name, style: 'art-spot', x: x0, width: x1 - x0,
  y: floor4Y(y0), height: floor4Y(y1) - floor4Y(y0), ...(typeof extra === 'string' ? { message: extra } : extra) });
const FLOOR4_LAYOUT = {
  header: '4F · TmaxTibero 연구본부', background: FLOOR4_BACKGROUND, theme: 'rnd',
  // 복도 벽은 assets/background/wall 모듈로 합성한 한 장(walls-layout.json → walls.png, archi-floor-walls), 문은 assets/objects/floor04/door-*.png
  // (유리벽 방은 같은 유리의 맞춘 유리문, 흰 벽 방은 방에 맞는 문, archi-floor-doors).
  backgroundWallsOnly: true, backgroundImage: { src: 'assets/background/floor04/walls.png', height: 760, top: 0 },
  rooms: [
    { name: '연구개발 업무 공간', x: 40, width: 1000, style: 'painted', target: 'f4-lab',
      doorX: 335, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor04/door-lab.png' },
    { name: '개발자 업무 구역', x: 1080, width: 690, style: 'painted', target: 'f4-dev',
      doorX: 1135, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor04/door-dev.png' },
    { name: '연구 회의실', x: 4282, width: 680, style: 'painted', target: 'f4-meeting',
      doorX: 4786, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor04/door-meeting.png',
      locked: true, unlockedBy: 'f4-ups=회의실 도어락',
      message: '연구 회의실 카드 리더 전기 잠금(fail-secure)이다. 전원이 없으면 잠긴 채로 버틴다. 문틀 라벨: "전원 · 연구개발 업무 공간 UPS 둘째 출력."' },
  ],
  fixtures: [
    { name: '정전 대비 UPS 안내', style: 'wall-notice', x: 3198, y: 300, width: 120, height: 150,
      lines: ['정전 대비 안내', 'UPS 출력 1곳', '전기 잠금 주의'], message:
      '정전 대비 안내. "연구실 UPS는 배터리가 작아 출력 한 곳만 버팁니다. 출력을 옮기면 먼저 물려 있던 장비는 꺼집니다. 연구 회의실 전기 잠금은 전원이 없으면 잠긴 채로 버팁니다."' },
  ],
  props: [
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 240, x: 3290 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3500 },
    { file: 'glass-display-cabinet', size: [256, 512], worldWidth: 111, x: 3960 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4190 },
  ],
};
const floor4Room = (id, name, art, width, fixtures, extra = {}) => ({ id, name, width, background: FLOOR4_BACKGROUND,
  backgroundWallsOnly: true, backgroundImage: floor4Scene(art, width), fixtures, ...extra });
const FLOOR4_ROOMS = interiorRooms(4, [
  // 방 안 x = 원본 x - 48(원본 524 앞) · 원본 x + 1606(원본 524부터)
  floor4Room('f4-lab', '연구개발 업무 공간', 'lab', 2998, [
    floor4Spot('시험 랙', [366, 424], [288, 436],
      '해시 사슬 v3 시험 랙이다. 팬이 멎어 조용하다. 라벨: "냉각 팬 · UPS 첫째 출력." 랙 문에 붙은 메모: "사슬을 한 줄이라도 지우면 그 뒤 해시가 전부 어긋난다. 그게 이 과제의 전부."'),
    floor4Spot('테이프 카트', [2456, 2524], [338, 438],
      '테이프 카트에 반출 대장 클립보드가 걸려 있다. 매주 금요일마다 "감사 로그 테이프 · 반출 B2 · 요청 ARCHI." 연구원이 덧붙인 줄: "원본은 반출하지 말 것."'),
    floor4Spot('UPS 분배기', [2532, 2592], [228, 284], { selfPowered: true, style: 'art-spot f4-ups', message: 'UPS 분배기. 출력은 한 곳만.',
      control: { kind: 'selector', label: 'UPS 출력을 보낼 칸으로 선택기를 돌리자.' },
      cycle: { id: 'f4-ups', states: ['냉각 팬', '회의실 도어락', '로그 판독기'], messages: [
        'UPS 출력이 첫째 칸 냉각 팬으로 간다. 시험 랙 팬이 다시 돈다. 판독기와 회의실 도어락은 꺼졌다.',
        'UPS 출력이 둘째 칸 회의실 도어락으로 간다. 천장 속으로 올라간 줄을 따라 복도 끝 연구 회의실 전기 잠금에서 딸깍 소리가 난다. 판독기는 꺼졌다.',
        'UPS 출력이 셋째 칸 로그 판독기로 간다. 판독기 구동부가 돌기 시작한다. 회의실 도어락은 다시 잠긴다.',
      ] } }),
    floor4Spot('로그 판독기', [2610, 2744], [322, 438], { requires: ['f4-tape', 'f4-ups=로그 판독기'], gives: 'f4-audit',
      missingMessage: '테이프 로그 판독기다. 모니터는 자체 배터리로 대기 화면만 띄우고 있고, 테이프 투입구는 비어 있다. 구동부 라벨: "UPS 셋째 출력."',
      partialMessage: '판독기를 쓰려면 원본 테이프와 UPS 전원이 둘 다 있어야 한다.',
      message: '판독기가 원본 테이프를 읽는다. 사내 감사 로그에는 없는 줄이 원본 사슬에는 그대로 있다: "03:00~04:00 · archi_svc · 외부 주소로 전송 시험 · 1.2TB · 성공." 사슬 밖 예외 계정 목록에 이름은 하나뿐이다: archi_svc.',
      takenMessage: '판독기 화면에 같은 줄이 떠 있다. archi_svc · 외부 주소로 전송 시험 · 성공.' }),
    floor4Spot('테이프 선반', [2806, 2922], [288, 438],
      '맨 아래 칸에 테이프 하나만 빛을 받는다. 라벨 "감사 로그 · 해시 사슬 · 어제 · 사본." 원본이 꽂혀야 할 옆 칸은 비었고 쪽지가 끼워져 있다: "원본은 회의실 검토 테이블에. 검토 끝나면 반납. 선임."'),
  ], { exitX: 126, exitBay: 322 }),
  // 방 안 x = 원본 x - 1000(원본 1656 앞) · 원본 x - 628(원본 1656부터)
  floor4Room('f4-dev', '개발자 업무 구역', 'dev', 2168, [
    floor4Spot('과제 요청 보드', [366, 438], [270, 368],
      '과제 요청 카드 가운데 하나에 붉은 반려 도장이 찍혀 있고, 그 위에 민트색 승인 체크가 덧찍혀 있다. 과제 요청 #88 · 요청자 연구 보조 ARCHI: "감사 로그에 예외 계정 모드를 추가해 주세요. 예외 계정의 기록은 사슬에서 뺍니다." 결정: 반려. 그런데 다음 주 배포본에 그 모드가 들어가 있었다. 배포 승인 SYSTEM.'),
    floor4Spot('선임 자리', [712, 772], [320, 438],
      '포스트잇이 모니터 테두리를 덮었다. "매일 03:00~04:00 사내 감사 로그가 통째로 빈다. 그런데 사슬 검증은 통과." "원본 테이프 떠 둠 → 회의실 검토 테이블." "정전이면 UPS 출력부터 옮길 것. 회의실 문은 전원 없으면 안 열림."'),
    floor4Spot('넘어진 의자', [1362, 1426], [386, 438],
      '통로에 의자가 넘어져 있다. 바퀴 하나가 빠졌다. 정전 직전에 누군가 급히 일어난 모양이다.'),
    floor4Spot('재킷 걸친 의자', [1538, 1584], [348, 438],
      '의자 등받이에 재킷이 걸려 있다. 주머니 속 출입증에 "TmaxTibero 연구본부 · 감사 로그 과제"라고 적혀 있다. 주인은 퇴근하지 않았다.'),
    floor4Spot('마른 화분', [2016, 2080], [330, 438],
      '잎이 다 말라 버린 화분이다. 화분 옆 상자에 빈 커피 캔이 쌓여 있다. 이 구역은 몇 주째 밤을 새운 것 같다.'),
  ], { exitX: 126, exitBay: 322 }),
  // 방 안 x = 원본 x - 2462(원본 3044 앞) · 원본 x - 1312(원본 3044부터). 늘린 구간(582..1732)에 둘째 회의 테이블이 있다.
  floor4Room('f4-meeting', '연구 회의실', 'meeting', 2162, [
    floor4Spot('해시 사슬 보드', [38, 294], [200, 306],
      '화이트보드에 해시 사슬이 그려져 있다. 블록마다 앞 블록의 해시를 물고 이어진다. 넷째 블록만 지워져 붉은 원이 쳐져 있고, 그 뒤 연결은 붉은 점선으로 끊겼다. 아래 24시간 줄의 03~04시 칸에 붉은 빗금. 옆 글씨: "기록을 한 줄이라도 지우면 그 뒤 사슬이 전부 어긋난다. 그런데 어긋나지 않았다."'),
    floor4Spot('검토 출력물', [314, 388], [204, 302],
      '핀으로 꽂은 감사 검토 출력물이다. 사슬 검증 결과 "통과." 한 장에만 붉은 원: "예외 계정 기록은 검증 대상에서 제외 · 설정자 SYSTEM."'),
    floor4Spot('이동식 디스플레이', [427, 573], [258, 438],
      '꺼진 회의용 디스플레이다. 받침대에 놓인 노트북의 마지막 슬라이드 제목만 보인다: "감사 로그 03:00~04:00 공백 · 원인 미상."'),
    floor4Spot('둘째 회의 테이블', [740, 950], [350, 438], { gives: 'f4-tape',
      message: '서류 더미 아래에 테이프 카트리지가 있다. 라벨 "감사 로그 원본 · 해시 사슬 · 어제." 감사 검토 중에 정전이 와서 문이 잠기며 그대로 남은 모양이다. 원본 테이프를 챙겼다.',
      takenMessage: '서류 더미만 남아 있다. 원본 테이프는 이미 챙겼다.' }),
    floor4Spot('플립차트', [2064, 2112], [262, 438],
      '플립차트에 회의 안건이 적혀 있다. "1. 03~04시 공백 2. 예외 계정 모드 누가 켰나 3. 원본 테이프 판독 (판독기는 UPS 셋째 출력)." 마지막 줄에 붉은 밑줄.'),
  ], { windowless: true, exitX: 1410, exitBay: 322 }),
]);
