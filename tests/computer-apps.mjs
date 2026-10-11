import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { finishSceneTransition } from './scene-transition.mjs';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click(); await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.keyboard.press('e'); await finishSceneTransition(page);
  const initial = await page.evaluate(() => body.position.x);
  const win = app => page.locator(`.computer-app-window[data-app="${app}"]`);
  const task = app => page.locator(`[data-computer-task-app="${app}"]`);
  const launch = async app => { await page.locator('#computer-start-button').click(); await page.locator(`[data-start-app="${app}"]`).click(); };
  const input = page.locator('#computer-terminal-input');
  const run = async command => { await input.fill(command); await input.press('Enter'); return page.locator('#computer-terminal-output').textContent(); };

  assert.equal(await page.locator('#computer [data-computer-app="mail"], #computer [data-computer-app="building"]').count(), 0, 'Mail and building guide are removed from the PC');
  assert(await task('terminal').isHidden(), 'Unpinned apps stay off the taskbar until they run');

  // Terminal
  await launch('terminal');
  assert(await input.evaluate(el => el === document.activeElement));
  assert(await task('terminal').isVisible());
  assert.match(await run('calc (12+8)*3'), /\(12\+8\)\*3\n?60/);
  assert.match(await run('calc alert(1)'), /숫자와 \+ - \* \/ % \( \)만/, 'calc rejects anything but arithmetic');
  assert.match(await run('dir'), /OPS-017\.txt\s+17층 야간 근무 인수인계/);
  assert.match(await run('type HLP-001'), /조작 키 안내[\s\S]*A \/ ← \| 왼쪽으로 이동 \| ←/, 'type prints the real document');
  assert.match(await run('type nothing'), /지정된 파일을 찾을 수 없습니다/);
  assert.match(await run('foo'), /'foo'은\(는\) 내부 또는 외부 명령/);
  await input.press('ArrowUp');
  assert.equal(await input.inputValue(), 'foo', 'ArrowUp recalls command history');
  await run('start 지뢰 찾기');
  assert(await win('minesweeper').isVisible(), 'start opens apps by their Korean name');
  await task('terminal').click();
  assert.match(await run('tasklist'), /minesweeper\s+지뢰 찾기/);
  assert.match(await run('taskkill minesweeper'), /성공/);
  assert(await win('minesweeper').isHidden());
  await run('cls');
  assert.equal(await page.locator('#computer-terminal-output').textContent(), '');
  await run('exit');
  assert(await win('terminal').isHidden() && await task('terminal').isHidden());
  await page.mouse.click(1200, 60, { button: 'right' });
  await page.locator('#computer-context-terminal').click();
  assert.match(await page.locator('#computer-terminal-output').textContent(), /ARCHI OS/, 'Reopening the terminal starts a fresh session');

  // Minesweeper: first click is safe, flags count down, every safe cell wins, a mine loses.
  // Seeded mines: a random layout can occasionally be cleared by the first click alone.
  await page.evaluate(() => { let seed = 7; Math.random = () => (seed = seed * 16807 % 2147483647) / 2147483647; });
  await launch('minesweeper');
  const cells = page.locator('#computer-mine-board button');
  await cells.nth(40).click();
  assert.deepEqual(await page.evaluate(() => [mineState, mineCells.filter(cell => cell.mine).length, mineCells[40].mine, mineNeighbors(mineCells[40]).some(cell => cell.mine)]), ['playing', 10, false, false]);
  const closed = await page.evaluate(() => mineCells.find(cell => !cell.open).index);
  await cells.nth(closed).click({ button: 'right' });
  assert.equal(await page.locator('#computer-mine-count').textContent(), '009');
  await cells.nth(closed).click({ button: 'right' });
  await page.evaluate(() => mineCells.filter(cell => !cell.mine && !cell.open).forEach(cell => cell.button.click()));
  assert.equal(await page.evaluate(() => mineState), 'won');
  assert.equal(await page.locator('#computer-mine-reset').textContent(), '😎');
  await page.locator('#computer-mine-reset').click();
  await cells.nth(0).click();
  assert.equal(await page.evaluate(() => mineState), 'playing');
  await cells.nth(await page.evaluate(() => mineCells.find(cell => cell.mine).index)).click();
  assert.equal(await page.evaluate(() => mineState), 'lost');
  assert.match(await page.locator('#computer-mine-status').textContent(), /지뢰를 밟았습니다/);

  // Snake: keys steer, food grows the snake, losing focus pauses, walls end the game.
  await launch('snake');
  assert(await page.locator('#computer-snake-board').evaluate(el => el === document.activeElement));
  await page.evaluate(() => { snakeFood = { x: 8, y: 8 }; });
  await page.keyboard.press('ArrowRight');
  await page.clock.runFor(130);
  assert.deepEqual(await page.evaluate(() => [snakeBody.length, snakeScore, snakeBody[0]]), [4, 1, { x: 8, y: 8 }]);
  await page.keyboard.press('ArrowLeft');
  await page.clock.runFor(130);
  assert.deepEqual(await page.evaluate(() => snakeBody[0]), { x: 9, y: 8 }, 'The snake cannot reverse into itself');
  await win('snake').locator('[data-window-minimize]').click();
  await page.clock.runFor(1000);
  assert.deepEqual(await page.evaluate(() => [snakeState, snakeBody[0]]), ['paused', { x: 9, y: 8 }], 'A minimized game pauses');
  await task('snake').click();
  await page.locator('[data-snake-dir="up"]').click();
  await page.clock.runFor(130 * 12);
  assert.equal(await page.evaluate(() => snakeState), 'over');
  assert.match(await page.locator('#computer-snake-status').textContent(), /게임 오버 · 점수 1/);
  assert.equal(await page.locator('#computer-snake-best').textContent(), '1');

  // Paint draws in the chosen colour and the eraser/new canvas clear it.
  await launch('paint');
  const pixel = (x, y) => page.evaluate(([x, y]) => [...paintContext.getImageData(x, y, 1, 1).data].slice(0, 3), [x, y]);
  const canvas = await page.locator('#computer-paint-canvas').boundingBox();
  const scale = canvas.width / 960;
  const stroke = async (from, to) => {
    await page.mouse.move(canvas.x + from * scale, canvas.y + 100 * scale); await page.mouse.down();
    await page.mouse.move(canvas.x + to * scale, canvas.y + 100 * scale, { steps: 6 }); await page.mouse.up();
  };
  await page.locator('[data-paint-color="#e0483b"]').click();
  await stroke(100, 300);
  assert.deepEqual(await pixel(200, 100), [224, 72, 59]);
  await page.locator('#computer-paint-eraser').click();
  await stroke(150, 250);
  assert.deepEqual(await pixel(200, 100), [255, 255, 255]);
  await stroke(100, 300);
  await page.locator('[data-paint-color="#2f74d0"]').click();
  await stroke(100, 300);
  await page.locator('#computer-paint-clear').click();
  assert.deepEqual(await pixel(120, 100), [255, 255, 255]);

  // Snap by dragging to screen edges and with Windows+arrow keys.
  const bar = await win('paint').locator('.computer-titlebar').boundingBox();
  await page.mouse.move(bar.x + 200, bar.y + 22); await page.mouse.down();
  await page.mouse.move(1, 300, { steps: 6 });
  assert(await page.locator('#computer-snap-preview').isVisible(), 'Dragging to an edge previews the snap area');
  await page.mouse.up();
  assert(await page.locator('#computer-snap-preview').isHidden());
  assert.deepEqual(await win('paint').boundingBox(), { x: 0, y: 0, width: 640, height: 664 });
  assert.equal(await win('paint').getAttribute('data-snap'), 'left');
  await page.keyboard.press('Meta+ArrowRight');
  assert.equal((await win('paint').boundingBox()).x, 640);
  await page.keyboard.press('Meta+ArrowUp');
  assert.equal(await win('paint').getAttribute('data-maximized'), 'true');
  await page.keyboard.press('Meta+ArrowDown');
  assert.equal(await win('paint').getAttribute('data-maximized'), 'false');
  assert.equal((await win('paint').boundingBox()).width, 780, 'Restore returns to the normal size');
  await page.keyboard.press('Meta+ArrowLeft');
  const snapped = await win('paint').locator('.computer-titlebar').boundingBox();
  await page.mouse.move(snapped.x + 300, snapped.y + 22); await page.mouse.down();
  await page.mouse.move(snapped.x + 500, snapped.y + 150, { steps: 6 }); await page.mouse.up();
  assert.equal(await win('paint').getAttribute('data-snap'), null);
  assert.equal((await win('paint').boundingBox()).width, 780, 'Dragging a snapped window restores its size');
  await page.keyboard.press('Meta+ArrowDown');
  assert(await win('paint').isHidden(), 'Windows+Down minimizes a normal window');

  // Windows key alone opens Start; Windows+D shows the desktop.
  await task('paint').click();
  await page.keyboard.press('Meta');
  assert(await page.locator('#computer-start-menu').isVisible());
  await page.keyboard.press('Escape');
  await page.keyboard.press('Meta+d');
  assert.equal(await page.evaluate(() => [...computerWindows.values()].filter(state => state.open && !state.minimized).length), 0);
  await page.keyboard.press('Meta+e');
  assert(await win('files').isVisible());

  assert.equal(await page.evaluate(() => body.position.x), initial, 'Game input never reaches the player');
  await page.evaluate(data => restoreProgress(data), await page.evaluate(() => progressSnapshot()));
  assert.equal(await page.evaluate(() => [...computerWindows.values()].some(state => state.open || state.snap)), false);
  assert.deepEqual(errors, []);

  for (const [width, height] of [[390, 844], [844, 390]]) {
    const mobile = await browser.newPage({ viewport: { width, height }, hasTouch: true });
    await mobile.clock.install();
    await mobile.goto(new URL('../index.html', import.meta.url).href);
    await mobile.locator('#menu-start').click(); await mobile.locator('#opening-skip').click();
    await mobile.clock.pauseAt(new Date(Date.now() + 1000));
    await mobile.keyboard.press('e'); await finishSceneTransition(mobile);
    for (const app of ['terminal', 'paint', 'minesweeper', 'snake']) {
      await mobile.locator('#computer-start-button').tap();
      await mobile.locator(`[data-start-app="${app}"]`).tap();
      const box = await mobile.locator(`.computer-app-window[data-app="${app}"]`).boundingBox();
      assert(box.x >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= height - 55, `${app} fits ${width}×${height}`);
      assert(await mobile.locator(`#computer-${app}`).evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${app} has no sideways overflow`);
      await mobile.screenshot({ path: `.local/computer-${app}-${width}.png` });
    }
    await mobile.close();
  }
  console.log('PASS: terminal commands/history/start/taskkill, minesweeper safe start/flags/win/loss, snake steering/food/pause/game over, paint colours/eraser/clear, edge and Windows+arrow snapping, Windows key Start/D/E, unpinned taskbar apps, removed mail/building, restore cleanup and mobile fit.');
} finally { await browser.close(); }
