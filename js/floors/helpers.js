// 층 데이터 도우미: 층 id·이름·짧은 표기, 방 내부 기본값, 모든 층 공통 화장실 내부.
// 방이 있는 층의 방 내부: 17층 사무실처럼 별도 장면(2400px)이며 왼쪽 문으로 복도에 돌아간다.
// 소품은 충돌 없이 배치하고 message가 있는 것만 조사할 수 있다. 원본 캔버스/앵커는 floor-kit/manifest.json 기준.
const floorId = floor => floor < 0 ? `b${-floor}` : `f${floor}`;
const floorName = floor => floor < 0 ? `지하 ${-floor}층` : `${floor}층`;
const interiorRooms = (floor, rooms) => rooms.map(entry => ({ ...entry, floor, interior: true, parent: floorId(floor),
  label: entry.name, arrival: `${entry.name}에 들어왔습니다.`,
  header: `${floor < 0 ? `B${-floor}` : `${floor}F`} · ${entry.name}`, aria: `${floorName(floor)} ${entry.name}`, width: 2400, background: '#151c20', ...entry }));

// 화장실 내부는 건물 공통 구조라 모든 층이 17층 화장실 배경을 함께 쓴다. 설비는 배경 그림 속 물건 자리에 둔다:
// 거울은 판정을 가운데 세면대 앞에 두고 테두리(outline)만 거울 전체에 맞추고, 화장실 칸은 문이 열린 첫 칸이다
// (판정은 변기 앞, 테두리는 칸 전체. 칸 앞의 미끄럼 주의 표지와 판정이 겹치지 않게 오른쪽으로 비켜 둔다).
// 비상 호출 버튼은 닫힌 칸 문의 표시등 패널이다.
const restroomInterior = { name: '화장실', width: 1800, windowless: true,
  backgroundImage: { src: 'assets/background/floor17/restroom.png', height: 824.84, top: 0 },
  fixtures: [
    { name: '세면대 거울', x: 520, y: 250, width: 260, height: 180, outline: [411, 216, 503, 183],
      message: '거울 아래 세면대에 물방울이 남아 있다. 정전 직전까지 누군가 이곳을 사용한 것 같다.' },
    { name: '화장실 칸', x: 1190, y: 185, width: 90, height: 385, outline: [1072, 185, 228, 385],
      message: '칸문은 반쯤 열려 있고 안은 비어 있다. 문 안쪽에 오래된 순찰 시간표가 붙어 있다.' },
    { name: '비상 호출 버튼', x: 1376, y: 372, width: 22, height: 36,
      message: '비상 호출 버튼의 표시등이 꺼져 있다. 정전 중에는 작동하지 않는다.' },
  ],
  props: [
    { file: 'restroom-supply-cabinet', size: [256, 512], worldWidth: 80, x: 90, name: '위생용품 수납장',
      message: '종이타월과 여분의 휴지가 가지런히 놓여 있다.' },
    { file: 'restroom-bin', size: [256, 256], worldWidth: 55, x: 380, name: '휴지통',
      message: '휴지통에는 종이타월과 빈 커피쾌 하나뿐이다. 커피쾌 밑면에 16층 카페 스티커가 붙어 있다.' },
    { file: 'wet-floor-sign', size: [256, 256], worldWidth: 72, x: 1130, name: '미끄럼 주의 표지',
      message: '세면대와 칸막이 사이에 미끄럼 주의 표지가 세워져 있다. 바닥은 이미 말라 있다.' },
  ] };

function floorShortLabel(floorValue) {
  if (floorValue === -1) return 'B1';
  if (floorValue === -2) return 'B2';
  if (floorValue === 18) return 'RF';
  return `${String(floorValue).padStart(2, '0')}F`;
}
// 해당 층 전력으로 작동하는 USB 충전함. 휴대폰을 두고 갔다가 다시 찾아갈 수 있다.
function phoneChargerFixture(x, width = 40) {
  return { name: '비상 휴대폰 충전함', x, y: 348, width, height: 104, style: 'phone-charger', phoneCharger: true,
    lines: ['USB-C', '휴대폰 충전'], message: '전력이 공급될 때 휴대폰을 맡겨 충전할 수 있다. 같은 충전함에서 다시 가져가자.' };
}
