const { ipcRenderer } = require('electron');

const minBtn = document.getElementById('min-btn');
const maxBtn = document.getElementById('max-btn');
const closeBtn = document.getElementById('close-btn');
const maxIcon = document.getElementById('max-icon');

// 최소화
minBtn.addEventListener('click', () => {
  ipcRenderer.send('window-minimize');
});

// 최대화 / 복원
maxBtn.addEventListener('click', () => {
  ipcRenderer.send('window-maximize');
});

// 닫기
closeBtn.addEventListener('click', () => {
  ipcRenderer.send('window-close');
});

// 메인 프로세스에서 최대화 상태 신호 수신
ipcRenderer.on('window-maximized', () => {
  maxIcon.src = '../../assets/titlebar/max-icon-2.svg';
});

ipcRenderer.on('window-unmaximized', () => {
  maxIcon.src = '../../assets/titlebar/max-icon-1.svg';
});
