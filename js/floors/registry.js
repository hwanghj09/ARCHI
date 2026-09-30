// 층 목록과 id 조회표. 새 층은 FLOOR_LAYOUTS와 floorById 두 곳에 등록한다.
const FLOOR_LAYOUTS = { 1: FLOOR1_LAYOUT, 2: FLOOR2_LAYOUT, 3: FLOOR3_LAYOUT, 4: FLOOR4_LAYOUT, 5: FLOOR5_LAYOUT, 6: FLOOR6_LAYOUT, 7: FLOOR7_LAYOUT, 8: FLOOR8_LAYOUT, 9: FLOOR9_LAYOUT, 10: FLOOR10_LAYOUT, 11: FLOOR11_LAYOUT, 12: FLOOR12_LAYOUT, 13: FLOOR13_LAYOUT, 14: FLOOR14_LAYOUT, 15: FLOOR15_LAYOUT, 16: FLOOR16_LAYOUT, [-1]: B1_LAYOUT, [-2]: B2_LAYOUT };

// Additional floors share an empty layout until their content is authored.
const FLOOR_NUMBERS = [-2, -1, ...Array.from({ length: 16 }, (_, index) => index + 1)];
const FLOORS = FLOOR_NUMBERS.map(floor => {
  const short = floor < 0 ? `B${-floor}` : `${floor}F`;
  const layout = FLOOR_LAYOUTS[floor] || {};
  return { id: floorId(floor), floor, short, label: floorName(floor),
    header: `${short} · 빈 층`, aria: floorName(floor), background: '#252b2a', ...layout,
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
const ROOFTOP = { id: 'rooftop', floor: 18, label: '옥상', header: 'RF · 옥상', aria: '옥상', width: 2400, background: '#11191d' };
const floorById = new Map([...ALL_FLOORS, ROOFTOP, ...FLOOR1_ROOMS, ...FLOOR2_ROOMS, ...FLOOR3_ROOMS, ...FLOOR4_ROOMS, ...FLOOR5_ROOMS, ...FLOOR6_ROOMS, ...FLOOR7_ROOMS, ...FLOOR8_ROOMS, ...FLOOR9_ROOMS, ...FLOOR10_ROOMS, ...FLOOR11_ROOMS, ...FLOOR12_ROOMS, ...FLOOR13_ROOMS, ...FLOOR14_ROOMS, ...FLOOR15_ROOMS, ...FLOOR16_ROOMS, ...FLOOR17_ROOMS, ...B1_ROOMS, ...B2_ROOMS, ...RESTROOMS].map(entry => [entry.id, entry]));
