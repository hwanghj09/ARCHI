import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// 게임 오버(환각·B2 배드 엔딩) → [불러오기] → '← 메인으로' → '계속하기'는 게임 오버 창에 갇히지 않고 이어하기 저장을 불러온다.
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.waitForFunction(() => currentObjective?.title === '퇴근하기');
  for (const kind of ['hallucination', 'b2']) {
    await page.evaluate(() => saveProgress());
    await page.evaluate(kind => {
      if (kind === 'hallucination') triggerDevoured();
      else { showB2BadEnding(); finishB2CaptureScene(); }
    }, kind);
    await page.evaluate(() => saveProgress()); // 탭을 내리는 등 붙잡힌 동안의 저장 시도
    await page.locator(kind === 'b2' ? '#b2-bad-ending .game-over-load' : '#hallucination-caught .game-over-load').click();
    await page.locator('#menu-slots .menu-back').click();
    await page.locator('#menu-continue').click();
    assert(await page.evaluate(() => !hallucinationCaught && b2Ending.phase === 'idle' && !mainMenuActive && sanity > 0 &&
      document.getElementById('hallucination-caught').hidden && document.getElementById('b2-bad-ending').hidden), `${kind}: continue leaves game over`);
  }
  assert.deepEqual(errors, []);
  console.log('game-over-continue: ok');
} finally {
  await browser.close();
}
