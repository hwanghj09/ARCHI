// 실제 소지품만 등록한다. collectedItems의 퍼즐 진행 플래그는 가방에 표시하지 않는다.
// hint: 아직 챙기지 않은 물건이 어디 있는지 건물 안내 앱이 알려 주는 짧은 단서(전부 알려 주지는 않는다).
const INVENTORY_ITEMS = {
  'f17-badge': { name: '수호의 출입증', description: '늘 지니고 다니는 내 출입증. ARCHI · 정수호 · 개발팀.', image: 'assets/objects/id-cards/jeong-suho.png' },
  'f16-badge': { name: '조현아 팀장 사원증', description: '16층 카페에서 챙긴 사원증. 12~15층의 인증 게이트에서 사용할 수 있다.', image: 'assets/objects/id-cards/jo-hyeon-a.png',
    hint: '16층 Café에서 마지막 확인' },
  'f16-antianxiety': { name: '항불안제', description: brandText('16층 VU 편의점 선반의 약품 칸에서 챙긴 항불안제. 먹으면 불안이 조금 가라앉을 것 같다.'), image: 'assets/objects/items/antianxiety-v2.png',
    usedFlag: 'f16-antianxiety-used', use: { label: '사용하기', sanity: antianxietyRestore, animation: 'antianxiety' } },
  // B2 전력·냉각실(엔딩 준비): 먹으면 정신력이 최소 50%가 된다(minSanity).
  'b2-antianxiety': { name: '항불안제', description: 'B2 전력·냉각실 캐비닛 위에서 챙긴 항불안제. 먹으면 정신력이 최소 50%까지 돌아온다.', image: 'assets/objects/items/antianxiety-v2.png',
    usedFlag: 'b2-antianxiety-used', use: { label: '사용하기', minSanity: 50, animation: 'antianxiety' } },
  'f12-lead-key': { name: '팀장실 보조키', description: '12층 책상 서랍에서 챙긴 열쇠. 꼬리표에 "팀장실 보조키"라고 적혀 있다.' },
  'f12-eval-keycard': { name: '모델 평가실 카드키', description: '12층 개발실 맨 왼쪽 서랍의 종이 더미 밑에서 찾은 카드키. 모델 평가실 문을 열 수 있다.',
    image: 'assets/ui/eval-keycard.svg', hint: '12층 개발실 맨 왼쪽 서랍 확인' },
  'f13-backup-device': { name: '원격지원 게이트웨이 백업 장치', description: '13층 보안 자료실에서 가져온 백업 장치. 라벨: "03:05 외부 송신 경로 원본 · 원격 접속 에이전트 배포 계정 archi_svc".',
    hint: '13층 보안 자료실 백업 장치 보관함' },
  'rooftop-key': { name: '낡은 열쇠', description: '옥상문을 열 수 있을 것만 같다… 조금 더럽다.' },
  'f17-manager-memo': { name: '관리실 비상 출입 메모', image: 'assets/ui/floor17/manager-memo.png',
    description: MANAGER_MEMO_TEXT, sheet: MANAGER_MEMO_SHEET },
};
// 가방에 들어 있는 물건: 챙겼고 아직 쓰지 않은 것(usedFlag가 있는 물건은 쓰면 가방에서 사라진다. 챙김 표시는 그대로 두어 선반에 다시 나타나지 않는다).
const ownedInventoryIds = () => Object.keys(INVENTORY_ITEMS).filter(id => collectedItems.has(id) && !collectedItems.has(INVENTORY_ITEMS[id].usedFlag));
const inventoryButton = document.getElementById('inventory-button');

function refreshInventoryCount() {
  const count = ownedInventoryIds().length;
  inventoryButton.ariaLabel = inventoryButton.title = `${count ? `가방 (${count})` : '가방'} · ${bindingLabel('inventory')}`; // 화면에는 그림만 보이고 글자는 접근성 이름으로만 남는다
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
  const description = writingNode('p', 'item-description', '호스와 관창이 정리되어 있다. 아래 선반의 열쇠와 접힌 메모를 살펴보자.');
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
    description.textContent = '호스와 관창은 그대로다. 열쇠는 이미 챙겼다.';
  }
  openItemPanel('17층 소화전', description.textContent, 'hydrant', content);
}

function openCleaningCart() {
  const item = 'f17-manager-memo';
  if (collectedItems.has(item)) { openInspection('청소 카트', '아무것도 없다.'); return; }
  const content = writingNode('div', 'item-panel');
  const tray = writingNode('div', 'cleaning-cart-tray');
  const cart = new Image();
  cart.src = 'assets/ui/floor17/cleaning-cart-empty.png';
  cart.alt = '선반과 양동이 받침이 있는 청소 카트';
  cart.draggable = false;
  tray.append(cart);
  const description = writingNode('p', 'item-description');
  description.id = 'item-description';
  description.setAttribute('role', 'status');
  const memo = itemButton(item);
  memo.setAttribute('aria-label', '관리실 비상 출입 메모 줍기');
  tray.append(memo);
  const refresh = () => {
    const remaining = tray.querySelectorAll('.cleaning-tool').length;
    memo.hidden = memo.disabled = remaining > 0;
    description.textContent = remaining ? `도구를 잡아 카트 밖으로 끌어내자. (${remaining}개 남음) · 키보드: 도구 선택 후 Enter` :
      '도구들 밑에서 접힌 메모를 찾았다. 눌러서 챙기자.';
    inspectionDescription.textContent = description.textContent;
  };
  ['분무기', '세제통', '양동이'].forEach((label, index) => {
    const flag = `f17-cart-tool-${index}`;
    if (collectedItems.has(flag)) return;
    const tool = writingNode('button', 'cleaning-tool');
    tool.type = 'button';
    tool.dataset.tool = index;
    tool.setAttribute('aria-label', `${label} 치우기`);
    tool.append(writingNode('span', 'cleaning-tool-sprite'));
    const remove = () => {
      if (!tool.isConnected || !usingInspection || inspectionPanel.dataset.surface !== 'cleaning-cart') return;
      collectedItems.add(flag);
      tool.remove();
      refresh();
      (tray.querySelector('.cleaning-tool') || memo).focus();
      saveProgress();
    };
    let drag = null;
    tool.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      event.preventDefault();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      tool.setPointerCapture(event.pointerId);
      tool.dataset.dragging = 'true';
    });
    tool.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      tool.style.translate = `${event.clientX - drag.x}px ${event.clientY - drag.y}px`;
    });
    const endDrag = event => {
      if (!drag || drag.id !== event.pointerId) return;
      const bounds = tray.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
      const cleared = event.type === 'pointerup' && outside && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 16;
      drag = null;
      tool.style.translate = '';
      delete tool.dataset.dragging;
      if (tool.hasPointerCapture(event.pointerId)) tool.releasePointerCapture(event.pointerId);
      if (cleared) remove();
    };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) tool.addEventListener(type, endDrag);
    tool.addEventListener('click', event => { if (event.detail === 0) remove(); });
    tray.append(tool);
  });
  const collect = () => {
    if (tray.querySelector('.cleaning-tool') || collectedItems.has(item)) return;
    collectedItems.add(item);
    playGameSound('item-get');
    refreshInventoryCount();
    refreshReady();
    openInspection(INVENTORY_ITEMS[item].name, MANAGER_MEMO_TEXT, MANAGER_MEMO_SHEET);
    saveProgress();
  };
  memo.addEventListener('click', collect);
  memo.addEventListener('pointerup', event => { if (event.isPrimary && event.pointerType === 'touch') collect(); });
  content.append(tray, description);
  openItemPanel('17층 청소 카트', '청소 도구들이 카트 선반을 가리고 있다.', 'cleaning-cart', content);
  refresh();
  (tray.querySelector('.cleaning-tool') || memo).focus();
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
  if (photoCaptureTime > 0 || itemUseTime > 0 || transitioning || selectingFloor || usingComputer || usingKeypad || usingControl || usingPhone || usingPowerPanel || usingInspection) return;
  showInventoryList();
}

// focusItem: 목록을 연 뒤 포커스를 줄 물건(카드를 보고 돌아올 때).
function showInventoryList(focusItem) {
  const items = ownedInventoryIds();
  const content = writingNode('div', 'item-panel inventory-content');
  const grid = writingNode('div', 'inventory-grid');
  const description = writingNode('p', 'item-description', items.length ? '' : '가방이 비어 있다.');
  description.id = 'item-description';
  description.setAttribute('role', 'status');
  for (const id of items) {
    const button = itemButton(id);
    const describe = () => { description.textContent = INVENTORY_ITEMS[id].description; };
    for (const event of ['pointerenter', 'focus']) button.addEventListener(event, describe);
    button.addEventListener('click', () => {
      const item = INVENTORY_ITEMS[id];
      if (!item.image) return describe();
      openInspection(item.name, item.description, item.sheet || { surface: 'card', image: item.image, caption: item.description });
      inspectionPanel.dataset.returnTo = 'inventory';
      // 쓸 수 있는 물건(항불안제)은 카드 아래에 사용하기 버튼이 뜬다.
      if (item.use) {
        inspectionUse.textContent = item.use.label;
        inspectionUse.hidden = false;
        inspectionUse.onclick = () => useInventoryItem(id);
      }
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

// 가방의 물건 사용: 효과/사용 플래그는 즉시 저장 가능한 상태로 만들고, 복용 동작은 닫힌 가방 밖에서 보여 준다.
function useInventoryItem(id) {
  const item = INVENTORY_ITEMS[id];
  if (!item?.use || !collectedItems.has(id) || collectedItems.has(item.usedFlag) || photoCaptureTime > 0 || itemUseTime > 0 ||
      mainMenuActive || openingActive || blackoutSceneActive || playerCaught || hallucinationCaught || transitioning || selectingFloor) return;
  if (item.use.animation && !startItemUseAnimation()) return;
  collectedItems.add(item.usedFlag);
  if (item.use.sanity || item.use.minSanity) {
    sanity = Math.max(item.use.minSanity ?? 0, Math.min(100, sanity + (item.use.sanity ?? 0)));
    refreshSanity();
  }
  playGameSound('item-use');
  refreshInventoryCount();
  if (item.use.animation) closeInspection();
  else showInventoryList();
}

