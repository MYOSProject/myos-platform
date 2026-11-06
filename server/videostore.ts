// Almacenamiento de videos para publicar. El navegador sube el archivo DIRECTO al almacenamiento (Vercel Blob),
// porque las funciones de Vercel no aceptan cuerpos de más de 4.5 MB. Aquí solo se autoriza la subida.
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import express, { type Express, type RequestHandler } from 'express';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { HttpError } from './http.js';

export const MAX_VIDEO_MB = 250;
const TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const localDir = () => process.env.VIDEO_LOCAL_DIR || path.join(os.tmpdir(), 'myos-video');
const isDev = () => process.env.AUTH_MODE === 'dev';

export function videoStorageProvider(): 'vercel-blob' | 'local' | 'off' {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return 'vercel-blob';
  return isDev() ? 'local' : 'off';
}

export function registerVideoStorage(app: Express, requireAuth: RequestHandler, wrap: (fn: any) => RequestHandler, baseUrl: (req: any) => string) {
  app.get('/api/video/storage', requireAuth, (_req, res) => {
    res.json({ provider: videoStorageProvider(), max_mb: MAX_VIDEO_MB });
  });

  // Vercel Blob: autoriza la subida directa desde el navegador.
  app.post('/api/video/upload', requireAuth, wrap(async (req: any, res: any) => {
    if (videoStorageProvider() !== 'vercel-blob') throw new HttpError(503, 'NO_STORAGE', 'El almacenamiento de videos todavía no está activado en el servidor.');
    const body = req.body as HandleUploadBody;
    const out = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^videos\/[\w.\-/]{1,160}$/.test(pathname) || pathname.includes('..')) throw new Error('Nombre de archivo no permitido.');
        return { allowedContentTypes: TYPES, maximumSizeInBytes: MAX_VIDEO_MB * 1024 * 1024, addRandomSuffix: true, tokenPayload: JSON.stringify({ by: req.user?.email || '' }) };
      },
      onUploadCompleted: async () => { /* nada que guardar: la URL se asocia a la publicación al crearla */ }
    });
    res.json(out);
  }));

  // Solo desarrollo: guarda el video en una carpeta temporal para poder probar todo el flujo sin la nube.
  if (isDev()) {
    app.put('/api/video/local/:ext', requireAuth, express.raw({ type: '*/*', limit: `${MAX_VIDEO_MB}mb` }), wrap(async (req: any, res: any) => {
      const ext = String(req.params.ext).replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'mp4';
      fs.mkdirSync(localDir(), { recursive: true });
      const name = `${crypto.randomBytes(8).toString('hex')}.${ext}`;
      fs.writeFileSync(path.join(localDir(), name), req.body as Buffer);
      res.json({ url: `${baseUrl(req)}/media-video/${name}` });
    }));
    app.get('/media-video/:file', (req, res) => {
      const f = path.join(localDir(), path.basename(String(req.params.file)));
      if (!fs.existsSync(f)) return res.status(404).type('text/plain').send('No disponible');
      res.sendFile(f);
    });
  }
}
