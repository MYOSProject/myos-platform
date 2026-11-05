import { useEffect, useMemo, useState } from 'react';
import { api, errText } from '../api';
import { Alert, fmt } from '../components/ui';

const day = (d) => (d ? new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
const digits = (s) => String(s || '').replace(/\D/g, '');
const brandOf = (n) => (/^4/.test(n) ? 'visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'mastercard' : /^3[47]/.test(n) ? 'amex' : /^6(011|5)/.test(n) ? 'discover' : 'otra');
const BRAND_NAME = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express', discover: 'Discover', otra: 'Tarjeta' };
const luhn = (n) => { let sum = 0; let alt = false; for (let i = n.length - 1; i >= 0; i--) { let d = Number(n[i]); if (alt) { d *= 2; if (d > 9) d -= 9; } sum += d; alt = !alt; } return n.length >= 13 && sum % 10 === 0; };
const groupNumber = (n) => (/^3[47]/.test(n) ? [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)] : n.match(/.{1,4}/g) || []).filter(Boolean).join(' ');
const maskExp = (s) => { const d = digits(s).slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

function validate(f) {
  const n = digits(f.number); const e = {};
  if (f.name.trim().length < 3) e.name = 'Escribe el nombre como aparece en la tarjeta.';
  if (!luhn(n)) e.number = 'El número de tarjeta no es válido. Revísalo.';
  const m = /^(\d{2})\/(\d{2})$/.exec(f.exp);
  const mm = m ? Number(m[1]) : 0; const yy = m ? 2000 + Number(m[2]) : 0;
  const now = new Date();
  if (!m || mm < 1 || mm > 12 || yy < now.getFullYear() || (yy === now.getFullYear() && mm < now.getMonth() + 1)) e.exp = 'Fecha de vencimiento no válida (MM/AA).';
  if (!new RegExp(`^\\d{${brandOf(n) === 'amex' ? 4 : 3}}$`).test(f.cvc)) e.cvc = brandOf(n) === 'amex' ? 'El código tiene 4 dígitos.' : 'El código tiene 3 dígitos.';
  if (!f.ok) e.ok = 'Marca la casilla para continuar.';
  return e;
}

export default function Plan({ onChanged }) {
  const [v, setV] = useState(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [step, setStep] = useState('plan'); // plan → checkout
  const [f, setF] = useState({ name: '', number: '', exp: '', cvc: '', ok: false });
  const [errs, setErrs] = useState({});
  const load = async () => { try { setV(await api('GET', '/api/billing')); } catch (e) { setErr(errText(e)); } };
  useEffect(() => { load(); }, []); // eslint-disable-line
  const run = async (key, fn) => { setBusy(key); setErr(''); try { await fn(); await load(); await onChanged?.(); } catch (e) { setErr(errText(e)); } finally { setBusy(''); } };
  const endDate = useMemo(() => day(new Date(Date.now() + (v?.trial_days || 7) * 86_400_000)), [v?.trial_days]);
  const set = (k) => (e) => { setErrs((x) => ({ ...x, [k]: undefined })); setF((x) => ({ ...x, [k]: k === 'ok' ? e.target.checked : k === 'number' ? groupNumber(digits(e.target.value).slice(0, 19)) : k === 'exp' ? maskExp(e.target.value) : k === 'cvc' ? digits(e.target.value).slice(0, 4)   : e.target.value })); };

  const pay = (e) => {
    e.preventDefault();
    const bad = validate(f); setErrs(bad);
    if (Object.keys(bad).length) return;
    const n = digits(f.number);
    // Solo viajan la marca y los últimos 4 dígitos. El número completo y el código nunca se envían ni se guardan.
    run('pay', async () => { await api('POST', '/api/billing/checkout', { card: { brand: brandOf(n), last4: n.slice(-4) } }); setF({ name: '', number: '', exp: '', cvc: '', ok: false }); setStep('plan'); });
  };
  const stripeGo = () => run('pay', async () => { const r = await api('POST', '/api/billing/checkout'); if (r.url) window.location.assign(r.url); });
  const manage = () => run('manage', async () => { const r = await api('POST', '/api/billing/portal'); window.location.assign(r.url); });
  const cancel = () => { if (window.confirm('¿Cancelar? Si todavía estás en la prueba, no se te cobrará nada.')) run('cancel', () => api('POST', '/api/billing/cancel')); };

  if (!v) return <div className="stack"><h1>Plan y pago</h1><Alert>{err}</Alert>{!err && <p className="muted">Cargando…</p>}</div>;
  const st = v.status; const sim = v.mode === 'simulated';
  const canBuy = st === 'none' || (st === 'canceled' && (!v.trial_used || !sim));
  const n = digits(f.number); const brand = brandOf(n);
  const tag = st === 'trialing' ? <span className="tag ok"><span aria-hidden="true">★</span>Prueba gratis · {v.trial_days_left} {v.trial_days_left === 1 ? 'día' : 'días'}</span>
    : st === 'active' ? <span className="tag ok"><span aria-hidden="true">★</span>Plan Pro activo</span>
    : st === 'past_due' ? <span className="tag err"><span aria-hidden="true">!</span>Falló el cobro</span>
    : v.plan === 'pro' ? <span className="tag ok"><span aria-hidden="true">★</span>Plan Pro</span> : <span className="tag draft"><span aria-hidden="true">◌</span>Plan Gratis</span>;

  return (
    <div className="stack">
      <div className="row"><div className="grow"><h1>Plan y pago</h1><p className="sub">MYOSAPP es gratis. El plan Pro quita las marcas de agua y es de pago: pruébalo {v.trial_days} días sin costo.</p></div>{tag}</div>
      {sim && <Alert kind="info">Pago de demostración: la pantalla funciona como la real, pero no se cobra nada y tu número de tarjeta no se envía ni se guarda. Puedes usar la tarjeta de prueba 4242 4242 4242 4242, cualquier fecha futura y cualquier código.</Alert>}

      {step === 'plan' && (
        <div className="plans">
          <div className={`plan-box${v.plan !== 'pro' ? ' current' : ''}`}>
            <h2>Gratis</h2>
            <p className="price">US$0<small> / siempre</small></p>
            <ul className="howto"><li>Sitios web y contenido con IA</li><li>Publicaciones en Facebook, Instagram, LinkedIn y X</li><li>Calendario y videos cortos</li><li>Marca de agua de MYOSAPP en imágenes y videos</li></ul>
            {v.plan !== 'pro' && <span className="tag draft">Tu plan actual</span>}
          </div>
          <div className={`plan-box pro${v.plan === 'pro' ? ' current' : ''}`}>
            <h2>Pro</h2>
            <p className="price">{v.price_text}<small> / mes</small></p>
            <ul className="howto"><li>Todo lo del plan Gratis</li><li><b>Sin ninguna marca de agua</b> en imágenes ni videos</li><li>{v.trial_days} días de prueba gratis al empezar</li><li>Cancelas cuando quieras</li></ul>
            {v.plan === 'pro' ? <span className="tag ok">Tu plan actual</span> : canBuy ? <button className="btn" disabled={Boolean(busy)} onClick={() => { setErr(''); setStep('checkout'); }}>Pasar a Pro · {v.trial_days} días gratis</button> : null}
          </div>
        </div>
      )}

      {step === 'checkout' && (
        <div className="checkout">
          <form className="card stack" onSubmit={pay} noValidate>
            <div className="row"><h2 className="grow">Datos de pago</h2><button type="button" className="btn link" onClick={() => { setStep('plan'); setErrs({}); }}>← Volver</button></div>
            {sim ? (
              <>
                <div className="field"><label htmlFor="cn">Nombre en la tarjeta</label><input id="cn" type="text" autoComplete="cc-name" value={f.name} onChange={set('name')} aria-invalid={Boolean(errs.name)} />{errs.name && <small className="err">{errs.name}</small>}</div>
                <div className="field"><label htmlFor="cc">Número de tarjeta {n.length > 0 && <span className="muted">· {BRAND_NAME[brand]}</span>}</label><input id="cc" type="text" inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234" value={f.number} onChange={set('number')} aria-invalid={Boolean(errs.number)} />{errs.number && <small className="err">{errs.number}</small>}</div>
                <div className="row">
                  <div className="field grow"><label htmlFor="ce">Vencimiento</label><input id="ce" type="text" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" value={f.exp} onChange={set('exp')} aria-invalid={Boolean(errs.exp)} />{errs.exp && <small className="err">{errs.exp}</small>}</div>
                  <div className="field grow"><label htmlFor="cv">Código de seguridad</label><input id="cv" type="password" inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" value={f.cvc} onChange={set('cvc')} aria-invalid={Boolean(errs.cvc)} />{errs.cvc && <small className="err">{errs.cvc}</small>}</div>
                </div>
                <label className="check"><input type="checkbox" checked={f.ok} onChange={set('ok')} />Entiendo que hoy no se cobra nada, que el {endDate} se cobrará {v.price_text} (primer mes) y que puedo cancelar antes.</label>
                {errs.ok && <small className="err">{errs.ok}</small>}
                <button className="btn big" type="submit" disabled={Boolean(busy)}>{busy === 'pay' ? 'Procesando…' : `Iniciar prueba gratis de ${v.trial_days} días`}</button>
              </>
            ) : (
              <>
                <p>Para registrar tu tarjeta te llevamos a la página de pago segura de Stripe. MYOSAPP nunca ve tu número de tarjeta.</p>
                <button className="btn big" type="button" disabled={Boolean(busy)} onClick={stripeGo}>{busy === 'pay' ? 'Abriendo…' : 'Continuar al pago seguro'}</button>
              </>
            )}
            <Alert>{err}</Alert>
          </form>
          <aside className="card stack" aria-label="Resumen del pedido">
            <h2>Resumen</h2>
            <div className="sum"><span>Plan Pro · mensual</span><b>{v.price_text}</b></div>
            <div className="sum"><span>Prueba gratis ({v.trial_days} días)</span><b>−{v.price_text}</b></div>
            <div className="sum total"><span>Total hoy</span><b>US$0.00</b></div>
            <p className="muted">El {endDate} se cobra el primer mes: <b>{v.price_text}</b>. Después, {v.price_text} cada mes hasta que canceles.</p>
          </aside>
        </div>
      )}

      {step === 'plan' && st === 'trialing' && (
        <div className="card stack">
          <h2>Tu prueba gratis</h2>
          <p>Te quedan <b>{v.trial_days_left} {v.trial_days_left === 1 ? 'día' : 'días'}</b>. {v.cancel_at_period_end ? 'Cancelaste: no se hará ningún cobro.' : <>El <b>{day(v.next_charge_at)}</b> se cobrará el primer mes: <b>{v.price_text}</b>.</>}</p>
          {v.card && <p className="muted">Tarjeta: {BRAND_NAME[v.card.brand] || 'Tarjeta'} terminada en {v.card.last4}</p>}
        </div>
      )}
      {step === 'plan' && st === 'active' && <div className="card stack"><h2>Plan Pro activo</h2><p>{v.next_charge_at ? <>Próximo cobro: <b>{day(v.next_charge_at)}</b> ({v.price_text}). </> : null}{v.card ? `Tarjeta: ${BRAND_NAME[v.card.brand] || 'Tarjeta'} ···· ${v.card.last4}.` : ''}</p></div>}
      {step === 'plan' && st === 'past_due' && <Alert kind="warn">No se pudo cobrar el mes. Actualiza tu tarjeta para recuperar el plan Pro.</Alert>}
      {step === 'plan' && st === 'canceled' && <Alert kind="info">La suscripción está cancelada{v.plan === 'pro' ? ` y sigues con Pro hasta ${day(v.next_charge_at || v.trial_ends_at)}` : ''}. {sim && v.trial_used ? 'La prueba gratis ya se usó en este proyecto.' : ''}</Alert>}
      {step === 'plan' && ['trialing', 'active', 'past_due'].includes(st) && (
        <div className="row">
          {!sim && <button className="btn secondary" disabled={Boolean(busy)} onClick={manage}>Administrar tarjeta y suscripción</button>}
          {sim && <button className="btn secondary" disabled={Boolean(busy)} onClick={cancel}>Cancelar {st === 'trialing' ? 'la prueba' : 'la suscripción'}</button>}
        </div>
      )}
      {step === 'plan' && v.history?.length > 0 && <details className="card"><summary>Historial</summary><ul className="howto">{v.history.slice().reverse().map((h, i) => <li key={i}><small className="muted">{fmt(h.at)}</small> {h.event}</li>)}</ul></details>}
      {step === 'plan' && <Alert>{err}</Alert>}
    </div>
  );
}
