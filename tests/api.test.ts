import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { geminiError, geminiOk, SAMPLE_SITE, startMockGemini } from './helpers.ts';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'myos-test-'));
process.env.AUTH_MODE = 'dev';
process.env.DATA_FILE = path.join(tmp, 'db.json');
process.env.SEED_DEMO_DATA = 'false';
process.env.GEMINI_API_KEY = 'test-key-1234567890abcdef';
process.env.AI_REQUEST_TIMEOUT_MS = '3000';
delete process.env.APPROVER_EMAILS;
delete process.env.MAKE_WEBHOOK_URL;
delete process.env.META_PAGE_ACCESS_TOKEN;

const { createApp } = await import('../server/app.ts');
const { getStore, resetStore, Store } = await import('../server/store.ts');

let geminiScript: (n: number) => { status: number; body: any } = () => geminiOk(SAMPLE_SITE);
const gemini = await startMockGemini((_r, n) => geminiScript(n));
process.env.GEMINI_BASE_URL = gemini.url;

let server: import('http').Server;
let base = '';
const servers: import('http').Server[] = [];

async function listen(app: any) {
  const s = await new Promise<import('http').Server>((resolve) => {
    const x = app.listen(0, '127.0.0.1', () => resolve(x));
  });
  servers.push(s);
  return `http://127.0.0.1:${(s.address() as AddressInfo).port}`;
}

before(async () => {
  process.env.RATE_LIMIT_SCALE = '1000';
  base = await listen(createApp());
  delete process.env.RATE_LIMIT_SCALE;
});
after(async () => {
  for (const s of servers) await new Promise((r) => s.close(r));
  await gemini.close();
  getStore().flush();
  fs.rmSync(tmp, { recursive: true, force: true });
});

const ANA = 'ana@merkatics.com';
const LUIS = 'luis@merkatics.com';

async function api(method: string, p: string, opts: { user?: string; body?: any; base?: string } = {}) {
  const res = await fetch((opts.base || base) + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(opts.user ? { 'x-dev-user': opts.user } : {}) },
    body: opts.body !== undefined && method !== 'GET' ? JSON.stringify(opts.body) : undefined
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html */
  }
  return { status: res.status, json, text, headers: res.headers };
}

const BRIEF = 'Taquería de tacos al pastor en Ciudad Juárez con servicio a domicilio';
async function generate(user = ANA, extra: any = {}) {
  const r = await api('POST', '/api/generate', { user, body: { brief: BRIEF, ...extra } });
  assert.equal(r.status, 201, r.text);
  return r.json;
}

test('health es público y reporta el estado real de IA, auth y publicación', async () => {
  const r = await api('GET', '/api/health');
  assert.equal(r.status, 200);
  assert.equal(r.json.ai.configured, true);
  assert.deepEqual(r.json.ai.models, ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite']);
  assert.equal(r.json.auth.mode, 'dev');
  assert.equal(r.json.social.facebook, 'dry-run');
  assert.ok(!JSON.stringify(r.json).includes('test-key-1234567890abcdef'), 'nunca debe exponer la llave');
});

test('sin sesión: generar, listar y aprobar están protegidos', async () => {
  for (const [m, p] of [['POST', '/api/generate'], ['GET', '/api/all-content'], ['POST', '/api/approve/1'], ['GET', '/api/social'], ['POST', '/api/social/1/publish']] as const) {
    const r = await api(m, p, { body: {} });
    assert.equal(r.status, 401, `${m} ${p}`);
    assert.equal(r.json.error.code, 'NO_TOKEN');
  }
});

test('generar: nace PENDIENTE, con origen gemini, auditado y NO público', async () => {
  const g = await generate();
  assert.equal(g.status, 'PENDING');
  assert.equal(g.ai.source, 'gemini');
  assert.equal(g.record.created_by, `ana <${ANA}>`);
  assert.equal(g.record.history[0].action, 'ai_generate');
  assert.ok(g.record.content.full_html.includes('Taquería Don Pastor'));
  assert.ok(!g.record.content.full_html.includes('cdn.tailwindcss.com'), 'ya no depende del CDN de Tailwind');
  assert.equal((await api('GET', `/site/${g.id}`)).status, 404, 'un sitio pendiente no se sirve públicamente');
  assert.equal((await api('GET', `/preview/${g.id}`)).status, 404);
});

test('si Gemini falla y NO se permite respaldo: error claro con pista, y no se crea ningún registro', async () => {
  const before = getStore().contents.length;
  geminiScript = () => geminiError(429, 'quota', 'RESOURCE_EXHAUSTED');
  try {
    const r = await api('POST', '/api/generate', { user: ANA, body: { brief: BRIEF } });
    assert.equal(r.status, 429);
    assert.equal(r.json.error.code, 'AI_FAILED');
    assert.equal(r.json.error.details.ai_code, 'QUOTA');
    assert.match(r.json.error.details.hint, /cuota/i);
    assert.equal(r.json.error.details.can_fallback, true);
    assert.equal(getStore().contents.length, before);
  } finally {
    geminiScript = () => geminiOk(SAMPLE_SITE);
  }
});

test('respaldo explícito: se marca como "fallback" y avisa en review_notes; aprobarlo exige reconocerlo', async () => {
  geminiScript = () => geminiError(400, 'API key not valid. Please pass a valid API key.', 'INVALID_ARGUMENT');
  let g;
  try {
    const r = await api('POST', '/api/generate', { user: ANA, body: { brief: 'Cafetería de especialidad', allowFallback: true } });
    assert.equal(r.status, 201, r.text);
    g = r.json;
  } finally {
    geminiScript = () => geminiOk(SAMPLE_SITE);
  }
  assert.equal(g.ai.source, 'fallback');
  assert.equal(g.ai.error.code, 'INVALID_API_KEY');
  assert.match(g.record.content.review_notes[0], /NO fue generada por Gemini/);

  const noAck = await api('POST', `/api/approve/${g.id}`, { user: ANA, body: { confirm_review: true } });
  assert.equal(noAck.status, 409);
  assert.equal(noAck.json.error.code, 'FALLBACK_NOT_ACKNOWLEDGED');
  const ok = await api('POST', `/api/approve/${g.id}`, { user: ANA, body: { confirm_review: true, acknowledge_fallback: true } });
  assert.equal(ok.status, 200);
  assert.match(ok.json.record.history.at(-1).note, /origen: fallback/);
});

test('aprobar: exige confirmar la revisión y la identidad sale de la sesión, NO del body', async () => {
  const g = await generate();
  const noConfirm = await api('POST', `/api/approve/${g.id}`, { user: ANA, body: {} });
  assert.equal(noConfirm.status, 400);
  assert.equal(noConfirm.json.error.code, 'REVIEW_NOT_CONFIRMED');

  // Intento de suplantar a Carlos desde el body (así funcionaba antes):
  const r = await api('POST', `/api/approve/${g.id}`, {
    user: ANA,
    body: { confirm_review: true, approverName: 'Carlos Torres', approverEmail: 'carlos.torres@iottechnologies.mx', proposalData: { site_name: 'Otro' } }
  });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.record.status, 'APPROVED');
  assert.equal(r.json.record.approved_by_email, ANA);
  assert.equal(r.json.record.approved_by, 'ana');
  assert.equal(r.json.record.content.site_name, 'Taquería Don Pastor', 'el servidor aprueba lo guardado, no lo que mande el cliente');
  assert.match(r.json.record.approved_hash, /^[0-9a-f]{64}$/);

  // Ahora sí es público, con CSP y sin CDN
  const pub = await api('GET', `/site/${g.id}`);
  assert.equal(pub.status, 200);
  assert.match(pub.headers.get('content-security-policy') || '', /script-src 'nonce-/);
  assert.match(pub.text, /Taquería Don Pastor/);
  assert.ok(!/<meta name="robots" content="noindex/.test(pub.text));

  // No se puede aprobar dos veces ni rechazar mal
  assert.equal((await api('POST', `/api/approve/${g.id}`, { user: LUIS, body: { confirm_review: true } })).status, 409);
});

test('editar un sitio aprobado invalida la aprobación y lo retira del público', async () => {
  const g = await generate();
  await api('POST', `/api/approve/${g.id}`, { user: ANA, body: { confirm_review: true } });
  assert.equal((await api('GET', `/site/${g.id}`)).status, 200);

  const edit = await api('PUT', `/api/content/${g.id}`, { user: LUIS, body: { content: { tagline: 'Nuevo eslogan sin revisar' } } });
  assert.equal(edit.status, 200);
  assert.equal(edit.json.status, 'PENDING');
  assert.equal(edit.json.record.approved_by_email, null);
  assert.equal((await api('GET', `/site/${g.id}`)).status, 404, 'ya no debe servirse');
  const last = edit.json.record.history.at(-1);
  assert.equal(last.action, 'edit');
  assert.match(last.note, /aprobación anterior quedó sin efecto/);
});

test('una manipulación directa de los datos (sin pasar por la API) también deja de servirse', async () => {
  const g = await generate();
  await api('POST', `/api/approve/${g.id}`, { user: ANA, body: { confirm_review: true } });
  const item = getStore().contents.find((c) => c.id === g.id)!;
  item.content.tagline = 'ALTERADO EN EL ARCHIVO';
  assert.equal((await api('GET', `/site/${g.id}`)).status, 404, 'la huella ya no coincide');
});

test('rechazar registra quién y por qué', async () => {
  const g = await generate();
  const r = await api('POST', `/api/reject/${g.id}`, { user: LUIS, body: { reason: 'El teléfono no es del cliente' } });
  assert.equal(r.json.record.status, 'REJECTED');
  assert.equal(r.json.record.rejected_reason, 'El teléfono no es del cliente');
  assert.equal(r.json.record.history.at(-1).by, `luis <${LUIS}>`);
});

test('cualquier usuario puede aprobar; la lista de aprobadores solo aplica si se activa RESTRICT_APPROVERS', async () => {
  const g = await generate();
  process.env.APPROVER_EMAILS = 'jefa@merkatics.com';
  try {
    // Con la lista definida pero sin RESTRICT_APPROVERS, cualquiera aprueba (y queda registrado).
    const open = await generate();
    const okOpen = await api('POST', `/api/approve/${open.id}`, { user: ANA, body: { confirm_review: true } });
    assert.equal(okOpen.status, 200);
    assert.equal(okOpen.json.record.approved_by_email, ANA);
    process.env.RESTRICT_APPROVERS = 'true';
    const r = await api('POST', `/api/approve/${g.id}`, { user: ANA, body: { confirm_review: true } });
    assert.equal(r.status, 403);
    assert.equal(r.json.error.code, 'NOT_APPROVER');
    const ok = await api('POST', `/api/approve/${g.id}`, { user: 'JEFA@merkatics.com', body: { confirm_review: true } });
    assert.equal(ok.status, 200);
  } finally {
    delete process.env.APPROVER_EMAILS;
    delete process.env.RESTRICT_APPROVERS;
  }
});

test('contenido malicioso de la IA se escapa y las imágenes peligrosas se descartan (XSS)', async () => {
  const evil = JSON.parse(JSON.stringify(SAMPLE_SITE));
  evil.services[0].description = 'Rico <img src=x onerror=alert(1)> y "comillas" & más';
  evil.about.content = '</p><script>alert("xss")</script>';
  geminiScript = () => geminiOk(evil);
  let g;
  try {
    const r = await api('POST', '/api/generate', {
      user: ANA,
      body: { brief: BRIEF, customLogo: 'javascript:alert(1)', heroImage: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==' }
    });
    g = r.json;
  } finally {
    geminiScript = () => geminiOk(SAMPLE_SITE);
  }
  await api('POST', `/api/approve/${g.id}`, { user: ANA, body: { confirm_review: true } });
  const html = (await api('GET', `/site/${g.id}`)).text;
  assert.ok(!html.includes('<img src=x'), 'etiqueta inyectada');
  assert.ok(!html.includes('<script>alert'), 'script inyectado');
  assert.ok(!html.includes('javascript:alert'));
  assert.ok(!html.includes('data:text/html'));
  assert.equal(g.record.content.custom_logo ?? null, null);
  assert.equal(g.record.content.hero_image ?? null, null);
  const scripts = html.match(/<script[^>]*>/g) || [];
  assert.ok(scripts.every((s) => /nonce=|application\/ld\+json/.test(s)), 'todo script debe llevar nonce');
});

test('WhatsApp solo aparece si el sitio tiene teléfono, y usa ese número', async () => {
  const noPhone = await generate();
  await api('POST', `/api/approve/${noPhone.id}`, { user: ANA, body: { confirm_review: true } });
  assert.ok(!(await api('GET', `/site/${noPhone.id}`)).text.includes('wa.me'));

  const withPhone = JSON.parse(JSON.stringify(SAMPLE_SITE));
  withPhone.contact.phone = '656 123 4567';
  geminiScript = () => geminiOk(withPhone);
  let g;
  try {
    g = await generate();
  } finally {
    geminiScript = () => geminiOk(SAMPLE_SITE);
  }
  await api('POST', `/api/approve/${g.id}`, { user: ANA, body: { confirm_review: true } });
  const html = (await api('GET', `/site/${g.id}`)).text;
  assert.match(html, /wa\.me\/526561234567/);
});

test('leads: solo para sitios públicos; el honeypot se ignora; se guardan los datos', async () => {
  const g = await generate();
  const lead = { site_id: g.id, name: 'Marta', phone: '656 111 2222', email: '', message: 'Quiero 20 tacos' };
  assert.equal((await api('POST', '/api/leads', { body: lead })).status, 404, 'sitio pendiente');
  await api('POST', `/api/approve/${g.id}`, { user: ANA, body: { confirm_review: true } });
  assert.equal((await api('POST', '/api/leads', { body: { ...lead, website: 'http://spam' } })).status, 200);
  assert.equal(getStore().leads.length, 0, 'honeypot: no se guarda');
  assert.equal((await api('POST', '/api/leads', { body: lead })).status, 201);
  assert.equal((await api('POST', '/api/leads', { body: { ...lead, phone: '', email: '' } })).status, 400);
  const list = await api('GET', '/api/leads', { user: ANA });
  assert.equal(list.json.length, 1);
  assert.equal(list.json[0].name, 'Marta');
});

// ---------------------------------------------------------------------------------------------
// Redes sociales
// ---------------------------------------------------------------------------------------------
async function approvedPost(platform: 'facebook' | 'instagram' = 'facebook', extra: any = {}) {
  const g = await generate();
  const drafts = await api('POST', `/api/social/from-site/${g.id}`, { user: ANA });
  assert.equal(drafts.status, 201, drafts.text);
  const post = drafts.json.find((p: any) => p.platform === platform);
  if (extra.image_url) await api('PUT', `/api/social/${post.id}`, { user: ANA, body: { image_url: extra.image_url } });
  const sub = await api('POST', `/api/social/${post.id}/submit`, { user: ANA });
  assert.equal(sub.status, 200, sub.text);
  const ap = await api('POST', `/api/social/${post.id}/approve`, { user: LUIS, body: { confirm_review: true } });
  assert.equal(ap.status, 200, ap.text);
  return ap.json;
}

test('redes: la IA crea 2 borradores (Facebook e Instagram) en estado DRAFT', async () => {
  const g = await generate();
  const r = await api('POST', `/api/social/from-site/${g.id}`, { user: ANA });
  assert.deepEqual(r.json.map((p: any) => [p.platform, p.status]), [['facebook', 'DRAFT'], ['instagram', 'DRAFT']]);
  assert.match(r.json[1].hashtags, /#tacos/);
});

test('redes: NO se puede publicar un borrador ni algo pendiente (regla no negociable)', async () => {
  const g = await generate();
  const [fb] = (await api('POST', `/api/social/from-site/${g.id}`, { user: ANA })).json;
  const r1 = await api('POST', `/api/social/${fb.id}/publish`, { user: LUIS });
  assert.equal(r1.status, 409);
  assert.equal(r1.json.error.code, 'NOT_APPROVED');
  await api('POST', `/api/social/${fb.id}/submit`, { user: ANA });
  const r2 = await api('POST', `/api/social/${fb.id}/publish`, { user: LUIS });
  assert.equal(r2.json.error.code, 'NOT_APPROVED');
  assert.equal(getStore().social.find((p) => p.id === fb.id)!.status, 'PENDING_APPROVAL');
});

test('redes: Instagram exige imagen https antes de enviarse a aprobación', async () => {
  const g = await generate();
  const [, ig] = (await api('POST', `/api/social/from-site/${g.id}`, { user: ANA })).json;
  const r = await api('POST', `/api/social/${ig.id}/submit`, { user: ANA });
  assert.equal(r.status, 422);
  assert.match(r.json.error.message, /imagen/i);
  assert.equal((await api('PUT', `/api/social/${ig.id}`, { user: ANA, body: { image_url: 'http://insegura/x.jpg' } })).status, 400);
  assert.equal((await api('PUT', `/api/social/${ig.id}`, { user: ANA, body: { image_url: 'https://cdn.ejemplo.com/taco.jpg' } })).status, 200);
  assert.equal((await api('POST', `/api/social/${ig.id}/submit`, { user: ANA })).status, 200);
});

test('redes: aprobar exige confirmar revisión y registra a la persona aprobadora', async () => {
  const g = await generate();
  const [fb] = (await api('POST', `/api/social/from-site/${g.id}`, { user: ANA })).json;
  await api('POST', `/api/social/${fb.id}/submit`, { user: ANA });
  assert.equal((await api('POST', `/api/social/${fb.id}/approve`, { user: LUIS, body: {} })).json.error.code, 'REVIEW_NOT_CONFIRMED');
  const ok = await api('POST', `/api/social/${fb.id}/approve`, { user: LUIS, body: { confirm_review: true } });
  assert.equal(ok.json.status, 'APPROVED');
  assert.equal(ok.json.approved_by_email, LUIS);
  assert.deepEqual(ok.json.history.map((h: any) => h.action), ['create', 'submit', 'approve']);
});

test('redes: modo simulación (por defecto) NO publica ni marca PUBLISHED, y deja evidencia', async () => {
  const post = await approvedPost('facebook');
  const r = await api('POST', `/api/social/${post.id}/publish`, { user: LUIS });
  assert.equal(r.status, 200);
  assert.equal(r.json.status, 'APPROVED', 'sigue aprobada, nunca "publicada" sin enviar de verdad');
  assert.equal(r.json.last_dry_run.mode, 'dry-run');
  assert.match(r.json.last_dry_run.note, /NO se envió nada/);
});

test('redes: editar una publicación aprobada borra la aprobación; no se puede publicar así', async () => {
  const post = await approvedPost('facebook');
  const edit = await api('PUT', `/api/social/${post.id}`, { user: ANA, body: { copy: 'Texto distinto sin revisar' } });
  assert.equal(edit.json.status, 'DRAFT');
  assert.equal(edit.json.approved_by_email, null);
  assert.equal((await api('POST', `/api/social/${post.id}/publish`, { user: LUIS })).json.error.code, 'NOT_APPROVED');
});

test('redes: si el texto se altera por fuera de la API después de aprobar, la publicación se bloquea (huella)', async () => {
  const post = await approvedPost('facebook');
  getStore().social.find((p) => p.id === post.id)!.copy = 'TEXTO ALTERADO';
  const r = await api('POST', `/api/social/${post.id}/publish`, { user: LUIS });
  assert.equal(r.status, 409);
  assert.equal(r.json.error.code, 'CONTENT_CHANGED');
});

function startWebhook(reply: (n: number) => { status: number; body: any }) {
  const received: { headers: any; raw: string }[] = [];
  return startMockGemini(async (r, n) => {
    return reply(n);
  }).then((m) => ({ ...m, received }));
}

test('redes: modo webhook (Make/Zapier) publica, firma el cuerpo y manda quién aprobó', async () => {
  const hook = await startMockGemini(() => ({ status: 200, body: { id: 'fb_post_987' } }));
  process.env.MAKE_WEBHOOK_URL = hook.url + '/hook';
  process.env.MAKE_WEBHOOK_SECRET = 's3cret';
  try {
    const post = await approvedPost('facebook');
    const r = await api('POST', `/api/social/${post.id}/publish`, { user: LUIS });
    assert.equal(r.status, 200, r.text);
    assert.equal(r.json.status, 'PUBLISHED');
    assert.equal(r.json.publish_result.mode, 'webhook');
    assert.equal(r.json.publish_result.external_id, 'fb_post_987');

    const sent = hook.requests[0];
    const raw = JSON.stringify(sent.body);
    const expected = 'sha256=' + crypto.createHmac('sha256', 's3cret').update(raw).digest('hex');
    assert.equal(sent.headers['x-myos-signature'], expected);
    assert.equal(sent.body.platform, 'facebook');
    assert.equal(sent.body.approved_by_email, LUIS);
    assert.equal(sent.body.approved_hash, post.approved_hash);
    assert.match(sent.body.idempotency_key, /^myos-post-\d+-[0-9a-f]{12}$/);
    assert.match(sent.body.message, /Hoy hay pastor/);

    // ya publicada: no se puede publicar ni editar de nuevo
    assert.equal((await api('POST', `/api/social/${post.id}/publish`, { user: LUIS })).json.error.code, 'NOT_APPROVED');
    assert.equal((await api('PUT', `/api/social/${post.id}`, { user: ANA, body: { copy: 'x' } })).status, 409);
    assert.equal(hook.requests.length, 1, 'un solo envío');
  } finally {
    delete process.env.MAKE_WEBHOOK_URL;
    delete process.env.MAKE_WEBHOOK_SECRET;
    await hook.close();
  }
});

test('redes: si el webhook falla queda FAILED con el error, conserva la aprobación y se puede reintentar', async () => {
  const hook = await startMockGemini((_r, n) => (n === 1 ? { status: 500, body: { message: 'scenario error' } } : { status: 200, body: { id: 'ok_2' } }));
  process.env.MAKE_WEBHOOK_URL = hook.url;
  try {
    const post = await approvedPost('facebook');
    const r1 = await api('POST', `/api/social/${post.id}/publish`, { user: LUIS });
    assert.equal(r1.json.status, 'FAILED');
    assert.match(r1.json.publish_result.error, /500/);
    assert.equal(r1.json.approved_by_email, LUIS);
    const r2 = await api('POST', `/api/social/${post.id}/publish`, { user: LUIS });
    assert.equal(r2.json.status, 'PUBLISHED');
  } finally {
    delete process.env.MAKE_WEBHOOK_URL;
    await hook.close();
  }
});

test('redes: modo Graph API directo — Instagram crea el contenedor, espera y publica', async () => {
  const calls: string[] = [];
  const graph = await startMockGemini((req) => {
    calls.push(req.url.split('?')[0]);
    if (req.url.includes('/media_publish')) return { status: 200, body: { id: 'ig_media_555' } };
    if (req.url.includes('/media')) return { status: 200, body: { id: 'container_1' } };
    return { status: 200, body: { status_code: 'FINISHED' } };
  });
  process.env.META_GRAPH_BASE = graph.url;
  process.env.META_POLL_MS = '1';
  process.env.META_PAGE_ACCESS_TOKEN = 'tok';
  process.env.META_IG_USER_ID = '1784';
  try {
    const post = await approvedPost('instagram', { image_url: 'https://cdn.ejemplo.com/taco.jpg' });
    const r = await api('POST', `/api/social/${post.id}/publish`, { user: LUIS });
    assert.equal(r.json.status, 'PUBLISHED', r.text);
    assert.equal(r.json.publish_result.mode, 'graph');
    assert.equal(r.json.publish_result.external_id, 'ig_media_555');
    assert.deepEqual(calls, ['/v21.0/1784/media', '/v21.0/container_1', '/v21.0/1784/media_publish']);
    const mediaCall = graph.requests[0];
    assert.equal(mediaCall.headers['content-type'], 'application/x-www-form-urlencoded');
  } finally {
    for (const k of ['META_GRAPH_BASE', 'META_POLL_MS', 'META_PAGE_ACCESS_TOKEN', 'META_IG_USER_ID']) delete process.env[k];
    await graph.close();
  }
});

test('auditoría: la bitácora reúne sitios y publicaciones con quién, qué y cuándo', async () => {
  const r = await api('GET', '/api/audit', { user: ANA });
  assert.equal(r.status, 200);
  const actions = new Set(r.json.map((e: any) => e.action));
  for (const a of ['ai_generate', 'approve', 'edit', 'reject', 'submit', 'publish', 'publish_failed']) assert.ok(actions.has(a), `falta ${a}`);
  assert.ok(r.json.every((e: any) => e.by && e.at));
});

test('los datos sobreviven a un reinicio (archivo JSON)', async () => {
  getStore().flush();
  const reloaded = new Store(process.env.DATA_FILE!, { seed: false });
  assert.equal(reloaded.contents.length, getStore().contents.length);
  assert.equal(reloaded.social.length, getStore().social.length);
  assert.equal(reloaded.counters.content, getStore().counters.content);
});

test('límite de uso: la generación con IA se limita por usuario (protege la cuota de Gemini)', async () => {
  const fresh = await listen(createApp());
  let last = 0;
  for (let i = 0; i < 9; i++) {
    const r = await api('POST', '/api/generate', { user: 'spam@merkatics.com', body: { brief: BRIEF }, base: fresh });
    last = r.status;
  }
  assert.equal(last, 429);
});

test('validaciones de entrada: brief vacío o enorme, id inválido, JSON roto', async () => {
  assert.equal((await api('POST', '/api/generate', { user: ANA, body: { brief: '   ' } })).json.error.code, 'BRIEF_REQUIRED');
  assert.equal((await api('POST', '/api/generate', { user: ANA, body: { brief: 'x'.repeat(4001) } })).json.error.code, 'BRIEF_TOO_LONG');
  assert.equal((await api('GET', '/api/content/abc', { user: ANA })).json.error.code, 'BAD_ID');
  assert.equal((await api('GET', '/api/content/99999', { user: ANA })).status, 404);
  const broken = await fetch(base + '/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-dev-user': ANA }, body: '{roto' });
  assert.equal(broken.status, 400);
});
