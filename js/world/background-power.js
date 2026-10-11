// 이미 빛이 그려진 배경은 별도 소등 그림으로 바꾼다. 원본·배치·충돌 좌표는 유지한다.
const switchableBackgrounds = new Set([
  'floor17/office-interior-aligned', 'floor17/floor17', 'floor17/service-corridor', 'floor17/restroom',
  'floor7/corridor', 'floor7/vip',
  'floor16/amenity-corridor-left', 'floor16/amenity-corridor-core', 'floor16/amenity-corridor-right',
  'floor16/amenity-kitchen-dining', 'floor16/amenity-kitchen-service',
  'floor16/amenity-cu-interior', 'floor16/amenity-cafe-interior',
].map(name => `assets/background/${name}.png`));

// 비상구 유도등은 전기 없이도 빛난다. 켜진 그림에서 표시판 영역 [x, y, 폭, 높이](원본 픽셀)를 잘라 어둠 막 위에 겹친다.
const luminousSigns = {
  'floor1/clinic': [1860, 720, [[903, 214, 40, 39]]],
  'floor1/corridor': [5000, 720, [[1134, 214, 24, 26], [2952, 233, 40, 28]]],
  'floor1/vision': [2356, 720, [[278, 274, 32, 26]]],
  'floor7/corridor': [5000, 720, [[2949, 244, 33, 26]]],
  'floor12/corridor': [5000, 720, [[2862, 260, 13, 17]]],
  'floor12/dev': [3600, 720, [[224, 102, 39, 36]]],
  'floor12/eval': [1804, 720, [[413, 219, 18, 25]]],
  'floor12/office': [3280, 720, [[1604, 227, 24, 27]]],
  'floor17/floor17': [3328, 768, [[2967, 187, 58, 37]]],
};

// image는 이미 자리(style left/top/width/height)를 잡고 부모에 붙어 있어야 한다. 표시판은 그 바로 뒤 형제로 들어가 함께 지워진다.
function addLuminousSigns(image, src) {
  const entry = luminousSigns[src.replace(/^assets\/background\/|\.png$/g, '')];
  if (!entry) return;
  const [naturalWidth, naturalHeight, rects] = entry;
  const width = parseFloat(image.style.width), height = parseFloat(image.style.height);
  const left = parseFloat(image.style.left) || 0, top = parseFloat(image.style.top) || 0;
  const sx = width / naturalWidth, sy = height / naturalHeight;
  for (const [x, y, w, h] of rects) {
    const sign = document.createElement('div');
    sign.className = 'luminous-sign';
    Object.assign(sign.style, { left: `${left + x * sx}px`, top: `${top + y * sy}px`, width: `${w * sx}px`, height: `${h * sy}px`,
      backgroundImage: `url("${src}")`, backgroundSize: `${width}px ${height}px`, backgroundPosition: `${-x * sx}px ${-y * sy}px` });
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
