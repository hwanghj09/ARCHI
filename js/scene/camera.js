// 카메라와 화면 그리기: 플레이어를 따라가는 시점, 매 프레임 DOM 위치 반영.
let scale = 1;
let viewWidth = 0;
let cameraX = 0;
// 컷씬 카메라(cctv-event.js): cameraFocus 지점을 중심으로 cameraZoom배 확대하고, cameraShake만큼 화면 좌표로 흔든다.
let cameraZoom = 1;
const cameraFocus = { x: 0, y: 0 };
const cameraShake = { x: 0, y: 0 };
// Phone LED coordinates in the 256px animation cells, rendered at 75% scale.
const walkPhoneLamps = [[169, 66], [169, 67], [170, 66], [170, 64],
  [171, 66], [171, 67], [170, 65], [171, 65]];
const runPhoneLamps = [[195, 75], [202, 77], [201, 72], [206, 80], [201, 66], [213, 77], [212, 70], [213, 74],
  [204, 71], [208, 85], [202, 69], [208, 82], [204, 66], [205, 89], [202, 78], [203, 78]];
const averageLamp = lamps => [0, 1].map(axis => lamps.reduce((sum, lamp) => sum + lamp[axis], 0) / lamps.length);
const walkPhoneLampAverage = averageLamp(walkPhoneLamps);
const runLitPhoneLamps = [[112, 120], [104, 118], [112, 121], [112, 121], [114, 108], [114, 108], [95, 114], [95, 114],
  [110, 111], [110, 111], [197, 93], [197, 93], [119, 119], [119, 119], [196, 83], [196, 83]];
const crouchPhoneLamps = [[205, 143], [214, 142], [227, 142], [226, 144]];

function cameraTarget() {
  return Math.max(0, Math.min(worldWidth - viewWidth, body.position.x - viewWidth * .42));
}

function render() {
  world.style.setProperty('--sight-x', `${body.position.x}px`);
  world.style.setProperty('--sight-y', `${body.position.y}px`);
  const state = sprite.dataset.state;
  const index = Number(sprite.dataset.frame) || 0;
  const lamp = state === 'walk' ? walkPhoneLampAverage : state === 'run' ? runLitPhoneLamps[index % runFrames] :
    state === 'jump' ? runPhoneLamps[4] : state === 'fall' ? runPhoneLamps[12] : state === 'crouch' ? crouchPhoneLamps[index % 4] : [158, 68];
  world.style.setProperty('--beam-x', `${body.position.x + (lamp[0] * .75 - 96) * facing}px`);
  world.style.setProperty('--beam-y', `${body.bounds.max.y - 178 + lamp[1] * .75}px`);
  world.style.setProperty('--beam-angle', `${facing === 1 ? 68 : 248}deg`);
  world.style.setProperty('--beam-facing', facing);
  // The image has transparent padding: its soles sit 178px below the sprite top.
  sprite.style.transform = `translate(${body.position.x - 96}px, ${body.bounds.max.y - 178}px) scaleX(${facing})`;
  for (const part of movingParts) {
    part.element.style.left = `${part.body.position.x - part.width / 2}px`;
    part.element.style.top = `${part.body.position.y - part.height / 2}px`;
  }
  const zoomed = cameraZoom - 1;
  const roomInset = Math.max(0, (stage.clientWidth - worldWidth * scale) / 2);
  world.style.transform = `translate(${roomInset - cameraX * scale - cameraFocus.x * scale * zoomed + cameraShake.x}px, ` +
    `${stage.clientHeight - worldHeight * scale - cameraFocus.y * scale * zoomed + cameraShake.y}px) scale(${scale * cameraZoom})`;
  renderHallucination();
  updateRedEyes();
}
