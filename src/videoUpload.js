import { upload } from '@vercel/blob/client';
import { api, authHeaders } from './api';

/** Sube un video al almacenamiento de MYOS y devuelve su URL pública. */
export async function uploadVideo(blob, ext, onProgress) {
  const st = await api('GET', '/api/video/storage');
  if (st.provider === 'off') throw new Error('El almacenamiento de videos todavía no está activado en el servidor (falta conectar Vercel Blob).');
  if (blob.size > st.max_mb * 1024 * 1024) throw new Error(`El video pesa más de ${st.max_mb} MB.`);
  const name = `videos/myos-${Date.now()}.${ext}`;
  if (st.provider === 'local') {
    const r = await fetch(`/api/video/local/${ext}`, { method: 'PUT', headers: { ...(await authHeaders()), 'Content-Type': 'application/octet-stream' }, body: blob });
    if (!r.ok) throw new Error('No se pudo subir el video.');
    onProgress?.(100);
    return (await r.json()).url;
  }
  const type = blob.type.split(';')[0] || (ext === 'mp4' ? 'video/mp4' : 'video/webm');
  const res = await upload(name, new Blob([blob], { type }), {
    access: 'public',
    handleUploadUrl: '/api/video/upload',
    headers: await authHeaders(),
    contentType: type,
    multipart: blob.size > 20 * 1024 * 1024,
    onUploadProgress: (p) => onProgress?.(Math.round(p.percentage))
  });
  return res.url;
}
