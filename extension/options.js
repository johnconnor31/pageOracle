const input = document.querySelector('#apiUrl');
chrome.storage.sync.get({ apiUrl: 'http://localhost:3000' }, ({ apiUrl }) => { input.value = apiUrl; });
document.querySelector('#save').addEventListener('click', async () => {
  await chrome.storage.sync.set({ apiUrl: input.value.trim().replace(/\/$/, '') });
  document.querySelector('#save').textContent = 'Saved';
});
