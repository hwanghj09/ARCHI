// 17층 컴퓨터 게임: 지뢰 찾기(9×9, 지뢰 10개)와 스네이크. 창을 닫았다 열면 새 게임이다.
const MINE_SIZE = 9, MINE_TOTAL = 10;
const mineBoard = document.getElementById('computer-mine-board');
const mineReset = document.getElementById('computer-mine-reset');
const mineFlagMode = document.getElementById('computer-mine-flag');
let mineCells = [];
let mineState = 'ready';
let mineTimer = null;
let mineStarted = 0;

for (let index = 0; index < MINE_SIZE * MINE_SIZE; index++) {
  const button = document.createElement('button');
  button.type = 'button';
  button.addEventListener('click', () => pressMineCell(mineCells[index], mineFlagMode.checked));
  button.addEventListener('contextmenu', event => { event.preventDefault(); pressMineCell(mineCells[index], true); });
  button.addEventListener('keydown', event => {
    const step = { ArrowUp: -MINE_SIZE, ArrowDown: MINE_SIZE, ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (event.key.toLowerCase() === 'f') { event.preventDefault(); pressMineCell(mineCells[index], true); }
    if (step === undefined) return;
    event.preventDefault();
    const next = index + step;
    if (next >= 0 && next < MINE_SIZE * MINE_SIZE && (Math.abs(step) !== 1 || Math.floor(next / MINE_SIZE) === Math.floor(index / MINE_SIZE))) mineBoard.children[next].focus();
  });
  mineBoard.append(button);
}

function mineNeighbors(cell) {
  const row = Math.floor(cell.index / MINE_SIZE), column = cell.index % MINE_SIZE, around = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const y = row + dy, x = column + dx;
    if ((dx || dy) && y >= 0 && y < MINE_SIZE && x >= 0 && x < MINE_SIZE) around.push(mineCells[y * MINE_SIZE + x]);
  }
  return around;
}

function resetMinesweeper() {
  clearInterval(mineTimer);
  mineTimer = null;
  mineState = 'ready';
  mineFlagMode.checked = false;
  mineCells = [...mineBoard.children].map((button, index) => ({ index, button, mine: false, open: false, flag: false, count: 0 }));
  document.getElementById('computer-mine-status').textContent = '';
  document.getElementById('computer-mine-time').value = '000';
  renderMinesweeper();
}
COMPUTER_APPS.minesweeper.reset = resetMinesweeper;
mineReset.addEventListener('click', () => { resetMinesweeper(); mineBoard.firstElementChild.focus(); });

function layMines(safe) {
  // 처음 연 칸과 그 주변에는 지뢰를 두지 않는다.
  const banned = new Set([safe, ...mineNeighbors(safe)]);
  const pool = mineCells.filter(cell => !banned.has(cell));
  for (let placed = 0; placed < MINE_TOTAL; placed++) pool.splice(Math.floor(Math.random() * pool.length), 1)[0].mine = true;
  for (const cell of mineCells) cell.count = mineNeighbors(cell).filter(near => near.mine).length;
  mineState = 'playing';
  mineStarted = Date.now();
  mineTimer = setInterval(() => {
    if (!computerWindows.get('minesweeper').open) return clearInterval(mineTimer);
    document.getElementById('computer-mine-time').value = String(Math.min(999, Math.floor((Date.now() - mineStarted) / 1000))).padStart(3, '0');
  }, 1000);
}

function openMineCell(start) {
  const queue = [start];
  while (queue.length) {
    const cell = queue.pop();
    if (cell.open || cell.flag) continue;
    cell.open = true;
    if (!cell.count && !cell.mine) queue.push(...mineNeighbors(cell));
  }
}

function pressMineCell(cell, flag) {
  if (mineState === 'won' || mineState === 'lost') return;
  if (flag) { if (!cell.open) cell.flag = !cell.flag; }
  else if (cell.open) {
    // 숫자 칸: 주변 깃발 수가 숫자와 같으면 나머지 칸을 한 번에 연다.
    const around = mineNeighbors(cell);
    if (cell.count && around.filter(near => near.flag).length === cell.count) for (const near of around) openMineCell(near);
  } else if (!cell.flag) {
    if (mineState === 'ready') layMines(cell);
    openMineCell(cell);
  }
  const lost = mineCells.some(item => item.open && item.mine);
  const won = !lost && mineCells.every(item => item.open || item.mine);
  if (lost || won) {
    clearInterval(mineTimer);
    mineState = lost ? 'lost' : 'won';
    for (const item of mineCells) if (item.mine) { if (won) item.flag = true; else if (!item.flag) item.open = true; }
    document.getElementById('computer-mine-status').textContent = won ? `성공! ${Number(document.getElementById('computer-mine-time').value)}초 만에 모두 찾았습니다.` : '지뢰를 밟았습니다. 얼굴을 눌러 다시 시작하세요.';
  }
  renderMinesweeper();
}

function renderMinesweeper() {
  for (const cell of mineCells) {
    const row = Math.floor(cell.index / MINE_SIZE) + 1, column = cell.index % MINE_SIZE + 1;
    cell.button.textContent = cell.flag && !cell.open ? '🚩' : !cell.open ? '' : cell.mine ? '💣' : cell.count || '';
    cell.button.dataset.open = String(cell.open);
    cell.button.dataset.count = String(cell.open && !cell.mine ? cell.count : '');
    cell.button.setAttribute('aria-label', `${row}행 ${column}열 ${cell.flag && !cell.open ? '깃발' : !cell.open ? '닫힘' : cell.mine ? '지뢰' : cell.count ? `주변 지뢰 ${cell.count}` : '빈 칸'}`);
  }
  document.getElementById('computer-mine-count').value = String(MINE_TOTAL - mineCells.filter(cell => cell.flag && !cell.open).length).padStart(3, '0');
  mineReset.textContent = { won: '😎', lost: '😵' }[mineState] || '🙂';
}
resetMinesweeper();

const SNAKE_GRID = 16, SNAKE_CELL = 20;
const snakeBoard = document.getElementById('computer-snake-board');
const snakeContext = snakeBoard.getContext('2d');
const snakeDirections = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
let snakeBody, snakeDirection, snakeNextDirection, snakeFood, snakeScore, snakeState, snakeTimer = null, snakeBest = 0;

function setSnakeStatus(text) { document.getElementById('computer-snake-status').textContent = text; }

function resetSnake() {
  clearInterval(snakeTimer);
  snakeTimer = null;
  snakeBody = [{ x: 7, y: 8 }, { x: 6, y: 8 }, { x: 5, y: 8 }];
  snakeDirection = snakeNextDirection = snakeDirections.right;
  snakeScore = 0;
  snakeState = 'ready';
  placeSnakeFood();
  setSnakeStatus('방향키를 눌러 시작');
  drawSnake();
}
COMPUTER_APPS.snake.reset = resetSnake;

function placeSnakeFood() {
  const free = [];
  for (let y = 0; y < SNAKE_GRID; y++) for (let x = 0; x < SNAKE_GRID; x++) if (!snakeBody.some(part => part.x === x && part.y === y)) free.push({ x, y });
  snakeFood = free[Math.floor(Math.random() * free.length)];
}

function steerSnake(name) {
  if (snakeState === 'over') resetSnake();
  const direction = snakeDirections[name];
  // 바로 뒤로는 돌 수 없다(현재 진행 방향 기준).
  if (direction.x !== -snakeDirection.x || direction.y !== -snakeDirection.y) snakeNextDirection = direction;
  if (snakeState !== 'running') runSnake();
}

function runSnake() {
  snakeState = 'running';
  setSnakeStatus('');
  snakeTimer ??= setInterval(stepSnake, 130);
}

function pauseSnake() {
  clearInterval(snakeTimer);
  snakeTimer = null;
  if (snakeState === 'running') { snakeState = 'paused'; setSnakeStatus('일시정지 · 방향키나 스페이스로 계속'); }
}

function stepSnake() {
  // 다른 창을 보거나 최소화·종료하면 멈춘다.
  const state = computerWindows.get('snake');
  if (computer.hidden || computerActiveWindow !== state || state.minimized) return pauseSnake();
  snakeDirection = snakeNextDirection;
  const head = { x: snakeBody[0].x + snakeDirection.x, y: snakeBody[0].y + snakeDirection.y };
  const eating = snakeFood && head.x === snakeFood.x && head.y === snakeFood.y;
  const body = eating ? snakeBody : snakeBody.slice(0, -1);
  if (head.x < 0 || head.y < 0 || head.x >= SNAKE_GRID || head.y >= SNAKE_GRID || body.some(part => part.x === head.x && part.y === head.y)) {
    clearInterval(snakeTimer);
    snakeTimer = null;
    snakeState = 'over';
    snakeBest = Math.max(snakeBest, snakeScore);
    setSnakeStatus(`게임 오버 · 점수 ${snakeScore} · 방향키로 다시 시작`);
  } else {
    snakeBody = [head, ...body];
    if (eating) { snakeScore++; placeSnakeFood(); }
    if (!snakeFood) { pauseSnake(); snakeState = 'over'; snakeBest = Math.max(snakeBest, snakeScore); setSnakeStatus('판을 가득 채웠습니다!'); }
  }
  drawSnake();
}

function drawSnake() {
  snakeContext.fillStyle = '#16301f';
  snakeContext.fillRect(0, 0, snakeBoard.width, snakeBoard.height);
  snakeContext.fillStyle = '#1c3a26';
  for (let y = 0; y < SNAKE_GRID; y++) for (let x = (y % 2); x < SNAKE_GRID; x += 2) snakeContext.fillRect(x * SNAKE_CELL, y * SNAKE_CELL, SNAKE_CELL, SNAKE_CELL);
  if (snakeFood) {
    snakeContext.fillStyle = '#e0483b';
    snakeContext.fillRect(snakeFood.x * SNAKE_CELL + 4, snakeFood.y * SNAKE_CELL + 4, SNAKE_CELL - 8, SNAKE_CELL - 8);
  }
  snakeBody.forEach((part, index) => {
    snakeContext.fillStyle = index ? '#8fd15a' : '#c7f08f';
    snakeContext.fillRect(part.x * SNAKE_CELL + 1, part.y * SNAKE_CELL + 1, SNAKE_CELL - 2, SNAKE_CELL - 2);
  });
  document.getElementById('computer-snake-score').value = String(snakeScore);
  document.getElementById('computer-snake-best').value = String(snakeBest);
}

document.getElementById('computer-snake').addEventListener('keydown', event => {
  const name = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }[event.key.length === 1 ? event.key.toLowerCase() : event.key];
  if (name) { event.preventDefault(); steerSnake(name); }
  else if (event.code === 'Space' && !event.target.closest('button')) {
    event.preventDefault();
    if (snakeState === 'running') pauseSnake();
    else if (snakeState === 'paused') runSnake();
  }
});
for (const button of document.querySelectorAll('[data-snake-dir]')) button.addEventListener('click', () => steerSnake(button.dataset.snakeDir));
resetSnake();
