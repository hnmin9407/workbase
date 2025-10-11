document.getElementById('btnPing').addEventListener('click', async () => {
  const result = await window.api.ping();
  document.getElementById('pingResult').textContent = result;
});
