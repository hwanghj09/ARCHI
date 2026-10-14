// 층 목록과 id 조회표. 새 층은 FLOOR_LAYOUTS와 floorById 두 곳에 등록한다.
const FLOOR_LAYOUTS = { 1: FLOOR1_LAYOUT, 2: FLOOR2_LAYOUT, 3: FLOOR3_LAYOUT, 4: FLOOR4_LAYOUT, 5: FLOOR5_LAYOUT, 6: FLOOR6_LAYOUT, 7: FLOOR7_LAYOUT, 8: FLOOR8_LAYOUT, 9: FLOOR9_LAYOUT, 10: FLOOR10_LAYOUT, 11: FLOOR11_LAYOUT, 12: FLOOR12_LAYOUT, 13: FLOOR13_LAYOUT, 14: FLOOR14_LAYOUT, 15: FLOOR15_LAYOUT, 16: FLOOR16_LAYOUT, [-1]: B1_LAYOUT, [-2]: B2_LAYOUT };

// Additional floors share an empty layout until their content is authored.
const FLOOR_NUMBERS = [-2, -1, ...Array.from({ length: 16 }, (_, index) => index + 1)];
const FLOORS = FLOOR_NUMBERS.map(floor => {
  const short = floor < 0 ? `B${-floor}` : `${floor}F`;
  const layout = FLOOR_LAYOUTS[floor] || {};
  return { id: floorId(floor), floor, short, label: floorName(floor),
    header: `${short} · 빈 층`, aria: floorName(floor), background: '#252b2a', ...layout,
    // 인증은 하차 후 로비 양쪽 칸막이에서 한다. 한 번 인증하면 그 층의 양쪽 통로가 열린다.
    barriers: [...(layout.barriers || []), ...([12, 13, 14, 15].includes(floor) ? [1774, 2740].map((x, index) => ({
      name: `${floor}층 ${index ? '동쪽' : '서쪽'} 인증 게이트`, x, y: 128, width: 32,
      style: 'access-gate', accessGate: true, requires: 'f16-badge', gives: `f${floor}-access`,
      message: '조현아 팀장 사원증 인증 완료. 유리 칸막이가 열렸다. 이 층의 업무 구역으로 들어갈 수 있다.',
      missingMessage: '사원증을 리더에 태그해야 한다. 출입증이 없으면 업무 구역으로 들어갈 수 없다.',
      takenMessage: '인증이 완료된 게이트다. 통과할 수 있다.',
    })) : [])],
    // restroomOverride: elevatorOffsets와 같은 목적으로, 그 층 그림 속 화장실 문이 BUILDING_CORE.restroom
    // 좌표와 어긋날 때만 그 층의 doorX/doorWidth/doorY를 보정한다(다른 층은 그대로).
    rooms: [...(layout.rooms || []), { name: '화장실', target: `${floorId(floor)}-restroom`, ...BUILDING_CORE.restroom, ...(layout.restroomOverride || {}) }],
    width: BUILDING_CORE.width };
});
const RESTROOMS = FLOORS.flatMap(config => {
  const id = `${config.id}-restroom`;
  const front = config.rooms.find(room => room.target === id);
  return interiorRooms(config.floor, [{ id, ...restroomForFront(front) }]);
});
const ALL_FLOORS = [FLOOR17, ...FLOORS];
const ROOFTOP = { id: 'rooftop', floor: 18, label: '옥상', header: 'RF · 옥상', aria: '옥상', width: 2400, background: '#11191d',
  fixtures: [
    { name: '태양광 작업 설명서', x: 810, y: 410, width: 72, height: 5, style: 'power-notice',
      surface: 'document', look: 'sheet',
      message: '태양광 임시 전력 장치 — 비상 운용 안내\n\n① 축전지 잔량을 확인하십시오.\n② 공급 대상을 선택하십시오.\n③ ‘비상 전력 공급’ 버튼을 누르십시오.\n\n비상 전력은 지정된 조명, 작업용 컴퓨터 및 통신 장비에 우선 공급됩니다.\n\n전용 앱을 설치하면 휴대폰으로 전력 공급 상태를 확인하고 원격으로 제어할 수 있습니다.\n앱 다운로드 및 장치 등록에는 작업용 컴퓨터를 이용하십시오.',
      writing: [
        { as: 'title', text: '태양광 임시 전력 장치 — 비상 운용 안내' },
        '① 축전지 잔량을 확인하십시오.',
        '② 공급 대상을 선택하십시오.',
        '③ ‘비상 전력 공급’ 버튼을 누르십시오.',
        '비상 전력은 지정된 조명, 작업용 컴퓨터 및 통신 장비에 우선 공급됩니다.',
        { text: '전용 앱을 설치하면 휴대폰으로 전력 공급 상태를 확인하고 원격으로 제어할 수 있습니다.', bold: true },
        '앱 다운로드 및 장치 등록에는 작업용 컴퓨터를 이용하십시오.',
      ] },
  ] };
const floorById = new Map([...ALL_FLOORS, ROOFTOP, ...FLOOR1_ROOMS, ...FLOOR2_ROOMS, ...FLOOR3_ROOMS, ...FLOOR4_ROOMS, ...FLOOR5_ROOMS, ...FLOOR6_ROOMS, ...FLOOR7_ROOMS, ...FLOOR8_ROOMS, ...FLOOR9_ROOMS, ...FLOOR10_ROOMS, ...FLOOR11_ROOMS, ...FLOOR12_ROOMS, ...FLOOR13_ROOMS, ...FLOOR14_ROOMS, ...FLOOR15_ROOMS, ...FLOOR16_ROOMS, ...FLOOR17_ROOMS, ...B1_ROOMS, ...B2_ROOMS, ...RESTROOMS].map(entry => [entry.id, entry]));
// 충전 콘센트는 방 안의 PC 책상·카페 테이블 옆에만 둔다.
for (const config of floorById.values()) {
  if (!config.interior) continue;
  const desk = (config.props || []).find(prop => ['office-desk', 'support-workstation', 'research-workstation', 'training-workstation', 'food-cafe-table'].includes(prop.file));
  if (!desk) continue;
  // 소품 그림의 상판 높이(px)를 월드 높이로 맞춰 휴대폰이 책상 위에 놓이게 한다.
  const tabletop = { 'office-desk': 112, 'support-workstation': 124, 'research-workstation': 120, 'training-workstation': 132, 'food-cafe-table': 136 }[desk.file];
  const tabletopY = floorY - (desk.base || 0) - (desk.size[1] - 8 - tabletop) * desk.worldWidth / desk.size[0];
  config.fixtures = [...(config.fixtures || []), { ...phoneChargerFixture(desk.x + desk.worldWidth / 2 - 72, tabletopY),
    floor: config.floor, scene: config.id }];
}
