// 이미 빛이 그려진 배경은 별도 소등 그림으로 바꾼다. 원본·배치·충돌 좌표는 유지한다.
const switchableBackgrounds = new Set([
  'floor17/office-interior-aligned', 'floor17/floor17', 'floor17/service-corridor', 'floor17/restroom',
  'floor7/corridor', 'floor7/vip',
  'floor16/amenity-corridor-left', 'floor16/amenity-corridor-core', 'floor16/amenity-corridor-right',
  'floor16/amenity-kitchen-dining', 'floor16/amenity-kitchen-service',
  'floor16/amenity-cu-interior', 'floor16/amenity-cafe-interior',
].map(name => `assets/background/${name}.png`));

// 비상구 유도등은 전기 없이도 빛난다. 층마다 다르게 그려진 표시판을 공용 그림 한 장으로 덮어 모양을 맞추고, 어둠 막 위에 둔다.
// [x, y, 폭, 높이]는 배경 원본 픽셀 기준이고 원래 표시판 틀을 다 덮는다. 꺼진 그림(-off)에서 표시판 자리가 다르면 [.., offX, offY]로 따로 적는다.
const exitSignSrc = 'assets/objects/floor-kit/exit-sign.png';
const luminousSigns = {
  'floor1/clinic': [1860, 720, [[888, 211, 71, 46]]],
  'floor1/corridor': [5000, 720, [[1120, 209, 51, 33], [2945, 231, 54, 35]]],
  'floor1/vision': [2356, 720, [[270, 270, 49, 32]]],
  'floor7/corridor': [5000, 720, [[2936, 236, 58, 38]]],
  'floor12/corridor': [5000, 720, [[2844, 256, 48, 31]]],
  'floor12/dev': [3600, 720, [[210, 98, 68, 44]]],
  'floor12/eval': [1804, 720, [[400, 215, 51, 33]]],
  'floor12/office': [3280, 720, [[1587, 220, 58, 38]]],
  'floor17/floor17': [3328, 768, [[2960, 182, 68, 44, 2942, 182]]],
};

// image는 이미 자리(style left/top/width/height)를 잡고 부모에 붙어 있어야 한다. 표시판은 그 바로 뒤 형제로 들어가 함께 지워진다.
function addLuminousSigns(image, src) {
  const entry = luminousSigns[src.replace(/^assets\/background\/|\.png$/g, '')];
  if (!entry) return;
  const [naturalWidth, naturalHeight, rects] = entry;
  const left = parseFloat(image.style.left) || 0, top = parseFloat(image.style.top) || 0;
  const sx = parseFloat(image.style.width) / naturalWidth, sy = parseFloat(image.style.height) / naturalHeight;
  for (const [x, y, w, h, offX, offY] of rects) {
    const places = offX === undefined ? [['', x, y]] : [['lit', x, y], ['unlit', offX, offY]];
    for (const [state, px, py] of places) {
      const sign = document.createElement('img');
      sign.className = `luminous-sign ${state}`.trim();
      sign.src = exitSignSrc;
      sign.alt = '';
      sign.draggable = false;
      Object.assign(sign.style, { left: `${left + px * sx}px`, top: `${top + py * sy}px`, width: `${w * sx}px`, height: `${h * sy}px` });
      image.after(sign);
    }
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
