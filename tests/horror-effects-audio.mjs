import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local/horror-effects', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(10000);
  await page.clock.install({ time: new Date('2026-10-18T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-18T00:01:00Z'));
  await page.evaluate(() => unlockGameAudio());
  const visuals = await page.evaluate(() => {
    performFloorChange('b1'); buildingBlackout = true; collectedItems.add('b1-lights-out'); updatePowerState();
    sanity = 5; updateSanity(0); startAmbientSighting(); hallucinationLife = 1000; render();
    spawnRedEyes();
    const out = {
      mode: hallucinationMode, width: hallucinationShadow.offsetWidth,
      overlay: !hallucinationEffects.hidden,
      glitch: getComputedStyle(hallucinationEffects).animationName,
      scanlines: getComputedStyle(hallucinationEffects, '::after').animationName,
      tremor: getComputedStyle(stage).animationName,
      red: fearOverlayRed.style.opacity,
      eyes: redEyes.childElementCount,
    };
    clearHallucinationEvents(); updateBlink(20000, false);
    out.blink = blinkFlash.dataset.active === 'true';
    clearHallucinationEvents(); out.face = debugTriggerJumpscare() && !darkFace.hidden;
    clearHallucinationEvents();
    out.cleared = hallucinationEffects.hidden && darkFace.hidden && flashPrompt.hidden && !document.body.dataset.hallucinating;
    sanity = 35; updateSanity(0); render();
    return out;
  });
  assert.equal(visuals.width, 192, 'Effects restoration retains the grounded actor');
  assert(visuals.overlay && visuals.eyes > 0 && visuals.blink && visuals.face && visuals.cleared);
  assert.equal(visuals.glitch, 'fear-glitch'); assert.equal(visuals.scanlines, 'static-flicker');
  assert.equal(visuals.tremor, 'screen-tremor'); assert.equal(Number(visuals.red), .7);

  const waveforms = await page.evaluate(() => auditoryHallucinationSounds.map(name => {
    const buffer = gameAudioBuffer(name), samples = buffer.getChannelData(0);
    let peak = 0, energy = 0;
    for (const sample of samples) { if (!Number.isFinite(sample)) throw new Error('Non-finite audio'); peak = Math.max(peak, Math.abs(sample)); energy += sample * sample; }
    return { name, duration: buffer.duration, peak, rms: Math.sqrt(energy / samples.length), cached: gameAudioBuffer(name) === buffer };
  }));
  assert.equal(waveforms.length, 3);
  for (const sound of waveforms) {
    assert(sound.cached && sound.duration >= 1.5);
    assert(sound.peak > .08 && sound.peak < .8, `${sound.name} has audible peaks with headroom`);
    assert(sound.rms > .005 && sound.rms < .2, `${sound.name} has an audible, restrained level`);
  }

  // 헤드리스 오디오 시계는 늦게 출발한다. 0에 머문 채로 재생하면 같은 소리 0.08초 반복 금지에 막힌다.
  await page.waitForFunction(() => gameAudioContext.currentTime > 0);
  const heard = [];
  for (let i = 0; i < 6; i++) {
    const cue = await page.evaluate(() => {
      if (!debugTriggerAuditoryHallucination()) throw new Error('Debug cue did not play');
      const sound = [...gameAudioEffects].find(effect => auditoryHallucinationSounds.includes(effect.name) && !effect.stopping);
      const out = { name: sound.name, pan: sound.pan.pan.value, gain: sound.gain.gain.value };
      stopGameSound(sound.name);
      return out;
    });
    assert(Math.abs(cue.pan) >= .29 && Math.abs(cue.pan) <= .67, 'Hallucination is placed to the left or right');
    assert(cue.gain > 0 && cue.gain < .6);
    if (heard.length) assert.notEqual(cue.name, heard.at(-1), 'Consecutive hallucinations differ');
    heard.push(cue.name);
    await new Promise(resolve => setTimeout(resolve, 120));
  }

  const scheduled = await page.evaluate(() => {
    auditoryHallucinationRoom = ''; updateGameAudio(0);
    auditoryHallucinationElapsed = 0; auditoryHallucinationNext = 1000;
    for (let i = 0; i < 9; i++) updateGameAudio(100);
    const early = [...gameAudioEffects].some(sound => auditoryHallucinationSounds.includes(sound.name) && !sound.stopping);
    updateGameAudio(100);
    const played = [...gameAudioEffects].some(sound => auditoryHallucinationSounds.includes(sound.name) && !sound.stopping);
    const next = auditoryHallucinationNext;
    sanity = 85; updateGameAudio(0);
    const stoppedOnRecovery = [...gameAudioEffects].filter(sound => auditoryHallucinationSounds.includes(sound.name)).every(sound => sound.stopping);
    return { early, played, next, stoppedOnRecovery };
  });
  assert(!scheduled.early && scheduled.played && scheduled.stoppedOnRecovery);
  assert(scheduled.next >= 22000 && scheduled.next <= 42000);
  await new Promise(resolve => setTimeout(resolve, 150));

  for (const reason of ['inspection', 'phone', 'story', 'chase', 'wire', 'elevator', 'transition', 'muted', 'menu']) {
    const stopped = await page.evaluate(reason => {
      sanity = 35; updateSanity(0); clearHallucinationEvents();
      if (!debugTriggerAuditoryHallucination()) throw new Error('No cue before ' + reason);
      const previousVolume = gameVolume;
      if (reason === 'inspection') usingInspection = true;
      if (reason === 'phone') usingPhone = true;
      if (reason === 'story') storySceneActive = true;
      if (reason === 'chase') guardPatrol.mode = 'chase';
      if (reason === 'wire') wirePanel.hidden = false;
      if (reason === 'elevator') selectingFloor = true;
      if (reason === 'transition') transitioning = true;
      if (reason === 'muted') gameVolume = 0;
      if (reason === 'menu') mainMenuActive = true;
      updateGameAudio(100);
      const stopped = [...gameAudioEffects].filter(sound => auditoryHallucinationSounds.includes(sound.name)).every(sound => sound.stopping);
      usingInspection = usingPhone = storySceneActive = selectingFloor = transitioning = mainMenuActive = false;
      guardPatrol.mode = 'patrol'; wirePanel.hidden = true; gameVolume = previousVolume;
      return stopped && auditoryHallucinationElapsed === 0;
    }, reason);
    assert(stopped, `${reason} stops phantom audio and resets its timer`);
    await new Promise(resolve => setTimeout(resolve, 120));
  }

  await page.evaluate(() => {
    sanity = 35; clearHallucinationEvents();
    debugTriggerAuditoryHallucination();
    document.__audioHidden = Object.getOwnPropertyDescriptor(document, 'hidden');
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  assert(await page.evaluate(() => [...gameAudioEffects].filter(sound => auditoryHallucinationSounds.includes(sound.name)).every(sound => sound.stopping)));
  await page.evaluate(() => {
    if (document.__audioHidden) Object.defineProperty(document, 'hidden', document.__audioHidden);
    else delete document.hidden;
    delete document.__audioHidden;
    clearHallucinationEvents(); sanity = 35;
  });

  const preview = await page.evaluate(async () => {
    const rate = 24000, context = new OfflineAudioContext(2, rate * 8, rate);
    let at = .25;
    for (const [index, name] of auditoryHallucinationSounds.entries()) {
      const source = context.createBufferSource(), gain = context.createGain(), pan = context.createStereoPanner();
      source.buffer = gameAudioBuffer(name); gain.gain.value = .4; pan.pan.value = index % 2 ? .55 : -.55;
      source.connect(gain).connect(pan).connect(context.destination); source.start(at);
      at += source.buffer.duration + .45;
    }
    const result = await context.startRendering();
    return [Array.from(result.getChannelData(0)), Array.from(result.getChannelData(1))];
  });
  const pcm = Buffer.alloc(44 + preview[0].length * 4);
  pcm.write('RIFF'); pcm.writeUInt32LE(pcm.length - 8, 4); pcm.write('WAVEfmt ', 8);
  pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22);
  pcm.writeUInt32LE(24000, 24); pcm.writeUInt32LE(96000, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34);
  pcm.write('data', 36); pcm.writeUInt32LE(pcm.length - 44, 40);
  for (let i = 0; i < preview[0].length; i++) for (let channel = 0; channel < 2; channel++)
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, preview[channel][i])) * 32767), 44 + i * 4 + channel * 2);
  assert(preview.some(samples => samples.some(sample => Math.abs(sample) > .01)), 'Offline stereo rendering is audible');
  await writeFile('.local/horror-effects/auditory-preview.wav', pcm);
  assert.deepEqual(errors, []);
  console.log('PASS: restored effects, audible stereo footsteps/knocks/whispers, no consecutive repeats, scheduling/recovery, menu/UI/chase/mute/hidden interruption; preview rendered');
} finally { await browser.close(); }
