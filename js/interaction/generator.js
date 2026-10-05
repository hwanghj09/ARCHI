// 옥상 태양광 임시 전력장치: 층 하나를 골라 켜고 끈다. 용량이 작아 한 번에 한 층만 공급되므로
// 새 층을 고르면 켜 있던 층은 자동으로 꺼진다(js/floors/floor-b1.js의 수전반 문구 참고).
const generatorPanel = document.getElementById('generator');
const generatorStatus = document.getElementById('generator-status');
const generatorFloorsEl = document.getElementById('generator-floors');
const generatorClose = document.getElementById('generator-close');
let generatorReturnFocus = null;
let generatorSupply = null;

const generatorButtons = Array.from({ length: 17 }, (_, index) => index + 1).map(floor => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.floor = String(floor);
  button.className = 'generator-floor';
  button.textContent = floorShortLabel(floor);
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => toggleGeneratorFloor(floor));
  generatorFloorsEl.append(button);
  return button;
});

function refreshGenerator() {
  for (const button of generatorButtons) {
    const on = Number(button.dataset.floor) === poweredFloor;
    button.dataset.active = String(on);
    button.setAttribute('aria-pressed', String(on));
  }
  generatorStatus.textContent = poweredFloor ?
    `${floorShortLabel(poweredFloor)} 전력 공급 중. 용량이 작아 한 번에 한 층만 켤 수 있다 — 다른 층을 고르면 자동으로 바뀐다.` :
    '공급 중인 층 없음. 용량이 작아 한 번에 한 층만 켤 수 있다.';
  if (generatorSupply) {
    generatorSupply.dataset.state = poweredFloor ? 'on' : 'off';
    generatorSupply.setAttribute('aria-label', `태양광 임시 전력장치 · ${poweredFloor ? `${floorShortLabel(poweredFloor)} 공급 중` : '화면 꺼짐'}`);
  }
}

function toggleGeneratorFloor(floor) {
  poweredFloor = poweredFloor === floor ? null : floor;
  world.dataset.powered = String(currentSceneFloor === poweredFloor);
  syncFloor17Power();
  refreshGenerator();
}

function openGenerator(door) {
  generatorSupply = door.element;
  usingGenerator = true;
  generatorReturnFocus = document.activeElement;
  releaseInput();
  hint.hidden = true;
  stage.inert = true;
  generatorPanel.hidden = false;
  refreshGenerator();
  generatorButtons[0].focus({ preventScroll: true });
}

function closeGenerator() {
  if (!usingGenerator) return;
  usingGenerator = false;
  generatorPanel.hidden = true;
  stage.inert = false;
  (generatorReturnFocus && document.contains(generatorReturnFocus) ? generatorReturnFocus : stage).focus({ preventScroll: true });
  generatorReturnFocus = null;
  updateInteraction();
}

generatorPanel.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.code === 'Escape') { event.preventDefault(); closeGenerator(); }
});
generatorClose.addEventListener('click', closeGenerator);
