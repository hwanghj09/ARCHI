// 16층: FLOOR16_LAYOUT(복도)과 FLOOR16_ROOMS(방 내부). 등록은 registry.js에서 한다.
// 16층 편의시설(1층 층별 안내: The Kitchen / CU 편의점 / Café): 크림색 타일 마감(food 테마). 코어 왼쪽에 벽을 맞댄
// 사내 식당(The Kitchen)·CU 편의점, 화장실 오른쪽 구역에 카페를 둔다. 방 안 폭은 복도 전면 폭의 3.4배(1060/600/560 → 3604/2040/1904).
// CU 셔터는 정전 직전에 내려와 복도에서 열리지 않는다(unlockedBy: 자기 방 id). 식당 안쪽 끝의 주방 반입문(links)으로 편의점
// 창고에 들어가고, 안에서 셔터를 올리고(복도 문으로) 나오면 그 뒤로는 복도에서도 드나든다.
// 단서는 새벽마다 끊기는 냉동고 전원, 정전 직전 SYSTEM이 내린 셔터와 수호의 23:47 영수증, 낮에는 주문도 못 알아듣다가
// 새벽에는 먼저 인사하는 음성 주문 키오스크(ARCHI 시범). 배경은 편의시설 전용 그림이며 문·소품은 별도로 그린다.
// 카페 테이블에는 조현아 팀장이 두고 간 사원증(gives 'f16-badge')이 있고, 이것이 있어야 엘리베이터로 15~12층에 간다(cabin.js).
const FLOOR16_LAYOUT = {
  header: '16F · 편의시설', background: '#1d1b17', theme: 'food',
  backgroundWallsOnly: true,
  backgroundImage: [
    { src: 'assets/background/floor16/amenity-corridor-left.png', left: 0, width: 1800, height: 793 * 570 / 562, top: 0 },
    { src: 'assets/background/floor16/amenity-corridor-core.png', left: 1800, width: 1756, height: 793 * 570 / 601, top: 0 },
    { src: 'assets/background/floor16/amenity-corridor-right.png', left: 3556, width: 1444, height: 793 * 570 / 563, top: 0 },
  ],
  rooms: [
    { name: 'The Kitchen', x: 64, width: 1060, style: 'kitchen', target: 'f16-kitchen',
      doorX: 494, doorWidth: 200, doorStyle: 'cafeteria' },
    { name: 'CU 편의점', x: 1124, width: 600, style: 'store', target: 'f16-cu',
      doorX: 1560, doorWidth: 150, doorY: 262, doorStyle: 'shutter', locked: true, unlockedBy: 'f16-cu',
      message: 'CU 편의점 셔터가 내려와 있다. 셔터 옆 안내문: "셔터가 내려간 뒤에는 식당 주방 반입문으로 출입해 주세요."' },
    { name: 'Café', x: 4322, width: 560, style: 'cafe', target: 'f16-cafe',
      doorX: 4336, doorWidth: 140, doorStyle: 'cafe' },
  ],
  props: [
    { file: 'food-menu-board', size: [256, 512], worldWidth: 70, x: 3330, name: '메뉴 입간판',
      message: '이번 주 식당 메뉴표. 아래쪽 공지: "식당·카페 음성 주문 키오스크 ARCHI 시범 운영 중 · 인식 오류가 잦아 직원이 함께 응대합니다."' },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4925 },
  ],
};
const FLOOR16_ROOMS = interiorRooms(16, [
  { id: 'f16-kitchen', name: 'The Kitchen', width: 3604, interiorStyle: 'tiles',
    backgroundWallsOnly: true,
    backgroundImage: [
      { src: 'assets/background/floor16/amenity-kitchen-dining.png', left: 0, width: 1802, height: 793 * 570 / 571, top: 0 },
      { src: 'assets/background/floor16/amenity-kitchen-service.png', left: 1802, width: 1802, height: 793 * 570 / 591, top: 0 },
    ],
    links: [{ target: 'f16-cu', x: 3460, width: 110, style: 'backdoor' }], props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 100 },
    { file: 'food-dining-table', size: [512, 256], worldWidth: 243, x: 380 },
    { file: 'food-dining-table', size: [512, 256], worldWidth: 243, x: 800 },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1250, name: '주방 게시판',
      message: '주방 근무표 옆 메모: "밤에는 CU가 무인 운영이라 편의점 물품도 주방 반입문으로 들어옴. 반입문 잠그지 말 것."' },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 1560 },
    { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 2040 },
    { file: 'food-serving-counter', size: [512, 256], worldWidth: 326, x: 2330, name: '배식대',
      message: '배식대에 냉동고 온도 기록지가 끼워져 있다. 매일 02:00~05:00 사이 전원이 끊겨 온도가 올라갔다. 메모: "시설팀은 건물 전력 이상 없다고 함. 식자재 또 폐기."' },
    { file: 'food-serving-counter', size: [512, 256], worldWidth: 326, x: 2660 },
    { file: 'staff-lockers', size: [256, 512], worldWidth: 130, x: 2980 },
    { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 198, x: 3250 },
  ] },
  { id: 'f16-cu', name: 'CU 편의점', width: 2040, interiorStyle: 'shelves',
    backgroundWallsOnly: true,
    backgroundImage: { src: 'assets/background/floor16/amenity-cu-interior.png', height: 793 * 570 / 602, top: 0 },
    links: [{ target: 'f16-kitchen', x: 56, width: 110, style: 'backdoor' }], props: [
    { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 290 },
    { file: 'food-refrigerator', size: [256, 512], worldWidth: 96, x: 470, name: '냉장 쇼케이스',
      message: '냉장 쇼케이스 불이 꺼져 있다. 삼각김밥마다 "새벽 전원 차단 · 폐기" 스티커가 붙어 있다. 오늘만의 일이 아닌 것 같다.' },
    { file: 'food-refrigerator', size: [256, 512], worldWidth: 96, x: 600 },
    { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 760 },
    { file: 'food-checkout', size: [512, 256], worldWidth: 312, x: 1150, name: '계산대',
      message: 'POS 화면은 꺼져 있다. 계산대에 영수증 한 장이 걸려 있다: "23:47 · 컵라면 1 · 삼각김밥 1 · 사원증 결제 · 17층 정수호". 아까 야근하다 사 간 야식이다.' },
    { file: 'drink-vending-machine', size: [256, 512], worldWidth: 96, x: 1450 },
    { file: 'electrical-panel', size: [256, 512], worldWidth: 89, x: 1640, name: '셔터 제어함',
      message: '셔터 제어 기록: "23:59 · 셔터 하강 · 명령 SYSTEM". 무인 운영 중에는 셔터를 내리지 않는다고 적혀 있다. 아래의 수동 레버로 안에서는 셔터를 올릴 수 있다.' },
  ] },
  { id: 'f16-cafe', name: 'Café', width: 1904,
    backgroundWallsOnly: true,
    backgroundImage: { src: 'assets/background/floor16/amenity-cafe-interior.png', height: 793 * 570 / 596, top: 0 },
    props: [
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 330 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 560 },
    { file: 'meeting-table', size: [512, 256], worldWidth: 356, x: 950, name: '카페 테이블', gives: 'f16-badge',
      message: '식은 라테 옆에 사원증 한 장이 엎어져 있다: "조현아 · 기술본부 ARCHI 프로젝트 팀장". 저녁에 두고 퇴근한 모양이다. 등록 해제된 수호의 출입증과 달리 아직 살아 있을지 모른다. 챙겼다.',
      takenMessage: '테이블에는 식은 라테만 남아 있다. 조현아 팀장의 사원증은 이미 챙겼다.' },
    { file: 'food-coffee-bar', size: [512, 256], worldWidth: 296, x: 1330, name: '커피 바',
      message: '에스프레소 머신 옆 메모: "음성 주문 키오스크 또 먹통. 낮엔 아메리카노도 못 알아들음." 그 아래 다른 글씨: "새벽 청소 여사님 말로는 키오스크가 먼저 인사했대."' },
    { file: 'rolling-whiteboard', size: [512, 256], worldWidth: 350, x: 1690, name: '고객의 소리 게시판',
      message: '포스트잇 한 장: "키오스크가 제가 매일 몇 시에 와서 뭘 시키는지 다 알아요. 좀 무섭습니다." 답변란은 비어 있다.' },
  ] },
]);
