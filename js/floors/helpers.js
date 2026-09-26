// 층 데이터 도우미: 층 id·이름·짧은 표기, 방 내부 기본값, 모든 층 공통 화장실 내부.
// 방이 있는 층의 방 내부: 17층 사무실처럼 별도 장면(2400px)이며 왼쪽 문으로 복도에 돌아간다.
// 소품은 충돌 없이 배치하고 message가 있는 것만 조사할 수 있다. 원본 캔버스/앵커는 floor-kit/manifest.json 기준.
const floorId = floor => floor < 0 ? `b${-floor}` : `f${floor}`;
const floorName = floor => floor < 0 ? `지하 ${-floor}층` : `${floor}층`;
const interiorRooms = (floor, rooms) => rooms.map(entry => ({ ...entry, floor, interior: true, parent: floorId(floor),
  label: entry.name, arrival: `${entry.name}에 들어왔습니다.`,
  header: `${floor < 0 ? `B${-floor}` : `${floor}F`} · ${entry.name}`, aria: `${floorName(floor)} ${entry.name}`, width: 2400, background: '#151c20', ...entry }));

// 화장실 내부는 건물 공통 구조라 모든 층이 17층 화장실 배경을 함께 쓴다.
const restroomInterior = { name: '화장실', width: 1800, windowless: true,
  backgroundImage: { src: 'assets/background/floor17/restroom.png', height: 824.84, top: 0 } };

function floorShortLabel(floorValue) {
  if (floorValue === -1) return 'B1';
  if (floorValue === -2) return 'B2';
  if (floorValue === 18) return 'RF';
  return `${String(floorValue).padStart(2, '0')}F`;
}
