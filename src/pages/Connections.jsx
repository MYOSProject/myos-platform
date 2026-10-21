import { useEffect, useState } from 'react';
import { api, errText } from '../api';
import { Alert, fmt } from '../components/ui';

const GUIDE = [
  ['Ten lista tu página', 'Necesitas una Página de Facebook (no un perfil personal). Para Instagram, la cuenta debe ser profesional (negocio o creador) y estar vinculada a esa página desde la configuración de la página.'],
  ['Crea una app en Meta', 'Entra a developers.facebook.com, crea una app de tipo «Negocio» y agrega el producto «Facebook Login para empresas» (o usa solo el Explorador de la API Graph). Mientras la app esté en modo desarrollo, solo publica en páginas donde tú tengas rol.'],
  ['Genera el token de usuario', 'En el Explorador de la API Graph (developers.facebook.com/tools/explorer) elige tu app, pide los permisos pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic e instagram_content_publish y pulsa «Generate Access Token».'],
  ['Hazlo de larga duración', 'Ese token dura solo 1 o 2 horas. Pégalo en developers.facebook.com/tools/debug/accesstoken y pulsa «Extend Access Token»: te da uno de unos 60 días. Cópialo.'],
  ['Saca el token de la página', 'Con el token largo, en el Explorador pide /me/accounts. Ahí aparece tu página con su propio «access_token»: ese token de página ya no caduca y es el que debes pegar abajo. También ahí sale el id de la página.'],
  ['Copia los IDs', 'El ID de la página sale en /me/accounts (campo id). El ID de Instagram sale con /ID_DE_TU_PAGINA?fields=instagram_business_account. Son solo números.'],
  ['Pega, prueba y activa', 'Pega los datos abajo, pulsa «Probar conexión» (no publica nada) y, si sale bien, activa la publicación real. Hasta que la actives, todo se queda en simulación.']
];

function DriveCard() {
  const [d, setD] = useState(null);
  const [folder, setFolder] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);
  useEffect(() => { api('GET', '/api/drive').then(setD).catch((e) => setErr(errText(e))); }, []);
  const run = async (name, fn, ok) => {
    setBusy(name); setErr(''); setMsg('');
    try { const r = await fn(); setD(r); if (ok) setMsg(typeof ok === 'function' ? ok(r) : ok); } catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };
  if (!d) return err ? <Alert>{err}</Alert> : null;
  return (
    <div className="card stack">
      <div className="row"><h2 className="grow">Google Drive</h2>
        {d.connected ? <span className="tag ok"><span aria-hidden="true">✓</span>Conectado</span> : <span className="tag draft"><span aria-hidden="true">◌</span>Sin conectar</span>}</div>
      <p className="muted">Deja en tu carpeta de Drive los documentos de tu negocio (en «Marca», «Sitio_Web», «Redes_Sociales» o «Calendario») y la IA los usa para escribir. Lo que ya leyó se mueve a «Procesados».</p>
      {!d.available && <Alert kind="warn">Drive aún no está disponible: falta la cuenta de servicio (DRIVE_SERVICE_ACCOUNT o FIREBASE_SERVICE_ACCOUNT en Vercel).</Alert>}
      {d.available && (
        <>
          <button className="btn secondary" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? 'Ocultar la guía' : '¿Cómo lo conecto? (paso a paso)'}</button>
          {open && (
            <ol className="howto">
              <li><b>Crea una carpeta en tu Drive</b><p>Por ejemplo «MYOS - mi negocio». MYOS creará adentro las subcarpetas que falten.</p></li>
              <li><b>Compártela con la cuenta de MYOS</b><p>Botón «Compartir» → pega este correo y dale permiso de <b>Editor</b>: <b>{d.service_account_email}</b></p></li>
              <li><b>Activa la API de Drive (una sola vez)</b><p>Tiene que ser en el proyecto <b>{d.service_account_project}</b> (el de la cuenta de servicio que usa MYOS para Drive; arriba en Google Cloud elige ese proyecto, no otro). Abre console.cloud.google.com/apis/library/drive.googleapis.com?project={d.service_account_project} y pulsa «Habilitar».</p></li>
              <li><b>Pega el enlace de la carpeta aquí</b><p>Abre la carpeta, copia el enlace de la barra del navegador y pégalo abajo.</p></li>
            </ol>
          )}
          <div className="field"><label htmlFor="df">Enlace de la carpeta de Drive</label>
            <input id="df" type="text" value={folder} onChange={(e) => setFolder(e.target.value)} placeholder={d.folder_name ? `Conectada: ${d.folder_name}` : 'https://drive.google.com/drive/folders/…'} /></div>
          <div className="row">
            <button className="btn" disabled={Boolean(busy) || !folder.trim()} onClick={() => run('c', () => api('PUT', '/api/drive', { folder }), 'Carpeta conectada y estructura creada.')}>{busy === 'c' ? 'Conectando…' : d.connected ? 'Cambiar carpeta' : 'Conectar y crear estructura'}</button>
            {d.connected && <button className="btn secondary" disabled={Boolean(busy)} onClick={() => run('s', async () => { const r = await api('POST', '/api/drive/sync'); return r; }, (r) => r.result?.note)}>{busy === 's' ? 'Leyendo…' : 'Sincronizar ahora'}</button>}
            {d.connected && <button className="btn link" disabled={Boolean(busy)} onClick={() => { if (window.confirm('¿Desconectar Drive de este proyecto?')) run('d', () => api('DELETE', '/api/drive'), 'Drive desconectado.'); }}>Desconectar</button>}
          </div>
          {d.connected && <p className="muted">Carpeta: {d.folder_name}{d.last_sync_at ? ` · última lectura ${fmt(d.last_sync_at)} · ${d.last_sync_note || ''}` : ' · aún no se ha leído nada.'}</p>}
          {d.notes?.length > 0 && <ul className="stats" style={{ gridTemplateColumns: '1fr' }}>{d.notes.slice(0, 8).map((n) => <li key={n.file_id}><b>{n.folder}</b> / {n.name}</li>)}</ul>}
        </>
      )}
      {msg && <Alert kind="ok">{msg}</Alert>}
      <Alert>{err}</Alert>
    </div>
  );
}

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

      <DriveCard />
    </div>
  );
}
