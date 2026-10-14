// 효과음·환경음은 직접 합성하고, 새 정신력 BGM은 로컬 음원 파일로 재생한다.
let gameAudioContext = null;
let gameAudioMaster = null;
let gameAudioAppliedVolume = null;
const gameAudioBuffers = new Map();
const gameAudioEffects = new Set();
const gameAudioAmbience = new Map();
const gameAudioLastPlayed = new Map();
const sanityMusicElement = new Audio('assets/audio/sanity-dread.wav');
sanityMusicElement.preload = 'auto';
sanityMusicElement.loop = true;
sanityMusicElement.volume = 0;
let sanityMusicGain = 0;
let sanityMusicTarget = 0;

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
  const volume = Math.max(0, Math.min(1, gameVolume));
  sanityMusicElement.volume = volume * sanityMusicGain;
  if (!gameAudioMaster) return;
  if (gameAudioAppliedVolume === volume) return;
  gameAudioAppliedVolume = volume;
  gameAudioMaster.gain.setTargetAtTime(volume, gameAudioContext.currentTime, .02);
}

// 소음과 감쇠하는 저음을 섞어 충격·마찰음을 만든다. 반복음도 시작/끝의 파형을 맞춘다.
function gameAudioBuffer(name) {
  if (gameAudioBuffers.has(name)) return gameAudioBuffers.get(name);
  const durations = { step: .2, door: .65, 'elevator-door': 1.05, 'elevator-arrive': 1.05,
    'elevator-alarm': .95, blackout: 1.5, 'robot-servo': .48, 'robot-alert': .6,
    'robot-grab': .65, 'call-ring': .85, phone: .14, charger: .24, pickup: .22, 'item-get': .5, 'item-use': .3, deny: .46,
    shutter: 1.35, switch: .12, ui: .09,
    'cctv-beep': 2.2, 'cctv-on': 1.3, 'cctv-hit': 1.8, 'cctv-static': .7, heartbeat: .9, 'cctv-rise': 5.2 };
  const loop = ['office', 'dark', 'wind', 'motor', 'cctv-bgm', 'cctv-dread'].includes(name);
  const duration = loop ? 8 : durations[name];
  if (!duration) return null;
  const rate = 24000;
  const buffer = gameAudioContext.createBuffer(1, Math.ceil(duration * rate), rate);
  const samples = buffer.getChannelData(0);
  let seed = 12345, low = 0, soft = 0;
  const sin = (frequency, t) => Math.sin(2 * Math.PI * frequency * t);
  const hit = (t, at, decay) => t >= at ? Math.exp(-(t - at) * decay) : 0;
  // 버저·삑 소리처럼 일정하게 이어지는 음은 at부터 length 동안만 켜고 양끝을 짧게 다듬는다.
  const gate = (t, at, length) => t >= at && t < at + length ? Math.min(1, (t - at) / .006, (at + length - t) / .02) : 0;
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
      // 가방에 넣는 물건은 밝은 2음 차임, 물건을 써서 여는 장치는 철컥 뒤 짧은 삑, 거부는 낮게 내려가는 2음 버저.
      case 'item-get': sample = (.16 * sin(988, t) + .035 * sin(1976, t)) * hit(t, .004, 11) + (.16 * sin(1319, t) + .035 * sin(2637, t)) * hit(t, .1, 7.5); break;
      case 'item-use': sample = (.3 * soft + .12 * sin(180, t)) * hit(t, .004, 60) + .2 * soft * hit(t, .055, 75) + .1 * sin(1480, t) * gate(t, .15, .1); break;
      case 'deny': sample = (.11 * sin(t < .19 ? 220 : 165, t) + .05 * sin(t < .19 ? 660 : 495, t) + .025 * sin(t < .19 ? 1100 : 825, t)) * (gate(t, 0, .16) + gate(t, .21, .22)); break;
      // 셔터: 수동 레버의 철컥, 말려 올라가는 철판의 덜컹거림과 낮은 마찰음, 끝까지 감겼을 때의 쿵.
      case 'shutter': sample = (.26 * soft + .1 * sin(150, t)) * hit(t, .005, 45) + .18 * low * gate(t, .08, 1.04) +
        (.2 * soft + .06 * sin(420, t)) * Math.exp(-((t * 22) % 1) * 4.5) * (.75 + .25 * sin(2.3, t)) * gate(t, .1, 1) + (.2 * sin(70, t) + .16 * soft) * hit(t, 1.15, 26); break;
      case 'switch': sample = (.28 * soft + .1 * sin(210, t)) * hit(t, .008, 48); break;
      case 'ui': sample = .09 * sin(720 - 900 * t, t) * Math.sin(Math.PI * t / duration) * Math.exp(-25 * t); break;
      // CCTV 컷씬: 신호가 끊긴 화면의 귀를 찢는 "삐——"(1kHz 2.2초, 처음과 끝이 뚝 끊긴다), 브라운관이 켜지는 쿵 소리와 고주파 울림,
      // 놀랄 때의 낮은 충격과 불협화음, 화면이 바뀔 때의 짧은 잡음, 심장 박동.
      case 'cctv-beep': sample = .22 * sin(1000, t) + .05 * sin(2000, t); break;
      case 'cctv-on': sample = .26 * soft * hit(t, 0, 9) + .2 * sin(58, t) * hit(t, 0, 7) + .06 * Math.sign(sin(120, t)) * hit(t, .05, 3) +
        .03 * sin(7800, t) * Math.min(1, t / .3) * (1 - t / duration); break;
      case 'cctv-hit': sample = .42 * sin(42 - 10 * t, t) * hit(t, 0, 2.2) + .35 * low * hit(t, 0, 6) +
        .06 * (sin(311, t) + sin(329.6, t) + sin(466, t)) * Math.min(1, t / .08) * hit(t, 0, 1.6); break;
      case 'cctv-static': sample = .32 * noise * hit(t, 0, 5) * (.6 + .4 * sin(50, t)) + .04 * sin(7800, t) * hit(t, 0, 4); break;
      case 'heartbeat': sample = .55 * sin(55, t) * (hit(t, 0, 14) + .7 * hit(t, .26, 14)) + .25 * low * (hit(t, 0, 20) + hit(t, .26, 20)); break;
      // 걷는 동안 점점 차오르다 끝에서 뚝 끊기는 낮은 웅웅거림. 끝으로 갈수록 떨림이 빨라진다.
      case 'cctv-rise': sample = (t / duration) ** 2.2 * ((.24 * sin(46, t) + .12 * sin(65, t) + .32 * low) * (1 + .35 * sin(3 + 5 * t / duration, t)) +
        .05 * sin(466 + 40 * t / duration, t)); break;
      // 관제실 배경음(반복): 삼전음 간격의 낮은 저음이 8초에 한 번 부풀고, 반음 차이로 맥놀이하는 높은 울림과 1.6초마다 뛰는 심장 박동.
      case 'cctv-bgm': sample = (.12 * sin(55, t) + .08 * sin(77.78, t)) * (1 + .3 * sin(.125, t)) +
        .022 * (sin(622.25, t) + sin(659.26, t)) * (.5 + .5 * sin(.25, t)) + .2 * low * (.6 + .4 * sin(.375, t)) +
        .2 * sin(50, t) * (hit(t % 1.6, 0, 14) + .7 * hit(t % 1.6, .26, 14)); break;
      // 처음 CCTV를 켜 보는 동안의 배경음(반복): 아주 낮게 웅웅거리는 저음 위로 반음 차이의 높은 음 둘이 맥놀이하며 서로 긁고,
      // 그 위에서 떨리며 음이 흔들리는 가는 울림이 맴돈다. 2초마다 숨을 들이켜는 듯한 잡음이 지나간다.
      case 'cctv-dread': sample = .2 * sin(36, t) * (.7 + .3 * sin(.125, t)) + .15 * low * (.5 + .5 * sin(.375, t)) +
        .06 * (sin(880, t) + sin(932.33, t)) * (.6 + .4 * sin(.25, t)) +
        .045 * Math.sin(2 * Math.PI * 1318.5 * t + 4 * Math.sin(2 * Math.PI * .5 * t)) * (.5 + .5 * sin(.125, t)) +
        .14 * soft * hit(t % 2, .3, 3) * Math.min(1, (t % 2) / .3 * 3); break;
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
  gain.gain.value = (name === 'step' ? (options.landing ? .65 : options.running ? .6 : .42) : name === 'blackout' ? .7 : name === 'cctv-hit' ? .85 : name === 'cctv-rise' ? .7 :
    name === 'robot-servo' ? .35 : .6) * (1 - distance / 800);
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

// 환각이 나타날 때의 효과음은 합성음이 아닌 mp3 파일이다. fetch·decodeAudioData는 file://에서 막히므로 <audio>로 재생한다.
const hallucinationSoundElement = new Audio('assets/audio/hallucination-jumpscare.mp3');
hallucinationSoundElement.preload = 'auto';
// 추격이 아닌 환각은 이 세 소리 중 하나를 무작위로 들려준다. 직전에 들려준 소리만 빼고 고르므로 연달아 같은 소리는 없고,
// 다른 소리가 한 번 나온 뒤에는 다시 나올 수 있다.
const hallucinationSightingElements = ['1', '2', '3'].map(n => {
  const element = new Audio(`assets/audio/hallucination-sighting-${n}.mp3`);
  element.preload = 'auto';
  return element;
});
let lastHallucinationSightingSound = -1;
// 환각에게 삼켜져 쓰러질 때의 소리.
const hallucinationDevouredElement = new Audio('assets/audio/hallucination-devoured.mp3');
hallucinationDevouredElement.preload = 'auto';

// B2 엘리베이터에서 경비 로봇이 문을 억지로 열기 시작할 때의 소리(b2-ending.js).
const doorPryElement = new Audio('assets/audio/b2-door-pry.mp3');
doorPryElement.preload = 'auto';

function playDoorPrySound() {
  if (document.hidden || gameVolume <= 0 || mainMenuActive || !gameStarted) return;
  doorPryElement.volume = Math.max(0, Math.min(1, gameVolume));
  doorPryElement.currentTime = 0;
  doorPryElement.play().catch(() => {});
}

// B2 DELETE 뒤 삭제가 진행되는 동안 반복되는 사이렌(b2-ending.js). on이면 켜 두고(이미 돌고 있으면 볼륨만 맞춘다), 끄면 처음으로 되감는다.
const b2SirenElement = new Audio('assets/audio/b2-siren.mp3');
b2SirenElement.preload = 'auto';
// 사이렌 파일은 끝날 때마다 b2SirenGapMs만큼 쉬었다가 다시 울린다(파일 자체의 끝 무음에 더해진다).
const b2SirenGapMs = 300;
let b2SirenOn = false;
let b2SirenWaiting = false;
let b2SirenTimer = null;
b2SirenElement.addEventListener('ended', () => {
  if (!b2SirenOn) return;
  b2SirenWaiting = true;
  clearTimeout(b2SirenTimer);
  b2SirenTimer = setTimeout(() => { b2SirenWaiting = false; if (b2SirenOn) setB2Siren(true); }, b2SirenGapMs);
});

function setB2Siren(on) {
  b2SirenOn = on;
  if (!on) {
    clearTimeout(b2SirenTimer);
    b2SirenWaiting = false;
    b2SirenElement.pause();
    b2SirenElement.currentTime = 0;
    return;
  }
  if (document.hidden || gameVolume <= 0 || mainMenuActive || !gameStarted) return;
  b2SirenElement.volume = Math.max(0, Math.min(1, gameVolume));
  if (b2SirenElement.paused && !b2SirenWaiting) b2SirenElement.play().catch(() => {});
}

function playHallucinationDevouredSound() {
  if (document.hidden || gameVolume <= 0) return;
  hallucinationDevouredElement.volume = Math.max(0, Math.min(1, gameVolume));
  hallucinationDevouredElement.currentTime = 0;
  hallucinationDevouredElement.play().catch(() => {});
}

function playHallucinationSound(volume = 1, randomSighting = false) {
  if (document.hidden || gameVolume <= 0 || mainMenuActive || !gameStarted || restoringProgress) return;
  let element = hallucinationSoundElement;
  if (randomSighting) {
    const choices = hallucinationSightingElements.map((_, index) => index).filter(index => index !== lastHallucinationSightingSound);
    lastHallucinationSightingSound = choices[Math.floor(Math.random() * choices.length)];
    element = hallucinationSightingElements[lastHallucinationSightingSound];
  }
  element.volume = Math.max(0, Math.min(1, gameVolume * volume));
  element.currentTime = 0;
  element.play().catch(() => {});
}

function pauseGameAudio() {
  sanityMusicElement.pause();
  sanityMusicGain = sanityMusicTarget = 0;
  sanityMusicElement.volume = 0;
  if (document.hidden || mainMenuActive || !gameStarted) for (const element of [hallucinationSoundElement, ...hallucinationSightingElements, hallucinationDevouredElement, doorPryElement, b2SirenElement]) element.pause();
  if (!gameAudioContext) return;
  for (const sound of gameAudioAmbience.values()) stopGameAudioSource(sound);
  gameAudioAmbience.clear();
  for (const sound of gameAudioEffects) if (sound.name !== 'ui' || document.hidden) stopGameAudioSource(sound);
}

function stopGameSound(name) {
  for (const sound of gameAudioEffects) if (sound.name === name) stopGameAudioSource(sound);
}

// <audio>는 file://에서도 재생된다. 곡을 다시 시작하지 않고 음량만 부드럽게 바꾼다.
function updateSanityMusic(target, elapsed) {
  sanityMusicTarget = target;
  sanityMusicGain += (target - sanityMusicGain) * Math.min(1, elapsed / 300);
  if (!target && sanityMusicGain < .001) {
    sanityMusicGain = 0;
    sanityMusicElement.pause();
  }
  sanityMusicElement.volume = Math.max(0, Math.min(1, gameVolume)) * sanityMusicGain;
  if (target && sanityMusicElement.paused) sanityMusicElement.play().catch(() => {});
}

function updateGameAudio(elapsed = step) {
  if (!gameAudioContext || gameAudioContext.state !== 'running') return;
  refreshGameAudioVolume();
  if (document.hidden || mainMenuActive || !gameStarted) return pauseGameAudio();
  const roof = !selectingFloor && currentSceneFloor === 18;
  const lit = selectingFloor ? !buildingBlackout : floorHasPower(currentSceneFloor) && world.dataset.dark !== 'true';
  // B1 방재 관제실은 CCTV 컷씬의 지진부터 소름 끼치는 배경음(cctv-bgm)으로 바뀌고, 처음 CCTV를 켜 보는 동안에는 기괴하고
  // 음산한 배경음(cctv-dread)이 흐른다(js/scene/cctv-event.js).
  const dread = !selectingFloor && cctvDreadPlaying();
  const haunted = !selectingFloor && cctvBgmPlaying();
  const background = dread ? 'cctv-dread' : haunted ? 'cctv-bgm' : roof ? 'wind' : lit ? 'office' : 'dark';
  const moving = selectingFloor && cabinCarIndex !== null && elevatorCars[cabinCarIndex].travelling && elevatorHasPower();
  const wanted = new Map([[background, dread ? .42 : haunted ? .34 : roof ? .23 : lit ? .18 : .14]]);
  const fear = sanityTierOf(sanity);
  const musicAllowed = !dread && !haunted && !openingActive && !blackoutSceneActive && !storySceneActive && !cctvSceneActive && !playerCaught && !hallucinationCaught;
  updateSanityMusic(musicAllowed ? fear * .06 : 0, elapsed);
  if (moving) wanted.set('motor', .25);
  if (!selectingFloor && !openingActive && !blackoutSceneActive && !cctvSceneActive && !usingComputer && !usingKeypad && !usingPowerPanel && !usingInspection && !transitioning && !playerCaught && guardPatrol.door && lit && (guardPatrol.mode === 'chase' || !guardPatrol.wait)) {
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
