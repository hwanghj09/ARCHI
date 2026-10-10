// 실제 소지품만 등록한다. collectedItems의 퍼즐 진행 플래그는 가방에 표시하지 않는다.
// hint: 아직 챙기지 않은 물건이 어디 있는지 건물 안내 앱이 알려 주는 짧은 단서(전부 알려 주지는 않는다).
const INVENTORY_ITEMS = {
  'f17-badge': { name: '수호의 출입증', description: '늘 지니고 다니는 내 출입증. ARCHI · 정수호 · 개발팀.', image: 'assets/objects/id-cards/jeong-suho.png' },
  'f16-badge': { name: '조현아 팀장 사원증', description: '16층 카페에서 챙긴 사원증. 12~15층의 인증 게이트에서 사용할 수 있다.', image: 'assets/objects/id-cards/jo-hyeon-a.png',
    hint: '16층 Café에서 마지막 확인' },
  'rooftop-key': { name: '낡은 열쇠', description: '옥상문을 열 수 있을 것만 같다… 조금 더럽다.' },
};
const inventoryButton = document.getElementById('inventory-button');

function refreshInventoryCount() {
  const count = Object.keys(INVENTORY_ITEMS).filter(id => collectedItems.has(id)).length;
  inventoryButton.textContent = count ? `가방 (${count}) · I` : '가방 · I';
}

function itemButton(id) {
  const item = INVENTORY_ITEMS[id];
  const button = writingNode('button', 'inventory-item');
  button.type = 'button';
  button.dataset.item = id;
  const icon = writingNode('img', 'item-key');
  icon.src = item.image || 'assets/ui/rooftop-key.png';
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
      playGameSound('item-get');
      key.remove();
      description.textContent = '낡은 열쇠를 가방에 넣었다. 옥상문을 열 수 있을 것 같다.';
      inspectionDescription.textContent = description.textContent;
      refreshInventoryCount();
      inspectionClose.focus();
    });
    cabinet.append(key);
  } else {
    description.textContent = '호스와 관창만 남아 있다. 열쇠는 이미 챙겼다.';
  }
  openItemPanel('17층 소화전', description.textContent, 'hydrant', content);
}

function openRooftopLock() {
  const content = writingNode('div', 'item-panel inventory-content');
  const description = writingNode('p', 'item-description', '비상문이 잠겨 있다. 소화전에서 찾은 열쇠로 문을 열 수 있을 것 같다.');
  description.id = 'item-description';
  const useKey = itemButton('rooftop-key');
  useKey.querySelector('.item-name').textContent = '열쇠 사용하기';
  useKey.addEventListener('click', () => {
    updateInteraction();
    if (!usingInspection || inspectionPanel.dataset.surface !== 'rooftop-lock' || currentSceneFloor !== 17 ||
        nearbyDoor?.type !== 'stairs' || !collectedItems.has('rooftop-key')) return;
    collectedItems.add('rooftop-unlocked');
    playGameSound('item-use');
    closeInspection();
    interact();
  });
  content.append(description, useKey);
  openItemPanel('옥상 비상문', description.textContent, 'rooftop-lock', content);
}

// 가방에서 크게 본 물건. 조사창의 returnTo가 'inventory'일 때만 쓴다.
let inventoryCardItem = null;

// 가방 목록이나 가방에서 연 카드가 떠 있는가.
function inventoryShown() {
  return usingInspection && (inspectionPanel.dataset.surface === 'inventory' || inspectionPanel.dataset.returnTo === 'inventory');
}

// 가방에서 연 카드를 닫으면 목록으로 돌아가 방금 본 물건에 포커스를 돌려준다.
function closeInventoryCard() {
  showInventoryList(inventoryCardItem);
}

function toggleInventory() {
  if (inventoryShown()) {
    closeInspection();
    inventoryButton.focus();
    return;
  }
  if (transitioning || selectingFloor || usingComputer || usingKeypad || usingPhone || usingPowerPanel || usingInspection) return;
  showInventoryList();
}

// focusItem: 목록을 연 뒤 포커스를 줄 물건(카드를 보고 돌아올 때).
function showInventoryList(focusItem) {
  const items = Object.keys(INVENTORY_ITEMS).filter(id => collectedItems.has(id));
  const content = writingNode('div', 'item-panel inventory-content');
  const grid = writingNode('div', 'inventory-grid');
  const description = writingNode('p', 'item-description', items.length ? '물건에 마우스를 올리거나 눌러서 살펴보세요.' : '가방이 비어 있다.');
  description.id = 'item-description';
  description.setAttribute('role', 'status');
  for (const id of items) {
    const button = itemButton(id);
    const describe = () => { description.textContent = INVENTORY_ITEMS[id].description; };
    for (const event of ['pointerenter', 'focus']) button.addEventListener(event, describe);
    button.addEventListener('click', () => {
      const item = INVENTORY_ITEMS[id];
      if (!item.image) return describe();
      openInspection(item.name, item.description, { surface: 'card', image: item.image, caption: item.description });
      inspectionPanel.dataset.returnTo = 'inventory';
      inventoryCardItem = id;
    });
    grid.append(button);
  }
  content.append(grid, description);
  openItemPanel('가방', '챙긴 물건을 확인한다. 옥상 비상문 앞에서 조사한 뒤 열쇠 사용하기를 누르면 잠금을 해제한다.', 'inventory', content);
  inventoryButton.setAttribute('aria-expanded', 'true');
  if (focusItem) grid.querySelector(`[data-item="${focusItem}"]`)?.focus();
}

inventoryButton.addEventListener('click', toggleInventory);
