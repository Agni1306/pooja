import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './server/src/app.ts';
import { env } from './server/src/config/env.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  let viteMiddlewares: express.RequestHandler | null = null;
  if (!env.isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    viteMiddlewares = vite.middlewares;
  }

  const app = createApp((expressApp) => {
    if (viteMiddlewares) {
      expressApp.use(viteMiddlewares);
      return;
    }

    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      expressApp.use(express.static(distDir));
      expressApp.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  });

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`DigiThela server listening on http://0.0.0.0:${env.port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start DigiThela server:', err);
  process.exit(1);
});
