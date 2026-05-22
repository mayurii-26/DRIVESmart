// Drive Smart AI Assistant - Gemini powered

const chatHistory = [];
let isRequestPending = false; // prevent duplicate requests

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function scrollToBottom() {
  const messagesDiv = document.getElementById('chat-messages');
  setTimeout(() => { messagesDiv.scrollTop = messagesDiv.scrollHeight; }, 100);
}

function renderMarkdown(text) {
  // Process line by line for accurate list grouping
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  for (let line of lines) {
    const isBullet = /^[\*\-] (.+)$/.test(line);
    const isNumbered = /^\d+\. (.+)$/.test(line);

    if (isBullet || isNumbered) {
      if (!inList) { html += '<ul>'; inList = true; }
      const content = line.replace(/^[\*\-] /, '').replace(/^\d+\. /, '');
      html += '<li>' + inlineFormat(content) + '</li>';
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      if (line.trim() === '') {
        html += '<br>';
      } else {
        html += '<p>' + inlineFormat(line) + '</p>';
      }
    }
  }
  if (inList) html += '</ul>';
  return html;
}

function inlineFormat(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/### (.+)/, '<strong>$1</strong>')
    .replace(/## (.+)/, '<strong>$1</strong>');
}

function appendMessage(role, text, isMarkdown = false) {
  const messagesDiv = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `message ${role === 'user' ? 'user' : 'bot'}`;
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  if (isMarkdown) {
    bubble.innerHTML = renderMarkdown(text);
  } else {
    bubble.textContent = text;
  }
  div.appendChild(bubble);
  messagesDiv.appendChild(div);
  scrollToBottom();
  return div;
}

function showTyping() {
  const messagesDiv = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'message bot';
  div.id = 'typing-indicator';
  div.innerHTML = `<div class="message-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  messagesDiv.appendChild(div);
  scrollToBottom();
}

function removeTyping() {
  const t = document.getElementById('typing-indicator');
  if (t) t.remove();
}

async function sendMessage() {
  if (isRequestPending) return; // block duplicate requests

  const input = document.getElementById('query-input');
  const message = input.value.trim();
  if (!message) return;

  isRequestPending = true;
  input.value = '';
  input.disabled = true;
  document.getElementById('send-btn').disabled = true;

  appendMessage('user', message);
  // Keep only last 12 history items to limit token usage
  chatHistory.push({ role: 'user', text: message });
  if (chatHistory.length > 20) chatHistory.splice(0, chatHistory.length - 20);

  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: chatHistory.slice(-13, -1) })
    });

    const data = await res.json();
    removeTyping();

    if (data.success && data.reply) {
      appendMessage('model', data.reply, true);
      chatHistory.push({ role: 'model', text: data.reply });
      showHelpPrompt();
    } else {
      const errMsg = data.error || 'Something went wrong. Please try again.';
      appendMessage('model', errMsg, false);
    }
  } catch (err) {
    removeTyping();
    appendMessage('model', 'Network error. Please check your connection and try again.', false);
  }

  isRequestPending = false;
  input.disabled = false;
  document.getElementById('send-btn').disabled = false;
  input.focus();
}

let helpPromptShown = false;
function showHelpPrompt() {
  if (helpPromptShown) return;
  if (chatHistory.filter(h => h.role === 'model').length < 2) return;
  helpPromptShown = true;
  const messagesDiv = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'message bot';
  div.id = 'help-prompt-msg';
  div.innerHTML = `
    <div class="message-bubble help-prompt-bubble">
      <p style="margin-bottom:0.75rem;">Still not satisfied with the answer?</p>
      <button class="btn btn-outline btn-sm" onclick="toggleIssueForm()">📋 Submit Issue to Admin</button>
    </div>`;
  messagesDiv.appendChild(div);
  scrollToBottom();
}

function toggleIssueForm() {
  const panel = document.getElementById('issue-panel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  if (panel.style.display === 'block') {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

async function submitIssue(e) {
  e.preventDefault();
  const category = document.getElementById('issue-category').value;
  const problem = document.getElementById('issue-description').value.trim();
  const statusDiv = document.getElementById('issue-status');
  const btn = e.target.querySelector('button[type="submit"]');

  if (!problem) return;

  btn.disabled = true;
  statusDiv.innerHTML = '<div class="alert alert-info">Submitting...</div>';

  try {
    const res = await fetch('/api/problem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem, category })
    });
    const data = await res.json();
    if (data.success) {
      statusDiv.innerHTML = '<div class="alert alert-success">✅ Issue submitted! Our admin team will review it shortly.</div>';
      document.getElementById('issue-form').reset();
      setTimeout(() => { document.getElementById('issue-panel').style.display = 'none'; }, 3000);
    } else {
      statusDiv.innerHTML = `<div class="alert alert-error">❌ ${data.error || 'Submission failed'}</div>`;
      btn.disabled = false;
    }
  } catch (err) {
    statusDiv.innerHTML = '<div class="alert alert-error">❌ Network error. Please try again.</div>';
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('query-input').addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  document.getElementById('issue-form').addEventListener('submit', submitIssue);
});
