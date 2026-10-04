// 17층 사무실(고정 장면): 배경, 조명 스위치, 사무실 출입문, 켜진 컴퓨터.
// 테두리(outline)는 모니터 상자(#office-computer)에서 3px 띄운다.
const officeComputer = { type: 'computer', x: 612, y: 392, width: 88, element: document.getElementById('office-computer'),
  outline: [609, 389, 94, 70] };

function setOfficeComputerPower(power) {
  officeComputer.element.dataset.power = power;
  officeComputer.element.setAttribute('aria-label', power === 'off' ? '꺼진 컴퓨터' : power === 'on' ? '켜진 컴퓨터' : '종료 중인 컴퓨터');
}

const officeBackground = document.getElementById('office-background');
setPowerBackground(officeBackground, 'assets/background/floor17/office-interior-aligned.png');
const lightSwitch = document.getElementById('floor17-light-switch');
const lights = document.getElementById('floor17-lights');
lights.addEventListener('change', () => {
  if (transitioning || selectingFloor || usingComputer || currentSceneFloor !== 17) {
    lights.checked = world.dataset.lights === 'on';
    return;
  }
  world.dataset.lights = lights.checked ? 'on' : 'off';
  refreshBackgroundPower();
});
// The generated office floor starts at source y=504; align it with the physics floor.
Object.assign(officeBackground.style, {
  width: `${officeWidth}px`, height: `${724 * floorY / 504}px`,
  left: '0px', top: '0px',
});
document.getElementById('opening-chair-front').style.backgroundSize = `${officeWidth}px ${724 * floorY / 504}px`;
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
