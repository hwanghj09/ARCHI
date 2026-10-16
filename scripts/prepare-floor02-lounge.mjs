// imagegen 원본을 게임 좌표에 맞게 자른다. 그림 수정은 source/ 원본을 교체한 뒤 이 스크립트를 실행한다.
import sharp from 'sharp';

const background = 'assets/background/floor02/';
const objects = 'assets/objects/floor02/';
await sharp(`${background}source/lounge-wall.png`)
  .extract({ left: 0, top: 83, width: 2170, height: 533 })
  .resize(1846, 456, { fit: 'fill' })
  .extend({ bottom: 19, background: '#00000000' })
  .png().toFile(`${background}floor02-lounge-wall.png`);

for (const [name, crop, width, height] of [
  ['lounge-sofa', [106, 102, 1960, 546], 512, 152],
  ['lounge-table', [281, 283, 1611, 355], 512, 128],
  ['projector-remote', [269, 279, 1446, 271], 160, 40],
]) {
  const [left, top, cropWidth, cropHeight] = crop;
  await sharp(`${objects}source/${name}.png`)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize(width - 16, height - 16, { fit: 'contain', background: '#00000000' })
    .extend({ top: 8, bottom: 8, left: 8, right: 8, background: '#00000000' })
    .png().toFile(`${objects}${name}.png`);
}
console.log('Prepared 2F lounge wall, sofa, table and projector remote.');
