// 17층 사무실(고정 장면): 배경, 조명 스위치, 사무실 출입문, 켜진 컴퓨터.
// 테두리(outline)는 모니터 상자(#office-computer)에서 3px 띄운다.
const officeComputer = { type: 'computer', x: 612, y: 392, width: 88, element: document.getElementById('office-computer'),
  outline: [609, 389, 94, 70] };

function setOfficeComputerPower(power) {
  officeComputer.element.dataset.power = power;
  officeComputer.element.setAttribute('aria-label', power === 'off' ? '꺼진 컴퓨터' : power === 'on' ? '켜진 컴퓨터' : '종료 중인 컴퓨터');
}

// 17층 전력이 끊기면 켜 둔 컴퓨터도 꺼진다. 전력이 돌아와도 E로 다시 켜기 전까지는 꺼진 채로 둔다.
function refreshOfficeComputerPower() {
  if (!floorHasPower(17) && officeComputer.element.dataset.power !== 'off') setOfficeComputerPower('off');
}

const officeBackground = document.getElementById('office-background');
setPowerBackground(officeBackground, 'assets/background/floor17/office-interior-aligned-finished.png');
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
  width: `${officeWidth}px`, height: '760px',
  left: '0px', top: '0px',
});
document.getElementById('opening-chair-front').style.backgroundSize = `${officeWidth}px ${724 * floorY / 504}px`;
// 배경에 그려진 책상 전체를 빈 벽으로 지운 뒤, 같은 영역의 스프라이트 한 장만 교체한다.
const officeDeskBox = {
  left: `${406 * officeWidth / 2196}px`, top: `${320 * floorY / 504}px`,
  width: `${368 * officeWidth / 2196}px`, height: `${184 * floorY / 504}px`,
};
const officeDeskBackdrop = new Image();
officeDeskBackdrop.src = 'assets/background/floor17/workstation-empty.png';
officeDeskBackdrop.className = 'office-desk-backdrop';
officeDeskBackdrop.alt = '';
officeDeskBackdrop.draggable = false;
Object.assign(officeDeskBackdrop.style, officeDeskBox);
const officeWorkstation = document.createElement('div');
officeWorkstation.id = 'office-workstation';
officeWorkstation.className = 'floor-prop';
Object.assign(officeWorkstation.style, officeDeskBox);
const officeDeskImage = new Image();
officeDeskImage.src = 'assets/objects/floor17/workstation.png';
officeDeskImage.alt = '';
officeDeskImage.draggable = false;
officeWorkstation.append(officeDeskImage);
officeBackground.after(officeDeskBackdrop);
officeDeskBackdrop.after(officeWorkstation);
new Image().src = 'assets/objects/floor17/workstation-fear.png';
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

const officeCharger = { ...phoneChargerFixture(744), type: 'inspect', room: 'office', scene: 'office', floor: 17,
  element: document.createElement('div') };
officeCharger.element.className = 'fixture phone-charger';
officeCharger.element.dataset.fixed = 'true';
officeCharger.element.setAttribute('role', 'img');
officeCharger.element.setAttribute('aria-label', officeCharger.name);
Object.assign(officeCharger.element.style, { left: `${officeCharger.x}px`, top: `${officeCharger.y}px`,
  width: `${officeCharger.width}px`, height: `${officeCharger.height}px` });
officeCharger.element.style.setProperty('--phone-top', `${officeCharger.phoneTop}px`);
world.insertBefore(officeCharger.element, sprite);
officeDoors.push(officeCharger);

// 출입증 쌔비기 목표가 시작되면(story-badge-seen) 옆자리 책상(왼쪽, 컴퓨터 모니터 왼쪽 구석)에 생기는 포스트잇. 크기는 24px(처음의 절반).
// 보이기·숨기기는 objective.js의 refreshObjective가 맡고, 숨겨진 동안은 조사 대상에서도 빠진다(interaction.js).
const officePostit = { name: '포스트잇', type: 'inspect', room: 'office', x: 264, y: 444, width: 24,
  message: "'나는 커피를 살 때마다 사원증을 두고오는 습관이 있다!!\n항상 확인하고 이제부턴 잊어버리지 말자!' 라고 적혀있다." };
officePostit.element = document.createElement('div');
officePostit.element.className = 'office-postit';
officePostit.element.setAttribute('role', 'img');
officePostit.element.setAttribute('aria-label', '포스트잇');
officePostit.element.hidden = true;
Object.assign(officePostit.element.style, { left: `${officePostit.x}px`, top: `${officePostit.y}px`, width: `${officePostit.width}px`, height: '26px' });
world.insertBefore(officePostit.element, sprite);
