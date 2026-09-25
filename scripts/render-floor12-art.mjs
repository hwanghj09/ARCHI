// 12층 배경 PNG를 만든다. 게임 월드와 1:1(가로=장면 폭, 세로 720, 바닥 y=570)로 그리므로 player.js에서 따로 정렬하지 않는다.
// 벽·문·표지판 디자인은 여기의 CSS에만 있다. 좌표는 player.js의 FLOOR12_LAYOUT / FLOOR12_ROOMS와 같아야 한다.
// 실행: node scripts/render-floor12-art.mjs  (결과: assets/background/floor12/*.png)
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const out = new URL('../assets/background/floor12/', import.meta.url);
const floorY = 570;
const height = 720;

const css = `
* { box-sizing: border-box; }
body { margin: 0; }
#scene { position: relative; height: ${height}px; overflow: hidden; background: #10151c; }
#scene > * { position: absolute; }
.floor { background: #12171d; border-top: 2px solid #4f6b7d; }
.boundary { background: #172126; border-inline: 4px solid #2b383e; }
.floor-room { top: 118px; height: 452px; border: 6px solid #2a363b; border-bottom: 0; background: linear-gradient(#172025, #11181b); }
.floor-room::before { content: ''; position: absolute; top: 34px; left: 28px; right: 28px; height: 190px; border: 5px solid #2f3d43; background: radial-gradient(circle, #c9b77a55 0 1.5px, transparent 2px) 0 60px / 26px 22px, linear-gradient(transparent 38%, #0b1116 38%), linear-gradient(#0c1a2b, #16273a); }
.floor-room-sign { position: absolute; top: -40px; left: 50%; transform: translateX(-50%); padding: 3px 12px; border: 2px solid #3f6478; background: #0a1319; color: #9fd0e4; font: bold 15px Arial, sans-serif; white-space: nowrap; }
.floor-number-sign { top: 150px; width: 80px; padding: 6px 0; border: 3px solid #3f6478; background: #0a1319; color: #b8e0ee; font: bold 30px Arial, sans-serif; text-align: center; }
.room-interior { inset: 0 0 150px; background: linear-gradient(#0a0e12 0 44px, #33434f 44px 50px, #1b232b 50px 400px, #2b3945 400px 404px, #161d24 404px); }
.room-interior::before { content: ''; position: absolute; top: 90px; left: 260px; right: 60px; height: 250px; border: 6px solid #3e5563; background: radial-gradient(circle, #c9b77a55 0 1.5px, transparent 2px) 0 80px / 26px 22px, linear-gradient(transparent 38%, #0b1116 38%), repeating-linear-gradient(90deg, transparent 0 236px, #2f3d43 236px 242px), linear-gradient(#0c1a2b, #16273a); }
.room-interior::after { content: ''; position: absolute; top: 44px; left: 0; right: 0; height: 10px; background: repeating-linear-gradient(90deg, transparent 0 180px, #3c4a50 180px 300px); }
.room-interior.windowless { background: linear-gradient(#0c0a09 0 44px, #26221e 44px 50px, transparent 50px), repeating-linear-gradient(90deg, #1c1916 0 200px, #151210 200px 206px); }
.room-interior.windowless::before { display: none; }
.room-door { border: 6px solid #3a4a50; border-bottom: 0; background: linear-gradient(90deg, transparent 78%, #6d7f86 78% 82%, transparent 82%), linear-gradient(#22343c, #16242a); box-shadow: inset 0 0 0 4px #121b1f; }
/* 벽: 개발실 studio, 성능 평가실 lab, 휴게실 lounge, 공용 화장실 restroom */
.floor-room.studio { border-color: #3b4f5c; background: linear-gradient(transparent 44%, #c7d3da26 44% 52%, transparent 52%), repeating-linear-gradient(90deg, #16222b 0 146px, #2d3d48 146px 152px); }
.floor-room.studio::before { top: 24px; left: 16px; right: 16px; height: 150px; border: 4px solid #3b4f5c; background: repeating-linear-gradient(90deg, transparent 0 146px, #2d3d48 146px 152px), linear-gradient(#0b1520, #13243a); }
.floor-room.studio::after { content: 'ARCHI'; position: absolute; top: 206px; left: 0; right: 0; text-align: center; font: bold 26px/1 Arial, sans-serif; letter-spacing: 18px; color: #8fb8cc55; }
.floor-room.lab { border-color: #4a5d68; background: linear-gradient(#5b1f24 0 6px, transparent 6px), repeating-linear-gradient(90deg, #1a2a33 0 108px, #3a4d58 108px 112px), linear-gradient(#10202b, #0c161d); }
.floor-room.lab::before { top: 20px; left: 12px; right: 12px; height: 300px; border: 3px solid #3a4d58; background: linear-gradient(115deg, transparent 0 30%, #9fc4d61a 30% 34%, transparent 34% 60%, #9fc4d612 60% 62%, transparent 62%), linear-gradient(#0b1822, #102130); }
.floor-room.lounge { border-color: #3c4a4a; background: repeating-linear-gradient(90deg, #1e2a2a 0 38px, #182222 38px 40px); }
.floor-room.lounge::before { top: 60px; left: 50%; right: auto; width: 150px; height: 150px; margin-left: -75px; border-radius: 50%; border: 6px solid #4a5a5a; background: radial-gradient(circle at 35% 35%, #9fc4d622, transparent 60%), #0c1519; }
.floor-room.restroom { background: linear-gradient(transparent 55%, #2c3a3f 55% 56%, transparent 56%), repeating-linear-gradient(90deg, #1d2a2e 0 46px, #172226 46px 48px), repeating-linear-gradient(#1d2a2e 0 46px, #172226 46px 48px); background-blend-mode: normal, multiply, normal; }
.floor-room.restroom::before { display: none; }
/* 문: 개발실 badge(사원증 리더기), 성능 평가실 auto(자동문·전원 없음), 휴게실 pocket(둥근 창), 화장실 metal */
.room-door.badge { border-color: #4f6573; background: linear-gradient(90deg, transparent 49%, #4f6573 49% 51%, transparent 51%), linear-gradient(105deg, #243b48 0 30%, #172a35 30%); box-shadow: inset 0 0 0 4px #0f1a20; }
.room-door.badge::after { content: ''; position: absolute; top: 110px; right: -28px; width: 14px; height: 24px; border: 2px solid #5d7280; background: linear-gradient(#11181c 0 60%, #3a1418 60%); }
.room-door.auto { border-width: 4px 4px 0; border-color: #56707e; background: linear-gradient(90deg, #9fc4d61f 0 49.5%, #56707e 49.5% 50.5%, #9fc4d61f 50.5%), linear-gradient(#152733, #0e1b24); box-shadow: inset 0 6px 0 #2a3a44; }
.room-door.auto::after { content: '전원 없음'; position: absolute; top: -26px; left: 50%; transform: translateX(-50%); padding: 1px 6px; border: 1px solid #6e2a30; background: #1a0c0e; color: #d0646c; font: bold 11px Arial, sans-serif; white-space: nowrap; }
.room-door.pocket { border-color: #5a6868; background: radial-gradient(circle at 50% 22%, #0f1b20 0 16px, #6a7a7a 16px 19px, transparent 19px), linear-gradient(90deg, transparent 80%, #8a9a9a 80% 84%, transparent 84%), linear-gradient(#3c4848, #2e3838); box-shadow: inset 0 0 0 4px #1e2626; }
.room-door.metal { border-color: #555f66; background: linear-gradient(transparent 10%, #1b2124 10% 20%, transparent 20%), linear-gradient(90deg, transparent 80%, #8e989e 80% 84%, transparent 84%), linear-gradient(#3a4146, #2a3034); box-shadow: inset 0 0 0 4px #20262a; }
`;

// 복도 방 전면과 문. 화장실은 BUILDING_CORE.restroom.
const rooms = [
  { name: 'ARCHI 개발실', x: 640, width: 900, style: 'studio', door: { x: 1030, y: 280, width: 140, style: 'badge' } },
  { name: '성능 평가실', x: 3100, width: 452, style: 'lab', door: { x: 3290, y: 260, width: 160, style: 'auto' } },
  { name: '개발자 휴게실', x: 4300, width: 640, style: 'lounge', door: { x: 4700, y: 280, width: 110, style: 'pocket' } },
  { name: '화장실', x: 3556, width: 726, style: 'restroom', door: { x: 3612, y: 210, width: 145, style: 'metal' } },
];
// 방 안 출구는 player.js exitDoorX로 계산되는 위치: 복도 문과 같은 크기, 문 양옆 벽 비율 유지.
const exitX = (room, insideWidth) => {
  const left = room.door.x - room.x;
  const right = room.x + room.width - room.door.x - room.door.width;
  return Math.round(32 + (insideWidth - 64 - room.door.width) * left / (left + right));
};
const interiors = [
  { file: 'dev', room: rooms[0], width: 3600 },
  { file: 'lab', room: rooms[1], width: 1808, windowless: true },
  { file: 'lounge', room: rooms[2], width: 2560 },
];

const box = (className, x, y, width, h, content = '') =>
  `<div class="${className}" style="left:${x}px;top:${y}px;width:${width}px;height:${h}px">${content}</div>`;
const base = width => box('floor', 0, floorY, width, 150) + box('boundary', 0, 0, 32, height) + box('boundary', width - 32, 0, 32, height);
const door = ({ x, y, width, style }) => box(`room-door ${style}`, x, y, width, floorY - y);

const scenes = [
  { file: 'corridor', width: 5000, html: base(5000) +
    rooms.map(room => `<div class="floor-room ${room.style}" style="left:${room.x}px;width:${room.width}px"><span class="floor-room-sign">${room.name}</span></div>` + door(room.door)).join('') +
    `<div class="floor-number-sign" style="left:2694px">12F</div>` },
  ...interiors.map(({ file, room, width, windowless }) => ({ file, width, html: base(width) +
    `<div class="room-interior${windowless ? ' windowless' : ''}"></div>` + door({ ...room.door, x: exitX(room, width) }) })),
];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const scene of scenes) {
    const page = await browser.newPage({ viewport: { width: scene.width, height } });
    await page.setContent(`<!doctype html><meta charset="utf-8"><style>${css}</style><div id="scene" style="width:${scene.width}px">${scene.html}</div>`);
    await page.screenshot({ path: fileURLToPath(new URL(`${scene.file}.png`, out)), clip: { x: 0, y: 0, width: scene.width, height } });
    await page.close();
    console.log(`${scene.file}.png ${scene.width}x${height}`);
  }
} finally {
  await browser.close();
}
