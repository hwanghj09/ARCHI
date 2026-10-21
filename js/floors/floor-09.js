// 9층은 탐색용 공간이다. 기획 외 단서·인증·통화 이벤트는 두지 않는다.
// 방 배치·배경·출구·가구는 유지한다(2차 작업의 단서 상호작용 정리).
const FLOOR9_CEILING = 100;
const FLOOR9_ROW0 = 82;
const FLOOR9_SCALE_Y = (570 - FLOOR9_CEILING) / (438 - FLOOR9_ROW0);
const floor9Y = row => Math.round(FLOOR9_CEILING + (row - FLOOR9_ROW0) * FLOOR9_SCALE_Y);
const FLOOR9_BACKGROUND = 'linear-gradient(#100c0e, #171215)';
const floor9Scene = (name, width) => [
  { src: `assets/background/floor09/floor09-ceiling-${name}.png`, width, height: FLOOR9_CEILING, top: 0 },
  { src: `assets/background/floor09/floor09-floor-${name}.png`, width, height: 204, top: 556 },
  { src: `assets/background/floor09/floor09-${name}-interior.png`, width, height: floor9Y(442) - FLOOR9_CEILING, top: FLOOR9_CEILING }];
const FLOOR9_LAYOUT = {
  header: '9F · TmaxTibero 사업본부', background: FLOOR9_BACKGROUND, theme: 'business',
  backgroundWallsOnly: true, backgroundImage: { src: 'assets/background/floor09/walls.png', height: 760, top: 0 },
  rooms: [
    { name: '사업 업무 공간', x: 40, width: 1000, style: 'painted', target: 'f9-office',
      doorX: 849, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor04/door-lab.png' },
    { name: '영업·고객 관리 구역', x: 1080, width: 690, style: 'painted', target: 'f9-sales',
      doorX: 1351, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor04/door-lab.png' },
    { name: '프로젝트룸', x: 4282, width: 680, style: 'painted', target: 'f9-project',
      doorX: 4608, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor04/door-meeting.png' },
  ],
  fixtures: [],
  props: [
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 3980 },
    { file: 'brochure-rack', size: [256, 512], worldWidth: 100, x: 4190 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 3480 },
  ],
};
const floor9Room = (id, name, art, width, fixtures, extra = {}) => ({ id, name, width, background: FLOOR9_BACKGROUND,
  backgroundWallsOnly: true, backgroundImage: floor9Scene(art, width), fixtures, ...extra });
const FLOOR9_ROOMS = interiorRooms(9, [
  floor9Room('f9-office', '사업 업무 공간', 'office', 2998, [], { exitX: 2742, exitBay: 322 }),
  floor9Room('f9-sales', '영업·고객 관리 구역', 'sales', 2168, [], { exitX: 930, exitBay: 322 }),
  floor9Room('f9-project', '프로젝트룸', 'project', 2162, [], { windowless: true, exitX: 1906, exitBay: 322 }),
]);
