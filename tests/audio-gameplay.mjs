import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  await page.locator('#menu-start').click();
  await page.waitForFunction(() => openingReady);
  await page.evaluate(() => {
    window.audioEvents = [];
    const original = playGameSound;
    playGameSound = (name, options) => { audioEvents.push(name); original(name, options); };
  });
  await page.clock.runFor(5500);
  assert((await page.evaluate(() => audioEvents)).includes('switch'), 'Computer shutdown has a power click');
  const clear = () => page.evaluate(() => { audioEvents.length = 0; });
  const events = () => page.evaluate(() => [...audioEvents]);
  await clear();
  await page.clock.runFor(500);
  assert(!(await events()).includes('step'), 'Standing does not produce footsteps');
  await page.keyboard.down('d'); await page.clock.runFor(1600); await page.keyboard.up('d');
  const walking = (await events()).filter(name => name === 'step').length;
  assert(walking >= 2 && walking <= 4, 'Walking follows travelled distance');
  await clear();
  await page.keyboard.down('Shift'); await page.keyboard.down('a');
  await page.clock.runFor(1600); await page.keyboard.up('a'); await page.keyboard.up('Shift');
  assert((await events()).filter(name => name === 'step').length > walking, 'Running has a faster footstep cadence');
  await clear();
  await page.evaluate(() => {
    Body.setPosition(body, { x: 1000, y: floorY - 350 });
    Body.setVelocity(body, { x: 0, y: -3 }); grounded = false;
  });
  await page.keyboard.down('d'); await page.clock.runFor(150); await page.keyboard.up('d');
  assert(!(await events()).includes('step'), 'Airborne movement has no ground footsteps');
  await page.clock.runFor(1600);
  assert((await events()).includes('step'), 'Landing produces a single impact');
  await page.evaluate(() => {
    performFloorChange('f17');
    startBlackoutScene(currentDoors.find(door => door.type === 'elevator'));
    audioEvents.length = 0;
  });
  await page.clock.runFor(2800);
  assert.equal((await events()).filter(name => name === 'switch').length, 2, 'Both flickers have electrical clicks');
  assert(!(await events()).includes('blackout'), 'Outage impact waits for the final cut');
  await page.clock.runFor(2100);
  assert.equal((await events()).filter(name => name === 'blackout').length, 1, 'Final outage fires once');
  await clear();
  await page.evaluate(() => {
    triggerBuildingBlackout();
    phoneBattery = 30;
    chargePhone(currentDoors.find(door => door.phoneCharger));
  });
  assert(!(await events()).includes('blackout') && !(await events()).includes('charger'), 'Repeated outages and unpowered chargers stay silent');
  await page.evaluate(() => {
    solarEnabled = true; solarPoweredFloor = 17; updatePowerState();
    chargePhone(currentDoors.find(door => door.phoneCharger));
    chargePhone(currentDoors.find(door => door.phoneCharger));
    togglePhoneLight();
  });
  assert.deepEqual(await events(), ['charger', 'pickup', 'phone']);
  await clear();
  await page.evaluate(() => {
    performFloorChange('f1'); solarPoweredFloor = 1; updatePowerState();
    Object.assign(guardPatrol, { x: 3000, facing: 1, wait: 0, mode: 'patrol' });
    Body.setPosition(body, { x: 3200, y: floorY - 81 }); grounded = true;
    updateGuardPatrol(16);
    Body.setPosition(body, { x: guardPatrol.x + 75, y: floorY - 81 });
    updateGuardPatrol(16);
  });
  assert.deepEqual(await events(), ['robot-alert', 'robot-grab']);
  // 엘리베이터 쪽으로 놓친 뒤 걸어 돌아가는 동안은 모터 소리가 나고, 도착해서 둘러볼 때는 멈춘다.
  const servo = robot => page.evaluate(robot => {
    releaseGuardCapture(); Object.assign(guardPatrol, robot);
    Body.setPosition(body, { x: 2600, y: floorY - 81 }); audioEvents.length = 0;
    updateGameAudio(); return audioEvents.includes('robot-servo');
  }, robot);
  assert(await servo({ x: 3000, facing: 1, wait: 0, mode: 'return', chaseOriginX: 3400 }), 'A returning robot runs its motor');
  assert(!(await servo({ x: 3400, facing: 1, wait: 1400, mode: 'patrol' })), 'The arrival scan is quiet');
  await page.evaluate(() => {
    releaseGuardCapture();
    elevatorCars[0].floor = 1; showCabin(0);
    audioEvents.length = 0;
    setCabinDoor(false); setCabinDoor(false);
    Object.assign(elevatorCars[0], { floor: 1, destination: 2, travelling: true, elapsed: elevatorFloorTime - step });
    updateGameAudio(); updateElevators();
  });
  assert.deepEqual(await events(), ['elevator-door', 'elevator-arrive', 'elevator-door'], 'Door sounds fire on changes, and arrival has a chime');
  assert(await page.evaluate(() => gameAudioAmbience.has('motor')), 'Powered travel has a motor loop');
  await page.evaluate(() => { updateGameAudio(); solarEnabled = false; updatePowerState(); updateGameAudio(); });
  assert(await page.evaluate(() => !gameAudioAmbience.has('motor') && gameAudioAmbience.has('dark')), 'Arrival or loss of power removes motor ambience');
  await clear();
  await page.evaluate(() => {
    solarEnabled = true;
    Object.assign(elevatorCars[1], { floor: 2, destination: 1, travelling: true, rider: false, elapsed: elevatorFloorTime - step });
    updateElevators();
  });
  assert.deepEqual(await events(), [], 'Other cars arriving at the departed hall stay silent inside the cabin');
  await page.evaluate(() => {
    selectingFloor = false; cabinCarIndex = null; cabin.hidden = true; stage.inert = false;
    performFloorChange('f6-duty', null, 'exit'); audioEvents.length = 0;
  });
  await page.clock.runFor(4800);
  assert.equal((await events()).filter(name => name === 'call-ring').length, 2, 'The duty phone rings when the puzzle starts and repeats on the game clock');
  await page.evaluate(() => {
    Body.setPosition(body, { x: activeCall.x + activeCall.width / 2, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    interact();
  });
  assert(await page.evaluate(() => !activeCall && collectedItems.has('f6-oncall') && [...gameAudioEffects].filter(sound => sound.name === 'call-ring').every(sound => sound.stopping)), 'Answering stops the ring and grants the clue');
  await clear(); await page.clock.runFor(3000);
  assert(!(await events()).includes('call-ring'), 'Answered calls stay silent');
  assert.deepEqual(errors, []);
  console.log('PASS: walking/running/landing, shutdown/flicker/outage timing, charger guards, robot alert/grab and return motor, door transitions, elevator motor/arrival/isolation and repeating/answered duty calls.');
} finally { await browser.close(); }
