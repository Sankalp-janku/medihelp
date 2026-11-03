import express from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes.js';
import { requestId, notFound, errorHandler } from './middlewares/index.js';

export const app = express();
app.set('query parser', 'simple'); // query values stay plain strings, never nested objects
app.use(helmet());
app.use(cors({ origin: env.clientUrl }));
app.use(express.json({ limit: '100kb' }));
app.use(requestId);
app.get('/health', (_req, res) => {
  const db = mongoose.connection.readyState === 1;
  res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', database: db ? 'connected' : 'unavailable' });
});
app.use('/api', rateLimit({ windowMs: 15 * 60000, max: 600, standardHeaders: true, legacyHeaders: false }));
app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);
