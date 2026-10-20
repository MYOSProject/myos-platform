import { useEffect, useState } from 'react';
import { api, errText } from '../api';
import { Alert, fmt } from '../components/ui';

export default function Status({ health }) {
  const [audit, setAudit] = useState([]);
  const [test, setTest] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api('GET', '/api/audit').then(setAudit).catch(() => {}); }, []);
  const ping = async () => {
    setBusy(true);
    try { setTest(await api('POST', '/api/ai/test')); } catch (e) { setTest({ ok: false, error: { message: errText(e) } }); } finally { setBusy(false); }
  };
  const h = health || {};
  const mode = (m) => (m === 'dry-run' ? 'simulación (no se envía nada)' : m === 'webhook' ? 'Make/Zapier' : m === 'graph' ? 'Meta Graph API' : m);
  return (
    <div className="stack" style={{ maxWidth: 860 }}>
      <h1>Estado del sistema</h1>
      <div className="card stack">
        <h2>Inteligencia artificial (Gemini)</h2>
        <p>{h.ai?.configured ? <>Llave configurada · modelos: {h.ai.models?.join(' → ')}</> : <b>Sin llave: define GEMINI_API_KEY.</b>}</p>
        <div><button className="btn" disabled={busy} onClick={ping}>{busy ? 'Probando…' : 'Probar conexión con Gemini'}</button></div>
        {test && <Alert kind={test.ok ? 'ok' : 'err'}>{test.ok ? `Funciona con ${test.model} (${test.ms} ms).` : `${test.error?.message || ''} ${test.error?.hint || ''}`}</Alert>}
      </div>
      <div className="card stack">
        <h2>Aprobación humana</h2>
        <p>Inicio de sesión: <b>{h.auth?.mode}</b> · Quién puede aprobar: {h.auth?.policy === 'allowlist' ? `${h.auth.count} correo(s) autorizados` : 'cualquier persona con sesión (queda registrado quién aprobó)'}</p>
      </div>
      <div className="card stack">
        <h2>Publicación en redes</h2>
        <p>Facebook: <b>{mode(h.social?.facebook)}</b><br />Instagram: <b>{mode(h.social?.instagram)}</b><br />LinkedIn: <b>{mode(h.social?.linkedin)}</b></p>
        {h.social?.facebook === 'dry-run' && <Alert kind="info">Hasta que se configure Make/Zapier (MAKE_WEBHOOK_URL) o las llaves de Meta, las publicaciones aprobadas NO se envían a las redes reales.</Alert>}
        <h2>Datos</h2>
        <p className="muted">{h.persistence === 'file' ? 'Se guardan en un archivo local.' : h.persistence === 'ephemeral' ? 'ATENCIÓN: almacenamiento temporal; los datos se pierden. Hace falta una base de datos real.' : 'Solo en memoria.'}</p>
      </div>
      <div className="card stack">
        <h2>Bitácora de auditoría</h2>
        <ul className="hist">{audit.map((e, i) => <li key={i}>{fmt(e.at)} · {e.by} · {e.action} · {e.kind} #{e.ref_id} {e.ref_title}{e.note ? ` — ${e.note}` : ''}</li>)}</ul>
        {!audit.length && <p className="muted">Aún no hay movimientos.</p>}
      </div>
      <div className="card"><h2>Google Drive</h2><p className="muted" style={{ marginTop: 8 }}>La estructura de carpetas en Drive (fase 1 de la asignación) aún no está integrada.</p></div>
    </div>
  );
}
