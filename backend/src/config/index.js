const path = require('path');
require('dotenv').config();

const port = Number(process.env.PORT || 3000);

module.exports = {
  port,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-troque-em-producao',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  publicUrl: (process.env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, ''),
  mediaDir: path.resolve(__dirname, '../../', process.env.MEDIA_DIR || 'media'),
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : true,
};
