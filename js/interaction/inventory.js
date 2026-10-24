// 실제 소지품만 등록한다. collectedItems의 퍼즐 진행 플래그는 가방에 표시하지 않는다.
// hint: 아직 챙기지 않은 물건이 어디 있는지 건물 안내 앱이 알려 주는 짧은 단서(전부 알려 주지는 않는다).
const INVENTORY_ITEMS = {
  'f17-badge': { name: '수호의 출입증', description: '늘 지니고 다니는 내 출입증. ARCHI · 정수호 · 개발팀.', image: 'assets/objects/id-cards/jeong-suho.png', look: 'badge' },
  'f16-badge': { name: '조현아 팀장 사원증', description: '16층 카페에서 챙긴 사원증. 12~15층의 인증 게이트에서 사용할 수 있다.', image: 'assets/objects/id-cards/jo-hyeon-a.png', look: 'badge',
    hint: '16층 Café에서 마지막 확인' },
  'f16-antianxiety': { name: '항불안제', description: brandText(`16층 VU 편의점 선반에서 챙긴 항불안제. 정신력을 ${antianxietyRestore}%p 회복하고 게임 시간 ${antianxietyCalmMs / 1000}초 동안 정신력 감소를 막는다. 효과가 끝나면 다시 감소한다.`), image: 'assets/objects/items/antianxiety-v2.png',
    usedFlag: 'f16-antianxiety-used', use: { label: '사용하기', sanity: antianxietyRestore, calm: true, animation: 'antianxiety' } },
  'f2-reel': { name: '리허설 녹화 디스크', description: '2층 서버실 녹화 NAS에서 챙긴 원본 디스크. 03:00 무관객 리허설이 녹화되어 있다. Harmony Hall의 배터리 영사기에 넣어 볼 수 있다.',
    image: 'assets/ui/manual-control/disc.png', usedFlag: 'f2-projected' },
  'f2-remote': { name: '영사기 리모컨', description: '2층 직원 휴게실 커피 테이블에서 챙긴 리모컨. Harmony Hall 천장의 배터리 영사기를 내릴 수 있다.',
    image: 'assets/objects/items/projector-remote-v2.png' },
  // B2 전력·냉각실(엔딩 준비): 먹으면 정신력이 최소 50%가 된다(minSanity).
  'b2-antianxiety': { name: '항불안제', description: `B2 전력·냉각실 캐비닛 위에서 챙긴 항불안제. 정신력이 최소 50%까지 돌아오고 게임 시간 ${antianxietyCalmMs / 1000}초 동안 정신력 감소를 막는다.`, image: 'assets/objects/items/antianxiety-v2.png',
    usedFlag: 'b2-antianxiety-used', use: { label: '사용하기', minSanity: 50, calm: true, animation: 'antianxiety' } },
  'f12-lead-key': { name: '팀장실 보조키', description: '12층 책상 서랍에서 챙긴 열쇠. 꼬리표에 "팀장실 보조키"라고 적혀 있다.', image: 'assets/objects/items/lead-key.png' },
  'f12-eval-keycard': { name: '모델 평가실 카드키', description: '12층 개발실 맨 왼쪽 서랍의 종이 더미 밑에서 찾은 카드키. 모델 평가실 문을 열 수 있다.',
    image: 'assets/objects/items/eval-keycard.png', hint: '12층 개발실 맨 왼쪽 서랍 확인' },
  'f13-backup-device': { name: '원격지원 게이트웨이 백업 장치', description: '13층 보안 자료실에서 가져온 USB 백업 장치. 라벨: "03:05 외부 송신 경로 원본 · 원격 접속 에이전트 배포 계정 archi_svc · 2F 03:00 리허설 사본". 컴퓨터에 꽂으면 안을 볼 수 있을 것 같다.',
    image: 'assets/objects/items/backup-device.png', hint: '13층 보안 자료실 백업 장치 보관함' },
  'rooftop-key': { name: '낡은 열쇠', description: '옥상문을 열 수 있을 것만 같다… 조금 더럽다.' },
  'f17-crowbar': { name: '빠루', description: '17층 관리자실 공구 사물함에서 챙긴 빠루. 나사로 박힌 덮개쯤은 뜯어낼 수 있을 것 같다.',
    image: 'assets/objects/items/crowbar.png', hint: '17층 관리자실 사물함' },
  'f17-manager-memo': { name: '관리실 비상 출입 메모', image: 'assets/ui/floor17/manager-memo.png',
    description: MANAGER_MEMO_TEXT, sheet: MANAGER_MEMO_SHEET },
};
// 가방에 들어 있는 물건: 챙겼고 아직 쓰지 않은 것(usedFlag가 있는 물건은 쓰면 가방에서 사라진다. 챙김 표시는 그대로 두어 선반에 다시 나타나지 않는다).
const ownedInventoryIds = () => Object.keys(INVENTORY_ITEMS).filter(id => collectedItems.has(id) && !collectedItems.has(INVENTORY_ITEMS[id].usedFlag));
const inventoryButton = document.getElementById('inventory-button');

function refreshInventoryCount() {
  const count = ownedInventoryIds().length;
  inventoryButton.querySelector('.hud-count').textContent = count;
  inventoryButton.ariaLabel = inventoryButton.title = `${count ? `가방 (${count})` : '가방'} · ${bindingLabel('inventory')}`;
}

function showItemAcquired(id, message) {
  const item = INVENTORY_ITEMS[id];
  const description = `${item.name} 획득 · 가방에 넣었다.\n${message || item.description}`;
  openInspection(`${item.name} 획득`, description, {
    ...(item.sheet || { surface: 'card', look: item.look, image: item.image || 'assets/ui/rooftop-key.png' }),
    caption: description,
  });
  inspectionLabel.textContent = '획득';
  inspectionPanel.dataset.acquiredItem = id;
  // 터치로 집은 버튼이 사라진 뒤에도 닫기 버튼에 초점을 둔다.
  requestAnimationFrame(() => {
    if (inspectionPanel.dataset.acquiredItem === id) inspectionClose.focus();
  });
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
  if (surface === 'inventory' && !inventoryShown()) playGameSound('bag-zip');
  else if (surface === 'drawer') playGameSound('drawer');
  else if (surface === 'hydrant') playGameSound('lever');
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
  const description = writingNode('p', 'item-description', '호스와 관창이 정리되어 있다.');
  description.id = 'item-description';
  cabinet.append(image);
  const content = writingNode('div', 'item-panel');
  content.append(cabinet, description);
  openItemPanel('17층 소화전', description.textContent, 'hydrant', content);
}

// 옥상문 옆 비상 열쇠함(corridor17.js). 옥상문 열쇠를 여기서 줍는다.
function openKeyBox() {
  const description = writingNode('p', 'item-description', '걸이에 낡은 열쇠가 하나 걸려 있다.');
  description.id = 'item-description';
  description.setAttribute('role', 'status');
  const content = writingNode('div', 'item-panel inventory-content');
  content.append(description);
  if (!collectedItems.has('rooftop-key')) {
    const key = itemButton('rooftop-key');
    key.setAttribute('aria-label', '낡은 열쇠 줍기');
    key.querySelector('.item-name').textContent = '낡은 열쇠 줍기 · Enter';
    const describe = () => { description.textContent = INVENTORY_ITEMS['rooftop-key'].description + ' 눌러서 줍기.'; };
    key.addEventListener('pointerenter', describe);
    key.addEventListener('focus', describe);
    key.addEventListener('click', () => {
      collectedItems.add('rooftop-key');
      playGameSound('item-get');
      key.remove();
      refreshInventoryCount();
      showItemAcquired('rooftop-key');
    });
    content.append(key);
  } else {
    description.textContent = '열쇠 걸이가 비어 있다. 열쇠는 이미 챙겼다.';
  }
  openItemPanel('비상 열쇠함', description.textContent, 'key-box', content);
  content.querySelector('button')?.focus({ preventScroll: true });
}

function openCleaningCart() {
  const item = 'f17-manager-memo';
  if (collectedItems.has(item)) { openInspection('청소 카트', '메모는 이미 챙겼다.'); return; }
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
  const covered = () => !collectedItems.has('f17-cart-tool-2');
  const refresh = () => {
    memo.hidden = memo.disabled = covered();
    description.textContent = memo.hidden ? '도구를 잡아 카트 밖으로 끌어내자. · 키보드: 도구 선택 후 Enter' :
      '양동이 밑에서 접힌 메모를 찾았다. 눌러서 챙기자.';
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
      (memo.hidden ? tray.querySelector('.cleaning-tool') : memo).focus();
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
    if (covered() || collectedItems.has(item)) return;
    collectedItems.add(item);
    playGameSound('item-get');
    refreshInventoryCount();
    refreshReady();
    showItemAcquired(item);
    saveProgress();
  };
  memo.addEventListener('click', collect);
  memo.addEventListener('pointerup', event => { if (event.isPrimary && event.pointerType === 'touch') collect(); });
  content.append(tray, description);
  openItemPanel('17층 청소 카트', '청소 도구들이 카트 선반을 가리고 있다.', 'cleaning-cart', content);
  refresh();
  (memo.hidden ? tray.querySelector('.cleaning-tool') : memo).focus();
}

function openRooftopLock() {
  const content = writingNode('div', 'item-panel inventory-content');
  const description = writingNode('p', 'item-description', '비상문이 잠겨 있다. 비상 열쇠함에서 찾은 열쇠로 문을 열 수 있을 것 같다.');
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
  if (photoCaptureTime > 0 || itemUseTime > 0 || transitioning || usingComputer || usingKeypad || usingControl || usingPhone || usingPowerPanel || usingInspection) return;
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
      openInspection(item.name, item.description, item.sheet || { surface: 'card', look: item.look, image: item.image, caption: item.description });
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
// 가방(목록·가방에서 연 카드) 밖을 누르면 닫는다. 가방 버튼은 자기 토글이 닫는다.
document.addEventListener('pointerdown', event => {
  if (inventoryShown() && !inspectionPanel.contains(event.target) && !inventoryButton.contains(event.target)) closeInspection();
}, true);

// 가방의 물건 사용: 효과/사용 플래그는 즉시 저장 가능한 상태로 만들고, 복용 동작은 닫힌 가방 밖에서 보여 준다.
function useInventoryItem(id) {
  const item = INVENTORY_ITEMS[id];
  if (!item?.use || !collectedItems.has(id) || collectedItems.has(item.usedFlag) || photoCaptureTime > 0 || itemUseTime > 0 ||
      mainMenuActive || openingActive || blackoutSceneActive || playerCaught || hallucinationCaught || transitioning) return;
  // 엘리베이터 안(1인칭)에서는 수호가 보이지 않으니 먹는 동작 없이 바로 효과만 낸다.
  const withAnimation = item.use.animation && !selectingFloor;
  if (withAnimation && !startItemUseAnimation()) return;
  collectedItems.add(item.usedFlag);
  if (item.use.sanity || item.use.minSanity) {
    sanity = Math.max(item.use.minSanity ?? 0, Math.min(100, sanity + (item.use.sanity ?? 0)));
    refreshSanity();
  }
  if (item.use.calm) {
    antianxietyCalm = antianxietyCalmMs;
    refreshSanity();
  }
  playGameSound('item-use');
  refreshInventoryCount();
  if (withAnimation) closeInspection();
  else showInventoryList();
}

