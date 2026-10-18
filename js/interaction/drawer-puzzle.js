// 종이를 치운 진행도도 기존 소지품 플래그로 저장해 서랍을 다시 열어도 이어진다.
function openDrawerPuzzle() {
  const item = 'f12-eval-keycard';
  const content = writingNode('div', 'item-panel');
  const drawer = writingNode('div', 'drawer-tray');
  const description = writingNode('p', 'item-description');
  description.id = 'item-description';
  description.setAttribute('role', 'status');
  const card = itemButton(item);
  card.setAttribute('aria-label', '모델 평가실 카드키 줍기');
  drawer.append(card);
  const papers = ['평가 일정', '실험 체크리스트', '모델 변경 이력', '개발 회의록', '검토 대기'];
  const remaining = [];
  const refresh = () => {
    const top = remaining.at(-1);
    for (const paper of remaining) paper.disabled = paper !== top;
    card.hidden = collectedItems.has(item);
    card.disabled = remaining.length > 0;
    description.textContent = card.hidden ? '카드키는 이미 가방에 넣었다. 모델 평가실로 가자.' :
      top ? `종이를 잡고 옆으로 끌어 들어내자. (${remaining.length}장 남음) · 키보드: Tab으로 종이 선택 후 Enter` :
        '종이 더미 밑에 모델 평가실 카드키가 있다. 눌러서 챙기자.';
    inspectionDescription.textContent = description.textContent;
  };
  papers.forEach((label, index) => {
    if (collectedItems.has(item) || collectedItems.has(`f12-drawer-paper-${index}`)) return;
    const paper = writingNode('button', 'drawer-paper');
    paper.type = 'button';
    paper.style.setProperty('--paper-angle', `${[8, -12, 5, -7, 11][index]}deg`);
    paper.style.setProperty('--paper-shift', `${[3, -4, 2, -2, 0][index]}%`);
    paper.setAttribute('aria-label', `${label} 종이 들어내기`);
    paper.append(writingNode('span', 'drawer-paper-heading', 'ARCHI / DEVELOPMENT'),
      writingNode('strong', 'drawer-paper-title', label), writingNode('span', 'drawer-paper-lines'));
    let drag = null;
    const remove = () => {
      if (paper !== remaining.at(-1)) return;
      collectedItems.add(`f12-drawer-paper-${index}`);
      remaining.pop();
      playGameSound('paper');
      paper.remove();
      refresh();
      (remaining.at(-1) || card).focus();
      saveProgress();
    };
    paper.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      event.preventDefault();
      drag = { x: event.clientX, y: event.clientY, id: event.pointerId };
      paper.setPointerCapture(event.pointerId);
      paper.dataset.dragging = 'true';
    });
    paper.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      paper.style.translate = `${event.clientX - drag.x}px ${event.clientY - drag.y}px`;
    });
    const endDrag = event => {
      if (!drag || drag.id !== event.pointerId) return;
      const lifted = event.type === 'pointerup' && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > drawer.clientWidth * .32;
      drag = null;
      paper.style.translate = '';
      delete paper.dataset.dragging;
      if (paper.hasPointerCapture(event.pointerId)) paper.releasePointerCapture(event.pointerId);
      if (lifted) remove();
    };
    paper.addEventListener('pointerup', endDrag);
    paper.addEventListener('pointercancel', endDrag);
    paper.addEventListener('lostpointercapture', endDrag);
    paper.addEventListener('click', event => { if (event.detail === 0) remove(); });
    remaining.push(paper);
    drawer.append(paper);
  });
  const collect = () => {
    if (remaining.length || collectedItems.has(item)) return;
    collectedItems.add(item);
    playGameSound('item-get');
    refreshInventoryCount();
    refresh();
    showItemAcquired(item);
    saveProgress();
  };
  card.addEventListener('click', collect);
  // 종이를 터치로 끌어낸 뒤 합성 click이 생략되는 경우에도 카드를 챙긴다.
  card.addEventListener('pointerup', event => { if (event.isPrimary && event.pointerType === 'touch') collect(); });
  content.append(drawer, description);
  openItemPanel('개발실 · 맨 왼쪽 서랍', '서랍 안의 종이 더미를 살펴보자.', 'drawer', content);
  refresh();
  (remaining.at(-1) || (card.hidden ? inspectionClose : card)).focus();
}
