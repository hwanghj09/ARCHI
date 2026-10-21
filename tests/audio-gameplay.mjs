import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { autoControl } from './auto-control.mjs';

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await autoControl(page);
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
  // 오프닝은 대사마다 클릭을 기다린다(scene-gate.js).
  for (let i = 0; i < 6 && await page.evaluate(() => openingActive); i++) { await page.clock.runFor(2000); await page.evaluate(() => opening.click()); }
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
    collectedItems.add('story-blackout-seen'); // 정전 컷씬 뒤 혼잣말(story-scene.js)은 이 소리 검사와 무관하니 건너뛴다
    startBlackoutScene(currentDoors.find(door => door.type === 'elevator'));
    audioEvents.length = 0;
  });
  // 정전 컷씬은 대사마다(1000·2900ms) 멈추고 클릭을 기다린다(scene-gate.js).
  const nextLine = async () => { assert(await page.evaluate(() => blackoutGate.waiting)); await page.evaluate(() => blackoutScene.click()); };
  await page.clock.runFor(1100); await nextLine();
  await page.clock.runFor(1800);
  assert.equal((await events()).filter(name => name === 'switch').length, 8, 'Each brief flicker has an electrical click');
  assert(!(await events()).includes('blackout'), 'Outage impact waits for the final cut');
  await page.clock.runFor(200); await nextLine();
  await page.clock.runFor(2100);
  assert.equal((await events()).filter(name => name === 'blackout').length, 1, 'Final outage fires once');
  await clear();
  await page.evaluate(() => {
    triggerBuildingBlackout();
    performFloorChange('f17'); performRoomChange();
    phoneBattery = 30;
    chargePhone(officeCharger);
  });
  assert(!(await events()).includes('blackout') && !(await events()).includes('charger'), 'Repeated outages and unpowered chargers stay silent');
  await page.evaluate(() => {
    collectedItems.add("f17-emergency-linked"); solarEnabled = true; solarPoweredFloors = [17]; updatePowerState();
    chargePhone(officeCharger);
    chargePhone(officeCharger);
    togglePhoneLight();
  });
  assert.deepEqual(await events(), ['charger', 'pickup', 'phone']);
  await clear();
  await page.evaluate(() => {
    performFloorChange('f1'); solarPoweredFloors = [1]; updatePowerState();
    Object.assign(guardPatrol, { x: 3000, facing: 1, wait: 0, mode: 'patrol' });
    Body.setPosition(body, { x: 3200, y: floorY - 81 }); grounded = true;
    updateGuardPatrol(16);
    Body.setPosition(body, { x: guardPatrol.x + 75, y: floorY - 81 });
    updateGuardPatrol(16);
  });
  assert.deepEqual(await events(), ['robot-alert', 'robot-grab']);
  // 엘리베이터 쪽으로 놓친 뒤 걸어 돌아가는 동안은 모터 소리가 나고, 도착해서 둘러볼 때는 멈춘다.
  const servo = robot => page.evaluate(robot => {
    releaseGuardCapture(); Object.assign(guardPatrol, robot, { soundDistance: 0 });
    Body.setPosition(body, { x: 2600, y: floorY - 81 }); audioEvents.length = 0;
    for (let i = 0; i < 30; i++) updateGuardPatrol(1000 / 60);
    return audioEvents.includes('robot-servo') && audioEvents.includes('robot-step');
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
    collectedItems.add("f17-emergency-linked"); solarEnabled = true;
    Object.assign(elevatorCars[1], { floor: 2, destination: 1, travelling: true, rider: false, elapsed: elevatorFloorTime - step });
    updateElevators();
  });
  assert.deepEqual(await events(), [], 'Other cars arriving at the departed hall stay silent inside the cabin');
  await page.evaluate(() => {
    selectingFloor = false; cabinCarIndex = null; cabin.hidden = true; stage.inert = false;
    performFloorChange('f6-engineering', null, 'exit'); audioEvents.length = 0;
  });
  await page.clock.runFor(4800);
  assert(!(await events()).includes('call-ring'), 'Exploring 6F does not start an unapproved phone subplot');
  assert(await page.evaluate(() => !activeCall && !collectedItems.has('f6-oncall')));
  await clear(); await page.clock.runFor(3000);
  assert(!(await events()).includes('call-ring'), '6F remains silent after the old call deadline');
  // Item sounds: a wrong code buzzes and the right one clacks the lock open; a puzzle flag keeps the pickup thud; a device
  // run on a required item clacks once; the fire shutter rattles instead.
  await page.evaluate(() => {
    performFloorChange('f1'); audioEvents.length = 0;
    const panel = currentDoors.find(door => door.code);
    openKeypad(panel);
    keypadInput.value = '0000'; submitKeypad();
    keypadInput.value = panel.code; submitKeypad();
    closeInspection();
  });
  assert.deepEqual(await events(), ['deny', 'item-use'], 'Keypad refusal and opening');
  const inspect = (id, name) => page.evaluate(({ id, name }) => {
    closeInspection();
    if (dynamicFloorId !== id) performFloorChange(id, null, floorById.get(id).interior ? 'exit' : null);
    const door = currentDoors.find(entry => entry.name === name);
    Body.setPosition(body, { x: door.x + door.width / 2, y: (door.standY ?? floorY) - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    audioEvents.length = 0;
    interact();
    if (nearbyDoor !== door) throw new Error(`Wrong interaction target: ${name}`);
    return [...audioEvents];
  }, { id, name });
  assert.deepEqual(await inspect('f11-sales', '층 비상 대응함'), ['pickup'], 'A puzzle flag keeps the pickup sound');
  assert.deepEqual(await inspect('f11', '방화셔터'), ['shutter'], 'The fire shutter rattles as it rolls up');
  assert.deepEqual(await inspect('f11', '방화셔터'), [], 'An open shutter stays silent');
  assert.deepEqual(await inspect('f2-harmony', '배터리 영사기'), [], 'A device missing its items stays silent');
  await page.evaluate(() => { collectedItems.add('f2-reel'); collectedItems.add('f2-remote'); });
  assert.deepEqual(await inspect('f2-harmony', '배터리 영사기'), ['item-use'], 'Running a device on required items is a use, not a pickup');
  assert.deepEqual(await inspect('f2-harmony', '배터리 영사기'), [], 'A running device stays silent');
  assert.deepEqual(errors, []);
  console.log('PASS: walking/running/landing, shutdown/flicker/outage timing, charger guards, robot alert/grab and return motor, item/keypad/shutter sounds, door transitions, elevator motor/arrival/isolation and silent 6F exploration.');
} finally { await browser.close(); }
