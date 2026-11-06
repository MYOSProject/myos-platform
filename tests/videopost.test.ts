import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { startMockGemini } from './helpers.ts';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'myos-vp-'));
process.env.AUTH_MODE = 'dev';
process.env.DATA_FILE = path.join(tmp, 'db.json');
process.env.VIDEO_LOCAL_DIR = path.join(tmp, 'videos');
process.env.SEED_DEMO_DATA = 'false';
process.env.GEMINI_API_KEY = 'test-key-1234567890abcdef';
process.env.RATE_LIMIT_SCALE = '1000';
delete process.env.APPROVER_EMAILS;
delete process.env.BLOB_READ_WRITE_TOKEN;

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

const ANA = 'ana@merkatics.com';
const LUIS = 'luis@merkatics.com';
async function api(method: string, p: string, opts: { user?: string; body?: any; raw?: Buffer; ctype?: string } = {}) {
  const res = await fetch(base + p, {
    method,
    headers: { 'Content-Type': opts.ctype || 'application/json', 'x-dev-user': opts.user || ANA },
    body: (opts.raw as any) ?? (opts.body !== undefined && method !== 'GET' ? JSON.stringify(opts.body) : undefined)
  });
  const text = await res.text();
  let json: any = null; try { json = JSON.parse(text); } catch { /* no json */ }
  return { status: res.status, json, text, res };
}
async function upload() {
  const r = await api('PUT', '/api/video/local/mp4', { raw: Buffer.from('fake-video-bytes'), ctype: 'video/mp4' });
  assert.equal(r.status, 200, r.text);
  return r.json.url as string;
}
async function approved(platform: string, video_url: string) {
  const p = (await api('POST', '/api/social', { body: { platform, copy: 'Mira nuestro video', hashtags: '#tacos', video_url, video_name: 'mi-video' } })).json;
  assert.equal(p.video_url, video_url);
  assert.equal((await api('POST', `/api/social/${p.id}/submit`)).status, 200);
  const ap = await api('POST', `/api/social/${p.id}/approve`, { user: LUIS, body: { confirm_review: true } });
  assert.equal(ap.status, 200, ap.text);
  return ap.json;
}

test('almacenamiento: en desarrollo guarda y sirve el video; la URL se acepta en una publicación', async () => {
  const st = (await api('GET', '/api/video/storage')).json;
  assert.equal(st.provider, 'local');
  const url = await upload();
  const got = await fetch(url);
  assert.equal(got.status, 200);
  assert.equal(Buffer.from(await got.arrayBuffer()).toString(), 'fake-video-bytes');
});

test('video en la publicación: solo URL del almacenamiento de MYOS; cambia el hash; Instagram no exige imagen', async () => {
  const url = await upload();
  const bad = await api('POST', '/api/social', { body: { platform: 'facebook', copy: 'x', video_url: 'https://evil.example.com/v.mp4' } });
  assert.equal(bad.status, 400);
  const a = (await api('POST', '/api/social', { body: { platform: 'instagram', copy: 'Reel', video_url: url } })).json;
  assert.ok(!a.problems.some((x: string) => /imagen/.test(x)), a.problems.join(' | '));
  const b = (await api('POST', '/api/social', { body: { platform: 'instagram', copy: 'Reel' } })).json;
  assert.ok(b.problems.some((x: string) => /imagen o un video/.test(x)));
  const { postHash } = await import('../server/social.ts');
  const noVid = { ...getStore().social.find((x) => x.id === a.id)!, video_url: undefined };
  assert.notEqual(postHash(getStore().social.find((x) => x.id === a.id)!), postHash(noVid as any));
  const quitado = await api('PUT', `/api/social/${a.id}`, { body: { video_url: '' } });
  assert.ok(!quitado.json.video_url);
});

test('publicar video en Facebook: usa /videos con file_url y la descripción', async () => {
  const calls: Array<{ url: string; body: string }> = [];
  const graph = await startMockGemini((req) => { calls.push({ url: req.url.split('?')[0], body: JSON.stringify(req.body) }); return { status: 200, body: { id: 'fb_vid_1' } }; });
  Object.assign(process.env, { META_GRAPH_BASE: graph.url, META_PAGE_ACCESS_TOKEN: 'tok', META_PAGE_ID: '999' });
  try {
    const post = await approved('facebook', await upload());
    const r = await api('POST', `/api/social/${post.id}/publish`, { user: LUIS });
    assert.equal(r.json.status, 'PUBLISHED', r.text);
    assert.equal(calls[0].url, '/v21.0/999/videos');
    assert.equal(new URLSearchParams(graph.requests[0].raw).get('file_url'), getStore().social.find((x) => x.id === post.id)!.video_url);
  } finally { for (const k of ['META_GRAPH_BASE', 'META_PAGE_ACCESS_TOKEN', 'META_PAGE_ID']) delete process.env[k]; await graph.close(); }
});

test('publicar Reel en Instagram: crea el contenedor REELS, y si sigue procesando se reintenta sin volver a subirlo', async () => {
  const calls: string[] = [];
  let status = 'IN_PROGRESS';
  const graph = await startMockGemini((req) => {
    calls.push(req.url.split('?')[0]);
    if (req.url.includes('/media_publish')) return { status: 200, body: { id: 'reel_1' } };
    if (req.url.endsWith('/media') || req.url.includes('/media?')) return { status: 200, body: { id: 'cont_9' } };
    return { status: 200, body: { status_code: status } };
  });
  Object.assign(process.env, { META_GRAPH_BASE: graph.url, META_POLL_MS: '1', META_VIDEO_POLLS: '2', META_PAGE_ACCESS_TOKEN: 'tok', META_IG_USER_ID: '1784' });
  try {
    const post = await approved('instagram', await upload());
    const r1 = await api('POST', `/api/social/${post.id}/publish`, { user: LUIS });
    assert.notEqual(r1.json.status, 'PUBLISHED');
    assert.match(JSON.stringify(r1.json), /sigue procesando/);
    const first = graph.requests.find((x) => x.url.includes('/1784/media'))!;
    const form = new URLSearchParams(first.raw);
    assert.equal(form.get('media_type'), 'REELS');
    assert.equal(form.get('video_url'), (getStore().social.find((x) => x.id === post.id)!).video_url);
    status = 'FINISHED';
    const r2 = await api('POST', `/api/social/${post.id}/publish`, { user: LUIS });
    assert.equal(r2.json.status, 'PUBLISHED', r2.text);
    assert.equal(calls.filter((c) => c.endsWith('/1784/media')).length, 1, 'el contenedor se reutiliza');
  } finally { for (const k of ['META_GRAPH_BASE', 'META_POLL_MS', 'META_VIDEO_POLLS', 'META_PAGE_ACCESS_TOKEN', 'META_IG_USER_ID']) delete process.env[k]; await graph.close(); }
});
