// 17층 컴퓨터 그림판: 마우스·터치로 그리고 색·굵기·지우개를 고른다. 그림은 창을 닫으면 사라진다.
const paintCanvas = document.getElementById('computer-paint-canvas');
const paintContext = paintCanvas.getContext('2d');
const paintSize = document.getElementById('computer-paint-size');
const paintEraser = document.getElementById('computer-paint-eraser');
const paintColors = { 검정: '#1f1f1f', 회색: '#7f7f7f', 빨강: '#e0483b', 주황: '#f08a24', 노랑: '#f2c230', 초록: '#3fa14f', 파랑: '#2f74d0', 보라: '#8a4fc7' };
let paintColor = paintColors.검정;
let paintStroke = null;

for (const [name, color] of Object.entries(paintColors)) {
  const swatch = document.createElement('button');
  swatch.type = 'button';
  swatch.dataset.paintColor = color;
  swatch.style.background = color;
  swatch.setAttribute('aria-label', name);
  swatch.title = name;
  swatch.addEventListener('click', () => { paintColor = color; setPaintEraser(false); });
  document.getElementById('computer-paint-colors').append(swatch);
}

function setPaintEraser(on) {
  paintEraser.setAttribute('aria-pressed', String(on));
  for (const swatch of document.querySelectorAll('[data-paint-color]')) swatch.setAttribute('aria-pressed', String(!on && swatch.dataset.paintColor === paintColor));
}

function clearPaint() {
  paintContext.fillStyle = '#fff';
  paintContext.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
}
COMPUTER_APPS.paint.reset = () => { clearPaint(); paintColor = paintColors.검정; paintSize.value = '6'; setPaintEraser(false); };

function paintPoint(event) {
  const bounds = paintCanvas.getBoundingClientRect();
  return { x: (event.clientX - bounds.left) * paintCanvas.width / bounds.width, y: (event.clientY - bounds.top) * paintCanvas.height / bounds.height };
}
function drawPaintLine(from, to) {
  Object.assign(paintContext, { strokeStyle: paintEraser.getAttribute('aria-pressed') === 'true' ? '#fff' : paintColor, lineWidth: Number(paintSize.value), lineCap: 'round', lineJoin: 'round' });
  paintContext.beginPath();
  paintContext.moveTo(from.x, from.y);
  paintContext.lineTo(to.x, to.y);
  paintContext.stroke();
}
paintCanvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || paintStroke) return;
  event.preventDefault();
  paintCanvas.focus({ preventScroll: true });
  paintCanvas.setPointerCapture(event.pointerId);
  paintStroke = { id: event.pointerId, last: paintPoint(event) };
  drawPaintLine(paintStroke.last, paintStroke.last);
});
paintCanvas.addEventListener('pointermove', event => {
  if (paintStroke?.id !== event.pointerId) return;
  const point = paintPoint(event);
  drawPaintLine(paintStroke.last, point);
  paintStroke.last = point;
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  paintCanvas.addEventListener(type, event => { if (paintStroke?.id === event.pointerId) paintStroke = null; });
}
paintEraser.addEventListener('click', () => setPaintEraser(paintEraser.getAttribute('aria-pressed') !== 'true'));
document.getElementById('computer-paint-clear').addEventListener('click', clearPaint);
clearPaint();
setPaintEraser(false);
