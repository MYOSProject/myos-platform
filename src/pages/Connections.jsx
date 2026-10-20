import { useEffect, useState } from 'react';
import { api, errText } from '../api';
import { Alert, fmt } from '../components/ui';

const GUIDE = [
  ['Ten lista tu página', 'Necesitas una Página de Facebook (no un perfil personal). Para Instagram, la cuenta debe ser profesional (negocio o creador) y estar vinculada a esa página desde la configuración de la página.'],
  ['Crea una app en Meta', 'Entra a developers.facebook.com, crea una app de tipo «Negocio» y agrega el producto «Facebook Login para empresas» (o usa solo el Explorador de la API Graph). Mientras la app esté en modo desarrollo, solo publica en páginas donde tú tengas rol.'],
  ['Genera el token de la página', 'En el Explorador de la API Graph elige tu app, pide los permisos pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic e instagram_content_publish, genera el token de usuario y luego pide /me/accounts: ahí aparece el token de tu página. Es el que debes pegar abajo.'],
  ['Copia los IDs', 'El ID de la página sale en /me/accounts (campo id). El ID de Instagram sale con /ID_DE_TU_PAGINA?fields=instagram_business_account. Son solo números.'],
  ['Pega, prueba y activa', 'Pega los datos abajo, pulsa «Probar conexión» (no publica nada) y, si sale bien, activa la publicación real. Hasta que la actives, todo se queda en simulación.']
];

export default function Connections() {
  const [c, setC] = useState(null);
  const [form, setForm] = useState({ page_id: '', ig_user_id: '', webhook_url: '', page_token: '' });
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [help, setHelp] = useState(false);

  const apply = (d) => { setC(d); setForm({ page_id: d.page_id || '', ig_user_id: d.ig_user_id || '', webhook_url: d.webhook_url || '', page_token: '' }); };
  useEffect(() => { api('GET', '/api/connections').then(apply).catch((e) => setErr(errText(e))); }, []);

  const run = async (name, fn, okMsg) => {
    setBusy(name); setErr(''); setMsg('');
    try { const d = await fn(); apply(d); if (okMsg) setMsg(okMsg); } catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };
  const save = () => run('save', () => api('PUT', '/api/connections', form), 'Guardado. Ahora prueba la conexión.');
  const test = () => run('test', () => api('POST', '/api/connections/test'));
  const live = (v) => run('live', () => api('POST', '/api/connections/live', { live: v }), v ? 'Publicación real activada para este proyecto.' : 'Volvió a simulación: ya no se envía nada a las redes.');
  const remove = () => { if (window.confirm('¿Quitar la conexión de este proyecto?')) run('del', () => api('DELETE', '/api/connections'), 'Conexión eliminada.'); };

  if (!c) return err ? <Alert>{err}</Alert> : <p className="muted">Cargando…</p>;
  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <div>
        <h1>Conexiones</h1>
        <p className="sub">Conecta la página de Facebook y la cuenta de Instagram de este proyecto. Aun conectadas, <b>nada se publica sin que una persona lo apruebe</b>.</p>
      </div>

      <div className="card stack">
        <div className="row">
          <h2 className="grow">Estado</h2>
          {c.live ? <span className="tag ok"><span aria-hidden="true">✓</span>Publicación real activa</span> : <span className="tag draft"><span aria-hidden="true">◌</span>Simulación (no envía nada)</span>}
        </div>
        {c.tested_at && <p className="muted">Última prueba: {fmt(c.tested_at)} · {c.tested_ok ? 'salió bien' : 'falló'}{c.test_note ? ` · ${c.test_note}` : ''}</p>}
        {!c.configured && <p className="muted">Este proyecto aún no tiene conexión. Las publicaciones aprobadas quedan en simulación.</p>}
      </div>

      <div className="card stack">
        <button className="btn secondary" aria-expanded={help} onClick={() => setHelp((h) => !h)}>{help ? 'Ocultar la guía' : '¿Cómo consigo estos datos? (guía paso a paso)'}</button>
        {help && (
          <ol className="howto">
            {GUIDE.map(([t, d]) => <li key={t}><b>{t}</b><p>{d}</p></li>)}
          </ol>
        )}
      </div>

      <div className="card stack">
        <h2>Datos de conexión</h2>
        <div className="field"><label htmlFor="cp">ID de la página de Facebook</label><input id="cp" type="text" inputMode="numeric" value={form.page_id} onChange={(e) => setForm({ ...form, page_id: e.target.value })} placeholder="Solo números" /></div>
        <div className="field"><label htmlFor="ci">ID de la cuenta de Instagram (opcional)</label><input id="ci" type="text" inputMode="numeric" value={form.ig_user_id} onChange={(e) => setForm({ ...form, ig_user_id: e.target.value })} placeholder="Solo números" /></div>
        <div className="field"><label htmlFor="ct">Token de acceso de la página</label>
          <input id="ct" type="password" autoComplete="off" value={form.page_token} onChange={(e) => setForm({ ...form, page_token: e.target.value })} placeholder={c.has_token ? `Guardado (${c.token_hint}). Pega uno nuevo solo si quieres cambiarlo.` : 'Pégalo aquí'} />
          <small className="muted">Se guarda cifrado y no vuelve a mostrarse.</small></div>
        <div className="field"><label htmlFor="cw">Webhook de Make o Zapier (opcional)</label><input id="cw" type="text" value={form.webhook_url} onChange={(e) => setForm({ ...form, webhook_url: e.target.value })} placeholder="https://hook.make.com/…" />
          <small className="muted">Si lo pones, las publicaciones aprobadas se envían ahí en lugar de directo a Meta.</small></div>
        <div className="row">
          <button className="btn" disabled={Boolean(busy)} onClick={save}>{busy === 'save' ? 'Guardando…' : 'Guardar'}</button>
          <button className="btn secondary" disabled={Boolean(busy) || !c.configured} onClick={test}>{busy === 'test' ? 'Probando…' : 'Probar conexión'}</button>
          {c.configured && <button className="btn link" disabled={Boolean(busy)} onClick={remove}>Quitar conexión</button>}
        </div>
      </div>

      <div className="card stack">
        <h2>Publicación real</h2>
        <p>{c.live ? 'Las publicaciones que apruebes se enviarán a tus redes.' : 'Mientras esté apagada, al aprobar una publicación solo se guarda la evidencia de lo que se enviaría.'}</p>
        <div className="row">
          {c.live
            ? <button className="btn secondary" disabled={Boolean(busy)} onClick={() => live(false)}>Volver a simulación</button>
            : <button className="btn" disabled={Boolean(busy) || !c.tested_ok} onClick={() => live(true)}>Activar publicación real</button>}
          {!c.live && !c.tested_ok && <span className="muted">Primero guarda y prueba la conexión.</span>}
        </div>
      </div>

      {msg && <Alert kind="ok">{msg}</Alert>}
      <Alert>{err}</Alert>
    </div>
  );
}
