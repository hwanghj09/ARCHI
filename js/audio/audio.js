// 직접 합성한 짧은 효과음과 환경음. 외부 파일을 읽지 않아 file://에서도 동작한다.
let gameAudioContext = null;
let gameAudioMaster = null;
let gameAudioAppliedVolume = null;
const gameAudioBuffers = new Map();
const gameAudioEffects = new Set();
const gameAudioAmbience = new Map();
const gameAudioLastPlayed = new Map();

function unlockGameAudio() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return Promise.resolve(false);
  if (!gameAudioContext) {
    try {
      gameAudioContext = new Context();
      gameAudioMaster = gameAudioContext.createGain();
      gameAudioMaster.gain.value = Math.max(0, Math.min(1, gameVolume));
      gameAudioAppliedVolume = gameAudioMaster.gain.value;
      gameAudioMaster.connect(gameAudioContext.destination);
    } catch { return Promise.resolve(false); }
  }
  refreshGameAudioVolume();
  if (gameAudioContext.state === 'running') return Promise.resolve(true);
  return gameAudioContext.resume().then(() => true, () => false);
}

function refreshGameAudioVolume() {
  if (!gameAudioMaster) return;
  const volume = Math.max(0, Math.min(1, gameVolume));
  if (gameAudioAppliedVolume === volume) return;
  gameAudioAppliedVolume = volume;
  gameAudioMaster.gain.setTargetAtTime(volume, gameAudioContext.currentTime, .02);
}

// 소음과 감쇠하는 저음을 섞어 충격·마찰음을 만든다. 반복음도 시작/끝의 파형을 맞춘다.
function gameAudioBuffer(name) {
  if (gameAudioBuffers.has(name)) return gameAudioBuffers.get(name);
  const durations = { step: .2, door: .65, 'elevator-door': 1.05, 'elevator-arrive': 1.05,
    'elevator-alarm': .95, blackout: 1.5, 'robot-servo': .48, 'robot-alert': .6,
    'robot-grab': .65, 'call-ring': .85, phone: .14, charger: .24, pickup: .22, switch: .12, ui: .09 };
  const loop = ['office', 'dark', 'wind', 'motor'].includes(name);
  const duration = loop ? 8 : durations[name];
  if (!duration) return null;
  const rate = 24000;
  const buffer = gameAudioContext.createBuffer(1, Math.ceil(duration * rate), rate);
  const samples = buffer.getChannelData(0);
  let seed = 12345, low = 0, soft = 0;
  const sin = (frequency, t) => Math.sin(2 * Math.PI * frequency * t);
  const hit = (t, at, decay) => t >= at ? Math.exp(-(t - at) * decay) : 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    low += .028 * (noise - low);
    soft += .15 * (noise - soft);
    let sample = 0;
    switch (name) {
      case 'step': sample = .42 * low * hit(t, 0, 25) + .18 * sin(92, t) * hit(t, 0, 34) + .22 * soft * hit(t, .045, 38); break;
      case 'door': sample = .18 * low * Math.sin(Math.PI * t / duration) + (.22 * sin(74, t) + .2 * soft) * hit(t, .47, 28); break;
      case 'elevator-door': sample = (.1 * sin(138, t) + .3 * low) * Math.sin(Math.PI * t / duration) + .2 * soft * hit(t, .88, 36); break;
      case 'elevator-arrive': sample = (.2 * sin(660, t) + .065 * sin(1320, t)) * hit(t, .015, 4.8) + .1 * sin(880, t) * hit(t, .12, 5.2); break;
      case 'elevator-alarm': sample = .17 * sin(t < .36 ? 540 : 680, t) * (t % .32 < .22 ? 1 : 0) * Math.sin(Math.PI * t / duration); break;
      case 'blackout': sample = .32 * soft * hit(t, .012, 13) + .12 * sin(112 - 35 * t, t) * hit(t, 0, 3.7) + .15 * noise * hit(t, .19, 32); break;
      case 'robot-servo': sample = (.16 * sin(125 + 12 * t, t) + .045 * sin(420, t) + .22 * low) * Math.sin(Math.PI * t / duration); break;
      case 'robot-alert': sample = .13 * sin(t < .24 ? 330 : 390, t) * (hit(t, .015, 14) + hit(t, .3, 14)); break;
      case 'robot-grab': sample = (.14 * sin(118, t) + .26 * low) * Math.sin(Math.PI * t / duration) + (.18 * sin(68, t) + .18 * soft) * hit(t, .48, 32); break;
      case 'call-ring': sample = (.11 * sin(440, t) + .08 * sin(480, t)) * (hit(t, .02, 9) + hit(t, .4, 9)); break;
      case 'phone': sample = .12 * sin(680 - 850 * t, t) * Math.sin(Math.PI * t / duration) * Math.exp(-18 * t); break;
      case 'charger': sample = .11 * sin(470, t) * hit(t, .01, 35) + .1 * sin(620, t) * hit(t, .105, 30); break;
      case 'pickup': sample = .3 * low * Math.sin(Math.PI * t / duration) + .07 * sin(310, t) * hit(t, .07, 30); break;
      case 'switch': sample = (.28 * soft + .1 * sin(210, t)) * hit(t, .008, 48); break;
      case 'ui': sample = .09 * sin(720 - 900 * t, t) * Math.sin(Math.PI * t / duration) * Math.exp(-25 * t); break;
      case 'office': sample = .6 * low + .09 * sin(62.5, t) + .025 * sin(125, t); break;
      case 'dark': sample = .46 * low + .065 * sin(37.5, t) * (1 + .18 * sin(.125, t)); break;
      case 'wind': sample = .95 * low * (.65 + .2 * sin(.25, t) + .12 * sin(.625, t)); break;
      case 'motor': sample = .14 * sin(87.5, t) + .045 * sin(175, t) + .3 * low; break;
    }
    const edge = loop ? 1 : Math.min(1, t / .008, (duration - t) / .025);
    samples[i] = Math.max(-1, Math.min(1, sample)) * edge;
  }
  if (loop) {
    // 마지막 0.1초를 첫 파형으로 이어 붙이고, 반복은 그다음 샘플에서 시작한다.
    const fade = Math.round(rate * .1);
    for (let i = 0; i < fade; i++) {
      const blend = i / (fade - 1);
      const end = samples.length - fade + i;
      samples[end] = samples[end] * (1 - blend) + samples[i] * blend;
    }
  }
  gameAudioBuffers.set(name, buffer);
  return buffer;
}

function playGameSound(name, options = {}) {
  if (!gameAudioContext || gameAudioContext.state !== 'running' || document.hidden || gameVolume <= 0) return;
  if (typeof restoringProgress !== 'undefined' && restoringProgress) return;
  if (name !== 'ui' && (mainMenuActive || !gameStarted)) return;
  const now = gameAudioContext.currentTime;
  const distance = Number.isFinite(options.x) && !selectingFloor ? Math.abs(options.x - body.position.x) : 0;
  if (distance >= 800) return;
  const interval = name === 'step' ? (options.running ? .21 : .29) : name === 'robot-alert' ? 1.2 : name === 'robot-servo' ? 1.1 : .08;
  if (now - (gameAudioLastPlayed.get(name) ?? -Infinity) < interval || gameAudioEffects.size >= 6) return;
  const buffer = gameAudioBuffer(name);
  if (!buffer) return;
  gameAudioLastPlayed.set(name, now);
  const source = gameAudioContext.createBufferSource();
  const gain = gameAudioContext.createGain();
  source.buffer = buffer;
  source.playbackRate.value = name === 'step' ? .94 + Math.random() * .12 : 1;
  gain.gain.value = (name === 'step' ? (options.landing ? .65 : options.running ? .6 : .42) : name === 'blackout' ? .7 : name === 'robot-servo' ? .35 : .6) * (1 - distance / 800);
  source.connect(gain).connect(gameAudioMaster);
  const effect = { source, gain, name, stopping: false };
  gameAudioEffects.add(effect);
  source.onended = () => { gameAudioEffects.delete(effect); source.disconnect(); gain.disconnect(); };
  source.start();
}

function stopGameAudioSource(sound) {
  if (sound.stopping) return;
  sound.stopping = true;
  const now = gameAudioContext.currentTime;
  sound.gain.gain.cancelScheduledValues(now);
  sound.gain.gain.setTargetAtTime(0, now, .015);
  sound.source.stop(now + .08);
}

function pauseGameAudio() {
  if (!gameAudioContext) return;
  for (const sound of gameAudioAmbience.values()) stopGameAudioSource(sound);
  gameAudioAmbience.clear();
  for (const sound of gameAudioEffects) if (sound.name !== 'ui' || document.hidden) stopGameAudioSource(sound);
}

function stopGameSound(name) {
  for (const sound of gameAudioEffects) if (sound.name === name) stopGameAudioSource(sound);
}

function updateGameAudio() {
  if (!gameAudioContext || gameAudioContext.state !== 'running') return;
  refreshGameAudioVolume();
  if (document.hidden || mainMenuActive || !gameStarted) return pauseGameAudio();
  const roof = !selectingFloor && currentSceneFloor === 18;
  const lit = selectingFloor ? !buildingBlackout : floorHasPower(currentSceneFloor) && world.dataset.dark !== 'true';
  const background = roof ? 'wind' : lit ? 'office' : 'dark';
  const moving = selectingFloor && cabinCarIndex !== null && elevatorCars[cabinCarIndex].travelling && elevatorHasPower();
  const wanted = new Map([[background, roof ? .23 : lit ? .18 : .14]]);
  if (moving) wanted.set('motor', .25);
  if (!selectingFloor && !openingActive && !blackoutSceneActive && !usingComputer && !usingKeypad && !usingPhone && !usingPowerPanel && !usingInspection && !transitioning && !playerCaught && guardPatrol.door && lit && (guardPatrol.mode === 'chase' || !guardPatrol.wait)) {
    playGameSound('robot-servo', { x: guardPatrol.x });
  }
  for (const [name, sound] of gameAudioAmbience) {
    if (wanted.has(name)) continue;
    stopGameAudioSource(sound);
    gameAudioAmbience.delete(name);
  }
  for (const [name, volume] of wanted) {
    if (gameAudioAmbience.has(name)) continue;
    const source = gameAudioContext.createBufferSource();
    const gain = gameAudioContext.createGain();
    source.buffer = gameAudioBuffer(name);
    source.loop = true;
    source.loopStart = .1;
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(volume, gameAudioContext.currentTime, .3);
    source.connect(gain).connect(gameAudioMaster);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    gameAudioAmbience.set(name, { source, gain, stopping: false });
    source.start();
  }
}

document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGameAudio(); });
window.addEventListener('pagehide', pauseGameAudio);
// 브라우저 자동 재생 제한은 실제 클릭·키 입력에서 한 번 해제한다.
document.addEventListener('pointerdown', unlockGameAudio, true);
document.addEventListener('keydown', unlockGameAudio, true);
document.addEventListener('click', event => {
  if (event.target.closest('#main-menu button')) playGameSound('ui');
}, true);
