import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const musicFile = await readFile(new URL('../assets/audio/sanity-dread.wav', import.meta.url));
assert.equal(musicFile.toString('ascii', 0, 4), 'RIFF');
assert.equal(musicFile.toString('ascii', 8, 12), 'WAVE');
assert.equal(musicFile.readUInt16LE(22), 2, 'The new music is stereo');
assert.equal(musicFile.readUInt16LE(34), 16);
assert.equal(musicFile.readUInt32LE(40) / musicFile.readUInt32LE(28), 48, 'The composed loop lasts 48 seconds');
let musicPeak = 0, musicEnergy = 0;
for (let i = 44; i < musicFile.length; i += 2) {
  const sample = musicFile.readInt16LE(i) / 32768;
  musicPeak = Math.max(musicPeak, Math.abs(sample)); musicEnergy += sample * sample;
}
assert(musicPeak > .5 && musicPeak < .7, 'The rendered music has headroom');
assert(Math.sqrt(musicEnergy / ((musicFile.length - 44) / 2)) > .05, 'The new file contains audible music');
assert(Math.max(Math.abs(musicFile.readInt16LE(44) - musicFile.readInt16LE(musicFile.length - 4)),
  Math.abs(musicFile.readInt16LE(46) - musicFile.readInt16LE(musicFile.length - 2))) / 32768 < .005, 'The loop has no abrupt sample jump');

const browser = await chromium.launch();
const url = new URL('../index.html', import.meta.url).href;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const NativeContext = window.AudioContext || window.webkitAudioContext;
    window.audioContextCount = 0;
    if (NativeContext) window.AudioContext = class extends NativeContext {
      constructor(...args) { super(...args); window.audioContextCount++; }
      createGain() {
        const node = super.createGain();
        const setTarget = node.gain.setTargetAtTime.bind(node.gain);
        node.gain.setTargetAtTime = (value, ...args) => { node.gain.audioTestTarget = value; return setTarget(value, ...args); };
        return node;
      }
    };
  });
  await page.goto(url);
  assert.equal(await page.evaluate(() => gameAudioContext), null, 'Loading the menu does not start audio');
  await page.locator('#menu-settings-button').click();
  await page.waitForFunction(() => gameAudioContext?.state === 'running');
  assert.equal(await page.evaluate(() => window.audioContextCount), 1);
  const checkVolume = async expected => {
    assert.equal(await page.evaluate(() => gameAudioAppliedVolume), expected);
    assert.equal(await page.evaluate(() => gameAudioMaster.gain.audioTestTarget), expected, 'The shared native AudioParam receives the volume');
  };
  await page.locator('#menu-volume').focus();
  await page.keyboard.press('Home');
  await checkVolume(0);
  assert.equal(await page.evaluate(() => gameVolume), 0);
  await page.keyboard.press('End');
  await checkVolume(1);
  await page.keyboard.press('Escape');
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.waitForFunction(() => openingReady);
  await page.locator('#opening-skip').click();
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => window.audioContextCount), 1, 'Clicks and keys reuse the same context');
  await page.waitForFunction(() => sanityMusicElement.readyState >= 3 && !sanityMusicElement.paused);
  assert(await page.evaluate(() => sanityMusicElement.currentSrc.endsWith('/sanity-dread.wav') && sanityMusicElement.loop && sanityMusicElement.duration === 48 && !sanityMusicElement.error), 'The game plays the new local WAV through native audio');
  await page.evaluate(() => { sanity = 100; refreshSanity(); updateGameAudio(10000); });
  assert.equal(await page.evaluate(() => gameAudioAmbience.size), 1);
  const initialTime = await page.evaluate(() => gameAudioContext.currentTime);
  await page.waitForTimeout(150);
  const liveAudio = (await page.evaluate(() => gameAudioContext.currentTime)) - initialTime > .07;

  const buffers = await page.evaluate(() => {
    const names = ['step', 'door', 'elevator-door', 'elevator-arrive', 'elevator-alarm', 'blackout',
      'robot-servo', 'robot-alert', 'robot-grab', 'phone', 'charger', 'pickup', 'item-get', 'item-use', 'deny', 'shutter',
      'switch', 'ui', 'call-ring', 'cctv-beep', 'cctv-on', 'cctv-hit', 'cctv-static', 'heartbeat', 'cctv-rise',
      'office', 'dark', 'wind', 'motor', 'cctv-bgm', 'cctv-dread'];
    return names.map(name => {
      const buffer = gameAudioBuffer(name);
      const samples = buffer.getChannelData(0);
      let peak = 0, energy = 0, finite = true, crossings = 0;
      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        finite &&= Number.isFinite(sample); peak = Math.max(peak, Math.abs(sample)); energy += sample * sample;
        if (i && (samples[i - 1] < 0) !== (sample < 0)) crossings++;
      }
      const loop = ['office', 'dark', 'wind', 'motor', 'cctv-bgm', 'cctv-dread'].includes(name);
      return { name, finite, peak, rms: Math.sqrt(energy / samples.length), cached: buffer === gameAudioBuffer(name),
        duration: buffer.duration, crossRate: crossings / 2 / buffer.duration,
        seam: loop ? Math.abs(samples.at(-1) - samples[Math.round(buffer.sampleRate * .1)]) : null };
    });
  });
  for (const buffer of buffers) {
    assert(buffer.finite && buffer.cached, `${buffer.name}: finite samples and one cached buffer`);
    assert(buffer.peak > 0 && buffer.peak < .8 && buffer.rms > .003, `${buffer.name}: audible signal with headroom`);
    if (buffer.seam !== null) assert(buffer.seam < .03, `${buffer.name}: smooth repeat boundary`);
  }
  // Item sounds are distinct: a bright chime for bag items, a short clack-beep for using one, a low buzzer for refusals,
  // and a rolling shutter of about a second.
  const sound = name => buffers.find(buffer => buffer.name === name);
  assert(sound('item-get').crossRate > 3 * sound('deny').crossRate, 'The item chime is far brighter than the refusal buzzer');
  assert(sound('deny').crossRate < 400, 'The refusal buzzer stays low');
  assert(sound('item-use').duration < .4 && sound('item-get').duration < .6, 'Item get/use sounds stay short');
  assert(sound('shutter').duration >= .9 && sound('shutter').duration <= 1.5, 'The shutter rolls for about a second');
  assert.equal(await page.evaluate(() => gameAudioBuffer('unknown')), null);

  // Some headless Windows hosts have no output device and leave the live audio clock at zero.
  // OfflineAudioContext still renders real native buffers/gains without an audio device.
  const rendered = await page.evaluate(async () => {
    const render = async (volume, layered = false) => {
      const offline = new OfflineAudioContext(1, 24000, 24000);
      const master = offline.createGain(); master.gain.value = .7;
      master.gain.setTargetAtTime(volume, 0, .02); master.connect(offline.destination);
      for (const name of layered ? ['robot-grab', 'door', 'elevator-alarm', 'elevator-arrive', 'blackout', 'robot-servo'] : ['elevator-alarm']) {
        const source = offline.createBufferSource(); source.buffer = gameAudioBuffer(name);
        const gain = offline.createGain(); gain.gain.value = name === 'blackout' ? .7 : .6;
        source.connect(gain).connect(master); source.start(0);
      }
      const samples = (await offline.startRendering()).getChannelData(0);
      let energy = 0, peak = 0;
      for (let i = 0; i < samples.length; i++) {
        if (i >= 6000) energy += samples[i] * samples[i];
        peak = Math.max(peak, Math.abs(samples[i]));
      }
      return { rms: Math.sqrt(energy / (samples.length - 6000)), peak };
    };
    return { full: await render(1), half: await render(.5), muted: await render(0), layered: await render(1, true) };
  });
  assert(rendered.full.rms > .005, 'Native Web Audio renders the sound buffer');
  assert(Math.abs(rendered.half.rms / rendered.full.rms - .5) < .002, 'Half volume halves rendered output');
  assert(rendered.muted.rms < .00001, 'The native volume ramp silences output');
  assert(rendered.layered.peak < .95, 'Six concurrent effects retain output headroom');
  if (liveAudio) await page.evaluate(() => {
    window.audioProbe = gameAudioContext.createAnalyser();
    audioProbe.fftSize = 2048;
    const silentProbe = gameAudioContext.createGain();
    silentProbe.gain.value = 0;
    gameAudioMaster.connect(audioProbe); audioProbe.connect(silentProbe).connect(gameAudioContext.destination);
    gameVolume = 1; refreshGameAudioVolume(); playGameSound('elevator-alarm');
  });
  const signal = () => page.evaluate(() => {
    const samples = new Float32Array(audioProbe.fftSize);
    audioProbe.getFloatTimeDomainData(samples);
    let energy = 0, peak = 0;
    for (const value of samples) { energy += value * value; peak = Math.max(peak, Math.abs(value)); }
    return { rms: Math.sqrt(energy / samples.length), peak };
  });
  if (liveAudio) {
    await page.waitForTimeout(100);
    assert((await signal()).rms > .001, 'Real-time Web Audio output contains sound');
  }
  await page.evaluate(() => { gameVolume = 0; refreshGameAudioVolume(); });
  await checkVolume(0);
  if (liveAudio) { await page.waitForTimeout(220); assert((await signal()).rms < .00001, 'Muting silences the real-time shared output'); }
  const mutedSources = await page.evaluate(() => gameAudioEffects.size);
  await page.evaluate(() => { for (const name of ['blackout', 'item-get', 'item-use', 'deny', 'shutter']) playGameSound(name); });
  assert.equal(await page.evaluate(() => gameAudioEffects.size), mutedSources, 'Muted triggers do not queue sources');
  await page.evaluate(() => { gameVolume = .5; refreshGameAudioVolume(); });
  await checkVolume(.5);

  await page.waitForTimeout(1000);
  if (!liveAudio) await page.evaluate(() => {
    // Clean up already stopped test sources; a stalled output cannot dispatch native ended events.
    for (const sound of gameAudioEffects) { sound.source.stop(); sound.source.disconnect(); sound.gain.disconnect(); }
    gameAudioEffects.clear();
  });
  const warnings = await page.evaluate(() => {
    gameAudioLastPlayed.delete('robot-alert');
    playGameSound('robot-alert'); playGameSound('robot-alert'); playGameSound('robot-alert');
    return [...gameAudioEffects].filter(sound => sound.name === 'robot-alert').length;
  });
  assert.equal(warnings, 1, 'Repeated detection produces a single warning');
  await page.evaluate(() => {
    for (const name of ['door', 'elevator-door', 'elevator-arrive', 'blackout', 'robot-servo', 'robot-grab', 'phone', 'charger']) playGameSound(name);
  });
  assert((await page.evaluate(() => gameAudioEffects.size)) <= 6, 'Concurrent effects have a hard limit');
  if (liveAudio) { await page.waitForTimeout(60); assert((await signal()).peak < .95, 'Layered effects retain live output headroom'); }

  const sanityMusic = await page.evaluate(() => {
    const levels = [];
    sanityMusicElement.currentTime = 8;
    for (const percent of [50, 49, 40, 39, 30, 29, 20, 19, 10, 9, 0, 35, 49, 50]) {
      sanity = percent; updateGameAudio(10000);
      levels.push({ percent, gain: sanityMusicTarget, volume: sanityMusicElement.volume, master: gameVolume, preserved: sanityMusicElement.currentTime >= 8 });
    }
    sanity = 35; updateGameAudio(10000);
    gameVolume = 0; refreshGameAudioVolume();
    const muted = sanityMusicElement.volume === 0;
    gameVolume = .5; refreshGameAudioVolume();
    sanity = 50; updateGameAudio();
    const fading = sanityMusicGain > 0 && sanityMusicGain < .12 && !sanityMusicElement.paused;
    updateGameAudio(10000);
    const stopped = sanityMusicElement.paused && sanityMusicElement.volume === 0;
    sanity = 35;
    openingActive = true; updateGameAudio(10000);
    const cutsceneSilent = sanityMusicTarget === 0 && sanityMusicElement.paused;
    openingActive = false; refreshSanity(); updateGameAudio(10000);
    return { levels, muted, fading, stopped, cutsceneSilent };
  });
  const expectedGains = [0, .06, .06, .12, .12, .18, .18, .24, .24, .3, .3, .12, .06, 0];
  sanityMusic.levels.forEach((level, index) => {
    assert(Math.abs(level.gain - expectedGains[index]) < .00001, `${level.percent}% sanity updates the music intensity`);
    assert(Math.abs(level.volume - level.master * expectedGains[index]) < .00001, 'The native music follows the shared volume');
    assert(level.preserved, 'Changing sanity does not restart the song');
  });
  assert(sanityMusic.muted, 'The volume slider immediately mutes the new music');
  assert(sanityMusic.fading, 'Recovery starts a gradual volume decrease');
  assert(sanityMusic.stopped, 'Recovering to 50% fades the music out');
  assert(sanityMusic.cutsceneSilent, 'Cutscenes keep their own audio without overlapping sanity music');

  await page.keyboard.press('Escape');
  assert(await page.locator('#main-menu').isVisible());
  await page.waitForTimeout(140);
  assert.equal(await page.evaluate(() => gameAudioAmbience.size), 0, 'The menu stops game ambience');
  assert(await page.evaluate(() => sanityMusicElement.paused), 'The menu pauses the new song');
  assert(await page.evaluate(() => [...gameAudioEffects].every(sound => sound.name === 'ui' || sound.stopping)), 'The menu stops effects in progress');
  await page.locator('#menu-continue').click();
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => gameAudioAmbience.size), 1);
  assert(await page.evaluate(() => !sanityMusicElement.paused), 'Continuing resumes low-sanity music');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(140);
  assert.equal(await page.evaluate(() => gameAudioAmbience.size), 0, 'Hidden tabs stop looping sources');
  assert(await page.evaluate(() => sanityMusicElement.paused), 'Hidden tabs pause the new song');
  assert(await page.evaluate(() => [...gameAudioEffects].every(sound => sound.stopping)), 'Hidden tabs stop every effect');
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => gameAudioAmbience.size), 1);
  assert(await page.evaluate(() => !sanityMusicElement.paused), 'Returning resumes the new song');
  assert.equal(await page.evaluate(() => window.audioContextCount), 1);
  assert.deepEqual(errors, []);

  const unsupported = await browser.newPage();
  const unsupportedErrors = [];
  unsupported.on('pageerror', error => unsupportedErrors.push(error.message));
  await unsupported.addInitScript(() => { window.AudioContext = undefined; window.webkitAudioContext = undefined; });
  await unsupported.goto(url);
  await unsupported.locator('#menu-start').click();
  if (await unsupported.locator('#menu-new-confirm').isVisible()) await unsupported.locator('#menu-new-confirm').click();
  await unsupported.waitForFunction(() => openingReady);
  await unsupported.locator('#opening-skip').click();
  assert(await unsupported.evaluate(() => gameStarted && !mainMenuActive && !openingActive && gameAudioContext === null));
  assert.deepEqual(unsupportedErrors, [], 'Browsers without Web Audio can still play');
  console.log('Audio passed: real output, gesture unlock/reuse, volume/mute, finite buffers/loop seams, overlap limits, menu/hidden pause, unsupported browser');
  console.log(liveAudio ? 'Real-time shared output and offline rendering verified' : 'Live audio clock unavailable on this host; real output verified with native OfflineAudioContext rendering');
} finally {
  await browser.close();
}
