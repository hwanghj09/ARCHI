// 13층 보안 자료실(f13-secure, 장비 검증실 안쪽): 전력을 켜는 것이 늘 정답은 아니라는 퍼즐.
// 연결문은 전자 잠금이라 13층에 태양광 전력이 들어와야 열린다. 그런데 전력이 들어온 채 안에 있으면 CCTV가 감지해
// 보안 셔터를 내린다(f13-vault-shutter, 저장된다). 전력이 들어와 있는 동안 크랭크는 전자 잠금에 막힌다. 휴대폰 전력 앱으로
// 13층 전력을 끊고, 어둠 속에서 맨 안쪽 크랭크를 돌려 셔터를 올린다. 다시 전력을 켜면 셔터도 다시 내려온다.
const VAULT_SHUTTER = 'f13-vault-shutter';
const VAULT_DETECT_MS = 1500;
let vaultWatch = 0;

function vaultLit() {
  return floorHasLighting(13);
}

function vaultCrankReady() {
  return collectedItems.has(VAULT_SHUTTER) && !vaultLit();
}

// 장비 검증실↔보안 자료실 연결문이 target 쪽으로 잠겼는지. 검증실 쪽은 전자 잠금, 자료실 쪽은 셔터다.
// 순찰 로봇 R-03(guard-patrol.js)도 이 판정을 따르고, 셔터가 내려가 있으면 어느 쪽으로도 지나가지 않는다.
function vaultLinkLocked(target) {
  const shut = collectedItems.has(VAULT_SHUTTER);
  if (target === 'f13-secure') return !vaultLit() || shut;
  if (target === 'f13-testbay') return shut;
  return false;
}

// 문 잠금은 전력에 따라 그 자리에서 바뀌므로 매 프레임 맞춘다(잠긴 문은 E에 message를 보인다).
function updateVaultPuzzle(step) {
  if (room !== 'dynamic' || (dynamicFloorId !== 'f13-testbay' && dynamicFloorId !== 'f13-secure')) return;
  const lit = vaultLit();
  const shut = collectedItems.has(VAULT_SHUTTER);
  for (const door of currentDoors) {
    if (door.key === 'link:f13-secure') {
      door.locked = !lit;
      door.message = '카드 리더기가 꺼져 있다. 문 옆 표시: "전자 잠금 · 전원 공급 시 개방". 이 층에 전력이 들어와야 열린다.';
    } else if (door.key === 'link:f13-testbay') {
      door.locked = vaultLinkLocked('f13-testbay');
      door.message = lit ? '보안 셔터가 꿈쩍도 하지 않는다. 셔터 표시등: "미승인 출입 감지 · 원격 잠금 · 전원 공급 중".' :
        '전원이 끊겨 셔터 표시등이 꺼졌다. 셔터는 내려와 있다. 손으로 올릴 방법을 찾아야 한다.';
    }
  }
  if (dynamicFloorId !== 'f13-secure') return;
  const shutter = dynamicScene.querySelector('.fixture.vault-shutter');
  if (shutter) shutter.dataset.down = String(shut);
  if (!lit || shut) { vaultWatch = 0; return; }
  vaultWatch += step;
  if (vaultWatch < VAULT_DETECT_MS) return;
  vaultWatch = 0;
  collectedItems.add(VAULT_SHUTTER);
  playGameSound('shutter');
  saveProgress();
}

// 크랭크는 전력 상태에 따라 다른 결과를 보인다. 크랭크 조작(control.when)을 마치면 여기서 셔터를 올린다.
function handleVaultInteract(door) {
  if (dynamicFloorId !== 'f13-secure') return false;
  if (door.name === '수동 개방 크랭크') {
    if (!collectedItems.has(VAULT_SHUTTER)) openInspection(door.name, '셔터는 올라가 있다. 크랭크 손잡이가 헛돈다.');
    else if (vaultLit()) openInspection(door.name, '크랭크가 꿈쩍도 하지 않는다. 크랭크함 표시: "전원 공급 중 · 전자 잠금 우선. 정전 시에만 수동 개방."');
    else {
      collectedItems.delete(VAULT_SHUTTER);
      updateVaultPuzzle(0); // 조사창이 열린 동안은 루프가 멈추므로 출구 잠금을 지금 푼다
      playGameSound('shutter');
      openInspection(door.name, door.message);
      saveProgress();
    }
    return true;
  }
  return false;
}
