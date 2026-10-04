// 층 목록과 id 조회표. 새 층은 FLOOR_LAYOUTS와 floorById 두 곳에 등록한다.
const FLOOR_LAYOUTS = { 1: FLOOR1_LAYOUT, 2: FLOOR2_LAYOUT, 3: FLOOR3_LAYOUT, 4: FLOOR4_LAYOUT, 5: FLOOR5_LAYOUT, 6: FLOOR6_LAYOUT, 7: FLOOR7_LAYOUT, 8: FLOOR8_LAYOUT, 9: FLOOR9_LAYOUT, 10: FLOOR10_LAYOUT, 11: FLOOR11_LAYOUT, 12: FLOOR12_LAYOUT, 13: FLOOR13_LAYOUT, 14: FLOOR14_LAYOUT, 15: FLOOR15_LAYOUT, 16: FLOOR16_LAYOUT, [-1]: B1_LAYOUT, [-2]: B2_LAYOUT };

// Additional floors share an empty layout until their content is authored.
const FLOOR_NUMBERS = [-2, -1, ...Array.from({ length: 16 }, (_, index) => index + 1)];
const FLOORS = FLOOR_NUMBERS.map(floor => {
  const short = floor < 0 ? `B${-floor}` : `${floor}F`;
  const layout = FLOOR_LAYOUTS[floor] || {};
  // 그 층 그림에 맞춘 1·2번 승강기 사이 벽면에 둔다. 12층의 좁은 간격도 문을 덮지 않는다.
  const firstEnd = BUILDING_CORE.elevators[0].x + (layout.elevatorOffsets?.[0] ?? 0) +
    BUILDING_CORE.elevators[0].width + (layout.elevatorWidthDeltas?.[0] ?? 0);
  const secondStart = BUILDING_CORE.elevators[1].x + (layout.elevatorOffsets?.[1] ?? 0);
  return { id: floorId(floor), floor, short, label: floorName(floor),
    header: `${short} · 빈 층`, aria: floorName(floor), background: '#252b2a', ...layout,
    fixtures: [...(layout.fixtures || []), phoneChargerFixture(Math.round((firstEnd + secondStart) / 2 - 20))],
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
// restroomExitX: 층 레이아웃에 있으면, 자동 계산되는 화장실 출구 스폰 위치를 그 값으로 덮어쓴다
// (다른 층은 그대로 자동 계산).
const RESTROOMS = FLOOR_NUMBERS.flatMap(floor => interiorRooms(floor, [{ id: `${floorId(floor)}-restroom`, ...restroomInterior,
  ...(FLOOR_LAYOUTS[floor]?.restroomExitX !== undefined ? { exitX: FLOOR_LAYOUTS[floor].restroomExitX } : {}) }]));
const ALL_FLOORS = [FLOOR17, ...FLOORS];
const ROOFTOP = { id: 'rooftop', floor: 18, label: '옥상', header: 'RF · 옥상', aria: '옥상', width: 2400, background: '#11191d',
  fixtures: [phoneChargerFixture(1200, 64)] };
const floorById = new Map([...ALL_FLOORS, ROOFTOP, ...FLOOR1_ROOMS, ...FLOOR2_ROOMS, ...FLOOR3_ROOMS, ...FLOOR4_ROOMS, ...FLOOR5_ROOMS, ...FLOOR6_ROOMS, ...FLOOR7_ROOMS, ...FLOOR8_ROOMS, ...FLOOR9_ROOMS, ...FLOOR10_ROOMS, ...FLOOR11_ROOMS, ...FLOOR12_ROOMS, ...FLOOR13_ROOMS, ...FLOOR14_ROOMS, ...FLOOR15_ROOMS, ...FLOOR16_ROOMS, ...FLOOR17_ROOMS, ...B1_ROOMS, ...B2_ROOMS, ...RESTROOMS].map(entry => [entry.id, entry]));
