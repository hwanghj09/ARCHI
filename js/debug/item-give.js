// 테스트용 아이템 획득: 가방 물건(INVENTORY_ITEMS)을 바로 챙긴다. 이미 쓴 물건(항불안제)은 사용 표시를 지워 다시 가방에 넣는다.
const debugItem = document.getElementById('debug-item');
const debugItemSelect = document.getElementById('debug-item-select');
for (const [id, item] of Object.entries(INVENTORY_ITEMS)) debugItemSelect.add(new Option(`${item.name} · ${id}`, id));
debugItem.addEventListener('keydown', event => event.stopPropagation());

function debugGiveItems(ids) {
  if (!debugCanAct()) return;
  for (const id of ids) {
    collectedItems.add(id);
    if (INVENTORY_ITEMS[id].usedFlag) collectedItems.delete(INVENTORY_ITEMS[id].usedFlag);
  }
  playGameSound('item-get');
  refreshReady();
  refreshInventoryCount();
  saveProgress();
  stage.focus({ preventScroll: true });
}

debugItem.addEventListener('submit', event => {
  event.preventDefault();
  debugGiveItems([debugItemSelect.value]);
});
document.getElementById('debug-item-all').addEventListener('click', () => debugGiveItems(Object.keys(INVENTORY_ITEMS)));
