// 별도 가구를 둔 방의 임시 단색 벽에만 배경 그림을 입힌다. preserve는 원래 관찰창·모니터 벽의 월드 좌표다.
const paintedRoomWalls = {
  'f11-sales': { material: 'office' },
  'f11-strategy': { material: 'office', preserve: [[520, 120, 641, 294]] },
  'f11-marketing': { material: 'office' },
  'f13-ops': { material: 'server', preserve: [[240, 129, 907, 233], [1450, 129, 603, 233]] },
  'f13-testbay': { material: 'utility' },
  'f13-secure': { material: 'utility' },
  'f13-training': { material: 'office' },
  'f14-archive': { material: 'office' },
  'f14-data': { material: 'office' },
  'f14-ux': { material: 'lab', preserve: [[180, 120, 701, 252]] },
  'f15-lab': { material: 'lab' },
  'f15-seminar': { material: 'lab' },
  'f15-director': { material: 'office', preserve: [[32, 444, 1760, 112]] },
  'f17-manager': { material: 'utility' },
  'b1-office': { material: 'office' },
  'b1-power': { material: 'utility' },
  'b2-main': { material: 'server' },
  'b2-power': { material: 'utility' },
  'b2-link': { material: 'server' },
};
for (const [id, art] of Object.entries(paintedRoomWalls)) floorById.get(id).wallArt = art;

// walls-layout.json의 유리 전면과 양끝 기둥(48px)은 원래 그림을 보존한다.
const paintedCorridorWalls = {
  '-2': { preserve: [[380, 100, 700, 456], [4300, 100, 400, 456]], pillars: [380, 1080, 3130, 3530, 4300, 4700] },
  '-1': { preserve: [[4530, 100, 220, 456]], pillars: [4290, 4530, 4750, 4960] },
  '2': { preserve: [[1080, 100, 690, 456]], pillars: [40, 1040, 1080, 1770, 4282, 4962] },
  '3': { preserve: [[40, 100, 1000, 456], [1080, 100, 690, 456]], pillars: [40, 1040, 1080, 1770, 4282, 4962] },
  '4': { preserve: [[40, 100, 1000, 456], [1080, 100, 690, 456], [4282, 100, 680, 456]], pillars: [40, 1040, 1080, 1770, 4282, 4962] },
  '5': { preserve: [[40, 100, 1000, 456], [4282, 100, 680, 456]], pillars: [40, 1040, 1080, 1770, 4282, 4962] },
  '6': { preserve: [[40, 100, 1000, 456], [4282, 100, 680, 456]], pillars: [40, 1040, 1080, 1770, 4282, 4962] },
  '8': { preserve: [[1080, 100, 690, 456], [4282, 100, 680, 456]], pillars: [40, 1040, 1080, 1770, 4282, 4962] },
  '9': { preserve: [[40, 100, 1000, 456], [1080, 100, 690, 456], [4282, 100, 680, 456]], pillars: [40, 1040, 1080, 1770, 4282, 4962] },
  '10': { preserve: [[40, 100, 1000, 456], [1080, 100, 690, 456]], pillars: [40, 1040, 1080, 1770, 4282, 4962] },
  '11': { preserve: [[64, 100, 632, 456], [4322, 100, 316, 456]], pillars: [64, 696, 4322, 4638, 4652, 4968] },
  '13': { preserve: [[3090, 100, 460, 456], [4620, 100, 320, 456]], pillars: [3090, 3550, 4290, 4610, 4620, 4940] },
  '14': { preserve: [[560, 100, 640, 456], [1216, 100, 560, 456]], pillars: [64, 544, 560, 1200, 1216, 1776] },
  '15': { preserve: [[64, 100, 860, 456], [954, 100, 620, 456]], pillars: [64, 924, 954, 1574, 3092, 3548] },
  '16': { preserve: [[64, 100, 1060, 456], [1124, 100, 600, 456], [4322, 100, 560, 456]], pillars: [64, 1124, 1724, 4322, 4882] },
};
for (const [floor, art] of Object.entries(paintedCorridorWalls)) {
  floorById.get(floorId(Number(floor))).wallArt = {
    material: Number(floor) < 0 ? 'utility' : Number(floor) === 15 ? 'lab' : 'office', ...art,
  };
}
