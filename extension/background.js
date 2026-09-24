const DEFAULT_API_URL = 'http://localhost:3000';

console.log('[pageOracle] service worker loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('[pageOracle] installed');
  chrome.contextMenus.create({
    id: 'pageoracle-ask',
    title: 'Ask pageOracle about this selection',
    contexts: ['selection'],
  });
});

async function sendToTab(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
    console.log('[pageOracle] message delivered', message.type);
  } catch (error) {
    console.warn('[pageOracle] no content script; injecting it now', error.message);
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    await chrome.tabs.sendMessage(tabId, message);
    console.log('[pageOracle] message delivered after injection', message.type);
  }
}

chrome.action.onClicked.addListener((tab) => {
  console.log('[pageOracle] toolbar clicked', { tabId: tab?.id, url: tab?.url });
  if (!tab?.id) return;
  sendToTab(tab.id, { type: 'PAGEORACLE_TOGGLE' }).catch((error) => {
    console.error('[pageOracle] could not open panel:', error.message);
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'pageoracle-ask' || !tab?.id) return;
  sendToTab(tab.id, { type: 'PAGEORACLE_OPEN', selection: info.selectionText || '' }).catch((error) => {
    console.error('[pageOracle] context menu failed:', error.message);
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'PAGEORACLE_CHAT') return undefined;
  (async () => {
    const stored = await chrome.storage.sync.get({ apiUrl: DEFAULT_API_URL });
    const response = await fetch(`${stored.apiUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message.payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to ask pageOracle AI.');
    sendResponse({ answer: result.answer });
  })().catch((error) => sendResponse({ error: error.message }));
  return true;
});
