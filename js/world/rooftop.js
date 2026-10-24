// 옥상 배경 그림. 옥상 장면은 scene/scene-builder.js의 buildDynamicScene이 조립한다.
// 두 겹이다: 먼 도시(rooftopCity)는 카메라를 ROOFTOP_PARALLAX 비율만큼만 따라가고(패럴랙스),
// 옥상 전경(rooftopBackground, 하늘이 투명)은 월드와 함께 1:1로 움직인다. 바닥선은 둘 다 y=570.
const ROOFTOP_PARALLAX = .3;

function rooftopLayer(src) {
  const image = new Image();
  image.src = src;
  image.alt = '';
  image.draggable = false;
  Object.assign(image.style, {
    position: 'absolute', width: '2400px', height: '760px',
    top: '0px', left: '0px', imageRendering: 'pixelated',
  });
  return image;
}

const rooftopCity = rooftopLayer('assets/background/rooftop/rooftop-city-finished.png');
rooftopCity.style.willChange = 'transform';
const rooftopBackground = rooftopLayer('assets/background/rooftop/rooftop-front-finished.png');

// camera.js의 render()가 매 프레임 부른다. 월드가 cameraX만큼 밀릴 때 도시를 반대로 되밀어
// 화면상 이동량을 ROOFTOP_PARALLAX배로 줄인다.
function updateRooftopParallax() {
  if (!rooftopCity.isConnected) return;
  rooftopCity.style.transform = `translateX(${cameraX * (1 - ROOFTOP_PARALLAX)}px)`;
}
