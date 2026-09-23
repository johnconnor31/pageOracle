const DEFAULT_API_URL = 'http://localhost:3000';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[pageOracle] installed');
  chrome.contextMenus.create({
    id: 'pageoracle-ask',
    title: 'Ask pageOracle about this selection',
    contexts: ['selection'],
  });
});

chrome.action.onClicked.addListener((tab) => {
  console.log('[pageOracle] toolbar clicked', tab?.id, tab?.url);

  if (!tab?.id) {
    console.error('[pageOracle] no tab ID');
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: 'PAGEORACLE_TOGGLE' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[pageOracle] sendMessage failed:', chrome.runtime.lastError.message);
      return;
    }

    console.log('[pageOracle] response:', response);
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'pageoracle-ask' || !tab?.id) return;
  console.log('[pageOracle] context menu clicked', info.selectionText);
  chrome.tabs.sendMessage(tab.id, { type: 'PAGEORACLE_OPEN', selection: info.selectionText || '' }).catch(() => {});
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
