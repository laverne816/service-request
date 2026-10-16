const express = require('express');
const path = require('path');
const logger = require('./middleware/logger');
const requestRoutes = require('./routes/requestRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(express.json());            // parse JSON request bodies
app.use(logger);                    // log every request
app.use(express.static(path.join(__dirname, '..', 'public'))); // front-end

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/requests', requestRoutes);

// 404 + error handling (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
