import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

// 원곡과 다섯 변주를 직접 작곡·합성한다. 외부 샘플이나 라이브러리를 쓰지 않는다.
const rate = 24000, seconds = 48, length = rate * seconds;
const frequency = note => 440 * 2 ** ((note - 69) / 12);
const sine = (hz, time) => Math.sin(2 * Math.PI * hz * time);

const tracks = [
  { file: 'sanity-dread', title: '빈 사무실', sound: 'bell', seed: 271828,
    chords: [[31, 38, 44, 58], [27, 34, 40, 54], [26, 32, 38, 53], [31, 37, 46, 56]],
    melody: [[1.7, 74], [4.9, 75], [8.4, 70], [10.6, 69], [14.2, 70], [17.8, 71], [21.1, 66], [23.4, 63],
      [26.8, 68], [30.2, 74], [33.5, 75], [35.6, 73], [38.3, 70], [41.7, 68], [44.2, 69], [46.8, 67]] },
  { file: 'sanity-musicbox', title: '꺼진 오르골', sound: 'pluck', seed: 1706,
    chords: [[33, 40, 48, 59], [29, 36, 44, 56], [30, 36, 45, 57], [28, 35, 43, 58]],
    melody: [[2, 81], [3.2, 88], [5.6, 84], [8.2, 82], [14, 80], [15.1, 87], [18, 83], [20.8, 79],
      [26, 81], [27.2, 87], [29.6, 84], [32.4, 82], [38, 80], [39.2, 86], [42.2, 83], [44.8, 78]] },
  { file: 'sanity-vent', title: '환기구의 숨', sound: 'reverse', seed: 4311,
    chords: [[28, 35, 42, 53], [28, 34, 41, 52], [25, 32, 39, 51], [28, 35, 43, 54]],
    melody: [[4, 65], [12.5, 66], [22, 60], [32.5, 61], [40, 65]] },
  { file: 'sanity-pulse', title: '벽 너머의 박동', sound: 'metal', seed: 8077,
    chords: [[26, 33, 39, 50], [26, 32, 38, 49], [23, 30, 36, 48], [26, 33, 40, 51]],
    melody: [[5.8, 74], [16.1, 73], [28.4, 68], [39.7, 69], [44.3, 74]] },
  { file: 'sanity-strings', title: '닫힌 복도', sound: 'bow', seed: 12012,
    chords: [[30, 37, 44, 57], [27, 34, 41, 56], [29, 35, 42, 53], [30, 36, 43, 55]],
    melody: [[1, 69], [8, 70], [14.5, 66], [21, 65], [27, 68], [34.5, 69], [41, 63]] },
  { file: 'sanity-signal', title: '빈 층의 신호', sound: 'metal', seed: 90001,
    chords: [[32, 39, 45, 56], [29, 36, 42, 53], [26, 33, 40, 52], [32, 38, 45, 55]],
    melody: [[2.5, 76], [3.3, 77], [10.4, 70], [14.8, 73], [15.7, 74], [23, 67], [27.1, 75], [28, 76],
      [35.2, 69], [39.4, 72], [40.3, 73], [46, 66]] },
];

await mkdir(new URL('../assets/audio/', import.meta.url), { recursive: true });
for (const track of tracks) await renderTrack(track);

async function renderTrack(track) {
  const left = new Float64Array(length), right = new Float64Array(length);
  function voice(start, duration, note, level, pan, sound = 'pad') {
    const hz = frequency(note);
    const offset = Math.round(start * rate), count = Math.round(duration * rate);
    for (let i = 0; i < count; i++) {
      const time = i / rate;
      const struck = ['bell', 'pluck', 'metal'].includes(sound);
      const age = sound === 'reverse' ? duration - time : time;
      const envelope = struck || sound === 'reverse' ? (1 - Math.exp(-age * 25)) * Math.exp(-age * (sound === 'pluck' ? 1.9 : .85)) * Math.min(1, (duration - age) / .4) :
        Math.sin(Math.PI * time / duration) ** 2;
      let tone;
      if (sound === 'bell' || sound === 'reverse') tone = sine(hz, time) + .3 * sine(hz * 2.013, time) * Math.exp(-age) + .12 * sine(hz * 4.071, time) * Math.exp(-age * 2);
      else if (sound === 'pluck') tone = sine(hz, time) + .45 * sine(hz * 3.004, time) * Math.exp(-time * 3) + .16 * sine(hz * 6.03, time) * Math.exp(-time * 5);
      else if (sound === 'metal') tone = sine(hz, time) + .3 * sine(hz * 1.414, time) * Math.exp(-time * .5) + .2 * sine(hz * 2.76, time) * Math.exp(-time);
      else if (sound === 'bow') tone = .6 * Math.sin(2 * Math.PI * hz * time + .018 * sine(4.2, time)) + .25 * sine(hz * 1.006, time) + .18 * sine(hz * 2.003, time) + .08 * sine(hz * 3, time);
      else if (sound === 'pulse') tone = sine(hz, time) + .18 * sine(hz * 2, time);
      else tone = .65 * sine(hz, time) + .22 * sine(hz * 1.004, time) + .12 * sine(hz * 2, time);
      const breath = struck ? 1 : .82 + .18 * sine(.13, time);
      const sample = tone * envelope * breath * level;
      const index = ((offset + i) % length + length) % length;
      left[index] += sample * Math.sqrt((1 - pan) / 2);
      right[index] += sample * Math.sqrt((1 + pan) / 2);
    }
  }

  track.chords.forEach((chord, phrase) => chord.forEach((note, part) =>
    voice(phrase * 12 - 1, 14, note, part < 2 ? .18 : .07, (part % 2 ? 1 : -1) * .45, track.sound === 'bow' ? 'bow' : 'pad')));
  track.melody.forEach(([at, note], index) => {
    const pan = index % 2 ? .35 : -.35;
    const duration = track.sound === 'bow' ? 9 : track.sound === 'reverse' ? 8 : 5.5;
    voice(at, duration, note, .075, pan, track.sound);
    voice(at + .83, duration, note, .025, -pan, track.sound);
    voice(at + 1.91, duration, note, .012, pan, track.sound);
  });
  if (track.sound === 'bell') for (const [at, note] of [[7.3, 87], [20.5, 82], [34.1, 85], [43.6, 86]]) voice(at, 7, note, .012, -.6, 'bell');
  if (track.file === 'sanity-pulse') for (let beat = 0; beat < 16; beat++) {
    const at = beat * 3 + .4 + .1 * Math.sin(beat * 1.7);
    voice(at, .34, 31, .32, -.1, 'pulse');
    voice(at + .29, .26, 29, .2, .1, 'pulse');
  }

  let seed = track.seed, air = 0, breathNoise = 0;
  for (let i = 0; i < length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    air += .004 * (noise - air);
    breathNoise += .08 * (noise - breathNoise);
    const t = i / rate;
    const breath = track.file === 'sanity-vent' ? breathNoise * .18 * (.5 + .5 * sine(1 / 8, t)) ** 3 : 0;
    const sample = air * .05 * Math.sin(Math.PI * i / length) ** 2 + breath;
    // 서로 다른 곡 사이에서도 파형이 튀지 않도록 양끝을 짧게 페이드한다.
    const edge = Math.min(1, t / .8, (seconds - t) / 1.2);
    left[i] = (left[i] + sample) * edge;
    right[i] = (right[i] + sample) * edge;
  }
  let peak = 0, rawEnergy = 0;
  for (let i = 0; i < length; i++) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
    rawEnergy += left[i] ** 2 + right[i] ** 2;
  }
  const scale = Math.min(.65 / peak, .14 / Math.sqrt(rawEnergy / (length * 2)));
  let energy = 0;
  const pcm = Buffer.alloc(length * 4);
  for (let i = 0; i < length; i++) {
    const l = left[i] * scale, r = right[i] * scale;
    assert(Number.isFinite(l) && Number.isFinite(r));
    energy += l * l + r * r;
    pcm.writeInt16LE(Math.round(l * 32767), i * 4);
    pcm.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
  }
  const rms = Math.sqrt(energy / (length * 2));
  const seam = Math.max(Math.abs(left[0] - left[length - 1]), Math.abs(right[0] - right[length - 1])) * scale;
  assert(rms > .05 && rms < .3, `Unexpected music level: ${rms}`);
  assert(seam < .005, `Audible loop seam: ${seam}`);
  const header = Buffer.alloc(44);
  header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22);
  header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 4, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  const target = new URL(`../assets/audio/${track.file}.wav`, import.meta.url);
  await writeFile(target, Buffer.concat([header, pcm]));
  console.log(`${track.title}: ${seconds}s stereo, peak ${(peak * scale).toFixed(3)}, RMS ${rms.toFixed(3)}, seam ${seam.toFixed(6)}.`);
}
