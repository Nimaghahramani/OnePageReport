import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './apiRouter';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cookieParser());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Routes
  app.use('/api', apiRouter);

  return app;
}

export const app = createApp();
