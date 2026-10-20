import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import type { AddressInfo } from 'node:net';

// --- Firestore y el servicio de tokens de Google, simulados ---
const docs = new Map<string, any>(); // ruta completa → documento
let tokenCalls = 0;
let failWrites = false;
const fake = http.createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8');
    res.setHeader('Content-Type', 'application/json');
    const url = new URL(req.url || '', 'http://x');
    if (url.pathname === '/token') {
      tokenCalls++;
      assert.match(raw, /grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer/);
      return res.end(JSON.stringify({ access_token: 'tok', expires_in: 3600 }));
    }
    if (req.headers.authorization !== 'Bearer tok') { res.statusCode = 401; return res.end('{}'); }
    const m = /^\/v1\/projects\/proj-x\/databases\/db-x\/documents\/([^/]+)(?:\/(.+))?$/.exec(url.pathname);
    if (!m) { res.statusCode = 404; return res.end('{}'); }
    const [, col, id] = m;
    const key = `${col}/${id ? decodeURIComponent(id) : ''}`;
    if (req.method === 'GET' && !id) {
      const prefix = `${col}/`;
      const list = [...docs.entries()].filter(([k]) => k.startsWith(prefix)).map(([k, v]) => ({ name: `projects/proj-x/databases/db-x/documents/${col}/${encodeURIComponent(k.slice(prefix.length))}`, fields: v }));
      return res.end(JSON.stringify(list.length ? { documents: list } : {}));
    }
    if (req.method === 'GET') { if (!docs.has(key)) { res.statusCode = 404; return res.end('{}'); } return res.end(JSON.stringify({ fields: docs.get(key) })); }
    if (req.method === 'PATCH') {
      if (failWrites) { res.statusCode = 500; return res.end(JSON.stringify({ error: { message: 'boom' } })); }
      const body = JSON.parse(raw);
      assert.ok(body.fields.json.stringValue.length <= 150_000, 'ningún documento pasa del límite');
      docs.set(key, body.fields); return res.end('{}');
    }
    if (req.method === 'DELETE') { docs.delete(key); return res.end('{}'); }
    res.statusCode = 405; res.end('{}');
  });
});
await new Promise<void>((r) => fake.listen(0, '127.0.0.1', r));
const fakeUrl = `http://127.0.0.1:${(fake.address() as AddressInfo).port}`;

const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
process.env.AUTH_MODE = 'dev';
delete process.env.DATA_FILE;
process.env.SEED_DEMO_DATA = 'false';
process.env.RATE_LIMIT_SCALE = '1000';
process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ project_id: 'proj-x', client_email: 'svc@proj-x.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) });
process.env.FIRESTORE_DATABASE_ID = 'db-x';
process.env.FIRESTORE_BASE = fakeUrl;
process.env.GOOGLE_TOKEN_URL = `${fakeUrl}/token`;

const { createApp } = await import('../server/app.ts');
const { getStore, resetStore } = await import('../server/store.ts');

let server: import('http').Server;
let base = '';
before(async () => {
  server = await new Promise((resolve) => { const x = createApp().listen(0, '127.0.0.1', () => resolve(x)); });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  await new Promise((r) => server.close(r));
  await new Promise((r) => fake.close(r));
});

const ANA = 'ana@merkatics.com';
async function api(method: string, p: string, opts: { project?: number; body?: any } = {}) {
  const res = await fetch(base + p, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-dev-user': ANA, ...(opts.project ? { 'x-project-id': String(opts.project) } : {}) },
    body: opts.body !== undefined && method !== 'GET' ? JSON.stringify(opts.body) : undefined
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* no json */ }
  return { status: res.status, json, text, headers: res.headers };
}
/** Simula una instancia nueva de la función serverless: memoria vacía, mismos datos en Firestore. */
const coldStart = () => resetStore(null);

test('se usa Firestore y nada se guarda en disco', async () => {
  assert.equal(getStore().persistence, 'firestore');
  const h = await api('GET', '/api/health');
  assert.equal(h.json.persistence, 'firestore');
});

test('lo que se crea sobrevive a un arranque en frío (proyectos, respuestas, publicaciones, imagen)', async () => {
  const p = (await api('POST', '/api/projects', { body: { name: 'Taquería Don Pastor' } })).json.project;
  await api('PUT', '/api/guide/negocio', { project: p.id, body: { answers: { business_name: 'Taquería Don Pastor', what_they_do: 'Tacos' } } });
  const post = (await api('POST', '/api/social', { project: p.id, body: { platform: 'facebook', copy: 'Hola desde Firestore', hashtags: '', cta: 'Pide ya' } })).json;
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), crypto.randomBytes(2000)]).toString('base64');
  const img = await api('POST', `/api/social/${post.id}/image`, { project: p.id, body: { data_url: `data:image/jpeg;base64,${jpeg}` } });
  assert.equal(img.status, 200, img.text);
  assert.ok(docs.size > 5, 'se escribieron documentos');
  assert.ok(docs.has('myos_rev/main'));

  coldStart();
  const list = await api('GET', '/api/projects');
  assert.equal(list.json.projects.length, 1);
  assert.equal(list.json.projects[0].name, 'Taquería Don Pastor');
  const g = await api('GET', '/api/guide', { project: p.id });
  assert.equal(g.json.steps[0].state.answers.what_they_do, 'Tacos');
  const posts = await api('GET', '/api/social', { project: p.id });
  assert.equal(posts.json.length, 1);
  assert.equal(posts.json[0].copy, 'Hola desde Firestore');
  assert.equal(posts.json[0].has_media, true);

  // La imagen se baja bajo demanda
  const media = await fetch(`${base}/api/social/${post.id}/image`, { headers: { 'x-dev-user': ANA, 'x-project-id': String(p.id) } });
  assert.equal(media.status, 200);
  assert.equal(Buffer.from(await media.arrayBuffer()).toString('base64'), jpeg);
});

test('otra instancia ve los cambios de esta (se recarga cuando cambia la versión)', async () => {
  const p = (await api('GET', '/api/projects')).json.projects[0];
  // "Otra instancia" escribe directamente en Firestore
  const store = getStore();
  const before = store.social.length;
  store.social.unshift({ ...store.social[0], id: 777, copy: 'Escrita por otra instancia' });
  store.save();
  await store.remote!.commit();
  // Esta instancia (otra memoria) aún no la conoce: se simula con arranque en frío y se comprueba que aparece
  coldStart();
  const posts = await api('GET', '/api/social', { project: p.id });
  assert.equal(posts.json.length, before + 1);
  assert.ok(posts.json.some((x: any) => x.copy === 'Escrita por otra instancia'));
});

test('borrar también borra en Firestore', async () => {
  const p = (await api('GET', '/api/projects')).json.projects[0];
  const draft = (await api('POST', '/api/social', { project: p.id, body: { platform: 'facebook', copy: 'Se va a borrar' } })).json;
  assert.ok([...docs.keys()].some((k) => k === `myos/social-${draft.id}~0`));
  assert.equal((await api('DELETE', `/api/social/${draft.id}`, { project: p.id })).status, 200);
  assert.ok(![...docs.keys()].some((k) => k === `myos/social-${draft.id}~0`));
});

test('piezas grandes se parten en varios documentos y se vuelven a juntar', async () => {
  const p = (await api('GET', '/api/projects')).json.projects[0];
  const big = 'ñ'.repeat(1_800_000); // más de 2 documentos
  await api('PUT', '/api/profile', { project: p.id, body: { notes: big.slice(0, 1100) } });
  const store = getStore();
  const k = Object.keys(store.profiles)[0];
  (store.profiles[k] as any).notes = big;
  store.save();
  await store.remote!.commit();
  const parts = [...docs.keys()].filter((x) => x.startsWith(`myos/profile-${k}~`));
  assert.ok(parts.length >= 10, `partes: ${parts.length}`);
  coldStart();
  const prof = await api('GET', '/api/profile', { project: p.id });
  assert.equal(prof.status, 200);
  assert.equal((getStore().profiles[k] as any).notes, big, 'se recompone completo desde los documentos partidos');
});

test('si Firestore falla al guardar, la respuesta es un error claro (no un falso "guardado")', async () => {
  const p = (await api('GET', '/api/projects')).json.projects[0];
  failWrites = true;
  try {
    const r = await api('POST', '/api/social', { project: p.id, body: { platform: 'facebook', copy: 'No se guardará' } });
    assert.equal(r.status, 503);
    assert.equal(r.json.error.code, 'DB_WRITE_FAILED');
  } finally {
    failWrites = false;
  }
});

test('el token de la cuenta de servicio se reutiliza', async () => {
  const before = tokenCalls;
  await api('GET', '/api/projects');
  await api('GET', '/api/projects');
  assert.ok(tokenCalls - before <= 1);
});
