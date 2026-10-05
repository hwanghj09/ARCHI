// 소품 근접 테두리 상자(js/scene/prop-outlines.js)를 만든다: node scripts/build-prop-outlines.mjs
// 층 데이터의 모든 소품 그림(과 옥상 태양광 장치)에서 한 칸(프레임) 안의 불투명 픽셀 상자를 재어, 칸 크기에 대한
// 비율 [왼, 위, 오른, 아래]로 적는다. 여러 칸 그림은 모든 칸을 합친 상자다. 소품 그림을 바꾸거나 새 소품을 넣으면
// 다시 돌린다. tests/interaction-outline.mjs가 파일이 그림과 맞는지 검사한다.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = new URL('../', import.meta.url);
// 이 값보다 투명한 픽셀은 그림 밖으로 친다(가장자리 반투명 잔티 무시).
const alphaThreshold = 32;
// 소품 데이터 밖에서 그리는 그림: 옥상 태양광 장치(scene-builder.js, 2칸).
const extraSprites = [['assets/objects/power/solar-supply-off-on.png', 2]];

export async function measurePropOutlines(page) {
  const sprites = await page.evaluate(() => {
    const found = new Map();
    for (const config of floorById.values()) {
      for (const prop of config.props || []) {
        found.set(prop.sprite || `assets/objects/floor-kit/${prop.file}.png`, prop.sprite ? prop.frames || 2 : 1);
      }
    }
    return [...found];
  });
  const outlines = {};
  for (const [src, frames] of [...sprites, ...extraSprites].sort(([a], [b]) => a.localeCompare(b))) {
    const data = (await readFile(new URL(src, root))).toString('base64');
    outlines[src] = await page.evaluate(async ({ data, frames, alphaThreshold }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const { naturalWidth: width, naturalHeight: height } = image;
      const canvas = document.createElement('canvas');
      Object.assign(canvas, { width, height });
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, width, height).data;
      const cell = width / frames;
      let left = cell, top = height, right = 0, bottom = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (pixels[(y * width + x) * 4 + 3] < alphaThreshold) continue;
          const cellX = x % cell;
          left = Math.min(left, cellX);
          right = Math.max(right, cellX + 1);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y + 1);
        }
      }
      const round = value => Math.round(value * 10000) / 10000;
      return [round(left / cell), round(top / height), round(right / cell), round(bottom / height)];
    }, { data, frames, alphaThreshold });
  }
  return outlines;
}

export function formatPropOutlines(outlines) {
  const lines = Object.entries(outlines).map(([src, box]) => `  '${src}': [${box.join(', ')}],`);
  return `// 생성 파일: node scripts/build-prop-outlines.mjs 로 다시 만든다(손으로 고치지 않는다).
// 소품 그림 한 칸에서 불투명 픽셀이 차지하는 상자를 칸 크기에 대한 비율 [왼, 위, 오른, 아래]로 적는다.
// 근접 테두리(js/interaction/outline.js)는 그림 캔버스 전체가 아니라 이 상자를 감싼다.
const PROP_OUTLINES = {
${lines.join('\n')}
};
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(new URL('index.html', root).href);
    const outlines = await measurePropOutlines(page);
    await writeFile(new URL('js/scene/prop-outlines.js', root), formatPropOutlines(outlines));
    console.log(`${Object.keys(outlines).length} sprite outlines written to js/scene/prop-outlines.js`);
  } finally {
    await browser.close();
  }
}
