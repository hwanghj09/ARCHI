// 테스트용 층 이동: 엘리베이터를 타지 않고 고른 층의 1번 엘리베이터 앞(옥상은 계단 앞)으로 바로 옮긴다.
const debugFloor = document.getElementById('debug-floor');
const debugFloorSelect = document.getElementById('debug-floor-select');
[ROOFTOP, ...ALL_FLOORS].sort((a, b) => b.floor - a.floor)
  .forEach(entry => debugFloorSelect.add(new Option(floorShortLabel(entry.floor), entry.id)));
debugFloorSelect.value = 'f17';
// 창 안의 방향키/Space/E가 플레이어 조작으로 넘어가지 않게 막는다.
debugFloor.addEventListener('keydown', event => event.stopPropagation());
debugFloor.addEventListener('submit', event => {
  event.preventDefault();
  if (transitioning || selectingFloor || usingComputer || usingKeypad || usingGenerator) return;
  const destId = debugFloorSelect.value;
  stage.focus({ preventScroll: true });
  transitionScene(() => performFloorChange(destId, destId === 'rooftop' ? null : 0));
});
