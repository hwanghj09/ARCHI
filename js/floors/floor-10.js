// 10층은 탐색용 공간이다. 기획 외 단서·인증·통화 이벤트는 두지 않는다.
// 방 배치·배경·출구·가구는 유지한다(2차 작업의 단서 상호작용 정리).
const FLOOR10_CEILING = 100;
const FLOOR10_ROW0 = 82;
const FLOOR10_SCALE_Y = (570 - FLOOR10_CEILING) / (438 - FLOOR10_ROW0);
const floor10Y = row => Math.round(FLOOR10_CEILING + (row - FLOOR10_ROW0) * FLOOR10_SCALE_Y);
const FLOOR10_BACKGROUND = 'linear-gradient(#0b1311, #111b18)';
const floor10Scene = (name, width) => [
  { src: `assets/background/floor10/floor10-ceiling-${name}.png`, width, height: FLOOR10_CEILING, top: 0 },
  { src: `assets/background/floor10/floor10-floor-${name}.png`, width, height: 204, top: 556 },
  { src: `assets/background/floor10/floor10-${name}-interior.png`, width, height: floor10Y(442) - FLOOR10_CEILING, top: FLOOR10_CEILING }];
const FLOOR10_LAYOUT = {
  header: '10F · 경영관리본부', background: FLOOR10_BACKGROUND, theme: 'finance',
  backgroundWallsOnly: true, backgroundImage: { src: 'assets/background/floor10/walls.png', height: 760, top: 0 },
  rooms: [
    { name: '경영관리 사무실', x: 40, width: 1000, style: 'painted', target: 'f10-office',
      doorX: 369, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor04/door-lab.png' },
    { name: '임원 회의실', x: 1080, width: 690, style: 'painted', target: 'f10-meeting',
      doorX: 1344, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor04/door-meeting.png' },
    { name: '임원실', x: 4282, width: 680, style: 'painted', target: 'f10-executive',
      doorX: 4321, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor04/door-meeting.png' },
  ],
  fixtures: [
    // 숨는 환풍구(동쪽 끝 벽, 임원 회의실 문 너머). 안에서는 철판 벽과 동쪽 기둥이 보인다.
    wallVent(4600, 4300),
  ],
  props: [
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 240, x: 3260 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3500 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 3980 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4200 },
  ],
};
const floor10Room = (id, name, art, width, fixtures, extra = {}) => ({ id, name, width, background: FLOOR10_BACKGROUND,
  backgroundWallsOnly: true, backgroundImage: floor10Scene(art, width), fixtures, ...extra });
const FLOOR10_ROOMS = interiorRooms(10, [
  floor10Room('f10-office', '경영관리 사무실', 'office', 3000, [], { exitX: 126, exitBay: 322 }),
  floor10Room('f10-meeting', '임원 회의실', 'meeting', 2166, [], { exitX: 126, exitBay: 322 }),
  floor10Room('f10-executive', '임원실', 'executive', 2144, [], { exitX: 126, exitBay: 322 }),
]);
