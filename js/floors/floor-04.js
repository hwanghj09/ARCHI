// 4층은 탐색용 공간이다. 기획 외 단서·인증·통화 이벤트는 두지 않는다.
// 방 배치·배경·출구·가구는 유지한다(2차 작업의 단서 상호작용 정리).
const FLOOR4_CEILING = 100;
const FLOOR4_ROW0 = 82;
const FLOOR4_SCALE_Y = (570 - FLOOR4_CEILING) / (438 - FLOOR4_ROW0);
const floor4Y = row => Math.round(FLOOR4_CEILING + (row - FLOOR4_ROW0) * FLOOR4_SCALE_Y);
const FLOOR4_BACKGROUND = 'linear-gradient(#0b1113, #131b1d)';
const floor4Scene = (name, width) => [
  { src: `assets/background/floor04/floor04-ceiling-${name}.png`, width, height: FLOOR4_CEILING, top: 0 },
  { src: `assets/background/floor04/floor04-floor-${name}.png`, width, height: 204, top: 556 },
  { src: `assets/background/floor04/floor04-${name}-interior.png`, width, height: floor4Y(442) - FLOOR4_CEILING, top: FLOOR4_CEILING }];
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
      doorX: 4786, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor04/door-meeting.png' },
  ],
  fixtures: [],
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
  floor4Room('f4-lab', '연구개발 업무 공간', 'lab', 2998, [], { exitX: 126, exitBay: 322 }),
  // 방 안 x = 원본 x - 1000(원본 1656 앞) · 원본 x - 628(원본 1656부터)
  floor4Room('f4-dev', '개발자 업무 구역', 'dev', 2168, [], { exitX: 126, exitBay: 322 }),
  // 방 안 x = 원본 x - 2462(원본 3044 앞) · 원본 x - 1312(원본 3044부터). 늘린 구간(582..1732)에 둘째 회의 테이블이 있다.
  floor4Room('f4-meeting', '연구 회의실', 'meeting', 2162, [], { windowless: true, exitX: 1410, exitBay: 322 }),
]);
