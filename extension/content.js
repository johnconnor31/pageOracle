const host = document.createElement('div');
host.id = 'pageoracle-root';
document.documentElement.appendChild(host);
const shadow = host.attachShadow({ mode: 'open' });
shadow.innerHTML = `
  <style>${CSS.escape ? '' : ''}</style>
  <button id="trigger" aria-label="Ask AI" title="Ask AI">✦</button>
  <section id="panel" hidden>
    <header><strong>Ask AI</strong><button id="close" aria-label="Close">×</button></header>
    <blockquote id="selection"></blockquote>
    <div id="messages"></div>
    <form id="form"><input id="question" value="Explain this in simple terms." aria-label="Question" /><button id="send" aria-label="Send">➤</button></form>
  </section>
`;

const trigger = shadow.querySelector('#trigger');
const panel = shadow.querySelector('#panel');
const selectionBox = shadow.querySelector('#selection');
const messages = shadow.querySelector('#messages');
const question = shadow.querySelector('#question');
let selectedText = '';
let selectedRange = null;

function positionTrigger(rect) {
  trigger.style.left = `${Math.min(window.innerWidth - 52, Math.max(8, rect.right + 8))}px`;
  trigger.style.top = `${Math.min(window.innerHeight - 52, Math.max(8, rect.top))}px`;
  trigger.hidden = false;
}

function captureSelection() {
  const current = window.getSelection();
  if (!current || current.isCollapsed) return;
  const text = current.toString().trim();
  if (!text) return;
  selectedText = text.slice(0, 12000);
  selectedRange = current.getRangeAt(0).cloneRange();
  positionTrigger(selectedRange.getBoundingClientRect());
}

document.addEventListener('mouseup', captureSelection);
document.addEventListener('touchend', captureSelection);
trigger.addEventListener('mousedown', (event) => event.preventDefault());
trigger.addEventListener('click', () => {
  selectionBox.textContent = `“${selectedText}”`;
  panel.hidden = false;
  trigger.hidden = true;
  question.focus();
});
shadow.querySelector('#close').addEventListener('click', () => {
  panel.hidden = true;
  trigger.hidden = false;
});
shadow.querySelector('#form').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = question.value.trim();
  if (!value || !selectedText) return;
  messages.insertAdjacentHTML('beforeend', `<p class="user"></p>`);
  messages.lastElementChild.textContent = value;
  chrome.runtime.sendMessage({
    type: 'PAGEORACLE_CHAT',
    payload: { selection: selectedText, question: value, pageTitle: document.title, pageUrl: location.href },
  }, (result) => {
    const message = shadow.querySelector('#messages').appendChild(document.createElement('p'));
    message.className = result?.error ? 'error' : 'assistant';
    message.textContent = result?.error || result?.answer || 'No answer returned.';
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== 'PAGEORACLE_OPEN') return;
  selectedText = message.selection.trim().slice(0, 12000);
  const current = window.getSelection();
  selectedRange = current && !current.isCollapsed ? current.getRangeAt(0).cloneRange() : null;
  selectionBox.textContent = `“${selectedText}”`;
  panel.hidden = false;
  trigger.hidden = true;
});
