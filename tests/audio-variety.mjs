import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const cues = ['step-tile', 'step-carpet', 'step-metal', 'landing', 'door-metal', 'door-wood', 'door-glass',
  'door-slide', 'paper', 'bag-zip', 'drawer', 'lever', 'plug', 'card-scan', 'dial', 'keyboard', 'mouse-click',
  'power-relay', 'water-drop', 'pipe-tick', 'server-room', 'electrical-room', 'plumbing', 'hall-room'];
const loops = ['server-room', 'electrical-room', 'plumbing', 'hall-room'];
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.runFor(100);
  await page.evaluate(async () => {
    await unlockGameAudio(); setDebugSanity(100);
    if (blackoutSceneActive) finishBlackoutScene();
    setAllFloorsPower(true);
    for (const flag of ['story-blackout-seen', 'b1-cctv-live', 'b1-cctv-seen']) collectedItems.add(flag);
    window.clearSoundTest = () => {
      for (const effect of gameAudioEffects) {
        effect.source.stop(); effect.source.disconnect(); effect.gain.disconnect(); effect.pan?.disconnect();
      }
      gameAudioEffects.clear(); gameAudioLastPlayed.clear();
    };
  });
  const buffers = await page.evaluate(({ cues, loops }) => cues.map(cue => {
    const buffer = gameAudioBuffer(cue), data = buffer.getChannelData(0);
    let peak = 0, energy = 0;
    for (const v of data) { if (!Number.isFinite(v)) throw Error(cue); peak = Math.max(peak, Math.abs(v)); energy += v * v; }
    const fingerprint = b => {
      let h = 0; const samples = b.getChannelData(0);
      for (let i = 0; i < samples.length; i += 37) h = Math.imul(h ^ Math.round(samples[i] * 1e6), 16777619);
      return h;
    };
    return { cue, peak, rms: Math.sqrt(energy / data.length), cached: buffer === gameAudioBuffer(cue),
      variants: [1, 2, 3].map(v => fingerprint(gameAudioBuffer(cue, v))),
      seam: loops.includes(cue) ? Math.abs(data.at(-1) - data[Math.round(buffer.sampleRate * .1)]) : 0 };
  }), { cues, loops });
  for (const buffer of buffers) {
    assert(buffer.cached && buffer.peak > 0 && buffer.peak < .8 && buffer.rms > .003, `${buffer.cue}: audible finite buffer with headroom`);
    assert.equal(new Set(buffer.variants).size, 3, `${buffer.cue}: distinct deterministic variations`);
    assert(buffer.seam < .03, `${buffer.cue}: no jump at the loop boundary`);
  }
  for (const [id, profile, stepCue, ambience] of [
    ['f17-office', 'office', 'step-carpet', 'office'], ['f12', 'hallway', 'step-tile', 'office'],
    ['f1-restroom', 'restroom', 'step-tile', 'plumbing'], ['f7-vip', 'hall', 'step-carpet', 'hall-room'],
    ['b2-main', 'server', 'step-metal', 'server-room'], ['b1-power', 'service', 'step-metal', 'electrical-room'],
    ['rooftop', 'roof', 'step-metal', 'wind'], ['f16-kitchen', 'tile', 'step-tile', 'office'],
  ]) {
    const actual = await page.evaluate(id => {
      clearSoundTest();
      if (id === 'f17-office') { performFloorChange('f17'); if (room !== 'office') performRoomChange(); }
      else performFloorChange(id, id === 'rooftop' ? null : 0, floorById.get(id).interior ? 'exit' : null);
      updateGameAudio();
      return { profile: gameAudioRoomProfile(), cue: gameAudioCue('step', {}), ambience: [...gameAudioAmbience.keys()] };
    }, id);
    assert.equal(actual.profile, profile, `${id}: room profile`);
    assert.equal(actual.cue, stepCue, `${id}: floor material`);
    assert(actual.ambience.includes(ambience), `${id}: appropriate ambience ${JSON.stringify(actual)}`);
  }
  const routing = await page.evaluate(() => {
    const doors = ['metal', 'blinds', 'pivot-glass', 'slide'].map(style => gameAudioCue('door', { door: { style } }));
    const variations = [];
    for (let i = 0; i < 12; i++) {
      clearSoundTest(); playGameSound('step', { x: body.position.x });
      variations.push([...gameAudioEffects][0].variant);
    }
    clearSoundTest(); playGameSound('pipe-tick', { x: body.position.x - 300 });
    const left = [...gameAudioEffects][0].pan.pan.value;
    clearSoundTest(); playGameSound('pipe-tick', { x: body.position.x + 300 });
    const right = [...gameAudioEffects][0].pan.pan.value;
    clearSoundTest(); playGameSound('pipe-tick', { x: body.position.x + 900 });
    const far = gameAudioEffects.size;
    return { doors, variations, left, right, far, relay: gameAudioCue('switch', { cue: 'power-relay' }), landing: gameAudioCue('step', { landing: true }) };
  });
  assert.deepEqual(routing.doors, ['door-metal', 'door-wood', 'door-glass', 'door-slide']);
  assert(routing.variations.every((v, i, a) => i === 0 || v !== a[i - 1]), 'Footstep variants never repeat consecutively');
  assert(routing.left < 0 && routing.right > 0 && routing.far === 0, 'Nearby world sounds pan left/right, distant sounds are culled');
  assert.equal(routing.relay, 'power-relay'); assert.equal(routing.landing, 'landing');
  const interactions = await page.evaluate(() => {
    clearSoundTest();
    openInspection('메모', '읽을 종이', { surface: 'memo', writing: ['메모'] });
    const paper = [...gameAudioEffects].some(s => s.cue === 'paper'); closeInspection();
    clearSoundTest(); showInventoryList();
    const bag = [...gameAudioEffects].some(s => s.cue === 'bag-zip'); closeInspection();
    clearSoundTest(); openDrawerPuzzle();
    const drawer = [...gameAudioEffects].some(s => s.cue === 'drawer'); closeInspection();
    clearSoundTest();
    gameAudioRoomKey = ''; performFloorChange('f1-restroom', null, 'exit'); updateGameAudio();
    gameAudioRoomElapsed = gameAudioRoomNext; updateGameAudio();
    const drip = [...gameAudioEffects].some(s => s.cue === 'water-drop');
    const reset = gameAudioRoomElapsed === 0 && gameAudioRoomNext >= 11000;
    clearSoundTest(); b2CaptureActive = true; gameAudioRoomElapsed = gameAudioRoomNext; updateGameAudio();
    const cutsceneQuiet = gameAudioEffects.size === 0; b2CaptureActive = false;
    solarRestoreActive = true; gameAudioRoomElapsed = gameAudioRoomNext; updateGameAudio();
    const solarQuiet = gameAudioEffects.size === 0 && gameAudioRoomElapsed === 0; solarRestoreActive = false;
    clearSoundTest(); gameVolume = 0; playGameSound('paper');
    const muted = gameAudioEffects.size === 0; gameVolume = .7;
    pauseGameAudio();
    return { paper, bag, drawer, drip, reset, cutsceneQuiet, solarQuiet, muted, stopped: gameAudioAmbience.size === 0 && gameAudioRoomElapsed === 0 };
  });
  for (const [name, passed] of Object.entries(interactions)) assert(passed, `${name}: interaction/lifecycle`);
  // Native offline output is also the preview: it works without a physical sound device.
  const preview = await page.evaluate(async cues => {
    const rate = 24000, duration = cues.length * 1.5;
    const context = new OfflineAudioContext(2, rate * duration, rate);
    for (let i = 0; i < cues.length; i++) {
      const source = context.createBufferSource(); source.buffer = gameAudioBuffer(cues[i]);
      const gain = context.createGain(); gain.gain.setValueAtTime(.6, i * 1.5);
      gain.gain.setTargetAtTime(0, i * 1.5 + 1.1, .05);
      source.connect(gain).connect(context.destination); source.start(i * 1.5); source.stop((i + 1) * 1.5);
    }
    const result = await context.startRendering();
    return { rate, samples: Array.from(result.getChannelData(0)) };
  }, cues);
  assert(preview.samples.every(Number.isFinite));
  for (let i = 0; i < cues.length; i++) {
    const segment = preview.samples.slice(i * preview.rate * 1.5, (i + 1) * preview.rate * 1.5);
    const energy = segment.reduce((sum, v) => sum + v * v, 0);
    assert(Math.sqrt(energy / segment.length) > .001, `${cues[i]}: native offline output is audible`);
    assert(segment.every(v => Math.abs(v) < .8), `${cues[i]}: preview retains headroom`);
  }
  const wav = Buffer.alloc(44 + preview.samples.length * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(preview.rate, 24);
  wav.writeUInt32LE(preview.rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
  preview.samples.forEach((v, i) => wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  await mkdir('docs/previews', { recursive: true });
  await writeFile('docs/previews/audio-variety.wav', wav);
  const previewDuration = await page.evaluate(url => new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => resolve(audio.duration);
    audio.onerror = () => reject(new Error('Preview WAV cannot be decoded'));
    audio.src = url;
  }), new URL('../docs/previews/audio-variety.wav', import.meta.url).href);
  assert.equal(previewDuration, 36, 'The browser decodes the complete preview WAV');
  assert.deepEqual(errors, []);
  console.log('PASS: 24 new sound types, native buffers/variations/loop seams, eight room profiles, material routing, panning, real interactions, sparse ambience, cutscene/mute/pause cleanup; preview WAV rendered');
} finally {
  await browser.close();
}
