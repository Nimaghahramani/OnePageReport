import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}
import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './apiRouter.js';

export function createApp() {
  const app = express();

  // Standard middleware
  app.use(cookieParser());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Mount API router
  // 1. Direct mount for /api/* paths
  app.use('/api', apiRouter);

  // 2. Direct mount as fallback if Vercel serverless function strips /api prefix
  app.use(apiRouter);

  return app;
}

export const app = createApp();
export default app;
