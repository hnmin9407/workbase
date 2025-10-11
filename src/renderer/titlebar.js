const { ipcRenderer } = require('electron');

// 최소화
document.getElementById('min-btn').addEventListener('click', () => {
  ipcRenderer.send('window-minimize');
});

// 최대화 / 복원
document.getElementById('max-btn').addEventListener('click', () => {
  ipcRenderer.send('window-maximize');
});

// 닫기
document.getElementById('close-btn').addEventListener('click', () => {
  ipcRenderer.send('window-close');
});
