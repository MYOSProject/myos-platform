import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { geminiOk, startMockGemini } from './helpers.ts';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'myos-proj-'));
process.env.AUTH_MODE = 'dev';
process.env.DATA_FILE = path.join(tmp, 'db.json');
process.env.SEED_DEMO_DATA = 'false';
process.env.GEMINI_API_KEY = 'test-key-1234567890abcdef';
process.env.RATE_LIMIT_SCALE = '1000';
process.env.CONNECTIONS_KEY = 'clave-de-prueba-muy-larga-1234';
delete process.env.APPROVER_EMAILS;
delete process.env.MAKE_WEBHOOK_URL;
delete process.env.META_PAGE_ACCESS_TOKEN;

const { createApp } = await import('../server/app.ts');
const { getStore } = await import('../server/store.ts');

let script: (body: any) => { status: number; body: any } = () => geminiOk({});
const gemini = await startMockGemini((req) => script(req.body));
process.env.GEMINI_BASE_URL = gemini.url;

// "Meta" simulada
const metaCalls: Array<{ method: string; url: string; body: string }> = [];
const metaMock = await startMockGemini(() => ({ status: 200, body: {} }));
const http = await import('node:http');
const meta = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    metaCalls.push({ method: req.method || '', url: req.url || '', body: raw });
    res.setHeader('Content-Type', 'application/json');
    if (req.url?.includes('access_token=malo') || raw.includes('access_token=malo')) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: { message: 'Invalid OAuth access token.' } }));
    }
    if (req.method === 'GET' && req.url?.includes('/111222333?')) return res.end(JSON.stringify({ name: 'Taquería Don Pastor', id: '111222333' }));
    if (req.method === 'GET' && req.url?.includes('/999888777?')) return res.end(JSON.stringify({ username: 'donpastor' }));
    if (req.method === 'POST' && req.url?.includes('/111222333/feed')) return res.end(JSON.stringify({ id: '111222333_555' }));
    res.statusCode = 404;
    res.end(JSON.stringify({ error: { message: 'no mock for ' + req.url } }));
  });
});
await new Promise<void>((r) => meta.listen(0, '127.0.0.1', r));
process.env.META_GRAPH_BASE = `http://127.0.0.1:${(meta.address() as AddressInfo).port}`;

let server: import('http').Server;
let base = '';
before(async () => {
  server = await new Promise((resolve) => { const x = createApp().listen(0, '127.0.0.1', () => resolve(x)); });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  await new Promise((r) => server.close(r));
  await new Promise((r) => meta.close(r));
  await metaMock.close();
  await gemini.close();
  getStore().flush();
  fs.rmSync(tmp, { recursive: true, force: true });
});

const ANA = 'ana@merkatics.com';
const LUIS = 'luis@merkatics.com';
async function api(method: string, p: string, opts: { user?: string; project?: number; body?: any } = {}) {
  const res = await fetch(base + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(opts.user ? { 'x-dev-user': opts.user } : {}), ...(opts.project ? { 'x-project-id': String(opts.project) } : {}) },
    body: opts.body !== undefined && method !== 'GET' ? JSON.stringify(opts.body) : undefined
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* no json */ }
  return { status: res.status, json, text };
}
const POST = (platform = 'facebook', copy = 'Texto de prueba') => ({ platform, copy, hashtags: '', cta: 'Pide ya' });

test('primera vez: se crea "Mi primer proyecto" y se migra lo que ya existía', async () => {
  // Datos de antes de que existieran los proyectos
  const store = getStore();
  store.profiles[ANA] = { ...(store.profiles[ANA] || {}), business_name: 'Negocio viejo' } as any;
  const old = await api('POST', '/api/social', { user: ANA, body: POST() });
  assert.equal(old.status, 201);

  const r = await api('GET', '/api/projects', { user: ANA });
  assert.equal(r.status, 200);
  assert.equal(r.json.projects.length, 1);
  assert.equal(r.json.projects[0].name, 'Mi primer proyecto');
  assert.equal(r.json.projects[0].business_name, 'Negocio viejo');
  assert.equal(r.json.projects[0].posts, 1);
  const pid = r.json.projects[0].id;
  const prof = await api('GET', '/api/profile', { user: ANA, project: pid });
  assert.equal(prof.json.profile.business_name, 'Negocio viejo');
});

test('cada proyecto tiene su propio perfil, recorrido y publicaciones; y cada persona solo ve los suyos', async () => {
  const [p1] = (await api('GET', '/api/projects', { user: ANA })).json.projects;
  const c = await api('POST', '/api/projects', { user: ANA, body: { name: '  <b>Cafetería Luna</b> ', description: 'Segundo cliente' } });
  assert.equal(c.status, 201);
  assert.equal(c.json.project.name, 'Cafetería Luna');
  const p2 = c.json.project;

  await api('PUT', '/api/profile', { user: ANA, project: p2.id, body: { business_name: 'Cafetería Luna' } });
  assert.equal((await api('GET', '/api/profile', { user: ANA, project: p1.id })).json.profile.business_name, 'Negocio viejo');
  assert.equal((await api('GET', '/api/profile', { user: ANA, project: p2.id })).json.profile.business_name, 'Cafetería Luna');

  await api('PUT', '/api/guide/negocio', { user: ANA, project: p2.id, body: { answers: { business_name: 'Cafetería Luna', what_they_do: 'Café de especialidad' } } });
  const g1 = (await api('GET', '/api/guide', { user: ANA, project: p1.id })).json;
  const g2 = (await api('GET', '/api/guide', { user: ANA, project: p2.id })).json;
  assert.equal(g1.steps[0].state.answers.what_they_do ?? '', '');
  assert.equal(g2.steps[0].state.answers.what_they_do, 'Café de especialidad');

  const mine = await api('POST', '/api/social', { user: ANA, project: p2.id, body: POST('facebook', 'Café nuevo') });
  assert.equal(mine.json.project_id, p2.id);
  assert.deepEqual((await api('GET', '/api/social', { user: ANA, project: p2.id })).json.map((p: any) => p.copy), ['Café nuevo']);
  assert.equal((await api('GET', '/api/social', { user: ANA, project: p1.id })).json.length, 1);

  // Otra persona no ve ni usa los proyectos de Ana
  assert.equal((await api('GET', '/api/projects', { user: LUIS })).json.projects.length, 1);
  assert.equal((await api('GET', '/api/profile', { user: LUIS, project: p2.id })).status, 404);
  assert.equal((await api('PUT', `/api/projects/${p2.id}`, { user: LUIS, body: { name: 'robado' } })).status, 404);
  assert.equal((await api('GET', '/api/profile', { user: ANA, project: 99999 })).status, 404);
});

test('renombrar y borrar: no se borra un proyecto con contenido aprobado', async () => {
  const { projects } = (await api('GET', '/api/projects', { user: ANA })).json;
  const p2 = projects.find((p: any) => p.name === 'Cafetería Luna');
  const ren = await api('PUT', `/api/projects/${p2.id}`, { user: ANA, body: { name: 'Café Luna' } });
  assert.ok(ren.json.projects.some((p: any) => p.name === 'Café Luna'));
  assert.equal((await api('POST', '/api/projects', { user: ANA, body: { name: '   ' } })).status, 400);

  const p1 = projects.find((p: any) => p.name === 'Mi primer proyecto');
  const post = (await api('POST', '/api/social', { user: ANA, project: p1.id, body: POST() })).json;
  await api('POST', `/api/social/${post.id}/submit`, { user: ANA, project: p1.id });
  assert.equal((await api('POST', `/api/social/${post.id}/approve`, { user: ANA, project: p1.id, body: { confirm_review: true } })).status, 200);
  const del = await api('DELETE', `/api/projects/${p1.id}`, { user: ANA });
  assert.equal(del.status, 409);
  assert.equal(del.json.error.code, 'HAS_APPROVED_CONTENT');

  const del2 = await api('DELETE', `/api/projects/${p2.id}`, { user: ANA });
  assert.equal(del2.status, 200);
  assert.ok(!del2.json.projects.some((p: any) => p.id === p2.id));
});

test('cualquier usuario puede aprobar y publicar contenido que creó otra persona; queda registrado quién', async () => {
  const [p] = (await api('GET', '/api/projects', { user: ANA })).json.projects;
  const post = (await api('POST', '/api/social', { user: ANA, project: p.id, body: POST('facebook', 'Para que lo apruebe otra persona') })).json;
  await api('POST', `/api/social/${post.id}/submit`, { user: ANA, project: p.id });
  const ok = await api('POST', `/api/social/${post.id}/approve`, { user: LUIS, body: { confirm_review: true } });
  assert.equal(ok.status, 200, ok.text);
  assert.equal(ok.json.approved_by_email, LUIS);
});

test('conexión a Meta: el token se guarda cifrado y nunca se devuelve; sin probar no se puede activar', async () => {
  const [p] = (await api('GET', '/api/projects', { user: ANA })).json.projects;
  assert.equal((await api('GET', '/api/connections', { user: ANA })).status, 400, 'sin proyecto activo');

  const bad = await api('PUT', '/api/connections', { user: ANA, project: p.id, body: { page_id: 'abc' } });
  assert.equal(bad.status, 400);

  const t = 'EAAB' + 'x'.repeat(60);
  const put = await api('PUT', '/api/connections', { user: ANA, project: p.id, body: { page_id: '111222333', ig_user_id: '999888777', page_token: t } });
  assert.equal(put.status, 200, put.text);
  assert.equal(put.json.has_token, true);
  assert.ok(!put.text.includes(t), 'el token no vuelve al navegador');
  assert.match(put.json.token_hint, /^…xxxx$/);
  const raw = JSON.stringify(getStore().connections[String(p.id)]);
  assert.ok(!raw.includes(t), 'el token no está en claro en el almacén');

  const early = await api('POST', '/api/connections/live', { user: ANA, project: p.id, body: { live: true } });
  assert.equal(early.status, 409);
  assert.equal(early.json.error.code, 'NOT_TESTED');

  const test = await api('POST', '/api/connections/test', { user: ANA, project: p.id });
  assert.equal(test.status, 200, test.text);
  assert.equal(test.json.result.ok, true);
  assert.equal(test.json.result.facebook, 'Taquería Don Pastor');
  assert.equal(test.json.result.instagram, '@donpastor');
  assert.equal(test.json.tested_ok, true);
});

test('publicación: sin activar queda en simulación; activada publica en la página del proyecto (solo tras aprobar)', async () => {
  const [p] = (await api('GET', '/api/projects', { user: ANA })).json.projects;
  const post = (await api('POST', '/api/social', { user: ANA, project: p.id, body: POST('facebook', 'Hoy hay pastor') })).json;

  // Nunca sin aprobar
  assert.equal((await api('POST', `/api/social/${post.id}/publish`, { user: ANA, project: p.id })).status, 409);
  await api('POST', `/api/social/${post.id}/submit`, { user: ANA, project: p.id });
  await api('POST', `/api/social/${post.id}/approve`, { user: ANA, project: p.id, body: { confirm_review: true } });

  const before = metaCalls.filter((c) => c.method === 'POST').length;
  const dry = await api('POST', `/api/social/${post.id}/publish`, { user: ANA, project: p.id });
  assert.equal(dry.status, 200, dry.text);
  assert.equal(dry.json.status, 'APPROVED', 'simulación: no se marca como publicada');
  assert.ok(dry.json.last_dry_run);
  assert.equal(metaCalls.filter((c) => c.method === 'POST').length, before, 'no se envió nada a Meta');

  const live = await api('POST', '/api/connections/live', { user: ANA, project: p.id, body: { live: true } });
  assert.equal(live.json.live, true);
  const real = await api('POST', `/api/social/${post.id}/publish`, { user: ANA, project: p.id });
  assert.equal(real.status, 200, real.text);
  assert.equal(real.json.status, 'PUBLISHED');
  assert.equal(real.json.publish_result.external_id, '111222333_555');
  const sent = metaCalls.filter((c) => c.method === 'POST').at(-1)!;
  assert.match(sent.url, /\/111222333\/feed/);
  assert.equal(new URLSearchParams(sent.body).get('message'), 'Hoy hay pastor');

  // Cambiar el token apaga la publicación real hasta volver a probar
  const t2 = 'EAAB' + 'y'.repeat(60);
  const put = await api('PUT', '/api/connections', { user: ANA, project: p.id, body: { page_token: t2 } });
  assert.equal(put.json.live, false);
  assert.equal(put.json.tested_ok, null);
});

test('token inválido: la prueba falla con el motivo y no deja activar', async () => {
  const c = await api('POST', '/api/projects', { user: LUIS, body: { name: 'Luis' } });
  const pid = c.json.project.id;
  await api('PUT', '/api/connections', { user: LUIS, project: pid, body: { page_id: '111222333', page_token: 'malo' + 'z'.repeat(30) } });
  const t = await api('POST', '/api/connections/test', { user: LUIS, project: pid });
  assert.equal(t.json.result.ok, false);
  assert.match(t.json.test_note, /Invalid OAuth/);
  assert.equal((await api('POST', '/api/connections/live', { user: LUIS, project: pid, body: { live: true } })).status, 409);
});

test('otra persona no puede tocar la conexión de un proyecto ajeno', async () => {
  const [p] = (await api('GET', '/api/projects', { user: ANA })).json.projects;
  assert.equal((await api('GET', '/api/connections', { user: LUIS, project: p.id })).status, 404);
});

test('regenerar: otra versión distinta, con historial para volver atrás; una publicada genera borrador nuevo', async () => {
  const [p] = (await api('GET', '/api/projects', { user: ANA })).json.projects;
  const post = (await api('POST', '/api/social', { user: ANA, project: p.id, body: POST('facebook', 'Versión uno') })).json;
  script = (body) => {
    assert.match(JSON.stringify(body.contents), /Versión uno/);
    assert.match(body.systemInstruction.parts[0].text, /SOLO ese cambio/);
    assert.match(JSON.stringify(body.contents), /DISTINTA/);
    return geminiOk({ copy: 'Versión dos', hashtags: '', cta: 'Pide ya', headline: 'Dos', subheadline: 'Apoyo' });
  };
  const r = await api('POST', `/api/social/${post.id}/regenerate`, { user: ANA, project: p.id });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.copy, 'Versión dos');
  assert.equal(r.json.versions.length, 1);
  assert.equal(r.json.versions[0].copy, 'Versión uno');

  const back = await api('POST', `/api/social/${post.id}/restore`, { user: ANA, project: p.id, body: { index: 0 } });
  assert.equal(back.status, 200, back.text);
  assert.equal(back.json.copy, 'Versión uno');
  assert.equal(back.json.status, 'DRAFT');
  assert.equal(back.json.versions.at(-1).copy, 'Versión dos', 'la versión de la que vuelves también se conserva');
  assert.equal((await api('POST', `/api/social/${post.id}/restore`, { user: ANA, project: p.id, body: { index: 99 } })).status, 404);
});
