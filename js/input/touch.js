// 화면 버튼(터치·마우스) 조작.
function pressAction(button) {
  if (button.id === 'jump') jumpQueued = true;
  else if (button.id === 'interact') interact();
  else if (button.id === 'phone-button') togglePhone();
}

buttons.forEach(button => {
  const direction = Number(button.dataset.direction) || 0;
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || blackoutSceneActive || playerCaught || hallucinationCaught || transitioning || selectingFloor || usingComputer || usingKeypad || usingPhone || usingPowerPanel || usingInspection) return;
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
    if (event.detail !== 0 || blackoutSceneActive || playerCaught || hallucinationCaught || transitioning || selectingFloor || usingComputer || usingKeypad || usingPhone || usingPowerPanel || usingInspection) return;
    if (direction) {
      pulseDirection = direction;
      pulseTime = 150;
    } else pressAction(button);
  });
});
