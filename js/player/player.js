// 플레이어 스프라이트: 움직임 상태와 대기·걷기·달리기·점프·조사 애니메이션.
const idleSheet = document.getElementById('idle-sprite');
const walkSheet = document.getElementById('walk-sheet');
const runSheet = document.getElementById('run-sheet');
const jumpSheet = document.getElementById('jump-sheet');
const interactSheet = document.getElementById('interact-sheet');

let walkDistance = 0;
let runDistance = 0;
let idleTime = 0;
let walkReady = false;
let facing = 1;
let grounded = false;
let jumpQueued = false;
let interactionTime = 0;

function checkWalkSheet() {
  walkReady = walkSheet.naturalWidth === 256 * walkFrames && walkSheet.naturalHeight === 256;
}
walkSheet.addEventListener('load', checkWalkSheet);
checkWalkSheet();

function animate(distance, sprinting = false, elapsed = 0) {
  const running = grounded && sprinting && distance > .1 && runSheet.naturalWidth === 256 * runFrames && runSheet.naturalHeight === 256;
  const walking = grounded && walkReady && distance > .1 && !running;
  walkDistance = walking ? (walkDistance + distance) % (frameDistance * walkFrames) : 0;
  runDistance = running ? (runDistance + distance) % (runFrameDistance * runFrames) : 0;
  const state = !grounded ? (body.velocity.y < 0 ? 'jump' : 'fall') :
    interactionTime > 0 ? 'interact' : running ? 'run' : walking ? 'walk' : 'idle';
  idleTime = state === 'idle' && sprite.dataset.state === 'idle' ? (idleTime + elapsed) % 3200 : 0;
  const index = state === 'fall' ? 1 : state === 'interact' ? Number(interactionTime <= 240) :
    running ? Math.floor(runDistance / runFrameDistance) : walking ? Math.floor(walkDistance / frameDistance) :
    state === 'idle' ? (idleTime < 1200 ? 0 : idleTime < 2100 ? 1 : idleTime < 2220 ? 2 : 3) : 0;
  sprite.dataset.state = state;
  sprite.dataset.frame = index;
  if (state === 'idle') {
    // The original 2x2 sheet has uneven cells: align each hip and sole at the walking scale.
    const hip = [325, 925, 325, 925][index];
    const sole = [619, 619, 1234, 1235][index];
    idleSheet.style.transform = `translate(${96 - hip * .285}px, ${178 - sole * .285}px)`;
    idleSheet.style.clipPath = `inset(${index < 2 ? 0 : 50}% ${index % 2 ? 0 : 50}% ${index < 2 ? 50 : 0}% ${index % 2 ? 50 : 0}%)`;
  }
  if (state === 'walk') walkSheet.style.transform = `translateX(${-index * 100 / walkFrames}%)`;
  if (state === 'run') runSheet.style.transform = `translateX(${-index * 100 / runFrames}%)`;
  if (state === 'jump' || state === 'fall') jumpSheet.style.transform = `translateX(${-index * 50}%)`;
  if (state === 'interact') interactSheet.style.transform = `translateX(${-index * 50}%)`;
}
