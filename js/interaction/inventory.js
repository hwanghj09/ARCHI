// 실제 소지품만 등록한다. collectedItems의 퍼즐 진행 플래그는 가방에 표시하지 않는다.
const INVENTORY_ITEMS = {
  'rooftop-key': { name: '낡은 열쇠', description: '옥상문을 열 수 있을 것만 같다… 조금 더럽다.' },
};
const inventoryButton = document.getElementById('inventory-button');

function itemButton(id) {
  const item = INVENTORY_ITEMS[id];
  const button = writingNode('button', 'inventory-item');
  button.type = 'button';
  button.dataset.item = id;
  const icon = writingNode('img', 'item-key');
  icon.src = 'assets/ui/rooftop-key.png';
  icon.alt = '';
  icon.draggable = false;
  button.append(icon, writingNode('span', 'item-name', item.name));
  button.setAttribute('aria-describedby', 'item-description');
  return button;
}

function openItemPanel(title, description, surface, content) {
  openInspection(title, description);
  finishInspectionText();
  inspectionPanel.dataset.surface = surface;
  inspectionLabel.textContent = surface === 'inventory' ? '소지품' : '조사';
  inspectionText.tabIndex = -1;
  inspectionSheet.hidden = false;
  inspectionSheet.removeAttribute('aria-hidden');
  inspectionSheet.replaceChildren(content);
}

function openHydrant() {
  const cabinet = writingNode('div', 'hydrant-cabinet');
  const image = new Image();
  image.src = 'assets/ui/hydrant-interior.png';
  image.alt = '붉은 철문이 열린 소화전. 내부에 천 호스, 황동 밸브와 금속 관창이 있고 아래에 선반이 있다.';
  image.draggable = false;
  const description = writingNode('p', 'item-description', '호스와 관창이 정리되어 있다. 안쪽을 살펴보자.');
  description.id = 'item-description';
  description.setAttribute('role', 'status');
  cabinet.append(image);
  const content = writingNode('div', 'item-panel');
  content.append(cabinet, description);
  if (!collectedItems.has('rooftop-key')) {
    const key = itemButton('rooftop-key');
    key.setAttribute('aria-label', '낡은 열쇠 줍기');
    const describe = () => { description.textContent = INVENTORY_ITEMS['rooftop-key'].description + ' 눌러서 줍기.'; };
    key.addEventListener('pointerenter', describe);
    key.addEventListener('focus', describe);
    key.addEventListener('click', () => {
      collectedItems.add('rooftop-key');
      key.remove();
      description.textContent = '낡은 열쇠를 가방에 넣었다. 옥상문을 열 수 있을 것 같다.';
      inspectionDescription.textContent = description.textContent;
      inventoryButton.textContent = '가방 (1) · I';
      inspectionClose.focus();
    });
    cabinet.append(key);
  } else {
    description.textContent = '호스와 관창만 남아 있다. 열쇠는 이미 챙겼다.';
  }
  openItemPanel('17층 소화전', description.textContent, 'hydrant', content);
}

function toggleInventory() {
  if (usingInspection && inspectionPanel.dataset.surface === 'inventory') {
    closeInspection();
    inventoryButton.focus();
    return;
  }
  if (transitioning || selectingFloor || usingComputer || usingKeypad || usingPhone || usingPowerPanel || usingInspection) return;
  const items = Object.keys(INVENTORY_ITEMS).filter(id => collectedItems.has(id));
  const content = writingNode('div', 'item-panel inventory-content');
  const grid = writingNode('div', 'inventory-grid');
  const description = writingNode('p', 'item-description', items.length ? '물건에 마우스를 올리거나 눌러서 살펴보세요.' : '가방이 비어 있다.');
  description.id = 'item-description';
  description.setAttribute('role', 'status');
  for (const id of items) {
    const button = itemButton(id);
    const describe = () => { description.textContent = INVENTORY_ITEMS[id].description; };
    for (const event of ['pointerenter', 'focus', 'click']) button.addEventListener(event, describe);
    grid.append(button);
  }
  content.append(grid, description);
  openItemPanel('가방', '챙긴 물건을 확인한다. 열쇠는 맞는 문을 조사할 때 자동으로 사용한다.', 'inventory', content);
  inventoryButton.setAttribute('aria-expanded', 'true');
}

inventoryButton.addEventListener('click', toggleInventory);
