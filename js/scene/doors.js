// 문 DOM 공용 도우미: 방 출입문 만들기, 문 열림 표시, 셔터 올리기 연출.
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

// 안에서 처음 올린 셔터(16층 CU): 복도로 넘어온 뒤 열린 그림 위에서 닫힌 셔터 판이 말려 올라간다(index.html의
// data-raising, 약 1초). 도착 문구 대신 레버 문구를 다시 띄우고, 동작 줄이기 설정에서는 바로 열린 모습만 보인다.
function raiseShutter(door, message) {
  showStatus(message, 4000);
  if (!door || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  door.element.dataset.raising = 'true';
  door.element.addEventListener('animationend', () => { delete door.element.dataset.raising; }, { once: true });
}
