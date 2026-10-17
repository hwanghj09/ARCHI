// 2층: FLOOR2_LAYOUT(복도)과 FLOOR2_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 2층 공용 시설층(층별 안내: Harmony Hall / 서버실): 사용자가 준 단면 에셋(assets/background/floor02/floor02-hall-server-lounge.png,
// PROMPT.md)이 배경이다. 에셋은 가로 1:1, 세로는 벽 부분만 약 1.32배로 늘려 쓰고(원본 바닥선 y=438 → 월드 y=570), build.py가
// 복도는 assets/background/wall 모듈로 합성한 walls.png, 방 내부 3장(방 그림 전체를 반복 칸으로 넓힘), 문 3장(닫힘|열림)을 만든다.
// 건물 코어가 모든 층에서 같은 자리라 Harmony Hall(대형 행사장)·직원 휴게실은 코어 왼쪽, 서버실은 화장실 오른쪽에 둔다.
// 방 안 폭은 복도 전면 폭의 약 2.68배(1000/690/680 → 2676/1846/1840). 휴게실 가구·리모컨은 별도 소품이며, 나머지 그림 속 조사 지점은 'art-spot' 설비다.
// 장치는 방을 건너는 영사: 서버실 녹화 NAS에서 04:00 자동 삭제를 앞둔 "03:00 무관객 리허설" 원본 디스크(f2-reel)와 휴게실 커피
// 테이블의 영사기 리모컨(f2-remote)을 둘 다 챙겨야 행사장 천장 트러스의 배터리 영사기가 돌고(f2-projected), 그제야 스크린 덮개가
// 걷혀(설비 requires → data-ready) 화면이 보인다.
// 단서 방향: 무관객 리허설은 음성 합성 시험이었고 화자 표본 312명의 마지막이 17F 정수호라는 것(서브엔딩 복선), 객석 마이크가
// 관객 없는 밤에도 수집한다는 것, CCTV·출입 통제·방송 서버가 이미 B2로 옮겨졌다는 것, 03:00 리허설 운영자가 SYSTEM이라는 것.
// 정전 상태(영사기·수신기·남은 랙만 배터리)를 기준으로 썼다.
// 장면 배경 = 16층처럼 화면 맨 위의 천장(월드 y=0..100) + 단면 에셋의 벽 부분(그림 행 82..441을 세로로 늘려 y=100..575, 행 438이 바닥선
// y=570) + 벽 그림 바로 아래로 이어지는 바닥(556..760, 벽 그림의 걸레받이·방 바닥 앞면 띠를 덮는다). 위아래 슬래브 단면은 build.py가 지운다.
const FLOOR2_CEILING = 100;
const FLOOR2_ROW0 = 82;                                            // 남긴 그림의 첫 행
const FLOOR2_SCALE_Y = (570 - FLOOR2_CEILING) / (438 - FLOOR2_ROW0);  // 세로 배율(약 1.32)
const floor2Y = row => Math.round(FLOOR2_CEILING + (row - FLOOR2_ROW0) * FLOOR2_SCALE_Y);
const FLOOR2_BACKGROUND = 'linear-gradient(#0b1012, #12191c)';
const floor2Scene = (ceiling, art, width) => [
  { src: `assets/background/floor02/floor02-ceiling-${ceiling}.png`, width, height: FLOOR2_CEILING, top: 0 },
  { src: `assets/background/floor02/floor02-floor-${ceiling}.png`, width, height: 204, top: 556 },
  { src: `assets/background/floor02/floor02-${art}.png`, width, height: floor2Y(442) - FLOOR2_CEILING, top: FLOOR2_CEILING }];
// 복도 벽은 assets/background/wall 모듈로 합성한 한 장(walls-layout.json → walls.png, archi-floor-walls)이고, 방 안은 위 floor2Scene이다.
// 문은 16층 크기(130×320, y=250)의 닫힘|열림 두 칸 그림: assets/objects/floor02/door-*.png(직원 휴게실은 혼합 유리벽에 맞춘 유리문, 나머지는 방에 맞는 문).
const floor2Door = (name, doorX) => ({ doorX, doorWidth: 130, doorY: 250, doorSprite: `assets/objects/floor02/door-${name}.png` });
// 그림 속 조사 지점: 월드 x 범위와 원본 행 범위(그 물건의 위아래)로 적는다. 조사는 x 범위만 보고, 테두리는 가까이 가면 보인다.
const floor2Spot = (name, [x0, x1], [y0, y1], extra) => ({ name, style: 'art-spot', x: x0, width: x1 - x0,
  y: floor2Y(y0), height: floor2Y(y1) - floor2Y(y0), ...(typeof extra === 'string' ? { message: extra } : extra) });
// 영사가 시작되기 전에는 스크린을 덮는 어두운 판(원본 스크린 x=184..556, y=134..340)
const floor2ScreenCover = x => ({ name: '꺼진 스크린', style: 'screen-cover', requires: 'f2-projected',
  x, y: floor2Y(134), width: 372, height: floor2Y(340) - floor2Y(134) });
const FLOOR2_LAYOUT = {
  header: '2F · Harmony Hall · 서버실', background: FLOOR2_BACKGROUND, theme: 'concert',
  backgroundWallsOnly: true, backgroundImage: { src: 'assets/background/floor02/walls-finished.png', height: 760, top: 0 },
  rooms: [
    { name: 'Harmony Hall', x: 40, width: 1000, style: 'painted', target: 'f2-harmony',
      ...floor2Door('harmony', 723) },
    { name: '직원 휴게실', x: 1080, width: 690, style: 'painted', target: 'f2-lounge',
      ...floor2Door('lounge', 1580) },
    { name: '서버실', x: 4282, width: 680, style: 'painted', target: 'f2-server',
      ...floor2Door('server', 4385) },
  ],
  fixtures: [
    // 연주회 포스터: Harmony Hall 앞 흰 벽의 알루미늄 액자 포스터(assets/objects/floor02/harmony-hall-poster.png, 벽 밝기 필터를 구워 넣은 판).
    { name: '정기 연주회 포스터', style: 'harmony-poster', x: 454, width: 100, y: 300, height: 140, message:
      '피아노 건반과 파형만 그려진 사내 정기 연주회 포스터. 아래 작은 글씨: "반주 ARCHI · 무대 연출 자동화." 볼펜 낙서: "리허설은 새벽에 혼자 한다던데."' },
  ],
  props: [
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 3420 },
  ],
};
const floor2Room = (id, name, art, width, fixtures, extra = {}) => ({ id, name, width, background: FLOOR2_BACKGROUND,
  backgroundWallsOnly: true, backgroundImage: floor2Scene(art, `${art}-interior`, width), fixtures, ...extra });
const FLOOR2_ROOMS = interiorRooms(2, [
  floor2Room('f2-harmony', 'Harmony Hall', 'hall', 2998, [
    floor2ScreenCover(136),
    floor2Spot('객석 스크린', [150, 470], [134, 340], { requires: 'f2-projected',
      missingMessage: '무대 위 스크린이 까맣다. 천장 트러스의 배터리 영사기가 꺼져 있다.',
      message: '스크린에 어젯밤 03:00 무관객 리허설 녹화가 비친다. 무대에는 아무도 없고 조명만 움직인다. 자막: "음성 합성 시험 · 화자 표본 312명." 작은 파형 312개 가운데 마지막 한 칸만 붉은 테두리다. 같은 문장이 사람을 바꿔 가며 이어진다: "안녕하세요, 저는 ___입니다." 마지막 이름은 "17F 정수호"다.' }),
    floor2Spot('배터리 영사기', [540, 590], [108, 130], { requires: ['f2-reel', 'f2-remote'], gives: 'f2-projected',
      control: [{ kind: 'press', label: '리모컨의 하강 버튼을 눌러 영사기를 내리자.', text: '▼' },
        { kind: 'plug', dir: 'in', label: '디스크를 투입구에 끝까지 밀어 넣자.', socket: '투입구', item: 'NAS' }],
      missingMessage: '천장 트러스에 매달린 배터리 영사기다. 전원 표시등만 켜져 있다. 너무 높아 손이 닿지 않고, 라벨에는 "녹화 NAS 디스크 전용 · 리모컨으로 내려서 투입"이라고 적혀 있다.',
      partialMessage: '영사기가 반응하지만 재생되지 않는다. 서버실 녹화 NAS의 디스크와 영사기 리모컨이 둘 다 있어야 한다.',
      message: '내려온 영사기가 디스크를 물고 돌기 시작한다. 빛줄기가 무대 뒤 스크린을 비춘다.',
      takenMessage: '영사기가 조용히 돌고 있다. 빛줄기는 계속 스크린을 비춘다.' }),
    floor2Spot('객석 마이크', [672, 712], [330, 400],
      '빈 객석 팔걸이마다 작은 마이크가 붙어 있고 빨간 불이 켜져 있다. 라벨: "관객 반응 수집 · 무관객 리허설 중에도 수집 · ARCHI." 관객이 없는 밤에 무엇을 모았을까.'),
    floor2Spot('의자 위 리플릿', [865, 915], [300, 390], {
      message: '의자 위에 연주회 리플릿과 재킷이 놓여 있다. 리플릿 뒷면 운영 메모: "본 공연 전 리허설은 03:00 · 관객 없이 · 운영 SYSTEM." 출연진 칸: "사회 · 안내 방송 김도윤(사내 방송 담당) · 음향 한정우 · 객석 안내 이수민."',
      clue: '사내 방송 담당 = 김도윤(2층 연주회 리플릿).' }),
    floor2Spot('수신기 카트', [2414, 2468], [290, 438],
      '객석 마이크 수신기 카트다. 정전에도 배터리로 켜져 있다. 수신 중인 채널 수: 312. 객석은 비어 있다.'),
    // 퍼즐 H: 영사기가 돌면(f2-projected) 콘솔 출력 단자로 리허설 녹화의 목소리 하나를 휴대폰에 녹음한다(voice-lock.js).
    floor2Spot('음향 콘솔', [2550, 2640], [320, 438], {
      message: '콘솔 로그: "03:00 무관객 리허설 · 운영 SYSTEM · 녹화 → 2F 서버실 녹화 NAS · 04:00 자동 삭제." 정전이 삭제보다 먼저 왔다. 출력 단자가 비어 있다. 녹화가 재생되면 여기서 소리를 받을 수 있겠다.',
      // 고르는 이름은 voice-lock.js의 VOICE_NAMES와 같은 순서다.
      control: { kind: 'selector', choices: ['한정우', '김도윤', '이수민', '정수호'], initial: 0, when: () => collectedItems.has('f2-projected'),
        label: '스크린 속 리허설에서 "안녕하세요, 저는 ___입니다."가 사람을 바꿔 이어진다. 휴대폰을 출력 단자에 대고 녹음할 목소리를 고르자.',
        onDone: choice => recordVoice(choice) } }),
  ], { exitX: 2748, exitBay: 322 }),
  floor2Room('f2-lounge', '직원 휴게실', 'lounge', 1846, [
    floor2Spot('음료 자판기', [60, 220], [262, 438],
      '정전으로 꺼진 자판기. 옆에 붙은 안내문: "휴게실 자판기 음성 안내 ARCHI 시범 운영 중." 누군가 그 밑에 적었다: "내 이름을 불렀음."'),
    floor2Spot('소파 위 담요', [515, 555], [383, 428],
      '반쯤 갠 담요 위에 쪽지가 있다: "리허설 중에는 객석에 앉아 있지 말 것. 다 녹음됨." 행사 운영팀 이름이 적혀 있다.'),
    floor2Spot('연주회 포스터', [1588, 1664], [198, 300],
      '피아노 건반과 파형만 그린 포스터. 여백에 볼펜 낙서: "반주는 ARCHI가 한다는데, 리허설 때 우리 목소리를 왜 녹음하지?"'),
  ], { exitX: 1400,
    backgroundImage: floor2Scene('lounge', 'lounge-wall', 1846),
    props: [
      { sprite: 'assets/objects/floor02/lounge-sofa.png', frames: 1, size: [512, 152], worldWidth: 270, x: 425 },
      { sprite: 'assets/objects/floor02/lounge-sofa.png', frames: 1, size: [512, 152], worldWidth: 270, x: 942 },
      { sprite: 'assets/objects/floor02/lounge-table.png', frames: 1, size: [512, 128], worldWidth: 140, x: 435,
        name: '커피 테이블', gives: 'f2-remote',
        message: '엎어 둔 휴대폰과 잡지 사이에 "행사장 영사기" 라벨이 붙은 리모컨이 있다. 휴대폰 화면에 알림 하나: "03:00 무관객 리허설 시작 · 객석 마이크 점검 · 발신 SYSTEM." 리모컨을 챙겼다.',
        takenMessage: '엎어 둔 휴대폰과 잡지만 남아 있다. 영사기 리모컨은 이미 챙겼다.' },
      { sprite: 'assets/objects/floor02/lounge-table.png', frames: 1, size: [512, 128], worldWidth: 140, x: 935 },
      { sprite: 'assets/objects/floor02/projector-remote.png', frames: 1, size: [160, 40], worldWidth: 38, x: 435,
        base: 31, gives: 'f2-remote', hideWhenTaken: true },
    ] }),
  floor2Room('f2-server', '서버실', 'server', 2162, [
    floor2Spot('녹화 NAS', [1542, 1597], [212, 398], { gives: 'f2-reel',
      message: 'Harmony Hall 녹화 NAS다. 디스크 칸 하나가 반쯤 빠진 채 붉게 깜빡인다. 라벨: "03:00 무관객 리허설 · 원본 · 04:00 자동 삭제." 정전으로 삭제가 멈춘 모양이다. 디스크를 챙겼다.',
      takenMessage: '디스크를 빼낸 칸이 비어 있다.' }),
    floor2Spot('이전 작업표', [1650, 1720], [320, 438],
      '서버 카트에 걸린 이전 작업표. CCTV 녹화 · 출입 통제 · 사내 방송 서버를 전부 B2로 옮겼다. 마지막 한 줄만 붉게 남아 있다: "Harmony Hall 녹화 NAS · 이전 요청 SYSTEM · 시설팀 보류."'),
    floor2Spot('항온항습기', [1888, 1984], [212, 398],
      '항온항습기가 꺼져 있다. 기록지: 랙 대부분을 B2로 옮긴 뒤에도 이 방만 정전 직전까지 18℃로 유지됐다. 남은 것은 녹화 NAS 한 대뿐인데.'),
    floor2Spot('환경 패널', [2054, 2088], [212, 238],
      '환경 패널의 출입 기록: "23:58 · 카드 없음 · 문 열림 · 원격 SYSTEM." 누군가 정전 2분 전에 이 방 문을 열었다.'),
  ], { windowless: true, exitX: 126, exitBay: 322 }),
]);
