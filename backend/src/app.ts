import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { PrismaClient } from '@prisma/client';
import { buildCandidatesRouter } from './routes/candidates';
import { ensureCvsDir } from './lib/paths';

export function createApp(prisma: PrismaClient): express.Application {
  ensureCvsDir();
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const origins =
    process.env.FRONTEND_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean) ||
    ['http://localhost:3000'];
  app.use(
    cors({
      origin: origins,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req: Request, res: Response) => {
    res.send('Hola LTI!');
  });

  app.use('/api/candidates', buildCandidatesRouter(prisma));

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error inesperado del servidor.', code: 'UNHANDLED' });
    }
  });

  return app;
}
