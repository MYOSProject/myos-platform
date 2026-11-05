import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import type { AddressInfo } from 'node:net';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'myos-bill-'));
process.env.AUTH_MODE = 'dev';
process.env.DATA_FILE = path.join(tmp, 'db.json');
process.env.SEED_DEMO_DATA = 'false';
process.env.GEMINI_API_KEY = 'test-key-1234567890abcdef';
process.env.RATE_LIMIT_SCALE = '1000';
delete process.env.STRIPE_SECRET_KEY;
delete process.env.STRIPE_WEBHOOK_SECRET;

const { createApp } = await import('../server/app.ts');
const { getStore } = await import('../server/store.ts');
const { verifyStripeSignature } = await import('../server/billing.ts');

// Stripe simulado
const calls: Array<{ method: string; url: string; auth: string; body: string }> = [];
const smock = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    calls.push({ method: req.method || '', url: req.url || '', auth: String(req.headers.authorization || ''), body: raw });
    res.setHeader('Content-Type', 'application/json');
    const trialEnd = Math.floor(Date.now() / 1000) + 7 * 86400;
    if (req.method === 'POST' && req.url === '/v1/checkout/sessions') return res.end(JSON.stringify({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' }));
    if (req.method === 'GET' && req.url?.startsWith('/v1/checkout/sessions/cs_test_1')) return res.end(JSON.stringify({ id: 'cs_test_1', status: 'complete', subscription: 'sub_1' }));
    if (req.method === 'GET' && req.url?.startsWith('/v1/subscriptions/sub_1')) return res.end(JSON.stringify({ id: 'sub_1', customer: 'cus_1', status: 'trialing', trial_start: Math.floor(Date.now() / 1000), trial_end: trialEnd, items: { data: [{ current_period_end: trialEnd, price: { unit_amount: 100 } }] }, default_payment_method: { card: { brand: 'visa', last4: '4242' } } }));
    if (req.method === 'POST' && req.url === '/v1/billing_portal/sessions') return res.end(JSON.stringify({ url: 'https://billing.stripe.com/p/session/x' }));
    res.statusCode = 404; res.end('{}');
  });
});
await new Promise<void>((r) => smock.listen(0, '127.0.0.1', r));

let server: import('http').Server;
let base = '';
before(async () => {
  server = await new Promise((resolve) => { const x = createApp().listen(0, '127.0.0.1', () => resolve(x)); });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  await new Promise((r) => server.close(r));
  await new Promise((r) => smock.close(r));
  getStore().flush();
  fs.rmSync(tmp, { recursive: true, force: true });
});

async function api(method: string, p: string, opts: { project?: number; body?: any; raw?: string; headers?: Record<string, string>; user?: string } = {}) {
  const res = await fetch(base + p, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-dev-user': opts.user || 'ana@merkatics.com', ...(opts.project ? { 'x-project-id': String(opts.project) } : {}), ...(opts.headers || {}) },
    body: opts.raw ?? (opts.body !== undefined && method !== 'GET' ? JSON.stringify(opts.body) : undefined)
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* no json */ }
  return { status: res.status, json, text };
}
const CARD = { card: { brand: 'visa', last4: '4242' } };
const sign = (raw: string, secret: string, t = Math.floor(Date.now() / 1000)) => `t=${t},v1=${crypto.createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex')}`;

test('firma del webhook: acepta la correcta y rechaza alteraciones, firmas viejas y secretos distintos', () => {
  const raw = Buffer.from('{"a":1}');
  const t = Math.floor(Date.now() / 1000);
  assert.equal(verifyStripeSignature(raw, sign('{"a":1}', 'whsec_x', t), 'whsec_x'), true);
  assert.equal(verifyStripeSignature(Buffer.from('{"a":2}'), sign('{"a":1}', 'whsec_x', t), 'whsec_x'), false);
  assert.equal(verifyStripeSignature(raw, sign('{"a":1}', 'otro', t), 'whsec_x'), false);
  assert.equal(verifyStripeSignature(raw, sign('{"a":1}', 'whsec_x', t - 3600), 'whsec_x'), false);
  assert.equal(verifyStripeSignature(raw, undefined, 'whsec_x'), false);
});

test('simulado: la prueba de 7 días da plan Pro, no se repite, y al día 7 se «cobra» el primer mes', async () => {
  const p = (await api('POST', '/api/projects', { body: { name: 'Sim' } })).json.project;
  const v0 = (await api('GET', '/api/billing', { project: p.id })).json;
  assert.equal(v0.status, 'none');
  assert.equal(v0.mode, 'simulated');
  assert.equal(v0.price_cents, 100);
  assert.equal(v0.plan, 'free');

  const r = await api('POST', '/api/billing/checkout', { project: p.id, body: CARD });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.simulated, true);
  assert.equal(r.json.billing.status, 'trialing');
  assert.equal(r.json.billing.trial_days_left, 7);
  assert.equal(r.json.billing.plan, 'pro');
  assert.equal((await api('POST', '/api/billing/checkout', { project: p.id, body: CARD })).status, 409, 'no se activa dos veces');

  const list = (await api('GET', '/api/projects')).json.projects.find((x: any) => x.id === p.id);
  assert.equal(list.plan, 'pro');
  assert.equal(list.billing.status, 'trialing');

  // pasan 7 días
  const proj = getStore().projects.find((x) => x.id === p.id)!;
  proj.billing!.trial_ends_at = new Date(Date.now() - 1000).toISOString();
  const v1 = (await api('GET', '/api/billing', { project: p.id })).json;
  assert.equal(v1.status, 'active');
  assert.ok(v1.charged_at);
  assert.ok(v1.history.some((h: any) => /Cargo simulado/.test(h.event)));
});

test('simulado: cancelar durante la prueba no cobra y la prueba no se puede reiniciar', async () => {
  const p = (await api('POST', '/api/projects', { body: { name: 'Sim2' } })).json.project;
  await api('POST', '/api/billing/checkout', { project: p.id, body: CARD });
  const c = await api('POST', '/api/billing/cancel', { project: p.id });
  assert.equal(c.json.status, 'canceled');
  assert.equal(c.json.charged_at, null);
  assert.equal((await api('POST', '/api/billing/checkout', { project: p.id, body: CARD })).status, 409);
});

test('el cobro es por proyecto y de su dueño: otra cuenta no puede verlo', async () => {
  const p = (await api('POST', '/api/projects', { body: { name: 'Privado' } })).json.project;
  const r = await api('GET', '/api/billing', { project: p.id, user: 'otro@example.com' });
  assert.equal(r.status, 404);
});

test('Stripe: crea Checkout con 7 días de prueba y US$1, sincroniza el estado y abre el portal', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  process.env.STRIPE_API_BASE = `http://127.0.0.1:${(smock.address() as AddressInfo).port}`;
  try {
    const p = (await api('POST', '/api/projects', { body: { name: 'Real' } })).json.project;
    const r = await api('POST', '/api/billing/checkout', { project: p.id });
    assert.equal(r.status, 200, r.text);
    assert.equal(r.json.simulated, false);
    assert.match(r.json.url, /^https:\/\/checkout\.stripe\.com\//);
    const sent = calls.find((c) => c.url === '/v1/checkout/sessions' && c.method === 'POST')!;
    assert.equal(sent.auth, 'Bearer sk_test_123');
    const q = new URLSearchParams(sent.body);
    assert.equal(q.get('mode'), 'subscription');
    assert.equal(q.get('subscription_data[trial_period_days]'), '7');
    assert.equal(q.get('line_items[0][price_data][unit_amount]'), '100');
    assert.equal(q.get('line_items[0][price_data][recurring][interval]'), 'month');
    assert.equal(q.get('payment_method_collection'), 'always');
    assert.ok(!sent.body.includes('4242'), 'MYOS no maneja números de tarjeta');

    // al volver de Stripe, la consulta sincroniza
    const v = (await api('GET', '/api/billing', { project: p.id })).json;
    assert.equal(v.status, 'trialing');
    assert.equal(v.plan, 'pro');
    assert.deepEqual(v.card, { brand: 'visa', last4: '4242' });
    assert.equal(v.trial_days_left, 7);

    const portal = await api('POST', '/api/billing/portal', { project: p.id });
    assert.match(portal.json.url, /billing\.stripe\.com/);
  } finally { delete process.env.STRIPE_SECRET_KEY; delete process.env.STRIPE_API_BASE; }
});

test('webhook: sin firma válida se rechaza; con firma válida actualiza el proyecto (cobro fallido → sin Pro)', async () => {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_prueba';
  try {
    const p = (await api('POST', '/api/projects', { body: { name: 'Hook' } })).json.project;
    const proj = getStore().projects.find((x) => x.id === p.id)!;
    proj.billing = { mode: 'stripe', status: 'trialing', price_cents: 100, subscription_id: 'sub_h', customer_id: 'cus_h', trial_ends_at: new Date(Date.now() + 86400000).toISOString() };
    const ev = JSON.stringify({ type: 'customer.subscription.updated', data: { object: { id: 'sub_h', customer: 'cus_h', status: 'past_due', metadata: { project_id: String(p.id) }, items: { data: [{ price: { unit_amount: 100 } }] } } } });
    const bad = await api('POST', '/api/billing/webhook', { raw: ev, headers: { 'stripe-signature': sign(ev, 'otro') } });
    assert.equal(bad.status, 400);
    assert.equal(proj.billing.status, 'trialing');
    const ok = await api('POST', '/api/billing/webhook', { raw: ev, headers: { 'stripe-signature': sign(ev, 'whsec_prueba') } });
    assert.equal(ok.status, 200, ok.text);
    assert.equal(proj.billing.status, 'past_due');
    assert.equal((await api('GET', '/api/projects')).json.projects.find((x: any) => x.id === p.id).plan, 'free');
    const paid = JSON.stringify({ type: 'invoice.paid', data: { object: { subscription: 'sub_h', customer: 'cus_h', amount_paid: 100 } } });
    await api('POST', '/api/billing/webhook', { raw: paid, headers: { 'stripe-signature': sign(paid, 'whsec_prueba') } });
    assert.equal(proj.billing.status, 'active');
  } finally { delete process.env.STRIPE_WEBHOOK_SECRET; }
});

test('simulado: sin tarjeta no inicia; solo se guardan marca y últimos 4; el plan «a mano» no existe fuera de desarrollo', async () => {
  const p = (await api('POST', '/api/projects', { body: { name: 'Tarjeta' } })).json.project;
  assert.equal((await api('POST', '/api/billing/checkout', { project: p.id })).status, 400);
  assert.equal((await api('POST', '/api/billing/checkout', { project: p.id, body: { card: { brand: 'visa', last4: '4242424242424242' } } })).status, 400, 'no acepta el número completo');
  const ok = await api('POST', '/api/billing/checkout', { project: p.id, body: { card: { brand: 'visa', last4: '4242', number: '4242424242424242', cvc: '123' } } });
  assert.equal(ok.status, 200, ok.text);
  assert.deepEqual(ok.json.billing.card, { brand: 'visa', last4: '4242' });
  assert.ok(!JSON.stringify(getStore().projects.find((x) => x.id === p.id)).includes('4242424242424242'), 'el número completo no se guarda');

  const { effectivePlan } = await import('../server/billing.ts');
  const mp = (await api('POST', '/api/projects', { body: { name: 'Manual' } })).json.project;
  const proj = getStore().projects.find((x) => x.id === mp.id)!;
  proj.plan = 'pro';
  assert.equal(effectivePlan(proj), 'pro', 'en desarrollo sirve para probar');
  const prev = process.env.AUTH_MODE;
  delete process.env.AUTH_MODE;
  try { assert.equal(effectivePlan(proj), 'free', 'en producción un «pro» manual no vale'); } finally { process.env.AUTH_MODE = prev; }
});
