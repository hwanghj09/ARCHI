// 13층 보안 자료실의 백업 장치(f13-backup-device)를 가진 채 17층 컴퓨터를 켜면 바탕화면에 '외부 저장 장치'가 생긴다.
// 열면 2층 Harmony Hall "03:00 무관객 리허설" 녹화 사본이 깨진 채 약 9초 재생되다 멈추고, 원본이 2층 서버실 녹화 NAS에
// 있으며 04:00에 지워진다고 알려 준다. 끝까지 보면 f17-usb-played를 남기고(목표 '2층 조사하기', objective.js) 저장한다.
// 그림 없이 글자와 CSS(주사선·노이즈·떨림·색 번짐·검은 프레임, device-apps.css)만 쓴다. 도중에 창을 닫으면 기록하지 않는다.
// 아이콘은 숨겨 두지 않고, 장치를 가졌을 때만 바탕화면에 붙인다(없으면 떼어 낸다).
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
}

function usbVideoWatching() {
  return usingComputer && computerWindows.get('usbdrive')?.open;
}

function stopUsbVideo() {
  usbVideoTimers.forEach(clearTimeout);
  usbVideoTimers = [];
}

function playUsbVideo() {
  stopUsbVideo();
  usbVideo.dataset.state = 'clear';
  usbVideoPlace.textContent = '2F Harmony Hall · 객석 카메라 · REC ●';
  usbVideoRec.textContent = '';
  usbVideoCaption.textContent = '';
  usbVideoError.hidden = usbVideoReplay.hidden = true;
  for (const [at, state, time, caption] of USB_VIDEO_FRAMES) {
    usbVideoTimers.push(setTimeout(() => {
      if (!usbVideoWatching()) return stopUsbVideo();
      usbVideo.dataset.state = state;
      usbVideoRec.textContent = time;
      usbVideoCaption.textContent = caption;
      if (state === 'glitch') playGameSound('switch');
    }, at));
  }
  usbVideoTimers.push(setTimeout(() => {
    if (!usbVideoWatching()) return stopUsbVideo();
    usbVideo.dataset.state = 'error';
    usbVideoCaption.textContent = '';
    usbVideoError.hidden = usbVideoReplay.hidden = false;
    playGameSound('deny');
    if (!collectedItems.has('f17-usb-played')) {
      collectedItems.add('f17-usb-played');
      saveProgress();
    }
  }, usbVideoEndMs));
}

usbVideoReplay.addEventListener('click', playUsbVideo);
