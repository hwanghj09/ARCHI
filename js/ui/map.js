// 지도 창: 지도 버튼(#map-button)을 누르면 화면 가운데에 지금 장면을 축소한 지도가 뜬다. 배경은 장면 DOM(그림·소품·문)을 복제해
// 줄인 것이고, 그 위에 수호의 얼굴(원형 아이콘)과 상호작용할 수 있는 물체(청록색 점)를 같은 비율로 찍는다.
// 조사창과 달리 게임을 멈추지 않는다: 열린 채로 이동하면 수호 표시가 따라 움직이고, 층·방이 바뀌면 지도도 새로 그린다.
const mapWindow = document.getElementById('map-window');
const mapView = document.getElementById('map-view');
const mapTitle = document.getElementById('map-title');
const mapButton = document.getElementById('map-button');

// 복제본은 shadow DOM 안에 둔다: id가 겹쳐도 게임 코드의 getElementById·querySelector가 헷갈리지 않고,
// 같은 스타일시트를 넣어 두면 #world·#stage 기준 CSS가 복제본에도 그대로 적용된다. closed로 둬서 테스트 도구(Playwright)의 #stage·#world
// 같은 찾기에도 복제본이 함께 잡히지 않는다(코드는 mapShadow로 직접 쓴다).
const mapShadow = mapView.attachShadow({ mode: 'closed' });
for (const link of document.querySelectorAll('link[rel="stylesheet"]')) mapShadow.append(link.cloneNode());
const mapStage = document.createElement('main');
mapStage.id = 'stage';
mapShadow.append(mapStage, document.createElement('slot')); // 슬롯으로 점·얼굴 표시(light DOM 자식)를 복제본 위에 보여 준다
// 지도 그림에서 빼는 것: 어둠·조명·환각·힌트처럼 매 프레임 바뀌거나 지도에 필요 없는 막, 그리고 수호(얼굴 아이콘으로 따로 그린다).
const MAP_SKIP = ['darkness', 'room-alarm', 'flashlight-beam', 'flashlight-glow', 'red-eyes', 'red-eye-shards', 'interaction-outline', 'interaction-hint', 'player', 'opening-chair-front'];

// updateInteraction()이 조사 대상으로 삼는 물체와 같은 목록.
function mapInteractables() {
  const list = room === 'dynamic' ? currentDoors.filter(door => !(door.hideWhenTaken && collectedItems.has(door.gives))) :
    room === 'corridor' ? [...doors, ...officeDoors.filter(door => door.room === room)] :
      [...officeDoors.filter(door => door.room === room), officeComputer, ...(officePostit.element.hidden ? [] : [officePostit])];
  return list.filter(door => Number.isFinite(door.x) && Number.isFinite(door.width));
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
  const width = mapView.clientWidth;
  const k = width / worldWidth;
  mapView.style.height = `${worldHeight * k}px`;
  Object.assign(mapStage.style, { width: `${width}px`, height: `${worldHeight * k}px`, position: 'relative', overflow: 'hidden' });
  const copy = world.cloneNode(true);
  for (const id of MAP_SKIP) copy.querySelector(`#${id}`)?.remove();
  Object.assign(copy.style, { transform: `scale(${k})`, filter: 'none', width: `${worldWidth}px`, height: `${worldHeight}px`, left: '0px', top: '0px' });
  copy.removeAttribute('data-opening');
  mapStage.replaceChildren(copy);
  for (const old of mapView.querySelectorAll('i')) old.remove();
  for (const door of mapInteractables()) {
    const y = Number.isFinite(door.y) ? door.y + (door.height ?? floorY - door.y) / 2 : floorY - 60;
    mapView.append(mapDot('map-dot', door.x + door.width / 2, y, door.name));
  }
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
