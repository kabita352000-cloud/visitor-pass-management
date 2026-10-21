import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './src/routes/index.routes.js';
import errorHandler from './src/middleware/errorHandler.js';

const app = express();
const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const allowedOrigins = [
  ...new Set(configuredOrigins.flatMap(origin => [
    origin,
    origin.replace(/^(https?:\/\/)localhost(?=:\d|$)/, (_match, protocol) => `${protocol}127.0.0.1`),
    origin.replace(/^(https?:\/\/)127\.0\.0\.1(?=:\d|$)/, (_match, protocol) => `${protocol}localhost`)
  ]))
];

function isLocalhostOrigin(origin) {
  try {
    const { protocol, hostname } = new URL(origin);
    return ['http:', 'https:'].includes(protocol)
      && ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
  } catch {
    return false;
  }
}

app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.includes(origin) || isLocalhostOrigin(origin));
  }
}));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Visitor Pass API' }));
app.use('/api', routes);
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

export default app;
