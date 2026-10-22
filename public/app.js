const API = '/api/requests';
const STATUSES = ['open', 'in-progress', 'resolved', 'closed'];
const form = document.getElementById('requestForm');
const list = document.getElementById('list');
const stats = document.getElementById('stats');
const message = document.getElementById('message');
const cancelBtn = document.getElementById('cancelBtn');
const helpToggle = document.getElementById('helpToggle');
const helpPanel = document.getElementById('helpPanel');
const helpClose = document.getElementById('helpClose');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const $ = (id) => document.getElementById(id);

function show(text, type) { message.textContent = text; message.className = type; }

function chatReply(question) {
  const text = question.toLowerCase();
  if (/\b(password|passcode|otp|sensitive)\b/.test(text)) {
    return 'Please don’t share passwords, one-time codes, or sensitive information here. For account access, choose “Accounts and access” on the request form.';
  }
  if (/\b(urgent|emergency|priority|critical|down)\b/.test(text)) {
    return 'If work is blocked, choose High under “How urgent?” when you send your request, and explain who or what is affected. For a security concern, choose Security and mark it high priority.';
  }
  if (/\b(status|track|tracking|where|progress|update)\b/.test(text)) {
    return 'Your requests appear under “On the radar”. Each card shows its current status; if you need to add context, use Edit on that request.';
  }
  if (/\b(edit|change|update|delete|cancel)\b/.test(text)) {
    return 'Find your request under “On the radar”. Choose Edit to change its details, or use the status menu to update its progress. You can remove a request with Delete.';
  }
  if (/\b(create|new|submit|send|request|log|start)\b/.test(text)) {
    return 'Fill in your name, a short summary, and a few details, then choose an area and urgency. Hit “Send request” and it will appear under “On the radar”.';
  }
  if (/\b(human|person|agent|contact|talk|help)\b/.test(text)) {
    return 'I’m the quick-help guide, not a live agent. Send a request using the form and include how the service desk can follow up with you.';
  }
  return 'I can help with creating a request, checking its status, editing it, or choosing urgency. Try one of the suggestions below.';
}

function addChatMessage(text, sender) {
  const bubble = document.createElement('p');
  bubble.className = `chat-bubble ${sender}`;
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function closeChat() {
  helpPanel.hidden = true;
  helpToggle.setAttribute('aria-expanded', 'false');
}

helpToggle.addEventListener('click', () => {
  const isOpening = helpPanel.hidden;
  helpPanel.hidden = !isOpening;
  helpToggle.setAttribute('aria-expanded', String(isOpening));
  if (isOpening) chatInput.focus();
});

helpClose.addEventListener('click', () => {
  closeChat();
  helpToggle.focus();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !helpPanel.hidden) {
    closeChat();
    helpToggle.focus();
  }
});

function sendChatMessage(question) {
  const trimmed = question.trim();
  if (!trimmed) return;
  addChatMessage(trimmed, 'user');
  addChatMessage(chatReply(trimmed), 'bot');
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  sendChatMessage(chatInput.value);
  chatInput.value = '';
  chatInput.focus();
});

document.querySelector('.chat-suggestions').addEventListener('click', (event) => {
  const button = event.target.closest('[data-question]');
  if (button) sendChatMessage(button.dataset.question);
});

async function api(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error((data.details && data.details.join(', ')) || data.error);
  return data;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function renderStats(items) {
  if (!items.length) { stats.innerHTML = '<p class="stats-empty">Nothing waiting right now.</p>'; return; }
  const n = (s) => items.filter((i) => i.status === s).length;
  stats.innerHTML =
    `<div class="bar">${STATUSES.map((s) => n(s) ? `<span class="seg ${s}" style="flex:${n(s)}"></span>` : '').join('')}</div>` +
    `<ul>${STATUSES.map((s) => `<li><i class="led ${s}"></i>${n(s)} ${s.replace('-', ' ')}</li>`).join('')}</ul>`;
}

async function load() {
  try {
    const items = await api(API);
    renderStats(items);
    if (!items.length) { list.innerHTML = '<p class="empty">Nothing on the radar yet. If something needs attention, tell us about it and we’ll take it from here.</p>'; return; }
    list.innerHTML = items.slice().reverse().map((r) => `
      <article class="item p-${r.priority}">
        <div class="head">
          <span class="tid">INC-${String(r.id).padStart(4, '0')}</span>
          <span class="meter" role="img" aria-label="${r.priority} priority"><i></i><i></i><i></i></span>
        </div>
        <h3>${esc(r.title)}</h3>
        <p>${esc(r.description)}</p>
        <div class="meta"><span class="chip">${esc(r.category)}</span><span>${esc(r.requesterName)}</span><time>${new Date(r.createdAt).toLocaleString()}</time></div>
        <div class="actions">
          <select data-status="${r.id}" data-value="${r.status}" aria-label="Status">
            ${STATUSES.map((s) => `<option ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <button class="btn ghost" data-edit="${r.id}">Edit</button>
          <button class="btn danger" data-delete="${r.id}">Delete</button>
        </div>
      </article>`).join('');
  } catch (e) {
    list.innerHTML = `<p class="empty">Couldn't load requests: ${esc(e.message)}</p>`;
  }
}

function resetForm() {
  form.reset();
  $('requestId').value = '';
  $('formTitle').textContent = 'Tell us what’s up';
  $('submitBtn').textContent = 'Send request';
  cancelBtn.hidden = true;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('requestId').value;
  const body = {
    requesterName: $('requesterName').value, title: $('title').value, description: $('description').value,
    category: $('category').value, priority: $('priority').value
  };
  try {
    if (id) { await api(`${API}/${id}`, { method: 'PUT', body: JSON.stringify(body) }); show('Request updated.', 'ok'); }
    else { await api(API, { method: 'POST', body: JSON.stringify(body) }); show('Request created.', 'ok'); }
    resetForm(); load();
  } catch (err) { show(err.message, 'error'); }
});

cancelBtn.addEventListener('click', () => { resetForm(); show('', ''); });

list.addEventListener('click', async (e) => {
  const editId = e.target.dataset.edit, delId = e.target.dataset.delete;
  try {
    if (editId) {
      const r = await api(`${API}/${editId}`);
      $('requestId').value = r.id; $('requesterName').value = r.requesterName; $('title').value = r.title;
      $('description').value = r.description; $('category').value = r.category; $('priority').value = r.priority;
      $('formTitle').textContent = `Edit INC-${String(r.id).padStart(4, '0')}`;
      $('submitBtn').textContent = 'Save changes';
      cancelBtn.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (delId && confirm('Delete this request?')) {
      await api(`${API}/${delId}`, { method: 'DELETE' });
      show('Request deleted.', 'ok'); load();
    }
  } catch (err) { show(err.message, 'error'); }
});

list.addEventListener('change', async (e) => {
  const id = e.target.dataset.status;
  if (!id) return;
  try {
    await api(`${API}/${id}`, { method: 'PATCH', body: JSON.stringify({ status: e.target.value }) });
    show(`INC-${String(id).padStart(4, '0')} moved to ${e.target.value}.`, 'ok');
    load();
  } catch (err) { show(err.message, 'error'); }
});

load();
