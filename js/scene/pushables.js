// 밀어서 옮기는 상자(movables의 pushable, 16층 CU 진라면 박스). 정적 충돌체를 직접 옮긴다: 플레이어가 옆에서 상자에 막힌 채
// 그쪽으로 걸으면 상자가 플레이어 이동 속도의 factor배만큼 같은 방향으로 밀리고, 플레이어도 그 속도로 함께 움직인다.
// 밀리는 범위는 minX~maxX(상자 중심 x)로 막혀 있고, 끝에 닿으면 더 밀리지 않는다. 위에 올라서면(발이 윗면 근처) 밀리지 않고
// 정적 충돌체라 그대로 딛고 설 수 있다. 상자 위치는 장면을 다시 그릴 때(층·방 이동) 처음으로 돌아간다.
const PUSH_CONTACT_GAP = 2.5;

function pushableOf(part) { return part.pushable ? part : null; }

// 지금 플레이어가 direction(-1/1) 쪽으로 이 상자에 막혀 있는가.
function playerPressesPart(part, direction) {
  const top = part.body.position.y - part.height / 2;
  const sideBySide = body.bounds.max.y > top + 6 && body.bounds.min.y < top + part.height;
  if (!direction || !sideBySide) return false;
  const gap = direction === 1 ? part.body.bounds.min.x - body.bounds.max.x : body.bounds.min.x - part.body.bounds.max.x;
  const ahead = direction === 1 ? body.position.x < part.body.position.x : body.position.x > part.body.position.x;
  return ahead && gap > -PUSH_CONTACT_GAP && gap < PUSH_CONTACT_GAP;
}

// 이번 걸음에서 플레이어가 가려던 거리(velocityX)를 받아 상자를 밀고, 플레이어가 실제로 갈 거리를 돌려준다.
function pushPushables(direction, velocityX) {
  for (const part of movingParts) {
    if (!pushableOf(part) || !playerPressesPart(part, direction)) continue;
    const { factor, minX, maxX } = part.pushable;
    const x = Math.max(minX, Math.min(maxX, part.body.position.x + velocityX * factor));
    Body.setPosition(part.body, { x, y: part.body.position.y });
    return velocityX * factor;
  }
  return velocityX;
}

// 플레이어가 그 상자 위(발이 윗면)에 서 있는가: 16층 선반 항불안제의 손 닿는 조건(상자를 어디까지 밀었는지는 상관없다).
function playerOnPushable(name) {
  return movingParts.some(part => pushableOf(part) && part.name === name &&
    Math.abs(body.bounds.max.y - (part.body.position.y - part.height / 2)) < 3 &&
    Math.abs(body.position.x - part.body.position.x) < part.width / 2 + 20);
}
