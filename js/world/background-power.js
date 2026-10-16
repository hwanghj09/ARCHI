// 이미 빛이 그려진 배경은 별도 소등 그림으로 바꾼다. 원본·배치·충돌 좌표는 유지한다.
const switchableBackgrounds = new Set([
  'floor17/office-interior-aligned-finished', 'floor17/floor17-finished', 'floor17/service-corridor-finished', 'floor17/restroom-finished',
  'floor7/corridor-finished', 'floor7/vip-finished',
  'floor17/office-interior-aligned', 'floor17/floor17', 'floor17/service-corridor', 'floor17/restroom',
  'floor7/corridor', 'floor7/vip',
  'floor16/amenity-corridor-left', 'floor16/amenity-corridor-core', 'floor16/amenity-corridor-right',
  'floor16/amenity-kitchen-dining', 'floor16/amenity-kitchen-service',
  'floor16/amenity-cu-interior', 'floor16/amenity-cafe-interior',
  'floor16/floor16-corridor', 'floor16/floor16-kitchen', 'floor16/floor16-cu', 'floor16/floor16-cafe',
].map(name => `assets/background/${name}.png`));

// 비상구 유도등은 전기 없이도 빛난다. 층마다 다르게 그려진 표시판을 공용 그림 한 장으로 덮어 모양을 맞추고, 어둠 막 위에 둔다.
// [x, y, 폭, 높이]는 배경 원본 픽셀 기준이다. 표시판은 문 위에 두고 원래 그려진 표시판을 덮는다. 계단 문 위 표시판은 문 그림(위쪽 y=232)에 걸리지 않게 그 위에 둔다.
const exitSignSrc = 'assets/objects/floor-kit/exit-sign.png';
const luminousSigns = {
  'floor1/clinic': [1860, 720, [[888, 211, 71, 46]]],
  'floor1/clinic-finished': [1860, 760, [[888, 211, 71, 46]]],
  'floor1/corridor': [5000, 720, [[2941, 193, 54, 35]]],
  'floor1/corridor-finished': [5000, 760, [[2941, 193, 54, 35]]],
  'floor1/corridor-unified-finished': [5000, 760, [[2941, 193, 54, 35]]],
  'floor1/vision': [2356, 720, [[270, 270, 49, 32]]],
  'floor1/vision-finished': [2356, 760, [[270, 270, 49, 32]]],
  'floor7/corridor': [5000, 720, [[2921, 190, 58, 38]]],
  'floor7/corridor-finished': [5000, 760, [[2921, 190, 58, 38]]],
  'floor12/corridor': [5000, 720, [[2847, 197, 48, 31]]],
  'floor12/dev': [3600, 720, [[210, 98, 68, 44]]],
  'floor12/eval': [1804, 720, [[400, 215, 51, 33]]],
  'floor12/office': [3280, 720, [[1587, 220, 58, 38]]],
  'floor12/corridor-finished': [5000, 760, [[2847, 197, 48, 31]]],
  'floor12/eval-finished': [1804, 760, [[400, 215, 51, 33]]],
  'floor12/office-finished': [3280, 760, [[1587, 220, 58, 38]]],
  'floor17/floor17': [3328, 768, [[2962, 182, 68, 44]]],
  'floor17/floor17-finished': [3328, 760, [[2962, 182, 68, 44]]],
};

// image는 이미 자리(style left/top/width/height)를 잡고 부모에 붙어 있어야 한다. 표시판은 그 바로 뒤 형제로 들어가 함께 지워진다.
function addLuminousSigns(image, src) {
  const entry = luminousSigns[src.replace(/^assets\/background\/|\.png$/g, '')];
  if (!entry) return;
  const [naturalWidth, naturalHeight, rects] = entry;
  const left = parseFloat(image.style.left) || 0, top = parseFloat(image.style.top) || 0;
  const sx = parseFloat(image.style.width) / naturalWidth, sy = parseFloat(image.style.height) / naturalHeight;
  for (const [x, y, w, h] of rects) {
    const sign = document.createElement('img');
    sign.className = 'luminous-sign';
    sign.src = exitSignSrc;
    sign.alt = '';
    sign.draggable = false;
    Object.assign(sign.style, { left: `${left + x * sx}px`, top: `${top + y * sy}px`, width: `${w * sx}px`, height: `${h * sy}px` });
    image.after(sign);
  }
}

function backgroundLightsOff() {
  return currentSceneFloor >= 1 && currentSceneFloor <= 17 &&
    (world.dataset.powerFlicker === 'off' || (buildingBlackout && !solarPoweredFloors.includes(currentSceneFloor)) || (currentSceneFloor === 17 && world.dataset.lights === 'off'));
}

function setPowerBackground(image, src) {
  if (switchableBackgrounds.has(src)) {
    image.dataset.litSrc = src;
    image.dataset.unlitSrc = src.replace(/\.png$/, '-off.png');
    image.src = backgroundLightsOff() ? image.dataset.unlitSrc : src;
  } else image.src = src;
}

function refreshBackgroundPower() {
  const off = backgroundLightsOff();
  world.dataset.backgroundLights = off ? 'off' : 'on';
  if (currentSceneFloor === 17) {
    document.getElementById('floor17-light-state').value = !off ? '조명 켜짐' :
      !buildingBlackout || solarPoweredFloors.includes(17) ? '조명 꺼짐' : '조명 꺼짐 · 전력 없음';
  }
  for (const image of world.querySelectorAll('img[data-lit-src]')) {
    const src = off ? image.dataset.unlitSrc : image.dataset.litSrc;
    if (image.getAttribute('src') !== src) image.src = src;
  }
}
