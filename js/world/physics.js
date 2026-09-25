// Matter.js 물리 월드: 17층 복도·사무실 충돌 지형과 플레이어 몸체. 처음 장면은 17층 사무실이다.
const { Engine, Bodies, Body, Composite } = Matter;

world.style.width = `${worldWidth}px`;
world.style.height = `${worldHeight}px`;

const engine = Engine.create({ gravity: { x: 0, y: 1.5 } });
const terrain = [
  { kind: 'floor', x: 0, y: floorY, width: corridorWidth, height: 150 },
  { kind: 'boundary', x: 0, y: 0, width: 32, height: worldHeight },
  { kind: 'boundary', x: corridorWidth - 32, y: 0, width: 32, height: worldHeight },
];
const solids = terrain.map(({ kind, x, y, width, height }) => {
  const element = document.createElement('div');
  element.className = `solid ${kind}`;
  element.setAttribute('aria-hidden', 'true');
  Object.assign(element.style, {
    left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px`,
  });
  world.insertBefore(element, sprite);
  return Bodies.rectangle(x + width / 2, y + height / 2, width, height, { isStatic: true });
});
// Start in front of the lit monitor in the office background.
const body = Bodies.rectangle(officeComputer.x + officeComputer.width / 2, floorY - 81, 40, 162, {
  inertia: Infinity, friction: 0, frictionStatic: 0, frictionAir: 0, restitution: 0,
});
const officeSolids = [
  Bodies.rectangle(officeWidth / 2, floorY + 75, officeWidth, 150, { isStatic: true }),
  Bodies.rectangle(16, worldHeight / 2, 32, worldHeight, { isStatic: true }),
  Bodies.rectangle(officeWidth - 16, worldHeight / 2, 32, worldHeight, { isStatic: true }),
];
Composite.add(engine.world, [...officeSolids, body]);
let currentTerrain = officeSolids;
let currentDoors = doors;
