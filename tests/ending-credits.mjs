import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// 엔딩 크레딧: 배드 엔딩(b2-capture-scene.js)과 TRUE END(b2-ending.js showB2Escape) 모두 검은 바탕 흰 글씨에 엔딩 소리와 함께
// 팀 일석사조와 역할별 이름이 올라간다. TRUE END는 Esc·클릭으로 건너뛰면 바로 [메인 메뉴로]가 뜬다.
// 움직임 줄이기에서는 크레딧이 스크롤되지 않고 한 번에 보인다.
const credits = [
  ['TEAM', '일석사조'],
  ['멘토', '조현아, 남희수, 이태현, 이우진'],
  ['멘티', '정수호, 황현준, 김정래, 구윤찬, 정민준'],
  ['PM', '정민준'],
  ['기획', '정수호, 황현준, 김정래, 구윤찬, 정민준'],
  ['개발', '정수호, 황현준, 김정래, 구윤찬, 정민준'],
  ['사운드', '황현준'],
  ['디자인', '황현준'],
  ['QA', '멘토, 동생, 친구들'],
];
const browser = await chromium.launch();
try {
  const run = async (reducedMotion, skip) => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-10-03T00:00:00Z') });
    await page.goto(new URL('../index.html', import.meta.url).href);
    await page.locator('#menu-start').click();
    if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
    await page.locator('#opening-skip').click();
    await page.evaluate(() => {
      window.playedSounds = [];
      const play = playGameSound;
      playGameSound = (name, ...rest) => { playedSounds.push(name); return play(name, ...rest); };
    });
    const colors = selector => page.locator(selector).evaluate(element => [getComputedStyle(element).backgroundColor, getComputedStyle(element).color]);

    // 배드 엔딩: 붙잡힌 연출이 끝나면 검은 화면에 흰 글씨로 결말·크레딧이 뜨고, 버튼은 바로 누를 수 있다.
    await page.evaluate(() => { startB2CaptureScene(); finishB2CaptureScene(); });
    assert(await page.locator('#b2-bad-ending').isVisible(), 'The bad ending shows');
    assert.deepEqual(await colors('#b2-bad-ending'), ['rgb(0, 0, 0)', 'rgb(255, 255, 255)']);
    assert.equal(await page.locator('#b2-bad-ending .b2-credits-roll').count(), 1, 'The bad ending rolls the credits');
    assert.match(await page.locator('#b2-bad-ending').textContent(), /일석사조/);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'b2-checkpoint', 'The bad ending buttons work right away');
    assert(await page.evaluate(() => playedSounds.includes('ending-bad')), 'The bad ending plays its sound');
    await page.evaluate(() => resetB2Ending());

    // TRUE END
    await page.evaluate(() => showB2Escape());
    assert(await page.evaluate(() => playedSounds.includes('ending-true')), 'The true ending plays its sound');
    const step = () => page.evaluate(() => document.getElementById('b2-escape').dataset.step);
    // 크레딧 전에는 Esc로 건너뛰지 않는다.
    await page.keyboard.press('Escape');
    assert.equal(await step(), 'black');
    await page.clock.runFor(4500);
    assert.equal(await step(), 'title');
    assert.deepEqual(await colors('#b2-escape'), ['rgb(0, 0, 0)', 'rgb(255, 255, 255)']);
    assert.equal((await colors('#b2-escape-title'))[1], 'rgb(255, 255, 255)');
    await page.clock.runFor(3100);
    assert.equal(await step(), 'credits');
    const shown = await page.locator('.b2-credits-roll p').evaluateAll(lines => lines.map(line => [line.querySelector('span').textContent, line.lastChild.textContent]));
    assert.deepEqual(shown, credits);
    assert(await page.locator('.b2-credits-skip').isVisible(), 'The skip hint shows during the credits');
    assert(!(await page.locator('#b2-escape-menu').isVisible()), 'The menu button waits for the credits');
    const animation = await page.locator('.b2-credits-roll').evaluate(roll => getComputedStyle(roll).animationName);
    assert.equal(animation, reducedMotion === 'reduce' ? 'none' : 'b2-credits', 'Reduced motion keeps the credits still');
    if (skip === 'Escape') await page.keyboard.press('Escape');
    else await page.mouse.click(640, 360);
    assert.equal(await step(), 'done', `${skip} skips the credits`);
    assert(await page.locator('#b2-escape-menu').isVisible(), 'Skipping shows [메인 메뉴로]');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'b2-escape-menu');
    assert.equal(await page.evaluate(() => mainMenuActive), false, 'Skipping does not open the pause menu');
    await page.clock.runFor(20000);
    assert.equal(await step(), 'done', 'Skipped timers do not run again');
    await page.locator('#b2-escape-menu').click();
    assert(await page.locator('#main-menu').isVisible(), 'The credits return to the main menu');
    assert.deepEqual(errors, []);
    await page.close();
  };
  await run('no-preference', 'Escape');
  await run('reduce', 'click');
  console.log('Ending credit checks passed.');
} finally {
  await browser.close();
}
