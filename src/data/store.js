// Simple in-memory "database". Data resets when the server restarts.
let requests = [
  {
    id: 1,
    title: 'Laptop will not connect to office Wi-Fi',
    description: 'Connects for a minute, then drops. Other devices are fine.',
    category: 'Network',
    priority: 'medium',
    status: 'open',
    requesterName: 'Sample User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
let nextId = 2;

module.exports = {
  getAll: () => requests,
  getById: (id) => requests.find((r) => r.id === id),
  create: (data) => {
    const now = new Date().toISOString();
    const item = { id: nextId++, ...data, createdAt: now, updatedAt: now };
    requests.push(item);
    return item;
  },
  replace: (id, data) => {
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) return null;
    const old = requests[index];
    requests[index] = { ...data, id, createdAt: old.createdAt, updatedAt: new Date().toISOString() };
    return requests[index];
  },
  patch: (id, data) => {
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) return null;
    requests[index] = { ...requests[index], ...data, id, updatedAt: new Date().toISOString() };
    return requests[index];
  },
  remove: (id) => {
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) return false;
    requests.splice(index, 1);
    return true;
  }
};
