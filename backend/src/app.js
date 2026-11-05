const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { corsOrigin, mediaDir } = require('./config');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

fs.mkdirSync(mediaDir, { recursive: true });

const app = express();

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '30mb' })); // imagens chegam em base64
app.use('/media', express.static(mediaDir));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
