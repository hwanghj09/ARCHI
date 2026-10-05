// 17층 사무실(고정 장면): 배경, 조명 스위치, 사무실 출입문, 켜진 컴퓨터.
const officeComputer = { type: 'computer', x: 612, y: 392, width: 88, element: document.getElementById('office-computer') };

const officeBackground = document.getElementById('office-background');
const lightSwitch = document.getElementById('floor17-light-switch');
const lights = document.getElementById('floor17-lights');
const floor17LightState = document.getElementById('floor17-light-state');
lights.addEventListener('change', () => {
  if (transitioning || selectingFloor || usingComputer || currentSceneFloor !== 17) {
    lights.checked = world.dataset.lights === 'on';
    return;
  }
  // 17층도 다른 층과 같이 옥상 태양광 비상 전원을 받아야 조명이 들어온다 — 지금 전력이 안 와 있으면
  // 스위치를 눌러도 켜지지 않는다(끄는 건 언제든 된다).
  if (lights.checked && poweredFloor !== 17) {
    lights.checked = false;
    showStatus('지금 17층엔 전력이 없다. 옥상 태양광 비상 전력 장치에서 먼저 이 층을 켜야 한다.');
    return;
  }
  world.dataset.lights = lights.checked ? 'on' : 'off';
  floor17LightState.value = lights.checked ? '조명 켜짐' : '조명 꺼짐';
});

// 옥상에서 다른 층으로 전력을 돌리면(또는 꺼 버리면) 17층 조명도 따라 꺼진다.
function syncFloor17Power() {
  if (poweredFloor === 17 || world.dataset.lights !== 'on') return;
  world.dataset.lights = 'off';
  lights.checked = false;
  floor17LightState.value = '조명 꺼짐';
}
// The generated office floor starts at source y=504; align it with the physics floor.
Object.assign(officeBackground.style, {
  width: `${officeWidth}px`, height: `${724 * floorY / 504}px`,
  left: '0px', top: '0px',
});
// 복도 그림에서 사무실 유리벽은 x=32..1555이고 문은 그 왼쪽에서 39% 지점이다. 방 안 배경
// (office-interior-aligned.png)도 문을 같은 비율 위치에 두어, 문 양옆 공간과 켜진 책상의 방향이 복도에서 본 것과 같다.
const officeDoors = [
  { name: '사무실', room: 'corridor', x: 580, y: 236, width: 128 },
  { name: '복도', room: 'office', x: 895, y: 250, width: 144 },
];
for (const door of officeDoors) {
  door.type = 'office';
  door.element = document.createElement('div');
  door.element.className = 'office-door';
  door.element.dataset.room = door.room;
  door.element.setAttribute('role', 'img');
  door.element.setAttribute('aria-label', `${door.name} 출입구`);
  Object.assign(door.element.style, {
    left: `${door.x}px`, top: `${door.y}px`, width: `${door.width}px`, height: `${floorY - door.y}px`,
  });
  world.insertBefore(door.element, sprite);
}
