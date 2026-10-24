// 3층은 탐색용 공간이다. 기획 외 단서·인증·통화 이벤트는 두지 않는다.
// 방 배치·배경·출구·가구는 유지한다(2차 작업의 단서 상호작용 정리).
const FLOOR3_CEILING = 100;
const FLOOR3_ROW0 = 82;
const FLOOR3_SCALE_Y = (570 - FLOOR3_CEILING) / (438 - FLOOR3_ROW0);
const floor3Y = row => Math.round(FLOOR3_CEILING + (row - FLOOR3_ROW0) * FLOOR3_SCALE_Y);
const FLOOR3_BACKGROUND = 'linear-gradient(#100f0e, #191715)';
const floor3Scene = (name, width) => [
  { src: `assets/background/floor03/floor03-ceiling-${name}.png`, width, height: FLOOR3_CEILING, top: 0 },
  { src: `assets/background/floor03/floor03-floor-${name}.png`, width, height: 204, top: 556 },
  { src: `assets/background/floor03/floor03-${name}-interior.png`, width, height: floor3Y(442) - FLOOR3_CEILING, top: FLOOR3_CEILING }];
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
    // 숨는 환풍구(동쪽 끝 벽, 고객만족센터 문 너머). 안에서는 철판 벽과 동쪽 기둥이 보인다.
    wallVent(4660, 4300),
  ],
  props: [
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3360 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 3980 },
    { file: 'restroom-bin', size: [256, 256], worldWidth: 55, x: 4200 },
    { file: 'instrument-cart', size: [256, 256], worldWidth: 113, x: 3460, name: '청소 카트' },
  ],
};
const floor3Room = (id, name, art, width, fixtures, extra = {}) => ({ id, name, width, background: FLOOR3_BACKGROUND,
  backgroundWallsOnly: true, backgroundImage: floor3Scene(art, width), fixtures, ...extra });
const FLOOR3_ROOMS = interiorRooms(3, [
  floor3Room('f3-fitness', 'Fitness Club', 'gym', 3108, [], { exitX: 2742, exitBay: 432 }),
  floor3Room('f3-cs', '고객만족센터', 'cs', 2168, [], { exitX: 954, exitBay: 322 }),
  floor3Room('f3-studio', 'Studio', 'studio', 1840, [], { windowless: true }),
]);
