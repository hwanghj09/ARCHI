// 문 DOM 공용 도우미: 방 출입문 만들기, 문 열림 표시, 셔터 올리고 내리기.
function addRoomDoor(door, parent = dynamicScene) {
  door.element = document.createElement('div');
  door.element.className = `room-door ${door.style || ''}`.trim();
  // sprite: 닫힘|열림 두 칸 문 그림(단면 에셋 층). 그림을 바로 입히고, E를 누르면 data-open으로 열린 칸을 보인다.
  if (door.sprite) {
    door.element.classList.add('sprite-door');
    door.element.style.backgroundImage = `url('${door.sprite}')`;
  }
  door.element.dataset.unlocked = String(Boolean(door.unlocked));
  door.element.setAttribute('role', 'img');
  door.element.setAttribute('aria-label', `${door.name} 출입문${door.locked ? ' · 잠김' : ''}`);
  Object.assign(door.element.style, {
    left: `${door.x}px`, top: `${door.y}px`, width: `${door.width}px`, height: `${floorY - door.y}px`,
  });
  parent.append(door.element);
  return door;
}

function setDoorOpen(door, open) {
  door.element.dataset.open = String(open);
  if (door.light) door.light.dataset.open = String(open);
  door.element.setAttribute('aria-label', `${door.name} 문 ${open ? '열림' : '닫힘'}`);
}

// 16층 CU 셔터 레버(소품의 shutterLever: 셔터가 올라가 있음을 나타내는 물건): 내려 있으면 레버를 아래로 당겨 올리고,
// 올라가 있으면 위로 밀어 내린다.
function shutterLeverStep(lever) {
  return collectedItems.has(lever.shutterLever) ?
    { kind: 'lever', dir: 'up', label: '수동 레버를 위로 끝까지 밀어 셔터를 내리자.', ends: ['닫힘', '열림'] } :
    { kind: 'lever', dir: 'down', label: '셔터 제어 기록: "23:59 · 셔터 하강 · 명령 SYSTEM". 수동 레버를 아래로 끝까지 당겨 셔터를 올리자.', ends: ['닫힘', '열림'] };
}

// 레버를 다 움직이면 셔터를 올리거나 내린다. 물건은 바로 기록해(저장에 남는다) 출구와 복도 문이 함께 열리거나 닫힌다.
// 같은 방 출구에서 셔터 판이 약 1초 동안 말려 올라가거나 내려온다(game.css의 data-rolling). 동작 줄이기 설정에서는 바로 바뀐다.
function toggleShutter(lever) {
  const up = !collectedItems.has(lever.shutterLever);
  if (up) collectedItems.add(lever.shutterLever);
  else collectedItems.delete(lever.shutterLever);
  playGameSound('shutter');
  refreshReady();
  updateInteraction(); // 레버 앞 힌트를 "올리기"/"내리기"로 바로 바꾼다.
  const exit = currentDoors.find(door => door.key === 'exit');
  exit.locked = !up;
  exit.message = up ? null : exit.insideMessage;
  exit.element.setAttribute('aria-label', `${exit.name} 출입문${up ? '' : ' · 잠김'}`);
  const element = exit.element;
  element.dataset.unlocked = 'true'; // 말리는 동안 밑에는 열린 칸을 두고, 그 위로 닫힌 셔터 판을 움직인다.
  const settle = () => { delete element.dataset.rolling; element.dataset.unlocked = String(up); };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return settle();
  element.dataset.rolling = up ? 'up' : 'down';
  element.addEventListener('animationend', settle, { once: true });
}
