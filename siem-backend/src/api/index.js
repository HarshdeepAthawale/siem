import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';
import logsRouter from './routes/logs.js';
import alertsRouter from './routes/alerts.js';
import metricsRouter from './routes/metrics.js';
import { logger } from '../utils/logger.js';

export const createAPI = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/health', healthRouter);
  app.use('/api/logs', logsRouter);
  app.use('/api/alerts', alertsRouter);
  app.use('/api/metrics', metricsRouter);

  // Error handling
  app.use((err, req, res, next) => {
    logger.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
};

