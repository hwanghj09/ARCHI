// 이미 빛이 그려진 배경은 별도 소등 그림으로 바꾼다. 원본·배치·충돌 좌표는 유지한다.
const switchableBackgrounds = new Set([
  'floor17/office-interior-aligned', 'floor17/floor17', 'floor17/service-corridor', 'floor17/restroom',
  'floor7/corridor', 'floor7/vip',
  'floor16/amenity-corridor-left', 'floor16/amenity-corridor-core', 'floor16/amenity-corridor-right',
  'floor16/amenity-kitchen-dining', 'floor16/amenity-kitchen-service',
  'floor16/amenity-cu-interior', 'floor16/amenity-cafe-interior',
].map(name => `assets/background/${name}.png`));

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
