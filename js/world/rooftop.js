// 옥상 배경 그림. 옥상 장면은 scene/scene-builder.js의 buildDynamicScene이 조립한다.
const rooftopBackground = new Image();
rooftopBackground.src = 'assets/background/rooftop/rooftop-finished.png';
rooftopBackground.alt = '';
rooftopBackground.draggable = false;
Object.assign(rooftopBackground.style, {
  position: 'absolute', width: '2400px', height: '760px',
  top: '0px', left: '0px', imageRendering: 'pixelated',
});
