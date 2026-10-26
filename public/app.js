const API = '/api/requests';
const STATUSES = ['open', 'in-progress', 'resolved', 'closed'];
const FILTERS = ['all', ...STATUSES];
const form = document.getElementById('requestForm');
const list = document.getElementById('list');
const filters = document.getElementById('filters');
const openCount = document.getElementById('openCount');
const message = document.getElementById('message');
const dialog = document.getElementById('requestDialog');
const newRequestButton = document.getElementById('newRequest');
const cancelButton = document.getElementById('cancelBtn');
const closeButton = document.getElementById('closeDialog');
const $ = (id) => document.getElementById(id);
let requests = [];
let activeFilter = 'all';

const statusLabel = (status) => status === 'in-progress' ? 'In progress' : status[0].toUpperCase() + status.slice(1);
const priorityLabel = (priority) => priority[0].toUpperCase() + priority.slice(1);
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const requestNumber = (id) => `#${String(id).padStart(4, '0')}`;

function notify(text, type = '') {
  message.textContent = text;
  message.className = `toast ${type}`.trim();
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error((data.details && data.details.join(', ')) || data.error || 'Request failed');
  return data;
}

function age(createdAt) {
  const timestamp = new Date(createdAt);
  const elapsed = Math.max(0, Date.now() - timestamp.getTime());
  if (!Number.isFinite(timestamp.getTime())) return 'Unknown';
  if (elapsed < 60_000) return 'Just now';
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)} min`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)} hr`;
  return `${Math.floor(elapsed / 86_400_000)} d`;
}

function renderFilters() {
  const count = (status) => status === 'all'
    ? requests.length
    : requests.filter((request) => request.status === status).length;
  openCount.textContent = count('open');
  filters.innerHTML = FILTERS.map((status) => `
    <button class="filter" type="button" data-filter="${status}" aria-pressed="${activeFilter === status}">
      ${status === 'all' ? 'All' : statusLabel(status)}
      <span class="filter-count">${count(status)}</span>
    </button>`).join('');
}

function renderRequests() {
  const visible = requests.filter((request) => activeFilter === 'all' || request.status === activeFilter);
  if (!visible.length) {
    const emptyText = requests.length
      ? `No ${activeFilter === 'all' ? '' : `${statusLabel(activeFilter).toLowerCase()} `}requests. Create one with New request.`
      : 'No requests. Create one with New request.';
    list.innerHTML = `<p class="empty">${esc(emptyText)}</p>`;
    return;
  }

  list.innerHTML = `
    <table class="request-table">
      <thead><tr>
        <th scope="col">ID</th><th scope="col">Summary</th><th scope="col">Area</th>
        <th scope="col">Urgency</th><th scope="col">Status</th><th scope="col">Requester</th>
        <th scope="col">Age</th><th scope="col"><span class="sr-only">Actions</span></th>
      </tr></thead>
      <tbody>${visible.map((request) => {
        const id = esc(request.id);
        const formattedId = esc(requestNumber(request.id));
        const timestamp = new Date(request.createdAt);
        const timeValue = Number.isFinite(timestamp.getTime()) ? timestamp.toISOString() : '';
        return `<tr>
          <td class="id-cell request-id" data-label="ID">${formattedId}</td>
          <td class="summary-cell summary" data-label="Summary">${esc(request.title)}</td>
          <td class="area" data-label="Area">${esc(request.category)}</td>
          <td data-label="Urgency"><span class="urgency" data-priority="${esc(request.priority)}"><i class="urgency-marker" aria-hidden="true"></i>${esc(priorityLabel(request.priority))}</span></td>
          <td class="status-cell" data-label="Status">
            <select class="status-select" data-status="${id}" data-current="${esc(request.status)}" aria-label="Status for request ${formattedId}">
              ${STATUSES.map((status) => `<option value="${status}" ${status === request.status ? 'selected' : ''}>${statusLabel(status)}</option>`).join('')}
            </select>
          </td>
          <td class="requester" data-label="Requester">${esc(request.requesterName)}</td>
          <td class="request-age" data-label="Age"><time ${timeValue ? `datetime="${timeValue}" title="${esc(timestamp.toLocaleString())}"` : ''}>${esc(age(request.createdAt))}</time></td>
          <td class="actions-cell row-actions" data-label="Actions">
            <details class="row-menu">
              <summary aria-label="Actions for request ${formattedId}">…</summary>
              <div class="menu-items">
                <button type="button" data-edit="${id}">Edit</button>
                <button class="delete-action" type="button" data-delete="${id}">Delete</button>
              </div>
            </details>
          </td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
}

function render() {
  renderFilters();
  renderRequests();
}

async function load() {
  try {
    requests = await api(API);
    render();
  } catch (error) {
    list.innerHTML = `<p class="empty">Couldn't load requests: ${esc(error.message)}</p>`;
    notify(`Couldn't load requests: ${error.message}`, 'error');
  }
}

function resetForm() {
  form.reset();
  $('requestId').value = '';
  $('formTitle').textContent = 'New request';
  $('submitBtn').textContent = 'Send request';
}

function openForm(request) {
  resetForm();
  if (request) {
    $('requestId').value = request.id;
    $('requesterName').value = request.requesterName;
    $('title').value = request.title;
    $('description').value = request.description;
    $('category').value = request.category;
    $('priority').value = request.priority;
    $('formTitle').textContent = `Edit ${requestNumber(request.id)}`;
    $('submitBtn').textContent = 'Save changes';
  }
  dialog.showModal();
  $('requesterName').focus();
}

newRequestButton.addEventListener('click', () => openForm());
closeButton.addEventListener('click', () => dialog.close());
cancelButton.addEventListener('click', () => dialog.close());
dialog.addEventListener('close', resetForm);
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

filters.addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  activeFilter = button.dataset.filter;
  render();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = $('requestId').value;
  const currentRequest = id ? requests.find((request) => String(request.id) === id) : null;
  const body = {
    requesterName: $('requesterName').value.trim(),
    title: $('title').value.trim(),
    description: $('description').value.trim(),
    category: $('category').value,
    priority: $('priority').value,
    status: currentRequest ? currentRequest.status : 'open'
  };
  try {
    const saved = id
      ? await api(`${API}/${id}`, { method: 'PUT', body: JSON.stringify(body) })
      : await api(API, { method: 'POST', body: JSON.stringify(body) });
    dialog.close();
    notify(id ? `Request ${requestNumber(saved.id)} updated.` : `Request ${requestNumber(saved.id)} created.`);
    await load();
  } catch (error) {
    notify(error.message, 'error');
  }
});

list.addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-edit]');
  const deleteButton = event.target.closest('[data-delete]');
  try {
    if (editButton) {
      const request = await api(`${API}/${editButton.dataset.edit}`);
      editButton.closest('.row-menu').open = false;
      openForm(request);
    }
    if (deleteButton) {
      const id = deleteButton.dataset.delete;
      const request = requests.find((item) => String(item.id) === id);
      if (!request || !window.confirm(`Delete request ${requestNumber(id)}? This cannot be undone.`)) return;
      await api(`${API}/${id}`, { method: 'DELETE' });
      notify(`Request ${requestNumber(id)} deleted.`);
      await load();
    }
  } catch (error) {
    notify(error.message, 'error');
  }
});

list.addEventListener('change', async (event) => {
  const select = event.target.closest('[data-status]');
  if (!select) return;
  const id = select.dataset.status;
  const status = select.value;
  try {
    await api(`${API}/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    notify(`Request ${requestNumber(id)} marked ${statusLabel(status).toLowerCase()}.`);
    await load();
  } catch (error) {
    select.value = select.dataset.current;
    notify(error.message, 'error');
  }
});

load();
