import { auth } from './firebase';

let devUser = localStorage.getItem('myos_dev_user') || '';
export const setDevUser = (email) => {
  devUser = email;
  localStorage.setItem('myos_dev_user', email);
};
export const getDevUser = () => devUser;

async function headers() {
  const h = { 'Content-Type': 'application/json' };
  if (auth.currentUser) h.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
  else if (devUser) h['x-dev-user'] = devUser;
  return h;
}

export class ApiError extends Error {
  constructor(status, error) {
    super(error?.message || `Error ${status}`);
    this.status = status;
    this.code = error?.code;
    this.details = error?.details;
  }
}

export async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: await headers(),
    body: body !== undefined && method !== 'GET' ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* no json */ }
  if (!res.ok) throw new ApiError(res.status, json?.error || { message: text.slice(0, 200) });
  return json;
}

/** Descarga una imagen protegida (las <img> no mandan el token). */
export async function apiBlobUrl(path) {
  const res = await fetch(path, { headers: await headers() });
  if (!res.ok) throw new ApiError(res.status, { message: 'No se pudo cargar la imagen' });
  return URL.createObjectURL(await res.blob());
}

export const errText = (e) => (e?.details?.hint ? `${e.message} ${e.details.hint}` : e?.message || String(e));

/** Reduce una imagen antes de guardarla. Los logos se guardan en PNG para conservar la transparencia. */
export function fileToSmallDataUrl(file, { max = 1000, png = false } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(png ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = url;
  });
}
