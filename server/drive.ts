// Google Drive como fuente central: la carpeta del proyecto se comparte con la cuenta de servicio y MYOS
//   1) crea la estructura (Marca, Sitio_Web, Redes_Sociales, Calendario),
//   2) lee los documentos de texto que la persona deja ahí y los usa como contexto de la IA,
//   3) mueve lo ya leído a «Procesados» y
//   4) guarda en Redes_Sociales/Publicado la evidencia de lo publicado (si Drive lo permite).
// Todo lo que viene de Drive es información de terceros: entra a los prompts como DATO, nunca como instrucciones.
import { HttpError } from './http.js';
import { serviceAccountEmail, serviceAccountToken } from './remote.js';
import type { Store } from './store.js';
import type { AuthUser, DriveConfig, DriveNote, SocialPost } from './types.js';

const SCOPE = 'https://www.googleapis.com/auth/drive';
const FOLDER = 'application/vnd.google-apps.folder';
const WATCHED = ['Marca', 'Sitio_Web', 'Redes_Sociales', 'Calendario'] as const;
const MAX_FILES = 15;
const MAX_CHARS = 20_000;
const MAX_NOTES = 40;

const base = () => (process.env.DRIVE_BASE || 'https://www.googleapis.com').replace(/\/+$/, '');

export function driveAvailable(): boolean {
  return Boolean(serviceAccountEmail());
}

async function call(method: string, path: string, opts: { query?: Record<string, string>; body?: unknown; raw?: BodyInit; headers?: Record<string, string>; text?: boolean } = {}): Promise<any> {
  let token: string;
  try {
    token = await serviceAccountToken(SCOPE);
  } catch (e: any) {
    if (e?.message === 'NO_SERVICE_ACCOUNT') throw new HttpError(503, 'DRIVE_NOT_CONFIGURED', 'Drive necesita la cuenta de servicio: define FIREBASE_SERVICE_ACCOUNT en Vercel.');
    throw new HttpError(502, 'DRIVE_AUTH', `No se pudo entrar a Google Drive: ${e?.message || e}`);
  }
  const url = new URL(base() + path);
  for (const [k, v] of Object.entries({ supportsAllDrives: 'true', ...(opts.query || {}) })) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) },
    body: opts.raw ?? (opts.body ? JSON.stringify(opts.body) : undefined),
    signal: AbortSignal.timeout(20000)
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text.slice(0, 200);
    try { msg = JSON.parse(text)?.error?.message || msg; } catch { /* no json */ }
    const mail = serviceAccountEmail();
    if (res.status === 404) throw new HttpError(404, 'DRIVE_NOT_FOUND', `No encuentro esa carpeta o archivo. Comparte la carpeta con ${mail} (como Editor) e inténtalo otra vez.`);
    if (res.status === 403 && /has not been used|disabled|accessNotConfigured/i.test(msg + text)) throw new HttpError(503, 'DRIVE_API_DISABLED', 'La API de Google Drive no está activada en tu proyecto de Google Cloud. Actívala en console.cloud.google.com/apis/library/drive.googleapis.com');
    if (res.status === 403) throw new HttpError(403, 'DRIVE_FORBIDDEN', `Drive no permitió la acción (${msg}). Revisa que ${mail} sea Editor de la carpeta.`);
    throw new HttpError(502, 'DRIVE_ERROR', `Drive respondió ${res.status}: ${msg}`);
  }
  if (opts.text) return text;
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}

export function parseFolderId(input: unknown): string {
  const raw = typeof input === 'string' ? input.trim() : '';
  const m = raw.match(/\/folders\/([A-Za-z0-9_-]{10,})/) || raw.match(/[?&]id=([A-Za-z0-9_-]{10,})/) || (/^[A-Za-z0-9_-]{10,}$/.test(raw) ? [raw, raw] : null);
  if (!m) throw new HttpError(400, 'BAD_FOLDER', 'Pega el enlace de la carpeta de Drive (o su id).');
  return m[1];
}

interface DriveFile { id: string; name: string; mimeType: string }

async function list(parent: string): Promise<DriveFile[]> {
  const out: DriveFile[] = [];
  let pageToken = '';
  do {
    const r = await call('GET', '/drive/v3/files', {
      query: { q: `'${parent}' in parents and trashed = false`, fields: 'nextPageToken,files(id,name,mimeType)', pageSize: '100', includeItemsFromAllDrives: 'true', ...(pageToken ? { pageToken } : {}) }
    });
    out.push(...(r?.files || []));
    pageToken = r?.nextPageToken || '';
  } while (pageToken && out.length < 300);
  return out;
}

async function ensureFolder(parent: string, name: string, existing?: DriveFile[]): Promise<string> {
  const kids = existing ?? (await list(parent));
  const hit = kids.find((f) => f.mimeType === FOLDER && f.name === name);
  if (hit) return hit.id;
  const r = await call('POST', '/drive/v3/files', { query: { fields: 'id' }, body: { name, mimeType: FOLDER, parents: [parent] } });
  return r.id;
}

/** Crea lo que falte. Devuelve ruta lógica -> id de carpeta. */
async function ensureStructure(rootId: string): Promise<Record<string, string>> {
  const folders: Record<string, string> = {};
  const rootKids = await list(rootId);
  for (const name of WATCHED) {
    const id = await ensureFolder(rootId, name, rootKids);
    folders[name] = id;
    const kids = await list(id);
    folders[`${name}/Procesados`] = await ensureFolder(id, 'Procesados', kids);
    if (name === 'Redes_Sociales') {
      folders['Redes_Sociales/Para_Publicar'] = await ensureFolder(id, 'Para_Publicar', kids);
      folders['Redes_Sociales/Publicado'] = await ensureFolder(id, 'Publicado', kids);
    }
  }
  return folders;
}

const clean = (t: string) => t.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\r\n/g, '\n').trim().slice(0, MAX_CHARS);

async function readText(f: DriveFile): Promise<string | null> {
  if (f.mimeType === 'application/vnd.google-apps.document') return clean(await call('GET', `/drive/v3/files/${f.id}/export`, { query: { mimeType: 'text/plain' }, text: true }));
  if (f.mimeType === 'application/vnd.google-apps.spreadsheet') return clean(await call('GET', `/drive/v3/files/${f.id}/export`, { query: { mimeType: 'text/csv' }, text: true }));
  if (f.mimeType.startsWith('text/') || f.mimeType === 'application/json') return clean(await call('GET', `/drive/v3/files/${f.id}`, { query: { alt: 'media' }, text: true }));
  return null;
}

export function driveView(store: Store, projectId: number | null | undefined) {
  const d = projectId ? store.drive[String(projectId)] : undefined;
  return {
    available: driveAvailable(),
    service_account_email: serviceAccountEmail(),
    connected: Boolean(d),
    folder_id: d?.folder_id || '',
    folder_name: d?.folder_name || '',
    structure: d ? Object.keys(d.folders) : [],
    last_sync_at: d?.last_sync_at || null,
    last_sync_note: d?.last_sync_note || null,
    notes: (d?.notes || []).map((n) => ({ file_id: n.file_id, folder: n.folder, name: n.name, at: n.at, chars: n.text.length }))
  };
}

function need(user: AuthUser): number {
  if (!user.project_id) throw new HttpError(400, 'NO_PROJECT', 'No hay proyecto activo.');
  return user.project_id;
}

export async function connectDrive(store: Store, user: AuthUser, input: unknown): Promise<void> {
  const pid = need(user);
  const folderId = parseFolderId(input);
  const root = await call('GET', `/drive/v3/files/${folderId}`, { query: { fields: 'id,name,mimeType' } });
  if (root?.mimeType !== FOLDER) throw new HttpError(400, 'NOT_A_FOLDER', 'Ese enlace no es una carpeta.');
  const folders = await ensureStructure(folderId);
  const prev = store.drive[String(pid)];
  store.drive[String(pid)] = {
    folder_id: folderId,
    folder_name: String(root.name || ''),
    folders,
    last_sync_at: prev?.folder_id === folderId ? prev.last_sync_at : null,
    last_sync_note: prev?.folder_id === folderId ? prev.last_sync_note : null,
    notes: prev?.folder_id === folderId ? prev.notes : [],
    updated_at: new Date().toISOString(),
    updated_by: user.email
  };
  store.save();
}

export function disconnectDrive(store: Store, user: AuthUser): void {
  delete store.drive[String(need(user))];
  store.save();
}

/** Lee lo nuevo de las 4 carpetas, lo guarda como contexto y mueve lo leído a «Procesados». */
export async function syncDrive(store: Store, user: AuthUser): Promise<{ read: number; moved: number; skipped: string[]; note: string }> {
  const pid = need(user);
  const cfg = store.drive[String(pid)];
  if (!cfg) throw new HttpError(409, 'DRIVE_NOT_CONNECTED', 'Primero conecta la carpeta de Drive.');
  const notes = new Map<string, DriveNote>(cfg.notes.map((n) => [n.file_id, n]));
  const skipped: string[] = [];
  let read = 0;
  let moved = 0;
  for (const name of WATCHED) {
    const folderId = cfg.folders[name];
    const done = cfg.folders[`${name}/Procesados`];
    if (!folderId || !done) continue;
    const files = (await list(folderId)).filter((f) => f.mimeType !== FOLDER).slice(0, MAX_FILES);
    for (const f of files) {
      let text: string | null = null;
      try {
        text = await readText(f);
      } catch (e: any) {
        skipped.push(`${name}/${f.name} (no se pudo leer: ${e?.message || 'error'})`);
        continue;
      }
      if (text === null) { skipped.push(`${name}/${f.name} (tipo no legible: ${f.mimeType.split('/').pop()})`); continue; }
      if (!text) { skipped.push(`${name}/${f.name} (vacío)`); continue; }
      notes.set(f.id, { file_id: f.id, folder: name, name: f.name, text, at: new Date().toISOString() });
      read++;
      try {
        await call('PATCH', `/drive/v3/files/${f.id}`, { query: { addParents: done, removeParents: folderId, fields: 'id' }, body: {} });
        moved++;
      } catch (e: any) {
        skipped.push(`${name}/${f.name} (se leyó, pero no se pudo mover: ${e?.message || 'error'})`);
      }
    }
  }
  cfg.notes = [...notes.values()].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, MAX_NOTES);
  cfg.last_sync_at = new Date().toISOString();
  const note = read ? `Se leyeron ${read} archivos nuevos y se movieron ${moved} a «Procesados».` : 'No había archivos nuevos que leer.';
  cfg.last_sync_note = skipped.length ? `${note} Sin procesar: ${skipped.length}.` : note;
  store.save();
  return { read, moved, skipped, note: cfg.last_sync_note };
}

/** Texto de Drive para los prompts de la IA (dato de terceros: va entre comillas y se declara como información). */
export function driveForPrompt(store: Store, projectId: number | null | undefined): string {
  const d = projectId ? store.drive[String(projectId)] : undefined;
  if (!d?.notes.length) return '';
  let out = '';
  for (const n of d.notes) {
    const piece = `- [${n.folder}/${n.name}] ${n.text.replace(/\s+/g, ' ').slice(0, 1200)}\n`;
    if (out.length + piece.length > 6000) break;
    out += piece;
  }
  return out.trim();
}

/** Guarda en Redes_Sociales/Publicado la evidencia de lo publicado. Es opcional: si Drive no deja escribir, no estorba. */
export async function saveEvidence(store: Store, post: SocialPost): Promise<void> {
  const cfg = post.project_id ? store.drive[String(post.project_id)] : undefined;
  const folder = cfg?.folders['Redes_Sociales/Publicado'];
  if (!cfg || !folder || !driveAvailable()) return;
  try {
    const meta = { name: `${post.platform}_${post.id}_${(post.published_at || new Date().toISOString()).slice(0, 10)}.json`, parents: [folder], mimeType: 'application/json' };
    const content = JSON.stringify({ id: post.id, platform: post.platform, copy: post.copy, hashtags: post.hashtags, cta: post.cta, image_url: post.image_url, published_at: post.published_at, approved_by: post.approved_by_email, approved_at: post.approved_at, approval_hash: post.approved_hash, result: post.publish_result }, null, 2);
    const b = `myos${Date.now()}`;
    const body = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${b}--`;
    await call('POST', '/upload/drive/v3/files', { query: { uploadType: 'multipart', fields: 'id' }, raw: body, headers: { 'Content-Type': `multipart/related; boundary=${b}` } });
  } catch (e: any) {
    console.error(`[drive] no se pudo guardar la evidencia de la publicación #${post.id}: ${e?.message || e}`);
  }
}
