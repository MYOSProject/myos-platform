// Punto de entrada. Toda la lógica vive en ./server/*.
//  - Local:  `npm run dev` → Express + Vite en el puerto 3000 (o PORT).
//  - Vercel: api/index.ts importa este archivo y usa el `app` exportado como función serverless.
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createApp } from './server/app.js';
import { errorHandler } from './server/http.js';
import { ENV_FILES_LOADED, ENV_SOURCES } from './server/env.js';
import { getAiStatus } from './server/gemini.js';
import { approverPolicy, authMode } from './server/auth.js';
import { getStore } from './server/store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const app = createApp();

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }
  app.use(errorHandler);

  const server = app.listen(PORT, '0.0.0.0', () => {
    const ai = getAiStatus();
    const pol = approverPolicy();
    console.log(`MYOS Platform en http://localhost:${PORT}`);
    console.log(`  · Archivos .env cargados: ${ENV_FILES_LOADED.join(', ') || '(ninguno)'}`);
    console.log(
      ai.configured
        ? `  · Gemini: llave encontrada en ${ENV_SOURCES.GEMINI_API_KEY || 'el entorno'} · modelos: ${ai.models.join(' → ')}`
        : '  · Gemini: ⚠ SIN LLAVE. Define GEMINI_API_KEY en .env (raíz del proyecto). La generación fallará hasta entonces.'
    );
    console.log(`  · Autenticación: ${authMode()} · aprobadores: ${pol.policy === 'allowlist' ? pol.count + ' en APPROVER_EMAILS' : '⚠ cualquier usuario con correo verificado (define APPROVER_EMAILS)'}`);
    console.log(`  · Datos: ${getStore().persistence}${getStore().file ? ' → ' + getStore().file : ''}`);
  });
  const stop = () => {
    getStore().flush();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
