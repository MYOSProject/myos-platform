import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { geminiError, geminiOk, startMockGemini } from './helpers.ts';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'myos-guide-'));
process.env.AUTH_MODE = 'dev';
process.env.DATA_FILE = path.join(tmp, 'db.json');
process.env.SEED_DEMO_DATA = 'false';
process.env.GEMINI_API_KEY = 'test-key-1234567890abcdef';
process.env.RATE_LIMIT_SCALE = '1000';
delete process.env.APPROVER_EMAILS;
delete process.env.MAKE_WEBHOOK_URL;
delete process.env.META_PAGE_ACCESS_TOKEN;

const { createApp } = await import('../server/app.ts');
const { getStore } = await import('../server/store.ts');

let script: (body: any) => { status: number; body: any } = () => geminiOk({});
const gemini = await startMockGemini((req) => script(req.body));
process.env.GEMINI_BASE_URL = gemini.url;

let server: import('http').Server;
let base = '';
before(async () => {
  server = await new Promise((resolve) => { const x = createApp().listen(0, '127.0.0.1', () => resolve(x)); });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  await new Promise((r) => server.close(r));
  await gemini.close();
  getStore().flush();
  fs.rmSync(tmp, { recursive: true, force: true });
});

const ANA = 'ana@merkatics.com';
const LUIS = 'luis@merkatics.com';
async function api(method: string, p: string, opts: { user?: string; body?: any } = {}) {
  const res = await fetch(base + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(opts.user ? { 'x-dev-user': opts.user } : {}) },
    body: opts.body !== undefined && method !== 'GET' ? JSON.stringify(opts.body) : undefined
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* no json */ }
  return { status: res.status, json, text };
}
const step = (v: any, k: string) => v.steps.find((s: any) => s.key === k);

const REPORT = { summary: 'Familias y oficinistas de Juárez que piden comida rápida y casera.', sections: [{ heading: 'Perfil', body: '- Familias\n- Oficinistas' }, { heading: 'Mensajes clave', body: 'Rápido y rico.' }] };

test('el recorrido exige sesión y muestra 8 pasos vacíos', async () => {
  assert.equal((await api('GET', '/api/guide')).status, 401);
  const r = await api('GET', '/api/guide', { user: ANA });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.steps.map((s: any) => s.key), ['negocio', 'catalogo', 'cliente', 'mercado', 'competencia', 'marca', 'foda', 'plan']);
  assert.equal(r.json.done, 0);
  assert.equal(r.json.complete, false);
});

test('paso 1: guarda respuestas, las pasa al perfil y la vista previa no usa IA', async () => {
  const before = gemini.requests.length;
  const g = await api('POST', '/api/guide/negocio/generate', { user: ANA, body: { answers: { business_name: 'Taquería Don Pastor', what_they_do: 'Tacos al pastor', location: 'Ciudad Juárez', value_proposition: '<b>Tortilla al momento</b>' } } });
  assert.equal(g.status, 200, g.text);
  assert.equal(gemini.requests.length, before, 'la ficha se arma localmente');
  const st = step(g.json, 'negocio').state;
  assert.equal(st.status, 'DRAFT');
  assert.equal(st.generated_by, 'local');
  assert.match(st.report.summary, /Taquería Don Pastor/);
  assert.ok(!JSON.stringify(st).includes('<b>'), 'sin HTML');
  const prof = await api('GET', '/api/profile', { user: ANA });
  assert.equal(prof.json.profile.business_name, 'Taquería Don Pastor');
  assert.equal(prof.json.profile.location, 'Ciudad Juárez');
});

test('no se puede generar con muy pocas respuestas ni confirmar sin vista previa', async () => {
  const g = await api('POST', '/api/guide/cliente/generate', { user: ANA, body: { answers: { audience: 'Familias' } } });
  assert.equal(g.status, 400);
  assert.equal(g.json.error.code, 'MORE_ANSWERS');
  assert.equal((await api('POST', '/api/guide/cliente/confirm', { user: ANA })).status, 409);
  assert.equal((await api('POST', '/api/guide/nada/confirm', { user: ANA })).status, 404);
});

test('paso con IA: genera vista previa, se puede editar y confirmar; cada persona tiene la suya', async () => {
  script = (body) => {
    const sys = body.systemInstruction.parts[0].text;
    assert.match(sys, /Cliente ideal/);
    assert.match(sys, /Nombre del negocio: Taquería Don Pastor/);
    assert.match(sys, /NUNCA inventes/);
    return geminiOk(REPORT);
  };
  const g = await api('POST', '/api/guide/cliente/generate', { user: ANA, body: { answers: { audience: 'Familias y oficinistas', problem: 'No tienen tiempo para cocinar' } } });
  assert.equal(g.status, 200, g.text);
  const st = step(g.json, 'cliente').state;
  assert.equal(st.generated_by, 'ai');
  assert.equal(st.report.sections.length, 2);
  assert.equal(st.status, 'DRAFT');

  const ed = await api('PUT', '/api/guide/cliente/report', { user: ANA, body: { summary: 'Familias de Juárez.', sections: [{ heading: 'Perfil', body: 'Solo familias' }] } });
  assert.equal(step(ed.json, 'cliente').state.report.sections.length, 1);

  const ok = await api('POST', '/api/guide/cliente/confirm', { user: ANA });
  assert.equal(step(ok.json, 'cliente').state.status, 'CONFIRMED');
  assert.match(step(ok.json, 'cliente').state.confirmed_by, /<ana@merkatics\.com>/);
  assert.equal(ok.json.done, 1);

  assert.equal(step((await api('GET', '/api/guide', { user: LUIS })).json, 'cliente').state.status, 'EMPTY');

  // Cambiar las respuestas deja el paso sin confirmar otra vez
  const again = await api('PUT', '/api/guide/cliente', { user: ANA, body: { answers: { problem: 'Otro problema' } } });
  assert.equal(step(again.json, 'cliente').state.status, 'DRAFT');
});

test('error de Gemini en un paso: mensaje claro y el paso no cambia', async () => {
  script = () => geminiError(429, 'Quota exceeded', 'RESOURCE_EXHAUSTED');
  const g = await api('POST', '/api/guide/marca/generate', { user: ANA, body: { answers: { tone: 'Cercano' } } });
  assert.equal(g.status, 429, g.text);
  assert.equal(g.json.error.details.ai_code, 'QUOTA');
  assert.equal(step((await api('GET', '/api/guide', { user: ANA })).json, 'marca').state.report, null);
});

test('crear publicaciones: borradores (nunca publicadas), con la guía confirmada en el prompt', async () => {
  await api('POST', '/api/guide/cliente/generate', { user: ANA, body: {} }).catch(() => {});
  script = () => geminiOk(REPORT);
  await api('POST', '/api/guide/cliente/generate', { user: ANA, body: {} });
  await api('POST', '/api/guide/cliente/confirm', { user: ANA });
  script = (body) => {
    const sys = body.systemInstruction.parts[0].text;
    assert.match(sys, /Cliente ideal: Familias y oficinistas de Juárez/);
    return geminiOk({ posts: [
      { platform: 'facebook', copy: 'Hoy hay tacos al pastor 🌮', hashtags: '', cta: 'Pide ya', headline: 'Tacos al pastor', subheadline: 'Hechos al momento' },
      { platform: 'instagram', copy: 'Tacos al pastor 🌮', hashtags: '#tacos #juarez', cta: 'Pide ya', headline: 'Tacos al pastor', subheadline: 'Hechos al momento' },
      { platform: 'linkedin', copy: 'no pedida', hashtags: '', cta: '', headline: '', subheadline: '' }
    ] });
  };
  const r = await api('POST', '/api/create/posts', { user: ANA, body: { platforms: ['facebook', 'instagram'], topic: 'Menú de fin de semana', details: 'Orden de 5 tacos' } });
  assert.equal(r.status, 201, r.text);
  assert.deepEqual(r.json.map((p: any) => p.platform), ['facebook', 'instagram']);
  assert.ok(r.json.every((p: any) => p.status === 'DRAFT'));

  assert.equal((await api('POST', '/api/create/posts', { user: ANA, body: { platforms: [], topic: 'x' } })).status, 400);
  assert.equal((await api('POST', '/api/create/posts', { user: ANA, body: { platforms: ['facebook'], topic: '' } })).status, 400);
});

test('ideas sugeridas', async () => {
  script = () => geminiOk({ ideas: [{ title: 'Mostrar cómo se corta el trompo', platform: 'instagram', why: 'Genera confianza' }, { title: '', platform: 'x', why: '' }] });
  const r = await api('POST', '/api/create/ideas', { user: ANA });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.ideas.length, 1);
  assert.equal(r.json.ideas[0].platform, 'instagram');
});

test('actualizar: un borrador se modifica; una aprobada pierde su aprobación; una publicada genera nueva versión', async () => {
  script = () => geminiOk({ posts: [{ platform: 'facebook', copy: 'Texto original', hashtags: '', cta: 'Pide ya', headline: 'Original', subheadline: 'Apoyo' }] });
  const [post] = (await api('POST', '/api/create/posts', { user: ANA, body: { platforms: ['facebook'], topic: 'Prueba' } })).json;

  script = (body) => {
    const sys = body.systemInstruction.parts[0].text;
    assert.match(JSON.stringify(body.contents), /Texto original/);
    assert.match(JSON.stringify(body.contents), /más corto/);
    assert.match(sys, /SOLO ese cambio/);
    return geminiOk({ copy: 'Texto corto', hashtags: '', cta: 'Pide ya', headline: 'Corto', subheadline: 'Apoyo' });
  };
  const rev = await api('POST', `/api/social/${post.id}/revise`, { user: ANA, body: { instruction: 'más corto' } });
  assert.equal(rev.status, 200, rev.text);
  assert.equal(rev.json.id, post.id);
  assert.equal(rev.json.copy, 'Texto corto');
  assert.equal(rev.json.is_new_version, false);

  assert.equal((await api('POST', `/api/social/${post.id}/submit`, { user: ANA })).status, 200);
  assert.equal((await api('POST', `/api/social/${post.id}/approve`, { user: LUIS, body: { confirm_review: true } })).status, 200);
  script = () => geminiOk({ copy: 'Texto cambiado tras aprobar', hashtags: '', cta: 'Pide ya', headline: 'Otro', subheadline: 'Apoyo' });
  const rev2 = await api('POST', `/api/social/${post.id}/revise`, { user: ANA, body: { instruction: 'cámbialo' } });
  assert.equal(rev2.json.status, 'DRAFT', 'editar invalida la aprobación');
  assert.equal(rev2.json.approved_by_email, null);

  assert.equal((await api('POST', `/api/social/${post.id}/revise`, { user: ANA, body: { instruction: '  ' } })).status, 400);
  assert.equal((await api('POST', '/api/social/9999/revise', { user: ANA, body: { instruction: 'x' } })).status, 404);

  // Publicada (modo de prueba nunca marca PUBLISHED): se fuerza el estado para probar la rama de nueva versión.
  const stored = getStore().social.find((p) => p.id === post.id)!;
  stored.status = 'PUBLISHED';
  const rev3 = await api('POST', `/api/social/${post.id}/revise`, { user: ANA, body: { instruction: 'versión nueva' } });
  assert.equal(rev3.status, 200, rev3.text);
  assert.notEqual(rev3.json.id, post.id);
  assert.equal(rev3.json.status, 'DRAFT');
  assert.equal(rev3.json.is_new_version, true);
  assert.equal(stored.copy, 'Texto cambiado tras aprobar', 'la publicada no se toca');
});

test('el chat usa la guía confirmada', async () => {
  script = (body) => {
    const sys = body.systemInstruction.parts[0].text;
    assert.match(sys, /GUÍA CONFIRMADA POR LA PERSONA/);
    assert.match(sys, /Cliente ideal: Familias y oficinistas de Juárez/);
    return geminiOk({ reply: 'Listo.', profile_updates: {}, action: { type: 'none', site_brief: '', site_id: 0, posts: [] } });
  };
  const r = await api('POST', '/api/chat', { user: ANA, body: { message: 'hola' } });
  assert.equal(r.status, 201, r.text);
});

test('IA automática: sin información pide completar «Empezar»; luego crea borradores programados y los renueva', async () => {
  const NEW = 'nuevo@merkatics.com';
  const none = await api('POST', '/api/content/auto-create', { user: NEW, body: {} });
  assert.equal(none.status, 409);
  assert.equal(none.json.error?.code ?? none.json.code, 'NEEDS_INFO');
  assert.equal((await api('POST', '/api/content/auto-create', {})).status, 401);

  // Ana ya tiene pasos confirmados (pruebas anteriores)
  script = (body) => {
    assert.match(body.systemInstruction.parts[0].text, /control total/);
    return geminiOk({ posts: [
      { platform: 'facebook', copy: 'Auto uno 🌮', hashtags: '', cta: 'Pide ya', headline: 'Uno', subheadline: 'a', day_offset: 2 },
      { platform: 'instagram', copy: 'Auto dos 🌮', hashtags: '#a', cta: 'Pide ya', headline: 'Dos', subheadline: 'b', day_offset: 400 },
      { platform: 'linkedin', copy: 'no permitido', hashtags: '', cta: '', headline: '', subheadline: '', day_offset: 1 }
    ] });
  };
  const c = await api('POST', '/api/content/auto-create', { user: ANA, body: { count: 3 } });
  assert.equal(c.status, 201, c.text);
  assert.deepEqual(c.json.map((p: any) => p.platform), ['facebook', 'instagram']);
  assert.ok(c.json.every((p: any) => p.status === 'DRAFT' && p.scheduled_at));
  const in30 = Date.now() + 31 * 86400_000;
  assert.ok(c.json.every((p: any) => new Date(p.scheduled_at).getTime() < in30), 'la fecha se limita a 30 días');

  script = (body) => {
    assert.match(body.contents[0].parts[0].text, /Auto uno/);
    return geminiOk({ posts: [{ n: 1, copy: 'Renovada 🌮', hashtags: '', cta: 'Pide ya', headline: 'Nueva', subheadline: 'x' }] });
  };
  const u = await api('POST', '/api/content/auto-update', { user: ANA });
  assert.equal(u.status, 200, u.text);
  assert.ok(u.json.posts.length >= 1 || u.json.created.length >= 1);
  assert.ok([...u.json.posts, ...u.json.created].every((p: any) => p.status === 'DRAFT'), 'nunca se publica solo');
});
