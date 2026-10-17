// 직접 조작 창(js/interaction/manual-control.js)을 열자마자 끝내, 조작 뒤의 결과만 보는 테스트가 예전처럼 E 한 번으로 진행되게 한다.
// 선택기(4층 UPS)는 예전처럼 다음 칸을 고른다. 조작 자체는 tests/manual-control.mjs가 확인한다.
export function autoControl(page) {
  return page.addInitScript(() => addEventListener('DOMContentLoaded', () => {
    const open = openControl;
    openControl = door => {
      open(door);
      while (usingControl) {
        if (controlStep.choice !== null) controlStep.choice = (controlStep.choice + 1) % controlStep.choices.length;
        controlStep.done = true;
        nextControlStep();
      }
    };
  }));
}
