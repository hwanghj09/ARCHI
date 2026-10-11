// 근접 테두리: 가까운 상호작용 대상 하나를 #interaction-outline 한 장으로 감싼다. 판정 범위(x·width)는 그대로 두고
// 눈에 보이는 물체에 맞춘 상자를 따로 쓴다. 대상에 outline [x, y, width, height](월드 좌표)가 있으면 그 상자이고,
// 없으면 대상 요소의 상자다. 소품·태양광 장치는 scene-builder가 그림의 불투명 상자(PROP_OUTLINES)로 outline을 채우고,
// 배경 그림에 그려진 문·설비는 층 데이터의 outline(방 문은 doorOutline, 방 안 출구는 exitOutline)으로 그림에 맞춘다.
const interactionOutline = document.getElementById('interaction-outline');
let outlinedDoor = null;

function outlineBox(door) {
  if (door.outline) return door.outline;
  const box = door.element.getBoundingClientRect();
  const origin = world.getBoundingClientRect();
  // 컷씬 확대(cameraZoom)가 풀리는 중에도 월드 좌표로 되돌린다.
  const zoom = scale * cameraZoom;
  return [(box.left - origin.left) / zoom, (box.top - origin.top) / zoom, box.width / zoom, box.height / zoom];
}

// 소품 그림 상자: 캔버스 요소 상자(left, top, width, height) 안에서 그림이 차지하는 부분.
function spriteOutline(src, left, top, width, height) {
  const [l, t, r, b] = PROP_OUTLINES[src] || [0, 0, 1, 1];
  return [left + l * width, top + t * height, (r - l) * width, (b - t) * height];
}

function updateOutline() {
  if (outlinedDoor === nearbyDoor) return;
  outlinedDoor = nearbyDoor;
  interactionOutline.hidden = !nearbyDoor;
  if (!nearbyDoor) return;
  const [x, y, width, height] = outlineBox(nearbyDoor);
  Object.assign(interactionOutline.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });
}
