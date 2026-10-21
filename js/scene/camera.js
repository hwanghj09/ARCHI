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
const runPhoneLampAverage = averageLamp(runPhoneLamps);
const runLitPhoneLamps = [[204, 80], [203, 80], [209, 77], [208, 77], [209, 72], [210, 72], [220, 77], [220, 77],
  [211, 73], [212, 73], [209, 75], [210, 75], [210, 71], [211, 71], [209, 83], [209, 83]];

function cameraTarget() {
  return Math.max(0, Math.min(worldWidth - viewWidth, body.position.x - viewWidth * .42));
}

function render() {
  world.style.setProperty('--sight-x', `${body.position.x}px`);
  world.style.setProperty('--sight-y', `${body.position.y}px`);
  const state = sprite.dataset.state;
  const index = Number(sprite.dataset.frame) || 0;
  // 새 플래시 달리기는 실제 휴대폰 LED를 따라간다. 기존 시트는 이전 평균 좌표를 유지한다.
  const lamp = state === 'walk' ? walkPhoneLampAverage : state === 'run' ? (phoneLightOn ? runLitPhoneLamps[index % runFrames] : runPhoneLampAverage) :
    state === 'jump' ? runPhoneLamps[4] : state === 'fall' ? runPhoneLamps[12] : state === 'crouch' ? [180, 196] : [158, 68];
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
