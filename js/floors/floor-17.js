// 17층: 확장 구역의 방(FLOOR17)과 방 내부(FLOOR17_ROOMS). 복도 자체는 world/corridor17.js의 고정 장면이다.
// 복도 벽면 범위는 service-corridor.png의 벽기둥 중심(x=3556, 4282)과 끝벽(4968) 기준이다.
const FLOOR17 = { id: 'f17', floor: 17, short: '17F', label: '17층 · 복도', header: '17F · 00:00', aria: '17층 복도', roomDoorY: 210, rooms: [
  { name: '화장실', target: 'f17-restroom', ...BUILDING_CORE.restroom },
  { name: '관리자 외 출입금지', target: 'f17-manager', x: 4282, width: 686,
    doorX: 4378, doorWidth: 171, doorStyle: 'metal', locked: true,
    message: '관리자실 문이 잠겨 있다. 관리자 외 출입금지 표지와 붉은 출입 표시등이 보인다.' },
] };
const FLOOR17_ROOMS = interiorRooms(17, [
  { id: 'f17-restroom', ...restroomInterior },
  { id: 'f17-manager', name: '관리자실', width: 1800, windowless: true, props: [
    { file: 'electrical-panel', size: [256, 512], worldWidth: 160, x: 170 },
    { file: 'office-desk', size: [512, 256], worldWidth: 400, x: 800 },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 150, x: 1180 },
    { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 300, x: 1540 },
  ] },
]);
