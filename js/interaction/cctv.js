// 감시 카메라(층·방 설정 cameras, B2 메인 서버실 앞 복도): 천장 카메라가 spans의 구간을 period ms마다 차례로 비춘다.
// 비추는 구간 안에 수호가 있으면 발각: guards 방의 복도 문을 잠근다(E를 누르면 lockedMessage). 처음 잠길 때 수호가 spottedLine을 혼잣말한다.
// 지금 비추는 구간의 바닥에는 옅은 빨간 띠(cctv-floor)를 깔아 시야를 보인다.
// 문은 수호가 시야에서 벗어나고 lockMs가 지나야 다시 열린다. 구간 사이의 빈틈은 사각지대다. disabledBy 물건을 챙기면
// 카메라는 꺼진 채로 그려지고 아무것도 잠그지 않는다. 장면을 새로 그릴 때마다 첫 구간부터 다시 센다.
let activeCameras = [];

function buildCameras(config, doorList) {
  const cameras = [];
  for (const camera of config.cameras || []) {
    const off = collectedItems.has(camera.disabledBy);
    const cones = off ? [] : camera.spans.map(([from, to]) => {
      const left = Math.min(camera.x, from);
      const cone = document.createElement('div');
      cone.className = 'cctv-cone';
      cone.setAttribute('aria-hidden', 'true');
      Object.assign(cone.style, { left: `${left}px`, top: `${camera.y + 24}px`, width: `${Math.max(camera.x, to) - left}px`,
        height: `${floorY - camera.y - 24}px`, clipPath: `polygon(${camera.x - left}px 0, ${from - left}px 100%, ${to - left}px 100%)` });
      const floorBand = document.createElement('div');
      floorBand.className = 'cctv-floor';
      floorBand.setAttribute('aria-hidden', 'true');
      Object.assign(floorBand.style, { left: `${from}px`, top: `${floorY - 10}px`, width: `${to - from}px` });
      cone.floorBand = floorBand;
      dynamicScene.append(cone, floorBand);
      return cone;
    });
    const element = document.createElement('div');
    element.className = 'cctv';
    element.dataset.off = String(off);
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', `${camera.name}${off ? ' · 꺼짐' : ''}`);
    Object.assign(element.style, { left: `${camera.x - 22}px`, top: `${camera.y}px` });
    // 정신력 20% 미만일 때 덧씌우는 붉은 눈(기존 감지 LED ::after와 겹치지 않게 별도 요소를 쓴다).
    const fearEye = document.createElement('span');
    fearEye.className = 'cctv-fear-eye';
    element.append(fearEye);
    dynamicScene.append(element);
    if (off) continue;
    const door = doorList.find(entry => entry.type === 'room' && entry.target === camera.guards);
    cameras.push({ ...camera, element, cones, door, elapsed: 0, span: -1, lockLeft: 0 });
  }
  return cameras;
}

function setCameraLock(camera, locked) {
  if (!camera.door) return;
  camera.door.locked = locked;
  camera.door.message = locked ? camera.lockedMessage : undefined;
  camera.door.element.setAttribute('aria-label', `${camera.door.name} 출입문${locked ? ' · 잠김' : ''}`);
}

function updateCameras() {
  for (const camera of activeCameras) {
    camera.elapsed += step;
    const span = Math.floor(camera.elapsed / camera.period) % camera.spans.length;
    if (span !== camera.span) {
      camera.span = span;
      camera.cones.forEach((cone, index) => { cone.dataset.active = cone.floorBand.dataset.active = String(index === span); });
    }
    const [from, to] = camera.spans[span];
    if (body.position.x >= from && body.position.x <= to) {
      if (camera.lockLeft <= 0) {
        setCameraLock(camera, true);
        const flag = `${camera.guards}-camera-spotted`;
        if (camera.spottedLine && !collectedItems.has(flag)) {
          collectedItems.add(flag);
          sayLine(camera.spottedLine);
        }
      }
      camera.lockLeft = camera.lockMs;
    } else if (camera.lockLeft > 0) {
      camera.lockLeft -= step;
      if (camera.lockLeft <= 0) setCameraLock(camera, false);
    }
    const alert = String(camera.lockLeft > 0);
    if (camera.element.dataset.alert !== alert) {
      camera.element.dataset.alert = alert;
      for (const cone of camera.cones) cone.dataset.alert = alert;
    }
    const fear = String(fearTier >= 4);
    if (camera.element.dataset.fear !== fear) camera.element.dataset.fear = fear;
  }
}
