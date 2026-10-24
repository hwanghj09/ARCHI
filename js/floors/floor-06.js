// 6층은 탐색용 공간이다. 기획 외 단서·인증·통화 이벤트는 두지 않는다.
// 방 배치·배경·출구·가구는 유지한다(2차 작업의 단서 상호작용 정리).
const FLOOR6_CEILING = 100;
const FLOOR6_ROW0 = 82;
const FLOOR6_SCALE_Y = (570 - FLOOR6_CEILING) / (438 - FLOOR6_ROW0);
const floor6Y = row => Math.round(FLOOR6_CEILING + (row - FLOOR6_ROW0) * FLOOR6_SCALE_Y);
const FLOOR6_BACKGROUND = 'linear-gradient(#10110b, #181a12)';
const floor6Scene = (name, width) => [
  { src: `assets/background/floor06/floor06-ceiling-${name}.png`, width, height: FLOOR6_CEILING, top: 0 },
  { src: `assets/background/floor06/floor06-floor-${name}.png`, width, height: 204, top: 556 },
  { src: `assets/background/floor06/floor06-${name}-interior.png`, width, height: floor6Y(442) - FLOOR6_CEILING, top: FLOOR6_CEILING }];
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
      doorX: 4782, doorWidth: 130, doorY: 250, doorSprite: 'assets/objects/floor06/door-meeting.png' },
  ],
  fixtures: [
    // 숨는 환풍구(엔지니어링 구역 문과 엘리베이터 사이 흰 벽). 안에서는 서쪽 기둥과 흰 벽이 보인다.
    wallVent(1572, 1300),
  ],
  props: [
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 240, x: 3250 },
    { file: 'waiting-sofa', size: [512, 256], worldWidth: 250, x: 3980 },
    { file: 'large-planter', size: [256, 512], worldWidth: 78, x: 4200 },
    { file: 'water-cooler', size: [256, 512], worldWidth: 62, x: 3470 },
  ],
};
const floor6Room = (id, name, art, width, fixtures, extra = {}) => ({ id, name, width, background: FLOOR6_BACKGROUND,
  backgroundWallsOnly: true, backgroundImage: floor6Scene(art, width), fixtures, ...extra });
const FLOOR6_ROOMS = interiorRooms(6, [
  floor6Room('f6-work', '기술 개발 업무 공간', 'work', 3108, [], { exitX: 126, exitBay: 432 }),
  // 숨는 환풍구: 출구 오른쪽, 사물함 사이의 맨 벽(그림 975~1165). 안에서는 사물함과 작업대 쪽 벽이 보인다.
  floor6Room('f6-engineering', '공용 엔지니어링 구역', 'engineering', 2168, [wallVent(1004, 1300)], { exitX: 749, exitBay: 322 }),
  floor6Room('f6-meeting', '기술 회의실', 'meeting', 2162, [], { windowless: true, exitX: 1906, exitBay: 322 }),
]);
