// 문 DOM 공용 도우미: 방 출입문 만들기, 문 열림 표시.
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
  door.element.setAttribute('aria-label', `${door.name} 문 ${open ? '열림' : '닫힘'}`);
}
