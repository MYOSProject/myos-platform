import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'myos-plan-'));
process.env.AUTH_MODE = 'dev';
process.env.DATA_FILE = path.join(tmp, 'db.json');
process.env.SEED_DEMO_DATA = 'false';
process.env.GEMINI_API_KEY = 'test-key-1234567890abcdef';
process.env.RATE_LIMIT_SCALE = '1000';
delete process.env.APPROVER_EMAILS;

const { createApp } = await import('../server/app.ts');
const { getStore } = await import('../server/store.ts');

let server: import('http').Server;
let base = '';
before(async () => {
  server = await new Promise((resolve) => { const x = createApp().listen(0, '127.0.0.1', () => resolve(x)); });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  await new Promise((r) => server.close(r));
  getStore().flush();
  fs.rmSync(tmp, { recursive: true, force: true });
});

async function api(method: string, p: string, opts: { project?: number; body?: any } = {}) {
  const res = await fetch(base + p, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-dev-user': 'ana@merkatics.com', ...(opts.project ? { 'x-project-id': String(opts.project) } : {}) },
    body: opts.body !== undefined && method !== 'GET' ? JSON.stringify(opts.body) : undefined
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* no json */ }
  return { status: res.status, json, text };
}
const PX = 'data:image/jpeg;base64,' + Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(900, 7), Buffer.from([0xff, 0xd9])]).toString('base64');
const planOf = async (id: number) => (await api('GET', '/api/projects')).json.projects.find((x: any) => x.id === id).plan;

test('plan: por defecto es Gratis y se cambia a Pro; valores raros se rechazan o ignoran', async () => {
  const [p] = (await api('GET', '/api/projects')).json.projects;
  assert.notEqual(p.plan, 'pro');
  const r = await api('PUT', `/api/projects/${p.id}`, { body: { plan: 'pro' } });
  assert.equal(r.status, 200, r.text);
  assert.equal(await planOf(p.id), 'pro');
  await api('PUT', `/api/projects/${p.id}`, { body: { plan: 'oro' } });
  assert.ok(['free', 'pro'].includes(await planOf(p.id)));
  await api('PUT', `/api/projects/${p.id}`, { body: { plan: 'free' } });
});

test('marca de agua: solo Facebook/Instagram en plan Gratis; cambiar de plan marca la imagen como desactualizada', async () => {
  const [p] = (await api('GET', '/api/projects')).json.projects;
  await api('PUT', `/api/projects/${p.id}`, { body: { plan: 'free' } });
  const ig = (await api('POST', '/api/social', { project: p.id, body: { platform: 'instagram', copy: 'Hola', tone: 'casual' } })).json;
  const li = (await api('POST', '/api/social', { project: p.id, body: { platform: 'linkedin', copy: 'Hola' } })).json;
  assert.equal(ig.tone, 'casual');
  assert.equal(ig.wm_needed, true);
  assert.equal(li.wm_needed, false);

  const up = await api('POST', `/api/social/${ig.id}/image`, { project: p.id, body: { data_url: PX, watermark: true } });
  assert.equal(up.status, 200, up.text);
  assert.equal(up.json.image_wm, true);
  assert.equal(up.json.wm_stale, false);

  await api('PUT', `/api/projects/${p.id}`, { body: { plan: 'pro' } });
  const list = (await api('GET', '/api/social', { project: p.id })).json;
  const row = (Array.isArray(list) ? list : list.posts).find((x: any) => x.id === ig.id);
  assert.equal(row.wm_needed, false);
  assert.equal(row.wm_stale, true, 'la imagen tiene marca pero ya no hace falta');
});

test('tono: se guarda al crear, se ignora si no existe y el guion de video valida el tema', async () => {
  const [p] = (await api('GET', '/api/projects')).json.projects;
  const a = (await api('POST', '/api/social', { project: p.id, body: { platform: 'facebook', copy: 'Hola', tone: 'divertido' } })).json;
  assert.equal(a.tone, 'divertido');
  const b = (await api('POST', '/api/social', { project: p.id, body: { platform: 'facebook', copy: 'Hola', tone: 'inventado' } })).json;
  assert.ok(!b.tone);
  const v = await api('POST', '/api/video/script', { project: p.id, body: { topic: '' } });
  assert.ok(v.status >= 400 && v.status < 500, v.text);
});
