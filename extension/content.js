(() => {
  if (globalThis.__pageOracleLoaded) {
    console.log('[pageOracle] content script already loaded');
    return;
  }
  globalThis.__pageOracleLoaded = true;

  const STYLE = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    button, input { font: 14px Arial, sans-serif; }
    #trigger { position: fixed; z-index: 2147483647; width: 42px; height: 42px; border: 0; border-radius: 50%; color: #fff; background: #111827; box-shadow: 0 8px 22px rgba(0,0,0,.25); cursor: pointer; font-size: 22px; }
    #panel { position: fixed; z-index: 2147483647; top: 24px; right: 24px; width: min(380px, calc(100vw - 32px)); padding: 16px; border: 1px solid #dbe4ef; border-radius: 16px; background: #fff; color: #101827; box-shadow: 0 18px 48px rgba(15,23,42,.25); font: 14px Arial, sans-serif; }
    #panel header { display: flex; align-items: center; justify-content: space-between; font-size: 18px; }
    #panel header button { border: 0; background: transparent; cursor: pointer; font-size: 24px; }
    #selection { margin: 14px 0; padding: 10px; border-left: 3px solid #1976d2; color: #4b5f7d; max-height: 100px; overflow: auto; }
    #messages { max-height: 260px; overflow: auto; }
    #messages p { margin: 8px 0; padding: 8px 10px; border-radius: 10px; background: #f1f5f9; white-space: pre-wrap; }
    #messages .user { background: #e3f2fd; }
    #messages .error { color: #b42318; background: #fff1f0; }
    #form { display: flex; gap: 8px; margin-top: 12px; }
    #question { min-width: 0; flex: 1; padding: 10px; border: 1px solid #cbd5e1; border-radius: 9px; }
    #send { width: 40px; border: 0; border-radius: 50%; color: #fff; background: #1976d2; cursor: pointer; }
  `;

  console.log('[pageOracle] content script loaded', location.href);
  const host = document.createElement('div');
  host.id = 'pageoracle-root';
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>${STYLE}</style><button id="trigger" aria-label="Ask AI" title="Ask AI">✦</button><section id="panel" hidden><header><strong>Ask AI</strong><button id="close" aria-label="Close">×</button></header><blockquote id="selection"></blockquote><div id="messages"></div><form id="form"><input id="question" value="Explain this in simple terms." aria-label="Question" /><button id="send" aria-label="Send">➤</button></form></section>`;

  const trigger = shadow.querySelector('#trigger');
  const panel = shadow.querySelector('#panel');
  const selectionBox = shadow.querySelector('#selection');
  const messages = shadow.querySelector('#messages');
  const question = shadow.querySelector('#question');
  let selectedText = '';

  function openPanel() {
    selectionBox.textContent = selectedText ? `“${selectedText}”` : 'Select some text on this page first.';
    panel.hidden = false;
    trigger.hidden = true;
    question.focus();
  }

  function captureSelection() {
    const current = window.getSelection();
    const text = current?.toString().trim();
    if (!text || current.isCollapsed) return;
    selectedText = text.slice(0, 12000);
    const rect = current.getRangeAt(0).getBoundingClientRect();
    trigger.style.left = `${Math.min(window.innerWidth - 52, Math.max(8, rect.right + 8))}px`;
    trigger.style.top = `${Math.min(window.innerHeight - 52, Math.max(8, rect.top))}px`;
    trigger.hidden = false;
  }

  document.addEventListener('mouseup', captureSelection);
  document.addEventListener('touchend', captureSelection);
  trigger.addEventListener('mousedown', (event) => event.preventDefault());
  trigger.addEventListener('click', openPanel);
  shadow.querySelector('#close').addEventListener('click', () => { panel.hidden = true; trigger.hidden = false; });

  shadow.querySelector('#form').addEventListener('submit', (event) => {
    event.preventDefault();
    const value = question.value.trim();
    if (!value || !selectedText) return;
    const userMessage = document.createElement('p');
    userMessage.className = 'user';
    userMessage.textContent = value;
    messages.appendChild(userMessage);
    chrome.runtime.sendMessage({ type: 'PAGEORACLE_CHAT', payload: { selection: selectedText, question: value, pageTitle: document.title, pageUrl: location.href } }, (result) => {
      const message = document.createElement('p');
      message.className = result?.error ? 'error' : 'assistant';
      message.textContent = result?.error || result?.answer || 'No answer returned.';
      messages.appendChild(message);
    });
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('[pageOracle] received message', message);
    if (message?.type === 'PAGEORACLE_TOGGLE') openPanel();
    if (message?.type === 'PAGEORACLE_OPEN') { selectedText = (message.selection || '').trim().slice(0, 12000); openPanel(); }
    sendResponse({ ok: true });
    return true;
  });
})();
