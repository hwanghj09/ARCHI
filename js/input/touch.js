// 화면 버튼(터치·마우스) 조작.
function pressAction(button) {
  if (button.id === 'jump') jumpQueued = true;
  else if (button.id === 'interact') interact();
}

buttons.forEach(button => {
  const direction = Number(button.dataset.direction) || 0;
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || transitioning || selectingFloor || usingComputer || usingKeypad) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    if (direction) pointers.set(event.pointerId, direction);
    else pressAction(button);
    button.classList.add('active');
  });
  const release = event => {
    pointers.delete(event.pointerId);
    button.classList.toggle('active', direction ? [...pointers.values()].includes(direction) : false);
  };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => button.addEventListener(name, release));
  button.addEventListener('contextmenu', event => event.preventDefault());
  button.addEventListener('click', event => {
    if (event.detail !== 0 || transitioning || selectingFloor || usingComputer || usingKeypad) return;
    if (direction) {
      pulseDirection = direction;
      pulseTime = 150;
    } else pressAction(button);
  });
});
