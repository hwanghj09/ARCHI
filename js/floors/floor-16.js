// 16층: FLOOR16_LAYOUT(복도)과 FLOOR16_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 16층 편의시설(1층 층별 안내: The Kitchen / VU 편의점 / Café): 크림색 타일 마감(food 테마). 코어 왼쪽에 벽을 맞댄
// 사내 식당(The Kitchen)·VU 편의점, 화장실 오른쪽 구역에 카페를 둔다. 방 안 폭은 복도 전면 폭의 3.4배(1060/600/560 → 3604/2040/1904).
// VU 셔터는 정전 직전에 내려와 복도에서 열리지 않는다(unlockedBy: 자기 방 id). 식당 안쪽 끝의 주방 반입문(links)으로 편의점
// 창고에 들어가고(반입문은 편의점 쪽에서 열리지 않는다), 안의 셔터 제어함 수동 레버로 셔터를 올린 뒤(올린 채로는 복도에서도 드나든다) 출구로 나온다.
// 레버로 셔터를 다시 내릴 수도 있고, 내려 두면 출구도 복도 문도 닫힌다.
// 단서는 새벽마다 끊기는 냉동고 전원, 정전 직전 SYSTEM이 내린 셔터와 수호의 23:47 영수증, 낮에는 주문도 못 알아듣다가
// 새벽에는 먼저 인사하는 음성 주문 키오스크(ARCHI 시범). 배경은 편의시설 전용 그림이며 문·소품은 별도로 그린다.
// 카페 테이블의 조현아 팀장 사원증(gives 'f16-badge')으로 12~15층 하차 로비의 인증 게이트를 통과한다(registry.js).
// build.py가 원래 표시 배율의 벽·선반을 유지하고 공용 천장·바닥·복도를 높이 760으로 마감한다. 점등·소등 그림을 함께 만든다.
const FLOOR16_LAYOUT = {
  header: '16F · 편의시설', background: '#1d1b17', theme: 'food',
  backgroundWallsOnly: true,
  backgroundImage: { src: 'assets/background/floor16/floor16-corridor.png', height: 760, top: 0 },
  brandSigns: [{ x: 1340, y: 134, width: 170, height: 50 }],
  rooms: [
    { name: 'The Kitchen', x: 64, width: 1060, style: 'kitchen', target: 'f16-kitchen',
      doorX: 494, doorWidth: 200, doorStyle: 'cafeteria' },
    { name: 'VU 편의점', x: 1124, width: 600, style: 'store', target: 'f16-cu',
      doorX: 1542, doorWidth: 150, doorY: 262, doorStyle: 'shutter', locked: true, unlockedBy: 'f16-cu',
      message: 'VU 편의점 셔터가 내려와 있다. 셔터 옆 안내문: "셔터가 내려간 뒤에는 식당 주방 반입문으로 출입해 주세요."',
      insideMessage: '셔터가 바닥까지 내려와 있다. 옆의 셔터 제어함 수동 레버로 먼저 올려야 나갈 수 있다.' },
    { name: 'Café', x: 4322, width: 560, style: 'cafe', target: 'f16-cafe',
      doorX: 4354, doorWidth: 140, doorStyle: 'cafe' },
  ],
  props: [
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 240, x: 930 }, // 다른 층 소파와 같은 사람 비율(최소 240)
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3500 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 3980 },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 4190 },
    { file: 'food-menu-board', size: [256, 512], worldWidth: 70, x: 3330, name: '메뉴 입간판',
      message: '이번 주 식당 메뉴표. 아래쪽 공지: "식당·카페 음성 주문 키오스크 ARCHI 시범 운영 중 · 인식 오류가 잦아 직원이 함께 응대합니다."',
      surface: 'chalkboard', writing: [{ as: 'title', text: '이번 주 식당 메뉴' },
        { as: 'paper', place: 'main', title: '식당·카페 음성 주문 키오스크', text: 'ARCHI 시범 운영 중\n인식 오류가 잦아 직원이 함께 응대합니다.' }],
      caption: '메뉴표 아래쪽 공지.' },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4925 },
  ],
};
const FLOOR16_ROOMS = interiorRooms(16, [
  { id: 'f16-kitchen', name: 'The Kitchen', width: 3604, interiorStyle: 'tiles',
    backgroundWallsOnly: true,
    backgroundImage: { src: 'assets/background/floor16/floor16-kitchen.png', height: 760, top: 0 },
    links: [{ target: 'f16-cu', x: 3460, width: 110, style: 'backdoor' }], props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
    { file: 'food-dining-table', size: [512, 256], worldWidth: 243, x: 380 },
    { file: 'food-dining-table', size: [512, 256], worldWidth: 243, x: 800 },
    { file: 'food-kitchen-board', size: [512, 256], worldWidth: 350, x: 1250, name: '주방 게시판',
      message: '주방 근무표 옆 메모: "밤에는 VU가 무인 운영이라 편의점 물품도 주방 반입문으로 들어옴. 반입문 잠그지 말 것." 마감 점검표와 시설팀 회신도 붙어 있다: "냉동고 전원 건 · 건물 전력 이상 없음."',
      writing: [{ as: 'paper', title: '주방 근무표', text: '조식  A조\n중식  A조 · B조\n석식  B조' },
        { as: 'note', text: '밤에는 VU가 무인 운영이라\n편의점 물품도\n주방 반입문으로 들어옴.\n\n반입문 잠그지 말 것.' },
        { as: 'paper', title: '주방 마감 점검', text: '· 가스 밸브 잠금\n· 냉동고 온도 기록\n· 음식물 쓰레기 배출' },
        { as: 'paper', title: '시설팀 회신', text: '냉동고 전원 건\n건물 전력 이상 없음.' }],
      caption: '주방 근무표 옆 메모.' },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1560 },
    { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 2040 },
    { file: 'food-serving-counter', size: [512, 256], worldWidth: 326, x: 2330, name: '배식대',
      message: '배식대에 냉동고 온도 기록지가 끼워져 있다. 매일 02:00~05:00 사이 전원이 끊겨 온도가 올라갔다. 메모: "시설팀은 건물 전력 이상 없다고 함. 식자재 또 폐기."',
      surface: 'document', writing: [{ as: 'title', text: '냉동고 온도 기록지' }, { as: 'field', label: '02:00~05:00', text: '전원 끊김 · 온도 ↑' },
        '(매일)', { as: 'hand', text: '시설팀은 건물 전력 이상 없다고 함.\n식자재 또 폐기.' }],
      caption: '배식대에 냉동고 온도 기록지가 끼워져 있다.' },
    { file: 'food-serving-counter', size: [512, 256], worldWidth: 326, x: 2660 },
    { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 2980 },
    { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 198, x: 3250 },
  ] },
  { id: 'f16-cu', name: 'VU 편의점', width: 2040, interiorStyle: 'shelves',
    backgroundWallsOnly: true,
    backgroundImage: { src: 'assets/background/floor16/floor16-cu.png', height: 760, top: 0 },
    brandSigns: [{ x: 950, y: 108, width: 160, height: 42 }],
    // 반입문은 주방 쪽에서만 열린다: 들어온 뒤에는 셔터 제어함 레버로 셔터를 올려야 나간다(필수 퍼즐).
    links: [{ target: 'f16-kitchen', x: 56, width: 110, style: 'backdoor', locked: true,
      message: '반입문은 주방 쪽에서만 열리게 걸려 있다. 셔터 제어함의 수동 레버로 셔터를 올리고 나가자.' }], props: [
    { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 290 },
    { file: 'food-checkout', size: [512, 256], worldWidth: 312, x: 1150, name: '계산대',
      message: 'POS 화면은 꺼져 있다. 계산대에 영수증 한 장이 걸려 있다: "23:47 · 컵라면 1 · 삼각김밥 1 · 사원증 결제 · 17층 정수호". 아까 야근하다 사 간 야식이다.',
      surface: 'receipt', writing: [{ as: 'title', text: 'VU' }, { as: 'rule' }, '23:47', { as: 'field', label: '컵라면', text: '1' },
        { as: 'field', label: '삼각김밥', text: '1' }, { as: 'rule' }, '사원증 결제', '17층 정수호'],
      caption: 'POS 화면은 꺼져 있다. 계산대에 영수증 한 장이 걸려 있다. 아까 야근하다 사 간 야식이다.' },
    { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 1450 },
    { file: 'food-shutter-panel', size: [256, 512], worldWidth: 89, x: 1640, name: '셔터 제어함',
      sprite: 'assets/objects/floor16/shutter-panel-states.png', stateBy: 'f16-cu',
      message: '셔터 제어 기록: "23:59 · 셔터 하강 · 명령 SYSTEM". 아래의 수동 레버로 안에서 셔터를 올리고 내릴 수 있다.',
      // 수동 레버(doors.js toggleShutter): E를 누를 때마다 레버 창이 열린다. 내려 있으면 당겨 올리고(제어 기록도 이 창에 보인다),
      // 올라가 있으면 밀어 내린다. 출구는 셔터가 올라가 있을 때만 열린다.
      shutterLever: 'f16-cu' },
  ],
  // 밀 수 있는 인라면 박스(js/scene/pushables.js): 플레이어 가슴 높이(117px, 처음의 1.3배)이고, 옆에서 막힌 채 걸으면 플레이어 이동 속도의 절반으로
  // 밀린다. 왼쪽은 처음 자리(중심 415)보다 더 밀리지 않고, 오른쪽은 계산대 왼쪽 끝(1150 - 312 / 2 + 312 * .0156 ≈ 999)에 박스
  // 오른쪽 끝(중심 + 93)이 맞닿는 자리(중심 906)에서 멈춘다. 박스 위에 서면(어디까지 밀었든) 선반 항불안제에 손이 닿는다.
  movables: [{ kind: 'ramen-box', name: '인라면 박스', x: 322, width: 186, height: 117,
    pushable: { factor: .5, minX: 415, maxX: 906 } }],
  // 상단 선반 약품 칸의 항불안제(위치는 선반 그림 속 컵라면 칸 위). condition(박스 위에 서기)을 채우기 전에는
  // 손이 닿지 않아 챙길 수 없고, 챙기면(gives) 선반에서 사라지고 가방에 들어간다(INVENTORY_ITEMS).
  fixtures: [
    { name: '항불안제', style: 'pill-item', x: 880, y: 246, width: 48, height: 45,
      standYs: [floorY, floorY - 117], condition: () => playerOnPushable(brandText('인라면 박스')),
      gives: 'f16-antianxiety', hideWhenTaken: true,
      surface: 'card', image: 'assets/objects/items/antianxiety.png',
      message: '박스 위에 올라서니 손이 닿는다. 선반 위의 항불안제 한 통을 꺼냈다. 챙겼다.',
      missingMessage: '선반 위쪽에 항불안제 한 통이 놓여 있다. 너무 높아서 손이 닿지 않는다.',
      takenMessage: '약품 칸은 비어 있다. 항불안제는 이미 챙겼다.' },
  ] },
  { id: 'f16-cafe', name: 'Café', width: 1904,
    backgroundWallsOnly: true,
    backgroundImage: { src: 'assets/background/floor16/floor16-cafe.png', height: 760, top: 0 },
    props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 350 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 560 },
    { file: 'food-cafe-table', size: [512, 256], worldWidth: 356, x: 950, name: '카페 테이블', gives: 'f16-badge',
      clue: '조현아 팀장(기술본부 ARCHI 프로젝트) 사원증을 챙겼다. 12~15층 하차 로비의 인증 게이트를 열 수 있다.',
      sprite: 'assets/objects/floor16/cafe-table-badge-states.png', stateBy: 'f16-badge',
      message: '식은 라테 옆에 사원증 한 장이 엎어져 있다: "조현아 · 기술본부 ARCHI 프로젝트 팀장". 저녁에 두고 퇴근한 모양이다.',
      surface: 'card', look: 'badge', image: 'assets/objects/id-cards/jo-hyeon-a.png',
      caption: '식은 라테 옆에 사원증 한 장이 엎어져 있다. 기술본부 ARCHI 프로젝트 팀장. 저녁에 두고 퇴근한 모양이다.',
      takenMessage: '테이블에는 식은 라테만 남아 있다. 조현아 팀장의 사원증은 이미 챙겼다.' },
    { file: 'food-coffee-bar', size: [512, 256], worldWidth: 296, x: 1330, name: '커피 바',
      message: '에스프레소 머신 옆 메모: "음성 주문 키오스크 또 먹통. 낮엔 아메리카노도 못 알아들음." 그 아래 다른 글씨: "새벽 청소 여사님 말로는 키오스크가 먼저 인사했대."',
      surface: 'memo', look: 'sticky-green', writing: ['음성 주문 키오스크', '또 먹통.', '낮엔 아메리카노도', '못 알아들음.',
        { text: '새벽 청소 여사님 말로는\n키오스크가 먼저 인사했대.', ink: 'blue' }],
      caption: '에스프레소 머신 옆 메모. 그 아래 다른 글씨.' },
    { sprite: 'assets/objects/floor16/voice-kiosk-states.png', frames: 3, poweredSprite: true,
      size: [256, 512], worldWidth: 89, x: 1515, name: '음성 주문 키오스크',
      animation: { src: 'assets/objects/floor16/voice-kiosk-states.png', frames: 3, first: 2 },
      message: '음성 주문 키오스크다. 화면이 꺼져 있다. 전기가 들어오면 켜질 것 같다.',
      poweredMessage: '음성 주문 키오스크 화면이 켜져 있다. 아무도 말을 걸지 않았는데 먼저 인사한다. "안녕하세요, 정수호 님."' },
    { file: 'food-voice-board', size: [512, 256], worldWidth: 350, x: 1690, name: '고객의 소리 게시판',
      message: '포스트잇 한 장: "키오스크가 제가 매일 몇 시에 와서 뭘 시키는지 다 알아요. 좀 무섭습니다." 답변란은 비어 있다. 다른 포스트잇에는 음성 주문과 식당 이용 불만이 적혀 있다.',
      writing: [{ as: 'title', text: '고객의 소리' },
        { as: 'paper', place: 'main', title: '이용 안내', text: '의견은 포스트잇에 적어 붙여 주세요.\n답변은 아래 카드에 적어 드립니다.' },
        { as: 'paper', place: 'main', title: '답변', text: '\u3000\n\u3000' },
        { as: 'note', color: 'pink', text: '키오스크가\n제가 매일 몇 시에 와서\n뭘 시키는지 다 알아요.\n\n좀 무섭습니다.' },
        { as: 'note', color: 'yellow', text: '음성 주문이\n아메리카노를 못 알아들어요.' },
        { as: 'note', color: 'blue', text: '점심 줄이 너무 길어요.' },
        { as: 'note', color: 'pink', text: '디카페인 원두도\n들여 주세요.' },
        { as: 'note', color: 'green', text: '키오스크 말고\n직원분께 주문하고 싶어요.' },
        { as: 'note', color: 'green', text: '국이 너무 짜요.' },
        { as: 'note', color: 'blue', text: '밤에도 VU에\n계산원 있으면 좋겠어요.' }],
      caption: '답변란은 비어 있다.' },
  ] },
]);
