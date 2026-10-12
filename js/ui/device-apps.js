// 두 기기는 같은 계산기와 실제 층 데이터를 쓴다. 각 계산기의 입력 상태는 독립적이다.
for (const calculator of document.querySelectorAll('[data-device-calculator]')) {
  const display = calculator.querySelector('[data-calculator-display]');
  const history = calculator.querySelector('[data-calculator-history]');
  let entry = '0', stored = null, operator = null, fresh = true;
  const operations = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => a / b };
  function result(value) {
    entry = Number.isFinite(value) ? String(Number(value.toPrecision(12))) : '오류';
    if (entry === '오류') { stored = null; operator = null; history.textContent = '계산할 수 없습니다'; }
  }
  function press(key) {
    if (entry === '오류') { entry = '0'; fresh = true; history.textContent = ''; }
    if (/^\d$/.test(key)) {
      if (fresh) { entry = key; fresh = false; if (!operator) history.textContent = ''; }
      else if (entry.replace(/[-.]/g, '').length < 12) entry = entry === '0' ? key : entry + key;
    } else if (key === '.') {
      if (fresh) { entry = '0'; fresh = false; }
      if (!entry.includes('.')) entry += '.';
    } else if (key === 'AC') {
      entry = '0'; stored = null; operator = null; fresh = true; history.textContent = '';
    } else if (key === '⌫') {
      if (!fresh) entry = entry.slice(0, -1);
      if (!entry || entry === '-') entry = '0';
    } else if (key === '±') {
      entry = entry.startsWith('-') ? entry.slice(1) : entry === '0' ? entry : `-${entry}`;
    } else if (key === '%') {
      result(Number(entry) / 100); fresh = !operator;
    } else if (operations[key]) {
      if (operator && !fresh) result(operations[operator](stored, Number(entry)));
      if (entry !== '오류') {
        stored = Number(entry); operator = key; fresh = true;
        history.textContent = `${entry} ${key}`;
      }
    } else if (key === '=' && operator && !fresh) {
      const calculation = `${stored} ${operator} ${entry} =`;
      result(operations[operator](stored, Number(entry)));
      if (entry !== '오류') history.textContent = calculation;
      stored = null; operator = null; fresh = true;
    }
    display.value = entry;
  }
  const labels = { AC: '모두 지우기', '⌫': '한 자리 지우기', '±': '부호 바꾸기', '%': '백분율', '÷': '나누기', '×': '곱하기', '−': '빼기', '+': '더하기', '=': '계산', '.': '소수점' };
  for (const key of ['AC', '⌫', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '±', '0', '.', '=']) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = key; button.dataset.calculatorKey = key;
    button.setAttribute('aria-label', labels[key] || key);
    button.addEventListener('click', () => press(key));
    calculator.querySelector('.calculator-keys').append(button);
  }
  calculator.addEventListener('keydown', event => {
    // Enter/Space는 포커스된 실제 버튼을 누른다. = 키로 직접 계산할 수도 있다.
    const key = { '*': '×', '/': '÷', '-': '−', Backspace: '⌫', Delete: 'AC' }[event.key] || event.key;
    if (!/^\d$/.test(key) && !['.', '+', '−', '×', '÷', '%', '=','AC', '⌫'].includes(key)) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault(); event.stopPropagation(); press(key);
  });
}

const guideFloors = [...ALL_FLOORS, ROOFTOP].sort((a, b) => b.floor - a.floor);
const buildingGuides = [...document.querySelectorAll('[data-building-guide]')];
function guideTitle(scene) { return scene.floor === 17 ? '17F · 개발팀 사무실' : scene.header; }
for (const guide of buildingGuides) {
  const select = guide.querySelector('[data-building-floor]');
  for (const scene of guideFloors) select.add(new Option(guideTitle(scene), scene.floor));
  select.value = String(currentSceneFloor);
  select.addEventListener('change', refreshBuildingGuides);
  guide.querySelector('[data-building-here]').addEventListener('click', () => {
    select.value = String(currentSceneFloor); refreshBuildingGuides();
  });
}

function refreshBuildingGuides() {
  for (const guide of buildingGuides) {
    const scene = guideFloors.find(item => item.floor === Number(guide.querySelector('[data-building-floor]').value));
    if (!scene) continue;
    const powered = floorHasPower(scene.floor);
    guide.querySelector('[data-building-current]').textContent = `현재 위치 · ${currentSceneFloor === 18 ? '옥상' : floorName(currentSceneFloor)}`;
    guide.querySelector('[data-building-title]').textContent = guideTitle(scene);
    guide.querySelector('[data-building-power]').textContent = `조명 · ${powered ? '전력 공급 중' : '전력 없음'}`;
    guide.querySelector('[data-building-power]').dataset.powered = String(powered);
    const rooms = [...new Set((scene.rooms || []).map(room => room.name))];
    if (scene.floor === 17) rooms.unshift('개발팀 사무실');
    if (scene.floor === 18) rooms.push('태양광 비상 배전반', '비상계단');
    const list = guide.querySelector('[data-building-rooms]');
    list.replaceChildren(...rooms.map(name => { const item = document.createElement('li'); item.textContent = name; return item; }));
    const chargers = (scene.fixtures || []).filter(item => item.phoneCharger).length;
    guide.querySelector('[data-building-charger]').textContent = `충전함 ${chargers}곳 · ${powered ? '충전 가능' : '전력 공급 필요'}`;
    guide.querySelector('[data-building-elevator]').textContent = scene.floor === 18 ? '옥상은 17층 비상계단으로 이동' :
      `엘리베이터 · ${elevatorHasPower() ? solarEnabled ? '비상 전력으로 운행 가능' : '정상 운행' : '옥상 비상 전력 레버를 내려야 운행 가능'}`;
  }
}
