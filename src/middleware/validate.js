const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['open', 'in-progress', 'resolved', 'closed'];

const isText = (v) => typeof v === 'string' && v.trim().length > 0;

function clean(body) {
  const out = {};
  if (body.title !== undefined) out.title = String(body.title).trim();
  if (body.description !== undefined) out.description = String(body.description).trim();
  if (body.requesterName !== undefined) out.requesterName = String(body.requesterName).trim();
  if (body.category !== undefined) out.category = String(body.category).trim();
  if (body.priority !== undefined) out.priority = body.priority;
  if (body.status !== undefined) out.status = body.status;
  return out;
}

function checkValues(data, errors) {
  if (data.priority !== undefined && !PRIORITIES.includes(data.priority))
    errors.push(`priority must be one of: ${PRIORITIES.join(', ')}`);
  if (data.status !== undefined && !STATUSES.includes(data.status))
    errors.push(`status must be one of: ${STATUSES.join(', ')}`);
}

// POST and PUT: full object required
function validateFull(req, res, next) {
  const body = req.body || {};
  const errors = [];
  ['title', 'description', 'requesterName'].forEach((f) => {
    if (!isText(body[f])) errors.push(`${f} is required`);
  });
  const data = clean(body);
  checkValues(data, errors);
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  req.validated = {
    title: data.title,
    description: data.description,
    requesterName: data.requesterName,
    category: data.category || 'General',
    priority: data.priority || 'medium',
    status: data.status || 'open'
  };
  next();
}

// PATCH: any subset of fields, at least one
function validatePartial(req, res, next) {
  const data = clean(req.body || {});
  const errors = [];
  if (Object.keys(data).length === 0) errors.push('Provide at least one field to update');
  ['title', 'description', 'requesterName'].forEach((f) => {
    if (data[f] !== undefined && !isText(data[f])) errors.push(`${f} cannot be empty`);
  });
  checkValues(data, errors);
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  req.validated = data;
  next();
}

module.exports = { validateFull, validatePartial };
