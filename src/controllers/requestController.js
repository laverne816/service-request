const store = require('../data/store');

const parseId = (req) => Number.parseInt(req.params.id, 10);

// GET /api/requests  (optional ?status=open)
exports.getAll = (req, res) => {
  let list = store.getAll();
  if (req.query.status) list = list.filter((r) => r.status === req.query.status);
  res.status(200).json(list);
};

// GET /api/requests/:id
exports.getOne = (req, res) => {
  const item = store.getById(parseId(req));
  if (!item) return res.status(404).json({ error: 'Service request not found' });
  res.status(200).json(item);
};

// POST /api/requests
exports.create = (req, res) => {
  const item = store.create(req.validated);
  res.status(201).json(item);
};

// PUT /api/requests/:id  (replace whole record)
exports.replace = (req, res) => {
  const item = store.replace(parseId(req), req.validated);
  if (!item) return res.status(404).json({ error: 'Service request not found' });
  res.status(200).json(item);
};

// PATCH /api/requests/:id  (update some fields)
exports.update = (req, res) => {
  const item = store.patch(parseId(req), req.validated);
  if (!item) return res.status(404).json({ error: 'Service request not found' });
  res.status(200).json(item);
};

// DELETE /api/requests/:id
exports.remove = (req, res) => {
  const ok = store.remove(parseId(req));
  if (!ok) return res.status(404).json({ error: 'Service request not found' });
  res.status(204).send();
};
