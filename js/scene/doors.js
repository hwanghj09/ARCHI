// 문 DOM 공용 도우미: 방 출입문 만들기, 문 열림 표시.
function addRoomDoor(door, parent = dynamicScene) {
  door.element = document.createElement('div');
  door.element.className = `room-door ${door.style || ''}`.trim();
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
