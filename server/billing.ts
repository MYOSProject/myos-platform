// Prueba gratis de 7 días + suscripción mensual. La tarjeta la captura Stripe Checkout (MYOS nunca ve ni guarda números de tarjeta).
// Al terminar la prueba, Stripe hace solo el cargo del primer mes. Sin STRIPE_SECRET_KEY el flujo corre en modo SIMULADO (no pide tarjeta ni cobra).
import crypto from 'crypto';
import type { AuthUser, Billing, Project } from './types.js';
import { HttpError } from './http.js';
import type { Store } from './store.js';

export const TRIAL_DAYS = 7;
const DAY = 86_400_000;
export const priceCents = (): number => {
  const n = Number.parseInt(process.env.BILLING_PRICE_CENTS || '', 10);
  return Number.isInteger(n) && n >= 50 && n <= 100_000 ? n : 100; // por ahora US$1.00
};
const stripeKey = () => process.env.STRIPE_SECRET_KEY?.trim() || '';
const stripeBase = () => (process.env.STRIPE_API_BASE?.trim() || 'https://api.stripe.com').replace(/\/+$/, '');
export const billingMode = (): 'stripe' | 'simulated' => (stripeKey() ? 'stripe' : 'simulated');
const iso = (ms: number) => new Date(ms).toISOString();
const money = (c: number) => `US$${(c / 100).toFixed(2)}`;

function log(b: Billing, event: string) {
  b.history = [...(b.history || []), { at: new Date().toISOString(), event }].slice(-20);
}

/** Simulación: al llegar el día 7 se «cobra» el primer mes (solo en modo simulado). */
function tickSimulated(p: Project): boolean {
  const b = p.billing;
  if (!b || b.mode !== 'simulated' || b.status !== 'trialing' || !b.trial_ends_at) return false;
  if (Date.now() < Date.parse(b.trial_ends_at)) return false;
  b.status = 'active'; b.charged_at = b.trial_ends_at; b.current_period_end = iso(Date.parse(b.trial_ends_at) + 30 * DAY);
  log(b, `Cargo simulado del primer mes: ${money(b.price_cents)}`);
  return true;
}

/** ¿Tiene acceso al plan Pro? Durante la prueba y mientras la suscripción esté al corriente (o cancelada pero con periodo pagado). */
export function effectivePlan(p: Project | undefined): 'free' | 'pro' {
  if (!p) return 'free';
  const b = p.billing;
  if (b) {
    if (b.status === 'trialing' || b.status === 'active') return 'pro';
    if (b.status === 'canceled' && (b.current_period_end || b.trial_ends_at) && Date.now() < Date.parse((b.current_period_end || b.trial_ends_at)!)) return 'pro';
    if (b.status === 'past_due' || b.status === 'incomplete') return p.plan === 'pro' ? 'pro' : 'free';
  }
  return p.plan === 'pro' ? 'pro' : 'free';
}

export function billingBrief(p: Project) {
  tickSimulated(p);
  const b = p.billing;
  const left = b?.status === 'trialing' && b.trial_ends_at ? Math.max(0, Math.ceil((Date.parse(b.trial_ends_at) - Date.now()) / DAY)) : null;
  return { status: b?.status || 'none', trial_days_left: left, trial_ends_at: b?.trial_ends_at || null };
}

export function billingView(p: Project) {
  tickSimulated(p);
  const b = p.billing;
  return {
    mode: billingMode(),
    configured: billingMode() === 'stripe',
    webhook_configured: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
    price_cents: priceCents(),
    price_text: money(priceCents()),
    trial_days: TRIAL_DAYS,
    trial_used: Boolean(b?.trial_started_at),
    ...billingBrief(p),
    plan: effectivePlan(p),
    next_charge_at: b?.status === 'trialing' ? b.trial_ends_at || null : b?.status === 'active' ? b.current_period_end || null : null,
    cancel_at_period_end: Boolean(b?.cancel_at_period_end),
    card: b?.card_last4 ? { brand: b.card_brand || '', last4: b.card_last4 } : null,
    charged_at: b?.charged_at || null,
    billing_mode: b?.mode || null,
    history: b?.history || []
  };
}

// --------------------------------------------------------------------------------- Stripe (REST)
function flat(obj: any, prefix = '', out: Array<[string, string]> = []): Array<[string, string]> {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') flat(v, key, out); else out.push([key, String(v)]);
  }
  return out;
}

async function stripe(method: 'GET' | 'POST', path: string, params?: any): Promise<any> {
  const key = stripeKey();
  if (!key) throw new HttpError(503, 'NO_STRIPE', 'Los cobros aún no están configurados en el servidor (falta STRIPE_SECRET_KEY).');
  const body = params ? new URLSearchParams(flat(params)).toString() : undefined;
  let res: Response;
  try {
    res = await fetch(`${stripeBase()}${path}`, { method, headers: { Authorization: `Bearer ${key}`, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, body, signal: AbortSignal.timeout(15_000) });
  } catch { throw new HttpError(502, 'STRIPE_DOWN', 'No se pudo conectar con el servicio de pagos. Intenta de nuevo en un momento.'); }
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(502, 'STRIPE_ERROR', `El servicio de pagos respondió con un error${json?.error?.message ? `: ${String(json.error.message).slice(0, 160)}` : '.'}`);
  return json;
}

function applySubscription(p: Project, sub: any) {
  const b = (p.billing ||= { mode: 'stripe', status: 'incomplete', price_cents: priceCents() });
  b.mode = 'stripe';
  b.subscription_id = String(sub.id);
  if (sub.customer) b.customer_id = String(typeof sub.customer === 'object' ? sub.customer.id : sub.customer);
  const map: Record<string, Billing['status']> = { trialing: 'trialing', active: 'active', past_due: 'past_due', unpaid: 'past_due', canceled: 'canceled', incomplete: 'incomplete', incomplete_expired: 'canceled', paused: 'canceled' };
  const prev = b.status;
  b.status = map[sub.status] || 'incomplete';
  if (sub.trial_start) b.trial_started_at ||= iso(sub.trial_start * 1000);
  if (sub.trial_end) b.trial_ends_at = iso(sub.trial_end * 1000);
  const cpe = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  if (cpe) b.current_period_end = iso(cpe * 1000);
  b.cancel_at_period_end = Boolean(sub.cancel_at_period_end);
  const card = sub.default_payment_method?.card;
  if (card) { b.card_brand = String(card.brand || ''); b.card_last4 = String(card.last4 || ''); }
  const unit = sub.items?.data?.[0]?.price?.unit_amount;
  if (Number.isInteger(unit)) b.price_cents = unit;
  if (prev !== b.status) {
    log(b, b.status === 'trialing' ? 'Prueba gratis iniciada con tarjeta registrada' : b.status === 'active' ? 'Suscripción activa (primer cargo realizado)' : b.status === 'past_due' ? 'El cobro falló: hay que actualizar la tarjeta' : b.status === 'canceled' ? 'Suscripción cancelada' : `Estado: ${b.status}`);
    if (b.status === 'active' && prev === 'trialing') b.charged_at = new Date().toISOString();
  }
}

/** Trae de Stripe el estado más reciente (sirve aunque el webhook no esté configurado todavía). */
export async function syncBilling(store: Store, p: Project): Promise<void> {
  const b = p.billing;
  if (!b || b.mode !== 'stripe' || !stripeKey()) return;
  try {
    if (!b.subscription_id && b.checkout_session_id) {
      const s = await stripe('GET', `/v1/checkout/sessions/${encodeURIComponent(b.checkout_session_id)}`);
      if (s.status === 'complete' && s.subscription) b.subscription_id = String(typeof s.subscription === 'object' ? s.subscription.id : s.subscription);
    }
    if (b.subscription_id) {
      const sub = await stripe('GET', `/v1/subscriptions/${encodeURIComponent(b.subscription_id)}?expand[]=default_payment_method`);
      applySubscription(p, sub);
    }
    p.updated_at = new Date().toISOString();
    store.save();
  } catch { /* el estado guardado sigue siendo válido; se reintenta en la siguiente consulta */ }
}

export async function startTrial(store: Store, user: AuthUser, p: Project, base: string): Promise<{ url?: string; simulated: boolean }> {
  const b = p.billing;
  if (b && (b.status === 'trialing' || b.status === 'active')) throw new HttpError(409, 'ALREADY_ACTIVE', 'Este proyecto ya tiene una prueba o suscripción activa.');
  const trialUsed = Boolean(b?.trial_started_at);
  const cents = priceCents();
  if (billingMode() === 'simulated') {
    if (trialUsed) throw new HttpError(409, 'TRIAL_USED', 'La prueba gratis de este proyecto ya se usó.');
    const now = Date.now();
    p.billing = { mode: 'simulated', status: 'trialing', price_cents: cents, trial_started_at: iso(now), trial_ends_at: iso(now + TRIAL_DAYS * DAY), card_brand: 'simulada', card_last4: '0000', history: [] };
    log(p.billing, `Prueba gratis de ${TRIAL_DAYS} días iniciada (simulación: no se pidió tarjeta)`);
    p.updated_at = new Date().toISOString(); store.save();
    return { simulated: true };
  }
  const price = process.env.STRIPE_PRICE_ID?.trim()
    ? { price: process.env.STRIPE_PRICE_ID.trim(), quantity: 1 }
    : { price_data: { currency: 'usd', unit_amount: cents, recurring: { interval: 'month' }, product_data: { name: 'MYOS Pro · plan mensual' } }, quantity: 1 };
  const session = await stripe('POST', '/v1/checkout/sessions', {
    mode: 'subscription',
    line_items: [price],
    payment_method_collection: 'always',
    subscription_data: { ...(trialUsed ? {} : { trial_period_days: TRIAL_DAYS }), metadata: { project_id: String(p.id) } },
    client_reference_id: String(p.id),
    metadata: { project_id: String(p.id) },
    customer_email: user.email,
    success_url: `${base}/?billing=success`,
    cancel_url: `${base}/?billing=cancel`
  });
  if (!session.url) throw new HttpError(502, 'STRIPE_ERROR', 'El servicio de pagos no devolvió la página para registrar la tarjeta.');
  p.billing = { ...(b || {}), mode: 'stripe', status: b?.status || 'incomplete', price_cents: cents, checkout_session_id: String(session.id) } as Billing;
  p.updated_at = new Date().toISOString(); store.save();
  return { url: String(session.url), simulated: false };
}

export async function manageUrl(p: Project, base: string): Promise<string> {
  const b = p.billing;
  if (!b?.customer_id) throw new HttpError(409, 'NO_CUSTOMER', 'Aún no hay una tarjeta registrada para administrar.');
  const s = await stripe('POST', '/v1/billing_portal/sessions', { customer: b.customer_id, return_url: `${base}/?billing=return` });
  return String(s.url);
}

/** Cancelar la prueba o la suscripción (en modo real se hace desde el portal de Stripe). */
export function cancelSimulated(store: Store, p: Project): void {
  const b = p.billing;
  if (!b || b.mode !== 'simulated') throw new HttpError(409, 'NOT_SIMULATED', 'Para cancelar usa «Administrar tarjeta y suscripción».');
  if (b.status === 'canceled') return;
  b.status = 'canceled'; b.cancel_at_period_end = true;
  log(b, b.charged_at ? 'Suscripción cancelada' : 'Prueba cancelada antes del cargo: no se cobró nada');
  p.updated_at = new Date().toISOString(); store.save();
}

// --------------------------------------------------------------------------------- Webhook
export function verifyStripeSignature(raw: Buffer, header: string | undefined, secret: string, toleranceSec = 300): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map((x) => { const i = x.indexOf('='); return [x.slice(0, i).trim(), x.slice(i + 1)]; }));
  const t = Number(parts.t);
  const sigs = header.split(',').filter((x) => x.trim().startsWith('v1=')).map((x) => x.trim().slice(3));
  if (!Number.isFinite(t) || !sigs.length || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.`).update(raw).digest('hex');
  return sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

export async function handleStripeEvent(store: Store, event: any): Promise<void> {
  const obj = event?.data?.object || {};
  const find = (): Project | undefined => {
    const pid = Number.parseInt(obj.metadata?.project_id || obj.client_reference_id || obj.subscription_details?.metadata?.project_id || '', 10);
    return store.projects.find((x) => (Number.isInteger(pid) && x.id === pid) || (obj.id && x.billing?.subscription_id === obj.id) || (obj.subscription && x.billing?.subscription_id === obj.subscription) || (obj.customer && x.billing?.customer_id === obj.customer));
  };
  const p = find();
  if (!p) return;
  const type = String(event.type || '');
  if (type === 'checkout.session.completed') {
    const b = (p.billing ||= { mode: 'stripe', status: 'incomplete', price_cents: priceCents() });
    if (obj.subscription) b.subscription_id = String(obj.subscription);
    if (obj.customer) b.customer_id = String(obj.customer);
    await syncBilling(store, p);
  } else if (type.startsWith('customer.subscription.')) {
    applySubscription(p, obj);
  } else if (type === 'invoice.payment_failed' || type === 'invoice.paid') {
    if (p.billing) {
      if (type === 'invoice.payment_failed') { p.billing.status = 'past_due'; log(p.billing, 'El cobro falló: hay que actualizar la tarjeta'); }
      else { p.billing.charged_at = new Date().toISOString(); if (p.billing.status === 'past_due') p.billing.status = 'active'; log(p.billing, `Cobro recibido: ${money(Number(obj.amount_paid) || p.billing.price_cents)}`); }
    }
  } else return;
  p.updated_at = new Date().toISOString();
  store.save();
}
