// Conexión de cada proyecto con Facebook e Instagram (Meta Graph API) o con un webhook de Make/Zapier.
// Los secretos se guardan CIFRADOS (AES-256-GCM) y jamás se devuelven al navegador.
import crypto from 'crypto';
import type { AuthUser, ProjectConnection } from './types.js';
import { HttpError } from './http.js';
import { isProd } from './env.js';
import { graphBase } from './publisher.js';
import type { Store } from './store.js';

export interface ResolvedConnection {
  page_id: string;
  ig_user_id: string;
  webhook_url: string;
  token: string;
  live: boolean;
}

function encKey(): Buffer {
  const k = process.env.CONNECTIONS_KEY?.trim();
  if (!k) {
    if (isProd) throw new HttpError(500, 'NO_CONNECTIONS_KEY', 'Falta la variable CONNECTIONS_KEY en el servidor (cualquier texto largo y secreto). Sin ella no se pueden guardar llaves de Meta.');
    return crypto.createHash('sha256').update('myos-dev-key-no-usar-en-produccion').digest();
  }
  if (k.length < 16) throw new HttpError(500, 'WEAK_CONNECTIONS_KEY', 'CONNECTIONS_KEY debe tener al menos 16 caracteres.');
  return crypto.createHash('sha256').update(k).digest();
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', encKey(), iv);
  const data = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString('base64')).join('.');
}

export function decrypt(enc: string): string {
  const [iv, tag, data] = enc.split('.').map((x) => Buffer.from(x, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', encKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString('utf8');
}

export function resolveConnection(store: Store, projectId: number | null | undefined): ResolvedConnection | null {
  const c = projectId ? store.connections[String(projectId)] : undefined;
  if (!c) return null;
  let token = '';
  try {
    token = c.page_token_enc ? decrypt(c.page_token_enc) : '';
  } catch {
    token = '';
  }
  return { page_id: c.page_id, ig_user_id: c.ig_user_id, webhook_url: c.webhook_url, token, live: c.live };
}

export function connectionView(store: Store, projectId: number) {
  const c = store.connections[String(projectId)];
  if (!c) return { configured: false, live: false, page_id: '', ig_user_id: '', webhook_url: '', has_token: false, token_hint: '', tested_ok: null, tested_at: null, test_note: null };
  let hint = '';
  try {
    hint = c.page_token_enc ? `…${decrypt(c.page_token_enc).slice(-4)}` : '';
  } catch {
    hint = '(no se pudo leer; vuelve a pegarlo)';
  }
  return {
    configured: true,
    live: c.live,
    page_id: c.page_id,
    ig_user_id: c.ig_user_id,
    webhook_url: c.webhook_url,
    has_token: Boolean(c.page_token_enc),
    token_hint: hint,
    tested_ok: c.tested_ok ?? null,
    tested_at: c.tested_at ?? null,
    test_note: c.test_note ?? null,
    updated_at: c.updated_at,
    updated_by: c.updated_by
  };
}

const ids = (v: unknown, label: string) => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (s && !/^\d{5,25}$/.test(s)) throw new HttpError(400, 'BAD_ID', `${label} debe ser solo números (los copias de Meta).`);
  return s;
};

export function saveConnection(store: Store, user: AuthUser, projectId: number, input: any): ProjectConnection {
  const prev = store.connections[String(projectId)];
  const webhook = typeof input.webhook_url === 'string' ? input.webhook_url.trim() : prev?.webhook_url || '';
  if (webhook && !/^https:\/\/[^\s"'<>]+$/.test(webhook)) throw new HttpError(400, 'BAD_URL', 'El webhook debe empezar con https://');
  const tokenIn = typeof input.page_token === 'string' ? input.page_token.trim() : '';
  if (tokenIn && !/^[\w\-.|]{20,600}$/.test(tokenIn)) throw new HttpError(400, 'BAD_TOKEN', 'El token no parece válido. Cópialo completo, sin espacios.');
  const next: ProjectConnection = {
    page_id: input.page_id !== undefined ? ids(input.page_id, 'El ID de la página') : prev?.page_id || '',
    ig_user_id: input.ig_user_id !== undefined ? ids(input.ig_user_id, 'El ID de Instagram') : prev?.ig_user_id || '',
    webhook_url: webhook,
    page_token_enc: tokenIn ? encrypt(tokenIn) : prev?.page_token_enc || '',
    live: prev?.live || false,
    tested_ok: null,
    tested_at: null,
    test_note: null,
    updated_at: new Date().toISOString(),
    updated_by: `${user.name} <${user.email}>`
  };
  // Si cambió algo que afecta a la conexión, hay que volver a probarla y volver a activarla.
  const changed = !prev || prev.page_id !== next.page_id || prev.ig_user_id !== next.ig_user_id || prev.webhook_url !== next.webhook_url || Boolean(tokenIn);
  if (!changed) {
    next.live = prev!.live;
    next.tested_ok = prev!.tested_ok ?? null;
    next.tested_at = prev!.tested_at ?? null;
    next.test_note = prev!.test_note ?? null;
  } else next.live = false;
  store.connections[String(projectId)] = next;
  store.save();
  return next;
}

async function graphGet(pathname: string, fields: string, token: string) {
  const url = `${graphBase()}/${pathname}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    /* ignore */
  }
  if (!res.ok || data?.error) throw new Error(data?.error?.message || `Meta respondió ${res.status}`);
  return data;
}

/** Comprueba con Meta que el token y los IDs sirven. No publica nada. */
export async function testConnection(store: Store, projectId: number): Promise<{ ok: boolean; facebook?: string; instagram?: string; webhook?: boolean; errors: string[] }> {
  const c = store.connections[String(projectId)];
  const r = resolveConnection(store, projectId);
  if (!c || !r) throw new HttpError(409, 'NO_CONNECTION', 'Primero guarda los datos de conexión.');
  const out: { ok: boolean; facebook?: string; instagram?: string; webhook?: boolean; errors: string[] } = { ok: false, errors: [] };
  if (r.token && r.page_id) {
    try {
      const d = await graphGet(r.page_id, 'name', r.token);
      out.facebook = String(d.name || r.page_id);
    } catch (e: any) {
      out.errors.push(`Facebook: ${e.message}`);
    }
  }
  if (r.token && r.ig_user_id) {
    try {
      const d = await graphGet(r.ig_user_id, 'username', r.token);
      out.instagram = d.username ? `@${d.username}` : r.ig_user_id;
    } catch (e: any) {
      out.errors.push(`Instagram: ${e.message}`);
    }
  }
  if (r.webhook_url) out.webhook = true;
  if (!r.token && !r.webhook_url) out.errors.push('Falta el token de acceso de la página (o un webhook de Make/Zapier).');
  if (r.token && !r.page_id && !r.ig_user_id) out.errors.push('Falta el ID de la página de Facebook o el ID de la cuenta de Instagram.');
  out.ok = out.errors.length === 0 && Boolean(out.facebook || out.instagram || out.webhook);
  c.tested_at = new Date().toISOString();
  c.tested_ok = out.ok;
  c.test_note = out.ok ? [out.facebook && `Facebook: ${out.facebook}`, out.instagram && `Instagram: ${out.instagram}`, out.webhook && 'Webhook configurado'].filter(Boolean).join(' · ') : out.errors.join(' | ');
  if (!out.ok) c.live = false;
  store.save();
  return out;
}

export function setLive(store: Store, user: AuthUser, projectId: number, live: boolean): ProjectConnection {
  const c = store.connections[String(projectId)];
  if (!c) throw new HttpError(409, 'NO_CONNECTION', 'Primero guarda los datos de conexión.');
  if (live && !c.tested_ok) throw new HttpError(409, 'NOT_TESTED', 'Primero prueba la conexión: tiene que salir bien para activar la publicación real.');
  c.live = live;
  c.updated_at = new Date().toISOString();
  c.updated_by = `${user.name} <${user.email}>`;
  store.save();
  return c;
}

export function deleteConnection(store: Store, projectId: number) {
  delete store.connections[String(projectId)];
  store.save();
}
