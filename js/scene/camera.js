// 카메라와 화면 그리기: 플레이어를 따라가는 시점, 매 프레임 DOM 위치 반영.
let scale = 1;
let viewWidth = 0;
let cameraX = 0;

function cameraTarget() {
  return Math.max(0, Math.min(worldWidth - viewWidth, body.position.x - viewWidth * .42));
}

function render() {
  world.style.setProperty('--sight-x', `${body.position.x}px`);
  world.style.setProperty('--sight-y', `${body.position.y}px`);
  // The image has transparent padding: its soles sit 178px below the sprite top.
  sprite.style.transform = `translate(${body.position.x - 96}px, ${body.bounds.max.y - 178}px) scaleX(${facing})`;
  for (const part of movingParts) {
    part.element.style.left = `${part.body.position.x - part.width / 2}px`;
    part.element.style.top = `${part.body.position.y - part.height / 2}px`;
  }
  world.style.transform = `translate(${-cameraX * scale}px, ${stage.clientHeight - worldHeight * scale}px) scale(${scale})`;
}
