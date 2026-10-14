import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

// 「빈 사무실」: 48초 순환곡. G 중심의 불안한 화성, 유리 종 선율, 먼 금속성 울림.
const rate = 24000, seconds = 48, length = rate * seconds;
const left = new Float64Array(length), right = new Float64Array(length);
const frequency = note => 440 * 2 ** ((note - 69) / 12);
const sine = (hz, time) => Math.sin(2 * Math.PI * hz * time);

function voice(start, duration, note, level, pan, bell = false) {
  const hz = frequency(note);
  const offset = Math.round(start * rate), count = Math.round(duration * rate);
  for (let i = 0; i < count; i++) {
    const time = i / rate;
    const envelope = bell ? (1 - Math.exp(-time * 25)) * Math.exp(-time * 1.15) * Math.min(1, (duration - time) / .4) :
      Math.sin(Math.PI * time / duration) ** 2;
    const tone = bell ? sine(hz, time) + .3 * sine(hz * 2.013, time) * Math.exp(-time) + .12 * sine(hz * 4.071, time) * Math.exp(-time * 2) :
      .65 * sine(hz, time) + .22 * sine(hz * 1.004, time) + .12 * sine(hz * 2, time);
    const breath = bell ? 1 : .82 + .18 * sine(.13, time);
    const sample = tone * envelope * breath * level;
    const index = ((offset + i) % length + length) % length;
    left[index] += sample * Math.sqrt((1 - pan) / 2);
    right[index] += sample * Math.sqrt((1 + pan) / 2);
  }
}

// 원본 악보(MIDI 음 번호): Gm(add b9) → Ebm → Ddim → Gm/Db.
const chords = [[31, 38, 44, 58], [27, 34, 40, 54], [26, 32, 38, 53], [31, 37, 46, 56]];
chords.forEach((chord, phrase) => chord.forEach((note, part) =>
  voice(phrase * 12 - 1, 14, note, part < 2 ? .18 : .07, (part % 2 ? 1 : -1) * .45)));

const melody = [[1.7, 74], [4.9, 75], [8.4, 70], [10.6, 69], [14.2, 70], [17.8, 71], [21.1, 66], [23.4, 63],
  [26.8, 68], [30.2, 74], [33.5, 75], [35.6, 73], [38.3, 70], [41.7, 68], [44.2, 69], [46.8, 67]];
melody.forEach(([at, note], index) => {
  const pan = index % 2 ? .35 : -.35;
  voice(at, 5.5, note, .075, pan, true);
  voice(at + .83, 5.5, note, .025, -pan, true);
  voice(at + 1.91, 5.5, note, .012, pan, true);
});
for (const [at, note] of [[7.3, 87], [20.5, 82], [34.1, 85], [43.6, 86]]) voice(at, 7, note, .012, -.6, true);

// 얇은 공기 소리만 더한다. 양끝에서 사라져 반복 때 잡음이 튀지 않는다.
let seed = 271828, air = 0;
for (let i = 0; i < length; i++) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  air += .004 * (seed / 2147483648 - 1 - air);
  const sample = air * .05 * Math.sin(Math.PI * i / length) ** 2;
  left[i] += sample; right[i] += sample;
}
let peak = 0;
for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
const scale = .65 / peak;
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
const target = new URL('../assets/audio/sanity-dread.wav', import.meta.url);
await mkdir(new URL('../assets/audio/', import.meta.url), { recursive: true });
await writeFile(target, Buffer.concat([header, pcm]));
console.log(`Created ${seconds}s stereo BGM: peak 0.65, RMS ${rms.toFixed(3)}, loop seam ${seam.toFixed(6)}.`);
