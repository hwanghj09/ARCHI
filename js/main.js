// 시작: 화면 크기에 맞춰 배율을 잡고 첫 화면을 그린 뒤 게임 루프를 돌린다. 반드시 맨 마지막에 불러온다.
new ResizeObserver(() => {
  scale = stage.clientHeight / worldHeight;
  viewWidth = stage.clientWidth / scale;
  cameraX = cameraTarget();
  render();
}).observe(stage);

showMainMenu();
render();
requestAnimationFrame(frame);
