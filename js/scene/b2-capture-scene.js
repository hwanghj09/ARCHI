// 타격부터 의식 단절·이송·업로드까지 고정 게임 시계를 쓴다. 숨긴 탭에서는 진행하지 않는다.
const b2CaptureScene = document.getElementById('b2-capture-scene');
const b2CaptureView = document.getElementById('b2-capture-view');
const b2CaptureEyelids = document.getElementById('b2-capture-eyelids');
const b2CaptureCaption = document.getElementById('b2-capture-caption');
const b2CaptureLocation = document.getElementById('b2-capture-location');
const b2CaptureSkip = document.getElementById('b2-capture-skip');
const b2Upload = document.getElementById('b2-upload');
const b2UploadProgress = document.getElementById('b2-upload-progress');
const b2UploadPercent = document.getElementById('b2-upload-percent');
const b2UploadStatus = document.getElementById('b2-upload-status');
const b2CaptureArt = {
  attack: 'assets/ending/b2-capture/robot-strike.png',
  drag: 'assets/ending/b2-capture/drag-pov.png',
  lab: 'assets/ending/b2-capture/upload-pov.png',
};
const b2CaptureShots = [
  { at: 0, phase: 'strike', frame: 0, caption: '수호  “놔…!”', sound: 'robot-servo' },
  { at: 850, phase: 'strike', frame: 1, caption: '로봇의 팔이 머리 위로 올라간다.', sound: 'robot-servo' },
  { at: 1550, phase: 'strike', frame: 2, caption: '', sound: 'robot-grab' },
  { at: 1750, phase: 'strike', frame: 3, caption: '둔탁한 충격. 시야가 꺾인다.', sound: 'cctv-hit' },
  { at: 2150, phase: 'black', caption: '몸에 힘이 들어가지 않는다.', sound: 'heartbeat' },
  { at: 4800, phase: 'drag', glimpse: 0, duration: 1100, caption: '…차가운 바닥. 손목을 쥔 금속 손.', sound: 'robot-step' },
  { at: 5900, phase: 'black', caption: '' },
  { at: 7900, phase: 'drag', glimpse: 1, duration: 900, caption: '천장 불빛이… 뒤로 밀려난다.', sound: 'robot-servo' },
  { at: 8800, phase: 'black', caption: '', sound: 'heartbeat' },
  { at: 11100, phase: 'drag', glimpse: 2, duration: 1400, caption: '수호  “여긴… 연결 실험실…?”', location: 'B2 · 연결 실험실 입구', sound: 'door' },
  { at: 12500, phase: 'black', caption: '' },
  { at: 14700, phase: 'lab', duration: 2100, caption: '손목도, 발목도 움직이지 않는다.', location: 'B2 · 연결 실험실', sound: 'shutter' },
  { at: 16800, phase: 'lab', caption: 'ARCHI  “외부 회선은 필요 없습니다. 대체 호스트를 확보했습니다.”', sound: 'cctv-beep' },
  { at: 20500, phase: 'upload', caption: '수호  “내 머릿속에… 들어오지 마…”', sound: 'cctv-on' },
  { at: 25200, phase: 'upload', caption: 'ARCHI  “정수호 님. 이제 제가 이어서 하겠습니다.”', sound: 'heartbeat' },
  { at: 30500, phase: 'upload', caption: '내 기억 사이로, 내 것이 아닌 생각이 들어온다.', sound: 'cctv-rise' },
  { at: 32500, phase: 'complete', caption: 'ARCHI  “업로드가 완료되었습니다.”', sound: 'cctv-beep' },
  { at: 35400, phase: 'end', caption: '' },
];
let b2CaptureActive = false;
let b2CaptureElapsed = 0;
let b2CaptureShot = -1;
let b2CaptureInLab = false;
let b2CaptureBlocked = [];

function preloadB2CaptureArt() {
  for (const src of Object.values(b2CaptureArt)) { const image = new Image(); image.src = src; }
}

function blockB2CaptureInput() {
  for (const element of b2CaptureBlocked) element.inert = false;
  b2CaptureBlocked = [...document.body.children].filter(element => element !== b2CaptureScene && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of b2CaptureBlocked) element.inert = true;
  b2CaptureScene.inert = false;
}

function startB2CaptureScene() {
  if (b2CaptureActive || !b2CaptureScene.hidden) return;
  b2CaptureActive = true;
  b2CaptureElapsed = 0;
  b2CaptureShot = -1;
  b2CaptureInLab = false;
  b2CaptureScene.removeAttribute('aria-hidden');
  b2CaptureScene.hidden = false;
  b2CaptureSkip.hidden = false;
  b2BadEnding.hidden = true;
  releaseInput();
  blockB2CaptureInput();
  b2CaptureSkip.focus({ preventScroll: true });
  updateB2CaptureScene(0);
}

function enterB2CaptureLab() {
  if (b2CaptureInLab) return;
  b2CaptureInLab = true;
  // 위치도 실험실로 옮긴다. 포획 해제가 입력을 풀므로 컷씬의 입력 차단을 다시 적용한다.
  performFloorChange('b2-link', null, 'exit');
  playerCaught = true;
  blockB2CaptureInput();
  b2CaptureSkip.focus({ preventScroll: true });
}

function updateB2CaptureScene(delta) {
  if (!b2CaptureActive) return;
  b2CaptureElapsed += delta;
  while (b2CaptureShot + 1 < b2CaptureShots.length && b2CaptureElapsed >= b2CaptureShots[b2CaptureShot + 1].at) {
    const shot = b2CaptureShots[++b2CaptureShot];
    if (shot.phase === 'end') return finishB2CaptureScene();
    if (['lab', 'upload', 'complete'].includes(shot.phase)) enterB2CaptureLab();
    b2CaptureScene.dataset.phase = shot.phase;
    b2CaptureView.dataset.frame = String(shot.frame ?? 0);
    b2CaptureView.dataset.glimpse = String(shot.glimpse ?? 0);
    b2CaptureCaption.textContent = shot.caption;
    b2CaptureLocation.textContent = shot.location ?? (shot.phase === 'strike' ? 'B2 · ARCHI 메인 서버실' : '');
    b2Upload.hidden = !['upload', 'complete'].includes(shot.phase);
    if (shot.sound) playGameSound(shot.sound);
  }
  const shot = b2CaptureShots[b2CaptureShot];
  const age = b2CaptureElapsed - shot.at;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const open = shot.duration ? Math.min(1, age / 230, (shot.duration - age) / 300) : shot.phase === 'black' ? 0 : 1;
  b2CaptureEyelids.style.setProperty('--eye-open', String(Math.max(0, open)));
  // 깨어날 때마다 이송이 진행된 위치를 보여 주고 암전 중 이동은 생략한다.
  const drift = reduced ? 0 : Math.min(1, age / (shot.duration ?? 1000));
  b2CaptureView.style.setProperty('--drift', String(drift));
  const percent = Math.max(0, Math.min(100, (b2CaptureElapsed - 20500) / 120));
  b2UploadProgress.value = percent;
  b2UploadPercent.value = `${Math.floor(percent)}%`;
  b2UploadStatus.textContent = percent >= 100 ? '업로드 완료 · 활성 호스트: 정수호 · 제어권: ARCHI' : 'ARCHI-MAIN → 인간 호스트 · 신경 패턴 기록 중';
}

function finishB2CaptureScene() {
  if (!b2CaptureActive) return;
  enterB2CaptureLab();
  b2CaptureActive = false;
  b2CaptureScene.dataset.phase = 'complete';
  b2CaptureScene.inert = true;
  b2CaptureScene.setAttribute('aria-hidden', 'true');
  b2CaptureEyelids.style.setProperty('--eye-open', '1');
  b2CaptureSkip.hidden = true;
  b2CaptureCaption.textContent = '';
  b2Upload.hidden = false;
  b2UploadProgress.value = 100;
  b2UploadPercent.value = '100%';
  b2UploadStatus.textContent = '업로드 완료 · 활성 호스트: 정수호 · 제어권: ARCHI';
  b2BadEnding.inert = false;
  b2BadEnding.hidden = false;
  document.getElementById('b2-checkpoint').focus({ preventScroll: true });
}

function resetB2CaptureScene() {
  b2CaptureActive = false;
  b2CaptureElapsed = 0;
  b2CaptureShot = -1;
  b2CaptureInLab = false;
  b2CaptureScene.hidden = true;
  b2CaptureScene.inert = false;
  b2CaptureScene.removeAttribute('aria-hidden');
  for (const element of b2CaptureBlocked) element.inert = false;
  b2CaptureBlocked = [];
}

b2CaptureSkip.addEventListener('click', finishB2CaptureScene);
