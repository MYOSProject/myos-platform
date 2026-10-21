// Almacenamiento permanente en Firestore (por la API REST, con una cuenta de servicio).
//
// Por qué existe: en Vercel el disco es temporal, así que con solo un archivo los proyectos y contenidos se
// perdían entre una petición y otra. Aquí cada pieza (proyecto, perfil, publicación, imagen...) es un documento.
//
// Cómo funciona en serverless (cada petición puede caer en una instancia distinta):
//   1) al empezar una petición se revisa un contador de versión; si otra instancia guardó algo, se recarga todo;
//   2) al terminar, se escriben solo los documentos que cambiaron y se sube la versión ANTES de responder.
// Límite conocido: si dos instancias cambian el MISMO documento al mismo tiempo, gana la última escritura.
import crypto from 'crypto';
import { importPKCS8, SignJWT } from 'jose';
import type { Store } from './store.js';

const PART = 150_000; // caracteres por documento: con 4 bytes por carácter (emojis) son 600 KB, bajo el límite de 1 MiB de Firestore

export interface RemoteConfig {
  projectId: string;
  databaseId: string;
  clientEmail: string;
  privateKey: string;
  base: string;
  tokenUrl: string;
}

/** Lee el JSON de una cuenta de servicio pegado de varias formas: tal cual, entre comillas, con saltos de línea reales en la llave, con BOM, o en base64. */
export function parseServiceAccount(rawInput: string): { json?: any; error?: string } {
  let raw = rawInput.replace(/^\uFEFF/, '').trim();
  if (/^(["'`]).*\1$/s.test(raw)) raw = raw.slice(1, -1).trim();
  const looksBase64 = /^[A-Za-z0-9+/_=\s-]+$/.test(raw) && !raw.startsWith('{');
  // Texto con basura alrededor (por ejemplo "Value: {...}"): se toma desde la primera { hasta la última }.
  if (!raw.startsWith('{') && !looksBase64 && raw.includes('{') && raw.includes('}')) raw = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
  const hint = `el valor guardado mide ${raw.length} caracteres y empieza con «${raw.slice(0, 1) || '(vacío)'}»${raw.startsWith('-') ? ' (parece solo la llave privada: hace falta el archivo JSON completo)' : ''}`;
  const attempts: string[] = [];
  if (raw.startsWith('{')) {
    attempts.push(raw);
    // Saltos de línea reales dentro de private_key invalidan el JSON: se convierten en \n.
    attempts.push(raw.replace(/("private_key"\s*:\s*")([\s\S]*?)("\s*[,}])/, (_m, a1, key, a3) => a1 + key.replace(/\r?\n/g, '\\n') + a3));
    attempts.push(raw.replace(/\\"/g, '"'));
  } else if (looksBase64) {
    const buf = Buffer.from(raw.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    // Archivos guardados por PowerShell con «>» salen en UTF-16.
    const text = buf[0] === 0xff && buf[1] === 0xfe ? buf.toString('utf16le') : buf.toString('utf8');
    attempts.push(text.replace(/^\uFEFF/, '').trim());
  }
  let lastErr = `no parece un JSON ni base64 de un JSON (${hint})`;
  for (const t of attempts) {
    try {
      const json = JSON.parse(t);
      if (typeof json !== 'object' || !json) continue;
      const missing = ['client_email', 'private_key', 'project_id'].filter((k) => !json[k]);
      if (missing.length) return { error: `el JSON no trae: ${missing.join(', ')} (¿es la clave de una cuenta de servicio?)` };
      return { json };
    } catch {
      lastErr = `no se pudo leer como JSON (${hint})`;
    }
  }
  return { error: lastErr };
}

export function remoteConfigFromEnv(databaseIdFromConfig = '', envName = 'FIREBASE_SERVICE_ACCOUNT'): RemoteConfig | null {
  const raw = process.env[envName]?.trim();
  if (!raw) return null;
  const parsed = parseServiceAccount(raw);
  if (!parsed.json) {
    console.error(`[remote] ${envName}: ${parsed.error}`);
    return null;
  }
  const json = parsed.json;
  return {
    projectId: String(json.project_id),
    databaseId: process.env.FIRESTORE_DATABASE_ID?.trim() || databaseIdFromConfig || '(default)',
    clientEmail: String(json.client_email),
    privateKey: String(json.private_key).replace(/\\n/g, '\n'),
    base: (process.env.FIRESTORE_BASE || 'https://firestore.googleapis.com').replace(/\/+$/, ''),
    tokenUrl: process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token'
  };
}

class Firestore {
  private tokenValue = '';
  private tokenExp = 0;
  constructor(private cfg: RemoteConfig) {}

  private async token(): Promise<string> {
    if (this.tokenValue && Date.now() < this.tokenExp - 60_000) return this.tokenValue;
    const key = await importPKCS8(this.cfg.privateKey, 'RS256');
    const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/datastore' })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuer(this.cfg.clientEmail)
      .setSubject(this.cfg.clientEmail)
      .setAudience(this.cfg.tokenUrl)
      .setIssuedAt()
      .setExpirationTime('55m')
      .sign(key);
    const res = await fetch(this.cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
      signal: AbortSignal.timeout(15000)
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) throw new Error(`Google no entregó el token de la cuenta de servicio (${res.status}): ${data?.error_description || data?.error || ''}`);
    this.tokenValue = data.access_token;
    this.tokenExp = Date.now() + (Number(data.expires_in) || 3600) * 1000;
    return this.tokenValue;
  }

  private docs() {
    return `${this.cfg.base}/v1/projects/${this.cfg.projectId}/databases/${this.cfg.databaseId}/documents`;
  }

  private async call(method: string, url: string, body?: unknown): Promise<any> {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${await this.token()}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000)
    });
    if (res.status === 404 && (method === 'GET' || method === 'DELETE')) return null;
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      /* no json */
    }
    if (!res.ok) throw new Error(`Firestore ${method} ${res.status}: ${data?.error?.message || text.slice(0, 200)}`);
    return data;
  }

  async get(col: string, id: string): Promise<{ json: string; n: number } | null> {
    const d = await this.call('GET', `${this.docs()}/${col}/${encodeURIComponent(id)}`);
    return d ? { json: d.fields?.json?.stringValue ?? '', n: Number(d.fields?.n?.integerValue ?? 1) } : null;
  }

  async put(col: string, id: string, json: string, n = 1): Promise<void> {
    await this.call('PATCH', `${this.docs()}/${col}/${encodeURIComponent(id)}`, { fields: { json: { stringValue: json }, n: { integerValue: String(n) } } });
  }

  async del(col: string, id: string): Promise<void> {
    await this.call('DELETE', `${this.docs()}/${col}/${encodeURIComponent(id)}`);
  }

  async list(col: string): Promise<Array<{ id: string; json: string; n: number }>> {
    const out: Array<{ id: string; json: string; n: number }> = [];
    let pageToken = '';
    do {
      const d = await this.call('GET', `${this.docs()}/${col}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`);
      for (const doc of d?.documents || []) {
        out.push({ id: decodeURIComponent(String(doc.name).split('/').pop() || ''), json: doc.fields?.json?.stringValue ?? '', n: Number(doc.fields?.n?.integerValue ?? 1) });
      }
      pageToken = d?.nextPageToken || '';
    } while (pageToken);
    return out;
  }

  // --- piezas grandes: se parten en varios documentos "id~0", "id~1"... ---
  async putBlob(col: string, id: string, json: string, prevParts = 0): Promise<number> {
    const parts = Math.max(1, Math.ceil(json.length / PART));
    for (let i = 0; i < parts; i++) await this.put(col, `${id}~${i}`, json.slice(i * PART, (i + 1) * PART), parts);
    for (let i = parts; i < prevParts; i++) await this.del(col, `${id}~${i}`);
    return parts;
  }

  async getBlob(col: string, id: string): Promise<string | null> {
    const first = await this.get(col, `${id}~0`);
    if (!first) return null;
    let out = first.json;
    for (let i = 1; i < first.n; i++) out += (await this.get(col, `${id}~${i}`))?.json ?? '';
    return out;
  }

  async delBlob(col: string, id: string, parts: number): Promise<void> {
    for (let i = 0; i < parts; i++) await this.del(col, `${id}~${i}`);
  }

  async listBlobs(col: string): Promise<Map<string, { json: string; parts: number }>> {
    const docs = await this.list(col);
    const groups = new Map<string, Array<{ i: number; json: string; n: number }>>();
    for (const d of docs) {
      const m = /^(.*)~(\d+)$/.exec(d.id);
      if (!m) continue;
      const g = groups.get(m[1]) || [];
      g.push({ i: Number(m[2]), json: d.json, n: d.n });
      groups.set(m[1], g);
    }
    const out = new Map<string, { json: string; parts: number }>();
    for (const [id, g] of groups) {
      g.sort((a, b) => a.i - b.i);
      if (g.length < g[0].n) continue; // escritura a medias: se ignora hasta que termine
      out.set(id, { json: g.map((x) => x.json).join(''), parts: g[0].n });
    }
    return out;
  }
}

const sha = (s: string) => crypto.createHash('sha1').update(s).digest('hex');

interface Entry {
  key: string;
  json: string;
}

export class RemoteSync {
  readonly fs: Firestore;
  private rev = '';
  private loaded = false;
  /** Lo último que se sabe que está en Firestore: clave → huella y número de partes. */
  private written = new Map<string, { hash: string; parts: number }>();
  private mediaWritten = new Map<string, { sha: string; parts: number }>();
  private loading: Promise<void> | null = null;
  inflight = 0;

  constructor(cfg: RemoteConfig, private store: Store) {
    this.fs = new Firestore(cfg);
  }

  /** Antes de atender una petición: si otra instancia guardó algo, se recarga. */
  async ensureFresh(): Promise<void> {
    if (this.loading) return this.loading;
    // Con otras peticiones en curso no se recarga: se perderían sus cambios sin guardar.
    if (this.inflight > 1 && this.loaded) return;
    const remoteRev = (await this.fs.get('myos_rev', 'main'))?.json ?? '';
    if (this.loaded && remoteRev === this.rev) return;
    this.loading = this.reload(remoteRev).finally(() => {
      this.loading = null;
    });
    return this.loading;
  }

  private async reload(remoteRev: string): Promise<void> {
    const blobs = await this.fs.listBlobs('myos');
    const s = this.store;
    const contents: any[] = [];
    const social: any[] = [];
    const leads: any[] = [];
    const projects: any[] = [];
    const maps = { profile: {} as any, guide: {} as any, chat: {} as any, conn: {} as any, drive: {} as any };
    const media: Record<string, any> = {};
    let counters: any = null;
    const written = new Map<string, { hash: string; parts: number }>();
    for (const [id, b] of blobs) {
      let doc: any;
      try {
        doc = JSON.parse(b.json);
      } catch {
        console.error(`[remote] documento ilegible, se omite: ${id}`);
        continue;
      }
      written.set(id, { hash: sha(b.json), parts: b.parts });
      const v = doc.value;
      if (id === 'counters') counters = v;
      else if (id.startsWith('content-')) contents.push(v);
      else if (id.startsWith('social-')) social.push(v);
      else if (id.startsWith('lead-')) leads.push(v);
      else if (id.startsWith('project-')) projects.push(v);
      else if (id.startsWith('profile-')) maps.profile[doc.key] = v;
      else if (id.startsWith('guide-')) maps.guide[doc.key] = v;
      else if (id.startsWith('chat-')) maps.chat[doc.key] = v;
      else if (id.startsWith('conn-')) maps.conn[doc.key] = v;
      else if (id.startsWith('drive-')) maps.drive[doc.key] = v;
      else if (id.startsWith('mediaidx-')) media[doc.key] = { ...v, b64: '' };
    }
    contents.sort((a, b) => b.id - a.id);
    social.sort((a, b) => b.id - a.id);
    leads.sort((a, b) => a.id - b.id);
    projects.sort((a, b) => a.id - b.id);
    s.contents = contents;
    s.social = social;
    s.leads = leads;
    s.projects = projects;
    s.profiles = maps.profile;
    s.guide = maps.guide;
    s.chats = maps.chat;
    s.connections = maps.conn;
    s.drive = maps.drive;
    s.media = media;
    if (counters) s.counters = { content: 0, social: 0, lead: 0, project: 0, ...counters };
    this.written = written;
    this.rev = remoteRev;
    this.loaded = true;
    s.loadedFromRemote = true;
  }

  private entries(): Entry[] {
    const s = this.store;
    const out: Entry[] = [];
    const add = (key: string, value: unknown, k = key) => out.push({ key, json: JSON.stringify({ key: k, value }) });
    add('counters', s.counters);
    for (const p of s.projects) add(`project-${p.id}`, p);
    for (const c of s.contents) add(`content-${c.id}`, c);
    for (const p of s.social) add(`social-${p.id}`, p);
    for (const l of s.leads) add(`lead-${l.id}`, l);
    for (const [k, v] of Object.entries(s.profiles)) add(`profile-${k}`, v, k);
    for (const [k, v] of Object.entries(s.guide)) add(`guide-${k}`, v, k);
    for (const [k, v] of Object.entries(s.chats)) add(`chat-${k}`, v, k);
    for (const [k, v] of Object.entries(s.connections)) add(`conn-${k}`, v, k);
    for (const [k, v] of Object.entries(s.drive)) add(`drive-${k}`, v, k);
    for (const [k, m] of Object.entries(s.media)) add(`mediaidx-${k}`, { mime: m.mime, sha: m.sha, at: m.at }, k);
    return out;
  }

  /** Después de una petición que cambió algo: escribe lo que cambió y sube la versión. */
  async commit(): Promise<void> {
    const s = this.store;
    if (!s.dirty) return;
    const entries = this.entries();
    const keep = new Set(entries.map((e) => e.key));
    const tasks: Array<() => Promise<void>> = [];
    const nextWritten = new Map(this.written);
    for (const e of entries) {
      const h = sha(e.json);
      const prev = this.written.get(e.key);
      if (prev?.hash === h) continue;
      tasks.push(async () => {
        const parts = await this.fs.putBlob('myos', e.key, e.json, prev?.parts || 0);
        nextWritten.set(e.key, { hash: h, parts });
      });
    }
    for (const [key, w] of this.written) {
      if (keep.has(key)) continue;
      tasks.push(async () => {
        await this.fs.delBlob('myos', key, w.parts);
        nextWritten.delete(key);
      });
    }
    // Imágenes: el contenido va en otra colección y solo se sube cuando cambia.
    for (const [id, m] of Object.entries(s.media)) {
      if (!m.b64) continue;
      const prev = this.mediaWritten.get(id);
      if (prev?.sha === m.sha) continue;
      tasks.push(async () => {
        const parts = await this.fs.putBlob('myos_media', id, JSON.stringify({ b64: m.b64 }), prev?.parts || 0);
        this.mediaWritten.set(id, { sha: m.sha, parts });
      });
    }
    for (const [id, w] of [...this.mediaWritten]) {
      if (s.media[id]) continue;
      tasks.push(async () => {
        await this.fs.delBlob('myos_media', id, w.parts);
        this.mediaWritten.delete(id);
      });
    }
    // Pocas escrituras en paralelo para no saturar.
    const pool = Array.from({ length: Math.min(6, tasks.length) }, async () => {
      for (let t = tasks.shift(); t; t = tasks.shift()) await t();
    });
    await Promise.all(pool);
    this.written = nextWritten;
    const newRev = crypto.randomBytes(8).toString('hex');
    await this.fs.put('myos_rev', 'main', newRev);
    this.rev = newRev;
    s.dirty = false;
  }

  /** Trae el contenido de una imagen (solo se baja cuando se necesita). */
  async mediaB64(id: string): Promise<string | null> {
    const raw = await this.fs.getBlob('myos_media', id);
    if (!raw) return null;
    try {
      return JSON.parse(raw).b64 || null;
    } catch {
      return null;
    }
  }
}

// ------------------------------------------------------------------------------------------
// Token de la cuenta de servicio para otras APIs de Google (Drive). Misma llave que Firestore.
// ------------------------------------------------------------------------------------------
const scopeTokens = new Map<string, { value: string; exp: number }>();

/** Cuenta de servicio para Drive: DRIVE_SERVICE_ACCOUNT si existe (proyecto de Google Cloud aparte), si no la de Firebase. */
export function driveAccountConfig(): RemoteConfig | null {
  return remoteConfigFromEnv('', 'DRIVE_SERVICE_ACCOUNT') || remoteConfigFromEnv();
}

/** Qué cuenta usa Drive y, si DRIVE_SERVICE_ACCOUNT existe pero no sirve, por qué se descartó. */
export function driveAccountStatus(): { source: 'DRIVE_SERVICE_ACCOUNT' | 'FIREBASE_SERVICE_ACCOUNT' | null; error: string | null } {
  const raw = process.env.DRIVE_SERVICE_ACCOUNT?.trim();
  if (raw) {
    const parsed = parseServiceAccount(raw);
    if (parsed.json) return { source: 'DRIVE_SERVICE_ACCOUNT', error: null };
    return { source: remoteConfigFromEnv() ? 'FIREBASE_SERVICE_ACCOUNT' : null, error: `DRIVE_SERVICE_ACCOUNT está mal guardada: ${parsed.error}. Por eso se está usando la cuenta de Firebase.` };
  }
  return { source: remoteConfigFromEnv() ? 'FIREBASE_SERVICE_ACCOUNT' : null, error: null };
}

export function serviceAccountProject(): string | null {
  return driveAccountConfig()?.projectId || null;
}

export function serviceAccountEmail(): string | null {
  return driveAccountConfig()?.clientEmail || null;
}

export async function serviceAccountToken(scope: string): Promise<string> {
  const cfg = driveAccountConfig();
  if (!cfg) throw new Error('NO_SERVICE_ACCOUNT');
  const cacheKey = `${cfg.clientEmail}|${scope}`;
  const hit = scopeTokens.get(cacheKey);
  if (hit && Date.now() < hit.exp - 60_000) return hit.value;
  const key = await importPKCS8(cfg.privateKey, 'RS256');
  const jwt = await new SignJWT({ scope })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(cfg.clientEmail)
    .setSubject(cfg.clientEmail)
    .setAudience(cfg.tokenUrl)
    .setIssuedAt()
    .setExpirationTime('55m')
    .sign(key);
  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
    signal: AbortSignal.timeout(15000)
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new Error(`Google no entregó el token (${res.status}): ${data?.error_description || data?.error || ''}`);
  scopeTokens.set(cacheKey, { value: data.access_token, exp: Date.now() + (Number(data.expires_in) || 3600) * 1000 });
  return data.access_token;
}
