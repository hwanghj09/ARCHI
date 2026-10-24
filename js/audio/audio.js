// 효과음·환경음은 직접 합성하고, 새 정신력 BGM은 로컬 음원 파일로 재생한다.
let gameAudioContext = null;
let gameAudioMaster = null;
let gameAudioAppliedVolume = null;
const gameAudioBuffers = new Map();
const gameAudioEffects = new Set();
const gameAudioAmbience = new Map();
const gameAudioLastPlayed = new Map();
const gameAudioLastVariant = new Map();
let gameAudioRoomKey = '';
let gameAudioRoomElapsed = 0;
let gameAudioRoomNext = 10000;
const auditoryHallucinationSounds = ['hallucination-footsteps', 'hallucination-knock', 'hallucination-whisper'];
let auditoryHallucinationLast = null;
let auditoryHallucinationRoom = '';
let auditoryHallucinationElapsed = 0;
let auditoryHallucinationNext = 22000 + Math.random() * 20000;
const sanityMusicTracks = ['sanity-dread', 'sanity-musicbox', 'sanity-vent', 'sanity-pulse', 'sanity-strings', 'sanity-signal'];
let sanityMusicIndex = Math.floor(Math.random() * sanityMusicTracks.length);
const sanityMusicElement = new Audio(`assets/audio/${sanityMusicTracks[sanityMusicIndex]}.wav`);
sanityMusicElement.preload = 'auto';
sanityMusicElement.volume = 0;
let sanityMusicGain = 0;
let sanityMusicTarget = 0;

function nextSanityMusicTrack() {
  let next = Math.floor(Math.random() * (sanityMusicTracks.length - 1));
  if (next >= sanityMusicIndex) next++;
  sanityMusicIndex = next;
  sanityMusicElement.src = `assets/audio/${sanityMusicTracks[next]}.wav`;
}

sanityMusicElement.addEventListener('ended', () => {
  if (!sanityMusicTarget || document.hidden || mainMenuActive || !gameStarted || gameAudioContext?.state !== 'running') return;
  nextSanityMusicTrack();
  sanityMusicElement.play().catch(() => {});
});

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

function gameAudioRoomProfile() {
  if (selectingFloor) return 'cabin';
  if (currentSceneFloor === 18) return 'roof';
  const config = room === 'dynamic' ? floorById.get(dynamicFloorId) : null;
  if (config?.id.endsWith('-restroom')) return 'restroom';
  if (!config?.interior && room !== 'office') return currentSceneFloor < 0 ? 'service' : 'hallway';
  if (/server|main|eval|testbay|security|verify|ops/.test(config?.id || '')) return 'server';
  if (currentSceneFloor < 0 || /power|manager/.test(config?.id || '')) return 'service';
  if (/harmony|vip|lounge|meeting|strategy|executive|director/.test(config?.id || '')) return 'hall';
  if (/kitchen|cafe|cu$/.test(config?.id || '')) return 'tile';
  return 'office';
}

function gameAudioCue(name, options) {
  if (name === 'step') {
    if (options.landing) return 'landing';
    const profile = gameAudioRoomProfile();
    return `step-${['roof', 'cabin', 'service', 'server'].includes(profile) ? 'metal' :
      ['office', 'hall'].includes(profile) ? 'carpet' : 'tile'}`;
  }
  if (name === 'door') {
    const material = `${options.door?.style || ''} ${options.door?.sprite || ''}`;
    return /slide/.test(material) ? 'door-slide' : /glass|pivot|cafeteria|cafe/.test(material) ? 'door-glass' :
      /wood|blinds|hall-double|executive|director|lacquer/.test(material) ? 'door-wood' : 'door-metal';
  }
  return options.cue || name;
}

// 소음과 감쇠하는 저음을 섞어 충격·마찰음을 만든다. 반복음도 시작/끝의 파형을 맞춘다.
function gameAudioBuffer(name, variant = 0) {
  const key = variant ? `${name}:${variant}` : name;
  if (gameAudioBuffers.has(key)) return gameAudioBuffers.get(key);
  const durations = { step: .2, door: .65, 'elevator-door': 1.05, 'elevator-arrive': 1.05,
    'elevator-alarm': .95, blackout: 1.5, 'robot-step': .26, 'robot-servo': .48, 'robot-alert': .6,
    'robot-grab': .65, 'call-ring': .85, phone: .14, charger: .24, pickup: .22, 'item-get': .5, 'item-use': .3, deny: .46,
    shutter: 1.35, 'camera-shutter': .18, switch: .12, ui: .09,
    'cctv-beep': 2.2, 'cctv-on': 1.3, 'cctv-hit': 1.8, 'cctv-static': .7, heartbeat: .9, 'cctv-rise': 5.2,
    'step-tile': .2, 'step-carpet': .22, 'step-metal': .24, landing: .4,
    'door-metal': .65, 'door-wood': .72, 'door-glass': .52, 'door-slide': .9,
    paper: .42, 'bag-zip': .48, drawer: .62, lever: .3, plug: .26, 'card-scan': .34, dial: .18,
    keyboard: .09, 'mouse-click': .075, 'power-relay': .65, 'water-drop': .5, 'pipe-tick': .55,
    'hallucination-footsteps': 1.6, 'hallucination-knock': 1.5, 'hallucination-whisper': 2.8, 'ending-true': 7, 'ending-bad': 7 };
  const loop = ['office', 'dark', 'wind', 'motor', 'cctv-bgm', 'cctv-dread',
    'server-room', 'electrical-room', 'plumbing', 'hall-room'].includes(name);
  const duration = loop ? 8 : durations[name];
  if (!duration) return null;
  const rate = 24000;
  const buffer = gameAudioContext.createBuffer(1, Math.ceil(duration * rate), rate);
  const samples = buffer.getChannelData(0);
  let seed = 12345 + variant * 1013, low = 0, soft = 0;
  const pitch = variant ? 1 + (variant - 2) * .035 : 1;
  const sin = (frequency, t) => Math.sin(2 * Math.PI * frequency * pitch * t);
  const hit = (t, at, decay) => t >= at ? Math.exp(-(t - at) * decay) : 0;
  // 버저·삑 소리처럼 일정하게 이어지는 음은 at부터 length 동안만 켜고 양끝을 짧게 다듬는다.
  const gate = (t, at, length) => t >= at && t < at + length ? Math.min(1, (t - at) / .006, (at + length - t) / .02) : 0;
  // 잡음에 성도 공명을 입혀 말뜻을 알아들을 수 없는 숨 섞인 속삭임을 만든다.
  const whisperFormants = name === 'hallucination-whisper' ? [550, 1450, 2600].map(frequency =>
    ({ a: 1.92 * Math.cos(2 * Math.PI * frequency * pitch / rate), first: 0, second: 0 })) : null;
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    low += .028 * (noise - low);
    soft += .15 * (noise - soft);
    let sample = 0;
    switch (name) {
      case 'hallucination-footsteps': sample = (.34 * low + .12 * sin(86, t)) * (hit(t, .02, 28) + .75 * hit(t, .48, 30) + .5 * hit(t, 1.03, 32)) +
        .1 * soft * (hit(t, .07, 40) + .7 * hit(t, .53, 40) + .45 * hit(t, 1.08, 40)); break;
      case 'hallucination-knock': sample = (.2 * sin(108, t) + .23 * low + .08 * soft) * (hit(t, .04, 22) + .65 * hit(t, .62, 25)); break;
      case 'hallucination-whisper': {
        let voice = 0;
        for (const formant of whisperFormants) {
          const next = .04 * noise + formant.a * formant.first - .9216 * formant.second;
          formant.second = formant.first; formant.first = next; voice += next;
        }
        const syllables = Math.exp(-(((t - .45) / .2) ** 2)) + .65 * Math.exp(-(((t - 1.1) / .18) ** 2)) + .85 * Math.exp(-(((t - 1.85) / .35) ** 2));
        sample = (.35 * voice + .045 * (noise - soft)) * syllables;
        break;
      }
      case 'step': sample = .42 * low * hit(t, 0, 25) + .18 * sin(92, t) * hit(t, 0, 34) + .22 * soft * hit(t, .045, 38); break;
      case 'door': sample = .18 * low * Math.sin(Math.PI * t / duration) + (.22 * sin(74, t) + .2 * soft) * hit(t, .47, 28); break;
      case 'elevator-door': sample = (.1 * sin(138, t) + .3 * low) * Math.sin(Math.PI * t / duration) + .2 * soft * hit(t, .88, 36); break;
      case 'elevator-arrive': sample = (.2 * sin(660, t) + .065 * sin(1320, t)) * hit(t, .015, 4.8) + .1 * sin(880, t) * hit(t, .12, 5.2); break;
      case 'elevator-alarm': sample = .17 * sin(t < .36 ? 540 : 680, t) * (t % .32 < .22 ? 1 : 0) * Math.sin(Math.PI * t / duration); break;
      case 'blackout': sample = .32 * soft * hit(t, .012, 13) + .12 * sin(112 - 35 * t, t) * hit(t, 0, 3.7) + .15 * noise * hit(t, .19, 32); break;
      case 'robot-servo': sample = (.16 * sin(125 + 12 * t, t) + .045 * sin(420, t) + .22 * low) * Math.sin(Math.PI * t / duration); break;
      // 바퀴의 낮은 진동 위에 금속 관절의 철컥임과 짧은 기어 마찰음을 겹친다.
      case 'robot-step': sample = (.3 * sin(76, t) + .32 * low) * hit(t, .008, 30) +
        (.18 * soft + .075 * sin(1380, t) + .05 * sin(2130, t)) * hit(t, .018, 65) +
        (.1 * soft + .045 * sin(340 - 420 * t, t)) * gate(t, .045, .16) + .12 * soft * hit(t, .12, 55); break;
      case 'robot-alert': sample = .13 * sin(t < .24 ? 330 : 390, t) * (hit(t, .015, 14) + hit(t, .3, 14)); break;
      case 'robot-grab': sample = (.14 * sin(118, t) + .26 * low) * Math.sin(Math.PI * t / duration) + (.18 * sin(68, t) + .18 * soft) * hit(t, .48, 32); break;
      case 'call-ring': sample = (.11 * sin(440, t) + .08 * sin(480, t)) * (hit(t, .02, 9) + hit(t, .4, 9)); break;
      case 'phone': sample = .12 * sin(680 - 850 * t, t) * Math.sin(Math.PI * t / duration) * Math.exp(-18 * t); break;
      case 'camera-shutter': sample = (.25 * soft + .1 * sin(1250, t)) * (hit(t, .01, 65) + .7 * hit(t, .075, 80)); break;
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
      case 'step-tile': sample = (.23 * soft + .17 * sin(125, t)) * hit(t, .004, 45) + .14 * soft * hit(t, .06, 36); break;
      case 'step-carpet': sample = (.4 * low + .1 * sin(78, t)) * hit(t, .008, 26) + .12 * soft * gate(t, .035, .11); break;
      case 'step-metal': sample = (.24 * soft + .16 * sin(116, t)) * hit(t, .004, 32) +
        (.055 * sin(710, t) + .035 * sin(1087, t)) * hit(t, .014, 24); break;
      case 'landing': sample = (.25 * sin(64, t) + .38 * low) * hit(t, .008, 18) + .16 * soft * hit(t, .06, 25); break;
      case 'door-metal': sample = (.22 * soft + .09 * sin(880, t)) * hit(t, .015, 48) + .15 * low * gate(t, .08, .3) +
        (.22 * sin(81, t) + .16 * soft) * hit(t, .42, 26); break;
      case 'door-wood': sample = .17 * low * gate(t, .02, .38) + .04 * sin(175 - 45 * t, t) * gate(t, .08, .32) +
        (.2 * sin(92, t) + .2 * low) * hit(t, .4, 21) + .13 * soft * hit(t, .47, 48); break;
      case 'door-glass': sample = (.18 * soft + .045 * sin(1680, t)) * hit(t, .01, 55) + .14 * low * gate(t, .07, .25) +
        (.1 * sin(530, t) + .07 * sin(907, t)) * hit(t, .32, 23); break;
      case 'door-slide': sample = (.3 * low + .035 * sin(220, t)) * Math.sin(Math.PI * t / duration) +
        .13 * soft * (hit(t, .015, 45) + hit(t, .74, 32)); break;
      case 'paper': sample = (.28 * soft + .06 * noise) * (gate(t, .02, .16) + .65 * gate(t, .23, .15)) * (.6 + .4 * sin(31, t)); break;
      case 'bag-zip': sample = .25 * soft * gate(t, .03, .35) * (.45 + .55 * Math.abs(sin(65, t))) + .13 * low * hit(t, .36, 35); break;
      case 'drawer': sample = .3 * low * gate(t, .015, .43) * (.7 + .3 * sin(18, t)) +
        (.14 * sin(112, t) + .15 * soft) * hit(t, .44, 30); break;
      case 'lever': sample = (.26 * soft + .11 * sin(170, t)) * (hit(t, .01, 48) + .8 * hit(t, .16, 35)); break;
      case 'plug': sample = .17 * soft * gate(t, .01, .12) + (.2 * soft + .08 * sin(340, t)) * hit(t, .14, 50); break;
      case 'card-scan': sample = .1 * sin(1320, t) * gate(t, .03, .08) + .1 * sin(1760, t) * gate(t, .15, .11); break;
      case 'dial': sample = (.19 * soft + .07 * sin(930, t)) * (hit(t, .005, 80) + .65 * hit(t, .065, 70)); break;
      case 'keyboard': sample = (.19 * soft + .06 * sin(420, t)) * (hit(t, .003, 110) + .45 * hit(t, .038, 110)); break;
      case 'mouse-click': sample = (.16 * soft + .05 * sin(1800, t)) * (hit(t, .003, 150) + .5 * hit(t, .032, 130)); break;
      case 'power-relay': sample = (.21 * soft + .09 * sin(150, t)) * (hit(t, .01, 52) + .7 * hit(t, .12, 48)) +
        .11 * sin(100, t) * gate(t, .15, .4) * Math.exp(-3 * t); break;
      case 'water-drop': sample = (.09 * sin(1600 - 1800 * t, t) + .045 * sin(2410 - 1600 * t, t)) * hit(t, .015, 13) + .05 * soft * hit(t, .06, 35); break;
      case 'pipe-tick': sample = (.12 * sin(640, t) + .055 * sin(973, t)) * hit(t, .005, 12) + .12 * soft * hit(t, .008, 65); break;
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
      // B2 엔딩 화면(b2-ending.js · b2-capture-scene.js). TRUE END: 천천히 부풀었다 사라지는 밝은 장화음.
      case 'ending-true': sample = Math.min(1, t / 1.5) * Math.exp(-Math.max(0, t - 2.5) * .7) *
        (.07 * (sin(261.63, t) + sin(329.63, t) + sin(392, t)) + .05 * sin(130.81, t) + .035 * sin(523.25, t) * (.5 + .5 * sin(.5, t))); break;
      // BAD END: 쿵 하는 저음 뒤에 반음 차이로 긁히는 낮은 울림과 떨리는 높은 음이 남는다.
      case 'ending-bad': sample = .42 * sin(41, t) * hit(t, 0, 1.4) + .3 * low * hit(t, 0, 2.5) + Math.min(1, t / 1.2) * Math.exp(-Math.max(0, t - 3) * .8) *
        (.07 * (sin(110, t) + sin(116.54, t)) + .03 * Math.sin(2 * Math.PI * 1244.5 * t + 3 * Math.sin(2 * Math.PI * .7 * t))); break;
      case 'office': sample = .6 * low + .09 * sin(62.5, t) + .025 * sin(125, t); break;
      case 'dark': sample = .46 * low + .065 * sin(37.5, t) * (1 + .18 * sin(.125, t)); break;
      case 'wind': sample = .95 * low * (.65 + .2 * sin(.25, t) + .12 * sin(.625, t)); break;
      case 'motor': sample = .14 * sin(87.5, t) + .045 * sin(175, t) + .3 * low; break;
      case 'server-room': sample = .48 * low + .1 * soft * (.7 + .2 * sin(.375, t)) +
        .045 * sin(187.5, t) + .025 * sin(375, t); break;
      case 'electrical-room': sample = .18 * sin(50, t) + .055 * sin(100, t) + .3 * low * (.8 + .15 * sin(.25, t)); break;
      case 'plumbing': sample = .35 * low + .07 * soft * (.7 + .3 * sin(.25, t)) + .025 * sin(112.5, t); break;
      case 'hall-room': sample = .28 * low + .035 * sin(62.5, t) + .025 * sin(93.75, t) * (.6 + .3 * sin(.125, t)); break;
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
  gameAudioBuffers.set(key, buffer);
  return buffer;
}

function playGameSound(name, options = {}) {
  if (!gameAudioContext || gameAudioContext.state !== 'running' || document.hidden || gameVolume <= 0) return;
  if (typeof restoringProgress !== 'undefined' && restoringProgress) return;
  if (name !== 'ui' && (mainMenuActive || !gameStarted)) return;
  const now = gameAudioContext.currentTime;
  const distance = Number.isFinite(options.x) && (!selectingFloor || name === 'robot-step' || name === 'robot-servo') ? Math.abs(options.x - body.position.x) : 0;
  if (distance >= 800) return;
  const interval = name === 'step' ? (options.running ? .21 : .29) : name === 'robot-step' ? 0 : name === 'robot-alert' ? 1.2 : name === 'robot-servo' ? 1.1 : .08;
  if (now - (gameAudioLastPlayed.get(name) ?? -Infinity) < interval || gameAudioEffects.size >= 6) return;
  if (name === 'robot-step') return playRobotStepFile(distance);
  const cue = gameAudioCue(name, options);
  const varied = name === 'step' || name === 'door' || ['paper', 'keyboard', 'water-drop', 'pipe-tick'].includes(cue);
  const last = gameAudioLastVariant.get(cue) || 1;
  const variant = varied ? (last + Math.floor(Math.random() * 2)) % 3 + 1 : 0;
  const buffer = gameAudioBuffer(cue, variant);
  if (!buffer) return;
  if (varied) gameAudioLastVariant.set(cue, variant);
  gameAudioLastPlayed.set(name, now);
  const source = gameAudioContext.createBufferSource();
  const gain = gameAudioContext.createGain();
  source.buffer = buffer;
  source.playbackRate.value = name === 'step' || name === 'robot-step' ? .94 + Math.random() * .12 : 1;
  gain.gain.value = (name === 'step' ? (options.landing ? .65 : options.running ? .6 : .42) : name === 'blackout' ? .7 : name === 'cctv-hit' ? .85 : name === 'cctv-rise' ? .7 :
    name === 'robot-servo' ? .35 : name === 'robot-step' ? .52 :
    ['paper', 'keyboard', 'mouse-click', 'bag-zip', 'water-drop', 'pipe-tick'].includes(cue) ? .32 : .6) * (1 - distance / 800);
  const pan = Number.isFinite(options.x) ? gameAudioContext.createStereoPanner?.() : null;
  source.connect(gain);
  if (pan) {
    pan.pan.value = Math.max(-.75, Math.min(.75, (options.x - body.position.x) / 600));
    gain.connect(pan).connect(gameAudioMaster);
  } else gain.connect(gameAudioMaster);
  const effect = { source, gain, pan, name, cue, variant, stopping: false };
  gameAudioEffects.add(effect);
  source.onended = () => { gameAudioEffects.delete(effect); source.disconnect(); gain.disconnect(); pan?.disconnect(); };
  source.start();
  return effect;
}

function playAuditoryHallucination() {
  if (!gameAudioContext || gameAudioContext.state !== 'running' || document.hidden || mainMenuActive || !gameStarted || gameVolume <= 0 || restoringProgress) return false;
  const choices = auditoryHallucinationSounds.filter(sound => sound !== auditoryHallucinationLast);
  const name = choices[Math.floor(Math.random() * choices.length)];
  const x = body.position.x + (Math.random() < .5 ? -1 : 1) * (180 + Math.random() * 220);
  if (!playGameSound(name, { x })) return false;
  auditoryHallucinationLast = name;
  return true;
}

function updateAuditoryHallucinations(elapsed, allowed) {
  const key = `${room}:${dynamicFloorId}:${currentSceneFloor}`;
  if (!allowed || gameVolume <= 0 || key !== auditoryHallucinationRoom) {
    auditoryHallucinationRoom = key;
    auditoryHallucinationElapsed = 0;
    for (const sound of gameAudioEffects) if (auditoryHallucinationSounds.includes(sound.name)) stopGameAudioSource(sound);
    return;
  }
  auditoryHallucinationElapsed += Math.min(elapsed, 100);
  if (auditoryHallucinationElapsed < auditoryHallucinationNext) return;
  if (playAuditoryHallucination()) {
    auditoryHallucinationElapsed = 0;
    auditoryHallucinationNext = 22000 + Math.random() * 20000;
  }
}

function debugTriggerAuditoryHallucination() {
  if (hallucinationEventBlocked()) return false;
  return playAuditoryHallucination();
}

function updateRobotMovementSound(robot, distance) {
  robot.soundDistance = distance > 0 ? (robot.soundDistance ?? 0) + distance : 0;
  if (robot.soundDistance < 38) return;
  robot.soundDistance %= 38;
  playGameSound('robot-servo', { x: robot.x }); // 발소리는 걷기 컷에 맞춰 updateRobot이 낸다
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
// 환각에게 삼켜져 쓰러질 때의 포효. 죽음 영상(hallucination-jumpscare.mp4, 소리 없음)에서 입을 벌리는 순간부터 소리 파일의 0.3초 지점을 들려준다.
const hallucinationDevouredElement = new Audio('assets/audio/hallucination-roar.mp3');
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

// B2 2페이즈가 시작될 때 문이 열리는 소리(b2-ending.js). 파일의 12초 지점부터 틀고, 불러오기·새 게임이면 멈춘다.
const b2PhaseDoorElement = new Audio('assets/audio/b2-phase2-door.mp3');
b2PhaseDoorElement.preload = 'auto';
const b2PhaseDoorStartS = 12;

function playB2PhaseDoorSound() {
  if (document.hidden || gameVolume <= 0 || mainMenuActive || !gameStarted) return;
  b2PhaseDoorElement.volume = Math.max(0, Math.min(1, gameVolume));
  const start = () => { b2PhaseDoorElement.currentTime = b2PhaseDoorStartS; b2PhaseDoorElement.play().catch(() => {}); };
  if (b2PhaseDoorElement.readyState >= 1) start(); // 길이를 알아야 12초로 건너뛸 수 있다
  else b2PhaseDoorElement.addEventListener('loadedmetadata', start, { once: true });
}

function stopB2PhaseDoorSound() {
  b2PhaseDoorElement.pause();
}

// B2 2페이즈 보스의 발이 땅에 닿을 때마다 나는 발소리(b2-ending.js). 보스가 가까울수록 크다.
const b2BossStepElement = new Audio('assets/audio/b2-boss-step.mp3');
b2BossStepElement.preload = 'auto';

function playB2BossStep(x) {
  if (document.hidden || gameVolume <= 0 || mainMenuActive || !gameStarted) return;
  const near = Math.max(.3, 1 - Math.abs(x - body.position.x) / 1200);
  b2BossStepElement.volume = Math.max(0, Math.min(1, gameVolume * near));
  b2BossStepElement.currentTime = 0;
  b2BossStepElement.play().catch(() => {});
}

// 경비 로봇의 발이 땅에 닿을 때의 발소리(guard-patrol.js가 걷기·달리기 컷에 맞춰 'robot-step'을 부른다).
// 한 발(0.9초)이 다음 발(달리기 360ms 간격)보다 길어서 세 개를 돌려 쓴다.
const robotStepElements = [0, 1, 2].map(() => {
  const element = new Audio('assets/audio/robot-step.mp3');
  element.preload = 'auto';
  element.preservesPitch = false;
  return element;
});
let robotStepNext = 0;

function playRobotStepFile(distance) {
  const element = robotStepElements[robotStepNext];
  robotStepNext = (robotStepNext + 1) % robotStepElements.length;
  // 원본이 수호 발소리(step-tile, 걷기)보다 약 30배 커서, 바로 옆에서 수호 발소리의 약 2.4배가 되게 줄인다.
  element.volume = Math.max(0, Math.min(1, gameVolume * .08 * (1 - distance / 800)));
  element.playbackRate = .94 + Math.random() * .12;
  element.currentTime = 0;
  element.play().catch(() => {});
  return true;
}

// B2 보스의 쇠공이 머리 위를 지나갈 때 공기를 가르는 "우웅" 소리(b2-ending.js). 파일 없이 바로 만든다:
// 대역 필터를 건 잡음이 위로 올랐다 내려가고(지나가는 도플러), 낮은 음이 같이 울렸다 가라앉는다. 가장 센 순간이 peak초에 온다.
function playB2BallWhoosh(peak = .25) {
  if (!gameAudioContext || gameAudioContext.state !== 'running' || document.hidden || gameVolume <= 0 || mainMenuActive || !gameStarted) return;
  if (gameAudioEffects.size >= 6) return;
  const ctx = gameAudioContext, now = ctx.currentTime, length = peak + .55;
  const noiseBuffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
  const samples = noiseBuffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 1.4;
  band.frequency.setValueAtTime(260, now);
  band.frequency.exponentialRampToValueAtTime(900, now + peak);
  band.frequency.exponentialRampToValueAtTime(220, now + length);
  const hum = ctx.createOscillator();
  hum.type = 'sine';
  hum.frequency.setValueAtTime(110, now);
  hum.frequency.exponentialRampToValueAtTime(150, now + peak);
  hum.frequency.exponentialRampToValueAtTime(70, now + length);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(.9, now + peak);
  gain.gain.exponentialRampToValueAtTime(.0001, now + length);
  const humGain = ctx.createGain();
  humGain.gain.value = .35;
  noise.connect(band).connect(gain);
  hum.connect(humGain).connect(gain);
  gain.connect(gameAudioMaster);
  noise.start(now);
  hum.start(now);
  noise.stop(now + length);
  hum.stop(now + length);
  noise.onended = () => { gain.disconnect(); band.disconnect(); humGain.disconnect(); };
}

// B2 보스가 쇠공을 던지기 전 준비 동작(팔을 뻗고 떠는 때)이 시작될 때 나는 쇠 삐걱이는 소리(b2-ending.js).
const b2BossWindupElement = new Audio('assets/audio/b2-boss-windup.mp3');
b2BossWindupElement.preload = 'auto';

function playB2BossWindup() {
  if (document.hidden || gameVolume <= 0 || mainMenuActive || !gameStarted) return;
  b2BossWindupElement.volume = Math.max(0, Math.min(1, gameVolume));
  b2BossWindupElement.playbackRate = 1.3; // 전조 알림답게 조금 빠르고 날카롭게
  b2BossWindupElement.currentTime = 0;
  b2BossWindupElement.play().catch(() => {});
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
  hallucinationDevouredElement.currentTime = .3;
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

// 붉은 눈이 가까이 다가간 수호 앞에서 깨질 때(sanity.js의 shatterRedEye)의 효과음: 두 파일 중 하나를 무작위로 들려준다.
// dragon 파일은 소리를 줄이고 피치를 살짝 높여서(preservesPitch를 꺼 재생 속도와 함께 올린다), universfield 파일은 1초까지만 재생한다.
const redEyeBreakDragonElement = new Audio('assets/audio/red-eye-break-dragon.mp3');
const redEyeBreakUniversElement = new Audio('assets/audio/red-eye-break-universfield.mp3');
for (const element of [redEyeBreakDragonElement, redEyeBreakUniversElement]) element.preload = 'auto';
redEyeBreakDragonElement.preservesPitch = false;
redEyeBreakDragonElement.playbackRate = 1.12;
const redEyeBreakDragonVolume = .35;
const redEyeBreakUniversVolume = .6;
// 파일 앞의 무음·도입부를 건너뛰어 눈이 깨지는 순간에 맞춘다(초). 아직 느리면 값을 키운다.
const redEyeBreakDragonStart = .15;
const redEyeBreakUniversStart = .15;
const redEyeBreakUniversMs = 1000;
let redEyeBreakUniversTimer = null;

function playRedEyeBreakSound() {
  if (document.hidden || gameVolume <= 0 || mainMenuActive || !gameStarted || restoringProgress) return;
  if (Math.random() < .5) {
    redEyeBreakDragonElement.volume = Math.max(0, Math.min(1, gameVolume * redEyeBreakDragonVolume));
    redEyeBreakDragonElement.currentTime = redEyeBreakDragonStart;
    redEyeBreakDragonElement.play().catch(() => {});
    return;
  }
  clearTimeout(redEyeBreakUniversTimer);
  redEyeBreakUniversElement.volume = Math.max(0, Math.min(1, gameVolume * redEyeBreakUniversVolume));
  redEyeBreakUniversElement.currentTime = redEyeBreakUniversStart;
  redEyeBreakUniversElement.play().catch(() => {});
  redEyeBreakUniversTimer = setTimeout(() => redEyeBreakUniversElement.pause(), redEyeBreakUniversMs);
}

function pauseGameAudio() {
  gameAudioRoomKey = '';
  gameAudioRoomElapsed = 0;
  auditoryHallucinationRoom = '';
  auditoryHallucinationElapsed = 0;
  sanityMusicElement.pause();
  sanityMusicGain = sanityMusicTarget = 0;
  sanityMusicElement.volume = 0;
  if (document.hidden || mainMenuActive || !gameStarted) for (const element of [hallucinationSoundElement, ...hallucinationSightingElements, hallucinationDevouredElement, redEyeBreakDragonElement, redEyeBreakUniversElement, doorPryElement, b2PhaseDoorElement, b2BossStepElement, ...robotStepElements, b2BossWindupElement, b2SirenElement]) element.pause();
  if (!gameAudioContext) return;
  for (const sound of gameAudioAmbience.values()) stopGameAudioSource(sound);
  gameAudioAmbience.clear();
  for (const sound of gameAudioEffects) if (sound.name !== 'ui' || document.hidden) stopGameAudioSource(sound);
}

function stopGameSound(name) {
  for (const sound of gameAudioEffects) if (sound.name === name) stopGameAudioSource(sound);
}

// 정신력이 바뀌어도 현재 곡을 유지하고, 곡이 끝났을 때만 직전 곡을 제외해 고른다.
function updateSanityMusic(target, elapsed) {
  sanityMusicTarget = target;
  sanityMusicGain += (target - sanityMusicGain) * Math.min(1, elapsed / 300);
  if (!target && sanityMusicGain < .001) {
    sanityMusicGain = 0;
    sanityMusicElement.pause();
  }
  sanityMusicElement.volume = Math.max(0, Math.min(1, gameVolume)) * sanityMusicGain;
  if (target && sanityMusicElement.paused) {
    if (sanityMusicElement.ended) nextSanityMusicTrack();
    sanityMusicElement.play().catch(() => {});
  }
}

function updateGameAudio(elapsed = step) {
  if (!gameAudioContext || gameAudioContext.state !== 'running') return;
  refreshGameAudioVolume();
  if (document.hidden || mainMenuActive || !gameStarted) return pauseGameAudio();
  const roof = !selectingFloor && currentSceneFloor === 18;
  const lit = selectingFloor ? !buildingBlackout : floorHasLighting(currentSceneFloor) && world.dataset.dark !== 'true';
  // B1 방재 관제실은 CCTV 컷씬의 지진부터 소름 끼치는 배경음(cctv-bgm)으로 바뀌고, 처음 CCTV를 켜 보는 동안에는 기괴하고
  // 음산한 배경음(cctv-dread)이 흐른다(js/scene/cctv-event.js).
  const dread = !selectingFloor && cctvDreadPlaying();
  const haunted = !selectingFloor && cctvBgmPlaying();
  const profile = gameAudioRoomProfile();
  const powered = floorHasPower(currentSceneFloor);
  const roomTone = profile === 'restroom' ? 'plumbing' : powered && profile === 'server' ? 'server-room' :
    powered && profile === 'service' ? 'electrical-room' : lit && profile === 'hall' ? 'hall-room' : null;
  const background = dread ? 'cctv-dread' : haunted ? 'cctv-bgm' : roof ? 'wind' : roomTone || (lit ? 'office' : 'dark');
  const moving = selectingFloor && cabinCarIndex !== null && elevatorCars[cabinCarIndex].travelling && elevatorHasPower();
  const wanted = new Map([[background, dread ? .42 : haunted ? .34 : roof ? .23 : lit ? .18 : .14]]);
  const fear = sanityTierOf(sanity);
  const musicAllowed = !dread && !haunted && !openingActive && !blackoutSceneActive && !storySceneActive && !cctvSceneActive && !b2CaptureActive && !solarRestoreActive && !playerCaught && !hallucinationCaught;
  updateAuditoryHallucinations(elapsed, musicAllowed && !inB2MainRoom() && fear >= 1 && !hallucinationEventBlocked() && !hallucinationMode &&
    guardPatrol.mode !== 'chase' && roamer.mode !== 'chase' && b2Ending.phase !== 'running');
  const roomKey = `${room}:${dynamicFloorId}:${currentSceneFloor}:${selectingFloor}`;
  if (roomKey !== gameAudioRoomKey) {
    gameAudioRoomKey = roomKey;
    gameAudioRoomElapsed = 0;
    gameAudioRoomNext = 9000 + Math.random() * 9000;
  }
  if (!musicAllowed) gameAudioRoomElapsed = 0;
  else if (!selectingFloor) gameAudioRoomElapsed += Math.min(elapsed, 100);
  if (musicAllowed && !selectingFloor && gameAudioRoomElapsed >= gameAudioRoomNext) {
    if (profile === 'restroom' || profile === 'service') {
      const sink = profile === 'restroom' && currentDoors.find(door => door.name === '세면대 거울');
      const x = sink ? sink.x + sink.width / 2 : Math.max(32, Math.min(worldWidth - 32, body.position.x + (Math.random() < .5 ? -220 : 220)));
      playGameSound(profile === 'restroom' ? 'water-drop' : 'pipe-tick', { x });
    }
    gameAudioRoomElapsed = 0;
    gameAudioRoomNext = 11000 + Math.random() * 13000;
  }
  updateSanityMusic(musicAllowed && !inB2MainRoom() ? fear * .06 : 0, elapsed); // B2 메인 서버실에서는 공포 음악이 나오지 않는다
  if (moving) wanted.set('motor', .25);
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
