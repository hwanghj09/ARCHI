// 카메라와 화면 그리기: 플레이어를 따라가는 시점, 매 프레임 DOM 위치 반영.
let scale = 1;
let viewWidth = 0;
let cameraX = 0;
// Phone LED coordinates in the 256px animation cells, rendered at 75% scale.
const walkPhoneLamps = [[168, 66], [170, 67], [162, 68], [166, 65], [165, 67], [164, 67]];
const runPhoneLamps = [[195, 75], [201, 72], [201, 66], [212, 70], [204, 71], [202, 69], [204, 66], [202, 78]];

function cameraTarget() {
  return Math.max(0, Math.min(worldWidth - viewWidth, body.position.x - viewWidth * .42));
}

function render() {
  world.style.setProperty('--sight-x', `${body.position.x}px`);
  world.style.setProperty('--sight-y', `${body.position.y}px`);
  const state = sprite.dataset.state;
  const index = Number(sprite.dataset.frame) || 0;
  const lamp = state === 'walk' ? walkPhoneLamps[index] : state === 'run' ? runPhoneLamps[index] :
    state === 'jump' ? runPhoneLamps[2] : state === 'fall' ? runPhoneLamps[6] : [158, 68];
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
  world.style.transform = `translate(${-cameraX * scale}px, ${stage.clientHeight - worldHeight * scale}px) scale(${scale})`;
}
