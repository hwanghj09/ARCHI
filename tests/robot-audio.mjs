import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.clock.install({ time: new Date("2026-10-17T00:00:00Z") });
  await page.goto(new URL("../index.html", import.meta.url).href);
  await page.locator("#menu-start").click();
  await page.locator("#opening-skip").click();
  await page.clock.pauseAt(new Date("2026-10-17T00:01:00Z"));
  await page.evaluate(() => {
    triggerBuildingBlackout();
    window.audioEvents = [];
    const original = playGameSound;
    playGameSound = (name, options) => { audioEvents.push(name); original(name, options); };
  });
  const clear = () => page.evaluate(() => { audioEvents.length = 0; });
  const events = () => page.evaluate(() => [...audioEvents]);
  await page.evaluate(() => {
    performFloorChange('f1');
    collectedItems.add('f17-emergency-linked'); solarEnabled = true; solarPoweredFloors = [1]; updatePowerState();
    Object.assign(guardPatrol, { x: 3000, facing: 1, mode: 'return', wait: 0, chaseOriginX: 3400, soundDistance: 0 });
    Body.setPosition(body, { x: 2600, y: floorY - 81 });
    audioEvents.length = 0;
    for (let i = 0; i < 60; i++) updateGuardPatrol(1000 / 60);
  });
  assert((await events()).includes('robot-step') && (await events()).includes('robot-servo'), 'The powered guard has mechanical movement sounds while returning');
  const robotSteps = async (mode, wait = 0, delta = 1000 / 60) => page.evaluate(({ mode, wait, delta }) => {
    performFloorChange('f5'); solarEnabled = false; updatePowerState();
    roamerEnter('f5', 'elevator');
    Object.assign(roamer, { x: 3000, facing: 1, mode, wait, stay: 60000, soundDistance: 0, lostTime: 0, elapsed: 0, stepFrame: 0 });
    Body.setPosition(body, { x: 3600, y: floorY - 400 }); grounded = false;
    audioEvents.length = 0;
    // 발소리는 발이 닿는 컷마다 난다(걷기 480ms, 달리기 360ms 간격): 1.67초면 걷기 3번, 달리기 4번.
    for (let i = 0; i < 100; i++) updateGuardPatrol(delta);
    return audioEvents.filter(name => name === 'robot-step').length;
  }, { mode, wait, delta });
  const patrolSteps = await robotSteps('patrol');
  assert(patrolSteps >= 1, 'The elevator patrol has mechanical movement sounds on an unpowered floor');
  assert(await robotSteps('chase') > patrolSteps, 'Chasing produces a faster mechanical cadence');
  assert.equal(await robotSteps('patrol', 2000), 0, 'Scanning in place has no movement sounds');
  assert.equal(await robotSteps('dock'), 0, 'A docked robot stays silent');
  assert.equal(await robotSteps('patrol', 0, 0), 0, 'Rendering a robot does not play movement sounds');
  await page.evaluate(() => {
    collectedItems.delete('f17-emergency-linked');
    performFloorChange('f1');
    Object.assign(guardPatrol, { mode: 'patrol', wait: 0, soundDistance: 37 });
    audioEvents.length = 0;
    for (let i = 0; i < 60; i++) updateGuardPatrol(1000 / 60);
  });
  assert(!(await events()).includes('robot-step'), 'An unpowered guard stays silent');
  await page.evaluate(() => {
    performFloorChange('f6'); roamerEnter('f5', 'elevator'); audioEvents.length = 0;
    for (let i = 0; i < 60; i++) updateGuardPatrol(1000 / 60);
  });
  assert(!(await events()).includes('robot-step'), 'Robots in another scene stay silent');
  await page.evaluate(() => {
    performFloorChange('f5'); roamerEnter('f5', 'elevator');
    elevatorCars[0].floor = 5; showCabin(0);
    const stop = cabinPryStopX();
    Object.assign(roamer, { x: stop + 300, mode: 'chase', soundDistance: 0 });
    audioEvents.length = 0;
    for (let i = 0; i < 120; i++) updateRoamerCabin(1000 / 60);
  });
  assert((await events()).includes('robot-step'), 'The patrol approaching the elevator cabin has movement sounds');
  await clear();
  await page.evaluate(() => { for (let i = 0; i < 60; i++) updateRoamerCabin(1000 / 60); });
  assert(!(await events()).includes('robot-step'), 'The patrol stops making movement sounds at the cabin door');
  const levels = await page.evaluate(() => {
    for (const sound of gameAudioEffects) sound.source.stop();
    gameAudioEffects.clear();
    gameVolume = 1;
    const x = body.position.x;
    const play = offset => {
      const count = gameAudioEffects.size;
      playGameSound('robot-step', { x: x + offset });
      return gameAudioEffects.size > count ? [...gameAudioEffects].at(-1).gain.gain.value : 0;
    };
    const near = play(0), far = play(400), outside = play(800);
    gameVolume = 0;
    const muted = play(0);
    gameVolume = 1;
    pauseGameAudio();
    return { near, far, outside, muted, stopped: [...gameAudioEffects].every(sound => sound.stopping) };
  });
  assert(Math.abs(levels.near - .52) < .001 && Math.abs(levels.far - .26) < .001, 'Movement sound fades with distance, including inside the cabin');
  assert.equal(levels.outside, 0, 'Robots beyond hearing range stay silent');
  assert.equal(levels.muted, 0, 'The volume control mutes robot movement');
  assert(levels.stopped, 'Pausing audio stops robot movement effects');
  assert.deepEqual(errors, []);
  console.log("PASS: robot patrol/chase cadence, dark floors, stationary/dock/render/power/other-scene silence and elevator cabin approach.");
} finally { await browser.close(); }
