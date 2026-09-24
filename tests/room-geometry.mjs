import assert from 'node:assert/strict';

// World-space box of an absolutely positioned scene element.
export const box = element => ({ x: parseFloat(element.style.left), y: parseFloat(element.style.top), width: parseFloat(element.style.width) });

// Share of the room's wall (door excluded) that lies left of the door. It must match between the corridor
// front and the room interior, so space beside a door outside is also beside it inside, on the same side.
const leftWallShare = (room, door) => (door.x - room.x) / (room.width - door.width);

export function assertMirroredDoor(outsideRoom, outsideDoor, insideWidth, insideDoor, label) {
  const outside = leftWallShare(outsideRoom, outsideDoor);
  const inside = leftWallShare({ x: 32, width: insideWidth - 64 }, insideDoor);
  assert(Math.abs(outside - inside) < .01,
    `${label}: door is at ${outside.toFixed(3)} of the wall outside but ${inside.toFixed(3)} inside`);
}

// Corridor front and door of a room drawn by the dynamic scene (15F/16F).
export const roomFront = (page, name) => page.locator('#dynamic-scene').evaluate((scene, name) => {
  const box = element => ({ x: parseFloat(element.style.left), y: parseFloat(element.style.top), width: parseFloat(element.style.width) });
  const room = [...scene.querySelectorAll('.floor-room')].find(element => element.textContent === name);
  // Locked doors are labelled `${name} 출입문 · 잠김`.
  const door = [...scene.querySelectorAll('.room-door')].find(element =>
    [`${name} 출입문`, `${name} 출입문 · 잠김`].includes(element.getAttribute('aria-label')));
  return { room: box(room), door: box(door) };
}, name);

export const exitDoor = page => page.locator('#dynamic-scene .room-door').evaluate(box);

export const worldWidth = async page => parseFloat(await page.locator('#world').evaluate(element => element.style.width));
