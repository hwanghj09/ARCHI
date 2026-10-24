// 지도는 출입구와 위치만 표시하는 약도다. 장면 그림·소품·조명은 복제하지 않는다.
const mapWindow = document.getElementById('map-window');
const mapView = document.getElementById('map-view');
const mapTitle = document.getElementById('map-title');
const mapButton = document.getElementById('map-button');

// 약도에는 출입구·컴퓨터·충전 위치만 남긴다. 조사 소품의 위치는 노출하지 않는다.
function mapInteractables() {
  const list = room === 'dynamic' ? currentDoors.filter(door => !(door.hideWhenTaken && collectedItems.has(door.gives))) :
    room === 'corridor' ? [...doors, ...officeDoors.filter(door => door.room === room)] :
      officeDoors.filter(door => door.room === room);
  return list.filter(door => Number.isFinite(door.x) && Number.isFinite(door.width) &&
    (['elevator', 'room', 'office', 'stairs', 'computer'].includes(door.type) || door.phoneCharger || door.deskComputer));
}

function mapDot(className, x, y, label) {
  const dot = document.createElement('i');
  dot.className = className;
  dot.style.left = `${Math.max(0, Math.min(1, x / worldWidth)) * 100}%`;
  dot.style.top = `${Math.max(0, Math.min(1, y / worldHeight)) * 100}%`;
  if (label) dot.title = label;
  return dot;
}

let mapSignature = '';
let mapPlayer = null;

function mapSceneSignature() {
  return `${room}|${dynamicFloorId}|${currentSceneFloor}|${worldWidth}|${mapInteractables().length}`;
}

function renderMap() {
  mapSignature = mapSceneSignature();
  mapTitle.textContent = `지도 · ${document.querySelector('header span').textContent}`;
  mapView.style.height = '190px';
  mapView.replaceChildren();
  const entries = mapInteractables();
  entries.forEach((door, index) => {
    const dot = mapDot('map-dot', door.x + door.width / 2, floorY, door.name);
    const label = document.createElement('span');
    label.className = 'map-label';
    label.textContent = door.name;
    label.style.left = `clamp(52px, ${dot.style.left}, calc(100% - 52px))`;
    label.style.top = `${8 + index % 3 * 16}%`;
    mapView.append(dot, label);
  });
  mapPlayer = mapDot('map-player', body.position.x, body.position.y, '수호');
  mapView.append(mapPlayer);
}

// 컷씬·메뉴처럼 HUD가 숨는 동안에는 지도도 닫는다(조작 창들이 열려 있는 것은 상관없다).
function mapHidden() {
  return mainMenuActive || openingActive || blackoutSceneActive || storySceneActive || cctvSceneActive || solarRestoreActive || playerCaught || hallucinationCaught || selectingFloor;
}

function updateMap() {
  if (mapWindow.hidden) return;
  if (mapHidden()) { closeMap(); return; }
  if (!transitioning) {
    if (mapSceneSignature() !== mapSignature) renderMap();
    mapPlayer.style.left = `${Math.max(0, Math.min(1, body.position.x / worldWidth)) * 100}%`;
    mapPlayer.style.top = `${Math.max(0, Math.min(1, body.position.y / worldHeight)) * 100}%`;
    mapPlayer.style.setProperty('--face', facing);
  }
  requestAnimationFrame(updateMap);
}

function openMap() {
  if (mapHidden()) return;
  if (mapWindow.hidden) playGameSound('paper');
  mapWindow.hidden = false;
  renderMap();
  requestAnimationFrame(updateMap);
}

function closeMap() {
  mapWindow.hidden = true;
}

function toggleMap() {
  if (mapWindow.hidden) openMap(); else closeMap();
}
mapButton.addEventListener('click', () => {
  toggleMap();
  stage.focus({ preventScroll: true }); // 눌린 버튼이 Space·Enter를 가로채지 않게 한다
});
document.getElementById('map-close').addEventListener('click', () => { closeMap(); stage.focus({ preventScroll: true }); });
