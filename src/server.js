'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jitsiRoutes = require('./routes/jitsi.routes');

const app = express();
const PORT = process.env.PORT || 8080;

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || '').split(',') }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60000, max: 100 }));

app.get('/health', (req, res) => res.json({
  status: 'ok',
  service: 'jitsi-microservice',
  mode: process.env.JITSI_MODE || 'public',
  timestamp: new Date().toISOString()
}));

app.use('/api/jitsi', jitsiRoutes);

app.listen(PORT, () => console.log('Jitsi microservice running on port ' + PORT));

module.exports = app;
