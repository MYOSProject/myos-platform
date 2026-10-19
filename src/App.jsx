import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { api, setDevUser, getDevUser, fileToSmallDataUrl } from './api';

const STATUS = { PENDING: 'Pendiente', APPROVED: 'Aprobado', REJECTED: 'Rechazado', PUBLISHED: 'Publicado', DRAFT: 'Borrador', PENDING_APPROVAL: 'Por aprobar', FAILED: 'Falló' };
const Tag = ({ s }) => <span className={`mk-tag ${s}`}>{STATUS[s] || s}</span>;
const fmt = (d) => (d ? new Date(d).toLocaleString('es-MX') : '');
const errText = (e) => (e?.details?.hint ? `${e.message} — ${e.details.hint}` : e?.message || String(e));

function Alert({ kind = 'err', children }) {
  return children ? <div className={`mk-alert ${kind}`}>{children}</div> : null;
}

// ------------------------------------------------------------------ Login
function Login({ health, onDev, authError }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const run = async (fn) => { setErr(''); try { await fn(); } catch (e) { setErr(e.message); } };
  return (
    <div className="mk-login mk-card">
      <img src="/logo-navy.png" alt="Merkatics" />
      <h1>MYOS · Cerebro Digital</h1>
      <p className="mk-sub">Nada se publica sin aprobación humana registrada.</p>
      {health?.auth?.mode === 'dev' && (
        <>
          <Alert kind="warn">Modo desarrollo: la sesión es solo un correo de prueba (no usar en producción).</Alert>
          <div className="mk-field"><label>Correo de prueba</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" /></div>
          <button className="mk-btn" disabled={!email.includes('@')} onClick={() => onDev(email)}>Entrar (desarrollo)</button>
          <hr />
        </>
      )}
      <button className="mk-btn" style={{ width: '100%' }} onClick={() => run(() => signInWithPopup(auth, googleProvider))}>Entrar con Google</button>
      <p className="mk-muted">o con correo y contraseña</p>
      <div className="mk-field"><input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="mk-field"><input type="password" placeholder="Contraseña" value={pass} onChange={(e) => setPass(e.target.value)} /></div>
      <div className="mk-row">
        <button className="mk-btn sec" onClick={() => run(() => signInWithEmailAndPassword(auth, email, pass))}>Entrar</button>
        <button className="mk-btn sec" onClick={() => run(() => createUserWithEmailAndPassword(auth, email, pass))}>Crear cuenta</button>
      </div>
      <Alert>{err}</Alert>
      <Alert>{authError}</Alert>
      <p className="mk-muted">Para aprobar necesitas un correo verificado (Google lo está).</p>
    </div>
  );
}

// ------------------------------------------------------------------ Vista previa
const WIDTHS = { Móvil: 390, Tableta: 768, Escritorio: '100%' };
function Preview({ html }) {
  const [w, setW] = useState('Escritorio');
  return (
    <>
      <div className="mk-row" style={{ marginBottom: 8 }}>
        {Object.keys(WIDTHS).map((k) => <button key={k} className={`mk-btn ${w === k ? '' : 'sec'}`} onClick={() => setW(k)}>{k}</button>)}
      </div>
      <div className="mk-frame-wrap">
        <iframe className="mk-frame" title="Vista previa" sandbox="allow-scripts" srcDoc={html} style={{ width: WIDTHS[w], flex: w === 'Escritorio' ? 1 : 'none', maxWidth: '100%' }} />
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Generador
function Generator({ onDone }) {
  const [brief, setBrief] = useState('');
  const [logo, setLogo] = useState(null);
  const [hero, setHero] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null);

  const go = async (allowFallback = false) => {
    setBusy(true); setErr(null); setResult(null);
    try {
      const r = await api('POST', '/api/generate', { brief, allowFallback, customLogo: logo || undefined, heroImage: hero || undefined });
      setResult(r); onDone();
    } catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const pick = (set) => async (e) => { const f = e.target.files?.[0]; if (f) set(await fileToSmallDataUrl(f)); };

  return (
    <>
      <h1>Generar sitio con IA</h1>
      <p className="mk-sub">Describe el negocio. Gemini crea el sitio y queda <b>pendiente</b> hasta que una persona lo revise y apruebe.</p>
      <div className="mk-card">
        <div className="mk-field"><label>Brief del cliente</label>
          <textarea rows={6} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Ej: Taquería de pastor en Ciudad Juárez, servicio a domicilio, abierto de 6pm a 2am…" /></div>
        <div className="mk-row">
          <div className="mk-field"><label>Logo (opcional)</label><input type="file" accept="image/*" onChange={pick(setLogo)} /></div>
          <div className="mk-field"><label>Imagen principal (opcional)</label><input type="file" accept="image/*" onChange={pick(setHero)} /></div>
        </div>
        <button className="mk-btn" disabled={busy || !brief.trim()} onClick={() => go(false)}>{busy ? 'Generando… (puede tardar 20-40 s)' : 'Generar con Gemini'}</button>
      </div>
      {err && (
        <Alert>
          <b>{err.message}</b>
          {err.details?.hint && <div>{err.details.hint}</div>}
          {err.details?.ai_code && <div className="mk-muted">Código: {err.details.ai_code}</div>}
          {err.details?.can_fallback && <div style={{ marginTop: 8 }}><button className="mk-btn sec" onClick={() => go(true)}>Usar plantilla de respaldo (NO es IA)</button></div>}
        </Alert>
      )}
      {result && (
        <div className="mk-card">
          <h2>{result.record.title} <Tag s={result.status} /></h2>
          {result.ai.source !== 'gemini' && <Alert kind="warn">Esta página NO fue generada por Gemini (origen: {result.ai.source}).</Alert>}
          <p className="mk-muted">Generado con {result.ai.model || '—'} · Revísalo en “Sitios web” para aprobarlo.</p>
          <Preview html={result.record.content.full_html} />
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------ Sitios
function Sites({ items, reload, me }) {
  const [open, setOpen] = useState(null);
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [ack, setAck] = useState(false);
  const [reason, setReason] = useState('');

  const show = async (id) => {
    setOpen(id); setConfirm(false); setAck(false); setErr('');
    try { setDetail(await api('GET', `/api/content/${id}`)); } catch (e) { setErr(errText(e)); }
  };
  const act = async (fn) => { setErr(''); try { const r = await fn(); setDetail(r.record || r); await reload(); } catch (e) { setErr(errText(e)); } };
  const needsAck = detail?.ai?.source === 'fallback' || detail?.ai?.source === 'seed';

  const makeSocial = () => act(async () => { await api('POST', `/api/social/from-site/${detail.id}`); return detail; });

  return (
    <>
      <h1>Sitios web</h1>
      <p className="mk-sub">Revisa, edita y aprueba. Solo los sitios aprobados se publican.</p>
      <div className="mk-grid">
        {items.map((s) => (
          <div key={s.id} className="mk-card" style={{ cursor: 'pointer', outline: open === s.id ? '2px solid var(--mk-coral)' : 'none' }} onClick={() => show(s.id)}>
            <div className="mk-row"><h3 style={{ margin: 0 }}>{s.title}</h3><Tag s={s.status} /></div>
            <p className="mk-muted">#{s.id} · {s.created_by} · {fmt(s.created_at)}</p>
            {s.approved_by_email && <p className="mk-muted">Aprobó: {s.approved_by} ({s.approved_by_email})</p>}
          </div>
        ))}
        {!items.length && <p className="mk-muted">Aún no hay sitios. Genera el primero.</p>}
      </div>
      {detail && (
        <div className="mk-card">
          <h2>{detail.title} <Tag s={detail.status} /></h2>
          {needsAck && <Alert kind="warn">Origen: <b>{detail.ai.source}</b> (no es Gemini).</Alert>}
          {(detail.content.review_notes || []).length > 0 && (
            <Alert kind="warn"><b>Verifica antes de aprobar:</b><ul>{detail.content.review_notes.map((n, i) => <li key={i}>{n}</li>)}</ul></Alert>
          )}
          <Preview html={detail.content.full_html} />
          <Alert>{err}</Alert>
          {detail.status === 'PENDING' && (
            <div style={{ marginTop: 12 }}>
              <label className="mk-row"><input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} /> Revisé textos, datos de contacto e imágenes y los apruebo como <b>{me.email}</b>.</label>
              {needsAck && <label className="mk-row"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /> Entiendo que no fue generado por Gemini.</label>}
              <div className="mk-row" style={{ marginTop: 8 }}>
                <button className="mk-btn ok" disabled={!confirm || (needsAck && !ack)} onClick={() => act(() => api('POST', `/api/approve/${detail.id}`, { confirm_review: true, acknowledge_fallback: ack }))}>Aprobar</button>
                <input placeholder="Motivo del rechazo" value={reason} onChange={(e) => setReason(e.target.value)} />
                <button className="mk-btn danger" onClick={() => act(() => api('POST', `/api/reject/${detail.id}`, { reason }))}>Rechazar</button>
              </div>
            </div>
          )}
          {(detail.status === 'APPROVED' || detail.status === 'PUBLISHED') && (
            <div className="mk-row" style={{ marginTop: 12 }}>
              <a className="mk-btn" href={`/site/${detail.id}`} target="_blank" rel="noreferrer">Abrir sitio público</a>
              <button className="mk-btn sec" onClick={makeSocial}>Crear borradores para Facebook e Instagram</button>
            </div>
          )}
          <h3 style={{ marginTop: 16 }}>Historial</h3>
          <ul className="mk-hist">{(detail.history || []).map((h, i) => <li key={i}>{fmt(h.at)} · {h.by} · {h.action}{h.note ? ` — ${h.note}` : ''}</li>)}</ul>
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------ Redes
function Social({ reload: reloadAll, me }) {
  const [posts, setPosts] = useState([]);
  const [err, setErr] = useState('');
  const load = useCallback(async () => { try { setPosts(await api('GET', '/api/social')); } catch (e) { setErr(errText(e)); } }, []);
  useEffect(() => { load(); }, [load]);
  const act = async (fn) => { setErr(''); try { await fn(); await load(); reloadAll?.(); } catch (e) { setErr(errText(e)); } };
  const edit = (p, patch) => act(() => api('PUT', `/api/social/${p.id}`, patch));

  return (
    <>
      <h1>Redes sociales</h1>
      <p className="mk-sub">Facebook e Instagram. Flujo: borrador → enviar a aprobación → aprobar (persona) → publicar.</p>
      <Alert>{err}</Alert>
      {posts.map((p) => (
        <div key={p.id} className="mk-card">
          <div className="mk-row"><h3 style={{ margin: 0 }}>{p.platform === 'facebook' ? 'Facebook' : 'Instagram'} · {p.site_name}</h3><Tag s={p.status} /></div>
          {p.status === 'DRAFT' ? (
            <>
              <div className="mk-field"><label>Texto</label><textarea rows={4} defaultValue={p.copy} onBlur={(e) => e.target.value !== p.copy && edit(p, { copy: e.target.value })} /></div>
              <div className="mk-field"><label>Hashtags</label><input defaultValue={p.hashtags} onBlur={(e) => e.target.value !== p.hashtags && edit(p, { hashtags: e.target.value })} /></div>
              <div className="mk-field"><label>URL de imagen (https){p.platform === 'instagram' ? ' — obligatoria' : ''}</label><input defaultValue={p.image_url} onBlur={(e) => e.target.value !== p.image_url && edit(p, { image_url: e.target.value })} /></div>
            </>
          ) : (
            <><p style={{ whiteSpace: 'pre-wrap' }}>{p.copy}</p><p className="mk-muted">{p.hashtags}</p>{p.image_url && <img src={p.image_url} alt="" style={{ maxWidth: 220, borderRadius: 8 }} />}</>
          )}
          {p.problems?.length > 0 && p.status === 'DRAFT' && <Alert kind="warn">{p.problems.join(' · ')}</Alert>}
          {p.approved_by_email && <p className="mk-muted">Aprobó: {p.approved_by_email} · {fmt(p.approved_at)}</p>}
          {p.last_dry_run && <Alert kind="warn">{p.last_dry_run.note}</Alert>}
          {p.publish_result && !p.publish_result.ok && <Alert>Falló la publicación: {p.publish_result.error}</Alert>}
          {p.publish_result?.ok && p.status === 'PUBLISHED' && <Alert kind="ok">Publicado ({p.publish_result.mode}) {p.publish_result.external_id || ''}</Alert>}
          <div className="mk-row">
            {p.status === 'DRAFT' && <button className="mk-btn" onClick={() => act(() => api('POST', `/api/social/${p.id}/submit`))}>Enviar a aprobación</button>}
            {p.status === 'PENDING_APPROVAL' && <button className="mk-btn ok" onClick={() => window.confirm(`Apruebo este texto como ${me.email}`) && act(() => api('POST', `/api/social/${p.id}/approve`, { confirm_review: true }))}>Aprobar</button>}
            {p.status === 'PENDING_APPROVAL' && <button className="mk-btn danger" onClick={() => act(() => api('POST', `/api/social/${p.id}/reject`, { reason: window.prompt('Motivo') || '' }))}>Rechazar</button>}
            {(p.status === 'APPROVED' || p.status === 'FAILED') && <button className="mk-btn" onClick={() => act(() => api('POST', `/api/social/${p.id}/publish`))}>{p.status === 'FAILED' ? 'Reintentar' : 'Publicar'}</button>}
            {p.status !== 'PUBLISHED' && <button className="mk-btn sec" onClick={() => window.confirm('¿Eliminar?') && act(() => api('DELETE', `/api/social/${p.id}`))}>Eliminar</button>}
          </div>
        </div>
      ))}
      {!posts.length && <p className="mk-muted">Sin publicaciones. Crea borradores desde un sitio aprobado.</p>}
    </>
  );
}

// ------------------------------------------------------------------ Estado
function Status({ health }) {
  const [audit, setAudit] = useState([]);
  const [test, setTest] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api('GET', '/api/audit').then(setAudit).catch(() => {}); }, []);
  const ping = async () => { setBusy(true); try { setTest(await api('POST', '/api/ai/test')); } catch (e) { setTest({ ok: false, message: errText(e) }); } finally { setBusy(false); } };
  const h = health || {};
  return (
    <>
      <h1>Estado del sistema</h1>
      <div className="mk-card">
        <h2>Gemini</h2>
        <p>{h.ai?.configured ? <>Llave configurada (<span className="mk-muted">{h.ai.key_source}</span>)</> : <b>Sin llave: define GEMINI_API_KEY en .env</b>} · Modelos: {h.ai?.models?.join(' → ')}</p>
        <button className="mk-btn" disabled={busy} onClick={ping}>{busy ? 'Probando…' : 'Probar conexión con Gemini'}</button>
        {test && <Alert kind={test.ok ? 'ok' : 'err'}>{test.ok ? `Funciona con ${test.model}` : test.message || test.error?.message}{test.hint ? ` — ${test.hint}` : ''}</Alert>}
      </div>
      <div className="mk-card">
        <h2>Sesión y aprobación</h2>
        <p>Modo: <b>{h.auth?.mode}</b> · Aprobadores: {h.auth?.policy === 'allowlist' ? `lista restringida (${h.auth.count})` : 'cualquier usuario con correo verificado (define APPROVER_EMAILS)'}</p>
        <h2>Publicación en redes</h2>
        <p>Facebook: <b>{h.social?.facebook}</b> · Instagram: <b>{h.social?.instagram}</b> {h.social?.facebook === 'dry-run' && <span className="mk-muted">(simulación: no se envía nada hasta configurar Make/Meta)</span>}</p>
        <h2>Datos</h2>
        <p className="mk-muted">{h.persistence === 'file' ? 'Datos guardados en archivo local.' : h.persistence === 'ephemeral' ? 'ATENCIÓN: almacenamiento temporal (Vercel). Los datos se pierden; hace falta una base de datos real.' : 'Datos solo en memoria.'}</p>
      </div>
      <div className="mk-card">
        <h2>Auditoría</h2>
        <ul className="mk-hist">{audit.map((e, i) => <li key={i}>{fmt(e.at)} · {e.by} · {e.action} · {e.kind} #{e.ref_id} {e.ref_title}{e.note ? ` — ${e.note}` : ''}</li>)}</ul>
      </div>
      <div className="mk-card">
        <h2>Drive</h2>
        <p className="mk-muted">La estructura de carpetas en Google Drive (fase 1 de la asignación) aún no está integrada en esta versión.</p>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ App
export default function App() {
  const [health, setHealth] = useState(null);
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState('gen');
  const [items, setItems] = useState([]);
  const [authError, setAuthError] = useState('');

  const loadMe = useCallback(async () => {
    setAuthError('');
    try { setMe((await api('GET', '/api/me')).user); } catch (e) {
      setMe(null);
      if (auth.currentUser || getDevUser()) setAuthError(`Entraste con ${auth.currentUser?.email || getDevUser()}, pero el servidor rechazó la sesión: ${e.message}${e.code ? ` (${e.code})` : ''}`);
    }
    setReady(true);
  }, []);
  const reload = useCallback(async () => { try { setItems(await api('GET', '/api/all-content')); } catch { /* sin sesión */ } }, []);

  useEffect(() => { fetch('/api/health').then((r) => r.json()).then(setHealth).catch(() => setHealth({ ok: false })); }, []);
  useEffect(() => onAuthStateChanged(auth, () => loadMe()), [loadMe]);
  useEffect(() => { if (getDevUser()) loadMe(); }, [loadMe]);
  useEffect(() => { if (me) reload(); }, [me, reload]);

  if (!ready) return <p style={{ padding: 24 }}>Cargando…</p>;
  if (!me) return <Login authError={authError} health={health} onDev={(e) => { setDevUser(e); loadMe(); }} />;

  const pending = items.filter((i) => i.status === 'PENDING').length;
  const nav = [['gen', 'Generar con IA'], ['sites', 'Sitios web'], ['social', 'Redes sociales'], ['status', 'Estado y auditoría']];
  return (
    <div className="mk-shell">
      <aside className="mk-side">
        <img className="logo" src="/logo-on-dark.png" alt="Merkatics" />
        {nav.map(([k, label]) => (
          <button key={k} className="mk-nav" aria-current={page === k ? 'page' : undefined} onClick={() => setPage(k)}>
            {label}{k === 'sites' && pending > 0 && <span className="mk-badge">{pending}</span>}
          </button>
        ))}
        <div className="mk-user">{me.name}<br />{me.email}<br />
          <button className="mk-nav" style={{ padding: '6px 0' }} onClick={() => { setDevUser(''); signOut(auth).catch(() => {}); setMe(null); }}>Salir</button>
        </div>
      </aside>
      <main className="mk-main">
        {health?.ai && !health.ai.configured && <Alert>Gemini no tiene llave: define GEMINI_API_KEY en el archivo .env y reinicia.</Alert>}
        {page === 'gen' && <Generator onDone={reload} />}
        {page === 'sites' && <Sites items={items} reload={reload} me={me} />}
        {page === 'social' && <Social reload={reload} me={me} />}
        {page === 'status' && <Status health={health} />}
      </main>
    </div>
  );
}
