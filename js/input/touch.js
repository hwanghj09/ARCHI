// 화면 버튼(터치·마우스) 조작.
function pressAction(button) {
  if (button.id === 'interact') interact();
  else if (button.id === 'phone-button') togglePhone();
  else if (button.id === 'flash-button') togglePhoneLight();
}

buttons.forEach(button => {
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || photoCaptureTime > 0 || itemUseTime > 0 || blackoutSceneActive || cctvSceneActive || playerCaught || hallucinationCaught || transitioning || (selectingFloor && button.id !== 'phone-button') || usingComputer || usingKeypad || usingControl || (usingPhone && button.id === 'interact') || usingPowerPanel || usingInspection) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    pressAction(button);
    button.classList.add('active');
  });
  const release = () => button.classList.remove('active');
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => button.addEventListener(name, release));
  button.addEventListener('contextmenu', event => event.preventDefault());
  button.addEventListener('click', event => {
    if (event.detail !== 0 || photoCaptureTime > 0 || itemUseTime > 0 || blackoutSceneActive || cctvSceneActive || playerCaught || hallucinationCaught || transitioning || (selectingFloor && button.id !== 'phone-button') || usingComputer || usingKeypad || usingControl || (usingPhone && button.id === 'interact') || usingPowerPanel || usingInspection) return;
    pressAction(button);
  });
});

