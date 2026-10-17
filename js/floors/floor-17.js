// 17층: 확장 구역의 방(FLOOR17)과 방 내부(FLOOR17_ROOMS). 복도 자체는 world/corridor17.js의 고정 장면이다.
// 복도 벽면 범위는 service-corridor.png의 벽기둥 중심(x=3556, 4282)과 끝벽(4968) 기준이다.
const FLOOR17 = { id: 'f17', floor: 17, short: '17F', label: '17층 · 복도', header: '17F · 00:00', aria: '17층 복도', roomDoorY: 210,
  rooms: [
  { name: '화장실', target: 'f17-restroom', ...BUILDING_CORE.restroom },
  { name: '관리자 외 출입금지', target: 'f17-manager', x: 4282, width: 686,
    doorX: 4378, doorWidth: 171, doorStyle: 'metal', locked: true, unlockedBy: 'f17-manager-open',
    message: '관리자실 문이 잠겨 있다. 관리자 외 출입금지 표지와 붉은 출입 표시등이 보인다.',
    // 퍼즐 J(첫 퍼즐): 도어락 숫자 칠이 벗겨져 있어 어두우면 아무것도 안 보인다. 플래시(F)를 켜고 보면 닳은 버튼 넷(1·3·6·9)이
    // 번들거린다. 순서는 사무실 수호 책상 옆 벽 달력(office17.js): 이번 달 동그라미를 늦은 날부터 → 9631.
    code: '9631', codeMessage: '삑 소리와 함께 표시등이 초록으로 바뀐다. 관리자실 문이 열렸다.',
    codePrompt: () => phoneLightOn ?
      '플래시를 비추자 번호판에서 유난히 닳아 번들거리는 버튼 네 개가 보인다: 1 · 3 · 6 · 9. 누르는 순서는 모르겠다.' :
      '관리자실 도어락이다. 숫자 칠이 다 벗겨져 어둠 속에서는 번호판이 하나도 안 보인다. 빛이 있으면 닳은 자국이라도 보일 텐데.' },
] };
const FLOOR17_ROOMS = interiorRooms(17, [
  { id: 'f17-restroom', ...restroomInterior },
  { id: 'f17-manager', name: '관리자실', width: 1800, windowless: true,
    backgroundWallsOnly: true, backgroundImage: { src: 'assets/background/floor17/floor17-manager-finished.png', height: 760, top: 0 }, props: [
    { file: 'electrical-panel', size: [256, 512], worldWidth: 89, x: 170 },
    { file: 'office-desk', size: [512, 256], worldWidth: 252, x: 800, name: '관리자 책상',
      message: '층 관리자의 업무 일지가 펼쳐져 있다. 마지막 줄: "23:40 · 관리자 계정 비밀번호 변경됨(요청자 SYSTEM). 내가 바꾼 적 없음. 내일 보안팀에 문의." 그 아래 글씨가 급하게 휘어 있다: "도어락 번호는 달력에 적어 뒀으니 잊지 말 것."',
      surface: 'notebook', writing: [{ as: 'title', text: '업무 일지' }, '23:40 관리자 계정 비밀번호 변경됨', '요청자 SYSTEM', { as: 'rule' },
        { as: 'hand', text: '내가 바꾼 적 없음.\n내일 보안팀에 문의.', ink: 'blue' }, { as: 'hand', text: '도어락 번호는 달력에 적어 뒀으니 잊지 말 것.', ink: 'blue' }],
      caption: '층 관리자의 업무 일지다. 마지막 두 줄은 급하게 쓴 글씨다.' },
    { file: 'filing-cabinet', size: [256, 512], worldWidth: 72, x: 1180 },
    { file: 'maintenance-tool-cabinet', size: [512, 256], worldWidth: 198, x: 1540, name: '공구함', gives: 'f17-powerbank',
      message: '공구함 위칸에 완충된 보조 배터리가 꽂혀 있다. 챙겼다. 가방(Tab)에서 쓰면 휴대폰 배터리가 가득 찬다.',
      takenMessage: '공구함에는 드라이버와 절연 테이프만 남아 있다.' },
  ] },
]);
