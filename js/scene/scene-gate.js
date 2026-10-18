// 시간으로 흐르는 컷씬(오프닝·정전·소등)의 대사를 클릭으로 넘기는 공통 틀. 대사가 바뀔 시각과 끝나는 시각(holds, ms)에 닿으면
// 그 직전에서 시간을 멈추고(연출 화면에 data-waiting, "클릭 · E로 계속"), 화면을 클릭하거나 E·Enter(keyboard.js)를 누르면 다시 흐른다. 건너뛰기 버튼 클릭은 넘기지 않는다.
function createSceneGate(overlay, holds) {
  const gate = {
    index: 0, waiting: false,
    // time에서 elapsed만큼 흘린 시각을 돌려준다. 아직 넘기지 않은 멈춤 시각에 닿으면 그 1ms 앞에서 멈춘다.
    advance(time, elapsed) {
      if (gate.waiting) return time;
      const hold = holds[gate.index];
      if (hold === undefined || time + elapsed < hold) return time + elapsed;
      gate.waiting = true;
      overlay.dataset.waiting = 'true';
      return hold - 1;
    },
    reset() {
      gate.index = 0; gate.waiting = false;
      delete overlay.dataset.waiting;
    },
  };
  overlay.addEventListener('click', event => {
    if (!gate.waiting || event.target.closest('button')) return;
    gate.waiting = false;
    gate.index++;
    delete overlay.dataset.waiting;
  });
  return gate;
}
