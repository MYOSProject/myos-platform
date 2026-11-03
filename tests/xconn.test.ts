import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import type { AddressInfo } from 'node:net';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'myos-x-'));
process.env.AUTH_MODE = 'dev';
process.env.DATA_FILE = path.join(tmp, 'db.json');
process.env.SEED_DEMO_DATA = 'false';
process.env.GEMINI_API_KEY = 'test-key-1234567890abcdef';
process.env.RATE_LIMIT_SCALE = '1000';
process.env.CONNECTIONS_KEY = 'clave-de-prueba-muy-larga-1234';
delete process.env.APPROVER_EMAILS;
delete process.env.MAKE_WEBHOOK_URL;

const { createApp } = await import('../server/app.ts');
const { getStore } = await import('../server/store.ts');
const { oauth1Header } = await import('../server/publisher.ts');

// "X" simulada
const calls: Array<{ method: string; url: string; auth: string; body: string }> = [];
const xmock = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    calls.push({ method: req.method || '', url: req.url || '', auth: String(req.headers.authorization || ''), body: raw });
    res.setHeader('Content-Type', 'application/json');
    if (!String(req.headers.authorization || '').startsWith('OAuth ')) { res.statusCode = 401; return res.end(JSON.stringify({ title: 'Unauthorized' })); }
    if (req.method === 'GET' && req.url === '/2/users/me') return res.end(JSON.stringify({ data: { id: '1', username: 'donpastor' } }));
    if (req.method === 'POST' && req.url === '/2/tweets') return res.end(JSON.stringify({ data: { id: '1850000000000000001', text: 'ok' } }));
    res.statusCode = 404; res.end('{}');
  });
});
await new Promise<void>((r) => xmock.listen(0, '127.0.0.1', r));
process.env.X_API_BASE = `http://127.0.0.1:${(xmock.address() as AddressInfo).port}`;

let server: import('http').Server;
let base = '';
before(async () => {
  server = await new Promise((resolve) => { const x = createApp().listen(0, '127.0.0.1', () => resolve(x)); });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  await new Promise((r) => server.close(r));
  await new Promise((r) => xmock.close(r));
  getStore().flush();
  fs.rmSync(tmp, { recursive: true, force: true });
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
  return { status: res.status, json, text };
}

test('X: la firma OAuth 1.0a coincide con el ejemplo oficial de la documentación', () => {
  const h = oauth1Header('POST', 'https://api.twitter.com/1.1/statuses/update.json?include_entities=true',
    { ck: 'xvz1evFS4wEEPTGEFPHBog', cs: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw', at: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb', as: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE' },
    'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg', '1318622958', [['status', 'Hello Ladies + Gentlemen, a signed OAuth request!']]);
  assert.match(h, /oauth_signature="hCtSmYh%2BiHYCEqBWrE7C7hYmtUk%3D"/);
});

test('X: las llaves se guardan cifradas, se prueba la conexión y solo publica tras aprobar y activar', async () => {
  const [p] = (await api('GET', '/api/projects')).json.projects;
  const bad = await api('PUT', '/api/connections', { project: p.id, body: { x_handle: 'no es válido!' } });
  assert.equal(bad.status, 400);

  const keys = { x_api_key: 'ClaveApiXXXXXXXXXXXX', x_api_secret: 'SecretoApiXXXXXXXXXXXXXXXXXXXX', x_access_token: '12345-TokenAccesoXXXXXXXX', x_access_secret: 'SecretoAccesoXXXXXXXXXXXXXXXX' };
  const put = await api('PUT', '/api/connections', { project: p.id, body: { x_handle: '@donpastor', ...keys } });
  assert.equal(put.status, 200, put.text);
  assert.equal(put.json.x_handle, 'donpastor');
  assert.equal(put.json.x_has_keys, true);
  for (const v of Object.values(keys)) assert.ok(!put.text.includes(v), 'las llaves no vuelven al navegador');
  const raw = JSON.stringify(getStore().connections[String(p.id)]);
  for (const v of Object.values(keys)) assert.ok(!raw.includes(v), 'las llaves no están en claro en el almacén');

  const t = await api('POST', '/api/connections/test', { project: p.id });
  assert.equal(t.status, 200, t.text);
  assert.equal(t.json.result.ok, true);
  assert.equal(t.json.result.x, '@donpastor');

  // publicación: nunca sin aprobar
  const post = (await api('POST', '/api/social', { project: p.id, body: { platform: 'x', copy: 'Hoy hay pastor recién cortado', hashtags: '#tacos' } })).json;
  assert.equal((await api('POST', `/api/social/${post.id}/publish`, { project: p.id })).status, 409);
  await api('POST', `/api/social/${post.id}/submit`, { project: p.id });
  await api('POST', `/api/social/${post.id}/approve`, { project: p.id, body: { confirm_review: true } });

  const before = calls.filter((c) => c.method === 'POST').length;
  const dry = await api('POST', `/api/social/${post.id}/publish`, { project: p.id });
  assert.equal(dry.json.status, 'APPROVED', 'sin activar sigue en simulación');
  assert.equal(calls.filter((c) => c.method === 'POST').length, before, 'no se envió nada a X');

  assert.equal((await api('POST', '/api/connections/live', { project: p.id, body: { live: true } })).json.live, true);
  const real = await api('POST', `/api/social/${post.id}/publish`, { project: p.id });
  assert.equal(real.status, 200, real.text);
  assert.equal(real.json.status, 'PUBLISHED');
  assert.equal(real.json.publish_result.mode, 'x-api');
  assert.equal(real.json.publish_result.external_id, '1850000000000000001');
  const sent = calls.filter((c) => c.method === 'POST').at(-1)!;
  assert.equal(sent.url, '/2/tweets');
  assert.match(sent.auth, /^OAuth .*oauth_signature=/);
  assert.equal(JSON.parse(sent.body).text, 'Hoy hay pastor recién cortado\n\n#tacos');
});
