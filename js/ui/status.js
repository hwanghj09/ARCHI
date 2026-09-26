// 화면 아래 상태 문구: 잠시 보였다가 사라진다.
const status = document.getElementById('interaction-status');
let statusTimer;

function showStatus(message, duration = 2500) {
  status.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { status.textContent = ''; }, duration);
}
