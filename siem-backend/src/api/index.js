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

  // 404 handler for unmatched routes
  app.use('/api/*', (req, res) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: 'Not Found',
      message: `API endpoint ${req.method} ${req.originalUrl} not found`,
      availableEndpoints: [
        'GET /api/health',
        'GET /api/logs',
        'GET /api/alerts',
        'GET /api/metrics',
      ]
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error('API Error:', err);
    res.status(err.status || 500).json({ 
      error: err.message || 'Internal server error' 
    });
  });

  return app;
};

