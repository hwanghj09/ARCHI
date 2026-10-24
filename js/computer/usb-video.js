// 13층 USB를 1층 안내 데스크 PC나 13층 상황실 원격지원 PC(UPS 비상 회선)에 연결한 뒤 손상된 리허설 녹화를 끝까지 봐야 2층 목표가 열린다.
const usbDriveShortcut = document.createElement('button');
usbDriveShortcut.type = 'button';
usbDriveShortcut.dataset.computerApp = 'usbdrive';
usbDriveShortcut.innerHTML = '<span class="app-art" data-app-icon="files" aria-hidden="true"></span><span>외부 저장 장치</span>';
usbDriveShortcut.addEventListener('click', event => {
  for (const icon of computer.querySelectorAll('.computer-shortcuts button')) icon.dataset.selected = String(icon === usbDriveShortcut);
  if (event.detail === 0 || event.pointerType === 'touch') openComputerApp('usbdrive');
});
usbDriveShortcut.addEventListener('dblclick', () => openComputerApp('usbdrive'));

const usbVideo = document.getElementById('usb-video');
const usbVideoRec = document.getElementById('usb-video-rec');
const usbVideoPlace = document.getElementById('usb-video-place');
const usbVideoCaption = document.getElementById('usb-video-caption');
const usbVideoError = document.getElementById('usb-video-error');
const usbVideoReplay = document.getElementById('usb-video-replay');
const usbDriveConnect = document.getElementById('usb-drive-connect');
const usbDrivePlug = document.getElementById('usb-drive-plug');
const usbDrivePath = document.getElementById('usb-drive-path');
// [시작 ms, 화면 상태(clear·glitch·black), 녹화 시각, 자막]. 마지막 칸 뒤에 오류 화면이 뜬다.
const USB_VIDEO_FRAMES = [
  [0, 'clear', '03:00:04', '(무관객 리허설 · 운영자 SYSTEM) 객석은 비어 있고 무대 조명만 켜져 있다.'],
  [1800, 'glitch', '03:00:06', '"화자 표본 31█ / 312 … 합성 재생 시작."'],
  [3400, 'clear', '03:00:07', '무대 스피커에서 낯익은 목소리가 흘러나온다. "…정█수호입니다. 오늘도 야근…"'],
  [5200, 'glitch', '03:00:0█', '"표본 312 · 17F 정수호 · 일치율 9█.█%"'],
  [6900, 'black', '', ''],
  [7400, 'glitch', '03:00:09', '객석 마이크의 빨간 불이 모두 켜져 있다. 아무도 없는데.'],
];
const usbVideoEndMs = 9000;
let usbVideoTimers = [];

function refreshUsbDrive() {
  if (!collectedItems.has('f13-backup-device')) usbDriveShortcut.remove();
  else if (!usbDriveShortcut.isConnected) document.querySelector('#computer .computer-shortcuts').append(usbDriveShortcut);
  usbDrivePlug.disabled = !usbDriveAvailable();
  if (!usbDriveAvailable()) resetUsbVideo();
}

function usbDriveAvailable() {
  const office = room === 'office' && currentSceneFloor === 17 && floorHasPower(17);
  const opsPc = room === 'dynamic' && dynamicFloorId === 'f13-ops' && collectedItems.has('f13-ups');
  return usingComputer && !transitioning && !computer.hidden && (office || opsPc) && collectedItems.has('f13-backup-device');
}

function usbVideoWatching() {
  const state = computerWindows.get('usbdrive');
  return !document.hidden && usbDriveAvailable() && state?.open && !state.minimized && !state.element.hidden && !state.view.hidden;
}

function stopUsbVideo() {
  usbVideoTimers.forEach(clearTimeout);
  usbVideoTimers = [];
}

function resetUsbVideo() {
  stopUsbVideo();
  usbVideo.hidden = true;
  usbVideo.dataset.state = 'idle';
  usbDriveConnect.hidden = false;
  usbDrivePath.textContent = '백업 장치 · 연결 대기';
  usbVideoError.hidden = usbVideoReplay.hidden = true;
}

function playUsbVideo() {
  if (!usbVideoWatching()) return;
  stopUsbVideo();
  usbDriveConnect.hidden = true;
  usbVideo.hidden = false;
  usbVideo.focus({ preventScroll: true });
  usbDrivePath.textContent = '외부 저장 장치 (E:) / BACKUP / 2F_REHEARSAL_0300.mp4';
  // 다시 재생할 때도 객석 카메라를 처음 위치부터 움직인다.
  const footage = usbVideo.querySelector('.usb-video-footage');
  footage.replaceWith(footage.cloneNode(true));
  usbVideo.dataset.state = 'clear';
  usbVideoPlace.textContent = '2F Harmony Hall · 객석 카메라 · REC ●';
  usbVideoRec.textContent = '';
  usbVideoCaption.textContent = '';
  usbVideoError.hidden = usbVideoReplay.hidden = true;
  for (const [at, state, time, caption] of USB_VIDEO_FRAMES) {
    usbVideoTimers.push(setTimeout(() => {
      if (!usbVideoWatching()) return resetUsbVideo();
      usbVideo.dataset.state = state;
      usbVideoRec.textContent = time;
      usbVideoCaption.textContent = caption;
      if (state === 'glitch') playGameSound('switch');
    }, at));
  }
  usbVideoTimers.push(setTimeout(() => {
    if (!usbVideoWatching()) return resetUsbVideo();
    stopUsbVideo();
    usbVideo.dataset.state = 'error';
    usbVideoCaption.textContent = '';
    usbVideoError.hidden = usbVideoReplay.hidden = false;
    playGameSound('deny');
    if (!collectedItems.has('f17-usb-played')) {
      collectedItems.add('f17-usb-played');
      refreshObjective();
      saveProgress();
    }
  }, usbVideoEndMs));
}

usbVideoReplay.addEventListener('click', playUsbVideo);
usbDrivePlug.addEventListener('click', playUsbVideo);
document.addEventListener('visibilitychange', () => { if (document.hidden) resetUsbVideo(); });
