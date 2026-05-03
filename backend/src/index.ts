import dotenv from 'dotenv';

dotenv.config();

import { createApp } from './app';
import { prisma } from './db';

const app = createApp(prisma);

const port = Number(process.env.PORT) || 3010;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

export { app };
