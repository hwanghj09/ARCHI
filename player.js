(() => {
  const stage = document.getElementById('stage');
  const sprite = document.getElementById('player');
  const walkSheet = document.getElementById('walk-sheet');
  const buttons = [...document.querySelectorAll('[data-direction]')];
  const keys = new Set();
  const pointers = new Map();
  const movementKeys = { KeyA: -1, ArrowLeft: -1, KeyD: 1, ArrowRight: 1 };
  const speed = 200;
  const frameDistance = 46;
  let walkDistance = 0;
  let walkReady = false;
  let limit = Math.max(0, stage.clientWidth - sprite.clientWidth);
  let x = limit / 2;
  let facing = 1;
  let previousTime = null;

  function checkWalkSheet() {
    walkReady = walkSheet.naturalWidth === 1024 && walkSheet.naturalHeight === 256;
  }
  walkSheet.addEventListener('load', checkWalkSheet);
  checkWalkSheet();

  function animate(distance) {
    const walking = walkReady && distance > 0;
    walkDistance = walking ? (walkDistance + distance) % (frameDistance * 4) : 0;
    const index = Math.floor(walkDistance / frameDistance);
    sprite.dataset.state = walking ? 'walk' : 'idle';
    sprite.dataset.frame = index;
    walkSheet.style.transform = `translateX(${-index * 25}%)`;
  }

  function render() {
    sprite.style.transform = `translate(${x}px, -50%) scaleX(${facing})`;
  }

  function move(direction, distance) {
    if (direction) facing = direction;
    const oldX = x;
    x = Math.max(0, Math.min(limit, x + direction * distance));
    animate(Math.abs(x - oldX));
    render();
  }

  window.addEventListener('keydown', event => {
    if (!Object.hasOwn(movementKeys, event.code)) return;
    event.preventDefault();
    keys.add(event.code);
  });
  window.addEventListener('keyup', event => keys.delete(event.code));

  function releaseInput() {
    keys.clear();
    pointers.clear();
    buttons.forEach(button => button.classList.remove('active'));
    previousTime = null;
    animate(0);
  }

  window.addEventListener('blur', releaseInput);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseInput();
  });

  buttons.forEach(button => {
    const direction = Number(button.dataset.direction);
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, direction);
      button.classList.add('active');
    });
    const release = event => {
      pointers.delete(event.pointerId);
      button.classList.toggle('active', [...pointers.values()].includes(direction));
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => button.addEventListener(name, release));
    button.addEventListener('contextmenu', event => event.preventDefault());
    // Native Enter/Space activation nudges the player without requiring a pointer.
    button.addEventListener('click', event => {
      if (event.detail === 0) move(direction, 40);
    });
  });

  new ResizeObserver(() => {
    const progress = limit > 0 ? x / limit : .5;
    limit = Math.max(0, stage.clientWidth - sprite.clientWidth);
    x = progress * limit;
    render();
  }).observe(stage);

  function frame(time) {
    const seconds = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, .05);
    previousTime = time;
    const directions = [...keys].map(key => movementKeys[key]).concat([...pointers.values()]);
    const direction = Number(directions.includes(1)) - Number(directions.includes(-1));
    move(direction, speed * seconds);
    requestAnimationFrame(frame);
  }

  render();
  requestAnimationFrame(frame);
})();
