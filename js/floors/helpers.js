// 층 데이터 도우미: 층 id·이름·짧은 표기, 방 내부 기본값, 모든 층 공통 화장실 내부.
// 방이 있는 층의 방 내부는 17층 사무실처럼 별도 장면이며 출입문으로 복도에 돌아간다.
// 소품은 충돌 없이 배치하고 message가 있는 것만 조사할 수 있다. 원본 캔버스/앵커는 floor-kit/manifest.json 기준.
// exitBay: 2~10층 방 그림에 출구 문 자리로 끼운 앞벽 칸의 폭(cutaway_kit.door_bay). 방 폭 비율 검사에서만 뺀다.
const floorId = floor => floor < 0 ? `b${-floor}` : `f${floor}`;
const floorName = floor => floor < 0 ? `지하 ${-floor}층` : `${floor}층`;
const interiorRooms = (floor, rooms) => rooms.map(entry => ({ ...entry, floor, interior: true, parent: floorId(floor),
  label: entry.name, arrival: `${entry.name}에 들어왔습니다.`,
  header: `${floor < 0 ? `B${-floor}` : `${floor}F`} · ${entry.name}`, aria: `${floorName(floor)} ${entry.name}`, width: 2400, background: '#151c20', ...entry }));

// 화장실 내부는 건물 공통 구조라 모든 층이 17층 화장실 배경을 함께 쓴다. 설비는 배경 그림 속 물건 자리에 둔다:
// 거울은 판정을 가운데 세면대 앞에 두고 테두리(outline)만 거울 전체에 맞추고, 화장실 칸은 문이 열린 첫 칸이다
// (판정은 변기 앞, 테두리는 칸 전체. 칸 앞의 미끄럼 주의 표지와 판정이 겹치지 않게 오른쪽으로 비켜 둔다).
// 비상 호출 버튼은 닫힌 칸 문의 표시등 패널이다.
// 그림과 설비의 비율은 유지하고, 복도 입구가 오른쪽에 있는 층은 왼쪽 벽을 더 이어 붙인다.
const restroomInterior = { name: '화장실', width: 1800, windowless: true, exitX: 185, exitWidth: 145, exitStyle: 'restroom-exit',
  backgroundImage: { src: 'assets/background/floor17/restroom-finished.png', height: 760, top: 0 },
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

function restroomForFront(front) {
  const ratio = (front.doorX - front.x) / (front.width - front.doorWidth);
  const padding = Math.round((ratio * (restroomInterior.width - 64 - restroomInterior.exitWidth) -
    (restroomInterior.exitX - 32)) / (1 - ratio));
  if (!padding) return restroomInterior;
  return { ...restroomInterior, width: restroomInterior.width + padding,
    exitX: restroomInterior.exitX + padding, leftWallExtension: padding,
    backgroundImage: { ...restroomInterior.backgroundImage, width: restroomInterior.width, left: padding },
    props: restroomInterior.props.map(prop => ({ ...prop, x: prop.x + padding })),
    fixtures: restroomInterior.fixtures.map(fixture => ({ ...fixture, x: fixture.x + padding,
      ...(fixture.outline ? { outline: [fixture.outline[0] + padding, ...fixture.outline.slice(1)] } : {}) })) };
}

function floorShortLabel(floorValue) {
  if (floorValue === -1) return 'B1';
  if (floorValue === -2) return 'B2';
  if (floorValue === 18) return 'RF';
  return `${String(floorValue).padStart(2, '0')}F`;
}
// 책상 아래 콘센트에 충전기를 꽂고 휴대폰을 책상에 둔다. 전력은 해당 층 공급을 따른다.
function phoneChargerFixture(x, tabletopY = 450) {
  return { name: '휴대폰 충전 콘센트', x, y: 530, width: 24, height: 32, phoneTop: Math.round(tabletopY) - 574,
    style: 'phone-charger', phoneCharger: true, reach: 48,
    message: '콘센트에 충전기를 꽂고 휴대폰을 책상에 두어 충전한다. 같은 자리에서 다시 가져가자.' };
}
